import { inlineToBuffer, mimeToFilename } from './imageUtils';
import { parseOpenAiSize } from './openaiPrepare';
import type { InlineImage } from './portraitTypes';

const DEFAULT_MODEL = 'gpt-image-1';
const DEFAULT_QUALITY = 'high';

type OpenAIImageResponse = {
  data?: Array<{ b64_json?: string; url?: string }>;
  error?: { message?: string; type?: string; code?: string };
};

function appendImageBlob(form: FormData, inline: InlineImage, name: string) {
  const buf = inlineToBuffer(inline);
  form.append('image[]', new Blob([buf], { type: inline.mimeType }), mimeToFilename(inline.mimeType, name));
}

export async function callOpenAiImageEdit(opts: {
  apiKey: string;
  prompt: string;
  images: InlineImage[];
  mask?: Buffer;
  model?: string;
  quality?: string;
}): Promise<Buffer> {
  const model = opts.model || process.env.OPENAI_IMAGE_MODEL || DEFAULT_MODEL;
  const quality = opts.quality || process.env.OPENAI_IMAGE_QUALITY || DEFAULT_QUALITY;
  const { width, height } = parseOpenAiSize();
  const size = `${width}x${height}`;
  const openaiTimeoutMs = Number(process.env.OPENAI_REQUEST_TIMEOUT_MS || 120_000);

  let lastErr: Error | null = null;

  for (let attempt = 1; attempt <= 2; attempt++) {
    const form = new FormData();
    form.append('model', model);
    form.append('prompt', opts.prompt);
    form.append('n', '1');
    form.append('size', size);
    form.append('quality', quality);
    form.append('input_fidelity', 'high');

    for (let i = 0; i < opts.images.length; i++) {
      appendImageBlob(form, opts.images[i], `image-${i}`);
    }

    if (opts.mask) {
      form.append('mask', new Blob([opts.mask], { type: 'image/png' }), 'mask.png');
    }

    try {
      const res = await fetch('https://api.openai.com/v1/images/edits', {
        method: 'POST',
        headers: { Authorization: `Bearer ${opts.apiKey}` },
        body: form,
        signal: AbortSignal.timeout(openaiTimeoutMs),
      });

      const json = (await res.json()) as OpenAIImageResponse;
      if (!res.ok) {
        throw new Error(json.error?.message || `OpenAI API error (${res.status})`);
      }

      const b64 = json.data?.[0]?.b64_json;
      if (b64) return Buffer.from(b64, 'base64');

      const url = json.data?.[0]?.url;
      if (url) {
        const imgRes = await fetch(url, { signal: AbortSignal.timeout(30_000) });
        if (!imgRes.ok) throw new Error('OpenAI returned an image URL that could not be fetched');
        return Buffer.from(await imgRes.arrayBuffer());
      }

      throw new Error('OpenAI did not return an image.');
    } catch (err) {
      lastErr = err instanceof Error ? err : new Error(String(err));
      const retryable =
        lastErr.message.includes('ECONNRESET') ||
        lastErr.message.includes('fetch failed') ||
        lastErr.message.includes('timeout');
      if (attempt < 2 && retryable) {
        console.warn(`[openai] attempt ${attempt} failed, retrying:`, lastErr.message);
        await new Promise((r) => setTimeout(r, 1500));
        continue;
      }
      throw lastErr;
    }
  }

  throw lastErr ?? new Error('OpenAI request failed');
}
