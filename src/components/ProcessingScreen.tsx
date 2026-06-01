import { useEffect, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { PIPELINE_STAGES } from '@/lib/constants';

export default function ProcessingScreen({ selfie }: { selfie: string }) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timers: number[] = [];
    PIPELINE_STAGES.forEach((_, i) => {
      timers.push(window.setTimeout(() => setStage(i + 1), (i + 1) * 2600));
    });
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <section className="min-h-screen flex items-center justify-center bg-[#08090d] px-5 pt-16">
      <div className="max-w-lg w-full text-center">
        <div className="relative mx-auto w-44 h-44 mb-8">
          <img src={selfie} alt="" className="w-full h-full object-cover rounded-full border-4 border-cyan-400/30" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-cyan-400 animate-spin" />
        </div>
        <h2 className="text-3xl font-black text-white">Building your campaign shot</h2>
        <p className="text-white/50 mt-2 mb-8">Identity-preserving compositing in progress…</p>

        <div className="space-y-3 text-left">
          {PIPELINE_STAGES.map((s, i) => {
            const done = i < stage;
            const active = i === stage;
            return (
              <div key={i} className={`flex items-center gap-3 rounded-lg px-4 py-3 border transition ${done ? 'border-cyan-400/40 bg-cyan-400/10' : active ? 'border-white/20 bg-white/5' : 'border-white/5 opacity-50'}`}>
                {done ? <Check className="w-5 h-5 text-cyan-400" /> : active ? <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" /> : <span className="w-5 h-5 rounded-full border border-white/20" />}
                <span className={`font-medium ${done || active ? 'text-white' : 'text-white/40'}`}>{s}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
