import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Gift, Shield, Sparkles, Camera, ChevronRight } from 'lucide-react';
import { CAMPAIGN, CAMPAIGN_URLS, PRIZES } from '@/lib/constants';
import { markPrizeSectionViewed } from '@/lib/campaignTracking';
import { trackFunnelEvent } from '@/lib/funnelAnalytics';

const ICONS = {
  shield: Shield,
  sparkles: Sparkles,
  camera: Camera,
} as const;

export default function PrizeSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          markPrizeSectionViewed();
          void trackFunnelEvent('prize_section_viewed');
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="prizes"
      ref={sectionRef}
      className="relative max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-16"
    >
      <div className="text-center mb-10">
        <span className="inline-flex items-center gap-2 bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/30 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest">
          <Gift size={14} /> Competition & prizes
        </span>
        <h2 className="mt-4 text-3xl sm:text-4xl font-black text-white">{PRIZES.headline}</h2>
        <p className="mt-3 text-slate-300 max-w-2xl mx-auto">{PRIZES.subheadline}</p>
        <p className="mt-2 text-sm text-blue-300 font-semibold">
          {CAMPAIGN.event} · {CAMPAIGN.eventDate}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Draw {PRIZES.drawDate} · {PRIZES.prizeCount} prize packs
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-5 mb-10">
        {PRIZES.items.map((item) => {
          const Icon = ICONS[item.icon];
          return (
            <div
              key={item.title}
              className="bg-gradient-to-b from-white/10 to-white/5 ring-1 ring-white/15 rounded-2xl p-6 hover:ring-blue-400/40 transition"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-600/25 text-blue-300 flex items-center justify-center mb-4">
                <Icon size={22} />
              </div>
              <h3 className="font-bold text-lg text-white mb-2">{item.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{item.description}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl bg-[#0a1f44]/80 ring-1 ring-white/10 p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6">
        <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-white flex items-center justify-center shrink-0 p-3">
          <img src={CAMPAIGN.helmetUrl} alt="SWAARM headgear" className="w-full h-full object-contain" />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-300 mb-1">Swarm in the Chorus</p>
          <h3 className="text-xl sm:text-2xl font-black text-white mb-2">
            Sing it one and all with Tristan & Caleb
          </h3>
          <p className="text-slate-300 text-sm sm:text-base">
            Accept the competition terms, generate your AI team-song image, and you&apos;re entered. Share your
            unique link to bring mates into the chorus.
          </p>
        </div>
        <Link
          to={CAMPAIGN_URLS.create}
          onClick={() => void trackFunnelEvent('cta_clicked', { payload: { from: 'prize_section' } })}
          className="shrink-0 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3.5 rounded-xl transition"
        >
          Enter now <ChevronRight size={18} />
        </Link>
      </div>

      <p className="mt-6 text-center text-xs text-slate-500">
        <Link to={CAMPAIGN_URLS.terms} className="text-slate-400 hover:text-white underline-offset-2 hover:underline">
          Read full competition terms
        </Link>
      </p>
    </section>
  );
}
