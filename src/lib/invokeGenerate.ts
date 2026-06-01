export type GenerateRequest = {
  selfie: string;
  email?: string;
  fullName?: string;
  socialHandle?: string;
  generationId?: string;
  teamImageUrl?: string;
  helmetImageUrl?: string;
  helmetId?: string;
  backdropId?: string;
  customBackdrop?: boolean;
};

export type GenerateResponse = {
  imageUrl: string;
  resultUrl?: string;
  shareCaption?: string;
  emailed?: boolean;
  provider?: string;
  passes?: string[];
  error?: string;
};

function getLocalGenerateEndpoint(): string | null {
  const override = import.meta.env.VITE_GENERATE_API_URL as string | undefined;
  if (override) return override;
  if (import.meta.env.DEV) return '/api/generate-sports-portrait';
  return null;
}

async function invokeLocalApi(body: GenerateRequest): Promise<GenerateResponse> {
  const endpoint = getLocalGenerateEndpoint();
  if (!endpoint) throw new Error('No generate API configured. Set VITE_GENERATE_API_URL for production.');

  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error('Could not reach the local AI server. Run npm run dev and check .env.local.');
  }

  const data = (await res.json().catch(() => ({}))) as GenerateResponse & { error?: string };

  if (!res.ok) {
    throw new Error(data.error || `Server error (${res.status})`);
  }

  const imageUrl = data.imageUrl || data.resultUrl;
  if (!imageUrl) throw new Error(data.error || 'No image returned from AI');

  return { ...data, imageUrl };
}

/**
 * Dev: local Vite API at /api/generate-sports-portrait
 * Production: set VITE_GENERATE_API_URL to your deployed server (npm run server)
 */
export async function generateCampaignPortrait(body: GenerateRequest): Promise<GenerateResponse> {
  const endpoint = getLocalGenerateEndpoint();
  if (!endpoint) {
    throw new Error(
      'No generate API configured. Run npm run dev locally, or set VITE_GENERATE_API_URL to your deployed API.',
    );
  }
  return invokeLocalApi(body);
}
