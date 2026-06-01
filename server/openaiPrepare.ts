import sharp from 'sharp';
import type { SceneAnchor } from './pipeline/types';
import type { InlineImage } from './portraitTypes';

export const OPENAI_CANVAS = {
  width: 1536,
  height: 1024,
} as const;

export function parseOpenAiSize(): { width: number; height: number } {
  const raw = process.env.OPENAI_IMAGE_SIZE || '1536x1024';
  const m = raw.match(/^(\d+)x(\d+)$/);
  if (m) return { width: Number(m[1]), height: Number(m[2]) };
  return { ...OPENAI_CANVAS };
}

export async function resizeSceneForOpenAI(sceneBuf: Buffer): Promise<{
  buffer: Buffer;
  width: number;
  height: number;
  scaleX: number;
  scaleY: number;
}> {
  const { width, height } = parseOpenAiSize();
  const resized = await sharp(sceneBuf)
    .resize(width, height, { fit: 'cover', position: 'centre' })
    .png()
    .toBuffer();

  const meta = await sharp(sceneBuf).metadata();
  const srcW = meta.width ?? width;
  const srcH = meta.height ?? height;

  return {
    buffer: resized,
    width,
    height,
    scaleX: width / srcW,
    scaleY: height / srcH,
  };
}

export function scaleAnchor(anchor: SceneAnchor, scaleX: number, scaleY: number): SceneAnchor {
  const scaleBox = (b: typeof anchor.centerFace.box) => ({
    x: b.x * scaleX,
    y: b.y * scaleY,
    width: b.width * scaleX,
    height: b.height * scaleY,
  });
  const scalePoint = (p: { x: number; y: number }) => ({ x: p.x * scaleX, y: p.y * scaleY });
  const lm = anchor.centerFace.landmarks;

  return {
    ...anchor,
    imageWidth: Math.round(anchor.imageWidth * scaleX),
    imageHeight: Math.round(anchor.imageHeight * scaleY),
    centerFace: {
      ...anchor.centerFace,
      box: scaleBox(anchor.centerFace.box),
      landmarks: {
        leftEye: scalePoint(lm.leftEye),
        rightEye: scalePoint(lm.rightEye),
        nose: scalePoint(lm.nose),
        mouth: scalePoint(lm.mouth),
        jaw: scalePoint(lm.jaw),
      },
    },
    skinSample: {
      x: Math.round(anchor.skinSample.x * scaleX),
      y: Math.round(anchor.skinSample.y * scaleY),
      width: Math.round(anchor.skinSample.width * scaleX),
      height: Math.round(anchor.skinSample.height * scaleY),
    },
  };
}

export function bufferToInline(buf: Buffer, mime = 'image/png'): InlineImage {
  return { mimeType: mime, base64: buf.toString('base64') };
}
