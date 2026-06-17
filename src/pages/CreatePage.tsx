import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import CampaignShell from '@/components/CampaignShell';
import UploadFlow from '@/components/UploadFlow';
import { CAMPAIGN_URLS } from '@/lib/constants';
import { trackFunnelEvent } from '@/lib/funnelAnalytics';

export default function CreatePage() {
  useEffect(() => {
    void trackFunnelEvent('create_page_view');
  }, []);

  return (
    <CampaignShell showJoinCta={false}>
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <Link
          to={CAMPAIGN_URLS.landing}
          className="inline-flex items-center gap-1 text-slate-400 hover:text-white text-sm mb-6 transition"
        >
          <ArrowLeft size={16} /> Back to prizes
        </Link>
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-300 mb-1">AI image platform</p>
          <h1 className="text-3xl font-black text-white">Create your chorus shot</h1>
          <p className="text-slate-400 mt-2 text-sm">
            Enter your details, accept the competition terms, and upload a selfie to generate your image.
          </p>
        </div>
        <UploadFlow />
      </section>
    </CampaignShell>
  );
}
