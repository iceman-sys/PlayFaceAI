import sharp from 'sharp';
import { buildFaceMaskSvg } from './alignFace';
import type { SceneAnchor } from './types';

type OpenAIImageResponse = {
  data?: Array<{ b64_json?: string; url?: string }>;
  error?: { message?: string };
};

/** Optional low-strength OpenAI pass to blend lighting on the face region only. */
export async function optionalOpenAiHarmonize(
  compositeBuffer: Buffer,
  anchor: SceneAnchor,
  apiKey: string,
): Promise<Buffer> {
  const maskSvg = buildFaceMaskSvg(anchor, 22);
  const maskPng = await sharp(Buffer.from(maskSvg)).png().toBuffer();

  const form = new FormData();
  form.append('model', process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1');
  form.append(
    'prompt',
    'Harmonize skin tone and arena lighting on the center player face only. Do not change identity, composition, jerseys, logos, teammates, or headgear. Photorealistic.',
  );
  form.append('n', '1');
  form.append('size', `${anchor.imageWidth}x${anchor.imageHeight}`);
  form.append('quality', 'medium');
  form.append('input_fidelity', 'high');

  const imageBlob = new Blob([compositeBuffer], { type: 'image/png' });
  const maskBlob = new Blob([maskPng], { type: 'image/png' });
  form.append('image[]', imageBlob, 'scene.png');
  form.append('mask', maskBlob, 'face-mask.png');

  const res = await fetch('https://api.openai.com/v1/images/edits', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
    signal: AbortSignal.timeout(Number(process.env.OPENAI_REQUEST_TIMEOUT_MS || 120_000)),
  });

  const json = (await res.json()) as OpenAIImageResponse;
  if (!res.ok) {
    throw new Error(json.error?.message || `OpenAI harmonize failed (${res.status})`);
  }

  const b64 = json.data?.[0]?.b64_json;
  if (b64) return Buffer.from(b64, 'base64');

  const url = json.data?.[0]?.url;
  if (url) {
    const imgRes = await fetch(url, { signal: AbortSignal.timeout(30_000) });
    if (!imgRes.ok) throw new Error('Could not fetch harmonized image');
    return Buffer.from(await imgRes.arrayBuffer());
  }

  throw new Error('OpenAI harmonize returned no image');
}
