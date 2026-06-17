import { supabase } from '@/lib/supabase';
import { getCampaignSession } from '@/lib/campaignTracking';

export type FunnelEventType =
  | 'landing_view'
  | 'prize_section_viewed'
  | 'cta_clicked'
  | 'create_page_view'
  | 'details_submitted'
  | 'terms_accepted'
  | 'selfie_uploaded'
  | 'generation_started'
  | 'generation_completed'
  | 'generation_failed'
  | 'share_twitter'
  | 'share_facebook'
  | 'share_instagram'
  | 'share_copy_caption'
  | 'share_copy_link'
  | 'share_native'
  | 'download_image'
  | 'referral_landing'
  | 'prize_entered';

type EventPayload = Record<string, string | number | boolean | null | undefined>;

function sendGaEvent(eventType: FunnelEventType, payload?: EventPayload): void {
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (!measurementId || typeof window === 'undefined') return;

  const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
  if (!gtag) return;

  gtag('event', eventType, {
    campaign_source: getCampaignSession().campaign_source,
    ...payload,
  });
}

export async function trackFunnelEvent(
  eventType: FunnelEventType,
  options?: {
    submissionId?: string | null;
    payload?: EventPayload;
  },
): Promise<void> {
  const session = getCampaignSession();
  const payload = options?.payload ?? {};

  sendGaEvent(eventType, payload);

  try {
    await supabase.from('campaign_events').insert({
      event_type: eventType,
      submission_id: options?.submissionId ?? null,
      campaign_source: session.campaign_source,
      session_id: session.session_id,
      event_data: {
        ...payload,
        referral_code: session.referral_code ?? null,
        referred_by_submission_id: session.referred_by_submission_id ?? null,
      },
    });
  } catch {
    /* table may not exist until migration */
  }
}

export async function incrementShareCount(submissionId: string): Promise<void> {
  try {
    await supabase.rpc('increment_submission_share_count', { sub_id: submissionId });
  } catch {
    /* RPC may not exist until migration */
  }
}
