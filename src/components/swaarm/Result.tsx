import React, { useState } from 'react';
import { Download, Mail, Share2, RotateCcw, CheckCircle2, Twitter, Instagram, Facebook, Trophy } from 'lucide-react';

interface Props {
  finalImage: string;
  userName: string;
  userEmail: string;
  onRestart: () => void;
}

const Result: React.FC<Props> = ({ finalImage, userName, userEmail, onRestart }) => {
  const [emailSent, setEmailSent] = useState(true); // auto-confirmed
  const [copied, setCopied] = useState(false);

  const download = () => {
    const link = document.createElement('a');
    link.href = finalImage;
    link.download = `swaarm-${userName.replace(/\s+/g, '-').toLowerCase()}.jpg`;
    link.click();
  };

  const share = async () => {
    try {
      if (navigator.share) {
        const blob = await (await fetch(finalImage)).blob();
        const file = new File([blob], 'swaarm.jpg', { type: 'image/jpeg' });
        await navigator.share({
          title: 'I joined the SWAARM',
          text: `Just joined the @SWAARM squad — get yours at swaarm.ai`,
          files: [file],
        });
      } else {
        await navigator.clipboard.writeText('https://swaarm.ai - I just joined the squad!');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {}
  };

  return (
    <div className="pt-28 pb-16 px-4 sm:px-6 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#39FF14]/10 border border-[#39FF14]/30 mb-4">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#39FF14]" />
            <span className="text-xs font-bold tracking-widest text-[#39FF14]">TRANSFORMATION COMPLETE</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-3">
            WELCOME TO THE <span className="bg-gradient-to-r from-[#00D9FF] to-[#39FF14] bg-clip-text text-transparent">SWAARM.</span>
          </h1>
          <p className="text-white/60 text-lg">
            You're officially in the squad, <span className="text-white font-semibold">{userName}</span>.
          </p>
        </div>

        {/* Final image */}
        <div className="relative mb-6">
          <div className="absolute -inset-6 bg-gradient-to-r from-[#00D9FF]/30 to-[#39FF14]/30 rounded-3xl blur-3xl" />
          <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
            <img src={finalImage} alt="Your SWAARM photo" className="w-full h-auto" />
            <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur border border-white/10">
              <Trophy className="w-3.5 h-3.5 text-[#39FF14]" />
              <span className="text-xs font-bold text-white">OFFICIAL SWAARM MEMBER</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid sm:grid-cols-3 gap-3 mb-6">
          <button
            onClick={download}
            className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-[#00D9FF] to-[#39FF14] text-[#0A0E27] font-bold shadow-lg shadow-[#00D9FF]/30 hover:scale-[1.02] transition-all"
          >
            <Download className="w-5 h-5" /> Download Photo
          </button>
          <button
            onClick={share}
            className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 transition-all"
          >
            <Share2 className="w-5 h-5" /> {copied ? 'Copied!' : 'Share'}
          </button>
          <button
            onClick={onRestart}
            className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 transition-all"
          >
            <RotateCcw className="w-5 h-5" /> Try Again
          </button>
        </div>

        {/* Email confirmation */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-[#00D9FF]/10 to-[#39FF14]/5 border border-[#00D9FF]/20 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#00D9FF]/20 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5 text-[#00D9FF]" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-white">Email Delivered</h3>
                {emailSent && <CheckCircle2 className="w-4 h-4 text-[#39FF14]" />}
              </div>
              <p className="text-sm text-white/60">
                Your branded SWAARM photo has been sent to{' '}
                <span className="text-[#00D9FF] font-mono">{userEmail}</span>
              </p>
              <p className="text-xs text-white/40 mt-1">
                Check your spam folder if you don't see it within 2 minutes.
              </p>
            </div>
          </div>
        </div>

        {/* Social CTA */}
        <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 text-center">
          <h3 className="text-lg font-bold text-white mb-1">Tag us when you post!</h3>
          <p className="text-sm text-white/60 mb-4">Use #SWAARM2026 and tag @swaarm for a chance to be featured.</p>
          <div className="flex justify-center gap-3">
            {[
              { Icon: Twitter, color: '#1DA1F2' },
              { Icon: Instagram, color: '#E4405F' },
              { Icon: Facebook, color: '#1877F2' },
            ].map(({ Icon, color }, i) => (
              <button
                key={i}
                onClick={share}
                className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:scale-110 transition-all"
                style={{ color }}
              >
                <Icon className="w-5 h-5" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Result;
