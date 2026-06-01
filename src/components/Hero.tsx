import { ArrowRight, Sparkles } from 'lucide-react';
import { ASSETS, BRAND } from '@/lib/constants';

export default function Hero({ onStart }: { onStart: () => void }) {
  return (
    <section className="relative min-h-[92vh] flex items-center overflow-hidden">
      <img src={ASSETS.hero} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-br from-black via-black/80 to-black/40" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60" />

      <div className="relative max-w-7xl mx-auto px-5 pt-24 w-full">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-400/10 px-4 py-1.5 mb-6">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-semibold text-cyan-300">Identity-Preserving AI Compositing</span>
          </div>
          <h1 className="text-5xl sm:text-7xl font-black leading-[0.95] text-white tracking-tight">
            BECOME PART
            <br />
            OF THE <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">TEAM</span>
          </h1>
          <p className="mt-6 text-lg text-white/70 max-w-xl">
            Upload a selfie and our AI drops you into the squad — wearing official {BRAND.name} headgear,
            blended into a real team photo. Your face, your identity, premium campaign quality.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <button
              onClick={onStart}
              className="group flex items-center gap-2 bg-gradient-to-r from-cyan-400 to-blue-600 text-black font-bold px-7 py-4 rounded-xl text-lg hover:scale-[1.03] transition shadow-lg shadow-cyan-500/20"
            >
              Create My Campaign Shot
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
            </button>
            <a href="#how" className="flex items-center gap-2 text-white font-semibold px-7 py-4 rounded-xl border border-white/20 hover:bg-white/10 transition">
              How It Works
            </a>
          </div>
          <div className="mt-10 flex items-center gap-8 text-white/50 text-sm">
            <div><span className="block text-2xl font-black text-white">100%</span>Identity Preserved</div>
            <div><span className="block text-2xl font-black text-white">~30s</span>Generation Time</div>
            <div><span className="block text-2xl font-black text-white">4K</span>Share-Ready Output</div>
          </div>
        </div>
      </div>
    </section>
  );
}
