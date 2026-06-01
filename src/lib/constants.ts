/** Local campaign assets — served by Vite from public/campaign/ (no CloudFront dependency). */
export const CAMPAIGN = {
  scene: '/campaign/afl-group-scene.png',
  helmet: '/campaign/swaarm-helmet.png',
  helmetTransparent: '/campaign/swaarm-helmet-transparent.png',
};

export const ASSETS = {
  hero: 'https://d64gsuwffb70l.cloudfront.net/6a19ad56183dcb3986199c2f_1780067783652_75aa60b3.jpg',
  team: CAMPAIGN.scene,
  helmet: CAMPAIGN.helmet,
  helmetClean: CAMPAIGN.helmetTransparent,
};

export const BRAND = {
  name: 'SWAARM',
  tagline: 'Become Part Of The Team',
  campaign: 'SWAARM Rugby 2026',
  caption: 'Just a pic of me signing the song with Tristan and Caleb, my SWAARM Headgear bros!!! #SWAARM #AdvancedArmour',
};

export const PROCESS_STEPS = [
  { title: 'Detect & Preserve', desc: 'We detect your face and lock in your real identity — no AI hallucination.' },
  { title: 'Fit The Headgear', desc: 'The official SWAARM headgear is fitted naturally onto your head.' },
  { title: 'Drop Into The Team', desc: 'You\'re composited into the team celebration with matched lighting & shadows.' },
  { title: 'Photoreal Harmonize', desc: 'Final harmonization removes cutout artifacts for a real-photo finish.' }
];

export const PIPELINE_STAGES = [
  'Detecting face & landmarks',
  'Preserving facial identity',
  'Fitting SWAARM headgear',
  'Removing background',
  'Compositing into team photo',
  'Matching lighting & shadows',
  'Photorealistic harmonization'
];
