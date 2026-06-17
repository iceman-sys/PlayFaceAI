/**

 * Download face-api model weights to public/models (browser selfie validation).

 */

import fs from 'node:fs';

import path from 'node:path';

import { fileURLToPath } from 'node:url';



const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const CDN = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model';

const files = [

  'tiny_face_detector_model-weights_manifest.json',

  'tiny_face_detector_model.bin',

  'face_landmark_68_model-weights_manifest.json',

  'face_landmark_68_model.bin',

];



async function downloadFile(url, dest) {

  const res = await fetch(url);

  if (!res.ok) throw new Error(`Failed ${url} (${res.status})`);

  const buf = Buffer.from(await res.arrayBuffer());

  fs.writeFileSync(dest, buf);

}



async function ensureModels(destDir) {

  fs.mkdirSync(destDir, { recursive: true });

  for (const file of files) {

    const dest = path.join(destDir, file);

    if (fs.existsSync(dest) && fs.statSync(dest).size > 0) continue;

    const url = `${CDN}/${file}`;

    console.log(`Downloading ${file}...`);

    try {

      await downloadFile(url, dest);

    } catch (err) {

      console.warn(`Could not download ${file}:`, err instanceof Error ? err.message : err);

      console.warn('Run setup:models again when online, or copy models from another machine.');

    }

  }

  console.log(`Models ready in ${destDir}`);

}



await ensureModels(path.join(root, 'public', 'models'));

console.log('Done. Face detection models ready for browser selfie validation.');


