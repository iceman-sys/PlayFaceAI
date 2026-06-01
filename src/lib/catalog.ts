import { ASSETS } from './constants';

export type HelmetOption = {
  id: string;
  name: string;
  desc: string;
  imageUrl: string;
  preview?: string;
  previewGradient?: string;
  popular?: boolean;
};

export type BackdropOption = {
  id: string;
  name: string;
  imageUrl: string;
  campaign?: boolean;
};

export const HELMETS: HelmetOption[] = [
  {
    id: 'claw-strike',
    name: 'Claw Strike',
    desc: 'Signature Advanced Armour',
    imageUrl: ASSETS.helmetClean,
    preview: ASSETS.helmetClean,
    popular: true,
  },
  {
    id: 'classic-black',
    name: 'Classic Black',
    desc: 'Minimal pro look',
    imageUrl: ASSETS.helmet,
    previewGradient: 'from-zinc-600 to-zinc-900',
  },
  {
    id: 'racer-red',
    name: 'Racer Red',
    desc: 'Motorsport edge',
    imageUrl: ASSETS.helmet,
    previewGradient: 'from-red-600 to-red-950',
  },
  {
    id: 'neon-pulse',
    name: 'Neon Pulse',
    desc: 'Esports cyber style',
    imageUrl: ASSETS.helmet,
    previewGradient: 'from-fuchsia-500 to-purple-900',
  },
  {
    id: 'ice-guard',
    name: 'Ice Guard',
    desc: 'Hockey performance',
    imageUrl: ASSETS.helmet,
    previewGradient: 'from-sky-400 to-blue-900',
  },
  {
    id: 'aero-sprint',
    name: 'Aero Sprint',
    desc: 'Cyclist aerodynamic',
    imageUrl: ASSETS.helmet,
    previewGradient: 'from-lime-400 to-green-900',
  },
];

export const BACKDROPS: BackdropOption[] = [
  {
    id: 'squad-celebration',
    name: 'Squad Celebration',
    imageUrl: ASSETS.team,
    campaign: true,
  },
  {
    id: 'football-stadium',
    name: 'Football Stadium',
    imageUrl: 'https://d64gsuwffb70l.cloudfront.net/6a177c3447adad4194082b60_1779924133843_37718392.png',
  },
  {
    id: 'basketball-arena',
    name: 'Basketball Arena',
    imageUrl: 'https://d64gsuwffb70l.cloudfront.net/6a177c3447adad4194082b60_1779924149965_333acb03.jpg',
  },
  {
    id: 'racing-track',
    name: 'Racing Track',
    imageUrl: 'https://d64gsuwffb70l.cloudfront.net/6a177c3447adad4194082b60_1779924175463_880cc051.png',
  },
  {
    id: 'esports-stage',
    name: 'Esports Stage',
    imageUrl: 'https://d64gsuwffb70l.cloudfront.net/6a177c3447adad4194082b60_1779924191408_35bdcf51.jpg',
  },
  {
    id: 'media-wall',
    name: 'Media Wall',
    imageUrl: 'https://d64gsuwffb70l.cloudfront.net/6a177c3447adad4194082b60_1779924206808_9304e595.jpg',
  },
  {
    id: 'locker-room',
    name: 'Locker Room',
    imageUrl: 'https://d64gsuwffb70l.cloudfront.net/6a177c3447adad4194082b60_1779924227749_1f8aea53.png',
  },
  {
    id: 'skate-park',
    name: 'Skate Park',
    imageUrl: 'https://d64gsuwffb70l.cloudfront.net/6a177c3447adad4194082b60_1779924257447_dbcf33e9.png',
  },
  {
    id: 'hockey-rink',
    name: 'Hockey Rink',
    imageUrl: 'https://d64gsuwffb70l.cloudfront.net/6a177c3447adad4194082b60_1779924274843_11c4d264.jpg',
  },
];

export const DEFAULT_HELMET_ID = HELMETS[0].id;
export const DEFAULT_BACKDROP_ID = BACKDROPS[0].id;

export function getHelmet(id: string): HelmetOption {
  return HELMETS.find((h) => h.id === id) ?? HELMETS[0];
}

export function getBackdrop(id: string): BackdropOption {
  return BACKDROPS.find((b) => b.id === id) ?? BACKDROPS[0];
}
