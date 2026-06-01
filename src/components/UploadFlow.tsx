import { useState, useRef, useCallback } from 'react';
import { Upload, Camera, X, ArrowRight, Loader2, Check, ImagePlus } from 'lucide-react';
import { compressImageFile, compressDataUrl } from '@/lib/compressImage';
import {
  HELMETS,
  BACKDROPS,
  DEFAULT_HELMET_ID,
  DEFAULT_BACKDROP_ID,
  getHelmet,
  getBackdrop,
} from '@/lib/catalog';

interface FormData {
  fullName: string;
  email: string;
  socialHandle: string;
}

export interface GenerationChoices {
  helmetId: string;
  helmetImageUrl: string;
  backdropId: string;
  teamImageUrl: string;
  customBackdrop: boolean;
}

interface Props {
  onSubmit: (selfie: string, form: FormData, choices: GenerationChoices) => void;
}

const CUSTOM_BACKDROP_ID = 'custom';

export default function UploadFlow({ onSubmit }: Props) {
  const [form, setForm] = useState<FormData>({ fullName: '', email: '', socialHandle: '' });
  const [selfie, setSelfie] = useState<string | null>(null);
  const [helmetId, setHelmetId] = useState(DEFAULT_HELMET_ID);
  const [backdropId, setBackdropId] = useState(DEFAULT_BACKDROP_ID);
  const [customBackdropUrl, setCustomBackdropUrl] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [camOn, setCamOn] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [compressingBackdrop, setCompressingBackdrop] = useState(false);
  const [err, setErr] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const backdropFileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const isCustomBackdrop = backdropId === CUSTOM_BACKDROP_ID;
  const selectedHelmet = getHelmet(helmetId);
  const selectedBackdrop = isCustomBackdrop
    ? { id: CUSTOM_BACKDROP_ID, name: 'Custom Backdrop', imageUrl: customBackdropUrl ?? '' }
    : getBackdrop(backdropId);

  const readFile = async (file: File) => {
    if (!file.type.startsWith('image/')) { setErr('Please upload an image file.'); return; }
    setCompressing(true);
    setErr('');
    try {
      const compressed = await compressImageFile(file);
      const { prepareSelfieForGeneration } = await import('@/lib/faceGate');
      const prepared = await prepareSelfieForGeneration(compressed);
      setSelfie(prepared);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not process image.');
    } finally {
      setCompressing(false);
    }
  };

  const readBackdropFile = async (file: File) => {
    if (!file.type.startsWith('image/')) { setErr('Please upload an image file for your backdrop.'); return; }
    setCompressingBackdrop(true);
    setErr('');
    try {
      const compressed = await compressImageFile(file);
      setCustomBackdropUrl(compressed);
      setBackdropId(CUSTOM_BACKDROP_ID);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not process backdrop.');
    } finally {
      setCompressingBackdrop(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) readFile(file);
  };

  const startCam = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      streamRef.current = stream;
      setCamOn(true);
      setTimeout(() => { if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); } }, 100);
    } catch {
      setErr('Could not access camera. Please upload instead.');
    }
  }, []);

  const stopCam = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCamOn(false);
  };

  const capture = async () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    stopCam();
    setCompressing(true);
    setErr('');
    try {
      const compressed = await compressDataUrl(canvas.toDataURL('image/jpeg', 0.92));
      const { prepareSelfieForGeneration } = await import('@/lib/faceGate');
      const prepared = await prepareSelfieForGeneration(compressed);
      setSelfie(prepared);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not process photo.');
    } finally {
      setCompressing(false);
    }
  };

  const selectBackdrop = (id: string) => {
    setBackdropId(id);
    if (id !== CUSTOM_BACKDROP_ID) setErr('');
  };

  const valid =
    form.fullName.trim() &&
    /\S+@\S+\.\S+/.test(form.email) &&
    selfie &&
    (!isCustomBackdrop || customBackdropUrl);

  const submit = () => {
    if (!form.fullName.trim()) return setErr('Please enter your full name.');
    if (!/\S+@\S+\.\S+/.test(form.email)) return setErr('Please enter a valid email.');
    if (!selfie) return setErr('Please add a selfie.');
    if (isCustomBackdrop && !customBackdropUrl) return setErr('Please upload a custom backdrop.');

    onSubmit(selfie, form, {
      helmetId,
      helmetImageUrl: selectedHelmet.imageUrl,
      backdropId: isCustomBackdrop ? CUSTOM_BACKDROP_ID : backdropId,
      teamImageUrl: isCustomBackdrop ? customBackdropUrl! : selectedBackdrop.imageUrl,
      customBackdrop: isCustomBackdrop,
    });
  };

  return (
    <section id="start" className="relative bg-gradient-to-b from-[#08090d] to-[#0d1018] py-24">
      <div className="max-w-5xl mx-auto px-5">
        <div className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl font-black text-white">Get In The Squad</h2>
          <p className="mt-3 text-white/60">Enter your details, add a selfie, then pick your headgear and backdrop.</p>
        </div>

        {/* Step 1: Details + Selfie */}
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-7 space-y-5">
            <h3 className="text-lg font-bold text-white">1. Your Details</h3>
            <div>
              <label className="text-sm font-semibold text-white/80">Full Name *</label>
              <input
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="Jordan Smith"
                className="mt-2 w-full bg-black/40 border border-white/15 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:border-cyan-400 outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-white/80">Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@email.com"
                className="mt-2 w-full bg-black/40 border border-white/15 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:border-cyan-400 outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-white/80">Social Handle <span className="text-white/40">(optional)</span></label>
              <input
                value={form.socialHandle}
                onChange={(e) => setForm({ ...form, socialHandle: e.target.value })}
                placeholder="@yourhandle"
                className="mt-2 w-full bg-black/40 border border-white/15 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:border-cyan-400 outline-none"
              />
            </div>
            <p className="text-xs text-white/40">We'll email your finished campaign shot and may feature it in the SWAARM gallery.</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-7">
            <h3 className="text-lg font-bold text-white mb-4">Your Selfie</h3>
            {compressing ? (
              <div className="h-72 rounded-xl border border-white/10 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                <p className="text-white/70 font-medium">Optimizing photo...</p>
              </div>
            ) : selfie ? (
              <div className="relative">
                <img src={selfie} alt="Selfie" className="w-full h-72 object-cover rounded-xl" />
                <button onClick={() => setSelfie(null)} className="absolute top-3 right-3 bg-black/70 hover:bg-black text-white rounded-full p-2">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : camOn ? (
              <div className="relative">
                <video ref={videoRef} className="w-full h-72 object-cover rounded-xl bg-black" playsInline muted />
                <div className="mt-4 flex gap-3">
                  <button onClick={capture} className="flex-1 bg-cyan-400 text-black font-bold py-3 rounded-lg flex items-center justify-center gap-2">
                    <Camera className="w-4 h-4" /> Capture
                  </button>
                  <button onClick={stopCam} className="px-4 bg-white/10 text-white rounded-lg">Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                  onClick={() => !compressing && fileRef.current?.click()}
                  className={`cursor-pointer h-56 rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition ${dragging ? 'border-cyan-400 bg-cyan-400/10' : 'border-white/20 hover:border-white/40'}`}
                >
                  <Upload className="w-10 h-10 text-cyan-400 mb-3" />
                  <p className="text-white font-semibold">Drag & drop your selfie</p>
                  <p className="text-white/40 text-sm mt-1">Auto-compressed for upload · JPG, PNG up to 10MB</p>
                </div>
                <button onClick={startCam} className="mt-4 w-full border border-white/15 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-white/10 transition">
                  <Camera className="w-4 h-4" /> Use Camera Instead
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && readFile(e.target.files[0])} />
              </>
            )}
          </div>
        </div>

        {/* Step 2: Choose Helmet */}
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-7">
          <h3 className="text-lg font-bold text-white mb-5">2. Choose Helmet</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {HELMETS.map((h) => (
              <button
                key={h.id}
                type="button"
                onClick={() => setHelmetId(h.id)}
                className={`relative rounded-xl border-2 p-3 text-left transition ${
                  helmetId === h.id
                    ? 'border-cyan-400 bg-cyan-400/10 ring-1 ring-cyan-400/30'
                    : 'border-white/10 bg-black/20 hover:border-white/30'
                }`}
              >
                {h.popular && (
                  <span className="absolute -top-2 -right-2 z-10 text-[10px] bg-orange-500 text-black font-bold px-2 py-0.5 rounded-full">
                    HOT
                  </span>
                )}
                <div className={`aspect-square rounded-lg mb-3 overflow-hidden flex items-center justify-center ${
                  h.previewGradient ? `bg-gradient-to-br ${h.previewGradient}` : 'bg-gradient-to-br from-zinc-800 to-black'
                }`}>
                  {h.preview ? (
                    <img src={h.preview} alt={h.name} className="w-full h-full object-contain p-2" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-white/20" />
                  )}
                </div>
                <p className="text-white text-sm font-semibold">{h.name}</p>
                <p className="text-white/45 text-xs mt-0.5">{h.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Step 3: Pick Backdrop */}
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-7">
          <h3 className="text-lg font-bold text-white mb-5">3. Pick Backdrop</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {BACKDROPS.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => selectBackdrop(b.id)}
                className={`relative aspect-[4/3] rounded-xl overflow-hidden border-2 transition ${
                  backdropId === b.id
                    ? 'border-cyan-400 ring-2 ring-cyan-400/30'
                    : 'border-white/10 hover:border-white/40'
                }`}
              >
                <img src={b.imageUrl} alt={b.name} className="w-full h-full object-cover" />
                {b.campaign && (
                  <span className="absolute top-1.5 left-1.5 text-[9px] bg-cyan-400 text-black font-bold px-1.5 py-0.5 rounded">
                    CAMPAIGN
                  </span>
                )}
                {backdropId === b.id && (
                  <div className="absolute inset-0 bg-cyan-400/20 flex items-center justify-center">
                    <Check className="w-6 h-6 text-cyan-400" strokeWidth={3} />
                  </div>
                )}
              </button>
            ))}

            {/* Custom backdrop upload tile */}
            <button
              type="button"
              onClick={() => {
                selectBackdrop(CUSTOM_BACKDROP_ID);
                backdropFileRef.current?.click();
              }}
              className={`relative aspect-[4/3] rounded-xl overflow-hidden border-2 transition ${
                isCustomBackdrop
                  ? 'border-cyan-400 ring-2 ring-cyan-400/30'
                  : 'border-dashed border-white/20 hover:border-cyan-400/50 bg-black/30'
              }`}
            >
              {customBackdropUrl && isCustomBackdrop ? (
                <>
                  <img src={customBackdropUrl} alt="Custom backdrop" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-cyan-400/20 flex items-center justify-center">
                    <Check className="w-6 h-6 text-cyan-400" strokeWidth={3} />
                  </div>
                </>
              ) : compressingBackdrop ? (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
                  <span className="text-white/50 text-xs">Uploading...</span>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-3">
                  <ImagePlus className="w-8 h-8 text-cyan-400" />
                  <span className="text-white text-xs font-semibold text-center">Upload Your Own</span>
                </div>
              )}
            </button>
          </div>

          <input
            ref={backdropFileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && readBackdropFile(e.target.files[0])}
          />

          <p className="mt-4 text-sm text-white/50">
            Selected:{' '}
            <span className="text-cyan-400 font-semibold">{selectedBackdrop.name}</span>
            {isCustomBackdrop && customBackdropUrl && (
              <button
                type="button"
                onClick={() => backdropFileRef.current?.click()}
                className="ml-3 text-xs text-white/40 hover:text-cyan-400 underline"
              >
                Change image
              </button>
            )}
          </p>
        </div>

        {err && <p className="mt-6 text-center text-red-400 font-medium">{err}</p>}

        <div className="mt-8 flex justify-center">
          <button
            onClick={submit}
            disabled={!valid || compressing || compressingBackdrop}
            className="group flex items-center gap-2 bg-gradient-to-r from-cyan-400 to-blue-600 text-black font-bold px-8 py-4 rounded-xl text-lg disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.03] transition"
          >
            Generate My Campaign Shot
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
          </button>
        </div>
      </div>
    </section>
  );
}
