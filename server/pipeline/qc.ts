import sharp from 'sharp';
import { eyeDistance } from './faceDetect';
import type { FaceDetection, QcResult, SceneAnchor } from './types';

function clampRegion(
  region: { x: number; y: number; width: number; height: number },
  maxW: number,
  maxH: number,
) {
  const x = Math.max(0, Math.min(maxW - 1, Math.round(region.x)));
  const y = Math.max(0, Math.min(maxH - 1, Math.round(region.y)));
  const width = Math.max(1, Math.min(maxW - x, Math.round(region.width)));
  const height = Math.max(1, Math.min(maxH - y, Math.round(region.height)));
  return { left: x, top: y, width, height };
}

async function avgRgb(
  buffer: Buffer,
  region: { x: number; y: number; width: number; height: number },
): Promise<number> {
  const meta = await sharp(buffer).metadata();
  const safe = clampRegion(region, meta.width ?? 1, meta.height ?? 1);
  const { data } = await sharp(buffer)
    .extract(safe)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let sum = 0;
  for (let i = 0; i < data.length; i += 3) {
    sum += (data[i] + data[i + 1] + data[i + 2]) / 3;
  }
  return sum / (data.length / 3);
}

export async function runQualityCheck(
  outputBuffer: Buffer,
  sceneBuffer: Buffer,
  anchor: SceneAnchor,
  selfieFace: FaceDetection,
): Promise<QcResult> {
  const issues: string[] = [];
  const targetLm = anchor.centerFace.landmarks;
  const headScaleRatio = eyeDistance(selfieFace.landmarks) / eyeDistance(targetLm);

  const faceRegion = {
    x: Math.round(anchor.centerFace.box.x),
    y: Math.round(anchor.centerFace.box.y),
    width: Math.round(anchor.centerFace.box.width),
    height: Math.round(anchor.centerFace.box.height),
  };

  const faceTone = await avgRgb(outputBuffer, faceRegion);
  const refTone = await avgRgb(sceneBuffer, anchor.skinSample);
  const skinToneDelta = Math.abs(faceTone - refTone);

  if (headScaleRatio > 1.12) issues.push('head_oversized');
  if (headScaleRatio < 0.78) issues.push('head_undersized');
  if (skinToneDelta > 45) issues.push('skin_tone_mismatch');
  if (selfieFace.score < 0.5) issues.push('low_selfie_confidence');

  return {
    pass: issues.length === 0,
    headScaleRatio,
    skinToneDelta,
    issues,
  };
}

export function shouldRetry(qc: QcResult, attempt: number): boolean {
  if (attempt >= 2) return false;
  return qc.issues.includes('head_oversized') || qc.issues.includes('head_undersized');
}
