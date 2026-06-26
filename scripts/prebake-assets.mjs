/**
 * Pre-bake the fan crop region from afl-group-scene.jpeg.
 *
 * Why: the face-swap edge function uploads this crop as the Replicate
 * `input_image` (target). If it's pre-baked, the edge call does ZERO image
 * decode/encode at submission — the worker just makes 2 HTTP calls and
 * inserts a DB row. That keeps it far below the Supabase CPU per-request limit.
 *
 * Usage:
 *   npm run prebake:assets
 *   npm run upload:campaign
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const scenePath = path.join(root, 'public', 'campaign', 'afl-group-scene.jpeg');
const regionsPath = path.join(root, 'public', 'campaign', 'regions.json');
const outPath = path.join(root, 'public', 'campaign', 'afl-group-fan-crop.jpg');

if (!fs.existsSync(scenePath)) {
  console.error(`Missing ${scenePath}`);
  console.error('Run `npm run optimize:scene` first.');
  process.exit(1);
}
if (!fs.existsSync(regionsPath)) {
  console.error(`Missing ${regionsPath}`);
  process.exit(1);
}

const regions = JSON.parse(fs.readFileSync(regionsPath, 'utf8'));
const refW = regions.referenceWidth ?? 2048;
const refH = regions.referenceHeight ?? 1365;

const scene = sharp(fs.readFileSync(scenePath));
const meta = await scene.metadata();
const imgW = meta.width ?? refW;
const imgH = meta.height ?? refH;

const sx = imgW / refW;
const sy = imgH / refH;
const padding = 1.03;

const cx = regions.fan.cx * sx;
const cy = regions.fan.cy * sy;
const rx = regions.fan.rx * sx * padding;
const ry = regions.fan.ry * sy * padding;

const left = Math.max(0, Math.floor(cx - rx));
const top = Math.max(0, Math.floor(cy - ry));
const width = Math.min(imgW - left, Math.ceil(rx * 2));
const height = Math.min(imgH - top, Math.ceil(ry * 2));

console.log(`Scene ${imgW}x${imgH} — fan crop rect:`, { left, top, width, height });

const out = await sharp(fs.readFileSync(scenePath))
  .extract({ left, top, width, height })
  .jpeg({ quality: 92, mozjpeg: true })
  .toBuffer();

fs.writeFileSync(outPath, out);

console.log(`Wrote ${outPath} (${(out.length / 1024).toFixed(0)} KB)`);
console.log('Next: npm run upload:campaign  (uploads afl-group-fan-crop.jpg to Storage)');
