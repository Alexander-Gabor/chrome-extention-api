import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, 'public');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon'
};

const HARDCODED_GEOAPIFY_API_KEY = '2907b4a6ac0a4896b3d98e9c928be2e6';

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const requestUrl = new URL(req.url ?? '/', 'http://0.0.0.0');

  if (requestUrl.pathname.startsWith('/api/restaurants')) {
    const apiKey = HARDCODED_GEOAPIFY_API_KEY;

    try {
      const randomOffset = String(Math.floor(Math.random() * 200));
      const params = new URLSearchParams({
        categories: 'catering.restaurant',
        filter: 'rect:17.84,59.23,18.30,59.42',
        limit: '1',
        offset: randomOffset,
        apiKey
      });

      const apiResponse = await fetch(`https://api.geoapify.com/v2/places?${params.toString()}`);
      if (!apiResponse.ok) {
        const text = await apiResponse.text();
        sendJson(res, apiResponse.status, {
          error: `Geoapify request failed (${apiResponse.status})`,
          details: text
        });
        return;
      }

      const data = await apiResponse.json();
      sendJson(res, 200, data);
      return;
    } catch (error) {
      sendJson(res, 500, {
        error: 'Failed to fetch Geoapify data',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
      return;
    }
  }

  try {
    const urlPath = requestUrl.pathname === '/' ? '/index.html' : requestUrl.pathname;
    const safePath = path.normalize(urlPath).replace(/^\/+/, '');
    const filePath = path.join(publicDir, safePath);

    if (!filePath.startsWith(publicDir)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    const data = await readFile(filePath);
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Listening on ${PORT}`);
});
