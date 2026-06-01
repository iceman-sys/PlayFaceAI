import { useState, useEffect } from 'react';
import Header from './Header';
import Hero from './Hero';
import ProcessSteps from './ProcessSteps';
import UploadFlow, { type GenerationChoices } from './UploadFlow';
import ProcessingScreen from './ProcessingScreen';
import ResultScreen from './ResultScreen';
import Footer from './Footer';
import AdminDashboard from './AdminDashboard';
import LoginModal from './LoginModal';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { generateCampaignPortrait } from '@/lib/invokeGenerate';
import { buildShareCaption } from '@/lib/shareCaption';

type View = 'landing' | 'processing' | 'result' | 'admin';
interface FormData { fullName: string; email: string; socialHandle: string; }

export default function AppLayout() {
  const { session } = useAuth();
  const [view, setView] = useState<View>('landing');
  const [selfie, setSelfie] = useState('');
  const [form, setForm] = useState<FormData>({ fullName: '', email: '', socialHandle: '' });
  const [resultUrl, setResultUrl] = useState('');
  const [shareCaption, setShareCaption] = useState('');
  const [emailed, setEmailed] = useState(false);
  const [error, setError] = useState('');
  const [loginOpen, setLoginOpen] = useState(false);

  useEffect(() => {
    if (view === 'admin' && !session) setView('landing');
  }, [session, view]);

  const handleAdminClick = () => {
    if (session) { setView('admin'); window.scrollTo(0, 0); }
    else setLoginOpen(true);
  };

  const start = () => document.getElementById('start')?.scrollIntoView({ behavior: 'smooth' });

  const handleSubmit = async (selfieData: string, f: FormData, choices: GenerationChoices) => {
    setSelfie(selfieData);
    setForm(f);
    setError('');
    setShareCaption(buildShareCaption(f.socialHandle));
    setEmailed(false);
    setView('processing');
    window.scrollTo(0, 0);

    fetch('https://famous.ai/api/crm/6a19ad56183dcb3986199c2f/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: f.email,
        name: f.fullName,
        source: 'campaign-upload',
        tags: ['swaarm-campaign', 'lead'],
      }),
    }).catch(() => {});

    let generationId: string | undefined;
    try {
      const { data } = await supabase.from('generations').insert({
        full_name: f.fullName,
        email: f.email,
        social_handle: f.socialHandle,
        status: 'processing',
      }).select('id').single();
      generationId = data?.id;
    } catch { /* ignore */ }

    try {
      const data = await generateCampaignPortrait({
        selfie: selfieData,
        fullName: f.fullName,
        email: f.email,
        socialHandle: f.socialHandle,
        teamImageUrl: choices.teamImageUrl,
        helmetImageUrl: choices.helmetImageUrl,
        helmetId: choices.helmetId,
        backdropId: choices.backdropId,
        customBackdrop: choices.customBackdrop,
        generationId,
      });

      const caption = data.shareCaption || buildShareCaption(f.socialHandle);
      setResultUrl(data.imageUrl);
      setShareCaption(caption);
      setEmailed(Boolean(data.emailed));

      if (generationId) {
        const persistUrl = data.imageUrl.startsWith('http') ? data.imageUrl : null;
        supabase.from('generations').update({
          status: 'completed',
          result_url: persistUrl,
        }).eq('id', generationId).then(() => {});
      }

      setView('result');
      window.scrollTo(0, 0);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Generation failed';
      setError(message);
      if (generationId) {
        supabase.from('generations').update({ status: 'failed' }).eq('id', generationId).then(() => {});
      }
      setView('landing');
    }
  };

  const restart = () => {
    setView('landing');
    setSelfie('');
    setResultUrl('');
    setShareCaption('');
    setEmailed(false);
    setForm({ fullName: '', email: '', socialHandle: '' });
    window.scrollTo(0, 0);
  };

  return (
    <div className="bg-[#08090d] min-h-screen">
      <Header isAdmin={view === 'admin'} onAdmin={handleAdminClick} onHome={restart} />

      <LoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSuccess={() => { setLoginOpen(false); setView('admin'); window.scrollTo(0, 0); }}
      />

      {view === 'landing' && (
        <main>
          <Hero onStart={start} />
          <ProcessSteps />
          {error && <p className="text-center text-red-400 -mt-12 mb-6 px-5 font-semibold max-w-2xl mx-auto">{error}</p>}
          <UploadFlow onSubmit={handleSubmit} />
          <Footer />
        </main>
      )}

      {view === 'processing' && <ProcessingScreen selfie={selfie} />}

      {view === 'result' && resultUrl && (
        <ResultScreen
          resultUrl={resultUrl}
          email={form.email}
          fullName={form.fullName}
          socialHandle={form.socialHandle}
          shareCaption={shareCaption}
          emailed={emailed}
          onRestart={restart}
        />
      )}

      {view === 'admin' && session && <AdminDashboard onSignOut={restart} />}
    </div>
  );
}
