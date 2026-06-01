/// <reference types="node" />
import type { Plugin } from 'vite';
import { loadEnv } from 'vite';
import { handleGeneratePortrait } from './handler';
import { getImageProvider } from './generatePortrait';

export function generatePortraitApiPlugin(): Plugin {
  return {
    name: 'generate-portrait-api',
    configureServer(server) {
      const env = loadEnv(server.config.mode, server.config.root, '');

      process.env.IMAGE_PROVIDER = env.IMAGE_PROVIDER || process.env.IMAGE_PROVIDER || 'gemini';
      process.env.OPENAI_API_KEY = env.OPENAI_API_KEY || process.env.OPENAI_API_KEY;
      process.env.OPENAI_IMAGE_MODEL = env.OPENAI_IMAGE_MODEL || process.env.OPENAI_IMAGE_MODEL;
      process.env.OPENAI_IMAGE_SIZE = env.OPENAI_IMAGE_SIZE || process.env.OPENAI_IMAGE_SIZE;
      process.env.OPENAI_IMAGE_QUALITY = env.OPENAI_IMAGE_QUALITY || process.env.OPENAI_IMAGE_QUALITY;
      process.env.OPENAI_TWO_PASS = env.OPENAI_TWO_PASS || process.env.OPENAI_TWO_PASS;
      process.env.OPENAI_HARMONIZE = env.OPENAI_HARMONIZE || process.env.OPENAI_HARMONIZE;
      process.env.GEMINI_API_KEY = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
      process.env.GEMINI_MODEL = env.GEMINI_MODEL || process.env.GEMINI_MODEL;
      process.env.GEMINI_TWO_PASS = env.GEMINI_TWO_PASS || process.env.GEMINI_TWO_PASS;
      process.env.GEMINI_HARMONIZE = env.GEMINI_HARMONIZE || process.env.GEMINI_HARMONIZE;
      process.env.RESEND_API_KEY = env.RESEND_API_KEY || process.env.RESEND_API_KEY;
      process.env.RESEND_FROM = env.RESEND_FROM || process.env.RESEND_FROM;
      process.env.SUPABASE_URL = env.SUPABASE_URL || env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
      process.env.SUPABASE_SERVICE_ROLE_KEY =
        env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
      process.env.SUPABASE_STORAGE_BUCKET =
        env.SUPABASE_STORAGE_BUCKET || process.env.SUPABASE_STORAGE_BUCKET || 'campaign-results';

      const provider = getImageProvider();
      if (provider === 'hybrid') {
        if (!process.env.OPENAI_API_KEY) {
          console.warn('[SWAARM] hybrid mode: no OPENAI_API_KEY — will use pipeline fallback');
        } else {
          const twoPass = (process.env.OPENAI_TWO_PASS ?? 'true').toLowerCase() !== 'false';
          console.log(
            `[SWAARM] Image provider: hybrid (${twoPass ? '2-pass' : '1-pass'} OpenAI → pipeline fallback)`,
          );
        }
      } else if (provider === 'pipeline') {
        console.log('[SWAARM] Image provider: pipeline (detect → align → swap → headgear → harmonize)');
        if (process.env.OPENAI_HARMONIZE === 'true' && process.env.OPENAI_API_KEY) {
          console.log('[SWAARM] OpenAI harmonize pass enabled');
        }
      } else if (provider === 'openai') {
        if (!process.env.OPENAI_API_KEY) {
          console.warn('[SWAARM] Missing OPENAI_API_KEY in .env.local — generation will fail.');
        } else {
          console.log(
            `[SWAARM] Image provider: OpenAI (${process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1'})`,
          );
        }
      } else if (provider === 'gemini') {
        if (!process.env.GEMINI_API_KEY) {
          console.warn('[SWAARM] Missing GEMINI_API_KEY in .env.local — generation will fail.');
        } else {
          const twoPass = (process.env.GEMINI_TWO_PASS ?? 'true').toLowerCase() !== 'false';
          console.log(
            `[SWAARM] Image provider: Gemini ${process.env.GEMINI_MODEL || 'gemini-2.5-flash-image'} (${twoPass ? '2-pass' : '1-pass'} → OpenAI/pipeline fallback)`,
          );
        }
      }

      if (process.env.RESEND_API_KEY) {
        console.log('[SWAARM] Resend email delivery enabled');
      } else {
        console.warn('[SWAARM] RESEND_API_KEY not set — automatic email disabled');
      }

      server.middlewares.use('/api/generate-sports-portrait', (req, res) => {
        const origin = `http://${req.headers.host ?? 'localhost:8080'}`;
        handleGeneratePortrait(req, res, origin).catch((err) => {
          console.error(err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Internal server error' }));
        });
      });
    },
  };
}
