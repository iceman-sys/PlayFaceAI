import fs from 'node:fs';
import path from 'node:path';
import {
  CAMPAIGN_HELMET_FALLBACK,
  CAMPAIGN_SCENE_FALLBACK,
} from '../src/lib/campaign';
import type { InlineImage } from './portraitTypes';

const PUBLIC_CAMPAIGN = path.join(process.cwd(), 'public', 'campaign');

const FILES = {
  scene: 'afl-group-scene.png',
  helmet: 'swaarm-helmet.png',
} as const;

function readFileAsInline(filePath: string): InlineImage | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    const buf = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const mimeType =
      ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png';
    return { mimeType, base64: buf.toString('base64') };
  } catch {
    return null;
  }
}

async function fetchUrlAsInline(url: string): Promise<InlineImage> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not load campaign asset from ${url}`);
  const mimeType = res.headers.get('content-type')?.split(';')[0] || 'image/png';
  const buf = Buffer.from(await res.arrayBuffer());
  return { mimeType, base64: buf.toString('base64') };
}

/** Prefer files in public/campaign; fall back to CDN URLs (no localhost HTTP fetch). */
export async function loadCampaignScene(urlHint?: string): Promise<InlineImage> {
  const local = readFileAsInline(path.join(PUBLIC_CAMPAIGN, FILES.scene));
  if (local) return local;

  if (urlHint?.startsWith('http')) {
    try {
      return await fetchUrlAsInline(urlHint);
    } catch {
      /* try fallback */
    }
  }

  return fetchUrlAsInline(CAMPAIGN_SCENE_FALLBACK);
}

export async function loadCampaignHelmet(urlHint?: string): Promise<InlineImage> {
  const local = readFileAsInline(path.join(PUBLIC_CAMPAIGN, FILES.helmet));
  if (local) return local;

  if (urlHint?.startsWith('http')) {
    try {
      return await fetchUrlAsInline(urlHint);
    } catch {
      /* try fallback */
    }
  }

  return fetchUrlAsInline(CAMPAIGN_HELMET_FALLBACK);
}

export function campaignAssetsOnDisk(): { scene: boolean; helmet: boolean } {
  return {
    scene: fs.existsSync(path.join(PUBLIC_CAMPAIGN, FILES.scene)),
    helmet: fs.existsSync(path.join(PUBLIC_CAMPAIGN, FILES.helmet)),
  };
}
