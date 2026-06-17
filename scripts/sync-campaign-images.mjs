/**
 * Copy campaign images into public/campaign/
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const destDir = path.join(root, 'public', 'campaign');

const DEST = {
  helmet: path.join(destDir, 'swaarm-helmet.png'),
  scene: path.join(destDir, 'afl-group-scene.png'),
};

const SEARCH = [
  /swaarm.*helmet|SWAARM.*Rugby/i,
  /afl.*group|Screenshot.*125157|tristan.*caleb/i,
];

function findInDir(dir, pattern) {
  if (!dir || !fs.existsSync(dir)) return null;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const hit = findInDir(full, pattern);
      if (hit) return hit;
    } else if (/\.(png|jpe?g|webp)$/i.test(entry.name) && pattern.test(entry.name)) {
      return full;
    }
  }
  return null;
}

function copy(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  console.log(`Copied: ${src}\n    -> ${dest}`);
}

const [helmetArg, sceneArg] = process.argv.slice(2);
const roots = [
  process.env.PLAYFACE_CAMPAIGN_DIR,
  path.join(root, '..', 'ai-photo-sports', 'PlayFaceAI', 'public', 'campaign'),
  path.join(process.env.USERPROFILE || '', 'Downloads'),
  path.join(process.env.USERPROFILE || '', '.cursor', 'projects'),
].filter(Boolean);

let helmetSrc = helmetArg;
let sceneSrc = sceneArg;
if (!helmetSrc) {
  for (const dir of roots) helmetSrc = findInDir(dir, SEARCH[0]);
}
if (!sceneSrc) {
  for (const dir of roots) sceneSrc = findInDir(dir, SEARCH[1]);
}

if (!helmetSrc && !sceneSrc) {
  console.log(`
No campaign images found. Place manually:
  public/campaign/swaarm-helmet.png
  public/campaign/afl-group-scene.png

Or: node scripts/sync-campaign-images.mjs "C:\\path\\helmet.png" "C:\\path\\scene.png"
`);
  process.exit(1);
}

if (helmetSrc) copy(helmetSrc, DEST.helmet);
if (sceneSrc) copy(sceneSrc, DEST.scene);
console.log('\nDone. Run: node scripts/calibrate-scene.mjs');
