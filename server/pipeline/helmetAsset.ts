import sharp from 'sharp';

const WHITE_THRESHOLD = Number(process.env.HELMET_WHITE_THRESHOLD || 235);
const WHITE_SOFTNESS = Number(process.env.HELMET_WHITE_SOFTNESS || 18);

/**
 * Remove studio white/light-gray background from product-shot helmets.
 * True PNG transparency is preserved when already present.
 */
export async function prepareHelmetAsset(helmetBuffer: Buffer): Promise<Buffer> {
  const { data, info } = await sharp(helmetBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const channels = info.channels;
  const pixels = info.width * info.height;
  const out = Buffer.from(data);

  for (let i = 0; i < pixels; i++) {
    const o = i * channels;
    const r = out[o];
    const g = out[o + 1];
    const b = out[o + 2];
    const a = channels === 4 ? out[o + 3] : 255;

    const minRgb = Math.min(r, g, b);
    const maxRgb = Math.max(r, g, b);
    const avg = (r + g + b) / 3;
    const saturation = maxRgb === 0 ? 0 : (maxRgb - minRgb) / maxRgb;

    // Near-white, low-saturation background (typical product photography)
    const isWhiteBg =
      avg >= WHITE_THRESHOLD && saturation < 0.22 && minRgb >= WHITE_THRESHOLD - WHITE_SOFTNESS;

    if (isWhiteBg) {
      out[o + 3] = 0;
      continue;
    }

    // Soft edge on off-white fringe
    if (avg >= WHITE_THRESHOLD - WHITE_SOFTNESS && saturation < 0.28) {
      const t = (avg - (WHITE_THRESHOLD - WHITE_SOFTNESS)) / WHITE_SOFTNESS;
      out[o + 3] = Math.round(a * (1 - Math.min(1, t)));
    }
  }

  const trimmed = await sharp(out, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .trim({ threshold: 10 })
    .png()
    .toBuffer()
    .catch(() =>
      sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } })
        .png()
        .toBuffer(),
    );

  return trimmed;
}
