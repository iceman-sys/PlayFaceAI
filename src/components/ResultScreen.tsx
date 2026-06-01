import { useState, useMemo } from 'react';
import {
  Download, Copy, Check, RotateCcw, Twitter, Facebook, Linkedin, Share2, Mail, AlertCircle,
} from 'lucide-react';
import { buildShareCaption } from '@/lib/shareCaption';
import { buildShareLinks, copyCaption, shareNative } from '@/lib/socialShare';

interface Props {
  resultUrl: string;
  email: string;
  fullName: string;
  socialHandle?: string;
  shareCaption?: string;
  emailed?: boolean;
  onRestart: () => void;
}

export default function ResultScreen({
  resultUrl,
  email,
  fullName,
  socialHandle,
  shareCaption: shareCaptionProp,
  emailed = false,
  onRestart,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);

  const caption = shareCaptionProp || buildShareCaption(socialHandle);
  const links = useMemo(
    () => buildShareLinks(caption, resultUrl),
    [caption, resultUrl],
  );

  const download = async () => {
    try {
      const res = await fetch(resultUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `swaarm-${fullName.replace(/\s+/g, '-').toLowerCase()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      window.open(resultUrl, '_blank');
    }
  };

  const handleCopyCaption = async () => {
    await copyCaption(caption);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    setSharing(true);
    try {
      const ok = await shareNative(resultUrl, caption);
      if (!ok) {
        await handleCopyCaption();
      }
    } finally {
      setSharing(false);
    }
  };

  return (
    <section className="min-h-screen bg-gradient-to-b from-[#08090d] to-[#0d1018] pt-24 pb-16 px-5">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <span className="inline-block bg-cyan-400/15 text-cyan-300 font-bold rounded-full px-4 py-1.5 text-sm">
            CAMPAIGN READY
          </span>
          <h2 className="mt-4 text-4xl sm:text-5xl font-black text-white">
            You're in the squad, {fullName.split(' ')[0]}!
          </h2>
          <p className="mt-3 text-white/60">Download, share it, or check your inbox.</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 rounded-2xl overflow-hidden border border-white/10 bg-black">
            <img src={resultUrl} alt="Your campaign shot" className="w-full object-contain" />
          </div>

          <div className="space-y-4">
            <button
              onClick={download}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-400 to-blue-600 text-black font-bold py-4 rounded-xl hover:scale-[1.02] transition"
            >
              <Download className="w-5 h-5" /> Download Image
            </button>

            <button
              onClick={handleNativeShare}
              disabled={sharing}
              className="w-full flex items-center justify-center gap-2 border border-cyan-400/40 bg-cyan-400/10 text-cyan-300 font-bold py-3 rounded-xl hover:bg-cyan-400/20 transition disabled:opacity-50"
            >
              <Share2 className="w-5 h-5" />
              {sharing ? 'Opening share…' : 'Share Image + Caption'}
            </button>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-white/50 mb-2 font-semibold">SHARE CAPTION</p>
              <p className="text-sm text-white/80 leading-relaxed">"{caption}"</p>
              {socialHandle && (
                <p className="mt-2 text-xs text-cyan-400/80">Includes your handle {socialHandle.startsWith('@') ? socialHandle : `@${socialHandle}`}</p>
              )}
              <button
                onClick={handleCopyCaption}
                className="mt-3 w-full flex items-center justify-center gap-2 border border-white/15 text-white font-semibold py-2.5 rounded-lg hover:bg-white/10 transition"
              >
                {copied ? (
                  <><Check className="w-4 h-4 text-cyan-400" /> Copied!</>
                ) : (
                  <><Copy className="w-4 h-4" /> Copy Caption</>
                )}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <a
                href={links.twitter}
                target="_blank"
                rel="noopener noreferrer"
                title="Share on X"
                className="flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl py-3 text-white transition"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href={links.facebook}
                target="_blank"
                rel="noopener noreferrer"
                title="Share on Facebook"
                className="flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl py-3 text-white transition"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href={links.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                title="Share on LinkedIn"
                className="flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl py-3 text-white transition"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            </div>

            <div
              className={`rounded-xl border p-4 flex gap-3 ${
                emailed
                  ? 'border-cyan-400/30 bg-cyan-400/10'
                  : 'border-amber-400/30 bg-amber-400/10'
              }`}
            >
              <Mail className={`w-5 h-5 shrink-0 ${emailed ? 'text-cyan-400' : 'text-amber-400'}`} />
              <div className="text-sm">
                {emailed ? (
                  <>
                    <p className="text-white font-semibold">Emailed to {email}</p>
                    <p className="text-white/50 mt-1">Check your inbox for the campaign shot and share caption.</p>
                  </>
                ) : (
                  <>
                    <p className="text-white font-semibold">Email not sent automatically</p>
                    <p className="text-white/50 mt-1 flex items-start gap-1.5">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      Add RESEND_API_KEY to .env.local and restart the dev server, or download and share manually.
                    </p>
                  </>
                )}
              </div>
            </div>

            <button
              onClick={onRestart}
              className="w-full flex items-center justify-center gap-2 text-white/60 hover:text-white py-2 transition"
            >
              <RotateCcw className="w-4 h-4" /> Create Another
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
