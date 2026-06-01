import sharp from 'sharp';
import { fetchImageAsInline, inlineToBuffer } from '../imageUtils';
import type { GeneratePortraitInput, GeneratePortraitResult, InlineImage } from '../portraitTypes';
import { detectOrEstimateSelfie } from './faceDetect';
import { resolveSceneAnchor } from './sceneAnchors';
import { swapFace } from './composeFace';
import { applyHeadgear } from './headgear';
import { addHelmetShadow, harmonizeFace } from './harmonize';
import { runQualityCheck, shouldRetry } from './qc';
import { optionalOpenAiHarmonize } from './openaiHarmonize';

function bufferToDataUrl(buffer: Buffer): string {
  return `data:image/png;base64,${buffer.toString('base64')}`;
}

async function loadBuffer(
  urlOrData: string,
  baseUrl: string,
  preloaded?: InlineImage,
): Promise<Buffer> {
  if (preloaded) return inlineToBuffer(preloaded);
  const inline = await fetchImageAsInline(urlOrData, baseUrl);
  return inlineToBuffer(inline);
}

export async function generatePortraitPipeline(
  baseUrl: string,
  input: GeneratePortraitInput,
  preloaded?: { scene?: InlineImage; helmet?: InlineImage },
): Promise<GeneratePortraitResult> {
  const sceneId = input.campaignId ?? 'squad-celebration';
  const useStaticAnchor = sceneId === 'squad-celebration' || sceneId === 'swaarm-campaign';

  const sceneBuffer = await loadBuffer(input.sceneUrl, baseUrl, preloaded?.scene);
  const helmetBuffer = await loadBuffer(input.helmetUrl, baseUrl, preloaded?.helmet);

  const selfieInline = input.selfie.startsWith('data:')
    ? await fetchImageAsInline(input.selfie, baseUrl)
    : await fetchImageAsInline(input.selfie, baseUrl);
  const selfieBuffer = inlineToBuffer(selfieInline);

  const selfieFace = await detectOrEstimateSelfie(selfieBuffer);
  if (selfieFace.score < 0.35) {
    throw new Error('Selfie face is unclear. Retake with better lighting and look straight at the camera.');
  }

  const anchor = await resolveSceneAnchor(sceneBuffer, sceneId, useStaticAnchor);

  let scaleMultiplier = 1;
  let outputBuffer: Buffer | null = null;
  let qc: Awaited<ReturnType<typeof runQualityCheck>> | null = null;

  for (let attempt = 1; attempt <= 2; attempt++) {
    let composite = await swapFace(sceneBuffer, selfieBuffer, selfieFace, anchor, scaleMultiplier);
    composite = await applyHeadgear(composite, helmetBuffer, anchor);
    composite = await harmonizeFace(composite, sceneBuffer, anchor);
    composite = await addHelmetShadow(composite, anchor);

    qc = await runQualityCheck(composite, sceneBuffer, anchor, selfieFace);
    outputBuffer = composite;

    if (!shouldRetry(qc, attempt)) break;

    if (qc.issues.includes('head_oversized')) {
      scaleMultiplier *= 0.94;
    } else if (qc.issues.includes('head_undersized')) {
      scaleMultiplier *= 1.06;
    }
  }

  if (!outputBuffer) {
    throw new Error('Face compositing failed');
  }

  if (process.env.OPENAI_HARMONIZE === 'true' && process.env.OPENAI_API_KEY) {
    try {
      outputBuffer = await optionalOpenAiHarmonize(
        outputBuffer,
        anchor,
        process.env.OPENAI_API_KEY,
      );
    } catch (err) {
      console.warn('[pipeline] OpenAI harmonize skipped:', err instanceof Error ? err.message : err);
    }
  }

  const meta = await sharp(outputBuffer).metadata();
  console.log(
    `[pipeline] done ${meta.width}x${meta.height} qc=${qc?.pass ? 'pass' : qc?.issues.join(',')}`,
  );

  return {
    imageUrl: bufferToDataUrl(outputBuffer),
    model: 'swaarm-pipeline-v1',
    provider: 'pipeline',
  };
}
