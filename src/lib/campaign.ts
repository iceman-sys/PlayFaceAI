/** Tristan & Caleb AFL campaign — fixed scene + SWAARM rugby helmet */

export const CAMPAIGN_ID = 'tristan-caleb-afl-2026';

export const CAMPAIGN_SHARE_CAPTION =
  'Just a pic of me signing the song with Tristan and Caleb, my SWAARM Headgear bros!!! #SWAARM #AdvancedArmour';

export const CAMPAIGN_HELMET_URL = '/campaign/swaarm-helmet.png';

/** Replace with your hosted AFL group photo if not in public/campaign */
export const CAMPAIGN_SCENE_URL = '/campaign/afl-group-scene.png';

/** CDN fallbacks if public/campaign files are missing */
export const CAMPAIGN_HELMET_FALLBACK =
  'https://d64gsuwffb70l.cloudfront.net/6a177af514f953d19285b7d1_1779924013280_fbbb8920.webp';

export const CAMPAIGN_SCENE_FALLBACK =
  'https://d64gsuwffb70l.cloudfront.net/6a177c3447adad4194082b60_1779924206808_9304e595.jpg';

/** UI + API paths (files in public/campaign/) */
export const CAMPAIGN_HELMET_SRC = CAMPAIGN_HELMET_URL;
export const CAMPAIGN_SCENE_SRC = CAMPAIGN_SCENE_URL;

export type CampaignConfig = {
  id: string;
  name: string;
  sceneUrl: string;
  helmetUrl: string;
  shareCaption: string;
  targetPlayer: string;
};

export const TRISTAN_CALEB_CAMPAIGN: CampaignConfig = {
  id: CAMPAIGN_ID,
  name: 'Tristan & Caleb · AFL Locker Room',
  sceneUrl: CAMPAIGN_SCENE_URL,
  helmetUrl: CAMPAIGN_HELMET_URL,
  shareCaption: CAMPAIGN_SHARE_CAPTION,
  targetPlayer: 'center player (middle of five AFL teammates)',
};
