import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { buildPilot, writePilot } from '../integrations/story/build-pilot.mjs';
import { createStorySaveStore } from '../src/adapters/story/save-store.js';
import { createMemoryStorage } from '../src/data/json-document.js';

const fixture = new URL('./fixtures/story-pilot.html', import.meta.url);

test('Story Framework uses legacy JSON keys and can delete one slot without changing another', () => {
  const storage = createMemoryStorage();
  const legacy = { version: 1, run: { node: 'scene-2', flags: ['clue'] } };
  storage.setItem('auto', JSON.stringify(legacy));
  storage.setItem('manual-1', JSON.stringify(legacy));
  const saves = createStorySaveStore({ getStorage: () => storage });
  assert.deepEqual(saves.read('auto'), legacy);
  assert.equal(saves.read('missing'), null);
  const next = { ...legacy, run: { ...legacy.run, node: 'scene-3' } };
  saves.write('auto', next);
  assert.deepEqual(JSON.parse(storage.getItem('auto')), next);
  saves.remove('manual-1');
  assert.equal(storage.getItem('manual-1'), null);
  assert.deepEqual(saves.read('auto'), next);
});

test('a save write rejected by the data layer preserves the previous entry', () => {
  const storage = createMemoryStorage();
  const saves = createStorySaveStore({ getStorage: () => storage });
  saves.write('auto', { node: 'scene-1' });
  assert.throws(() => saves.write('auto', { node: undefined }), /JSON data/);
  assert.deepEqual(saves.read('auto'), { node: 'scene-1' });
  storage.setItem('broken', '{');
  assert.throws(() => saves.read('broken'), SyntaxError);
});

test('the pilot builder preserves the source and outputs only a new standalone version', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'fe-story-'));
  try {
    const output = join(directory, 'output.html');
    const original = await readFile(fixture, 'utf8');
    await writePilot(fixture, output);
    const built = await readFile(output, 'utf8');
    assert.equal(await readFile(fixture, 'utf8'), original);
    assert.equal(built.split('<script')[0], original.split('<script')[0]);
    assert.match(built, /data-framework-engine="story"/);
    assert.match(built, /import \{ createStorySaveStore \} from "data:text\/javascript;base64,/);
    assert.match(built, /if\(e==='TRUE'\)meta.worldAwake=true;/);
    assert.match(built, /feStorySaveStore\.remove\(key\);/);
    assert.doesNotMatch(built, /localStorage\.(getItem|setItem|removeItem)/);
    await assert.rejects(writePilot(fixture, output), { code: 'EEXIST' });
    assert.equal(await readFile(output, 'utf8'), built);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('the pilot builder rejects an unsupported or ambiguous input', async () => {
  const original = await readFile(fixture, 'utf8');
  const sources = { jsonDocument: '', adapter: '' };
  assert.throws(() => buildPilot('<html></html>', sources), /one classic script/);
  assert.throws(() => buildPilot(original.replace("e==='TRUE'", "e==='OTHER'"), sources), /true-ending/);
  assert.throws(() => buildPilot(original.replace('<script>', '<script><script>'), sources), /one classic script/);
});
