import assert from 'node:assert/strict';
import { test } from 'node:test';
import { serveDemo } from '../scripts/serve.js';

function request(url, method = 'GET') {
  return new Promise(resolve => {
    let metadata;
    const response = {
      writeHead(status, headers = {}) {
        metadata = { status, headers };
        return this;
      },
      end(body) {
        resolve({ ...metadata, body: body?.toString() });
      }
    };
    return serveDemo({ method, url }, response);
  });
}

test('the demo and its real ES module entry points are served with browser-compatible MIME types', async () => {
  const root = await request('/');
  assert.equal(root.headers.Location, '/examples/');
  const html = await request(root.headers.Location);
  assert.equal(html.status, 200);
  assert.match(html.headers['Content-Type'], /^text\/html/);
  assert.match(html.body, /type="module" src="\.\/demo\.js"/);
  const demo = await request('/examples/demo.js');
  assert.match(demo.headers['Content-Type'], /^text\/javascript/);
  assert.match(demo.body, /import \{ FrameworkEngine \} from '\.\.\/src\/index\.js'/);
  const engine = await request('/src/index.js');
  assert.equal(engine.status, 200);
  assert.match(engine.body, /FrameworkEngine/);
});

test('the demo server limits routes to static app resources', async () => {
  assert.equal((await request('/.git/config')).status, 404);
  assert.equal((await request('/examples/../package.json')).status, 404);
  assert.equal((await request('/examples/demo.js', 'POST')).status, 405);
  assert.equal((await request('/examples/demo.js', 'HEAD')).body, undefined);
});
