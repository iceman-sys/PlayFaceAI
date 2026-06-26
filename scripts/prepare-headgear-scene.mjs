/**
 * Prepare the pre-fitted "with headgear" base scene (ChatGPT-generated, fan +
 * Tristan already wearing realistic SWAARM caps).
 *
 *   afl-group-scene-headgear-source.png  (raw ChatGPT export)
 *     → afl-group-scene-headgear.jpeg    (2048-wide, <3.5MB, edge-ready)
 *     → afl-group-headgear-fan-crop.jpg  (fan face crop = Replicate swap target)
 *     → afl-group-headgear-annotated.jpeg (red box over the fan crop, for QA)
 *
 * The fan sits at a slightly different position than in the clean photo (the AI
 * regenerated the frame), so the with-headgear variant needs its OWN fan crop.
 * Tune FAN_HEADGEAR below, re-run, inspect the annotated image, repeat.
 *
 * Usage:
 *   npm run prepare:headgear-scene
 *   npm run upload:campaign
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const campaign = path.join(root, 'public', 'campaign');

const SRC = path.join(campaign, 'afl-group-scene-headgear-source.png');
const SCENE_OUT = path.join(campaign, 'afl-group-scene-headgear.jpeg');
const CROP_OUT = path.join(campaign, 'afl-group-headgear-fan-crop.jpg');
const ANNOT_OUT = path.join(campaign, 'afl-group-headgear-annotated.jpeg');

const REF_W = 2048;
const REF_H = 1365;

// Fan face region in the HEADGEAR scene (2048x1365 ref frame).
// Calibrated so the crop tightly frames the capped fan's face for the swap.
const FAN_HEADGEAR = { cx: 707, cy: 548, rx: 108, ry: 126 };

if (!fs.existsSync(SRC)) {
  console.error(`Missing ${SRC}`);
  console.error('Copy the ChatGPT "with headgear" image there first.');
  process.exit(1);
}

// 1. Standardize the scene to the 2048-wide reference frame.
const scene = await sharp(fs.readFileSync(SRC))
  .resize({ width: REF_W, height: REF_H, fit: 'fill' })
  .jpeg({ quality: 85, mozjpeg: true })
  .toBuffer();
fs.writeFileSync(SCENE_OUT, scene);
console.log(`Scene → ${SCENE_OUT} (${(scene.length / 1024).toFixed(0)} KB, ${REF_W}x${REF_H})`);

// 2. Fan crop rect (matches cropRectForRegion in regionConfig.ts).
const padding = 0.03;
const left = Math.max(0, Math.floor(FAN_HEADGEAR.cx - FAN_HEADGEAR.rx * (1 + padding)));
const top = Math.max(0, Math.floor(FAN_HEADGEAR.cy - FAN_HEADGEAR.ry * (1 + padding)));
const width = Math.min(REF_W - left, Math.ceil(FAN_HEADGEAR.rx * 2 * (1 + padding)));
const height = Math.min(REF_H - top, Math.ceil(FAN_HEADGEAR.ry * 2 * (1 + padding)));
const rect = { left, top, width, height };
console.log('Fan crop rect:', rect);

const crop = await sharp(scene)
  .extract(rect)
  .jpeg({ quality: 92, mozjpeg: true })
  .toBuffer();
fs.writeFileSync(CROP_OUT, crop);
console.log(`Fan crop → ${CROP_OUT} (${(crop.length / 1024).toFixed(0)} KB, ${width}x${height})`);

// 3. Annotated QA image.
const svg = `
<svg width="${REF_W}" height="${REF_H}" xmlns="http://www.w3.org/2000/svg">
  <rect x="${rect.left}" y="${rect.top}" width="${rect.width}" height="${rect.height}"
    fill="none" stroke="#ef4444" stroke-width="5"/>
  <ellipse cx="${FAN_HEADGEAR.cx}" cy="${FAN_HEADGEAR.cy}" rx="${FAN_HEADGEAR.rx}" ry="${FAN_HEADGEAR.ry}"
    fill="none" stroke="#22d3ee" stroke-width="3"/>
  <text x="${FAN_HEADGEAR.cx}" y="${rect.top - 12}" text-anchor="middle"
    font-family="Arial" font-size="26" font-weight="bold" fill="#ef4444">FAN swap target</text>
</svg>`;
await sharp(scene).composite([{ input: Buffer.from(svg), top: 0, left: 0 }]).jpeg({ quality: 88 }).toFile(ANNOT_OUT);
console.log(`Annotated → ${ANNOT_OUT}`);
console.log('Inspect the annotated image; tune FAN_HEADGEAR if the box misses the fan face.');
