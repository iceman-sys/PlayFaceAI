import {
  buildFaceSwapPrompt,
  buildHarmonizePrompt,
  buildHeadgearPrompt,
  fetchImageAsInline,
  inlineToBuffer,
  parseDataUrl,
} from './imageUtils';
import { callOpenAiImageEdit } from './openaiEdit';
import {
  bufferToInline,
  parseOpenAiSize,
  resizeSceneForOpenAI,
} from './openaiPrepare';
import { prepareHelmetAsset } from './pipeline/helmetAsset';
import { buildOpenAiEditMask } from './pipeline/masks';
import { resolveSceneAnchor } from './pipeline/sceneAnchors';
import type { GeneratePortraitInput, GeneratePortraitResult, InlineImage } from './portraitTypes';

const DEFAULT_MODEL = 'gpt-image-1';

function bufferToDataUrl(buf: Buffer): string {
  return `data:image/png;base64,${buf.toString('base64')}`;
}

export function useTwoPassOpenAI(): boolean {
  const v = (process.env.OPENAI_TWO_PASS ?? 'true').toLowerCase();
  return v !== 'false' && v !== '0';
}

export function useHarmonizePass(): boolean {
  const v = (process.env.OPENAI_HARMONIZE ?? 'true').toLowerCase();
  return v === 'true' || v === '1';
}

export async function generatePortraitTwoPass(
  apiKey: string,
  baseUrl: string,
  input: GeneratePortraitInput,
  preloaded?: { scene?: InlineImage; helmet?: InlineImage },
): Promise<GeneratePortraitResult> {
  if (!apiKey?.trim()) {
    throw new Error('OPENAI_API_KEY is not configured.');
  }

  const model = process.env.OPENAI_IMAGE_MODEL || DEFAULT_MODEL;
  const sceneId = input.campaignId ?? 'squad-celebration';
  const passes: string[] = [];

  const sceneRaw = preloaded?.scene ?? (await fetchImageAsInline(input.sceneUrl, baseUrl));
  const sceneBufRaw = inlineToBuffer(sceneRaw);
  const { buffer: sceneBuf } = await resizeSceneForOpenAI(sceneBufRaw);
  const { width, height } = parseOpenAiSize();

  const anchor = await resolveSceneAnchor(sceneBuf, sceneId, false);
  anchor.imageWidth = width;
  anchor.imageHeight = height;

  const selfie = parseDataUrl(input.selfie);
  const scene = bufferToInline(sceneBuf);

  let helmet = preloaded?.helmet ?? (await fetchImageAsInline(input.helmetUrl, baseUrl));
  const helmetBuf = await prepareHelmetAsset(inlineToBuffer(helmet));
  helmet = bufferToInline(helmetBuf);

  console.log('[openai] pass 1: face swap');
  const faceMask = await buildOpenAiEditMask(anchor, 'face');
  const afterFace = await callOpenAiImageEdit({
    apiKey,
    model,
    prompt: buildFaceSwapPrompt(input),
    images: [scene, selfie],
    mask: faceMask,
  });
  passes.push('face');

  console.log('[openai] pass 2: headgear');
  const headgearMask = await buildOpenAiEditMask(anchor, 'headgear');
  const sceneWithFace = bufferToInline(afterFace);
  let output = await callOpenAiImageEdit({
    apiKey,
    model,
    prompt: buildHeadgearPrompt(input),
    images: [sceneWithFace, helmet],
    mask: headgearMask,
  });
  passes.push('headgear');

  if (useHarmonizePass()) {
    try {
      console.log('[openai] pass 3: harmonize');
      const harmonizeMask = await buildOpenAiEditMask(anchor, 'harmonize');
      output = await callOpenAiImageEdit({
        apiKey,
        model,
        prompt: buildHarmonizePrompt(),
        images: [bufferToInline(output)],
        mask: harmonizeMask,
      });
      passes.push('harmonize');
    } catch (err) {
      console.warn('[openai] harmonize pass skipped:', err instanceof Error ? err.message : err);
    }
  }

  return {
    imageUrl: bufferToDataUrl(output),
    model: `${model}-2pass`,
    provider: 'hybrid',
    passes,
  };
}
