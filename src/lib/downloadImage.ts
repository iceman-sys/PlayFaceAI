export type DownloadImageOptions = {
  filenameBase?: string;
};

function slugifyFilename(base: string): string {
  const slug = base
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9-_]/g, '')
    .toLowerCase();
  return slug || 'swaarm-campaign';
}

function extensionFromMime(mime: string): string {
  if (mime.includes('png')) return 'png';
  if (mime.includes('webp')) return 'webp';
  if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg';
  return 'png';
}

function parseDataUrl(dataUrl: string): { mime: string; bytes: Uint8Array } | null {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  const mime = match[1];
  const binary = atob(match[2]);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return { mime, bytes };
}

function triggerBlobDownload(blob: Blob, filename: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.rel = 'noopener';
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 2000);
}

function downloadFromDataUrl(dataUrl: string, filename: string): void {
  const parsed = parseDataUrl(dataUrl);
  if (!parsed) {
    throw new Error('Invalid image format');
  }
  const ext = extensionFromMime(parsed.mime);
  const name = filename.includes('.') ? filename : `${filename}.${ext}`;
  triggerBlobDownload(new Blob([parsed.bytes], { type: parsed.mime }), name);
}

async function fetchImageBlob(url: string): Promise<Blob> {
  const res = await fetch(url, { mode: 'cors', credentials: 'omit' });
  if (!res.ok) {
    throw new Error(`Could not fetch image (${res.status})`);
  }
  const blob = await res.blob();
  if (!blob.type.startsWith('image/')) {
    return new Blob([await blob.arrayBuffer()], { type: 'image/png' });
  }
  return blob;
}

async function downloadViaCanvas(imageUrl: string, filename: string): Promise<void> {
  const img = new Image();
  img.crossOrigin = 'anonymous';

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Image could not be loaded for download'));
    img.src = imageUrl;
  });

  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');
  ctx.drawImage(img, 0, 0);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Could not export image'))),
      'image/png',
      0.95,
    );
  });

  const name = filename.endsWith('.png') ? filename : `${filename.replace(/\.[^.]+$/, '')}.png`;
  triggerBlobDownload(blob, name);
}

/**
 * Download a campaign result image (data URL, blob URL, or remote HTTPS).
 */
export async function downloadImage(
  imageUrl: string,
  options: DownloadImageOptions = {},
): Promise<void> {
  const base = slugifyFilename(options.filenameBase ?? 'swaarm-campaign');
  const defaultName = `swaarm-${base}.png`;

  if (!imageUrl?.trim()) {
    throw new Error('No image to download');
  }

  if (imageUrl.startsWith('data:')) {
    downloadFromDataUrl(imageUrl, defaultName);
    return;
  }

  if (imageUrl.startsWith('blob:')) {
    try {
      const blob = await fetch(imageUrl).then((r) => r.blob());
      const ext = extensionFromMime(blob.type || 'image/png');
      triggerBlobDownload(blob, `swaarm-${base}.${ext}`);
      return;
    } catch {
      throw new Error('Could not download image');
    }
  }

  try {
    const blob = await fetchImageBlob(imageUrl);
    const ext = extensionFromMime(blob.type || 'image/png');
    triggerBlobDownload(blob, `swaarm-${base}.${ext}`);
    return;
  } catch {
    // CORS or CDN blocked direct fetch — draw to canvas if the image allows crossOrigin
  }

  try {
    await downloadViaCanvas(imageUrl, defaultName);
  } catch {
    // Last resort: open in new tab so user can save manually
    const opened = window.open(imageUrl, '_blank', 'noopener,noreferrer');
    if (!opened) {
      throw new Error(
        'Download blocked. Allow pop-ups for this site, or long-press the image to save.',
      );
    }
  }
}
