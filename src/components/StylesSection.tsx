import React from 'react';
import { Shield, Layers, Eye, Zap } from 'lucide-react';

const HELMET_IMG = 'https://d64gsuwffb70l.cloudfront.net/6a177af514f953d19285b7d1_1779924013280_fbbb8920.webp';

const features = [
  { icon: Shield, title: 'Identity Preserved', desc: 'Facial recognition lock ensures the player remains recognizable in every frame.' },
  { icon: Layers, title: 'Auto Compositing', desc: 'AI segments background, blends edges, and matches lighting automatically.' },
  { icon: Eye, title: 'Realistic Shadows', desc: 'Soft drop shadows are computed from backdrop lighting direction.' },
  { icon: Zap, title: 'Sub-10s Renders', desc: 'GPU-accelerated pipeline delivers campaign-quality output in seconds.' },
];

const StylesSection: React.FC = () => {
  return (
    <section id="styles" className="bg-gradient-to-b from-zinc-950 to-black py-20 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-3xl" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="relative">
            <div className="aspect-square max-w-md mx-auto bg-gradient-to-br from-zinc-900 via-black to-zinc-900 rounded-3xl border border-white/10 p-8 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
              <img src={HELMET_IMG} alt="Advanced Armour Helmet" className="relative w-full h-full object-contain drop-shadow-[0_20px_60px_rgba(0,212,255,0.4)]" />
              <div className="absolute top-4 left-4 bg-cyan-400 text-black text-[10px] font-bold tracking-widest px-2 py-1 rounded">
                SIGNATURE
              </div>
              <div className="absolute bottom-4 right-4 text-right">
                <div className="text-white font-bold">CLAW STRIKE</div>
                <div className="text-cyan-400 text-xs">Advanced Armour™</div>
              </div>
            </div>
          </div>

          <div>
            <div className="text-cyan-400 text-xs font-bold tracking-widest mb-3">THE TECH</div>
            <h2 className="text-white text-4xl sm:text-5xl font-black leading-tight mb-5">
              Built on the<br />SWAARM® <span className="text-cyan-400">AI Engine</span>
            </h2>
            <p className="text-gray-400 text-lg mb-8 leading-relaxed">
              Our neural compositing pipeline doesn't just paste a helmet on top — it understands head geometry, lighting direction, and depth to produce shots that read as real sports photography.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {features.map(f => (
                <div key={f.title} className="flex gap-3">
                  <div className="w-10 h-10 rounded-lg bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center flex-shrink-0">
                    <f.icon className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-sm mb-1">{f.title}</h3>
                    <p className="text-gray-400 text-xs leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StylesSection;
