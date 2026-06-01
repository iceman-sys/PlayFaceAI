import React, { useRef, useState, useEffect } from 'react';
import {
  Upload, Camera, Check, Loader2, Download, Share2, RefreshCw, AlertCircle,
  Mail, Copy, ExternalLink,
} from 'lucide-react';
import { compressImageFile, estimatePayloadKb } from '@/lib/compressImage';
import { generateSportsPortrait } from '@/lib/invokeGenerate';
import {
  TRISTAN_CALEB_CAMPAIGN,
  CAMPAIGN_HELMET_SRC,
  CAMPAIGN_SCENE_SRC,
} from '@/lib/campaign';
import { buildShareLinks, copyCaption } from '@/lib/socialShare';

const HELMETS = [
  { id: 'swaarm-rugby', name: 'SWAARM Rugby Black', desc: 'Official Advanced Armour', img: CAMPAIGN_HELMET_SRC, popular: true },
  { id: 'classic', name: 'Classic Black', desc: 'Minimal pro look', img: CAMPAIGN_HELMET_SRC },
];

const BACKGROUNDS = [
  { id: 'tristan-caleb', name: 'Tristan & Caleb AFL', img: CAMPAIGN_SCENE_SRC, campaign: true },
  { id: 'stadium', name: 'Football Stadium', img: 'https://d64gsuwffb70l.cloudfront.net/6a177c3447adad4194082b60_1779924133843_37718392.png' },
  { id: 'locker', name: 'Locker Room', img: 'https://d64gsuwffb70l.cloudfront.net/6a177c3447adad4194082b60_1779924227749_1f8aea53.png' },
  { id: 'media', name: 'Media Wall', img: 'https://d64gsuwffb70l.cloudfront.net/6a177c3447adad4194082b60_1779924206808_9304e595.jpg' },
];

type Stage = 'upload' | 'styling' | 'processing' | 'done' | 'error';

const Studio: React.FC = () => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [helmet, setHelmet] = useState('swaarm-rugby');
  const [bg, setBg] = useState('tristan-caleb');
  const [stage, setStage] = useState<Stage>('upload');
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState('Initializing AI engine...');
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [shareCaption, setShareCaption] = useState(TRISTAN_CALEB_CAMPAIGN.shareCaption);
  const [emailed, setEmailed] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [payloadKb, setPayloadKb] = useState<number | null>(null);

  const isCampaign = bg === 'tristan-caleb';

  useEffect(() => {
    if (stage !== 'processing') return;
    const messages = isCampaign
      ? [
          'Detecting facial landmarks...',
          'Placing you with Tristan & Caleb...',
          'Fitting SWAARM® rugby headgear...',
          'Matching locker room lighting...',
          'Finalizing campaign shot...',
        ]
      : [
          'Detecting facial landmarks...',
          'Fitting Advanced Armour helmet...',
          'Removing original background...',
          'Compositing into scene...',
          'Matching lighting & shadows...',
        ];
    let i = 0;
    setStatusMsg(messages[0]);
    const tick = setInterval(() => {
      setProgress(p => {
        const next = Math.min(p + Math.random() * 4 + 1, 95);
        const msgIdx = Math.min(Math.floor(next / 20), messages.length - 1);
        if (msgIdx !== i) {
          i = msgIdx;
          setStatusMsg(messages[msgIdx]);
        }
        return next;
      });
    }, 600);
    return () => clearInterval(tick);
  }, [stage, isCampaign]);

  const handleFile = async (file: File) => {
    setCompressing(true);
    setErrorMsg(null);
    try {
      const compressed = await compressImageFile(file);
      setPhoto(compressed);
      setPayloadKb(estimatePayloadKb(compressed));
      setStage('styling');
    } catch (err) {
      setErrorMsg((err as Error).message || 'Could not process image');
    } finally {
      setCompressing(false);
    }
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
    if (isCampaign && !email.trim()) {
      setErrorMsg('Enter your email to receive your AI campaign photo');
      return;
    }

    setStage('processing');
    setProgress(0);
    setResultUrl(null);
    setErrorMsg(null);
    setEmailed(false);

    try {
      const selectedBg = BACKGROUNDS.find(b => b.id === bg)!;
      const data = await generateSportsPortrait({
        selfie: photo,
        email: email.trim() || undefined,
        campaignId: isCampaign ? TRISTAN_CALEB_CAMPAIGN.id : undefined,
        helmetId: helmet,
        backdropId: bg,
        sceneUrl: isCampaign ? TRISTAN_CALEB_CAMPAIGN.sceneUrl : selectedBg.img,
        helmetUrl: TRISTAN_CALEB_CAMPAIGN.helmetUrl,
      });

      setProgress(100);
      setStatusMsg('Done!');
      setResultUrl(data.imageUrl);
      if (data.shareCaption) setShareCaption(data.shareCaption);
      setEmailed(Boolean(data.emailed));
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
    setPayloadKb(null);
    setEmailed(false);
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
    a.download = `swaarm-${isCampaign ? 'tristan-caleb' : helmet}-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const shareNative = async () => {
    if (!resultUrl) return;
    try {
      const blob = await fetch(resultUrl).then(r => r.blob());
      const file = new File([blob], 'swaarm-campaign.png', { type: blob.type });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'My SWAARM Portrait', text: shareCaption });
        return;
      }
    } catch { /* fall through */ }
    if (resultUrl.startsWith('data:')) {
      alert('Download the image, then post with the copied caption.');
    }
  };

  const shareLinks = buildShareLinks(shareCaption);

  const selectedBg = BACKGROUNDS.find(b => b.id === bg)!;
  const selectedHelmet = HELMETS.find(h => h.id === helmet)!;
  const previewScene = isCampaign ? CAMPAIGN_SCENE_SRC : selectedBg.img;

  return (
    <section id="studio" className="bg-gradient-to-b from-black to-zinc-950 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="text-cyan-400 text-xs font-bold tracking-widest mb-3">SWAARM® CAMPAIGN STUDIO</div>
          <h2 className="text-white text-4xl sm:text-5xl font-black mb-4">Join Tristan & Caleb</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Upload a selfie — AI places your face on the center player, adds your SWAARM headgear, and emails your shot.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-5">
              <h3 className="text-white font-bold text-lg mb-4">1. Your Email</h3>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="email"
                  required={isCampaign}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                />
              </div>
              <p className="text-gray-500 text-xs mt-2">Required for campaign mode — we email your finished AI photo.</p>
            </div>

            <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold text-lg">2. Your Photo</h3>
                {photo && (
                  <button onClick={reset} className="text-xs text-cyan-400 hover:underline flex items-center gap-1">
                    <RefreshCw className="w-3 h-3" /> Reset
                  </button>
                )}
              </div>

              {!photo ? (
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                  onClick={() => !compressing && fileRef.current?.click()}
                  className={`cursor-pointer border-2 border-dashed rounded-xl p-8 text-center transition ${dragging ? 'border-cyan-400 bg-cyan-400/5' : 'border-white/20 hover:border-cyan-400/50 hover:bg-white/5'} ${compressing ? 'opacity-60 pointer-events-none' : ''}`}
                >
                  {compressing ? (
                    <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-3" />
                  ) : (
                    <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center mb-4">
                      <Upload className="w-6 h-6 text-black" strokeWidth={2.5} />
                    </div>
                  )}
                  <p className="text-white font-semibold mb-1">{compressing ? 'Optimizing photo...' : 'Drop selfie here'}</p>
                  <p className="text-gray-400 text-sm mb-4">Auto-compressed for AI · JPG, PNG up to 10MB</p>
                  <div className="inline-flex items-center gap-2 text-cyan-400 text-xs font-medium">
                    <Camera className="w-4 h-4" /> Front-facing, good lighting
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileInput} />
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden bg-black aspect-[4/5] max-h-64 mx-auto">
                  <img src={photo} alt="Selfie" className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2 bg-emerald-500 rounded-full p-1">
                    <Check className="w-3 h-3 text-black" strokeWidth={3} />
                  </div>
                  <div className="absolute bottom-2 left-2 right-2 bg-black/70 backdrop-blur rounded-lg px-3 py-1.5 text-xs text-cyan-400 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                      Ready
                    </span>
                    {payloadKb != null && <span className="text-gray-400">{payloadKb}KB</span>}
                  </div>
                </div>
              )}
              {errorMsg && (stage === 'upload' || stage === 'styling') && (
                <div className="mt-3 text-xs text-red-400 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" /> {errorMsg}
                </div>
              )}
            </div>

            <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-5">
              <h3 className="text-white font-bold text-lg mb-4">3. SWAARM Headgear</h3>
              <div className="grid grid-cols-2 gap-3">
                {HELMETS.map(h => (
                  <button
                    key={h.id}
                    onClick={() => setHelmet(h.id)}
                    className={`relative p-3 rounded-xl border-2 transition text-left ${helmet === h.id ? 'border-cyan-400 bg-cyan-400/10' : 'border-white/10 bg-white/5 hover:border-white/30'}`}
                  >
                    {h.popular && (
                      <span className="absolute -top-2 -right-2 text-[9px] bg-orange-500 text-black font-bold px-1.5 py-0.5 rounded-full">OFFICIAL</span>
                    )}
                    <div className="aspect-square bg-gradient-to-br from-zinc-800 to-black rounded-lg mb-2 overflow-hidden flex items-center justify-center">
                      <img src={h.img} alt={h.name} className="w-full h-full object-contain" />
                    </div>
                    <div className="text-white text-xs font-semibold">{h.name}</div>
                    <div className="text-gray-500 text-[10px] mt-0.5">{h.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-5">
              <h3 className="text-white font-bold text-lg mb-4">4. Scene</h3>
              <div className="grid grid-cols-2 gap-2">
                {BACKGROUNDS.map(b => (
                  <button
                    key={b.id}
                    onClick={() => setBg(b.id)}
                    className={`relative aspect-video rounded-lg overflow-hidden border-2 transition ${bg === b.id ? 'border-cyan-400 ring-2 ring-cyan-400/30' : 'border-white/10 hover:border-white/40'}`}
                    title={b.name}
                  >
                    <img src={b.img} alt={b.name} className="w-full h-full object-cover" />
                    {b.campaign && (
                      <span className="absolute top-1 left-1 text-[8px] bg-cyan-400 text-black font-bold px-1 py-0.5 rounded">CAMPAIGN</span>
                    )}
                    {bg === b.id && (
                      <div className="absolute inset-0 bg-cyan-400/20 flex items-center justify-center">
                        <Check className="w-5 h-5 text-cyan-400" strokeWidth={3} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <div className="mt-3 text-xs text-gray-400">
                Selected: <span className="text-cyan-400 font-medium">{selectedBg.name}</span>
              </div>
            </div>

            <button
              onClick={generate}
              disabled={!photo || stage === 'processing' || compressing}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-[0_0_30px_rgba(0,212,255,0.4)] transition flex items-center justify-center gap-2"
            >
              {stage === 'processing' ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Generating with AI...</>
              ) : (
                <>Generate Shot</>
              )}
            </button>
            <p className="text-center text-[11px] text-gray-500">Powered by OpenAI via SWAARM® AI Engine</p>
          </div>

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
                {stage !== 'done' && (
                  <>
                    <img src={previewScene} alt="" className="absolute inset-0 w-full h-full object-cover" />
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
                      <img src={selectedHelmet.img} alt="" className="absolute -top-12 left-1/2 -translate-x-1/2 w-44 h-44 object-contain drop-shadow-2xl pointer-events-none opacity-90" />
                      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-cyan-400 text-black text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                        Preview · Click Generate
                      </div>
                    </div>
                  )}

                  {stage === 'processing' && (
                    <div className="w-full max-w-md text-center">
                      <Loader2 className="w-16 h-16 text-cyan-400 animate-spin mx-auto mb-5" />
                      <p className="text-white font-bold text-xl mb-2">Generating with AI</p>
                      <p className="text-gray-300 text-sm mb-5 h-5 transition">{statusMsg}</p>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-2">
                        <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-300" style={{ width: `${progress}%` }} />
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">Est. 15–45s</span>
                        <span className="text-cyan-400 font-mono">{Math.round(progress)}%</span>
                      </div>
                    </div>
                  )}

                  {stage === 'done' && resultUrl && (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <img src={resultUrl} alt="AI generated sports portrait" className="max-w-full max-h-full object-contain rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.8)]" />
                      <div className="absolute bottom-3 left-3 right-3 bg-black/70 backdrop-blur rounded-lg px-4 py-2 flex items-center justify-between">
                        <div>
                          <div className="text-white text-xs font-bold">SWAARM® · {selectedHelmet.name}</div>
                          <div className="text-cyan-400 text-[10px]">
                            {selectedBg.name} · {emailed ? 'Emailed' : 'AI generated'}
                          </div>
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
                      <p className="text-gray-300 text-sm mb-5">{errorMsg || 'Try a clearer front-facing selfie.'}</p>
                      <button onClick={restartFromPhoto} className="px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition">
                        Try Again
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {stage === 'done' && resultUrl && (
                <div className="mt-4 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <button onClick={download} className="flex-1 min-w-[120px] py-3 rounded-lg bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-bold flex items-center justify-center gap-2 hover:opacity-90 transition">
                      <Download className="w-4 h-4" /> Download
                    </button>
                    <button onClick={shareNative} className="flex-1 min-w-[120px] py-3 rounded-lg bg-white/10 text-white font-semibold flex items-center justify-center gap-2 hover:bg-white/20 transition">
                      <Share2 className="w-4 h-4" /> Share
                    </button>
                    <button onClick={() => copyCaption(shareCaption).then(() => alert('Caption copied!'))} className="py-3 px-4 rounded-lg bg-white/5 text-gray-300 hover:bg-white/10 transition flex items-center gap-2">
                      <Copy className="w-4 h-4" /> Copy caption
                    </button>
                  </div>

                  <div className="rounded-lg bg-black/40 border border-white/10 p-3">
                    <p className="text-gray-400 text-[10px] uppercase tracking-wider mb-2">Share caption</p>
                    <p className="text-white text-xs leading-relaxed mb-3">{shareCaption}</p>
                    <div className="flex flex-wrap gap-2">
                      <a href={shareLinks.twitter} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/10 text-white text-xs hover:bg-white/20 transition">
                        <ExternalLink className="w-3 h-3" /> X / Twitter
                      </a>
                      <a href={shareLinks.facebook} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/10 text-white text-xs hover:bg-white/20 transition">
                        <ExternalLink className="w-3 h-3" /> Facebook
                      </a>
                      <a href={shareLinks.linkedin} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/10 text-white text-xs hover:bg-white/20 transition">
                        <ExternalLink className="w-3 h-3" /> LinkedIn
                      </a>
                    </div>
                  </div>

                  {!emailed && email && (
                    <p className="text-amber-400/80 text-xs text-center">
                      Email delivery requires RESEND_API_KEY on the server. Download or share your image above.
                    </p>
                  )}
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
