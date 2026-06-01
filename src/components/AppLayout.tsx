import { useState } from 'react';
import { Shield, ScanFace, Sparkles, Share2, ChevronRight, LogOut, Lock } from 'lucide-react';
import { CAMPAIGN } from '@/lib/constants';
import UploadFlow from './UploadFlow';
import AdminDashboard from './AdminDashboard';
import SignInModal from './SignInModal';
import { useAuth } from '@/contexts/AuthContext';

export default function AppLayout() {
  const [view, setView] = useState<'home' | 'admin'>('home');
  const [showAuth, setShowAuth] = useState(false);
  const { user, signOut, loading } = useAuth();

  const goAdmin = () => {
    if (user) setView('admin');
    else { setShowAuth(true); }
  };

  return (
    <div className="min-h-screen bg-[#06142e] text-white selection:bg-blue-500/40">
      {showAuth && <SignInModal onClose={() => { setShowAuth(false); if (!loading) setView('admin'); }} />}

      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur bg-[#06142e]/80 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button onClick={() => setView('home')} className="flex items-center gap-2 font-black tracking-tight">
            <Shield className="text-blue-400" size={22} />
            <span>SWAARM<span className="text-blue-400"> Squad</span></span>
          </button>
          <nav className="flex items-center gap-2 sm:gap-4 text-sm">
            <a href="#how" className="hidden sm:block text-slate-300 hover:text-white">How it works</a>
            <button onClick={goAdmin} className="text-slate-300 hover:text-white">Admin</button>
            {user ? (
              <div className="flex items-center gap-3">
                <span className="hidden sm:block text-xs text-slate-400 max-w-[140px] truncate">{user.email}</span>
                <button onClick={() => { signOut(); setView('home'); }}
                  className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg font-semibold transition">
                  <LogOut size={15} /> Sign out
                </button>
              </div>
            ) : (
              <button onClick={() => setShowAuth(true)} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg font-semibold transition">Sign in</button>
            )}
            <a href="#join" className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg font-semibold transition">Join the team</a>
          </nav>
        </div>
      </header>

      {view === 'admin' ? (
        user ? (
          <AdminDashboard />
        ) : (
          <div className="max-w-md mx-auto text-center py-28 px-6">
            <div className="w-16 h-16 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center mx-auto mb-5"><Lock size={28} /></div>
            <h1 className="text-2xl font-black text-white mb-2">Admin access required</h1>
            <p className="text-slate-400 mb-6">Sign in with an admin account to view submissions and export campaign data.</p>
            <button onClick={() => setShowAuth(true)} className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-xl font-bold transition">Sign in to continue</button>
          </div>
        )
      ) : (
        <>
          {/* Hero */}
          <section className="relative">
            <div className="absolute inset-0">
              <img src={CAMPAIGN.heroUrl} alt="" className="w-full h-full object-cover opacity-30" />
              <div className="absolute inset-0 bg-gradient-to-b from-[#06142e]/60 via-[#06142e]/80 to-[#06142e]" />
            </div>
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 lg:py-24 grid lg:grid-cols-2 gap-10 items-center">
              <div>
                <span className="inline-flex items-center gap-2 bg-white/10 ring-1 ring-white/15 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-blue-300">
                  <Sparkles size={14} /> Identity-preserving AI
                </span>
                <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05]">
                  Sign with the squad in <span className="text-blue-400">SWAARM</span> Advanced Armour.
                </h1>
                <p className="mt-5 text-lg text-slate-300 max-w-lg">{CAMPAIGN.tagline}</p>
                <div className="mt-8 flex flex-wrap gap-4">
                  <a href="#join" className="bg-blue-600 hover:bg-blue-500 px-7 py-3.5 rounded-xl font-bold flex items-center gap-2 transition">
                    Create your shot <ChevronRight size={18} />
                  </a>
                  <a href="#how" className="bg-white/10 hover:bg-white/20 px-7 py-3.5 rounded-xl font-bold transition">See how it works</a>
                </div>
                <div className="mt-8 flex items-center gap-6 text-sm text-slate-400">
                  <span><b className="text-white">10k+</b> fans signed</span>
                  <span><b className="text-white">100%</b> your real face</span>
                  <span><b className="text-white">~20s</b> to generate</span>
                </div>
              </div>

              <div className="lg:pl-6"><UploadFlow /></div>
            </div>
          </section>

          {/* How it works */}
          <section id="how" className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
            <h2 className="text-3xl font-black text-center mb-3">How the magic happens</h2>
            <p className="text-center text-slate-400 mb-12 max-w-2xl mx-auto">A real compositing pipeline — not a random AI portrait. We preserve your true identity and blend you naturally into the team scene.</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: <ScanFace />, t: 'Detect & preserve', d: 'We detect your face and lock your real facial identity & proportions.' },
                { icon: <Shield />, t: 'Fit the headgear', d: 'The exact SWAARM Advanced Armour is fitted to scale with natural hair overlap.' },
                { icon: <Sparkles />, t: 'Composite the squad', d: 'You\'re inserted into the team photo with matched lighting, shadows & grain.' },
                { icon: <Share2 />, t: 'Share everywhere', d: 'Download, get it emailed, and share to socials with a ready-made caption.' },
              ].map((s, i) => (
                <div key={i} className="bg-white/5 ring-1 ring-white/10 rounded-2xl p-6 hover:bg-white/10 transition">
                  <div className="w-12 h-12 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center mb-4">{s.icon}</div>
                  <div className="text-xs font-bold text-blue-400 mb-1">STEP {i + 1}</div>
                  <h3 className="font-bold text-lg mb-1">{s.t}</h3>
                  <p className="text-slate-400 text-sm">{s.d}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Asset showcase */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid md:grid-cols-2 gap-6">
            <div className="rounded-3xl overflow-hidden ring-1 ring-white/10 relative">
              <img src={CAMPAIGN.backdropUrl} alt="Team backdrop" className="w-full h-full object-cover" />
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                <p className="font-bold text-lg">The campaign scene</p>
                <p className="text-slate-300 text-sm">You join this exact line-up.</p>
              </div>
            </div>
            <div className="rounded-3xl overflow-hidden ring-1 ring-white/10 bg-white relative flex items-center justify-center">
              <img src={CAMPAIGN.helmetUrl} alt="SWAARM helmet" className="w-2/3 object-contain" />
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                <p className="font-bold text-lg text-white">Advanced Armour by SWAARM</p>
                <p className="text-slate-300 text-sm">The exact headgear fitted to you.</p>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="border-t border-white/10 mt-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid sm:grid-cols-3 gap-8 text-sm">
              <div>
                <div className="flex items-center gap-2 font-black mb-3"><Shield className="text-blue-400" size={20} /> SWAARM Squad</div>
                <p className="text-slate-400">Premium AI compositing for sports marketing campaigns. Your face, the team's shirt, SWAARM armour.</p>
              </div>
              <div>
                <p className="font-bold mb-3">Campaign</p>
                <ul className="space-y-2 text-slate-400">
                  <li><a href="#join" className="hover:text-white">Join the team</a></li>
                  <li><a href="#how" className="hover:text-white">How it works</a></li>
                  <li><button onClick={goAdmin} className="hover:text-white">Admin dashboard</button></li>
                </ul>
              </div>
              <div>
                <p className="font-bold mb-3">Powered by</p>
                <p className="text-slate-400">Identity-preserving AI compositing · queue-based async processing · secure storage delivery.</p>
              </div>
            </div>
            <div className="text-center text-slate-500 text-xs py-6 border-t border-white/5">© 2026 SWAARM Advanced Armour. All rights reserved.</div>
          </footer>
        </>
      )}
    </div>
  );
}
