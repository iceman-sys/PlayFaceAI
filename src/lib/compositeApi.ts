import { buildShareCaption } from '@/lib/constants';

export type CompositeRequest = {
  selfieDataUrl: string;
  backdropUrl: string;
  helmetUrl: string;
  fullName: string;
  email: string;
  submissionId?: string;
  includeHelmet?: boolean;
  generateBoth?: boolean;
};

export type CompositeResponse = {
  image_with_helmet_url: string;
  image_without_helmet_url: string;
  resultUrl?: string;
  shareCaption: string;
  emailed?: boolean;
  provider?: string;
  passes?: string[];
};

type RawCompositeResponse = {
  image_with_helmet_url?: string;
  image_without_helmet_url?: string;
  imageWithHelmetUrl?: string;
  imageWithoutHelmetUrl?: string;
  resultUrl?: string;
  result_url?: string;
  shareCaption?: string;
  emailed?: boolean;
  provider?: string;
  passes?: string[];
  error?: string;
};

function pickUrl(...candidates: (string | undefined)[]): string | undefined {
  return candidates.find((u) => typeof u === 'string' && u.length > 0);
}

function normalizeResponse(data: RawCompositeResponse): CompositeResponse {
  const withHelmet = pickUrl(
    data.image_with_helmet_url,
    data.imageWithHelmetUrl,
    data.resultUrl,
    data.result_url,
  );
  const withoutHelmet = pickUrl(data.image_without_helmet_url, data.imageWithoutHelmetUrl);

  if (!withHelmet && !withoutHelmet) {
    throw new Error(data.error || 'No image returned');
  }

  const helmetUrl = withHelmet ?? withoutHelmet!;
  const noHelmetUrl = withoutHelmet ?? withHelmet!;

  return {
    image_with_helmet_url: helmetUrl,
    image_without_helmet_url: noHelmetUrl,
    resultUrl: helmetUrl,
    shareCaption: data.shareCaption || buildShareCaption(),
    emailed: data.emailed,
    provider: data.provider,
    passes: data.passes,
  };
}

/** Invoke Supabase edge function — Gemini runs on Supabase servers (geo-safe). */
async function invokeComposite(body: CompositeRequest): Promise<RawCompositeResponse> {
  const { supabase } = await import('@/lib/supabase');
  const { data, error } = await supabase.functions.invoke('composite-image', { body });

  if (error) {
    throw new Error(error.message || 'Generation failed — is composite-image deployed?');
  }

  const payload = (data ?? {}) as RawCompositeResponse;
  if (payload.error) throw new Error(payload.error);
  return payload;
}

/** Gemini 3-step: face swap → headgear → harmonize + upload. Returns both variants. */
export async function generateCompositeImages(
  base: Omit<CompositeRequest, 'includeHelmet' | 'generateBoth'>,
): Promise<CompositeResponse> {
  const data = await invokeComposite({
    ...base,
    generateBoth: true,
  });

  return normalizeResponse(data);
}

export async function sendResultEmail(payload: {
  email: string;
  fullName: string;
  imageWithHelmetUrl: string;
  imageWithoutHelmetUrl: string;
  shareCaption?: string;
}): Promise<boolean> {
  const body = {
    email: payload.email,
    fullName: payload.fullName,
    resultUrl: payload.imageWithHelmetUrl,
    imageWithHelmetUrl: payload.imageWithHelmetUrl,
    imageWithoutHelmetUrl: payload.imageWithoutHelmetUrl,
    shareCaption: payload.shareCaption ?? buildShareCaption(),
  };

  const { supabase } = await import('@/lib/supabase');
  const { data, error } = await supabase.functions.invoke('send-result-email', { body });

  if (error) {
    console.warn('[email]', error.message);
    return false;
  }

  const result = data as { ok?: boolean; emailed?: boolean; error?: string } | null;
  if (result?.error) {
    console.warn('[email]', result.error);
    return false;
  }

  return Boolean(result?.ok ?? result?.emailed ?? true);
}
