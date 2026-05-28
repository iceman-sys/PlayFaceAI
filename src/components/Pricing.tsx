import React from 'react';
import { Check } from 'lucide-react';

const TIERS = [
  {
    name: 'Demo',
    price: 'Free',
    desc: 'Try the full workflow',
    features: ['5 renders / day', 'HD downloads', '4 backdrops', 'Watermark on export', 'Web only'],
    cta: 'Start Free',
    highlight: false,
  },
  {
    name: 'Campaign',
    price: '$49',
    suffix: '/mo',
    desc: 'For creators & teams',
    features: ['Unlimited renders', '4K + print exports', 'All 12+ backdrops', 'No watermark', 'Custom helmet upload', 'Priority queue'],
    cta: 'Go Pro',
    highlight: true,
  },
  {
    name: 'Brand',
    price: 'Custom',
    desc: 'White-label & API',
    features: ['Everything in Campaign', 'White-label studio', 'API access', 'Custom backdrops', 'Dedicated support', 'On-prem option'],
    cta: 'Contact Sales',
    highlight: false,
  },
];

const Pricing: React.FC = () => {
  return (
    <section id="pricing" className="bg-black py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="text-cyan-400 text-xs font-bold tracking-widest mb-3">PRICING</div>
          <h2 className="text-white text-4xl sm:text-5xl font-black mb-4">Pick your league</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">Cancel any time. All plans include the SWAARM® Advanced Armour helmet library.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TIERS.map(t => (
            <div
              key={t.name}
              className={`relative rounded-2xl p-7 border transition ${t.highlight ? 'bg-gradient-to-b from-cyan-400/10 to-transparent border-cyan-400/40 ring-1 ring-cyan-400/30' : 'bg-zinc-900/50 border-white/10'}`}
            >
              {t.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-cyan-400 text-black text-[10px] font-bold tracking-widest px-3 py-1 rounded-full">
                  MOST POPULAR
                </div>
              )}
              <h3 className="text-white text-xl font-bold mb-1">{t.name}</h3>
              <p className="text-gray-400 text-sm mb-5">{t.desc}</p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-white text-5xl font-black">{t.price}</span>
                {t.suffix && <span className="text-gray-400 text-sm">{t.suffix}</span>}
              </div>
              <ul className="space-y-2.5 mb-7">
                {t.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                    <Check className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" strokeWidth={3} />
                    {f}
                  </li>
                ))}
              </ul>
              <button className={`w-full py-3 rounded-lg font-bold transition ${t.highlight ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-black hover:shadow-[0_0_30px_rgba(0,212,255,0.4)]' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                {t.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
