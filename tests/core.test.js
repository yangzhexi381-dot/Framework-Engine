import assert from 'node:assert/strict';
import { test } from 'node:test';
import { FrameworkEngine, createMemoryStorage, createJsonDocument } from '../src/index.js';
import { createChemistryInquiryStore } from '../src/adapters/chemistry/inquiry-store.js';

function createCounter() {
  return {
    manifest: { id: 'counter' },
    initialState: () => ({ count: 0 }),
    validateState: state => Number.isInteger(state?.count) && state.count >= 0,
    reduce(state, amount) {
      state.count += amount;
      return state;
    }
  };
}

test('module dependencies are validated before hooks and load only once in order', () => {
  const { modules } = new FrameworkEngine();
  const hooks = [];
  modules.register({
    id: 'report',
    dependencies: ['shared'],
    load: ({ dependencies }) => hooks.push(dependencies.get('shared')),
    unload: () => hooks.push('close report')
  });
  assert.throws(() => modules.load('report'), /Unknown module: shared/);
  assert.deepEqual(hooks, []);
  modules.register({ id: 'shared', load: () => 'data', unload: () => hooks.push('close shared') });
  assert.equal(modules.load('report'), 1);
  assert.equal(modules.load('report'), 1);
  assert.deepEqual(hooks, ['data']);
  assert.throws(() => modules.register({ id: 'shared', load() {} }), /already registered/);
  assert.throws(() => modules.unload('shared'), /report is loaded/);
  assert.equal(modules.unload('report'), true);
  assert.equal(modules.unload('shared'), true);
  assert.equal(modules.unload('shared'), false);
  assert.deepEqual(hooks, ['data', 'close report', 'close shared']);
});

test('dependency cycles are rejected before any hooks execute', () => {
  const { modules } = new FrameworkEngine();
  let calls = 0;
  const load = () => { calls++; };
  modules.register({ id: 'a', dependencies: ['b'], load });
  modules.register({ id: 'b', dependencies: ['a'], load });
  assert.throws(() => modules.load('a'), /a -> b -> a/);
  assert.equal(calls, 0);
});

test('failed dependent load rolls back only modules started by this call and supports retry', () => {
  const { modules } = new FrameworkEngine();
  let shouldFail = true;
  const steps = [];
  modules.register({ id: 'shared', load: () => 'shared' });
  modules.register({ id: 'temp', load: () => steps.push('load'), unload: () => steps.push('unload') });
  modules.register({
    id: 'app',
    dependencies: ['shared', 'temp'],
    load() {
      if (shouldFail) throw new Error('setup failed');
      return 'ready';
    }
  });
  modules.load('shared');
  assert.throws(() => modules.load('app'), /setup failed/);
  assert.equal(modules.isLoaded('shared'), true);
  assert.equal(modules.isLoaded('temp'), false);
  assert.equal(modules.isLoaded('app'), false);
  assert.deepEqual(steps, ['load', 'unload']);
  shouldFail = false;
  assert.equal(modules.load('app'), 'ready');
  assert.deepEqual(steps, ['load', 'unload', 'load']);
});

test('modules communicate through events and can release subscriptions on unload', () => {
  const { events, modules } = new FrameworkEngine();
  const received = [];
  modules.register({
    id: 'receiver',
    load: ({ events }) => events.subscribe('model:result', value => received.push(value)),
    unload: unsubscribe => unsubscribe()
  });
  modules.register({
    id: 'sender',
    load: ({ events }) => value => events.publish('model:result', value)
  });
  modules.load('receiver');
  const send = modules.load('sender');
  send(42);
  modules.unload('receiver');
  send(64);
  assert.deepEqual(received, [42]);
});

test('event bus delivers nested publishes in order and isolates listener failures', () => {
  const messages = [];
  const engine = new FrameworkEngine({ onEventError: error => messages.push(error.message) });
  engine.events.subscribe('one', () => {
    engine.events.publish('two', 'nested');
    throw new Error('listener failed');
  });
  const unsubscribe = engine.events.subscribe('one', value => messages.push(value));
  engine.events.subscribe('two', value => messages.push(value));
  engine.events.publish('one', 'outer');
  unsubscribe();
  engine.events.publish('one', 'ignored');
  assert.deepEqual(messages, ['listener failed', 'outer', 'nested', 'listener failed', 'nested']);
});

test('reducer mutation, rejected state and failed writes do not leak into the committed state', () => {
  const storage = createMemoryStorage();
  let writable = true;
  const engine = new FrameworkEngine({
    getStorage: () => ({
      ...storage,
      setItem(key, value) {
        if (!writable) throw new Error('quota exceeded');
        storage.setItem(key, value);
      }
    })
  });
  engine.register(createCounter());
  engine.load('counter');
  const observed = [];
  engine.events.subscribe('state:changed', value => observed.push(value.state.count));
  const result = engine.dispatch(2);
  result.state.count = 900;
  assert.throws(() => engine.dispatch(-10), /Invalid state/);
  writable = false;
  assert.throws(() => engine.dispatch(3), /quota exceeded/);
  assert.throws(() => engine.reset(), /quota exceeded/);
  assert.throws(() => engine.importData({
    format: 'framework-engine-state', version: 1, frameworkId: 'counter', state: { count: 4 }
  }), /quota exceeded/);
  assert.deepEqual(engine.state, { count: 2 });
  assert.deepEqual(observed, [2]);
  assert.equal(storage.getItem('fe-v01:counter'), '{"count":2}');
});

test('each dispatched result refers to its own persisted state when a subscriber dispatches again', () => {
  const engine = new FrameworkEngine({ storage: createMemoryStorage() });
  engine.register(createCounter());
  engine.load('counter');
  engine.events.subscribe('state:changed', ({ state }) => {
    if (state.count === 1) engine.dispatch(1);
  });
  assert.deepEqual(engine.dispatch(1).state, { count: 1 });
  assert.deepEqual(engine.state, { count: 2 });
});

test('unload, invalid saved data and the prototype storage key are compatible', () => {
  const storage = createMemoryStorage();
  storage.setItem('fe-v01:counter', '{"count":7}');
  const engine = new FrameworkEngine({ storage });
  engine.register(createCounter());
  assert.equal(engine.load('counter').state.count, 7);
  assert.equal(engine.unload(), true);
  assert.equal(engine.unload(), false);
  assert.throws(() => engine.dispatch(1), /No framework loaded/);
  storage.setItem('fe-v01:counter', 'damaged');
  assert.equal(engine.load('counter').state.count, 0);
  assert.equal(storage.getItem('fe-v01:counter'), 'damaged');
});

test('JSON documents manage isolated raw JSON and reject unsupported data before writing', () => {
  const storage = createMemoryStorage();
  const document = createJsonDocument({ getStorage: () => storage, key: 'example' });
  assert.equal(document.read(), undefined);
  const original = { nested: [true, null, 4] };
  const stored = document.replace(original);
  original.nested[0] = false;
  stored.nested[2] = 100;
  assert.deepEqual(document.read(), { nested: [true, null, 4] });
  assert.throws(() => document.replace({ price: NaN }), /Expected JSON data/);
  assert.equal(storage.getItem('example'), '{"nested":[true,null,4]}');
});

test('CF adapter preserves the legacy record array and accepts new records after malformed data', () => {
  const legacyKey = 'chemistry-framework-inquiries';
  const storage = createMemoryStorage();
  const adapter = createChemistryInquiryStore({ getStorage: () => storage });
  storage.setItem(legacyKey, '{"wrong":"shape"}');
  assert.deepEqual(adapter.read(), []);
  storage.setItem(legacyKey, 'invalid JSON');
  assert.deepEqual(adapter.read(), []);
  storage.setItem(legacyKey, '[{"id":"old","user_intuition":"原命题","extra":true},null]');
  const old = adapter.read();
  assert.deepEqual(old, [{ id: 'old', user_intuition: '原命题', extra: true }]);
  const all = [...old, { id: 'new', user_intuition: '新命题' }];
  adapter.replace(all);
  assert.deepEqual(JSON.parse(storage.getItem(legacyKey)), all);
});
