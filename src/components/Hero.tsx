import React from 'react';
import { ArrowRight, Sparkles, Play } from 'lucide-react';

const HERO_BG = 'https://d64gsuwffb70l.cloudfront.net/6a177c3447adad4194082b60_1779924372348_6d7b8422.jpg';

const Hero: React.FC = () => {
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <section className="relative overflow-hidden bg-black">
      <div className="absolute inset-0">
        <img src={HERO_BG} alt="" className="w-full h-full object-cover opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-400/10 border border-cyan-400/30 text-cyan-400 text-xs font-medium mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            POWERED BY ADVANCED AI · SWAARM® ARMOUR
          </div>

          <h1 className="font-black text-white text-5xl sm:text-6xl lg:text-7xl leading-[0.95] tracking-tight mb-6">
            TRANSFORM INTO<br />
            YOUR <span className="bg-gradient-to-r from-cyan-400 via-yellow-300 to-orange-500 bg-clip-text text-transparent">SPORTS HERO</span>
          </h1>

          <p className="text-gray-300 text-lg sm:text-xl max-w-2xl mb-8 leading-relaxed">
            Upload a selfie. Our AI fits you with the iconic Advanced Armour helmet, removes your background, and drops you into a stadium-ready scene — in under 10 seconds.
          </p>

          <div className="flex flex-wrap gap-4 mb-12">
            <button onClick={() => scrollTo('studio')} className="group inline-flex items-center gap-2 px-7 py-4 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-bold hover:shadow-[0_0_30px_rgba(0,212,255,0.5)] transition">
              Start Free Demo
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
            </button>
            <button onClick={() => scrollTo('gallery')} className="inline-flex items-center gap-2 px-7 py-4 rounded-xl bg-white/10 backdrop-blur border border-white/20 text-white font-semibold hover:bg-white/20 transition">
              <Play className="w-5 h-5" />
              See Examples
            </button>
          </div>

          <div className="grid grid-cols-3 gap-6 max-w-xl">
            <div>
              <div className="text-3xl font-black text-cyan-400">10s</div>
              <div className="text-xs text-gray-400 uppercase tracking-wider mt-1">Avg. Render</div>
            </div>
            <div>
              <div className="text-3xl font-black text-cyan-400">12+</div>
              <div className="text-xs text-gray-400 uppercase tracking-wider mt-1">Backdrops</div>
            </div>
            <div>
              <div className="text-3xl font-black text-cyan-400">4K</div>
              <div className="text-xs text-gray-400 uppercase tracking-wider mt-1">Export Ready</div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
    </section>
  );
};

export default Hero;
