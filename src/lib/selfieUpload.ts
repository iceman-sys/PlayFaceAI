const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic']);

function dataUrlToBlob(dataUrl: string): Blob {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error('Invalid image data');
  const mime = match[1];
  const binary = atob(match[2]);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

async function requestSignedUploadUrl(contentType: string, size: number): Promise<{
  signedUrl: string;
  path: string;
}> {
  const { supabase } = await import('@/lib/supabase');
  const { data, error } = await supabase.functions.invoke('selfie-upload-url', {
    body: { contentType, size },
  });

  if (error) {
    throw new Error(error.message || 'Could not prepare selfie upload');
  }

  const payload = data as { signedUrl?: string; path?: string; error?: string } | null;
  if (!payload?.signedUrl || !payload?.path) {
    throw new Error(payload?.error || 'Invalid upload URL response');
  }

  return { signedUrl: payload.signedUrl, path: payload.path };
}

async function putToSignedUrl(signedUrl: string, blob: Blob, contentType: string): Promise<void> {
  const res = await fetch(signedUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: blob,
  });

  if (!res.ok) {
    throw new Error(`Selfie upload failed (${res.status})`);
  }
}

/** Upload selfie to private Storage — edge function reads by path only (small JSON). */
export async function uploadSelfieDataUrl(dataUrl: string): Promise<string> {
  const blob = dataUrlToBlob(dataUrl);
  const contentType = blob.type || 'image/jpeg';

  if (!ALLOWED_TYPES.has(contentType)) {
    throw new Error('Unsupported image type — use JPG or PNG');
  }

  if (blob.size > 10 * 1024 * 1024) {
    throw new Error('Photo is too large. Use a closer crop or retake your selfie.');
  }

  const { signedUrl, path } = await requestSignedUploadUrl(contentType, blob.size);
  await putToSignedUrl(signedUrl, blob, contentType);
  return path;
}
