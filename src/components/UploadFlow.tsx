import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Upload, Camera, X, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { CAMPAIGN, resolveCampaignAssetUrl, CAMPAIGN_URLS } from '@/lib/constants';
import {
  buildReferralCodeFromId,
  getCampaignSession,
} from '@/lib/campaignTracking';
import { compressDataUrl, compressImageFile } from '@/lib/compressImage';
import { assertSelfiePayloadOk, friendlyGenerateError } from '@/lib/selfiePayload';
import { generateCompositeImages, sendResultEmail } from '@/lib/compositeApi';
import { trackFunnelEvent } from '@/lib/funnelAnalytics';
import ProcessingScreen from './ProcessingScreen';
import ResultScreen from './ResultScreen';

type Step = 'details' | 'capture' | 'processing' | 'result';

const CAMERA_MAX_DIMENSION = 1280;

export default function UploadFlow() {
  const [step, setStep] = useState<Step>('details');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selfie, setSelfie] = useState<string | null>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [referralCode, setReferralCode] = useState('');
  const [prizeEligible, setPrizeEligible] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [imageWithHelmetUrl, setImageWithHelmetUrl] = useState('');
  const [imageWithoutHelmetUrl, setImageWithoutHelmetUrl] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [failed, setFailed] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [streaming, setStreaming] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  const hasDistinctVariants =
    Boolean(imageWithHelmetUrl && imageWithoutHelmetUrl) &&
    imageWithHelmetUrl !== imageWithoutHelmetUrl;

  const validateDetails = () => {
    const e: Record<string, string> = {};
    if (!fullName.trim()) e.fullName = 'Required';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) e.email = 'Valid email required';
    if (!termsAccepted) e.terms = 'You must accept the competition terms to enter';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const continueToCapture = () => {
    if (!validateDetails()) return;
    void trackFunnelEvent('details_submitted');
    void trackFunnelEvent('terms_accepted');
    setStep('capture');
  };

  const applyCompressedSelfie = async (promise: Promise<string>) => {
    setCompressing(true);
    setFailed('');
    try {
      let compressed = await promise;
      try {
        const { prepareSelfieForGeneration } = await import('@/lib/faceGate');
        compressed = await prepareSelfieForGeneration(compressed);
      } catch (gateErr) {
        if (gateErr instanceof Error && gateErr.message.includes('No face')) {
          throw gateErr;
        }
      }
      assertSelfiePayloadOk(compressed);
      setSelfie(compressed);
      void trackFunnelEvent('selfie_uploaded');
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

  const deliverEmail = async (
    withUrl: string,
    withoutUrl: string,
    shareCaption: string,
  ): Promise<boolean> => {
    setEmailSending(true);
    try {
      const sent = await sendResultEmail({
        email,
        fullName,
        imageWithHelmetUrl: withUrl,
        imageWithoutHelmetUrl: withoutUrl,
        shareCaption,
      });
      setEmailSent(sent);
      if (sent) toast.success('Check your inbox for both images');
      else toast.error('Email could not be sent — use download or tap the mail icon to retry');
      return sent;
    } finally {
      setEmailSending(false);
    }
  };

  const generate = async () => {
    if (!selfie || !termsAccepted) return;
    setFailed('');
    try {
      assertSelfiePayloadOk(selfie);
    } catch (e) {
      setFailed(e instanceof Error ? e.message : 'Photo too large.');
      return;
    }

    setStep('processing');
    void trackFunnelEvent('generation_started');

    const termsAcceptedAt = new Date().toISOString();
    const tracking = getCampaignSession();

    try {
      const extendedRow = {
        full_name: fullName.trim(),
        email: email.trim(),
        status: 'processing' as const,
        campaign_source: tracking.campaign_source,
        prize_section_viewed: tracking.prize_section_viewed,
        terms_accepted_at: termsAcceptedAt,
        referred_by_submission_id: tracking.referred_by_submission_id ?? null,
      };

      let sub: { id: string } | null = null;
      let insertError: { message: string } | null = null;

      const extended = await supabase.from('submissions').insert(extendedRow).select().single();
      sub = extended.data;
      insertError = extended.error;

      if (insertError?.message?.includes('column')) {
        const minimal = await supabase
          .from('submissions')
          .insert({ full_name: fullName.trim(), email: email.trim(), status: 'processing' })
          .select()
          .single();
        sub = minimal.data;
        insertError = minimal.error;
      }

      if (insertError) throw insertError;

      const subId = sub?.id ?? null;
      setSubmissionId(subId);

      const code = subId ? buildReferralCodeFromId(subId) : '';
      setReferralCode(code);

      const result = await generateCompositeImages({
        selfieDataUrl: selfie,
        backdropUrl: resolveCampaignAssetUrl(CAMPAIGN.backdropUrl),
        helmetUrl: resolveCampaignAssetUrl(CAMPAIGN.helmetUrl),
        fullName: fullName.trim(),
        email: email.trim(),
        submissionId: subId ?? undefined,
      });

      setImageWithHelmetUrl(result.image_with_helmet_url);
      setImageWithoutHelmetUrl(result.image_without_helmet_url);

      const prizeEnteredAt = new Date().toISOString();
      const updatePayload = {
        status: 'completed' as const,
        result_url: result.image_with_helmet_url,
        image_with_helmet_url: result.image_with_helmet_url,
        image_without_helmet_url: result.image_without_helmet_url,
        referral_code: code || null,
        prize_eligible: true,
        prize_entered_at: prizeEnteredAt,
        terms_accepted_at: termsAcceptedAt,
      };

      const { error: updateError } = await supabase
        .from('submissions')
        .update(updatePayload)
        .eq('id', subId);

      if (updateError?.message?.includes('column')) {
        await supabase
          .from('submissions')
          .update({ status: 'completed', result_url: result.image_with_helmet_url })
          .eq('id', subId);
      }

      setPrizeEligible(true);
      void trackFunnelEvent('generation_completed', { submissionId: subId });
      void trackFunnelEvent('prize_entered', { submissionId: subId });

      void deliverEmail(
        result.image_with_helmet_url,
        result.image_without_helmet_url,
        result.shareCaption,
      );

      setStep('result');
    } catch (err) {
      void trackFunnelEvent('generation_failed', {
        submissionId,
        payload: { error: err instanceof Error ? err.message : 'unknown' },
      });
      if (submissionId) {
        await supabase.from('submissions').update({ status: 'failed' }).eq('id', submissionId);
      }
      setFailed(friendlyGenerateError(err));
      setStep('capture');
    }
  };

  const resendEmail = async () => {
    if (!imageWithHelmetUrl) return;
    await deliverEmail(imageWithHelmetUrl, imageWithoutHelmetUrl || imageWithHelmetUrl, '');
  };

  const newSelfie = () => {
    setStep('capture');
    setSelfie(null);
    setImageWithHelmetUrl('');
    setImageWithoutHelmetUrl('');
    setEmailSent(false);
    setFailed('');
  };

  return (
    <div
      className={`w-full mx-auto bg-[#0a1f44]/80 backdrop-blur rounded-3xl ring-1 ring-white/10 p-6 sm:p-10 shadow-2xl ${
        step === 'result' ? 'max-w-6xl' : 'max-w-2xl'
      }`}
    >
      {step === 'details' && (
        <div>
          <h2 className="text-2xl font-black text-white mb-1">Enter the chorus</h2>
          <p className="text-slate-400 mb-6 text-sm">
            Your email is where we&apos;ll send your team-song image and prize notifications.
          </p>
          <div className="space-y-4">
            <Field label="Full name" error={errors.fullName}>
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
            <div>
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-white/20 bg-white/5 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-300 leading-relaxed">
                  I agree to the{' '}
                  <Link
                    to={CAMPAIGN_URLS.terms}
                    target="_blank"
                    className="text-blue-300 hover:text-white underline-offset-2 hover:underline"
                  >
                    competition terms & conditions
                  </Link>{' '}
                  and confirm I am 18+ and eligible to enter.
                </span>
              </label>
              {errors.terms && <p className="text-red-400 text-xs mt-1">{errors.terms}</p>}
            </div>
          </div>
          <button
            onClick={continueToCapture}
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
            Face the camera, good lighting, no sunglasses.
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
                SWAARM me into the chorus <ArrowRight size={18} />
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
                <p className="text-slate-500 text-sm">JPG or PNG — we resize automatically</p>
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
          imageWithHelmetUrl={imageWithHelmetUrl}
          imageWithoutHelmetUrl={imageWithoutHelmetUrl || imageWithHelmetUrl}
          email={email}
          fullName={fullName}
          submissionId={submissionId}
          referralCode={referralCode}
          prizeEligible={prizeEligible}
          onNewSelfie={newSelfie}
          onResendEmail={resendEmail}
          emailSent={emailSent}
          emailSending={emailSending}
          hasDistinctVariants={hasDistinctVariants}
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
