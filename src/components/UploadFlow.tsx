import { useRef, useState } from 'react';
import { Upload, Camera, X, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { CAMPAIGN } from '@/lib/constants';
import { compressDataUrl, compressImageFile } from '@/lib/compressImage';
import { assertSelfiePayloadOk, friendlyGenerateError } from '@/lib/selfiePayload';
import ProcessingScreen from './ProcessingScreen';
import ResultScreen from './ResultScreen';

type Step = 'details' | 'capture' | 'processing' | 'result';

const CAMERA_MAX_DIMENSION = 1280;

export default function UploadFlow() {
  const [step, setStep] = useState<Step>('details');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [socials, setSocials] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selfie, setSelfie] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [resultUrl, setResultUrl] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [failed, setFailed] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [streaming, setStreaming] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  const validateDetails = () => {
    const e: Record<string, string> = {};
    if (!fullName.trim()) e.fullName = 'Required';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) e.email = 'Valid email required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const applyCompressedSelfie = async (promise: Promise<string>) => {
    setCompressing(true);
    setFailed('');
    try {
      const compressed = await promise;
      assertSelfiePayloadOk(compressed);
      setSelfie(compressed);
    } catch (e) {
      setFailed(e instanceof Error ? e.message : 'Could not process image.');
      setSelfie(null);
    } finally {
      setCompressing(false);
    }
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setFailed('Please upload an image file (JPG, PNG, or WebP).');
      return;
    }
    void applyCompressedSelfie(compressImageFile(file));
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 1280 } },
      });
      streamRef.current = stream;
      setStreaming(true);
      setFailed('');
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      }, 100);
    } catch {
      setFailed('Camera unavailable. Please upload a photo instead.');
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setStreaming(false);
  };

  const capture = async () => {
    const v = videoRef.current;
    if (!v) return;
    const scale = Math.min(1, CAMERA_MAX_DIMENSION / Math.max(v.videoWidth, v.videoHeight));
    const w = Math.max(1, Math.round(v.videoWidth * scale));
    const h = Math.max(1, Math.round(v.videoHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    canvas.getContext('2d')!.drawImage(v, 0, 0, w, h);
    stopCamera();
    await applyCompressedSelfie(compressDataUrl(canvas.toDataURL('image/jpeg', 0.88)));
  };

  const generate = async () => {
    if (!selfie) return;
    setFailed('');
    try {
      assertSelfiePayloadOk(selfie);
    } catch (e) {
      setFailed(e instanceof Error ? e.message : 'Photo too large.');
      return;
    }

    setStep('processing');
    try {
      const { data: sub } = await supabase
        .from('submissions')
        .insert({
          full_name: fullName,
          email,
          socials,
          status: 'processing',
        })
        .select()
        .single();

      const { data, error } = await supabase.functions.invoke('composite-image', {
        body: {
          selfieDataUrl: selfie,
          backdropUrl: CAMPAIGN.backdropUrl,
          helmetUrl: CAMPAIGN.helmetUrl,
          fullName,
          submissionId: sub?.id,
        },
      });

      if (error) throw error;
      if (data?.error || !data?.resultUrl) {
        throw new Error(typeof data?.error === 'string' ? data.error : 'Generation failed');
      }

      setResultUrl(data.resultUrl);
      fetch('https://famous.ai/api/crm/6a1d3179845adaf9c4760e38/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: fullName,
          source: 'campaign-signup',
          tags: ['swaarm-campaign'],
        }),
      }).catch(() => {});
      setStep('result');
    } catch (err) {
      setFailed(friendlyGenerateError(err));
      setStep('capture');
    }
  };

  const sendEmail = async () => {
    await supabase.functions.invoke('send-result-email', {
      body: { email, fullName, resultUrl },
    });
    setEmailSent(true);
  };

  const restart = () => {
    setStep('details');
    setSelfie(null);
    setResultUrl('');
    setEmailSent(false);
    setFailed('');
  };

  return (
    <div id="join" className="bg-[#0a1f44]/80 backdrop-blur rounded-3xl ring-1 ring-white/10 p-6 sm:p-10 shadow-2xl">
      {step === 'details' && (
        <div>
          <h2 className="text-2xl font-black text-white mb-1">Get on the team sheet</h2>
          <p className="text-slate-400 mb-6 text-sm">Enter your details to start your SWAARM signing photo.</p>
          <div className="space-y-4">
            <Field label="Full Name" error={errors.fullName}>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jordan Smith"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 outline-none"
              />
            </Field>
            <Field label="Email" error={errors.email}>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                type="email"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 outline-none"
              />
            </Field>
            <Field label="Social handles (optional)">
              <input
                value={socials}
                onChange={(e) => setSocials(e.target.value)}
                placeholder="@yourhandle"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 outline-none"
              />
            </Field>
          </div>
          <button
            onClick={() => validateDetails() && setStep('capture')}
            className="mt-6 w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition"
          >
            Continue <ArrowRight size={18} />
          </button>
        </div>
      )}

      {step === 'capture' && (
        <div>
          <button
            onClick={() => setStep('details')}
            className="text-slate-400 hover:text-white flex items-center gap-1 text-sm mb-4"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <h2 className="text-2xl font-black text-white mb-1">Add your selfie</h2>
          <p className="text-slate-400 mb-6 text-sm">
            Face the camera, good lighting, no sunglasses. Large photos are optimized automatically.
          </p>

          {failed && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/20 text-red-300 text-sm">{failed}</div>
          )}

          {compressing ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Loader2 className="w-10 h-10 animate-spin text-blue-400 mb-3" />
              <p className="text-sm">Optimizing your photo…</p>
            </div>
          ) : streaming ? (
            <div className="space-y-3">
              <div className="relative rounded-2xl overflow-hidden ring-1 ring-white/10">
                <video ref={videoRef} autoPlay playsInline muted className="w-full" />
                <div className="absolute inset-8 border-2 border-dashed border-white/40 rounded-full pointer-events-none" />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={stopCamera}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={() => void capture()}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl"
                >
                  Capture
                </button>
              </div>
            </div>
          ) : selfie ? (
            <div className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden ring-1 ring-white/10">
                <img src={selfie} alt="selfie" className="w-full" />
                <button
                  onClick={() => setSelfie(null)}
                  className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full"
                >
                  <X size={16} />
                </button>
              </div>
              <button
                onClick={() => void generate()}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition"
              >
                Generate my campaign shot <ArrowRight size={18} />
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleFile(file);
                }}
                onClick={() => fileRef.current?.click()}
                className={`cursor-pointer border-2 border-dashed rounded-2xl py-12 text-center transition ${dragOver ? 'border-blue-500 bg-blue-500/10' : 'border-white/20 hover:border-white/40'}`}
              >
                <Upload className="mx-auto text-blue-400 mb-3" size={36} />
                <p className="text-white font-semibold">Drag & drop your selfie</p>
                <p className="text-slate-500 text-sm">JPG or PNG, up to 10MB — we resize automatically</p>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                    e.target.value = '';
                  }}
                />
              </div>
              <button
                onClick={startCamera}
                className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition"
              >
                <Camera size={18} /> Use camera instead
              </button>
            </div>
          )}
        </div>
      )}

      {step === 'processing' && <ProcessingScreen />}
      {step === 'result' && (
        <ResultScreen
          resultUrl={resultUrl}
          email={email}
          fullName={fullName}
          onRestart={restart}
          onEmail={sendEmail}
          emailSent={emailSent}
        />
      )}
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-300 mb-1.5">{label}</label>
      {children}
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}
