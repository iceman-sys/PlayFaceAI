/** Max base64 data-URL length for selfie field (~450KB image + JSON overhead). */
export const MAX_SELFIE_DATA_URL_CHARS = 600_000;

export function assertSelfiePayloadOk(dataUrl: string): void {
  if (dataUrl.length > MAX_SELFIE_DATA_URL_CHARS) {
    throw new Error(
      'Photo is still too large after compression. Use a closer face crop or a smaller image.',
    );
  }
}

export function isPayloadTooLargeError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes('413') ||
    m.includes('payload too large') ||
    m.includes('body too large') ||
    m.includes('request entity too large') ||
    m.includes('too large')
  );
}

export function friendlyGenerateError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  if (isPayloadTooLargeError(message)) {
    return 'Your photo was too large to upload. We compressed it automatically — please try again with a smaller image or retake your selfie.';
  }
  if (
    message.includes('WORKER_RESOURCE_LIMIT') ||
    message.includes('not having enough compute resources') ||
    message.toLowerCase().includes('compute resources')
  ) {
    return 'Image generation hit a server memory limit. Please try again — face-swap and headgear run as separate steps. If it keeps failing, run `npm run optimize:scene` then `npm run upload:campaign`.';
  }
  if (message.includes('Scene asset too large') || message.includes('Scene asset missing')) {
    return 'The scene image in Supabase Storage is too large or missing. Run `npm run optimize:scene` then `npm run upload:campaign` to upload the compressed afl-group-scene.jpeg (~0.5 MB).';
  }
  if (
    message.includes('REPLICATE_WEBHOOK_SECRET') ||
    message.includes('Replicate prediction submit failed')
  ) {
    return 'The Replicate webhook is not configured on the server. Set REPLICATE_WEBHOOK_SECRET and re-deploy composite-image + replicate-webhook.';
  }
  if (message.includes('Face swap is taking longer than expected')) {
    return message;
  }
  if (
    message.includes('Gemini API key rejected') ||
    message.includes('invalid authentication') ||
    message.includes('OAuth 2 access token') ||
    message.includes('GEMINI_API_KEY')
  ) {
    return 'Image generation is not configured on the server. Set REPLICATE_API_TOKEN in Supabase Edge Function secrets.';
  }
  if (message.includes('REPLICATE') || message.includes('Replicate')) {
    return 'Replicate is not configured. Add REPLICATE_API_TOKEN in Supabase → Edge Functions → Secrets.';
  }
  if (message.includes('Asset load failed') && message.includes('afl-group-scene')) {
    return 'Campaign scene image missing from storage. Upload afl-group-scene.jpeg to the campaign-assets bucket (npm run upload:campaign), then try again.';
  }
  if (message.includes('compression') || message.includes('under 10MB')) {
    return message;
  }
  return message || 'Something went wrong generating your image. Please try again.';
}
