/**
 * Production API server — run with: npm run server
 * Set VITE_GENERATE_API_URL to this server's public URL + /api/generate-sports-portrait
 */
import { createServer } from 'node:http';
import { config } from 'dotenv';
import { handleGeneratePortrait } from './handler';

config({ path: '.env.local' });
config();

const PORT = Number(process.env.PORT || 3001);
const HOST = process.env.HOST || '0.0.0.0';

const server = createServer((req, res) => {
  const url = req.url?.split('?')[0];

  if (url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  if (url === '/api/generate-sports-portrait') {
    const origin = process.env.PUBLIC_ORIGIN || `http://${HOST}:${PORT}`;
    handleGeneratePortrait(req, res, origin).catch((err) => {
      console.error('[standalone]', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, HOST, () => {
  console.log(`[SWAARM API] http://${HOST}:${PORT}/api/generate-sports-portrait`);
  console.log(`[SWAARM API] provider=${process.env.IMAGE_PROVIDER || 'gemini'}`);
});
