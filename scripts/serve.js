import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const contentTypes = {
  html: 'text/html; charset=utf-8',
  css: 'text/css; charset=utf-8',
  js: 'text/javascript; charset=utf-8'
};

export async function serveDemo(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' }).end();
    return;
  }
  const pathname = (req.url ?? '').split('?')[0];
  const startup = pathname === '/' || pathname === '/examples/';
  const path = startup ? '/examples/index.html' : pathname;
  const match = /^\/(?:examples|src)\/(?:[a-z0-9-]+\/)*[a-z0-9-]+\.(html|css|js)$/.exec(path);
  if (!match) {
    res.writeHead(404).end();
    return;
  }
  if (pathname === '/') {
    res.writeHead(302, { Location: '/examples/' }).end();
    return;
  }

  try {
    const bytes = await readFile(new URL('..' + path, import.meta.url));
    res.writeHead(200, { 'Content-Type': contentTypes[match[1]] });
    res.end(req.method === 'HEAD' ? undefined : bytes);
  } catch (error) {
    res.writeHead(error.code === 'ENOENT' ? 404 : 500).end();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.argv[2] ?? 8000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new RangeError('Expected a port between 1 and 65535');
  }
  createServer(serveDemo).listen(port, '127.0.0.1', () => {
    console.log(`Framework Engine demo: http://127.0.0.1:${port}/examples/`);
  });
}
