import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {extname, resolve, sep} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const port = Number(process.env.PORT ?? 8080);
const mime = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8'
};

createServer(async (request, response) => {
  if (request.method !== 'GET') {
    response.writeHead(405, {Allow: 'GET'}).end();
    return;
  }

  try {
    const url = new URL(request.url, 'http://localhost');
    if (url.pathname === '/') {
      response.writeHead(302, {Location: '/examples/story/'}).end();
      return;
    }

    const path = decodeURIComponent(url.pathname);
    const file = resolve(root, '.' + (path.endsWith('/') ? path + 'index.html' : path));
    const isDemo = file.startsWith(resolve(root, 'examples/story') + sep);
    const isSource = file.startsWith(resolve(root, 'src') + sep);
    const type = mime[extname(file)];
    if (!type || (!isDemo && !isSource)) {
      response.writeHead(404).end();
      return;
    }

    const content = await readFile(file);
    response.writeHead(200, {'Content-Type': type, 'X-Content-Type-Options': 'nosniff'}).end(content);
  } catch (error) {
    response.writeHead(error instanceof URIError ? 400 : error.code === 'ENOENT' ? 404 : 500).end();
  }
}).listen(port, '127.0.0.1', () => console.log('Framework Engine demo: http://127.0.0.1:' + port));
