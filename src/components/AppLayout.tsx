import React, { useState } from 'react';
import Header from './swaarm/Header';
import Landing from './swaarm/Landing';
import UserForm from './swaarm/UserForm';
import CaptureStep from './swaarm/CaptureStep';
import Processing from './swaarm/Processing';
import Result from './swaarm/Result';
import Admin from './swaarm/Admin';
import { ViewKey, FormData, Submission } from './swaarm/types';

const AppLayout: React.FC = () => {
  const [view, setView] = useState<ViewKey>('landing');
  const [formData, setFormData] = useState<FormData>({
    name: '', email: '', phone: '', social: '', photo: '',
  });
  const [finalImage, setFinalImage] = useState<string>('');
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  const handleFormNext = (data: Omit<FormData, 'photo'>) => {
    setFormData((p) => ({ ...p, ...data }));
    setView('capture');
  };

  const handleCapture = (photo: string) => {
    setFormData((p) => ({ ...p, photo }));
    setView('processing');
  };

  const handleProcessComplete = (img: string) => {
    setFinalImage(img);
    // Save submission
    const newSub: Submission = {
      id: `SWM-${Math.floor(Math.random() * 9000) + 1000}`,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      social: formData.social,
      photo: formData.photo,
      finalImage: img,
      createdAt: new Date().toISOString(),
      helmetVariant: 'Stealth',
      status: 'completed',
      emailSent: true,
    };
    setSubmissions((prev) => [newSub, ...prev]);
    setView('result');
  };

  const restart = () => {
    setFormData({ name: '', email: '', phone: '', social: '', photo: '' });
    setFinalImage('');
    setView('landing');
  };

  return (
    <div className="min-h-screen bg-[#0A0E27] text-white antialiased">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#00D9FF]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-[#39FF14]/5 rounded-full blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />
      </div>

      <div className="relative">
        <Header view={view} setView={setView} />

        {view === 'landing' && <Landing setView={setView} />}
        {view === 'form' && (
          <UserForm onNext={handleFormNext} initial={formData} />
        )}
        {view === 'capture' && (
          <CaptureStep
            onCapture={handleCapture}
            onBack={() => setView('form')}
          />
        )}
        {view === 'processing' && (
          <Processing photo={formData.photo} onComplete={handleProcessComplete} />
        )}
        {view === 'result' && (
          <Result
            finalImage={finalImage}
            userName={formData.name}
            userEmail={formData.email}
            onRestart={restart}
          />
        )}
        {view === 'admin' && <Admin submissions={submissions} />}
      </div>
    </div>
  );
};

export default AppLayout;
