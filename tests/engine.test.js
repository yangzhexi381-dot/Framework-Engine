import assert from 'node:assert/strict';
import test from 'node:test';
import {createEngine, createMemoryStorage, deserialize, serialize} from '../src/index.js';

test('lifecycle loads dependencies once and unloads them in safe order', async () => {
  const {modules, events} = createEngine();
  const seen = [];
  modules.register({id: 'base', start: ({events}) => events.on('note', value => seen.push(value))});
  modules.register({id: 'app', requires: ['base', 'base'], async start() {
    seen.push('app:started');
    return async () => { seen.push('app:stopped'); };
  }});
  await modules.load('app');
  await modules.load('app');
  assert.equal(modules.isLoaded('base'), true);
  assert.throws(() => modules.register({id: 'base'}), /already registered/);
  await assert.rejects(modules.unload('base'), /required by app/);
  events.emit('note', 'received');
  await modules.unload('app');
  await modules.unload('base');
  await modules.unload('base');
  events.emit('note', 'after unload');
  assert.deepEqual(seen, ['app:started', 'received', 'app:stopped']);
});

test('dependency checks run before any start hooks', async () => {
  const {modules} = createEngine();
  let starts = 0;
  modules.register({id: 'base', start() { starts++; }});
  modules.register({id: 'missing', requires: ['base', 'unregistered']});
  modules.register({id: 'a', requires: ['b']});
  modules.register({id: 'b', requires: ['a']});
  await assert.rejects(modules.load('missing'), /Unregistered.*unregistered/);
  await assert.rejects(modules.load('a'), /Cyclic/);
  assert.equal(starts, 0);
});

test('failed start rolls back only modules started by that load', async () => {
  const {modules} = createEngine();
  let disposed = 0;
  modules.register({id: 'existing'});
  modules.register({id: 'new', start: () => () => { disposed++; }});
  modules.register({id: 'fails', requires: ['existing', 'new'], start() {
    throw new Error('start failed');
  }});
  await modules.load('existing');
  await assert.rejects(modules.load('fails'), /start failed/);
  assert.equal(disposed, 1);
  assert.equal(modules.isLoaded('existing'), true);
  assert.equal(modules.isLoaded('new'), false);
  assert.equal(modules.isLoaded('fails'), false);
});

test('failed rollback leaves active dependencies available for a cleanup retry', async () => {
  const {modules} = createEngine();
  let attempts = 0;
  modules.register({id: 'base'});
  modules.register({id: 'child', requires: ['base'], start: () => () => {
    if (++attempts === 1) throw new Error('temporary cleanup error');
  }});
  modules.register({id: 'fails', requires: ['child'], start() { throw new Error('start failed'); }});
  await assert.rejects(modules.load('fails'), error => {
    assert.ok(error instanceof AggregateError);
    assert.equal(error.errors.length, 2);
    return true;
  });
  assert.equal(modules.isLoaded('child'), true);
  assert.equal(modules.isLoaded('base'), true);
  await modules.unload('child');
  await modules.unload('base');
  assert.equal(modules.isLoaded('base'), false);
});

test('concurrent lifecycle operations fail cleanly and can be retried', async () => {
  const {modules} = createEngine();
  let finish;
  modules.register({id: 'slow', start: () => new Promise(resolve => { finish = resolve; })});
  const loading = modules.load('slow');
  await assert.rejects(modules.unload('slow'), /in progress/);
  await assert.rejects(modules.load('slow'), /in progress/);
  finish();
  await loading;
  await modules.unload('slow');
  assert.equal(modules.isLoaded('slow'), false);
});

test('state isolates snapshots, reports subscriber failures, and commits valid updates only', () => {
  const initialState = {nested: {count: 0}};
  const {state} = createEngine({initialState});
  initialState.nested.count = 99;
  const seen = [];
  const off = state.subscribe(snapshot => { snapshot.nested.count = 100; });
  state.subscribe((current, previous) => seen.push([current.nested.count, previous.nested.count]));
  state.subscribe(() => state.update(value => value));
  const {value, errors} = state.update(snapshot => ({nested: {count: snapshot.nested.count + 1}}));
  assert.deepEqual(seen, [[1, 0]]);
  assert.match(errors[0].message, /cannot be nested/);
  off();
  value.nested.count = 200;
  assert.equal(state.get().nested.count, 1);
  assert.throws(() => state.update(() => Infinity), /JSON value/);
  assert.equal(state.get().nested.count, 1);
});

test('events dispatch snapshots of subscriptions, isolate failures and permit disposal', () => {
  const {events} = createEngine();
  const received = [];
  const off = events.on('topic', value => received.push(value));
  events.on('topic', () => { throw new Error('listener failed'); });
  events.on('topic', value => received.push(value + 1));
  assert.equal(events.emit('topic', 2).length, 1);
  off();
  off();
  events.emit('topic', 4);
  assert.deepEqual(received, [2, 3, 5]);
  assert.deepEqual(events.emit('different'), []);
});

test('data persists raw JSON and rejects invalid writes before changing storage', () => {
  const storage = createMemoryStorage();
  const {data} = createEngine({storage});
  assert.deepEqual(data.read('notes', []), []);
  data.write('notes', ['旧记录']);
  data.update('notes', records => [...records, '新记录']);
  assert.deepEqual(createEngine({storage}).data.read('notes'), ['旧记录', '新记录']);
  assert.equal(storage.getItem('notes'), '["旧记录","新记录"]');
  assert.throws(() => data.write('notes', [undefined]), /JSON value/);
  assert.throws(() => data.update('notes', () => { throw new Error('abort'); }), /abort/);
  assert.deepEqual(data.read('notes'), ['旧记录', '新记录']);
  storage.setItem('damaged', '{');
  assert.throws(() => data.read('damaged'), SyntaxError);
});

test('serialization covers native JSON data and rejects silent lossy conversions', () => {
  assert.deepEqual(deserialize(serialize({active: false, value: [0, null, '化学']})),
    {active: false, value: [0, null, '化学']});
  assert.throws(() => serialize(new Date()), /plain JSON object/);
  assert.throws(() => serialize(new Array(1)), /Sparse arrays/);
  const circular = {};
  circular.self = circular;
  assert.throws(() => serialize(circular), /Circular/);
  assert.throws(() => deserialize('1e999'), /JSON value/);
});

test('adapter receives services and can expose domain behavior without modifying the engine', () => {
  const engine = createEngine();
  const notes = engine.connect({
    connect({data}) {
      return {
        list: () => data.read('notes', []),
        add: note => data.update('notes', notes => [...notes, note], [])
      };
    }
  });
  notes.add('A reversible model');
  assert.deepEqual(notes.list(), ['A reversible model']);
  assert.throws(() => engine.connect({}), /Framework adapter/);
});
