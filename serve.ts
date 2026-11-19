/** Local dev server for the guide: serves app/ at its root on port 8080. */
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const appDir = join(dirname(fileURLToPath(import.meta.url)), 'app');
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
};

const server = createServer((request, response) => {
  const path = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname);
  const file = join(appDir, path === '/' ? 'index.html' : path);
  if (!file.startsWith(appDir) || !existsSync(file)) {
    response.writeHead(404, { 'content-type': 'text/plain' });
    response.end('Not found\n');
    return;
  }
  response.writeHead(200, { 'content-type': mimeTypes[extname(file)] ?? 'application/octet-stream' });
  response.end(readFileSync(file));
});

server.listen(8080, () => {
  console.log('Leonida Platinum Playbook at http://localhost:8080');
});
