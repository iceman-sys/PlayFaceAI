import { useState } from 'react';
import { Shield } from 'lucide-react';
import { BRAND } from '@/lib/constants';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/\S+@\S+\.\S+/.test(email)) return;
    try {
      await fetch('https://famous.ai/api/crm/6a19ad56183dcb3986199c2f/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'footer-signup', tags: ['newsletter', 'swaarm-campaign'] })
      });
    } catch { /* ignore */ }
    setDone(true); setEmail('');
  };

  return (
    <footer className="bg-black border-t border-white/10 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-5">
        <div className="grid md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center"><Shield className="w-5 h-5 text-black" /></span>
              <span className="text-lg font-black text-white">{BRAND.name}</span>
            </div>
            <p className="text-white/50 max-w-sm">{BRAND.tagline}. Premium identity-preserving sports campaign compositing for fans and brands.</p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Campaign</h4>
            <ul className="space-y-2 text-white/50 text-sm">
              <li><a href="#how" className="hover:text-white">How It Works</a></li>
              <li><a href="#start" className="hover:text-white">Get Started</a></li>
              <li><a href="#start" className="hover:text-white">{BRAND.campaign}</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4">Stay Updated</h4>
            {done ? (
              <p className="text-cyan-400 text-sm">Thanks — you're subscribed!</p>
            ) : (
              <form onSubmit={subscribe} className="space-y-2">
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@email.com" className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-white text-sm placeholder-white/30 focus:border-cyan-400 outline-none" />
                <button className="w-full bg-cyan-400 text-black font-bold py-2 rounded-lg text-sm hover:bg-cyan-300 transition">Subscribe</button>
              </form>
            )}
          </div>
        </div>
        <div className="mt-12 pt-6 border-t border-white/10 text-center text-white/30 text-sm">
          © 2026 {BRAND.name}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
