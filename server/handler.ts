import type { IncomingMessage, ServerResponse } from 'node:http';
import { ASSETS } from '../src/lib/constants';
import { sendResultEmail } from './email';
import { generatePortrait, getImageProvider } from './generatePortrait';
import { buildShareCaption } from './shareCaption';
import { uploadResultImage } from './storageUpload';

type GenerateBody = {
  selfie?: string;
  email?: string;
  fullName?: string;
  socialHandle?: string;
  generationId?: string;
  teamImageUrl?: string;
  sceneUrl?: string;
  helmetImageUrl?: string;
  helmetUrl?: string;
  helmetId?: string;
  backdropId?: string;
  customBackdrop?: boolean;
};

const TARGET_PLAYER = 'center player (middle of five AFL teammates)';
const MAX_SELFIE_CHARS = 900_000;

function readJsonBody(req: IncomingMessage): Promise<GenerateBody> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
      if (Buffer.concat(chunks).length > 2 * 1024 * 1024) {
        reject(new Error('Request body too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')) as GenerateBody);
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

function json(res: ServerResponse, status: number, body: Record<string, unknown>) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function resolveAssetUrl(path: string | undefined, fallback: string, origin: string): string {
  if (!path) return fallback;
  if (path.startsWith('http')) return path;
  if (path.startsWith('data:')) return path;
  return new URL(path, origin).href;
}

export async function handleGeneratePortrait(
  req: IncomingMessage,
  res: ServerResponse,
  origin: string,
): Promise<void> {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    json(res, 405, { error: 'Method not allowed' });
    return;
  }

  try {
    const body = await readJsonBody(req);
    const selfie = body.selfie?.trim();

    if (!selfie) {
      json(res, 400, { error: 'Missing selfie image' });
      return;
    }

    if (selfie.length > MAX_SELFIE_CHARS) {
      json(res, 413, {
        error: 'Selfie payload too large. Use a smaller photo — the app compresses automatically on upload.',
        code: 'PAYLOAD_TOO_LARGE',
      });
      return;
    }

    const sceneUrl = resolveAssetUrl(
      body.teamImageUrl ?? body.sceneUrl,
      ASSETS.team,
      origin,
    );
    const helmetUrl = resolveAssetUrl(
      body.helmetImageUrl ?? body.helmetUrl,
      ASSETS.helmetClean,
      origin,
    );

    const result = await generatePortrait(origin, {
      selfie,
      sceneUrl,
      helmetUrl,
      campaignId: body.backdropId ?? 'squad-celebration',
      targetPlayer: TARGET_PLAYER,
    });

    const publicUrl = await uploadResultImage(result.imageUrl, body.generationId);
    const deliveryUrl = publicUrl ?? result.imageUrl;
    const storedInCloud = Boolean(publicUrl);
    const shareCaption = buildShareCaption(body.socialHandle);

    let emailed = false;
    if (body.email?.trim()) {
      try {
        emailed = await sendResultEmail(
          body.email.trim(),
          deliveryUrl,
          shareCaption,
          result.imageUrl,
        );
      } catch (err) {
        console.warn('[email] send failed:', err instanceof Error ? err.message : err);
      }
    }

    json(res, 200, {
      imageUrl: deliveryUrl,
      resultUrl: deliveryUrl,
      shareCaption,
      emailed,
      storedInCloud,
      model: result.model,
      provider: result.provider ?? getImageProvider(),
      passes: result.passes,
    });
  } catch (err) {
    console.error('[generate-sports-portrait]', err);
    const message = err instanceof Error ? err.message : 'Generation failed';
    const status = message.includes('too large') ? 413 : 500;
    json(res, status, { error: message });
  }
}
