import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import CampaignShell from '@/components/CampaignShell';
import { CAMPAIGN_URLS, COMPETITION_TERMS } from '@/lib/constants';

export default function TermsPage() {
  return (
    <CampaignShell showJoinCta={false}>
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <Link
          to={CAMPAIGN_URLS.landing}
          className="inline-flex items-center gap-1 text-slate-400 hover:text-white text-sm mb-6 transition"
        >
          <ArrowLeft size={16} /> Back to campaign
        </Link>
        <h1 className="text-3xl font-black text-white mb-2">{COMPETITION_TERMS.title}</h1>
        <p className="text-slate-500 text-sm mb-8">Last updated {COMPETITION_TERMS.lastUpdated}</p>
        <div className="space-y-8">
          {COMPETITION_TERMS.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-lg font-bold text-white mb-2">{section.heading}</h2>
              <p className="text-slate-300 leading-relaxed">{section.body}</p>
            </section>
          ))}
        </div>
      </article>
    </CampaignShell>
  );
}
