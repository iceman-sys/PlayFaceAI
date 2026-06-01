import { useState } from 'react';
import { Download, Copy, Check, Twitter, Facebook, Mail, RotateCcw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { CAMPAIGN } from '@/lib/constants';
import { downloadImage } from '@/lib/downloadImage';

interface Props {
  resultUrl: string;
  email: string;
  fullName: string;
  onRestart: () => void;
  onEmail: () => void;
  emailSent: boolean;
}

export default function ResultScreen({
  resultUrl,
  email,
  fullName,
  onRestart,
  onEmail,
  emailSent,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const caption = `${CAMPAIGN.caption} ${CAMPAIGN.hashtags}`;

  const copyCaption = () => {
    navigator.clipboard.writeText(caption);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      await downloadImage(resultUrl, {
        filenameBase: fullName || 'campaign',
      });
      toast.success('Image downloaded');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Download failed';
      toast.error(message);
    } finally {
      setDownloading(false);
    }
  };

  const shareUrl = encodeURIComponent(resultUrl);
  const shareText = encodeURIComponent(caption);

  return (
    <div className="text-center">
      <p className="uppercase tracking-widest text-blue-400 text-xs font-bold mb-2">You're in the squad</p>
      <h3 className="text-3xl font-black text-white mb-6">Welcome to the team, {fullName.split(' ')[0]}!</h3>
      <div className="relative rounded-2xl overflow-hidden ring-1 ring-white/10 shadow-2xl mb-6">
        <img
          src={resultUrl}
          alt="Your SWAARM campaign composite"
          className="w-full"
          crossOrigin="anonymous"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mb-4">
        <button
          type="button"
          onClick={() => void handleDownload()}
          disabled={downloading}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition"
        >
          {downloading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Download size={18} />
          )}
          {downloading ? 'Downloading…' : 'Download Image'}
        </button>
        <button
          type="button"
          onClick={copyCaption}
          className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold py-3.5 rounded-xl transition"
        >
          {copied ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
          {copied ? 'Caption Copied!' : 'Copy Caption'}
        </button>
      </div>

      <div className="flex items-center justify-center gap-3 mb-4">
        <a
          href={`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-12 h-12 rounded-full bg-[#1da1f2]/20 hover:bg-[#1da1f2]/40 flex items-center justify-center text-[#1da1f2] transition"
        >
          <Twitter size={20} />
        </a>
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-12 h-12 rounded-full bg-[#1877f2]/20 hover:bg-[#1877f2]/40 flex items-center justify-center text-[#1877f2] transition"
        >
          <Facebook size={20} />
        </a>
        <button
          type="button"
          onClick={onEmail}
          disabled={emailSent}
          className="w-12 h-12 rounded-full bg-emerald-500/20 hover:bg-emerald-500/40 flex items-center justify-center text-emerald-400 transition disabled:opacity-50"
        >
          <Mail size={20} />
        </button>
      </div>
      <p className="text-sm text-slate-400 mb-6">
        {emailSent ? `Sent to ${email} — check your inbox!` : `Want it emailed to ${email}? Tap the mail icon.`}
      </p>

      <button
        type="button"
        onClick={onRestart}
        className="inline-flex items-center gap-2 text-blue-300 hover:text-white font-semibold transition"
      >
        <RotateCcw size={16} /> Create another
      </button>

      <div className="mt-6 p-4 rounded-xl bg-white/5 text-left">
        <p className="text-xs text-slate-400 mb-1">Suggested caption</p>
        <p className="text-sm text-slate-200">{caption}</p>
      </div>
    </div>
  );
}
