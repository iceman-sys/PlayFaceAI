export type CompressOptions = {
  maxDimension?: number;
  maxBytes?: number;
  quality?: number;
};

const DEFAULTS: Required<CompressOptions> = {
  maxDimension: 1280,
  maxBytes: 450_000,
  quality: 0.82,
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load image'));
    img.src = src;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Compression failed'))),
      'image/jpeg',
      quality,
    );
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Could not read compressed image'));
    reader.readAsDataURL(blob);
  });
}

async function compressImageElement(
  img: HTMLImageElement,
  options: CompressOptions = {},
): Promise<string> {
  const { maxDimension, maxBytes, quality: startQuality } = { ...DEFAULTS, ...options };

  const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');
  ctx.drawImage(img, 0, 0, w, h);

  let quality = startQuality;
  let blob = await canvasToBlob(canvas, quality);

  while (blob.size > maxBytes && quality > 0.45) {
    quality -= 0.08;
    blob = await canvasToBlob(canvas, quality);
  }

  if (blob.size > maxBytes) {
    throw new Error(
      `Image still too large after compression (${Math.round(blob.size / 1024)}KB). Try a closer crop or smaller photo.`,
    );
  }

  return blobToDataUrl(blob);
}

/** Resize and compress a selfie file so edge/API payloads stay under gateway limits. */
export async function compressImageFile(
  file: File,
  options: CompressOptions = {},
): Promise<string> {
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Image must be under 10MB');
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(objectUrl);
    return compressImageElement(img, options);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/** Compress a data URL (e.g. from camera capture) before sending to edge functions. */
export async function compressDataUrl(
  dataUrl: string,
  options: CompressOptions = {},
): Promise<string> {
  const img = await loadImage(dataUrl);
  return compressImageElement(img, options);
}

export function estimatePayloadKb(dataUrl: string): number {
  return Math.round(dataUrl.length / 1024);
}
