import { useEffect, useState } from 'react';

const STAGES = [
  'Placing you in the team song photo',
  'Fitting your SWAARM headgear',
  'Preparing your share-ready image',
];

export default function ProcessingScreen() {
  const [progress, setProgress] = useState(8);
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setProgress((p) => {
        const next = Math.min(p + Math.random() * 8, 94);
        setStage(Math.min(Math.floor((next / 100) * STAGES.length), STAGES.length - 1));
        return next;
      });
    }, 800);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="text-center py-10">
      <div className="relative w-36 h-36 mx-auto mb-8">
        <svg className="w-36 h-36 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="44" fill="none" stroke="#1e3a6e" strokeWidth="8" />
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="#1e5fc4"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 44}
            strokeDashoffset={2 * Math.PI * 44 * (1 - progress / 100)}
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-black text-white">{Math.round(progress)}%</span>
        </div>
      </div>
      <h3 className="text-2xl font-bold text-white mb-2">SWAARMing you into the chorus…</h3>
      <p className="text-blue-300 font-medium animate-pulse">{STAGES[stage]}</p>
      <div className="mt-8 max-w-xs mx-auto space-y-2 text-left">
        {STAGES.map((s, i) => (
          <div key={s} className="flex items-center gap-3 text-sm">
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                i < stage
                  ? 'bg-emerald-500 text-white'
                  : i === stage
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-700 text-slate-400'
              }`}
            >
              {i < stage ? '✓' : i + 1}
            </span>
            <span className={i <= stage ? 'text-white' : 'text-slate-500'}>{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
