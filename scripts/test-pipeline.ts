/**
 * Quick local test: tsx scripts/test-pipeline.ts [selfie.png]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';
import { generatePortraitPipeline } from '../server/pipeline/index';
import { ASSETS } from '../src/lib/constants';

config({ path: '.env.local' });

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const selfiePath =
  process.argv[2] || path.join(process.env.USERPROFILE || '', 'Downloads', 'swaarm-james.png');

if (!fs.existsSync(selfiePath)) {
  console.error('Selfie not found:', selfiePath);
  process.exit(1);
}

const buf = fs.readFileSync(selfiePath);
const dataUrl = `data:image/png;base64,${buf.toString('base64')}`;
const origin = 'http://localhost:8080';

console.log('Running pipeline test...');
const result = await generatePortraitPipeline(origin, {
  selfie: dataUrl,
  sceneUrl: ASSETS.team,
  helmetUrl: ASSETS.helmetClean,
  campaignId: 'squad-celebration',
});

const out = path.join(root, 'test-output.png');
const b64 = result.imageUrl.replace(/^data:image\/\w+;base64,/, '');
fs.writeFileSync(out, Buffer.from(b64, 'base64'));
console.log('Wrote', out, 'provider=', result.provider, 'model=', result.model);
