export const CAMPAIGN_SHARE_CAPTION =
  'Just a pic of me signing the song with Tristan and Caleb, my SWAARM Headgear bros!!! #SWAARM #AdvancedArmour';

export function buildShareCaption(socialHandle?: string): string {
  const handle = socialHandle?.trim().replace(/^@+/, '');
  if (!handle) return CAMPAIGN_SHARE_CAPTION;
  return `${CAMPAIGN_SHARE_CAPTION} @${handle}`;
}
