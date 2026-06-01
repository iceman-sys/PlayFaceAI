import type { GeneratePortraitResult, InlineImage } from './portraitTypes';

const DEFAULT_MODEL = 'gemini-2.5-flash-image';
const FALLBACK_MODEL = 'gemini-2.0-flash-preview-image-generation';

export function getGeminiModel(): string {
  return process.env.GEMINI_MODEL || DEFAULT_MODEL;
}

function extractImageFromResponse(json: Record<string, unknown>): string | null {
  const candidates = json.candidates as Array<{
    content?: {
      parts?: Array<{
        inlineData?: { mimeType?: string; data?: string };
        inline_data?: { mime_type?: string; data?: string };
      }>;
    };
  }> | undefined;

  for (const part of candidates?.[0]?.content?.parts ?? []) {
    const inline = part.inlineData ?? part.inline_data;
    const data = inline?.data;
    const mime =
      part.inlineData?.mimeType ?? part.inline_data?.mime_type ?? 'image/png';
    if (data) return `data:${mime};base64,${data}`;
  }
  return null;
}

export async function callGeminiWithImages(
  apiKey: string,
  prompt: string,
  images: InlineImage[],
  model = getGeminiModel(),
): Promise<{ imageUrl: string; model: string }> {
  const parts: Array<{ text?: string; inline_data?: { mime_type: string; data: string } }> = [
    { text: prompt },
  ];

  for (const img of images) {
    parts.push({ inline_data: { mime_type: img.mimeType, data: img.base64 } });
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const timeoutMs = Number(process.env.GEMINI_REQUEST_TIMEOUT_MS || 120_000);

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts }],
      generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });

  const json = (await res.json()) as Record<string, unknown>;

  if (!res.ok) {
    const err = json.error as { message?: string } | undefined;
    throw new Error(err?.message || `Gemini API error (${res.status})`);
  }

  const imageUrl = extractImageFromResponse(json);
  if (!imageUrl) throw new Error('Gemini did not return an image.');

  return { imageUrl, model };
}

export async function callGeminiWithImagesRetry(
  apiKey: string,
  prompt: string,
  images: InlineImage[],
): Promise<{ imageUrl: string; model: string }> {
  const primary = getGeminiModel();
  try {
    return await callGeminiWithImages(apiKey, prompt, images, primary);
  } catch (primaryErr) {
    if (primary === FALLBACK_MODEL) throw primaryErr;
    try {
      return await callGeminiWithImages(apiKey, prompt, images, FALLBACK_MODEL);
    } catch {
      throw primaryErr;
    }
  }
}

export function inlineFromDataUrl(dataUrl: string): InlineImage {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error('Invalid image data URL from Gemini');
  return { mimeType: match[1], base64: match[2] };
}
