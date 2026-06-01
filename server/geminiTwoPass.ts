import {
  buildFaceSwapPrompt,
  buildHarmonizePrompt,
  buildHeadgearPrompt,
  fetchImageAsInline,
  inlineToBuffer,
  parseDataUrl,
} from './imageUtils';
import { callGeminiWithImagesRetry, getGeminiModel, inlineFromDataUrl } from './geminiCore';
import { bufferToInline, resizeSceneForOpenAI } from './openaiPrepare';
import { prepareHelmetAsset } from './pipeline/helmetAsset';
import type { GeneratePortraitInput, GeneratePortraitResult, InlineImage } from './portraitTypes';

export function useTwoPassGemini(): boolean {
  const v = (process.env.GEMINI_TWO_PASS ?? 'true').toLowerCase();
  return v !== 'false' && v !== '0';
}

export function useGeminiHarmonize(): boolean {
  const v = (process.env.GEMINI_HARMONIZE ?? process.env.OPENAI_HARMONIZE ?? 'true').toLowerCase();
  return v === 'true' || v === '1';
}

export async function generatePortraitGeminiTwoPass(
  apiKey: string,
  baseUrl: string,
  input: GeneratePortraitInput,
  preloaded?: { scene?: InlineImage; helmet?: InlineImage },
): Promise<GeneratePortraitResult> {
  const model = getGeminiModel();
  const passes: string[] = [];

  const sceneRaw = preloaded?.scene ?? (await fetchImageAsInline(input.sceneUrl, baseUrl));
  const { buffer: sceneBuf } = await resizeSceneForOpenAI(inlineToBuffer(sceneRaw));
  const scene = bufferToInline(sceneBuf);
  const selfie = parseDataUrl(input.selfie);

  let helmet = preloaded?.helmet ?? (await fetchImageAsInline(input.helmetUrl, baseUrl));
  helmet = bufferToInline(await prepareHelmetAsset(inlineToBuffer(helmet)));

  console.log('[gemini] pass 1: face swap');
  const faceResult = await callGeminiWithImagesRetry(
    apiKey,
    buildFaceSwapPrompt(input),
    [scene, selfie],
  );
  passes.push('face');

  console.log('[gemini] pass 2: headgear');
  const sceneWithFace = inlineFromDataUrl(faceResult.imageUrl);
  const headgearResult = await callGeminiWithImagesRetry(
    apiKey,
    buildHeadgearPrompt(input),
    [sceneWithFace, helmet],
  );
  let imageUrl = headgearResult.imageUrl;
  passes.push('headgear');

  if (useGeminiHarmonize()) {
    try {
      console.log('[gemini] pass 3: harmonize');
      const current = inlineFromDataUrl(imageUrl);
      const harmonized = await callGeminiWithImagesRetry(
        apiKey,
        buildHarmonizePrompt(),
        [current],
      );
      imageUrl = harmonized.imageUrl;
      passes.push('harmonize');
    } catch (err) {
      console.warn('[gemini] harmonize pass skipped:', err instanceof Error ? err.message : err);
    }
  }

  return {
    imageUrl,
    model: `${model}-2pass`,
    provider: 'gemini',
    passes,
  };
}
