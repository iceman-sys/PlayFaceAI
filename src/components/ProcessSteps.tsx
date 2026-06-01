import { ScanFace, HardHat, Users, Wand2, Palette, ImageIcon } from 'lucide-react';
import { PROCESS_STEPS } from '@/lib/constants';

const ICONS = [ScanFace, HardHat, Users, Wand2];

export default function ProcessSteps() {
  return (
    <section id="how" className="relative bg-[#08090d] py-24">
      <div className="max-w-7xl mx-auto px-5">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-cyan-400 font-bold tracking-widest text-sm">THE PIPELINE</span>
          <h2 className="mt-3 text-4xl sm:text-5xl font-black text-white">Controlled compositing, not random AI</h2>
          <p className="mt-4 text-white/60">
            We use facial landmark alignment, segmentation and harmonization — so the result keeps your real
            face and looks like genuine sports photography.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PROCESS_STEPS.map((step, i) => {
            const Icon = ICONS[i];
            return (
              <div key={i} className="relative group rounded-2xl border border-white/10 bg-white/5 p-6 hover:border-cyan-400/50 transition">
                <div className="absolute -top-3 -left-3 w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 text-black font-black flex items-center justify-center text-sm">
                  {i + 1}
                </div>
                <Icon className="w-10 h-10 text-cyan-400 mb-4" />
                <h3 className="text-lg font-bold text-white">{step.title}</h3>
                <p className="mt-2 text-sm text-white/55">{step.desc}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-16 grid md:grid-cols-2 gap-6">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 flex gap-5 items-start">
            <div className="shrink-0 w-12 h-12 rounded-xl bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center">
              <HardHat className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">Pick your headgear</h3>
              <p className="mt-2 text-white/60 text-sm">
                Choose from the SWAARM Advanced Armour range — from signature Claw Strike to sport-specific styles.
                Each helmet is fitted naturally with visible branding.
              </p>
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 flex gap-5 items-start">
            <div className="shrink-0 w-12 h-12 rounded-xl bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">Choose any backdrop</h3>
              <p className="mt-2 text-white/60 text-sm">
                Drop into stadiums, locker rooms, media walls — or upload your own scene.
                Lighting and perspective are matched so you look like you belong.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <a
            href="#start"
            className="inline-flex items-center gap-2 text-cyan-400 font-semibold hover:text-cyan-300 transition"
          >
            <Palette className="w-4 h-4" />
            Customize your shot below
          </a>
        </div>
      </div>
    </section>
  );
}
