import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ChevronRight, QrCode } from 'lucide-react';
import CampaignShell from '@/components/CampaignShell';
import PrizeSection from '@/components/PrizeSection';
import { CAMPAIGN, CAMPAIGN_URLS } from '@/lib/constants';
import { getCampaignSession, initCampaignTracking, isStadiumSource } from '@/lib/campaignTracking';
import { trackFunnelEvent } from '@/lib/funnelAnalytics';

export default function PrizeLandingPage() {
  useEffect(() => {
    const session = initCampaignTracking();
    const isStadium = isStadiumSource(session.campaign_source);

    void trackFunnelEvent('landing_view', {
      payload: { path: '/prize', is_stadium: isStadium },
    });
    if (session.referral_code) {
      void trackFunnelEvent('referral_landing', {
        payload: { referral_code: session.referral_code },
      });
    }
  }, []);

  const session = getCampaignSession();
  const isStadium = isStadiumSource(session.campaign_source);

  return (
    <CampaignShell>
      <section className="relative">
        <div className="absolute inset-0">
          <img src={CAMPAIGN.heroUrl} alt="" className="w-full h-full object-cover opacity-25" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#06142e]/50 via-[#06142e]/85 to-[#06142e]" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20 text-center">
          {isStadium ? (
            <span className="inline-flex items-center gap-2 bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest">
              <QrCode size={14} /> Marvel Stadium · Scan to enter
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 bg-white/10 ring-1 ring-white/15 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-blue-300">
              <Sparkles size={14} /> {CAMPAIGN.event}
            </span>
          )}
          <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] max-w-4xl mx-auto">
            SWAARM in the <span className="text-blue-400">Chorus</span>
          </h1>
          <p className="mt-5 text-lg text-slate-300 max-w-2xl mx-auto">
            {isStadium
              ? 'You scanned the stadium QR — create your AI team-song photo and enter to win SWAARM merch.'
              : CAMPAIGN.tagline}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a
              href="#prizes"
              className="bg-white/10 hover:bg-white/20 px-7 py-3.5 rounded-xl font-bold transition"
            >
              See prizes
            </a>
            <Link
              to={CAMPAIGN_URLS.create}
              onClick={() => void trackFunnelEvent('cta_clicked', { payload: { from: 'hero' } })}
              className="bg-blue-600 hover:bg-blue-500 px-7 py-3.5 rounded-xl font-bold flex items-center gap-2 transition"
            >
              Create your shot <ChevronRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      <PrizeSection />

      <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-14">
        <h2 className="text-xl font-black text-center mb-6 text-slate-200">Three simple steps</h2>
        <ol className="grid sm:grid-cols-3 gap-4 text-center text-sm">
          {[
            'Read prizes & accept competition terms',
            'Upload a clear selfie',
            'Get your image — share for the chorus',
          ].map((step, i) => (
            <li key={step} className="bg-white/5 ring-1 ring-white/10 rounded-xl px-4 py-5">
              <span className="inline-flex w-8 h-8 rounded-full bg-blue-600 text-white font-bold items-center justify-center mb-2">
                {i + 1}
              </span>
              <p className="text-slate-300">{step}</p>
            </li>
          ))}
        </ol>
        <div className="mt-8 text-center">
          <Link
            to={CAMPAIGN_URLS.create}
            onClick={() => void trackFunnelEvent('cta_clicked', { payload: { from: 'steps' } })}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-8 py-4 rounded-xl font-bold transition"
          >
            Start your entry <ChevronRight size={18} />
          </Link>
        </div>
      </section>
    </CampaignShell>
  );
}
