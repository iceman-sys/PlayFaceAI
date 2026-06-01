import { buildCampaignPrompt, fetchImageAsInline, inlineToBuffer, parseDataUrl } from './imageUtils';
import { callGeminiWithImagesRetry } from './geminiCore';
import { generatePortraitGeminiTwoPass, useTwoPassGemini } from './geminiTwoPass';
import { bufferToInline, resizeSceneForOpenAI } from './openaiPrepare';
import { prepareHelmetAsset } from './pipeline/helmetAsset';
import type { GeneratePortraitInput, GeneratePortraitResult, InlineImage } from './portraitTypes';

/** Single-pass Gemini (face + helmet in one request). */
async function generatePortraitGeminiSinglePass(
  apiKey: string,
  baseUrl: string,
  input: GeneratePortraitInput,
  preloaded?: { scene?: InlineImage; helmet?: InlineImage },
): Promise<GeneratePortraitResult> {
  const selfie = parseDataUrl(input.selfie);
  const sceneRaw = preloaded?.scene ?? (await fetchImageAsInline(input.sceneUrl, baseUrl));
  const { buffer: sceneBuf } = await resizeSceneForOpenAI(inlineToBuffer(sceneRaw));
  const scene = bufferToInline(sceneBuf);

  let helmet = preloaded?.helmet ?? (await fetchImageAsInline(input.helmetUrl, baseUrl));
  helmet = bufferToInline(await prepareHelmetAsset(inlineToBuffer(helmet)));

  const { imageUrl, model } = await callGeminiWithImagesRetry(apiKey, buildCampaignPrompt(input), [
    scene,
    selfie,
    helmet,
  ]);

  return { imageUrl, model, provider: 'gemini', passes: ['single'] };
}

export async function generatePortraitWithGemini(
  apiKey: string,
  baseUrl: string,
  input: GeneratePortraitInput,
  _model?: string,
  preloaded?: { scene?: InlineImage; helmet?: InlineImage },
): Promise<GeneratePortraitResult> {
  if (!apiKey?.trim()) {
    throw new Error('GEMINI_API_KEY is not configured in .env.local');
  }

  if (useTwoPassGemini()) {
    return generatePortraitGeminiTwoPass(apiKey, baseUrl, input, preloaded);
  }

  return generatePortraitGeminiSinglePass(apiKey, baseUrl, input, preloaded);
}
