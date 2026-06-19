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
    message.includes('Scene asset too large')
  ) {
    return 'Image generation timed out on the server. The campaign scene file may be too large — ensure afl-group-scene.jpeg (~4 MB) is uploaded to Supabase Storage, not the 31 MB PNG. Then try again.';
  }
  if (
    message.includes('Gemini API key rejected') ||
    message.includes('invalid authentication') ||
    message.includes('OAuth 2 access token') ||
    message.includes('GEMINI_API_KEY')
  ) {
    return 'Image generation is not configured on the server. The admin needs to add a valid GEMINI_API_KEY in Supabase (Google AI Studio key starting with AIza).';
  }
  if (message.includes('Asset load failed') && message.includes('afl-group-scene')) {
    return 'Campaign scene image missing from storage. Upload afl-group-scene.jpeg to the campaign-assets bucket (npm run upload:campaign), then try again.';
  }
  if (message.includes('compression') || message.includes('under 10MB')) {
    return message;
  }
  return message || 'Something went wrong generating your image. Please try again.';
}
