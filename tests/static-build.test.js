import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm, stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('static build preserves the demo route and local module graph without publishing repository files', async () => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), 'fe-static-build-'));
  const output = path.join(temporaryRoot, 'site');
  try {
    const result = spawnSync(process.execPath, ['scripts/build-static.js', '--out-dir', output], {
      cwd: projectRoot,
      encoding: 'utf8'
    });
    assert.equal(result.status, 0, result.stderr);

    const rootPage = await readFile(path.join(output, 'index.html'), 'utf8');
    assert.ok(rootPage.includes('href="./examples/"'));
    for (const name of ['story.html', 'structure.html']) {
      assert.ok(rootPage.includes(`href="./playground/${name}"`));
      const relativePath = path.join('playground', name);
      assert.deepEqual(
        await readFile(path.join(output, relativePath)),
        await readFile(path.join(projectRoot, relativePath))
      );
    }
    assert.ok((await stat(path.join(output, 'examples/index.html'))).isFile());
    assert.ok((await stat(path.join(output, 'examples/demo.js'))).isFile());
    assert.ok((await stat(path.join(output, 'examples/style.css'))).isFile());

    // The browser resolves ./examples/ relative to the hosted root, including a project subpath.
    for (const hostedRoot of ['/', '/project/']) {
      const resolvedEntry = new URL('./examples/', `https://example.test${hostedRoot}`);
      assert.equal(resolvedEntry.pathname, `${hostedRoot}examples/`);
    }

    const demo = await readFile(path.join(output, 'examples/demo.js'), 'utf8');
    assert.match(demo, /\.\.\/src\/index\.js/);
    assert.ok((await stat(path.join(output, 'src/index.js'))).isFile());
    assert.ok((await stat(path.join(output, 'src/adapters/chemistry/demo-app.js'))).isFile());
    assert.ok((await stat(path.join(output, 'src/adapters/story/story.js'))).isFile());

    for (const forbidden of ['package.json', 'README.md', 'tests', 'integrations', '.github', 'scripts']) {
      await assert.rejects(stat(path.join(output, forbidden)));
    }
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});
