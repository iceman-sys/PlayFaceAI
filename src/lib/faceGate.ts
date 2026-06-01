import * as tf from '@tensorflow/tfjs';
import * as faceapi from '@vladmandic/face-api';

let modelsReady: Promise<void> | null = null;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load image'));
    img.src = src;
  });
}

async function ensureModels(): Promise<void> {
  if (modelsReady) return modelsReady;

  modelsReady = (async () => {
    await tf.setBackend('webgl');
    await tf.ready();
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
      faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
    ]);
  })();

  return modelsReady;
}

function isFrontal(
  det: faceapi.WithFaceLandmarks<{ detection: faceapi.FaceDetection }>,
): boolean {
  const lm = det.landmarks;
  const leftEye = lm.getLeftEye();
  const rightEye = lm.getRightEye();
  const nose = lm.getNose();

  const eyeDy = Math.abs(leftEye[0].y - rightEye[0].y);
  const eyeDx = Math.abs(leftEye[0].x - rightEye[0].x);
  const tilt = eyeDy / Math.max(eyeDx, 1);

  const eyeMidX = (leftEye[0].x + rightEye[0].x) / 2;
  const noseX = nose[3]?.x ?? nose[0].x;
  const noseOffset = Math.abs(noseX - eyeMidX) / Math.max(eyeDx, 1);

  return tilt < 0.18 && noseOffset < 0.22;
}

function cropFaceToDataUrl(
  img: HTMLImageElement,
  box: faceapi.FaceDetection,
  padding = 0.38,
): string {
  const padX = box.width * padding;
  const padY = box.height * padding;
  const x = Math.max(0, Math.floor(box.x - padX));
  const y = Math.max(0, Math.floor(box.y - padY));
  const w = Math.min(img.width - x, Math.ceil(box.width + padX * 2));
  const h = Math.min(img.height - y, Math.ceil(box.height + padY * 2));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');
  ctx.drawImage(img, x, y, w, h, 0, 0, w, h);
  return canvas.toDataURL('image/jpeg', 0.9);
}

export type SelfieValidation = {
  ok: boolean;
  message?: string;
};

/** Validate, crop, and prepare a selfie for the compositing pipeline. */
export async function prepareSelfieForGeneration(dataUrl: string): Promise<string> {
  try {
    await ensureModels();
  } catch {
    return dataUrl;
  }

  const img = await loadImage(dataUrl);
  const detector = new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.45 });
  const faces = await faceapi.detectAllFaces(img, detector).withFaceLandmarks();

  if (!faces.length) {
    throw new Error('No face found. Face the camera with one person in frame.');
  }

  if (faces.length > 1) {
    throw new Error('Multiple faces detected. Use a solo selfie.');
  }

  const det = faces[0];
  if (det.detection.score < 0.5) {
    throw new Error('Face is unclear. Move closer and use better lighting.');
  }

  if (!isFrontal(det)) {
    throw new Error('Look straight at the camera — avoid side angles.');
  }

  const box = det.detection.box;
  const faceArea = box.width * box.height;
  const frameArea = img.width * img.height;
  const ratio = faceArea / frameArea;

  if (ratio < 0.06) {
    throw new Error('Move closer so your face fills more of the frame.');
  }
  if (ratio > 0.75) {
    throw new Error('Move back slightly — face is too close.');
  }

  // Soft hint: neutral expressions work but a slight smile matches the squad photo better
  const mouth = det.landmarks.getMouth();
  const mouthWidth = Math.hypot(mouth[6].x - mouth[0].x, mouth[6].y - mouth[0].y);
  const mouthOpen = Math.abs(mouth[3].y - mouth[9].y) / Math.max(mouthWidth, 1);
  if (mouthOpen < 0.08) {
    // allow — many selfies are neutral; no throw
  }

  return cropFaceToDataUrl(img, box);
}

export async function validateSelfie(dataUrl: string): Promise<SelfieValidation> {
  try {
    await prepareSelfieForGeneration(dataUrl);
    return { ok: true };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Invalid selfie' };
  }
}
