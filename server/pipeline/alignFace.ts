import { Canvas, Image } from '@napi-rs/canvas';
import sharp from 'sharp';
import {
  eyeAngle,
  eyeDistance,
  faceCenter,
} from './faceDetect';
import type { FaceDetection, FaceLandmarks, SceneAnchor } from './types';

const FACE_SCALE = Number(process.env.PIPELINE_FACE_SCALE || 0.97);

function loadImage(buffer: Buffer): Promise<Image> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load image for alignment'));
    img.src = buffer;
  });
}

export async function alignFaceOntoScene(
  selfieBuffer: Buffer,
  selfieLandmarks: FaceLandmarks,
  anchor: SceneAnchor,
  scaleMultiplier = 1,
  selfieFace?: FaceDetection,
): Promise<Buffer> {
  const sceneW = anchor.imageWidth;
  const sceneH = anchor.imageHeight;
  const targetLm = anchor.centerFace.landmarks;

  let faceBuffer = selfieBuffer;
  let srcLm = selfieLandmarks;

  if (selfieFace) {
    const pad = 0.35;
    const { box } = selfieFace;
    const meta = await sharp(selfieBuffer).metadata();
    const imgW = meta.width ?? 1;
    const imgH = meta.height ?? 1;
    const left = Math.max(0, Math.floor(box.x - box.width * pad));
    const top = Math.max(0, Math.floor(box.y - box.height * pad));
    const width = Math.min(imgW - left, Math.ceil(box.width * (1 + pad * 2)));
    const height = Math.min(imgH - top, Math.ceil(box.height * (1 + pad * 2)));

    faceBuffer = await sharp(selfieBuffer)
      .extract({ left, top, width, height })
      .png()
      .toBuffer();

    srcLm = {
      leftEye: { x: selfieLandmarks.leftEye.x - left, y: selfieLandmarks.leftEye.y - top },
      rightEye: { x: selfieLandmarks.rightEye.x - left, y: selfieLandmarks.rightEye.y - top },
      nose: { x: selfieLandmarks.nose.x - left, y: selfieLandmarks.nose.y - top },
      mouth: { x: selfieLandmarks.mouth.x - left, y: selfieLandmarks.mouth.y - top },
      jaw: { x: selfieLandmarks.jaw.x - left, y: selfieLandmarks.jaw.y - top },
    };
  }

  const srcDist = eyeDistance(srcLm);
  const tgtDist = eyeDistance(targetLm);
  const scale = (tgtDist / srcDist) * FACE_SCALE * scaleMultiplier;
  const rotation = eyeAngle(targetLm) - eyeAngle(srcLm);

  const srcCenter = faceCenter(srcLm);
  const tgtCenter = faceCenter(targetLm);

  const selfieImg = await loadImage(faceBuffer);
  const canvas = new Canvas(sceneW, sceneH);
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, sceneW, sceneH);
  ctx.save();
  ctx.translate(tgtCenter.x, tgtCenter.y);
  ctx.rotate(rotation);
  ctx.scale(scale, scale);
  ctx.drawImage(selfieImg, -srcCenter.x, -srcCenter.y);
  ctx.restore();

  return canvas.toBuffer('image/png');
}

export function buildFaceMaskSvg(anchor: SceneAnchor, feather = 22): string {
  const { box, landmarks } = anchor.centerFace;
  const cx = (landmarks.leftEye.x + landmarks.rightEye.x) / 2;
  const cy = (landmarks.nose.y + landmarks.mouth.y) / 2;
  const rx = box.width * 0.48;
  const ry = box.height * 0.58;

  return `<svg width="${anchor.imageWidth}" height="${anchor.imageHeight}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="blur"><feGaussianBlur stdDeviation="${feather}"/></filter>
    </defs>
    <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="white" filter="url(#blur)"/>
  </svg>`;
}

export function buildNeckBlendSvg(anchor: SceneAnchor): string {
  const { box, landmarks } = anchor.centerFace;
  const x = box.x + box.width * 0.15;
  const y = landmarks.jaw.y - box.height * 0.05;
  const w = box.width * 0.7;
  const h = box.height * 0.25;
  return `<svg width="${anchor.imageWidth}" height="${anchor.imageHeight}" xmlns="http://www.w3.org/2000/svg">
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="white" opacity="0.35"/>
  </svg>`;
}
