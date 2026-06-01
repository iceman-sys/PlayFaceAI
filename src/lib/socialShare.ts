import { buildShareCaption } from './shareCaption';

export function buildShareLinks(caption: string, imageUrl: string, pageUrl?: string) {
  const text = encodeURIComponent(caption);
  const shareTarget = imageUrl.startsWith('http')
    ? encodeURIComponent(imageUrl)
    : encodeURIComponent(pageUrl || (typeof window !== 'undefined' ? window.location.href : ''));

  return {
    twitter: `https://twitter.com/intent/tweet?text=${text}&url=${shareTarget}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${shareTarget}&quote=${text}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${shareTarget}`,
    caption,
  };
}

export { buildShareCaption };

export async function copyCaption(caption: string): Promise<void> {
  await navigator.clipboard.writeText(caption);
}

export async function shareNative(imageUrl: string, caption: string): Promise<boolean> {
  if (!navigator.share) return false;

  try {
    const res = await fetch(imageUrl);
    const blob = await res.blob();
    const file = new File([blob], 'swaarm-campaign.png', { type: blob.type || 'image/png' });

    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: 'My SWAARM Campaign Shot', text: caption });
      return true;
    }

    await navigator.share({ title: 'My SWAARM Campaign Shot', text: `${caption}\n${imageUrl}` });
    return true;
  } catch {
    return false;
  }
}
