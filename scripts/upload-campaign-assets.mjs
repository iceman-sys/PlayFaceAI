/**
 * Upload public/campaign assets to Supabase Storage (edge function source of truth).
 * Usage: npm run upload:campaign
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    const envPath = path.join(root, file);
    if (!fs.existsSync(envPath)) continue;
    const text = fs.readFileSync(envPath, 'utf8').replace(/^\uFEFF/, '');
    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const eq = line.indexOf('=');
      if (eq <= 0) continue;
      const key = line.slice(0, eq).trim();
      const value = line.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

const ASSETS = [
  { file: 'afl-group-scene.jpeg', dest: 'afl-group-scene.jpeg', contentType: 'image/jpeg' },
  { file: 'afl-group-fan-crop.jpg', dest: 'afl-group-fan-crop.jpg', contentType: 'image/jpeg', optional: true },
  // Pre-fitted "with headgear" base scene + its own fan crop (two-base-scene method).
  { file: 'afl-group-scene-headgear.jpeg', dest: 'afl-group-scene-headgear.jpeg', contentType: 'image/jpeg', sizeCheck: true },
  { file: 'afl-group-headgear-fan-crop.jpg', dest: 'afl-group-headgear-fan-crop.jpg', contentType: 'image/jpeg', optional: true },
  { file: 'swaarm-helmet.png', dest: 'swaarm-helmet.png', contentType: 'image/png' },
  { file: 'swaarm-footer-logo.png', dest: 'swaarm-footer-logo.png', contentType: 'image/png' },
];
// Do NOT upload afl-group-scene.png (31 MB) — it exceeds Supabase Edge Function memory limits.

loadEnv();

const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL)?.replace(/\/$/, '');
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const bucket = 'campaign-assets';

if (!supabaseUrl) {
  console.error('Missing SUPABASE_URL or VITE_SUPABASE_URL in .env.local');
  process.exit(1);
}
if (!serviceKey) {
  console.error(
    'Missing SUPABASE_SERVICE_ROLE_KEY in .env.local\n' +
      'Dashboard → Settings → API → service_role (secret)',
  );
  process.exit(1);
}

for (const { file, dest, contentType, optional, sizeCheck } of ASSETS) {
  const localPath = path.join(root, 'public', 'campaign', file);
  if (!fs.existsSync(localPath)) {
    if (optional) {
      console.warn(`Skipping optional ${file} (run \`npm run prebake:assets\` to generate)`);
    } else {
      console.warn(`Skipping missing ${localPath}`);
    }
    continue;
  }

  const body = fs.readFileSync(localPath);
  if (file === 'afl-group-scene.jpeg' || sizeCheck) {
    const mb = body.length / 1024 / 1024;
    if (mb > 3.5) {
      console.error(
        `${file} is ${mb.toFixed(1)} MB — too large for edge functions.\n` +
          'Re-run the scene prep script to re-encode it under 3.5 MB.',
      );
      process.exit(1);
    }
    console.log(`Scene ready (${file}): ${mb.toFixed(2)} MB`);
  }
  const url = `${supabaseUrl}/storage/v1/object/${bucket}/${dest}`;

  console.log(`Uploading ${file} (${(body.length / 1024 / 1024).toFixed(1)} MB)...`);

  let res;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${serviceKey}`,
          'Content-Type': contentType,
          'x-upsert': 'true',
        },
        body,
        signal: AbortSignal.timeout(300_000),
      });
      break;
    } catch (err) {
      if (attempt === 3) throw err;
      console.warn(`  retry ${attempt}...`);
      await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
  }

  if (!res || !res.ok) {
    const errText = res ? await res.text() : 'no response';
    console.error(`Upload failed:`, res?.status, errText);
    if (errText.includes('Bucket not found')) {
      console.error('\nRun: supabase/migrations/20260616000000_campaign_assets_bucket.sql');
    }
    process.exit(1);
  }

  console.log(`  → ${supabaseUrl}/storage/v1/object/public/${bucket}/${dest}`);
}

console.log('\nDone. Edge function uses locker-room scene + SWAARM helmet from Storage.');
