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
  if (message.includes('compression') || message.includes('under 10MB')) {
    return message;
  }
  return message || 'Something went wrong generating your image. Please try again.';
}
