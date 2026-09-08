import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

const files = {
  '/': ['tests/fixtures/demo.html', 'text/html'],
  '/fixture': ['tests/fixtures/integration.html', 'text/html'],
  '/gtm-adapter.js': ['tests/fixtures/gtm-adapter.js', 'text/javascript'],
  '/template.tpl': ['template.tpl', 'text/plain'],
  '/companion.js': ['companion/youtube-tracker.js', 'text/javascript'],
};
createServer(async (request, response) => {
  const file = files[new URL(request.url, 'http://localhost').pathname];
  if (!file) { response.writeHead(404).end(); return; }
  try {
    const content = await readFile(new URL('../' + file[0], import.meta.url));
    response.writeHead(200, { 'Content-Type': file[1], 'Cache-Control': 'no-store' });
    response.end(content);
  } catch {
    response.writeHead(404).end();
  }
}).listen(4173, '127.0.0.1', () => {
  console.log('Demo: http://127.0.0.1:4173');
});
