import {
  buildCampaignPrompt,
  fetchImageAsInline,
  inlineToBuffer,
  parseDataUrl,
} from './imageUtils';
import { callOpenAiImageEdit } from './openaiEdit';
import { bufferToInline, resizeSceneForOpenAI } from './openaiPrepare';
import { generatePortraitTwoPass, useTwoPassOpenAI } from './openaiTwoPass';
import { prepareHelmetAsset } from './pipeline/helmetAsset';
import type { GeneratePortraitInput, GeneratePortraitResult, InlineImage } from './portraitTypes';

const DEFAULT_MODEL = 'gpt-image-1';

/** Legacy single-pass OpenAI edit (face + helmet together). */
async function generatePortraitSinglePass(
  apiKey: string,
  baseUrl: string,
  input: GeneratePortraitInput,
  preloaded?: { scene?: InlineImage; helmet?: InlineImage },
): Promise<GeneratePortraitResult> {
  const model = process.env.OPENAI_IMAGE_MODEL || DEFAULT_MODEL;

  const selfie = parseDataUrl(input.selfie);
  const sceneRaw = preloaded?.scene ?? (await fetchImageAsInline(input.sceneUrl, baseUrl));
  const { buffer: sceneBuf } = await resizeSceneForOpenAI(inlineToBuffer(sceneRaw));
  const scene = bufferToInline(sceneBuf);

  let helmet = preloaded?.helmet ?? (await fetchImageAsInline(input.helmetUrl, baseUrl));
  const helmetBuf = await prepareHelmetAsset(inlineToBuffer(helmet));
  helmet = bufferToInline(helmetBuf);

  const buf = await callOpenAiImageEdit({
    apiKey,
    model,
    prompt: buildCampaignPrompt(input),
    images: [scene, selfie, helmet],
  });

  return {
    imageUrl: `data:image/png;base64,${buf.toString('base64')}`,
    model,
    provider: 'openai',
    passes: ['single'],
  };
}

export async function generatePortraitWithOpenAI(
  apiKey: string,
  baseUrl: string,
  input: GeneratePortraitInput,
  preloaded?: { scene?: InlineImage; helmet?: InlineImage },
): Promise<GeneratePortraitResult> {
  if (!apiKey?.trim()) {
    throw new Error(
      'OPENAI_API_KEY is not configured. Add your key to .env.local and restart npm run dev.',
    );
  }

  if (useTwoPassOpenAI()) {
    return generatePortraitTwoPass(apiKey, baseUrl, input, preloaded);
  }

  return generatePortraitSinglePass(apiKey, baseUrl, input, preloaded);
}
