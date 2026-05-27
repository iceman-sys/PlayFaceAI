import React, { useEffect, useRef, useState } from 'react';
import { Cpu, ScanFace, Sparkles, Users, CheckCircle2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Props {
  photo: string;
  onComplete: (finalImage: string) => void;
}

const TEAM_IMG = 'https://d64gsuwffb70l.cloudfront.net/6a16a64a9f1788dc1cb846db_1779869408644_5589894f.png';

const STAGES = [
  { icon: ScanFace, label: 'Face & landmark detection' },
  { icon: Cpu, label: 'AI helmet generation (Gemini)' },
  { icon: Sparkles, label: 'Edge blending & color match' },
  { icon: Users, label: 'Compositing into team photo' },
];

const Processing: React.FC<Props> = ({ photo, onComplete }) => {
  const [stage, setStage] = useState(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    runPipeline();
    // eslint-disable-next-line
  }, []);

  const runPipeline = async () => {
    try {
      // Stage 0: face detection (quick visual delay)
      setStage(0);
      await tween(0, 18, 700, setProgress);

      // Stage 1: AI helmet generation
      setStage(1);
      const tweenPromise = tween(18, 78, 12000, setProgress); // optimistic tween while waiting

      const { data, error: fnError } = await supabase.functions.invoke('apply-helmet', {
        body: { image: photo },
      });

      // Stop the tween early if AI returned faster
      tweenPromise.cancel();

      if (fnError) throw new Error(fnError.message || 'AI service failed');
      if (data?.error) throw new Error(data.error);

      const helmetedImage: string = data?.image;
      if (!helmetedImage) throw new Error('No image returned from AI');

      setProgress(78);

      // Stage 2: blending (visual)
      setStage(2);
      await tween(78, 90, 700, setProgress);

      // Stage 3: final compositing
      setStage(3);
      const finalImage = await compositeOntoTeam(helmetedImage);
      await tween(90, 100, 500, setProgress);

      onComplete(finalImage);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Something went wrong');
      // Fallback: composite raw photo so user still gets a result
      try {
        const fallback = await compositeOntoTeam(photo);
        setTimeout(() => onComplete(fallback), 1500);
      } catch {
        setTimeout(() => onComplete(photo), 1500);
      }
    }
  };

  return (
    <div className="pt-28 pb-16 px-4 sm:px-6 min-h-screen flex items-center">
      <div className="max-w-3xl mx-auto w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#39FF14]/10 border border-[#39FF14]/30 mb-4">
            <span className="w-2 h-2 rounded-full bg-[#39FF14] animate-pulse" />
            <span className="text-xs font-bold tracking-widest text-[#39FF14]">AI ENGINE ACTIVE</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-3">
            FORGING YOUR LEGEND.
          </h1>
          <p className="text-white/60">
            Gemini-powered neural compositing — please keep this window open.
          </p>
        </div>

        <div className="p-6 md:p-8 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur">
          <div className="grid sm:grid-cols-2 gap-6 mb-6">
            <div className="relative rounded-xl overflow-hidden aspect-square border border-white/10">
              <img src={photo} alt="You" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#00D9FF]/40 to-transparent animate-pulse" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 border-2 border-[#00D9FF] rounded-full animate-ping" />
              </div>
              <div className="absolute top-3 left-3 px-2 py-1 rounded-md bg-black/70 backdrop-blur text-xs font-bold text-[#00D9FF]">
                INPUT
              </div>
              <ScanLine />
            </div>

            <div className="relative rounded-xl overflow-hidden aspect-square border border-white/10 bg-black">
              <img src={TEAM_IMG} alt="Team" className="w-full h-full object-cover opacity-60" />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#39FF14]/30 animate-pulse" />
              <div className="absolute top-3 right-3 px-2 py-1 rounded-md bg-black/70 backdrop-blur text-xs font-bold text-[#39FF14]">
                TARGET
              </div>
              <ScanLine reverse />
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex justify-between text-xs font-bold text-white/60 mb-2">
              <span>NEURAL PROCESSING</span>
              <span className="text-[#00D9FF]">{Math.floor(progress)}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#00D9FF] to-[#39FF14] transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Stages */}
          <div className="space-y-2">
            {STAGES.map((s, i) => {
              const Icon = s.icon;
              const isDone = i < stage;
              const isActive = i === stage;
              return (
                <div
                  key={s.label}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                    isActive
                      ? 'bg-[#00D9FF]/10 border-[#00D9FF]/30'
                      : isDone
                      ? 'bg-[#39FF14]/5 border-[#39FF14]/20'
                      : 'bg-white/[0.02] border-white/5 opacity-50'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isDone
                        ? 'bg-[#39FF14] text-[#0A0E27]'
                        : isActive
                        ? 'bg-[#00D9FF] text-[#0A0E27]'
                        : 'bg-white/5 text-white/40'
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className={`text-sm font-medium ${isActive || isDone ? 'text-white' : 'text-white/40'}`}>
                    {s.label}
                  </span>
                  {isActive && (
                    <span className="ml-auto text-xs text-[#00D9FF] font-mono animate-pulse">
                      processing...
                    </span>
                  )}
                  {isDone && (
                    <span className="ml-auto text-xs text-[#39FF14] font-mono">✓ done</span>
                  )}
                </div>
              );
            })}
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="text-xs text-red-300">
                <span className="font-bold">AI service issue: </span>
                {error}. Falling back to standard composite.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ScanLine: React.FC<{ reverse?: boolean }> = ({ reverse }) => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div
      className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00D9FF] to-transparent"
      style={{
        animation: `scan 2s linear infinite ${reverse ? 'reverse' : ''}`,
        boxShadow: '0 0 12px #00D9FF',
      }}
    />
    <style>{`
      @keyframes scan {
        0% { top: 0%; }
        100% { top: 100%; }
      }
    `}</style>
  </div>
);

/**
 * Animate progress from `from` to `to` over `duration` ms.
 * Returns a cancellable handle — call `.cancel()` to stop the tween.
 */
function tween(
  from: number,
  to: number,
  duration: number,
  setter: (v: number) => void
): Promise<void> & { cancel: () => void } {
  let cancelled = false;
  let raf = 0;
  const start = performance.now();

  const promise = new Promise<void>((resolve) => {
    const step = (now: number) => {
      if (cancelled) return resolve();
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 2);
      setter(from + (to - from) * eased);
      if (t >= 1) return resolve();
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }) as Promise<void> & { cancel: () => void };

  promise.cancel = () => {
    cancelled = true;
    cancelAnimationFrame(raf);
  };
  return promise;
}

/**
 * Take an AI-generated headshot (with helmet already applied) and composite
 * it onto the far-right side of the team photo.
 */
async function compositeOntoTeam(personImage: string): Promise<string> {
  return new Promise((resolve) => {
    const teamImg = new Image();
    teamImg.crossOrigin = 'anonymous';
    teamImg.onload = () => {
      const userImg = new Image();
      // AI image may be a data URL or remote — try crossOrigin
      userImg.crossOrigin = 'anonymous';
      const onUserLoad = () => {
        const canvas = document.createElement('canvas');
        canvas.width = teamImg.width;
        canvas.height = teamImg.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(personImage);

        // Draw team photo as base
        ctx.drawImage(teamImg, 0, 0);

        // Slot for new teammate on far right
        const slotW = teamImg.width * 0.19;
        const slotH = teamImg.height * 0.78;
        const slotX = teamImg.width * 0.795;
        const slotY = teamImg.height * 0.13;

        // Subtle backdrop wash to "make room"
        ctx.save();
        ctx.fillStyle = 'rgba(10,14,39,0.55)';
        ctx.fillRect(slotX - slotW * 0.05, slotY, slotW * 1.1, slotH);
        ctx.restore();

        // Compute aspect-preserving fit (cover)
        const userAspect = userImg.width / userImg.height;
        const slotAspect = slotW / slotH;
        let drawW = slotW;
        let drawH = slotH;
        let dx = slotX;
        let dy = slotY;
        if (userAspect > slotAspect) {
          drawH = slotH;
          drawW = slotH * userAspect;
          dx = slotX - (drawW - slotW) / 2;
        } else {
          drawW = slotW;
          drawH = slotW / userAspect;
          dy = slotY - (drawH - slotH) / 2;
        }

        // Soft-edged rounded mask
        ctx.save();
        const r = slotW * 0.12;
        roundedRectPath(ctx, slotX, slotY, slotW, slotH, r);
        ctx.clip();

        // Draw the AI helmeted person
        ctx.drawImage(userImg, dx, dy, drawW, drawH);

        // Color-match overlay (cool/dark tone to blend with team scene)
        const grad = ctx.createLinearGradient(slotX, slotY, slotX, slotY + slotH);
        grad.addColorStop(0, 'rgba(0,20,40,0.18)');
        grad.addColorStop(1, 'rgba(0,5,20,0.28)');
        ctx.fillStyle = grad;
        ctx.fillRect(slotX, slotY, slotW, slotH);
        ctx.restore();

        // Cyan glow outline so the user clearly stands out as "the new recruit"
        ctx.save();
        roundedRectPath(ctx, slotX, slotY, slotW, slotH, r);
        ctx.strokeStyle = '#00D9FF';
        ctx.shadowColor = '#00D9FF';
        ctx.shadowBlur = 30;
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();

        // "NEW RECRUIT" label
        ctx.save();
        const tagW = slotW * 0.85;
        const tagH = teamImg.height * 0.045;
        const tagX = slotX + (slotW - tagW) / 2;
        const tagY = slotY + slotH - tagH - teamImg.height * 0.02;
        roundedRectPath(ctx, tagX, tagY, tagW, tagH, tagH / 2);
        const tagGrad = ctx.createLinearGradient(tagX, tagY, tagX + tagW, tagY);
        tagGrad.addColorStop(0, '#00D9FF');
        tagGrad.addColorStop(1, '#39FF14');
        ctx.fillStyle = tagGrad;
        ctx.fill();
        ctx.fillStyle = '#0A0E27';
        ctx.font = `bold ${tagH * 0.45}px Inter, system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('NEW RECRUIT', tagX + tagW / 2, tagY + tagH / 2);
        ctx.restore();

        // SWAARM watermark
        ctx.save();
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.font = `bold ${teamImg.width * 0.022}px Inter, system-ui, sans-serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText('SWAARM · 2026', teamImg.width * 0.03, teamImg.height * 0.96);
        ctx.restore();

        try {
          resolve(canvas.toDataURL('image/jpeg', 0.92));
        } catch {
          // Tainted canvas fallback — return the AI image alone
          resolve(personImage);
        }
      };
      userImg.onload = onUserLoad;
      userImg.onerror = () => {
        // Retry without CORS for data URLs / strict hosts
        const retry = new Image();
        retry.onload = () => {
          // Without crossOrigin the canvas may taint; we still try
          userImg.onload = null;
          (userImg as any).onload = null;
          onUserLoad.call(retry);
        };
        retry.onerror = () => resolve(personImage);
        retry.src = personImage;
      };
      userImg.src = personImage;
    };
    teamImg.onerror = () => resolve(personImage);
    teamImg.src = TEAM_IMG;
  });
}

function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export default Processing;
