/**
 * The SWAARM helmet asset shipped as a JPEG with a solid white background
 * (no alpha), so compositing it onto the scene produced an opaque white box.
 *
 * This removes the background by flood-filling from the image borders over
 * near-white pixels and setting them transparent. Flood-fill (not a global
 * "remove all white") is important: the white "SWAARM" wordmark sits inside
 * the black cap and is NOT connected to the border, so it is preserved.
 *
 * Output: public/campaign/swaarm-helmet.png (true RGBA PNG with alpha).
 * Backup of the original is written to swaarm-helmet-source.<ext>.
 *
 * Usage:
 *   npm run helmet:cutout
 *   npm run upload:campaign
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'public', 'campaign', 'swaarm-helmet.png');
const backup = path.join(root, 'public', 'campaign', 'swaarm-helmet-source.bin');

if (!fs.existsSync(src)) {
  console.error(`Missing ${src}`);
  process.exit(1);
}

// Keep a one-time backup of the original asset.
if (!fs.existsSync(backup)) {
  fs.copyFileSync(src, backup);
  console.log(`Backed up original → ${backup}`);
}

const BG_THRESHOLD = 205;     // pixel is "near-white" if r,g,b all above this
const FEATHER_MIN = 175;      // edge pixels brighter than this get partial alpha
const LARGE_AREA = 9000;      // white blobs ≥ this many px are treated as background
                              // (face opening) even if fully enclosed; the small
                              // white "SWAARM" wordmark + vent dots stay opaque.

const { data, info } = await sharp(fs.readFileSync(backup))
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const { width, height, channels } = info;
const px = new Uint8ClampedArray(data); // RGBA
const N = width * height;

const brightness = (i) => (px[i] + px[i + 1] + px[i + 2]) / 3;
const isWhite = (p) => {
  const i = p * channels;
  return px[i] > BG_THRESHOLD && px[i + 1] > BG_THRESHOLD && px[i + 2] > BG_THRESHOLD;
};

// Connected-component labelling over near-white pixels (4-connectivity).
// A component becomes transparent if it touches the border (outer background)
// OR it is large (the enclosed face opening). Small enclosed white regions
// (logo wordmark, vent dots) are preserved.
const isBg = new Uint8Array(N);
const seen = new Uint8Array(N);
const queue = new Int32Array(N);

for (let start = 0; start < N; start++) {
  if (seen[start] || !isWhite(start)) continue;

  let head = 0;
  let tail = 0;
  queue[tail++] = start;
  seen[start] = 1;

  const members = [];
  let touchesBorder = false;

  while (head < tail) {
    const p = queue[head++];
    members.push(p);

    const x = p % width;
    const y = (p / width) | 0;
    if (x === 0 || y === 0 || x === width - 1 || y === height - 1) touchesBorder = true;

    if (x > 0 && !seen[p - 1] && isWhite(p - 1)) { seen[p - 1] = 1; queue[tail++] = p - 1; }
    if (x < width - 1 && !seen[p + 1] && isWhite(p + 1)) { seen[p + 1] = 1; queue[tail++] = p + 1; }
    if (y > 0 && !seen[p - width] && isWhite(p - width)) { seen[p - width] = 1; queue[tail++] = p - width; }
    if (y < height - 1 && !seen[p + width] && isWhite(p + width)) { seen[p + width] = 1; queue[tail++] = p + width; }
  }

  if (touchesBorder || members.length >= LARGE_AREA) {
    for (const p of members) isBg[p] = 1;
  }
}

// Apply transparency + feather the boundary so there is no hard white halo.
let cleared = 0;
for (let p = 0; p < N; p++) {
  const i = p * channels;
  if (isBg[p]) {
    px[i + 3] = 0;
    cleared++;
    continue;
  }
  // Soften light edge pixels that touch a transparent neighbour.
  const b = brightness(i);
  if (b > FEATHER_MIN) {
    const x = p % width;
    const y = (p / width) | 0;
    const touchesBg =
      (x > 0 && isBg[p - 1]) ||
      (x < width - 1 && isBg[p + 1]) ||
      (y > 0 && isBg[p - width]) ||
      (y < height - 1 && isBg[p + width]);
    if (touchesBg) {
      const a = Math.round(255 * (1 - (b - FEATHER_MIN) / (255 - FEATHER_MIN)));
      px[i + 3] = Math.min(px[i + 3], Math.max(0, a));
    }
  }
}

// Tight-crop to the alpha bounding box so the cap fills the asset (the source
// had ~50% empty margin, which made the cap render too small when scaled to
// head width). A small transparent pad is kept so feathered edges aren't clipped.
let minX = width, minY = height, maxX = -1, maxY = -1;
for (let p = 0; p < N; p++) {
  if (px[p * channels + 3] === 0) continue;
  const x = p % width;
  const y = (p / width) | 0;
  if (x < minX) minX = x;
  if (y < minY) minY = y;
  if (x > maxX) maxX = x;
  if (y > maxY) maxY = y;
}
const pad = 6;
minX = Math.max(0, minX - pad);
minY = Math.max(0, minY - pad);
maxX = Math.min(width - 1, maxX + pad);
maxY = Math.min(height - 1, maxY + pad);
const cropW = maxX - minX + 1;
const cropH = maxY - minY + 1;

await sharp(Buffer.from(px), { raw: { width, height, channels } })
  .extract({ left: minX, top: minY, width: cropW, height: cropH })
  .png()
  .toFile(src);

console.log(
  `Wrote ${src} — cropped ${width}x${height} → ${cropW}x${cropH} RGBA, ` +
    `${((cleared / N) * 100).toFixed(1)}% of source made transparent.`,
);
console.log('Next: npm run upload:campaign');
