const STORAGE_KEY = 'swaarm_campaign_session';

/** Campaign sources used for stadium QR and partner tracking */
export const STADIUM_SOURCES = new Set([
  'marvel-stadium-qr',
  'stadium',
  'stadium-qr',
  'marvel-stadium',
]);

export type CampaignSession = {
  session_id: string;
  campaign_source: string;
  prize_section_viewed: boolean;
  prize_section_viewed_at?: string;
  referral_code?: string;
  referred_by_submission_id?: string;
  landing_viewed_at?: string;
};

export function isStadiumSource(source: string): boolean {
  return STADIUM_SOURCES.has(source.toLowerCase());
}

function createSessionId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function initCampaignTracking(): CampaignSession {
  const params = new URLSearchParams(window.location.search);

  const sourceParam =
    params.get('source')?.trim() ||
    params.get('utm_source')?.trim() ||
    null;

  const refParam = params.get('ref')?.trim() || null;

  const existing = readSession();
  const session: CampaignSession = {
    session_id: existing?.session_id ?? createSessionId(),
    campaign_source: existing?.campaign_source ?? sourceParam ?? 'direct',
    prize_section_viewed: existing?.prize_section_viewed ?? false,
    prize_section_viewed_at: existing?.prize_section_viewed_at,
    referral_code: existing?.referral_code,
    referred_by_submission_id: existing?.referred_by_submission_id,
    landing_viewed_at: existing?.landing_viewed_at,
  };

  if (!existing && sourceParam) {
    session.campaign_source = sourceParam;
  }

  if (refParam && refParam.length >= 6) {
    session.referral_code = refParam.toLowerCase();
  }

  if (!session.landing_viewed_at) {
    session.landing_viewed_at = new Date().toISOString();
  }

  writeSession(session);

  if (refParam && refParam.length >= 6) {
    void resolveReferralCode(refParam);
  }

  return session;
}

export function getCampaignSession(): CampaignSession {
  return readSession() ?? initCampaignTracking();
}

export function markPrizeSectionViewed(): CampaignSession {
  const session = getCampaignSession();
  if (session.prize_section_viewed) return session;

  const updated: CampaignSession = {
    ...session,
    prize_section_viewed: true,
    prize_section_viewed_at: new Date().toISOString(),
  };
  writeSession(updated);
  return updated;
}

export function setReferredBySubmissionId(submissionId: string): CampaignSession {
  const session = getCampaignSession();
  const updated: CampaignSession = {
    ...session,
    referred_by_submission_id: submissionId,
  };
  writeSession(updated);
  return updated;
}

export function buildReferralCodeFromId(submissionId: string): string {
  return submissionId.replace(/-/g, '').slice(0, 8).toLowerCase();
}

async function resolveReferralCode(code: string): Promise<void> {
  try {
    const { supabase } = await import('@/lib/supabase');
    const { data, error } = await supabase.rpc('get_referral_submission_id', {
      code: code.toLowerCase(),
    });
    if (!error && data) {
      setReferredBySubmissionId(data as string);
    }
  } catch {
    /* RPC may not exist until migration runs */
  }
}

function readSession(): CampaignSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CampaignSession;
    if (!parsed.session_id) {
      parsed.session_id = createSessionId();
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeSession(session: CampaignSession): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}
