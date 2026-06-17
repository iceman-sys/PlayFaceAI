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
  Gift,
  Link2,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { buildReferralUrl, buildShareCaption } from '@/lib/constants';
import { downloadImage } from '@/lib/downloadImage';
import { incrementShareCount, trackFunnelEvent } from '@/lib/funnelAnalytics';

interface Props {
  imageWithHelmetUrl: string;
  imageWithoutHelmetUrl: string;
  email: string;
  fullName: string;
  submissionId: string | null;
  referralCode: string;
  prizeEligible: boolean;
  onNewSelfie: () => void;
  onResendEmail: () => Promise<void>;
  emailSent: boolean;
  emailSending: boolean;
  hasDistinctVariants: boolean;
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
  fullName,
  submissionId,
  referralCode,
  prizeEligible,
  onNewSelfie,
  onResendEmail,
  emailSent,
  emailSending,
  hasDistinctVariants,
}: Props) {
  const [showHelmet, setShowHelmet] = useState(true);
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);

  const activeUrl = showHelmet ? imageWithHelmetUrl : imageWithoutHelmetUrl;
  const referralUrl = referralCode ? buildReferralUrl(referralCode) : '';
  const caption = buildShareCaption(referralUrl || undefined);
  const firstName = fullName.trim().split(/\s+/)[0] || 'Champ';

  useEffect(() => {
    const urls = [imageWithHelmetUrl, imageWithoutHelmetUrl].filter(Boolean);
    void Promise.allSettled(urls.map((url) => preloadImage(url)));
  }, [imageWithHelmetUrl, imageWithoutHelmetUrl]);

  const trackShare = async (platform: Parameters<typeof trackFunnelEvent>[0]) => {
    void trackFunnelEvent(platform, { submissionId });
    if (submissionId) {
      await incrementShareCount(submissionId);
    }
  };

  const switchVariant = (withHelmet: boolean) => {
    if (withHelmet === showHelmet) return;
    setShowHelmet(withHelmet);
    setImageLoading(true);
  };

  const copyCaption = async () => {
    try {
      await navigator.clipboard.writeText(caption);
      setCopied(true);
      toast.success('Caption copied');
      await trackShare('share_copy_caption');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy caption');
    }
  };

  const copyReferralLink = async () => {
    if (!referralUrl) return;
    try {
      await navigator.clipboard.writeText(referralUrl);
      setLinkCopied(true);
      toast.success('Referral link copied — share to grow the chorus');
      await trackShare('share_copy_link');
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      toast.error('Could not copy link');
    }
  };

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const suffix = showHelmet ? 'with-headgear' : 'without-headgear';
      await downloadImage(activeUrl, {
        filenameBase: `${fullName || 'swaarm'}-${suffix}`,
      });
      toast.success('Image downloaded');
      await trackShare('download_image');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setDownloading(false);
    }
  };

  const shareText = encodeURIComponent(caption);
  const shareUrl = encodeURIComponent(referralUrl || activeUrl);

  const shareInstagram = async () => {
    await copyCaption();
    if (navigator.share) {
      try {
        await navigator.share({ title: 'SWAARM in the Chorus', text: caption, url: referralUrl || activeUrl });
        await trackShare('share_native');
        return;
      } catch {
        /* user cancelled */
      }
    }
    toast.message('Caption copied — download your image, then share to Instagram');
    await trackShare('share_instagram');
  };

  return (
    <div className="text-center">
      {prizeEligible && (
        <div className="mb-5 inline-flex items-center gap-2 bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30 rounded-full px-4 py-2 text-sm font-bold">
          <Gift size={16} /> You&apos;re entered in the competition
        </div>
      )}

      <p className="uppercase tracking-widest text-blue-400 text-xs font-bold mb-2">You&apos;re in the chorus</p>
      <h3 className="text-3xl font-black text-white mb-4">Sing it one and all, {firstName}!</h3>

      {hasDistinctVariants && (
        <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-white/10 ring-1 ring-white/10 mb-5">
          <button
            type="button"
            onClick={() => switchVariant(true)}
            disabled={imageLoading}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
              showHelmet ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Shield size={16} /> With headgear
          </button>
          <button
            type="button"
            onClick={() => switchVariant(false)}
            disabled={imageLoading}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
              !showHelmet ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
            }`}
          >
            <ShieldOff size={16} /> Without headgear
          </button>
        </div>
      )}

      <div className="relative rounded-2xl overflow-hidden ring-1 ring-white/10 shadow-2xl mb-6 bg-black/30 min-h-[200px] flex items-center justify-center">
        {imageLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#0a1f44]/80 backdrop-blur-sm">
            <Loader2 className="w-10 h-10 animate-spin text-blue-400" />
            <p className="text-sm text-blue-200 font-medium animate-pulse">Loading image…</p>
          </div>
        )}
        <img
          key={activeUrl}
          src={activeUrl}
          alt="Your SWAARM campaign composite"
          className="w-full h-auto max-h-[70vh] object-contain"
          crossOrigin="anonymous"
          onLoad={() => setImageLoading(false)}
          onError={() => {
            setImageLoading(false);
            toast.error('Could not load image');
          }}
        />
      </div>

      {referralUrl && (
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-blue-600/20 to-purple-600/20 ring-1 ring-white/10 text-left">
          <div className="flex items-center gap-2 text-blue-300 text-xs font-bold uppercase tracking-widest mb-2">
            <Users size={14} /> Spread the chorus
          </div>
          <p className="text-sm text-slate-300 mb-3">
            Share your unique link — when friends scan or click it, they join from your referral.
          </p>
          <div className="flex gap-2">
            <input
              readOnly
              value={referralUrl}
              className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-300 truncate"
            />
            <button
              type="button"
              onClick={() => void copyReferralLink()}
              className="shrink-0 flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
            >
              {linkCopied ? <Check size={16} /> : <Link2 size={16} />}
              {linkCopied ? 'Copied' : 'Copy link'}
            </button>
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-3 mb-4">
        <button
          type="button"
          onClick={() => void handleDownload()}
          disabled={downloading || imageLoading}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition"
        >
          {downloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
          {downloading ? 'Downloading…' : 'Download image'}
        </button>
        <button
          type="button"
          onClick={() => void copyCaption()}
          className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold py-3.5 rounded-xl transition"
        >
          {copied ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
          {copied ? 'Caption copied!' : 'Copy caption'}
        </button>
      </div>

      <div className="flex items-center justify-center gap-3 mb-4">
        <a
          href={`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => void trackShare('share_twitter')}
          className="w-12 h-12 rounded-full bg-[#1da1f2]/20 hover:bg-[#1da1f2]/40 flex items-center justify-center text-[#1da1f2] transition"
          aria-label="Share on X"
        >
          <Twitter size={20} />
        </a>
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => void trackShare('share_facebook')}
          className="w-12 h-12 rounded-full bg-[#1877f2]/20 hover:bg-[#1877f2]/40 flex items-center justify-center text-[#1877f2] transition"
          aria-label="Share on Facebook"
        >
          <Facebook size={20} />
        </a>
        <button
          type="button"
          onClick={() => void shareInstagram()}
          className="w-12 h-12 rounded-full bg-pink-500/20 hover:bg-pink-500/40 flex items-center justify-center text-pink-400 transition"
          aria-label="Share to Instagram"
        >
          <Instagram size={20} />
        </button>
        <button
          type="button"
          onClick={() => void onResendEmail()}
          disabled={emailSending}
          className="w-12 h-12 rounded-full bg-emerald-500/20 hover:bg-emerald-500/40 flex items-center justify-center text-emerald-400 transition disabled:opacity-50"
          aria-label="Email result"
        >
          {emailSending ? <Loader2 size={20} className="animate-spin" /> : <Mail size={20} />}
        </button>
      </div>

      <p className="text-sm text-slate-400 mb-6">
        {emailSent
          ? `Both versions sent to ${email} — check your inbox (and spam).`
          : emailSending
            ? `Sending to ${email}…`
            : `Tap the mail icon to email both images to ${email}.`}
      </p>

      <button
        type="button"
        onClick={onNewSelfie}
        className="inline-flex items-center gap-2 text-blue-300 hover:text-white font-semibold transition"
      >
        <RotateCcw size={16} /> Try another selfie
      </button>

      <div className="mt-6 p-4 rounded-xl bg-white/5 text-left">
        <p className="text-xs text-slate-400 mb-1">Suggested caption</p>
        <p className="text-sm text-slate-200 whitespace-pre-line">{caption}</p>
      </div>
    </div>
  );
}
