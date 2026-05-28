import React, { useRef, useState, useEffect } from 'react';
import { Upload, Camera, Check, Loader2, Download, Share2, RefreshCw, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const HELMET_IMG = 'https://d64gsuwffb70l.cloudfront.net/6a177af514f953d19285b7d1_1779924013280_fbbb8920.webp';

const HELMETS = [
  { id: 'claw', name: 'Claw Strike', desc: 'Signature Advanced Armour', img: HELMET_IMG, popular: true },
  { id: 'classic', name: 'Classic Black', desc: 'Minimal pro look' },
  { id: 'racer', name: 'Racer Red', desc: 'Motorsport edge' },
  { id: 'esports', name: 'Neon Pulse', desc: 'Esports cyber style' },
  { id: 'hockey', name: 'Ice Guard', desc: 'Hockey performance' },
  { id: 'cycle', name: 'Aero Sprint', desc: 'Cyclist aerodynamic' },
];

const BACKGROUNDS = [
  { id: 'stadium', name: 'Football Stadium', img: 'https://d64gsuwffb70l.cloudfront.net/6a177c3447adad4194082b60_1779924133843_37718392.png' },
  { id: 'basketball', name: 'Basketball Arena', img: 'https://d64gsuwffb70l.cloudfront.net/6a177c3447adad4194082b60_1779924149965_333acb03.jpg' },
  { id: 'racing', name: 'Racing Track', img: 'https://d64gsuwffb70l.cloudfront.net/6a177c3447adad4194082b60_1779924175463_880cc051.png' },
  { id: 'esports', name: 'Esports Stage', img: 'https://d64gsuwffb70l.cloudfront.net/6a177c3447adad4194082b60_1779924191408_35bdcf51.jpg' },
  { id: 'media', name: 'Media Wall', img: 'https://d64gsuwffb70l.cloudfront.net/6a177c3447adad4194082b60_1779924206808_9304e595.jpg' },
  { id: 'locker', name: 'Locker Room', img: 'https://d64gsuwffb70l.cloudfront.net/6a177c3447adad4194082b60_1779924227749_1f8aea53.png' },
  { id: 'action', name: 'Skate Park', img: 'https://d64gsuwffb70l.cloudfront.net/6a177c3447adad4194082b60_1779924257447_dbcf33e9.png' },
  { id: 'hockey', name: 'Hockey Rink', img: 'https://d64gsuwffb70l.cloudfront.net/6a177c3447adad4194082b60_1779924274843_11c4d264.jpg' },
];

type Stage = 'upload' | 'styling' | 'processing' | 'done' | 'error';

const Studio: React.FC = () => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [helmet, setHelmet] = useState('claw');
  const [bg, setBg] = useState('stadium');
  const [stage, setStage] = useState<Stage>('upload');
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState('Initializing AI engine...');
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  // Simulated progress while AI is generating
  useEffect(() => {
    if (stage !== 'processing') return;
    const messages = [
      'Detecting facial landmarks...',
      'Fitting Advanced Armour helmet...',
      'Removing original background...',
      'Compositing into scene...',
      'Matching lighting & shadows...',
      'Finalizing 4K render...',
    ];
    let i = 0;
    setStatusMsg(messages[0]);
    const tick = setInterval(() => {
      setProgress(p => {
        const next = Math.min(p + Math.random() * 4 + 1, 95);
        const msgIdx = Math.min(Math.floor(next / 16), messages.length - 1);
        if (msgIdx !== i) {
          i = msgIdx;
          setStatusMsg(messages[msgIdx]);
        }
        return next;
      });
    }, 600);
    return () => clearInterval(tick);
  }, [stage]);

  const handleFile = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Image must be under 10MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhoto(e.target?.result as string);
      setStage('styling');
      setErrorMsg(null);
    };
    reader.readAsDataURL(file);
  };

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f && f.type.startsWith('image/')) handleFile(f);
  };

  const generate = async () => {
    if (!photo) return;
    setStage('processing');
    setProgress(0);
    setResultUrl(null);
    setErrorMsg(null);

    try {
      const { data, error } = await supabase.functions.invoke('generate-sports-portrait', {
        body: { selfie: photo, helmetId: helmet, backdropId: bg },
      });

      if (error) throw new Error(error.message || 'Generation failed');
      if (!data?.imageUrl) throw new Error(data?.error || 'No image returned from AI');

      setProgress(100);
      setStatusMsg('Done!');
      setResultUrl(data.imageUrl);
      // brief pause so user sees 100%
      setTimeout(() => setStage('done'), 400);
    } catch (err) {
      console.error(err);
      setErrorMsg((err as Error).message || 'Something went wrong. Please try again.');
      setStage('error');
    }
  };

  const reset = () => {
    setPhoto(null);
    setStage('upload');
    setProgress(0);
    setResultUrl(null);
    setErrorMsg(null);
  };

  const restartFromPhoto = () => {
    setStage('styling');
    setProgress(0);
    setResultUrl(null);
    setErrorMsg(null);
  };

  const download = () => {
    if (!resultUrl) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = `swaarm-${helmet}-${bg}-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const share = async () => {
    if (!resultUrl) return;
    try {
      // Try native share with the image file
      const blob = await fetch(resultUrl).then(r => r.blob());
      const file = new File([blob], `swaarm-${helmet}.png`, { type: blob.type });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'My SWAARM Portrait', text: 'Made with SWAARM AI Studio' });
        return;
      }
    } catch { /* fall through */ }
    // Fallback: copy URL
    if (resultUrl.startsWith('data:')) {
      alert('Right-click the image and choose "Save Image As" to share.');
    } else {
      navigator.clipboard.writeText(resultUrl);
      alert('Image link copied to clipboard.');
    }
  };

  const selectedBg = BACKGROUNDS.find(b => b.id === bg)!;
  const selectedHelmet = HELMETS.find(h => h.id === helmet)!;

  return (
    <section id="studio" className="bg-gradient-to-b from-black to-zinc-950 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="text-cyan-400 text-xs font-bold tracking-widest mb-3">LIVE DEMO STUDIO</div>
          <h2 className="text-white text-4xl sm:text-5xl font-black mb-4">Build your shot</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">Real AI. Real output. Drop in a selfie to start.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* LEFT: Controls */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold text-lg">1. Your Photo</h3>
                {photo && <button onClick={reset} className="text-xs text-cyan-400 hover:underline flex items-center gap-1"><RefreshCw className="w-3 h-3" /> Reset</button>}
              </div>

              {!photo ? (
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                  onClick={() => fileRef.current?.click()}
                  className={`cursor-pointer border-2 border-dashed rounded-xl p-8 text-center transition ${dragging ? 'border-cyan-400 bg-cyan-400/5' : 'border-white/20 hover:border-cyan-400/50 hover:bg-white/5'}`}
                >
                  <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center mb-4">
                    <Upload className="w-6 h-6 text-black" strokeWidth={2.5} />
                  </div>
                  <p className="text-white font-semibold mb-1">Drop selfie here</p>
                  <p className="text-gray-400 text-sm mb-4">or click to browse · JPG, PNG up to 10MB</p>
                  <div className="inline-flex items-center gap-2 text-cyan-400 text-xs font-medium">
                    <Camera className="w-4 h-4" /> Or use webcam
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileInput} />
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden bg-black aspect-[4/5] max-h-64 mx-auto">
                  <img src={photo} alt="Selfie" className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2 bg-emerald-500 rounded-full p-1">
                    <Check className="w-3 h-3 text-black" strokeWidth={3} />
                  </div>
                  <div className="absolute bottom-2 left-2 right-2 bg-black/70 backdrop-blur rounded-lg px-3 py-1.5 text-xs text-cyan-400 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    Face detected · Ready
                  </div>
                </div>
              )}
              {errorMsg && stage === 'upload' && (
                <div className="mt-3 text-xs text-red-400 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> {errorMsg}</div>
              )}
            </div>

            <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-5">
              <h3 className="text-white font-bold text-lg mb-4">2. Choose Helmet</h3>
              <div className="grid grid-cols-3 gap-3">
                {HELMETS.map(h => (
                  <button
                    key={h.id}
                    onClick={() => setHelmet(h.id)}
                    className={`relative p-3 rounded-xl border-2 transition text-left ${helmet === h.id ? 'border-cyan-400 bg-cyan-400/10' : 'border-white/10 bg-white/5 hover:border-white/30'}`}
                  >
                    {h.popular && <span className="absolute -top-2 -right-2 text-[9px] bg-orange-500 text-black font-bold px-1.5 py-0.5 rounded-full">HOT</span>}
                    <div className="aspect-square bg-gradient-to-br from-zinc-800 to-black rounded-lg mb-2 overflow-hidden flex items-center justify-center">
                      {h.img ? (
                        <img src={h.img} alt={h.name} className="w-full h-full object-contain" />
                      ) : (
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${h.id === 'racer' ? 'from-red-500 to-orange-500' : h.id === 'esports' ? 'from-purple-500 to-pink-500' : h.id === 'hockey' ? 'from-blue-300 to-blue-600' : h.id === 'cycle' ? 'from-lime-400 to-emerald-500' : 'from-gray-300 to-gray-700'}`} />
                      )}
                    </div>
                    <div className="text-white text-xs font-semibold leading-tight">{h.name}</div>
                    <div className="text-gray-500 text-[10px] leading-tight mt-0.5">{h.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-5">
              <h3 className="text-white font-bold text-lg mb-4">3. Pick Backdrop</h3>
              <div className="grid grid-cols-4 gap-2">
                {BACKGROUNDS.map(b => (
                  <button
                    key={b.id}
                    onClick={() => setBg(b.id)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition ${bg === b.id ? 'border-cyan-400 ring-2 ring-cyan-400/30' : 'border-white/10 hover:border-white/40'}`}
                    title={b.name}
                  >
                    <img src={b.img} alt={b.name} className="w-full h-full object-cover" />
                    {bg === b.id && (
                      <div className="absolute inset-0 bg-cyan-400/20 flex items-center justify-center">
                        <Check className="w-5 h-5 text-cyan-400" strokeWidth={3} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <div className="mt-3 text-xs text-gray-400">Selected: <span className="text-cyan-400 font-medium">{selectedBg.name}</span></div>
            </div>

            <button
              onClick={generate}
              disabled={!photo || stage === 'processing'}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-[0_0_30px_rgba(0,212,255,0.4)] transition flex items-center justify-center gap-2"
            >
              {stage === 'processing' ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Generating with AI...</>
              ) : stage === 'done' ? (
                <>Generate Again</>
              ) : (
                <>Generate Shot</>
              )}
            </button>
            <p className="text-center text-[11px] text-gray-500">Powered by gpt-5-image via SWAARM® AI Engine</p>
          </div>

          {/* RIGHT: Preview */}
          <div className="lg:col-span-3">
            <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-5 h-full min-h-[600px] flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold text-lg">Live Preview</h3>
                <div className="flex items-center gap-2 text-xs">
                  <span className={`w-2 h-2 rounded-full ${stage === 'error' ? 'bg-red-400' : 'bg-emerald-400 animate-pulse'}`} />
                  <span className="text-gray-400">{stage === 'error' ? 'Error' : 'AI Engine Online'}</span>
                </div>
              </div>

              <div className="relative flex-1 rounded-xl overflow-hidden bg-black border border-white/5">
                {/* Backdrop layer (hidden when result is shown) */}
                {stage !== 'done' && (
                  <>
                    <img src={selectedBg.img} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40" />
                  </>
                )}

                <div className="absolute inset-0 flex items-center justify-center p-6">
                  {stage === 'upload' && (
                    <div className="text-center">
                      <div className="w-20 h-20 mx-auto rounded-full bg-white/10 backdrop-blur flex items-center justify-center mb-4">
                        <Upload className="w-9 h-9 text-white" />
                      </div>
                      <p className="text-white font-semibold text-lg mb-1">Upload a selfie to begin</p>
                      <p className="text-gray-300 text-sm">Your AI transformation will appear here</p>
                    </div>
                  )}

                  {stage === 'styling' && photo && (
                    <div className="relative">
                      <img src={photo} alt="" className="w-56 h-72 object-cover rounded-2xl shadow-2xl ring-2 ring-cyan-400/50" />
                      <img src={selectedHelmet.img || HELMET_IMG} alt="" className="absolute -top-12 left-1/2 -translate-x-1/2 w-44 h-44 object-contain drop-shadow-2xl pointer-events-none opacity-90" />
                      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-cyan-400 text-black text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                        Preview · Click Generate
                      </div>
                    </div>
                  )}

                  {stage === 'processing' && (
                    <div className="w-full max-w-md text-center">
                      <div className="relative mb-5">
                        <Loader2 className="w-16 h-16 text-cyan-400 animate-spin mx-auto" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-8 h-8 rounded-full bg-cyan-400/20" />
                        </div>
                      </div>
                      <p className="text-white font-bold text-xl mb-2">Generating with AI</p>
                      <p className="text-gray-300 text-sm mb-5 h-5 transition">{statusMsg}</p>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-2">
                        <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-300" style={{ width: `${progress}%` }} />
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">Est. 10–20s</span>
                        <span className="text-cyan-400 font-mono">{Math.round(progress)}%</span>
                      </div>
                    </div>
                  )}

                  {stage === 'done' && resultUrl && (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <img
                        src={resultUrl}
                        alt="AI generated sports portrait"
                        className="max-w-full max-h-full object-contain rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.8)]"
                      />
                      <div className="absolute bottom-3 left-3 right-3 bg-black/70 backdrop-blur rounded-lg px-4 py-2 flex items-center justify-between">
                        <div>
                          <div className="text-white text-xs font-bold">SWAARM® · {selectedHelmet.name}</div>
                          <div className="text-cyan-400 text-[10px]">{selectedBg.name} · AI generated</div>
                        </div>
                        <div className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                          <Check className="w-3 h-3" /> Ready
                        </div>
                      </div>
                    </div>
                  )}

                  {stage === 'error' && (
                    <div className="text-center max-w-md">
                      <div className="w-16 h-16 mx-auto rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center mb-4">
                        <AlertCircle className="w-8 h-8 text-red-400" />
                      </div>
                      <p className="text-white font-bold text-lg mb-2">Generation Failed</p>
                      <p className="text-gray-300 text-sm mb-5">{errorMsg || 'The AI engine had trouble with that shot. Try a clearer selfie.'}</p>
                      <button onClick={restartFromPhoto} className="px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition">
                        Try Again
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {stage === 'done' && resultUrl && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button onClick={download} className="flex-1 min-w-[140px] py-3 rounded-lg bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-bold flex items-center justify-center gap-2 hover:opacity-90 transition">
                    <Download className="w-4 h-4" /> Download
                  </button>
                  <button onClick={share} className="flex-1 min-w-[140px] py-3 rounded-lg bg-white/10 text-white font-semibold flex items-center justify-center gap-2 hover:bg-white/20 transition">
                    <Share2 className="w-4 h-4" /> Share
                  </button>
                  <button onClick={reset} className="py-3 px-4 rounded-lg bg-white/5 text-gray-300 hover:bg-white/10 transition flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" /> New
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Studio;
