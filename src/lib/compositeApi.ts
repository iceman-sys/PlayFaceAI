import { buildShareCaption } from '@/lib/constants';
import { isPayloadTooLargeError } from '@/lib/selfiePayload';
import { uploadSelfieDataUrl } from '@/lib/selfieUpload';

export type CompositeRequest = {
  selfieDataUrl?: string;
  selfieStoragePath?: string;
  backdropUrl: string;
  helmetUrl: string;
  fullName: string;
  email: string;
  submissionId?: string;
  jobId?: string;
  intermediateUrl?: string;
  phase?: 'face-swap' | 'full';
};

export type CompositeResponse = {
  image_with_helmet_url: string;
  image_without_helmet_url: string;
  resultUrl?: string;
  shareCaption: string;
  emailed?: boolean;
  provider?: string;
  passes?: string[];
  jobId?: string;
};

type RawCompositeResponse = {
  image_with_helmet_url?: string;
  image_without_helmet_url?: string;
  imageWithHelmetUrl?: string;
  imageWithoutHelmetUrl?: string;
  intermediate_url?: string;
  intermediateUrl?: string;
  resultUrl?: string;
  result_url?: string;
  shareCaption?: string;
  emailed?: boolean;
  provider?: string;
  passes?: string[];
  jobId?: string;
  predictionId?: string;
  status?: string;
  error?: string;
};

const FACE_SWAP_POLL_INTERVAL_MS = 2000;
const FACE_SWAP_POLL_TIMEOUT_MS = 90_000;

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
  const withoutHelmet = pickUrl(
    data.image_without_helmet_url,
    data.imageWithoutHelmetUrl,
  );

  if (!withHelmet && !withoutHelmet) {
    throw new Error(data.error || 'No image returned');
  }

  return {
    image_with_helmet_url: withHelmet ?? withoutHelmet!,
    image_without_helmet_url: withoutHelmet ?? withHelmet!,
    resultUrl: withHelmet ?? withoutHelmet,
    shareCaption: data.shareCaption || buildShareCaption(),
    emailed: data.emailed,
    provider: data.provider,
    passes: data.passes,
    jobId: data.jobId,
  };
}

function isEdgeLimitError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes('504') ||
    m.includes('timed out') ||
    m.includes('worker_resource_limit') ||
    m.includes('compute resources') ||
    m.includes('resource_limit') ||
    m.includes('scene asset too large')
  );
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function invokeComposite(
  body: CompositeRequest & { generateBoth?: boolean },
): Promise<RawCompositeResponse> {
  const { supabase } = await import('@/lib/supabase');
  const { data, error } = await supabase.functions.invoke('composite-image', {
    body: { ...body, selfiePath: body.selfieStoragePath, generateBoth: true },
  });

  if (error) {
    const ctx = error as { context?: Response; message?: string };
    let detail = error.message || 'Generation failed — is composite-image deployed?';
    try {
      const errBody = await ctx.context?.json();
      if (errBody && typeof errBody === 'object') {
        const record = errBody as { error?: string; message?: string; code?: string };
        const msg = record.error || record.message || detail;
        const code = record.code?.trim();
        detail = code && !msg.toLowerCase().includes(code.toLowerCase()) ? `${code}: ${msg}` : msg;
      }
    } catch {
      // ignore
    }
    throw new Error(detail);
  }

  const response = (data ?? {}) as RawCompositeResponse;
  if (response.error) throw new Error(response.error);
  return response;
}

async function invokeWithRetry(
  body: CompositeRequest & { generateBoth?: boolean },
): Promise<RawCompositeResponse> {
  try {
    return await invokeComposite(body);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (!isEdgeLimitError(message) && !isPayloadTooLargeError(message)) throw err;
    await sleep(1500);
    return invokeComposite(body);
  }
}

type GenerationJobRow = {
  id: string;
  status: string;
  image_without_helmet_url: string | null;
  image_with_helmet_url: string | null;
  error_message: string | null;
  passes: string[] | null;
};

/**
 * Poll generation_jobs until BOTH base-scene face swaps land:
 *   image_without_helmet_url (clean scene) AND image_with_helmet_url (cap scene).
 *
 * The face-swap edge call returns ~300ms with { jobId, status: 'queued' } after
 * firing two Replicate predictions. Each result is pasted back by the
 * replicate-webhook function. This poll loop runs purely on the client — no edge
 * CPU is used.
 */
async function waitForBothVariants(jobId: string): Promise<{
  imageWithHelmetUrl: string;
  imageWithoutHelmetUrl: string;
  passes: string[];
}> {
  const { supabase } = await import('@/lib/supabase');
  const deadline = Date.now() + FACE_SWAP_POLL_TIMEOUT_MS;
  let everSawRow = false;

  while (Date.now() < deadline) {
    const { data, error } = await supabase
      .from('generation_jobs')
      .select('id, status, image_without_helmet_url, image_with_helmet_url, error_message, passes')
      .eq('id', jobId)
      .maybeSingle<GenerationJobRow>();

    if (error) {
      console.warn('[poll] generation_jobs read failed:', error.message);
    } else if (data) {
      everSawRow = true;
      if (data.status === 'failed') {
        throw new Error(data.error_message || 'Face swap failed');
      }
      if (data.image_without_helmet_url && data.image_with_helmet_url) {
        return {
          imageWithHelmetUrl: data.image_with_helmet_url,
          imageWithoutHelmetUrl: data.image_without_helmet_url,
          passes: data.passes ?? ['replicate-face-swap-clean', 'replicate-face-swap-headgear'],
        };
      }
    }

    await sleep(FACE_SWAP_POLL_INTERVAL_MS);
  }

  if (!everSawRow) {
    throw new Error(
      'Could not read generation_jobs row from the browser — most likely an RLS policy. ' +
        'Run supabase/migrations/20260625140000_generation_jobs_authenticated_read.sql.',
    );
  }
  throw new Error(
    'Face swap is taking longer than expected. The Replicate webhook may not be reaching your Supabase project — ' +
      'verify replicate-webhook is deployed with --no-verify-jwt and REPLICATE_WEBHOOK_SECRET is set.',
  );
}

/**
 * Two-base-scene async pipeline:
 *   1. Selfie → private Storage upload
 *   2. composite-image (phase=face-swap) → fires TWO Replicate predictions
 *      (clean scene + pre-fitted cap scene) and returns jobId (~300ms)
 *   3. Client polls generation_jobs until the replicate-webhook fills BOTH
 *      image_without_helmet_url and image_with_helmet_url
 *
 * No runtime helmet compositing — the cap is baked into the headgear base scene.
 * Each Supabase edge invocation stays well under the CPU/time limit.
 */
export async function generateCompositeImages(
  base: Omit<CompositeRequest, 'phase' | 'jobId' | 'intermediateUrl' | 'selfieStoragePath'> & {
    selfieDataUrl: string;
  },
): Promise<CompositeResponse> {
  const selfieStoragePath = await uploadSelfieDataUrl(base.selfieDataUrl);

  const requestBase = {
    backdropUrl: base.backdropUrl,
    helmetUrl: base.helmetUrl,
    fullName: base.fullName,
    email: base.email,
    submissionId: base.submissionId,
    selfieStoragePath,
  };

  const preferFull = import.meta.env.VITE_COMPOSITE_FULL_PIPELINE === 'true';

  if (preferFull) {
    return normalizeResponse(await invokeWithRetry({ ...requestBase, phase: 'full' }));
  }

  const faceSwap = await invokeWithRetry({ ...requestBase, phase: 'face-swap' });
  const jobId = faceSwap.jobId;
  if (!jobId) {
    throw new Error('Face-swap submission did not return a job id');
  }

  // Async path (default): the edge function returned { status: 'queued' } —
  // wait for both Replicate webhooks to populate both image URLs.
  let withUrl = pickUrl(faceSwap.image_with_helmet_url, faceSwap.imageWithHelmetUrl);
  let withoutUrl = pickUrl(faceSwap.image_without_helmet_url, faceSwap.imageWithoutHelmetUrl);
  let passes = faceSwap.passes ?? [];

  if (!withUrl || !withoutUrl) {
    const result = await waitForBothVariants(jobId);
    withUrl = result.imageWithHelmetUrl;
    withoutUrl = result.imageWithoutHelmetUrl;
    passes = result.passes;
  }

  return normalizeResponse({
    image_with_helmet_url: withUrl,
    image_without_helmet_url: withoutUrl,
    jobId,
    passes,
    shareCaption: faceSwap.shareCaption,
    provider: faceSwap.provider,
  });
}

export async function checkGenerationConfigured(): Promise<{
  ready: boolean;
  message: string;
  warning?: string;
}> {
  const baseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

  if (!baseUrl || !anonKey) {
    return {
      ready: false,
      message:
        'App is missing Supabase configuration. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local.',
    };
  }

  try {
    const res = await fetch(`${baseUrl}/functions/v1/composite-image`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${anonKey}` },
    });
    const data = (await res.json()) as {
      configured?: boolean;
      valid?: boolean;
      error?: string;
      scene?: { ok?: boolean; error?: string };
      helmet?: { ok?: boolean; warning?: string };
    };

    if (res.ok && data.configured && data.valid !== false && data.scene?.ok !== false) {
      return {
        ready: true,
        message: '',
        warning: data.helmet?.ok === false ? data.helmet.warning : undefined,
      };
    }

    return {
      ready: false,
      message:
        data.scene?.error ||
        data.error ||
        'Set REPLICATE_API_TOKEN in Supabase Edge Function secrets and deploy composite-image.',
    };
  } catch {
    return {
      ready: false,
      message:
        'Could not reach composite-image. Deploy edge functions to your Supabase project.',
    };
  }
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
