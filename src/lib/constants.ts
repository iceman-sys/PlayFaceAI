/** Fixed campaign assets — public/campaign/ + Supabase Storage campaign-assets bucket */
export const CAMPAIGN_ASSETS = {
  sceneFile: 'afl-group-scene.png',
  helmetFile: 'swaarm-helmet.png',
  scenePath: '/campaign/afl-group-scene.png',
  helmetPath: '/campaign/swaarm-helmet.png',
} as const;

const CAMPAIGN_ASSETS_BUCKET = 'campaign-assets';

export const CAMPAIGN = {
  name: 'SWAARM in the Chorus',
  slug: 'swaarm-chorus',
  event: 'North Melbourne · Marvel Stadium',
  eventDate: '28 June 2026',
  tagline:
    'Thanks to North Melbourne’s headgear partner SWAARM — worn by Tristan Xerri and Caleb Daniel — take your place in the team song and SWAARM in the Chorus!',
  backdropUrl: CAMPAIGN_ASSETS.scenePath,
  helmetUrl: CAMPAIGN_ASSETS.helmetPath,
  heroUrl: CAMPAIGN_ASSETS.scenePath,
  caption:
    "How cool, I Got to SWAARM in the chorus and sing it one and all - Good old North Melbourne, they're champions you'll agree",
  hashtags: '#SWAARM #AdvancedArmour #SwarmInTheChorus #NorthMelbourne',
};

export const PRIZES = {
  headline: 'Win SWAARM merch & join the chorus',
  subheadline: 'Generate your AI team-song photo to enter the competition.',
  drawDate: '5 July 2026',
  prizeCount: 10,
  items: [
    {
      title: 'SWAARM Advanced Armour prize pack',
      description:
        '10 prize packs — exclusive SWAARM headgear and partner merchandise for selected entrants.',
      icon: 'shield' as const,
    },
    {
      title: 'Featured in the campaign',
      description: 'Your AI image celebrates singing the song with Tristan, Caleb and the Roos.',
      icon: 'sparkles' as const,
    },
    {
      title: 'How to enter',
      description:
        'Accept the competition terms, upload a selfie, and generate your campaign shot. Share your link to spread the chorus.',
      icon: 'camera' as const,
    },
  ],
};

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
  lastUpdated: '28 May 2026',
  sections: [
    {
      heading: '1. Promoter',
      body: 'SWAARM Advanced Armour in partnership with North Melbourne Football Club (“Promoter”).',
    },
    {
      heading: '2. Eligibility',
      body: 'Open to Australian residents aged 18+. Employees of the Promoter and immediate family are ineligible. One prize entry per person per email address.',
    },
    {
      heading: '3. How to enter',
      body: 'Scan the stadium QR code or visit the campaign landing page, accept these terms, enter your name and email, upload a selfie, and successfully generate your SWAARM in the Chorus image. Completed entries are recorded when generation succeeds.',
    },
    {
      heading: '4. Prizes',
      body: `Up to ${PRIZES.prizeCount} SWAARM Advanced Armour prize packs (headgear and partner merchandise). Prizes are not transferable and cannot be exchanged for cash.`,
    },
    {
      heading: '5. Draw',
      body: `All eligible entries received by ${PRIZES.drawDate} will be included in a random draw. Winners will be notified by email within 7 days.`,
    },
    {
      heading: '6. Viral sharing',
      body: 'Sharing your unique referral link may help friends enter. Sharing does not guarantee additional entries unless stated in stadium announcements.',
    },
    {
      heading: '7. Privacy & image use',
      body: 'Your email is used to deliver your image and contact winners. By entering you grant the Promoter a licence to use your generated campaign image for marketing related to this campaign.',
    },
    {
      heading: '8. General',
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

/**
 * Absolute URL for Gemini edge function.
 * Prefers Supabase Storage so cloud functions always get the real locker-room scene + SWAARM helmet.
 */
export function resolveCampaignAssetUrl(path: string): string {
  if (path.startsWith('http')) return path;

  const filename = path.replace(/^\/campaign\//, '');
  if (filename === CAMPAIGN_ASSETS.sceneFile || filename === CAMPAIGN_ASSETS.helmetFile) {
    const stored = getCampaignAssetStorageUrl(filename);
    if (stored) return stored;
  }

  if (typeof window !== 'undefined') {
    return new URL(path, window.location.origin).href;
  }

  return path;
}

export function buildShareCaption(referralUrl?: string): string {
  if (referralUrl) {
    return `${CAMPAIGN.caption}\n\nJoin the chorus: ${referralUrl}`;
  }
  return CAMPAIGN.caption;
}

export function buildReferralUrl(referralCode: string): string {
  if (typeof window === 'undefined') {
    return `${CAMPAIGN_URLS.landing}?ref=${referralCode}`;
  }
  const url = new URL(CAMPAIGN_URLS.landing, window.location.origin);
  url.searchParams.set('ref', referralCode);
  return url.toString();
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
