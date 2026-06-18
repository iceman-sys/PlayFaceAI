export type SocialPlatform = 'facebook' | 'instagram';

export type NativeShareResult = 'shared' | 'cancelled' | 'unsupported';

/** Phones/tablets — where native image share may reach Instagram/Facebook apps. */
export function isMobileShareDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent;
  if (/Android|iPhone|iPad|iPod/i.test(ua)) return true;
  return navigator.maxTouchPoints > 1 && window.innerWidth < 1024;
}

/** Desktop browsers (e.g. Windows) usually cannot share image files via Web Share API. */
export function canShareImageFiles(): boolean {
  if (typeof navigator === 'undefined' || !navigator.share || !navigator.canShare) return false;
  try {
    const probe = new File(['x'], 'share-probe.jpg', { type: 'image/jpeg' });
    return navigator.canShare({ files: [probe], text: 'probe' });
  } catch {
    return false;
  }
}

export async function fetchImageAsShareFile(imageUrl: string, filenameBase: string): Promise<File> {
  const res = await fetch(imageUrl, { mode: 'cors', credentials: 'omit' });
  if (!res.ok) throw new Error(`Could not load image (${res.status})`);
  const blob = await res.blob();
  const ext = blob.type.includes('png') ? 'png' : 'jpg';
  const mime = blob.type || (ext === 'png' ? 'image/png' : 'image/jpeg');
  return new File([blob], `${filenameBase}.${ext}`, { type: mime });
}

/**
 * Share image + caption via Web Share API (files only — never URL-only fallback).
 * URL-only fallback opens the confusing Windows Share sheet without Instagram.
 */
export async function tryNativeImageShare(
  file: File,
  caption: string,
  title = 'SWAARM in the Chorus',
): Promise<NativeShareResult> {
  if (!navigator.share) return 'unsupported';

  const payload = { files: [file], text: caption, title };
  if (!navigator.canShare?.(payload)) return 'unsupported';

  try {
    await navigator.share(payload);
    return 'shared';
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') return 'cancelled';
    return 'unsupported';
  }
}

export function platformOpenUrl(platform: SocialPlatform): string {
  if (platform === 'instagram') {
    return isMobileShareDevice() ? 'https://www.instagram.com/' : 'https://www.instagram.com/';
  }
  return 'https://www.facebook.com/';
}

export const SHARE_GUIDE_STEPS: Record<
  SocialPlatform,
  { title: string; steps: string[]; openLabel: string }
> = {
  facebook: {
    title: 'Share on Facebook',
    openLabel: 'Open Facebook',
    steps: [
      'Your team-song image has been downloaded to your device.',
      'The caption and hashtags have been copied — paste them into your post.',
      'In Facebook, create a new post and upload the downloaded image.',
      'Paste the caption, then publish with the hashtags to enter the draw.',
    ],
  },
  instagram: {
    title: 'Share on Instagram',
    openLabel: 'Open Instagram',
    steps: [
      'Your team-song image has been downloaded to your device.',
      'The caption and hashtags have been copied — paste them into your post.',
      'In Instagram, tap + to create a new post and select the downloaded image.',
      'Paste the caption, then publish with the hashtags to enter the draw.',
    ],
  },
};
