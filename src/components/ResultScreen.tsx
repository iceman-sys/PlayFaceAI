import { useEffect, useState } from 'react';
import {
  Download,
  Copy,
  Check,
  Twitter,
  Facebook,
  Mail,
  RotateCcw,
  Loader2,
  Instagram,
  Shield,
  ShieldOff,
} from 'lucide-react';
import { toast } from 'sonner';
import ShareGuideDialog from '@/components/ShareGuideDialog';
import { buildShareCaption } from '@/lib/constants';
import { downloadImage } from '@/lib/downloadImage';
import { incrementShareCount, trackFunnelEvent } from '@/lib/funnelAnalytics';
import {
  canShareImageFiles,
  fetchImageAsShareFile,
  isMobileShareDevice,
  tryNativeImageShare,
  type SocialPlatform,
} from '@/lib/socialShare';
import { markPrizeEligibleOnShare } from '@/lib/submissions';

interface Props {
  imageWithHelmetUrl: string;
  imageWithoutHelmetUrl: string;
  email: string;
  fullName: string;
  submissionId: string | null;
  onNewSelfie: () => void;
  onResendEmail: () => Promise<void>;
  emailSent: boolean;
  emailSending: boolean;
  hasDistinctVariants: boolean;
  onShared?: () => void;
}

function preloadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Image failed to load'));
    img.src = url;
  });
}

export default function ResultScreen({
  imageWithHelmetUrl,
  imageWithoutHelmetUrl,
  email,
  onNewSelfie,
  onResendEmail,
  emailSent,
  emailSending,
  hasDistinctVariants,
  submissionId,
  onShared,
}: Props) {
  const [showHelmet, setShowHelmet] = useState(true);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [sharePreparing, setSharePreparing] = useState(false);
  const [guidePlatform, setGuidePlatform] = useState<SocialPlatform | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);

  const activeUrl = showHelmet ? imageWithHelmetUrl : imageWithoutHelmetUrl;
  const caption = buildShareCaption();
  const downloadBase = showHelmet ? 'swaarm-team-song-with-headgear' : 'swaarm-team-song-without-headgear';

  useEffect(() => {
    const urls = [imageWithHelmetUrl, imageWithoutHelmetUrl].filter(Boolean);
    void Promise.allSettled(urls.map((url) => preloadImage(url)));
  }, [imageWithHelmetUrl, imageWithoutHelmetUrl]);

  const recordShare = async (platform: Parameters<typeof trackFunnelEvent>[0]) => {
    void trackFunnelEvent(platform, { submissionId });
    if (submissionId) {
      await incrementShareCount(submissionId);
      await markPrizeEligibleOnShare(submissionId);
      onShared?.();
    }
  };

  const copyCaption = async (): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(caption);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      return true;
    } catch {
      toast.error('Could not copy caption');
      return false;
    }
  };

  const downloadActiveImage = async (): Promise<boolean> => {
    try {
      await downloadImage(activeUrl, { filenameBase: downloadBase });
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Download failed');
      return false;
    }
  };

  const prepareManualSocialShare = async (platform: SocialPlatform): Promise<boolean> => {
    setSharePreparing(true);
    try {
      const [captionOk, downloadOk] = await Promise.all([copyCaption(), downloadActiveImage()]);
      if (!captionOk || !downloadOk) return false;
      setGuidePlatform(platform);
      setGuideOpen(true);
      toast.success('Image downloaded and caption copied');
      return true;
    } finally {
      setSharePreparing(false);
    }
  };

  const shareToTwitter = async () => {
    await copyCaption();
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(caption)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    toast.message('Caption copied — add your downloaded image in X if you post a photo');
    await recordShare('share_twitter');
  };

  const shareToFacebook = async () => {
    if (sharePreparing) return;

    if (isMobileShareDevice() && canShareImageFiles()) {
      setSharePreparing(true);
      try {
        const file = await fetchImageAsShareFile(activeUrl, downloadBase);
        const result = await tryNativeImageShare(file, caption);
        if (result === 'shared') {
          await copyCaption();
          toast.success('Shared! Paste the caption if needed and post with the hashtags.');
          await recordShare('share_facebook');
          return;
        }
        if (result === 'cancelled') return;
      } catch {
        // fall through to manual guide
      } finally {
        setSharePreparing(false);
      }
    }

    const ok = await prepareManualSocialShare('facebook');
    if (ok) await recordShare('share_facebook');
  };

  const shareToInstagram = async () => {
    if (sharePreparing) return;

    if (isMobileShareDevice() && canShareImageFiles()) {
      setSharePreparing(true);
      try {
        const file = await fetchImageAsShareFile(activeUrl, downloadBase);
        const result = await tryNativeImageShare(file, caption);
        if (result === 'shared') {
          await copyCaption();
          toast.success('Choose Instagram in the share menu, then paste the caption.');
          await recordShare('share_instagram');
          return;
        }
        if (result === 'cancelled') return;
      } catch {
        // fall through to manual guide
      } finally {
        setSharePreparing(false);
      }
    }

    const ok = await prepareManualSocialShare('instagram');
    if (ok) await recordShare('share_instagram');
  };

  const switchVariant = (withHelmet: boolean) => {
    if (withHelmet === showHelmet) return;
    setShowHelmet(withHelmet);
    setImageLoading(true);
  };

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      await downloadImage(activeUrl, { filenameBase: downloadBase });
      toast.success('Image downloaded');
      await recordShare('download_image');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setDownloading(false);
    }
  };

  const handleEmail = async () => {
    if (emailSending) return;
    try {
      await onResendEmail();
    } catch {
      toast.error('Could not send email — check your address and try again');
    }
  };

  const handleCopyCaptionClick = async () => {
    const ok = await copyCaption();
    if (ok) toast.success('Caption copied — paste when you share');
  };

  const socialBusy = sharePreparing;

  return (
    <div className="text-center">
      <ShareGuideDialog
        platform={guidePlatform}
        open={guideOpen}
        onOpenChange={setGuideOpen}
      />

      {hasDistinctVariants ? (
        <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-white/10 ring-1 ring-white/10 mb-5">
          <button
            type="button"
            onClick={() => switchVariant(true)}
            disabled={imageLoading || socialBusy}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
              showHelmet ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Shield size={16} /> With headgear
          </button>
          <button
            type="button"
            onClick={() => switchVariant(false)}
            disabled={imageLoading || socialBusy}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
              !showHelmet ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
            }`}
          >
            <ShieldOff size={16} /> Without headgear
          </button>
        </div>
      ) : null}

      <div className="relative w-full rounded-2xl ring-1 ring-white/10 shadow-2xl mb-6 bg-black/20">
        {imageLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#0a1f44]/80 backdrop-blur-sm rounded-2xl min-h-[12rem]">
            <Loader2 className="w-10 h-10 animate-spin text-blue-400" />
            <p className="text-sm text-blue-200 font-medium animate-pulse">Loading image…</p>
          </div>
        )}
        <img
          key={activeUrl}
          src={activeUrl}
          alt="Your SWAARM team song photo"
          className="block w-full h-auto max-w-full"
          crossOrigin="anonymous"
          onLoad={() => setImageLoading(false)}
          onError={() => {
            setImageLoading(false);
            toast.error('Could not load image');
          }}
        />
      </div>

      <div className="flex items-center justify-center gap-3 mb-4">
        <button
          type="button"
          onClick={() => void shareToTwitter()}
          disabled={socialBusy || imageLoading}
          className="w-12 h-12 rounded-full bg-[#1da1f2]/20 hover:bg-[#1da1f2]/40 flex items-center justify-center text-[#1da1f2] transition disabled:opacity-50"
          aria-label="Share on X"
        >
          <Twitter size={20} />
        </button>
        <button
          type="button"
          onClick={() => void shareToFacebook()}
          disabled={socialBusy || imageLoading}
          className="w-12 h-12 rounded-full bg-[#1877f2]/20 hover:bg-[#1877f2]/40 flex items-center justify-center text-[#1877f2] transition disabled:opacity-50"
          aria-label="Share on Facebook"
        >
          {socialBusy ? <Loader2 size={20} className="animate-spin" /> : <Facebook size={20} />}
        </button>
        <button
          type="button"
          onClick={() => void shareToInstagram()}
          disabled={socialBusy || imageLoading}
          className="w-12 h-12 rounded-full bg-pink-500/20 hover:bg-pink-500/40 flex items-center justify-center text-pink-400 transition disabled:opacity-50"
          aria-label="Share to Instagram"
        >
          {socialBusy ? <Loader2 size={20} className="animate-spin" /> : <Instagram size={20} />}
        </button>
        <button
          type="button"
          onClick={() => void handleEmail()}
          disabled={emailSending || socialBusy}
          className="w-12 h-12 rounded-full bg-emerald-500/20 hover:bg-emerald-500/40 flex items-center justify-center text-emerald-400 transition disabled:opacity-50"
          aria-label="Email images"
        >
          {emailSending ? <Loader2 size={20} className="animate-spin" /> : <Mail size={20} />}
        </button>
        <button
          type="button"
          onClick={() => void handleDownload()}
          disabled={downloading || imageLoading || socialBusy}
          className="w-12 h-12 rounded-full bg-blue-600/30 hover:bg-blue-600/50 flex items-center justify-center text-blue-300 transition disabled:opacity-50"
          aria-label="Download image"
        >
          {downloading ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
        </button>
      </div>

      <div className="text-sm text-slate-300 mb-6 max-w-xl mx-auto space-y-2">
        <p>
          Use above icons to share your image into social media. Include the suggested hashtags for your
          chance to win{' '}
          <button
            type="button"
            onClick={() => void handleCopyCaptionClick()}
            className="text-blue-300 hover:text-white font-semibold underline underline-offset-2 transition"
          >
            (Copy caption)
          </button>
        </p>
        <p>
          Facebook and Instagram: we download your image and copy the caption — then follow the steps to
          post. On mobile you may see your phone&apos;s share menu with Instagram.
        </p>
        <p>You can also download or email yourself both images.</p>
        {emailSent && (
          <p className="text-xs text-emerald-400">Both versions emailed to {email}.</p>
        )}
        {emailSending && (
          <p className="text-xs text-slate-400">Emailing both images to {email}…</p>
        )}
      </div>

      <button
        type="button"
        onClick={onNewSelfie}
        className="mb-6 inline-flex items-center gap-2 text-blue-300 hover:text-white font-semibold transition"
      >
        <RotateCcw size={16} /> Try another selfie
      </button>

      <div className="mt-2 p-4 rounded-xl bg-white/5 text-left">
        <div className="flex items-start justify-between gap-3 mb-2">
          <p className="text-xs text-slate-400">Suggested caption & hashtags</p>
          <button
            type="button"
            onClick={() => void handleCopyCaptionClick()}
            className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-blue-300 hover:text-white transition"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            {copied ? 'Copied' : 'Copy caption'}
          </button>
        </div>
        <p className="text-sm text-slate-200 whitespace-pre-line">{caption}</p>
      </div>
    </div>
  );
}
