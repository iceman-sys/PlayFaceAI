import type { GeneratePortraitInput, GeneratePortraitResult, ImageProvider } from './portraitTypes';
import type { InlineImage } from './portraitTypes';
import { generatePortraitWithGemini } from './gemini';
import { generatePortraitWithOpenAI } from './openai';
import { generatePortraitHybrid } from './pipeline/hybridGenerate';
import { generatePortraitPipeline } from './pipeline/index';

export function getImageProvider(): ImageProvider {
  const p = (process.env.IMAGE_PROVIDER || 'gemini').toLowerCase();
  if (p === 'gemini') return 'gemini';
  if (p === 'openai') return 'openai';
  if (p === 'pipeline') return 'pipeline';
  return 'hybrid';
}

function shouldFallbackToOpenAI(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  return (
    msg.includes('location is not supported') ||
    msg.includes('quota') ||
    msg.includes('rate limit') ||
    msg.includes('billing') ||
    msg.includes('not configured')
  );
}

export async function generatePortrait(
  baseUrl: string,
  input: GeneratePortraitInput,
  preloaded?: { scene?: InlineImage; helmet?: InlineImage },
): Promise<GeneratePortraitResult> {
  const provider = getImageProvider();
  const openaiKey = process.env.OPENAI_API_KEY ?? '';
  const geminiKey = process.env.GEMINI_API_KEY ?? '';

  if (provider === 'gemini') {
    if (!geminiKey.trim()) {
      throw new Error('GEMINI_API_KEY is not configured in .env.local');
    }
    try {
      return await generatePortraitWithGemini(geminiKey, baseUrl, input, undefined, preloaded);
    } catch (err) {
      console.warn('[SWAARM] Gemini failed:', (err as Error).message);
      if (openaiKey.trim() && shouldFallbackToOpenAI(err)) {
        console.warn('[SWAARM] Falling back to OpenAI');
        return generatePortraitWithOpenAI(openaiKey, baseUrl, input, preloaded);
      }
      try {
        console.warn('[SWAARM] Falling back to pipeline');
        return await generatePortraitPipeline(baseUrl, input, preloaded);
      } catch {
        throw err;
      }
    }
  }

  if (provider === 'hybrid') {
    if (!openaiKey.trim()) {
      console.warn('[SWAARM] No OPENAI_API_KEY — hybrid falls back to pipeline');
      return generatePortraitPipeline(baseUrl, input, preloaded);
    }
    try {
      return await generatePortraitHybrid(baseUrl, input, openaiKey, preloaded);
    } catch (err) {
      console.warn('[SWAARM] Hybrid OpenAI failed, falling back to pipeline:', (err as Error).message);
      try {
        return await generatePortraitPipeline(baseUrl, input, preloaded);
      } catch (pipeErr) {
        throw err instanceof Error ? err : pipeErr;
      }
    }
  }

  if (provider === 'pipeline') {
    try {
      return await generatePortraitPipeline(baseUrl, input, preloaded);
    } catch (err) {
      if (geminiKey.trim()) {
        console.warn('[SWAARM] Pipeline failed, falling back to Gemini:', (err as Error).message);
        return generatePortraitWithGemini(geminiKey, baseUrl, input, undefined, preloaded);
      }
      if (openaiKey.trim()) {
        console.warn('[SWAARM] Pipeline failed, falling back to OpenAI:', (err as Error).message);
        return generatePortraitWithOpenAI(openaiKey, baseUrl, input, preloaded);
      }
      throw err;
    }
  }

  const result = await generatePortraitWithOpenAI(openaiKey, baseUrl, input, preloaded);
  return { ...result, provider: 'openai' };
}
