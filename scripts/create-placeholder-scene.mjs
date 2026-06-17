/** Creates a dev placeholder scene when CDN/local asset is missing. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'public', 'campaign', 'afl-group-scene.png');

const w = 1536;
const h = 1024;

const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#1a2a4a"/>
  <rect y="700" width="100%" height="324" fill="#2d4a22"/>
  ${[200, 420, 768, 1116, 1336]
    .map((cx, i) => {
      const isCenter = i === 2;
      return `<g transform="translate(${cx - 80}, 280)">
        <rect width="160" height="380" rx="20" fill="${isCenter ? '#1e5fc4' : '#0a1f44'}" stroke="#fff" stroke-width="2"/>
        <circle cx="80" cy="60" r="45" fill="#c9a882"/>
        <text x="80" y="420" text-anchor="middle" fill="#fff" font-size="14" font-family="Arial">${isCenter ? 'YOU' : 'PLAYER'}</text>
      </g>`;
    })
    .join('')}
</svg>`;

fs.mkdirSync(path.dirname(out), { recursive: true });
await sharp(Buffer.from(svg)).png().toFile(out);
console.log('Wrote', out);
