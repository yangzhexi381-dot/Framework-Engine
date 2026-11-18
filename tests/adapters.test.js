import assert from 'node:assert/strict';
import test from 'node:test';
import {createEngine, createMemoryStorage} from '../src/index.js';
import {createChemistryInquiryStore} from '../src/adapters/chemistry.js';
import {storyAdapter, storyModules} from '../examples/story/story.js';

const key = 'chemistry-framework-inquiries';

test('CF adapter round-trips the original browser key, arrays and record fields', () => {
  const storage = createMemoryStorage();
  const original = {
    id: 'inq.synthetic.1',
    user_intuition: 'What changes equilibrium?',
    context: {system: 'constant temperature'},
    literature: {items: []},
    unknownLegacyField: 42
  };
  storage.setItem(key, JSON.stringify([null, {id: 'invalid'}, original]));
  const inquiries = createChemistryInquiryStore(storage);
  assert.deepEqual(inquiries.read(), [original]);
  const next = {...original, literature: {items: [{title: 'Synthetic title'}]}};
  inquiries.write([next]);
  assert.deepEqual(JSON.parse(storage.getItem(key)), [next]);
  assert.deepEqual(createChemistryInquiryStore(storage).read(), [next]);
});

test('CF adapter tolerates unreadable legacy data and propagates write failures', () => {
  const storage = createMemoryStorage();
  const inquiries = createChemistryInquiryStore(storage);
  for (const damaged of ['{', 'null', '{"record": true}']) {
    storage.setItem(key, damaged);
    assert.deepEqual(inquiries.read(), []);
  }
  const disabled = createChemistryInquiryStore({
    getItem() { throw new Error('storage blocked'); },
    setItem() { throw new Error('storage blocked'); }
  });
  assert.deepEqual(disabled.read(), []);
  assert.throws(() => disabled.write([]), /storage blocked/);
});

test('the demo drives its actual modules through events, state and persistent data', async () => {
  const storage = createMemoryStorage();
  async function boot() {
    const engine = createEngine({storage, initialState: {scene: 0}});
    storyModules.forEach(engine.modules.register);
    await engine.modules.load('story.navigation');
    return {engine, story: engine.connect(storyAdapter)};
  }

  const first = await boot();
  assert.equal(first.story.state.get().scene, 0);
  assert.deepEqual(first.story.advance(), []);
  assert.equal(first.story.state.get().scene, 1);

  const second = await boot();
  assert.equal(second.story.state.get().scene, 1);
  second.story.advance();
  second.story.advance();
  assert.equal(second.story.state.get().scene, 2);
  second.story.reset();
  assert.equal(second.story.state.get().scene, 0);
  await second.engine.modules.unload('story.navigation');
  second.story.advance();
  assert.equal(second.story.state.get().scene, 0);
});
