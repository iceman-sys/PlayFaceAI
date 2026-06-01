/**
 * Write proportional scene anchor for the squad template.
 * Tune server/assets/scene-anchor.json manually for pixel-perfect fit.
 *
 * Usage: npm run calibrate
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { bboxToLandmarks, estimateCenterFaceBox } from '../server/pipeline/faceDetect';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const scenePath = process.argv[2] || path.join(root, 'public', 'campaign', 'afl-group-scene.png');
const outPath = path.join(root, 'server', 'assets', 'scene-anchor.json');

if (!fs.existsSync(scenePath)) {
  console.error(`Scene not found: ${scenePath}`);
  process.exit(1);
}

const buffer = fs.readFileSync(scenePath);
const meta = await sharp(buffer).metadata();
const width = meta.width ?? 1203;
const height = meta.height ?? 1024;
const box = estimateCenterFaceBox(width, height);

const anchor = {
  sceneId: 'squad-celebration',
  imageWidth: width,
  imageHeight: height,
  centerFace: {
    box,
    landmarks: bboxToLandmarks(box),
    score: 0.9,
  },
  skinSample: {
    x: Math.round(box.x + box.width * 0.25),
    y: Math.min(height - 20, Math.round(box.y + box.height * 1.05)),
    width: Math.round(box.width * 0.5),
    height: Math.round(box.height * 0.2),
  },
  helmet: { widthRatio: 1.38, topOffsetRatio: 0.52 },
};

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(anchor, null, 2));
console.log(`Wrote ${outPath} (${width}x${height})`);
console.log(JSON.stringify(box));
