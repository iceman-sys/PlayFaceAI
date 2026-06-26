/**
 * Compress afl-group-scene.jpeg for Supabase Storage + edge functions (~0.5 MB).
 * Usage: npm run optimize:scene
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const scenePath = path.join(root, 'public', 'campaign', 'afl-group-scene.jpeg');

if (!fs.existsSync(scenePath)) {
  console.error(`Missing ${scenePath}`);
  process.exit(1);
}

const input = fs.readFileSync(scenePath);
const before = input.length;
const meta = await sharp(input).metadata();

const output = await sharp(input)
  .resize({ width: 2048, withoutEnlargement: true })
  .jpeg({ quality: 85, mozjpeg: true })
  .toBuffer();

fs.writeFileSync(scenePath, output);
const after = output.length;

console.log(
  `Optimized afl-group-scene.jpeg: ${meta.width}x${meta.height} ` +
    `${(before / 1024 / 1024).toFixed(2)} MB → ${(after / 1024 / 1024).toFixed(2)} MB`,
);
console.log('Next: npm run upload:campaign');
