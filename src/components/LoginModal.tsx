import { useState } from 'react';
import { X, Lock, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function LoginModal({ open, onClose, onSuccess }: Props) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(''); setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);
    if (error) { setErr('Invalid credentials. Access is restricted to authorized staff.'); return; }
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm px-5" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0d1018] p-7" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center"><Lock className="w-4 h-4 text-black" /></span>
            <h3 className="text-xl font-black text-white">Staff Login</h3>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-white/50 text-sm mb-6">Admin dashboard access is restricted to authorized staff.</p>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-white/80">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder="admin@swaarm.com" className="mt-1.5 w-full bg-black/40 border border-white/15 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:border-cyan-400 outline-none" />
          </div>
          <div>
            <label className="text-sm font-semibold text-white/80">Password</label>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required placeholder="••••••••" className="mt-1.5 w-full bg-black/40 border border-white/15 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:border-cyan-400 outline-none" />
          </div>
          {err && <p className="text-red-400 text-sm">{err}</p>}
          <button disabled={loading} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-400 to-blue-600 text-black font-bold py-3 rounded-xl disabled:opacity-50 hover:scale-[1.02] transition">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
