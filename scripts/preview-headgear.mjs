/**
 * Local preview of the headgear placement — composites the transparent SWAARM
 * helmet onto the scene using the SAME forehead-anchored model as the edge
 * function, so we can calibrate without deploying.
 *
 * Edit PLACEMENT below, run `node scripts/preview-headgear.mjs`, inspect
 * public/campaign/afl-group-headgear-preview.jpeg, repeat. When it looks right,
 * port the numbers into supabase/functions/composite-image/regionConfig.ts.
 *
 * Placement model (scene coordinates):
 *   targetW   = 2*rx * widthRatio
 *   targetH   = targetW * (helmetH / helmetW)
 *   foreheadY = cy - foreheadRatio*ry
 *   left      = cx - targetW/2 + offsetX
 *   top       = foreheadY - anchorY*targetH + offsetY
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const scenePath = path.join(root, 'public', 'campaign', 'afl-group-scene.jpeg');
const helmetPath = path.join(root, 'public', 'campaign', 'swaarm-helmet.png');
const outPath = path.join(root, 'public', 'campaign', 'afl-group-headgear-preview.jpeg');

const REF_W = 2048;
const REF_H = 1365;

// Head ellipses (face-centered) — must match regions.json / regionConfig.ts.
const REGIONS = {
  fan: { cx: 744, cy: 468, rx: 102, ry: 118 },
  tristan: { cx: 1200, cy: 318, rx: 92, ry: 98 },
};

// Tunable placement. Iterate these.
const PLACEMENT = {
  fan: { widthRatio: 1.34, foreheadRatio: 0.5, anchorY: 0.44, offsetX: 0, offsetY: -60 },
  tristan: { widthRatio: 1.36, foreheadRatio: 0.5, anchorY: 0.44, offsetX: 12, offsetY: 40 },
};

const sceneBuf = fs.readFileSync(scenePath);
const sceneMeta = await sharp(sceneBuf).metadata();
const imgW = sceneMeta.width ?? REF_W;
const imgH = sceneMeta.height ?? REF_H;
const sx = imgW / REF_W;
const sy = imgH / REF_H;

const helmetMeta = await sharp(fs.readFileSync(helmetPath)).metadata();
const helmetAspect = (helmetMeta.height ?? 674) / (helmetMeta.width ?? 497);

const composites = [];
for (const key of Object.keys(REGIONS)) {
  const r = REGIONS[key];
  const p = PLACEMENT[key];
  const cx = r.cx * sx;
  const cy = r.cy * sy;
  const rx = r.rx * sx;
  const ry = r.ry * sy;

  const targetW = Math.round(2 * rx * p.widthRatio);
  const targetH = Math.round(targetW * helmetAspect);
  const foreheadY = cy - p.foreheadRatio * ry;
  const left = Math.round(cx - targetW / 2 + p.offsetX * sx);
  const top = Math.round(foreheadY - p.anchorY * targetH + p.offsetY * sy);

  const resized = await sharp(fs.readFileSync(helmetPath))
    .resize(targetW, targetH, { fit: 'fill' })
    .png()
    .toBuffer();

  console.log(`${key}: size ${targetW}x${targetH} at (${left},${top})`);
  composites.push({ input: resized, left, top });
}

await sharp(sceneBuf).composite(composites).jpeg({ quality: 90 }).toFile(outPath);
console.log(`Wrote ${outPath}`);
