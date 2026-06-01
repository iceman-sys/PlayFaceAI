import { generatePortraitTwoPass } from '../openaiTwoPass';
import type { GeneratePortraitInput, GeneratePortraitResult, InlineImage } from '../portraitTypes';

/**
 * Campaign-quality output: 2-pass OpenAI (face → headgear → optional harmonize).
 * Falls back to geometric pipeline if OpenAI fails (see generatePortrait.ts).
 */
export async function generatePortraitHybrid(
  baseUrl: string,
  input: GeneratePortraitInput,
  apiKey: string,
  preloaded?: { scene?: InlineImage; helmet?: InlineImage },
): Promise<GeneratePortraitResult> {
  return generatePortraitTwoPass(apiKey, baseUrl, input, preloaded);
}
