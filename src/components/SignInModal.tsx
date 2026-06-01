import { useState } from 'react';
import { X, Shield, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function SignInModal({ onClose }: { onClose: () => void }) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) { setError('Enter email and password'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setBusy(true);
    const fn = mode === 'in' ? signIn : signUp;
    const { error } = await fn(email.trim(), password);
    setBusy(false);
    if (error) { setError(error); return; }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md bg-[#0a1f44] ring-1 ring-white/10 rounded-2xl p-7 relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X size={20} /></button>
        <div className="w-12 h-12 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center mb-4"><Shield size={22} /></div>
        <h2 className="text-2xl font-black text-white">{mode === 'in' ? 'Admin sign in' : 'Create admin account'}</h2>
        <p className="text-slate-400 text-sm mb-6">Access the campaign dashboard, submissions and exports.</p>

        {error && <div className="mb-4 p-3 rounded-lg bg-red-500/20 text-red-300 text-sm">{error}</div>}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1.5">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@swaarm.com"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1.5">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 outline-none" />
          </div>
          <button type="submit" disabled={busy}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-60">
            {busy && <Loader2 size={18} className="animate-spin" />}
            {mode === 'in' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-400 mt-5">
          {mode === 'in' ? 'No admin account yet?' : 'Already have an account?'}{' '}
          <button onClick={() => { setMode(mode === 'in' ? 'up' : 'in'); setError(null); }} className="text-blue-400 font-semibold hover:text-blue-300">
            {mode === 'in' ? 'Create one' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}
