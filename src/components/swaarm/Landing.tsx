import React from 'react';
import { ArrowRight, Camera, Sparkles, Zap, Users, Trophy, Mail, Download } from 'lucide-react';

interface LandingProps {
  setView: (v: any) => void;
}

const HERO_IMG = 'https://d64gsuwffb70l.cloudfront.net/6a16a64a9f1788dc1cb846db_1779869375387_f016f252.jpg';
const TEAM_IMG = 'https://d64gsuwffb70l.cloudfront.net/6a16a64a9f1788dc1cb846db_1779869408644_5589894f.png';

const Landing: React.FC<LandingProps> = ({ setView }) => {
  const stats = [
    { value: '24K+', label: 'Photos Generated' },
    { value: '98%', label: 'Satisfaction Rate' },
    { value: '3.2s', label: 'Avg Processing' },
    { value: '180+', label: 'Live Events' },
  ];

  const features = [
    { icon: Camera, title: 'Snap or Upload', desc: 'Use your camera or upload a selfie in seconds' },
    { icon: Sparkles, title: 'AI Helmet Fitting', desc: 'Realistic compositing places SWAARM gear on you' },
    { icon: Users, title: 'Join The Squad', desc: 'Get inserted into the official team photo' },
    { icon: Mail, title: 'Instant Delivery', desc: 'Receive your branded image via email' },
  ];

  const steps = [
    { num: '01', title: 'Enter Details', desc: 'Name, email, phone, social handle' },
    { num: '02', title: 'Capture Photo', desc: 'Webcam or upload selfie' },
    { num: '03', title: 'AI Processes', desc: 'Helmet applied & team merged' },
    { num: '04', title: 'Download & Share', desc: 'High-res branded result' },
  ];

  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0A0E27] via-[#0A0E27] to-[#001428]" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#00D9FF]/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#39FF14]/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-24 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur">
              <span className="w-2 h-2 rounded-full bg-[#39FF14] animate-pulse" />
              <span className="text-xs font-semibold tracking-widest text-white/80">LIVE CAMPAIGN · 2026</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white leading-none">
              BECOME<br />
              PART OF THE<br />
              <span className="bg-gradient-to-r from-[#00D9FF] to-[#39FF14] bg-clip-text text-transparent">
                SWAARM.
              </span>
            </h1>

            <p className="text-lg text-white/70 max-w-md">
              Step into the squad. Our AI engine fits you with official SWAARM headgear and inserts you into the team photo — in under 4 seconds.
            </p>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setView('form')}
                className="group inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#00D9FF] to-[#39FF14] text-[#0A0E27] font-bold shadow-lg shadow-[#00D9FF]/30 hover:shadow-[#00D9FF]/50 hover:scale-105 transition-all"
              >
                Join The Team
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 transition-all"
              >
                How It Works
              </button>
            </div>

            <div className="flex flex-wrap gap-6 pt-6 border-t border-white/10">
              {stats.map((s) => (
                <div key={s.label}>
                  <div className="text-2xl font-black text-white">{s.value}</div>
                  <div className="text-xs text-white/50 tracking-wide">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-[#00D9FF]/30 to-[#39FF14]/30 rounded-3xl blur-2xl" />
            <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
              <img src={HERO_IMG} alt="SWAARM helmet" className="w-full h-auto" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0E27] via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <div className="px-3 py-1.5 rounded-lg bg-black/50 backdrop-blur border border-white/10">
                  <span className="text-xs font-bold text-[#00D9FF]">AI · POWERED</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/50 backdrop-blur border border-white/10">
                  <Trophy className="w-3.5 h-3.5 text-[#39FF14]" />
                  <span className="text-xs font-bold text-white">OFFICIAL</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-3">
              UNREAL TECH. <span className="text-[#00D9FF]">REAL YOU.</span>
            </h2>
            <p className="text-white/60 max-w-2xl mx-auto">
              Powered by neural compositing trained on professional sports photography.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="group p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-[#00D9FF]/50 hover:bg-white/[0.06] transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00D9FF]/20 to-[#39FF14]/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <f.icon className="w-6 h-6 text-[#00D9FF]" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-white/60">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team preview */}
      <section className="relative py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden border border-white/10">
            <img src={TEAM_IMG} alt="SWAARM Team" className="w-full h-auto" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0E27] via-[#0A0E27]/40 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                  <div className="text-[#39FF14] text-xs font-bold tracking-widest mb-2">OFFICIAL TEAM PHOTO</div>
                  <h3 className="text-3xl md:text-5xl font-black text-white tracking-tight">THE SQUAD AWAITS.</h3>
                  <p className="text-white/70 mt-2 max-w-md">Your spot is reserved on the right. Step into the legacy.</p>
                </div>
                <button
                  onClick={() => setView('form')}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#39FF14] text-[#0A0E27] font-bold hover:bg-white transition-all"
                >
                  Claim Your Spot <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="relative py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-block px-3 py-1 rounded-full bg-[#39FF14]/10 border border-[#39FF14]/30 mb-4">
              <span className="text-xs font-bold tracking-widest text-[#39FF14]">THE PROCESS</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">
              FOUR STEPS TO GLORY.
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map((s, i) => (
              <div key={s.num} className="relative">
                <div className="p-6 rounded-2xl bg-gradient-to-br from-white/[0.04] to-transparent border border-white/10 h-full">
                  <div className="text-5xl font-black bg-gradient-to-br from-[#00D9FF] to-[#39FF14] bg-clip-text text-transparent mb-4">
                    {s.num}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{s.title}</h3>
                  <p className="text-sm text-white/60">{s.desc}</p>
                </div>
                {i < steps.length - 1 && (
                  <ArrowRight className="hidden lg:block absolute top-1/2 -right-3 w-5 h-5 text-[#00D9FF]/40 -translate-y-1/2" />
                )}
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <button
              onClick={() => setView('form')}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-[#00D9FF] to-[#39FF14] text-[#0A0E27] font-bold text-lg shadow-lg shadow-[#00D9FF]/30 hover:scale-105 transition-all"
            >
              <Zap className="w-5 h-5" />
              Start My Transformation
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-4 sm:px-6 mt-12">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00D9FF] to-[#39FF14] flex items-center justify-center">
                <Zap className="w-4 h-4 text-[#0A0E27]" strokeWidth={3} />
              </div>
              <span className="text-lg font-black text-white">SWAARM</span>
            </div>
            <p className="text-sm text-white/50">Premium AI-powered sports campaigns for the modern athlete.</p>
          </div>
          <div>
            <h4 className="text-sm font-bold text-white mb-3">CAMPAIGN</h4>
            <ul className="space-y-2 text-sm text-white/60">
              <li><button onClick={() => setView('form')} className="hover:text-[#00D9FF]">Join Now</button></li>
              <li><button onClick={() => setView('admin')} className="hover:text-[#00D9FF]">Admin Portal</button></li>
              <li><a href="#how" className="hover:text-[#00D9FF]">How It Works</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-bold text-white mb-3">COMPANY</h4>
            <ul className="space-y-2 text-sm text-white/60">
              <li>About</li><li>Press</li><li>Partners</li><li>Careers</li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-bold text-white mb-3">STAY IN THE LOOP</h4>
            <NewsletterForm />
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-white/5 flex flex-col md:flex-row justify-between gap-3 text-xs text-white/40">
          <span>© 2026 SWAARM Athletics. All rights reserved.</span>
          <span>Powered by AI Neural Compositing v3.2</span>
        </div>
      </footer>
    </div>
  );
};

const NewsletterForm: React.FC = () => {
  const [email, setEmail] = React.useState('');
  const [done, setDone] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    try {
      await fetch('https://famous.ai/api/crm/6a16a64a9f1788dc1cb846db/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'footer-signup', tags: ['newsletter', 'swaarm'] }),
      });
    } catch {}
    setDone(true);
    setEmail('');
  };

  return (
    <form onSubmit={submit} className="space-y-2">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@team.com"
        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#00D9FF]"
      />
      <button className="w-full px-3 py-2 rounded-lg bg-white/10 text-white text-sm font-semibold hover:bg-[#00D9FF] hover:text-[#0A0E27] transition-all">
        {done ? '✓ Subscribed' : 'Subscribe'}
      </button>
    </form>
  );
};

export default Landing;
