import sharp from 'sharp';
import type { SceneAnchor } from './types';

function ellDist(x: number, y: number, cx: number, cy: number, rx: number, ry: number): number {
  const dx = (x - cx) / Math.max(rx, 1);
  const dy = (y - cy) / Math.max(ry, 1);
  return Math.sqrt(dx * dx + dy * dy);
}

/** OpenAI edit masks: alpha 0 = editable, alpha 255 = preserve. */
export async function buildOpenAiEditMask(
  anchor: SceneAnchor,
  region: 'face' | 'headgear' | 'harmonize',
): Promise<Buffer> {
  const w = anchor.imageWidth;
  const h = anchor.imageHeight;
  const { box, landmarks } = anchor.centerFace;
  const cx = (landmarks.leftEye.x + landmarks.rightEye.x) / 2;
  const eyeY = (landmarks.leftEye.y + landmarks.rightEye.y) / 2;

  let cy = (landmarks.nose.y + landmarks.mouth.y) / 2;
  let rx = box.width * 0.5;
  let ry = box.height * 0.62;
  let feather = 0.18;

  if (region === 'headgear') {
    cy = eyeY - box.height * 0.05;
    rx = box.width * 0.58;
    ry = box.height * 0.42;
    feather = 0.12;
  } else if (region === 'harmonize') {
    cy = (landmarks.nose.y + landmarks.jaw.y) / 2;
    rx = box.width * 0.52;
    ry = box.height * 0.72;
    feather = 0.15;
  }

  const raw = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const d = ellDist(x, y, cx, cy, rx, ry);
      let alpha = 255;
      if (d <= 1) {
        alpha = 0;
      } else if (d < 1 + feather) {
        alpha = Math.round(((d - 1) / feather) * 255);
      }
      raw[i] = 0;
      raw[i + 1] = 0;
      raw[i + 2] = 0;
      raw[i + 3] = alpha;
    }
  }

  return sharp(raw, { raw: { width: w, height: h, channels: 4 } })
    .png()
    .toBuffer();
}
