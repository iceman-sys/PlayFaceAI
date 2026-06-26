/**
 * Draw FAN + Tristan region ellipses on the scene for client calibration review.
 * Usage: npm run annotate:scene
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const scenePath = join(root, 'public', 'campaign', 'afl-group-scene.jpeg');
const outPath = join(root, 'public', 'campaign', 'afl-group-scene-annotated.jpeg');
const regionsPath = join(root, 'public', 'campaign', 'regions.json');

if (!existsSync(scenePath)) {
  console.error(`Missing ${scenePath}`);
  process.exit(1);
}

const regions = JSON.parse(readFileSync(regionsPath, 'utf8'));
const refW = regions.referenceWidth ?? 2048;
const refH = regions.referenceHeight ?? 1365;

const scene = sharp(readFileSync(scenePath));
const meta = await scene.metadata();
const w = meta.width ?? refW;
const h = meta.height ?? refH;
const sx = w / refW;
const sy = h / refH;

function ellipseSvg(region, color, label) {
  const cx = region.cx * sx;
  const cy = region.cy * sy;
  const rx = region.rx * sx;
  const ry = region.ry * sy;
  return `
    <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"
      fill="none" stroke="${color}" stroke-width="4"/>
    <text x="${cx}" y="${cy - ry - 8}" text-anchor="middle"
      font-family="Arial,sans-serif" font-size="22" font-weight="bold" fill="${color}">
      ${label}
    </text>`;
}

const svg = `
<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  ${ellipseSvg(regions.fan, '#ef4444', `Slot ${regions.fan.slotIndex}: FAN`)}
  ${ellipseSvg(regions.tristan, '#f59e0b', `Slot ${regions.tristan.slotIndex}: Tristan`)}
</svg>`;

await scene
  .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
  .jpeg({ quality: 90 })
  .toFile(outPath);

console.log(`Wrote ${outPath}`);
console.log('Verify ellipses match client red circles (player 3 blond, player 5 beard).');
