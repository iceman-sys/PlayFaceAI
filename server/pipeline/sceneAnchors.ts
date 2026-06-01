import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { detectCenterFace } from './faceDetect';
import type { SceneAnchor } from './types';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ANCHOR_PATH = path.join(__dirname, '..', 'assets', 'scene-anchor.json');

let cachedAnchor: SceneAnchor | null = null;

function loadStaticAnchor(): SceneAnchor | null {
  if (cachedAnchor) return cachedAnchor;
  if (!fs.existsSync(ANCHOR_PATH)) return null;
  try {
    cachedAnchor = JSON.parse(fs.readFileSync(ANCHOR_PATH, 'utf8')) as SceneAnchor;
    return cachedAnchor;
  } catch {
    return null;
  }
}

function anchorFromDetection(
  sceneId: string,
  width: number,
  height: number,
  face: NonNullable<Awaited<ReturnType<typeof detectCenterFace>>>,
): SceneAnchor {
  const jawY = face.landmarks.jaw.y;
  return {
    sceneId,
    imageWidth: width,
    imageHeight: height,
    centerFace: face,
    skinSample: {
      x: Math.max(0, Math.round(face.box.x + face.box.width * 0.25)),
      y: Math.min(height - 20, Math.round(jawY + face.box.height * 0.15)),
      width: Math.round(face.box.width * 0.5),
      height: Math.round(face.box.height * 0.2),
    },
    helmet: { widthRatio: 1.38, topOffsetRatio: 0.52 },
  };
}

export async function resolveSceneAnchor(
  sceneBuffer: Buffer,
  sceneId: string,
  useStatic = true,
): Promise<SceneAnchor> {
  const meta = await sharp(sceneBuffer).metadata();
  const width = meta.width ?? 1536;
  const height = meta.height ?? 1024;

  if (useStatic && sceneId === 'squad-celebration') {
    const staticAnchor = loadStaticAnchor();
    if (staticAnchor) {
      if (staticAnchor.imageWidth === width && staticAnchor.imageHeight === height) {
        return staticAnchor;
      }
      const sx = width / staticAnchor.imageWidth;
      const sy = height / staticAnchor.imageHeight;
      const scaleBox = (b: typeof staticAnchor.centerFace.box) => ({
        x: b.x * sx,
        y: b.y * sy,
        width: b.width * sx,
        height: b.height * sy,
      });
      const scalePoint = (p: { x: number; y: number }) => ({ x: p.x * sx, y: p.y * sy });
      const lm = staticAnchor.centerFace.landmarks;
      return {
        ...staticAnchor,
        imageWidth: width,
        imageHeight: height,
        centerFace: {
          ...staticAnchor.centerFace,
          box: scaleBox(staticAnchor.centerFace.box),
          landmarks: {
            leftEye: scalePoint(lm.leftEye),
            rightEye: scalePoint(lm.rightEye),
            nose: scalePoint(lm.nose),
            mouth: scalePoint(lm.mouth),
            jaw: scalePoint(lm.jaw),
          },
        },
        skinSample: {
          x: Math.round(staticAnchor.skinSample.x * sx),
          y: Math.round(staticAnchor.skinSample.y * sy),
          width: Math.round(staticAnchor.skinSample.width * sx),
          height: Math.round(staticAnchor.skinSample.height * sy),
        },
      };
    }
  }

  const face = await detectCenterFace(sceneBuffer, width);
  if (!face) {
    throw new Error(
      'Could not detect the center player face in the scene. Use Squad Celebration backdrop or a photo with a clear center face.',
    );
  }

  return anchorFromDetection(sceneId, width, height, face);
}
