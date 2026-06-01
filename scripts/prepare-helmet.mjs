/**
 * Bake transparent helmet into public/campaign/swaarm-helmet.png
 * Usage: node scripts/prepare-helmet.mjs [input.png]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const input =
  process.argv[2] || path.join(root, 'public', 'campaign', 'swaarm-helmet.png');
const output = path.join(root, 'public', 'campaign', 'swaarm-helmet-transparent.png');

if (!fs.existsSync(input)) {
  console.error('Input not found:', input);
  process.exit(1);
}

const WHITE_THRESHOLD = 235;
const WHITE_SOFTNESS = 18;

const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const channels = info.channels;
const pixels = info.width * info.height;
const out = Buffer.from(data);

for (let i = 0; i < pixels; i++) {
  const o = i * channels;
  const r = out[o];
  const g = out[o + 1];
  const b = out[o + 2];
  const a = channels === 4 ? out[o + 3] : 255;
  const minRgb = Math.min(r, g, b);
  const maxRgb = Math.max(r, g, b);
  const avg = (r + g + b) / 3;
  const saturation = maxRgb === 0 ? 0 : (maxRgb - minRgb) / maxRgb;
  const isWhiteBg =
    avg >= WHITE_THRESHOLD && saturation < 0.22 && minRgb >= WHITE_THRESHOLD - WHITE_SOFTNESS;
  if (isWhiteBg) {
    out[o + 3] = 0;
    continue;
  }
  if (avg >= WHITE_THRESHOLD - WHITE_SOFTNESS && saturation < 0.28) {
    const t = (avg - (WHITE_THRESHOLD - WHITE_SOFTNESS)) / WHITE_SOFTNESS;
    out[o + 3] = Math.round(a * (1 - Math.min(1, t)));
  }
}

const png = await sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } })
  .trim({ threshold: 10 })
  .png()
  .toBuffer()
  .catch(() =>
    sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer(),
  );

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, png);
console.log('Wrote transparent helmet:', output);
