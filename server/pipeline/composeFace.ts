import sharp from 'sharp';
import { alignFaceOntoScene, buildFaceMaskSvg, buildNeckBlendSvg } from './alignFace';
import type { FaceDetection, SceneAnchor } from './types';

export async function compositeFace(
  sceneBuffer: Buffer,
  alignedFaceBuffer: Buffer,
  anchor: SceneAnchor,
): Promise<Buffer> {
  const maskSvg = buildFaceMaskSvg(anchor);
  const neckSvg = buildNeckBlendSvg(anchor);

  const faceMask = await sharp(Buffer.from(maskSvg)).png().toBuffer();
  const neckMask = await sharp(Buffer.from(neckSvg)).png().toBuffer();

  const maskedFace = await sharp(alignedFaceBuffer)
    .ensureAlpha()
    .composite([{ input: faceMask, blend: 'dest-in' }])
    .png()
    .toBuffer();

  const withNeckFeather = await sharp(maskedFace)
    .composite([{ input: neckMask, blend: 'over' }])
    .png()
    .toBuffer();

  return sharp(sceneBuffer)
    .composite([{ input: withNeckFeather, blend: 'over' }])
    .png()
    .toBuffer();
}

export async function swapFace(
  sceneBuffer: Buffer,
  selfieBuffer: Buffer,
  selfieFace: FaceDetection,
  anchor: SceneAnchor,
  scaleMultiplier = 1,
): Promise<Buffer> {
  const aligned = await alignFaceOntoScene(
    selfieBuffer,
    selfieFace.landmarks,
    anchor,
    scaleMultiplier,
    selfieFace,
  );
  return compositeFace(sceneBuffer, aligned, anchor);
}
