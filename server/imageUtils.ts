import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { GeneratePortraitInput, InlineImage } from './portraitTypes';

const PROJECT_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function readLocalPublicAsset(urlPath: string): InlineImage | null {
  if (!urlPath.startsWith('/')) return null;
  const filePath = path.join(PROJECT_ROOT, 'public', urlPath.replace(/^\//, ''));
  if (!fs.existsSync(filePath)) return null;
  const buf = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const mimeType =
    ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
  return { mimeType, base64: buf.toString('base64') };
}

export function parseDataUrl(dataUrl: string): InlineImage {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error('Invalid selfie format — upload a JPG or PNG');
  return { mimeType: match[1], base64: match[2] };
}

export async function fetchImageAsInline(url: string, baseUrl: string): Promise<InlineImage> {
  if (url.startsWith('data:')) {
    return parseDataUrl(url);
  }

  if (url.startsWith('/')) {
    const local = readLocalPublicAsset(url);
    if (local) return local;
  }

  const absolute = url.startsWith('http') ? url : new URL(url, baseUrl).href;
  const timeoutMs = Number(process.env.ASSET_FETCH_TIMEOUT_MS || 30_000);

  let res: Response;
  try {
    res = await fetch(absolute, { signal: AbortSignal.timeout(timeoutMs) });
  } catch (err) {
    const hint = absolute.includes('cloudfront.net')
      ? ' CDN may be blocked on your network — use Squad Celebration (local assets) or upload a custom backdrop.'
      : '';
    throw new Error(
      `Could not download asset (${absolute}): ${err instanceof Error ? err.message : 'network error'}.${hint}`,
    );
  }
  if (!res.ok) throw new Error(`Could not load asset: ${url} (${res.status})`);
  const mimeType = res.headers.get('content-type')?.split(';')[0] || 'image/jpeg';
  const buf = Buffer.from(await res.arrayBuffer());
  return { mimeType, base64: buf.toString('base64') };
}

export function buildCampaignPrompt(input: GeneratePortraitInput): string {
  return buildFaceSwapPrompt(input);
}

export function buildFaceSwapPrompt(input: GeneratePortraitInput): string {
  const target =
    input.targetPlayer ||
    'center player (middle of five teammates in a row)';

  return [
    'Professional AFL campaign photo composite.',
    `Image 1 is the team celebration scene. Image 2 is the person reference.`,
    `Replace ONLY the ${target} face with the person from Image 2.`,
    'Do NOT add headgear yet. Do NOT change any other player, jersey, logo, crowd, or background.',
    'Preserve exact jersey logos: AFL, Mazda, 13cabs — no spelling changes.',
    'Match the center player head angle to their body (slight turn, not forced straight-on).',
    'Match warm indoor stadium lighting: directional highlights and shadows like teammates.',
    'Match skin tone to the center player neck and arms. Add natural skin texture, not beauty-filter smooth.',
    'Expression: subtle celebratory smile, consistent with teammates.',
    'Photorealistic. No watermarks or extra text.',
    input.campaignId ? `Campaign: ${input.campaignId}` : '',
  ]
    .filter(Boolean)
    .join(' ');
}

export function buildHeadgearPrompt(input: GeneratePortraitInput): string {
  const target =
    input.targetPlayer ||
    'center player (middle of five teammates in a row)';

  return [
    'Professional AFL campaign photo.',
    `Image 1 is the scene with the ${target} face already replaced.`,
    'Image 2 is the black SWAARM rugby scrum cap product reference.',
    `Place the headgear ONLY on the ${target} head so it wraps naturally around the skull.`,
    'Logo text on forehead must read exactly "SWAARM" (not SW6ARN, SWAXRM, or other variants).',
    'Face must remain visible through the helmet opening. Do not change face identity.',
    'Do NOT modify any other player, jerseys, logos, crowd, or background.',
    'Match arena lighting and contact shadows under the cap brim.',
    'Photorealistic. No watermarks.',
    input.campaignId ? `Campaign: ${input.campaignId}` : '',
  ]
    .filter(Boolean)
    .join(' ');
}

export function buildHarmonizePrompt(): string {
  return [
    'Photorealistic color grade on the center player face and neck only.',
    'Match warm stadium lighting, skin tone to adjacent neck, subtle sweat and pore texture.',
    'Do not change identity, headgear, composition, jerseys, logos, teammates, or background.',
  ].join(' ');
}

export function inlineToBuffer(inline: InlineImage): Buffer {
  return Buffer.from(inline.base64, 'base64');
}

export function mimeToFilename(mimeType: string, baseName: string): string {
  if (mimeType.includes('png')) return `${baseName}.png`;
  if (mimeType.includes('webp')) return `${baseName}.webp`;
  return `${baseName}.jpg`;
}

export function dataUrlToBase64Payload(dataUrl: string): { base64: string; mimeType: string } | null {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  return { mimeType: match[1], base64: match[2] };
}
