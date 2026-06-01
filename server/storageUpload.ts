import { randomUUID } from 'node:crypto';
import { dataUrlToBase64Payload } from './imageUtils';

const UPLOAD_TIMEOUT_MS = Number(process.env.STORAGE_UPLOAD_TIMEOUT_MS || 25_000);

/** Upload generated PNG to Supabase Storage. Returns null on any failure (never throws). */
export async function uploadResultImage(
  dataUrl: string,
  generationId?: string,
): Promise<string | null> {
  const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, '');
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'campaign-results';

  if (!supabaseUrl || !serviceKey) {
    console.warn('[storage] skipped — SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set');
    return null;
  }

  const parsed = dataUrlToBase64Payload(dataUrl);
  if (!parsed) {
    console.warn('[storage] skipped — invalid image data URL');
    return null;
  }

  const path = `results/${generationId || randomUUID()}.png`;
  const body = Buffer.from(parsed.base64, 'base64');
  const url = `${supabaseUrl}/storage/v1/object/${bucket}/${path}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'image/png',
        'x-upsert': 'true',
      },
      body,
      signal: AbortSignal.timeout(UPLOAD_TIMEOUT_MS),
    });

    if (!res.ok) {
      console.warn('[storage] upload failed:', res.status, await res.text());
      return null;
    }

    return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(
      `[storage] upload unreachable (${supabaseUrl}) — using inline image fallback:`,
      message,
    );
    return null;
  }
}
