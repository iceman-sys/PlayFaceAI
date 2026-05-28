import React, { useState } from 'react';
import { Mail, ArrowRight, Check } from 'lucide-react';

const CTABanner: React.FC = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await fetch('https://famous.ai/api/crm/6a177c3447adad4194082b60/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: name || undefined,
          source: 'cta-banner',
          tags: ['demo-waitlist', 'sports-platform'],
        }),
      });
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-gradient-to-br from-cyan-500 via-blue-600 to-purple-700 py-20 relative overflow-hidden">
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-white text-4xl sm:text-5xl font-black mb-4">Ready to suit up?</h2>
        <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">Join the SWAARM® early access list and get free credits when we launch the full Advanced Armour campaign platform.</p>

        {submitted ? (
          <div className="inline-flex items-center gap-3 bg-black/30 backdrop-blur px-6 py-4 rounded-xl text-white">
            <Check className="w-6 h-6 text-emerald-300" strokeWidth={3} />
            <span className="font-semibold">You're on the list. Check your inbox.</span>
          </div>
        ) : (
          <form onSubmit={submit} className="max-w-2xl mx-auto flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name (optional)"
              className="flex-1 px-5 py-4 rounded-xl bg-white/15 backdrop-blur border border-white/30 text-white placeholder:text-white/70 focus:outline-none focus:ring-2 focus:ring-white"
            />
            <div className="flex-1 relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/70" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@team.com"
                className="w-full pl-12 pr-5 py-4 rounded-xl bg-white/15 backdrop-blur border border-white/30 text-white placeholder:text-white/70 focus:outline-none focus:ring-2 focus:ring-white"
              />
            </div>
            <button type="submit" disabled={loading} className="px-7 py-4 rounded-xl bg-black text-white font-bold hover:bg-zinc-900 transition flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? 'Joining...' : <>Join List <ArrowRight className="w-5 h-5" /></>}
            </button>
          </form>
        )}

        <p className="text-white/70 text-xs mt-4">No spam. GDPR friendly. Unsubscribe in one click.</p>
      </div>
    </section>
  );
};

export default CTABanner;
