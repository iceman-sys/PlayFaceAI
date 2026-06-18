import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import CampaignShell from '@/components/CampaignShell';
import UploadFlow, { type FlowStep } from '@/components/UploadFlow';
import { CAMPAIGN_URLS } from '@/lib/constants';
import { trackFunnelEvent } from '@/lib/funnelAnalytics';

const PAGE_HEADERS: Record<FlowStep, { title: string; subtitle: string }> = {
  details: {
    title: 'Create your Team-Song Photo',
    subtitle: 'Enter your details and click continue to upload a selfie and generate your photo.',
  },
  capture: {
    title: 'Create your Team-Song Photo',
    subtitle: 'Enter your details and click continue to upload a selfie and generate your photo.',
  },
  processing: {
    title: 'Create your Team-Song Photo',
    subtitle: 'We\'re generating your team-song photo…',
  },
  result: {
    title: 'Here is your Team-Song Photo',
    subtitle:
      'Toggle between one with you wearing SWAARM Headgear and one without. Share and download both.',
  },
};

export default function CreatePage() {
  const [flowStep, setFlowStep] = useState<FlowStep>('details');
  const header = PAGE_HEADERS[flowStep];

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
          <p className="text-xs font-bold uppercase tracking-widest text-blue-300 mb-1">
            AI image platform
          </p>
          <h1 className="text-3xl font-black text-white">{header.title}</h1>
          <p className="text-slate-400 mt-2 text-sm">{header.subtitle}</p>
        </div>
        <UploadFlow onStepChange={setFlowStep} />
      </section>
    </CampaignShell>
  );
}
