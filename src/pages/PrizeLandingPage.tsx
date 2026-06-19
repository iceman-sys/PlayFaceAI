import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, QrCode } from 'lucide-react';
import CampaignShell from '@/components/CampaignShell';
import { CAMPAIGN, CAMPAIGN_URLS, LANDING_COPY } from '@/lib/constants';
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
    <CampaignShell showJoinCta={false}>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={CAMPAIGN.heroUrl}
            alt=""
            className="w-full h-full object-cover object-center opacity-70 sm:opacity-75"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#06142e]/35 via-[#06142e]/35 to-[#06142e]/95" />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
          {isStadium && (
            <p className="text-center mb-4">
              <span className="inline-flex items-center gap-2 bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest">
                <QrCode size={14} /> Marvel Stadium · Scan to enter
              </span>
            </p>
          )}

          <h1 className="text-4xl sm:text-5xl font-black leading-tight text-center text-white">
            SWAARM in the <span className="text-blue-400">Chorus</span>
          </h1>

          <div className="mt-8 space-y-5 text-slate-300 text-base leading-relaxed">
            <p className="font-semibold text-white text-lg">{LANDING_COPY.intro}</p>
            <p>{LANDING_COPY.body}</p>
            <p>{LANDING_COPY.shareLine}</p>
            <ul className="space-y-2 pl-1">
              {LANDING_COPY.prizes.map((prize) => (
                <li key={prize} className="flex gap-2">
                  <span className="text-blue-400 shrink-0">•</span>
                  <span>{prize}</span>
                </li>
              ))}
            </ul>
            <p className="font-medium text-white">{LANDING_COPY.closing}</p>
          </div>

          <div className="mt-10 text-center">
            <Link
              to={CAMPAIGN_URLS.create}
              onClick={() => void trackFunnelEvent('cta_clicked', { payload: { from: 'hero' } })}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-8 py-4 rounded-xl font-bold text-lg transition"
            >
              {CAMPAIGN.ctaLabel} <ChevronRight size={20} />
            </Link>
            <p className="mt-5 text-blue-300 font-semibold">{LANDING_COPY.subCta}</p>
            <p className="mt-2 text-sm text-slate-400">{CAMPAIGN.eventLine}</p>
          </div>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-14 pt-4">
        <ol className="grid sm:grid-cols-3 gap-4 text-center text-sm">
          {LANDING_COPY.steps.map((step, i) => (
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
            {CAMPAIGN.ctaLabel} <ChevronRight size={18} />
          </Link>
        </div>
      </section>
    </CampaignShell>
  );
}
