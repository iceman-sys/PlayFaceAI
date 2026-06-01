import sharp from 'sharp';
import { prepareHelmetAsset } from './helmetAsset';
import type { SceneAnchor } from './types';

export async function applyHeadgear(
  compositeBuffer: Buffer,
  helmetBuffer: Buffer,
  anchor: SceneAnchor,
): Promise<Buffer> {
  const helmetPrepared = await prepareHelmetAsset(helmetBuffer);
  const { landmarks, box } = anchor.centerFace;
  const eyeMidY = (landmarks.leftEye.y + landmarks.rightEye.y) / 2;
  const targetWidth = Math.round(box.width * anchor.helmet.widthRatio);

  const helmetResized = await sharp(helmetPrepared)
    .resize({ width: targetWidth, fit: 'inside' })
    .ensureAlpha()
    .png()
    .toBuffer();

  const meta = await sharp(helmetResized).metadata();
  const helmetW = meta.width ?? targetWidth;
  const helmetH = meta.height ?? targetWidth;

  const centerX = (landmarks.leftEye.x + landmarks.rightEye.x) / 2;
  const left = Math.round(centerX - helmetW / 2);
  const top = Math.round(eyeMidY - helmetH * anchor.helmet.topOffsetRatio);

  const shadowSvg = `<svg width="${anchor.imageWidth}" height="${anchor.imageHeight}" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="${centerX}" cy="${eyeMidY + box.height * 0.08}" rx="${box.width * 0.35}" ry="${box.height * 0.06}" fill="black" opacity="0.18"/>
  </svg>`;

  const withShadow = await sharp(compositeBuffer)
    .composite([{ input: Buffer.from(shadowSvg), blend: 'over' }])
    .png()
    .toBuffer();

  return sharp(withShadow)
    .composite([{ input: helmetResized, left, top, blend: 'over' }])
    .png()
    .toBuffer();
}
