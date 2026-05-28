import React from 'react';
import { Upload, Wand2, ImageIcon, Download } from 'lucide-react';

const steps = [
  { icon: Upload, title: 'Upload', desc: 'Drop a selfie or snap one with your camera. AI detects your face automatically.', color: 'from-cyan-400 to-blue-500' },
  { icon: Wand2, title: 'Transform', desc: 'Pick a helmet style. Our AI scales and aligns it perfectly to your head.', color: 'from-yellow-300 to-orange-500' },
  { icon: ImageIcon, title: 'Composite', desc: 'Choose a backdrop. We remove your background and blend lighting & shadows.', color: 'from-lime-400 to-emerald-500' },
  { icon: Download, title: 'Export', desc: 'Download in social, print, or 4K presentation resolution. Ready to share.', color: 'from-purple-400 to-pink-500' },
];

const WorkflowSteps: React.FC = () => {
  return (
    <section className="bg-black border-y border-white/5 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <div className="text-cyan-400 text-xs font-bold tracking-widest mb-3">HOW IT WORKS</div>
          <h2 className="text-white text-4xl sm:text-5xl font-black mb-4">Four steps. One epic shot.</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">From phone selfie to pro-grade campaign asset — no Photoshop, no studio, no waiting.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s, i) => (
            <div key={i} className="relative group">
              <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-black border border-cyan-400/40 flex items-center justify-center text-cyan-400 text-sm font-bold z-10">
                {i + 1}
              </div>
              <div className="h-full p-6 rounded-2xl bg-gradient-to-b from-white/[0.04] to-transparent border border-white/10 hover:border-cyan-400/30 transition">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-5`}>
                  <s.icon className="w-6 h-6 text-black" strokeWidth={2.5} />
                </div>
                <h3 className="text-white text-xl font-bold mb-2">{s.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WorkflowSteps;
