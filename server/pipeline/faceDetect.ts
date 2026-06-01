/** Lightweight face geometry — client validates selfies; server uses anchors + estimates. */
import { Canvas, Image } from '@napi-rs/canvas';
import type { FaceDetection, FaceLandmarks, Point } from './types';

function loadImage(buffer: Buffer): Promise<Image> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not decode image'));
    img.src = buffer;
  });
}

export function bboxToLandmarks(box: {
  x: number;
  y: number;
  width: number;
  height: number;
}): FaceLandmarks {
  const { x, y, width, height } = box;
  return {
    leftEye: { x: x + width * 0.32, y: y + height * 0.38 },
    rightEye: { x: x + width * 0.68, y: y + height * 0.38 },
    nose: { x: x + width * 0.5, y: y + height * 0.52 },
    mouth: { x: x + width * 0.5, y: y + height * 0.72 },
    jaw: { x: x + width * 0.5, y: y + height * 0.92 },
  };
}

export function estimateSelfieLandmarks(width: number, height: number): FaceLandmarks {
  return bboxToLandmarks({
    x: width * 0.08,
    y: height * 0.08,
    width: width * 0.84,
    height: height * 0.84,
  });
}

/** Center-player face box for group/squad photos (five players in a row). */
export function estimateCenterFaceBox(imageWidth: number, imageHeight: number) {
  const width = imageWidth * 0.122;
  const height = imageHeight * 0.22;
  const x = imageWidth * 0.5 - width / 2;
  const y = imageHeight * 0.118;
  return { x, y, width, height };
}

export async function detectOrEstimateSelfie(buffer: Buffer): Promise<FaceDetection> {
  const img = await loadImage(buffer);
  const box = {
    x: img.width * 0.06,
    y: img.height * 0.06,
    width: img.width * 0.88,
    height: img.height * 0.88,
  };
  return {
    box,
    landmarks: bboxToLandmarks(box),
    score: 0.85,
  };
}

export async function detectCenterFace(
  buffer: Buffer,
  imageWidth: number,
): Promise<FaceDetection | null> {
  const img = await loadImage(buffer);
  const w = imageWidth || img.width;
  const h = img.height;
  const box = estimateCenterFaceBox(w, h);
  return {
    box,
    landmarks: bboxToLandmarks(box),
    score: 0.8,
  };
}

export function eyeDistance(lm: FaceLandmarks): number {
  const dx = lm.rightEye.x - lm.leftEye.x;
  const dy = lm.rightEye.y - lm.leftEye.y;
  return Math.hypot(dx, dy);
}

export function eyeAngle(lm: FaceLandmarks): number {
  return Math.atan2(lm.rightEye.y - lm.leftEye.y, lm.rightEye.x - lm.leftEye.x);
}

export function faceCenter(lm: FaceLandmarks): Point {
  return {
    x: (lm.leftEye.x + lm.rightEye.x) / 2,
    y: (lm.leftEye.y + lm.rightEye.y) / 2,
  };
}
