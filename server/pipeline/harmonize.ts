import sharp from 'sharp';
import type { SceneAnchor } from './types';

function clampRegion(
  region: { x: number; y: number; width: number; height: number },
  maxW: number,
  maxH: number,
) {
  const x = Math.max(0, Math.min(maxW - 1, Math.round(region.x)));
  const y = Math.max(0, Math.min(maxH - 1, Math.round(region.y)));
  const width = Math.max(1, Math.min(maxW - x, Math.round(region.width)));
  const height = Math.max(1, Math.min(maxH - y, Math.round(region.height)));
  return { x, y, width, height };
}

function clampChannel(v: number): number {
  return Math.max(0, Math.min(255, v));
}

async function channelMeans(
  buffer: Buffer,
  region: { x: number; y: number; width: number; height: number },
): Promise<[number, number, number]> {
  const meta = await sharp(buffer).metadata();
  const safe = clampRegion(region, meta.width ?? 1, meta.height ?? 1);

  const { data, info } = await sharp(buffer)
    .extract({ left: safe.x, top: safe.y, width: safe.width, height: safe.height })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let r = 0;
  let g = 0;
  let b = 0;
  const pixels = info.width * info.height;
  for (let i = 0; i < data.length; i += 3) {
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
  }
  return [r / pixels, g / pixels, b / pixels];
}

export async function harmonizeFace(
  compositeBuffer: Buffer,
  sceneBuffer: Buffer,
  anchor: SceneAnchor,
): Promise<Buffer> {
  const meta = await sharp(compositeBuffer).metadata();
  const imgW = meta.width ?? anchor.imageWidth;
  const imgH = meta.height ?? anchor.imageHeight;

  const { box } = anchor.centerFace;
  const faceRegion = clampRegion(
    {
      x: box.x + box.width * 0.1,
      y: box.y + box.height * 0.05,
      width: box.width * 0.8,
      height: box.height * 0.85,
    },
    imgW,
    imgH,
  );

  const refRegion = clampRegion(anchor.skinSample, imgW, imgH);
  const [fr, fg, fb] = await channelMeans(compositeBuffer, faceRegion);
  const [rr, rg, rb] = await channelMeans(sceneBuffer, refRegion);

  const gainR = rr / Math.max(fr, 1);
  const gainG = rg / Math.max(fg, 1);
  const gainB = rb / Math.max(fb, 1);

  const facePatch = await sharp(compositeBuffer)
    .extract({ left: faceRegion.x, top: faceRegion.y, width: faceRegion.width, height: faceRegion.height })
    .png()
    .toBuffer();

  const adjusted = await sharp(facePatch)
    .linear(
      [gainR * 0.55 + 0.45, gainG * 0.55 + 0.45, gainB * 0.55 + 0.45],
      [
        clampChannel((rr - fr) * 0.35),
        clampChannel((rg - fg) * 0.35),
        clampChannel((rb - fb) * 0.35),
      ],
    )
    .modulate({ saturation: 1.08, brightness: 1.02 })
    .png()
    .toBuffer();

  const grainOpacity = Number(process.env.PIPELINE_GRAIN || 0.04);
  const noiseSvg = `<svg width="${faceRegion.width}" height="${faceRegion.height}" xmlns="http://www.w3.org/2000/svg">
    <filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2"/></filter>
    <rect width="100%" height="100%" filter="url(#n)" opacity="${grainOpacity}"/>
  </svg>`;

  const textured = await sharp(adjusted)
    .composite([{ input: Buffer.from(noiseSvg), blend: 'overlay' }])
    .png()
    .toBuffer();

  return sharp(compositeBuffer)
    .composite([
      {
        input: textured,
        left: faceRegion.x,
        top: faceRegion.y,
        blend: 'over',
      },
    ])
    .png()
    .toBuffer();
}

export async function addHelmetShadow(
  buffer: Buffer,
  anchor: SceneAnchor,
): Promise<Buffer> {
  const { landmarks, box } = anchor.centerFace;
  const cx = (landmarks.leftEye.x + landmarks.rightEye.x) / 2;
  const cy = landmarks.nose.y - box.height * 0.02;
  const shadowSvg = `<svg width="${anchor.imageWidth}" height="${anchor.imageHeight}" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="${cx}" cy="${cy}" rx="${box.width * 0.28}" ry="${box.height * 0.05}" fill="black" opacity="0.12"/>
  </svg>`;
  return sharp(buffer)
    .composite([{ input: Buffer.from(shadowSvg), blend: 'over' }])
    .png()
    .toBuffer();
}
