import { supabase } from '@/lib/supabase';
import { trackFunnelEvent } from '@/lib/funnelAnalytics';

/** Trim whitespace and stray trailing full stops from email input. */
export function sanitizeEmail(raw: string): string {
  return raw.trim().replace(/\.+$/, '').toLowerCase();
}

export async function markPrizeEligibleOnShare(submissionId: string): Promise<void> {
  try {
    await supabase
      .from('submissions')
      .update({
        prize_eligible: true,
        prize_entered_at: new Date().toISOString(),
      })
      .eq('id', submissionId);
    void trackFunnelEvent('prize_entered', { submissionId });
  } catch {
    /* column may not exist until migration */
  }
}
