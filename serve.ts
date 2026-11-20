#!/usr/bin/env node
// Static dev server for the Leonida Platinum Field Guide.
// Serves ./app on http://127.0.0.1:8080 by default; --port <n> picks another port.
// Node 22 stdlib only. Requests that escape app/ are rejected with 403.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
};

const root = resolve(fileURLToPath(new URL('./app', import.meta.url)));

let port = 8080;
const portIdx = process.argv.indexOf('--port');
if (portIdx !== -1) {
  const n = Number(process.argv[portIdx + 1]);
  if (!Number.isInteger(n) || n < 1 || n > 65535) {
    console.error('serve.ts: --port expects a whole number between 1 and 65535');
    process.exit(1);
  }
  port = n;
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', 'http://localhost');
    let pathname = decodeURIComponent(url.pathname);
    if (pathname === '/') pathname = '/index.html';
    const file = resolve(join(root, pathname));
    if (file !== root && !file.startsWith(root + sep)) {
      res.writeHead(403, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('403 Forbidden\n');
      return;
    }
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch (err) {
    const code = err && typeof err === 'object' && 'code' in err ? err.code : '';
    if (code === 'ENOENT' || code === 'ENOTDIR') {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('404 Not found\n');
    } else {
      res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('500 Internal error\n');
    }
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log('Leonida Platinum Field Guide: http://127.0.0.1:' + port + '/');
});
