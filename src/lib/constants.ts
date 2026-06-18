/** Fixed campaign assets — public/campaign/ + Supabase Storage campaign-assets bucket */
export const CAMPAIGN_ASSETS = {
  sceneFile: 'afl-group-scene.jpeg',
  helmetFile: 'swaarm-helmet.png',
  logoFile: 'swaarm-footer-logo.png',
  scenePath: '/campaign/afl-group-scene.jpeg',
  helmetPath: '/campaign/swaarm-helmet.png',
  logoPath: '/campaign/swaarm-footer-logo.png',
} as const;

const CAMPAIGN_ASSETS_BUCKET = 'campaign-assets';

export const CAMPAIGN = {
  name: 'SWAARM in the Chorus',
  slug: 'swaarm-chorus',
  event: 'North Melbourne · Marvel Stadium',
  eventDate: '28 June 2026',
  eventLine: 'North Melbourne · Marvel Stadium · 28 June 2026',
  backdropUrl: CAMPAIGN_ASSETS.scenePath,
  helmetUrl: CAMPAIGN_ASSETS.helmetPath,
  logoUrl: CAMPAIGN_ASSETS.logoPath,
  heroUrl: CAMPAIGN_ASSETS.scenePath,
  caption:
    "How cool, I Got to SWAARM in the chorus and sing it one and all - Good old North Melbourne, they're champions you'll agree",
  hashtags: '#swaarminthechorus #swaarmheadgear #northmelbournefc',
  ctaLabel: 'Create your Photo',
};

export const LANDING_COPY = {
  intro:
    'SWAARM Headgear and the Kangaroos want you to be part of the famous North Melbourne club song and SWAARM in the Chorus!!',
  body: 'Click below to generate a realistic image of you singing the North Melbourne Team Song with the players just like they have done after their fantastic wins in 2026. It\'s quick and easy, just upload a selfie and watch the magic happen as you are placed into the inner sanctum.',
  shareLine:
    'Share your pic on social media with the hashtag #swaarminthechorus and you could win one of the following amazing prizes.',
  prizes: [
    '1st Prize — 2026 signed North Melbourne guernsey',
    '2nd Prize — SWAARM Pro Headgear signed by Tristan Xerri',
    '3rd Prize — SWAARM Pro Headgear signed by Caleb Daniel',
  ],
  closing:
    'So go on good old North Melbourne supporters, SWAARM in the Chorus and Share it One and All!',
  subCta: 'Generate your AI Team-Song Photo for a chance to win prizes',
  steps: [
    'Upload a Clear Selfie',
    'Generate Image of you in the Team Song',
    'Share on Social Media to be a chance to Win',
  ],
} as const;

/** Stadium QR codes should point here (append ?source=marvel-stadium-qr) */
export const CAMPAIGN_URLS = {
  landing: '/prize',
  create: '/create',
  terms: '/terms',
  stadiumQr: '/prize?source=marvel-stadium-qr',
  partnerQr: '/prize?source=partner',
} as const;

export const COMPETITION_TERMS = {
  title: 'Competition terms & conditions',
  lastUpdated: '18 June 2026',
  sections: [
    {
      heading: '1. Promoter',
      body: 'SWAARM Headgear in partnership with North Melbourne Football Club (“Promoter”).',
    },
    {
      heading: '2. Eligibility',
      body: 'Open to Australian residents aged 18+. Employees of the Promoter and immediate family are ineligible. One prize entry per person per email address.',
    },
    {
      heading: '3. How to enter',
      body: 'Generate your AI team-song photo, then share it on social media with the hashtags #swaarminthechorus #swaarmheadgear #northmelbournefc for your chance to win. You must successfully generate your image and share it to be eligible.',
    },
    {
      heading: '4. Prizes',
      body: '1st Prize — 2026 signed North Melbourne guernsey. 2nd Prize — SWAARM Pro Headgear signed by Tristan Xerri. 3rd Prize — SWAARM Pro Headgear signed by Caleb Daniel. Prizes are not transferable and cannot be exchanged for cash.',
    },
    {
      heading: '5. Draw',
      body: 'Eligible entries who shared on social media with the required hashtags will be included in the draw. Winners will be notified by email within 7 days.',
    },
    {
      heading: '6. Privacy & image use',
      body: 'Your email is used to send your team-song photo and notify prize winners. By entering you grant the Promoter a licence to use your generated campaign image for marketing related to this campaign.',
    },
    {
      heading: '7. General',
      body: 'The Promoter may amend or cancel the competition if required. Decisions are final. By checking “I agree” you confirm you have read and accept these terms.',
    },
  ],
} as const;

/** Public Supabase Storage URL (edge function fetches from here). */
export function getCampaignAssetStorageUrl(filename: string): string | null {
  const base = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '');
  if (!base) return null;
  return `${base}/storage/v1/object/public/${CAMPAIGN_ASSETS_BUCKET}/${filename}`;
}

const SCENE_STORAGE_CANDIDATES = ['afl-group-scene.jpeg', 'afl-group-scene.png'] as const;

const STORAGE_ASSET_FILES = new Set<string>([
  ...SCENE_STORAGE_CANDIDATES,
  CAMPAIGN_ASSETS.helmetFile,
  CAMPAIGN_ASSETS.logoFile,
]);

function resolveSceneStorageUrl(): string | null {
  // JPEG (~4 MB) — required for edge function memory limits; avoid 31 MB PNG in Storage.
  return getCampaignAssetStorageUrl('afl-group-scene.jpeg');
}

/**
 * Absolute URL for Gemini edge function.
 * Prefers Supabase Storage so cloud functions always get the real locker-room scene + SWAARM helmet.
 */
export function resolveCampaignAssetUrl(path: string): string {
  if (path.startsWith('http')) return path;

  const filename = path.replace(/^\/campaign\//, '');

  if (filename === CAMPAIGN_ASSETS.sceneFile || SCENE_STORAGE_CANDIDATES.includes(filename as (typeof SCENE_STORAGE_CANDIDATES)[number])) {
    const stored = resolveSceneStorageUrl();
    if (stored) return stored;
  }

  if (STORAGE_ASSET_FILES.has(filename)) {
    const stored = getCampaignAssetStorageUrl(filename);
    if (stored) return stored;
  }

  if (typeof window !== 'undefined') {
    return new URL(path, window.location.origin).href;
  }

  return path;
}

export function buildShareCaption(): string {
  return `${CAMPAIGN.caption}\n${CAMPAIGN.hashtags}`;
}

export function buildPrizeLandingUrl(source?: string): string {
  if (typeof window === 'undefined') {
    return source ? `${CAMPAIGN_URLS.landing}?source=${source}` : CAMPAIGN_URLS.landing;
  }
  const url = new URL(CAMPAIGN_URLS.landing, window.location.origin);
  if (source) url.searchParams.set('source', source);
  return url.toString();
}

export const COLORS = {
  navy: '#0a1f44',
  blue: '#1e5fc4',
};
