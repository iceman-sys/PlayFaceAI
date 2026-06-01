import { Shield, LayoutDashboard } from 'lucide-react';
import { BRAND } from '@/lib/constants';

interface Props {
  onAdmin: () => void;
  onHome: () => void;
  isAdmin: boolean;
}

export default function Header({ onAdmin, onHome, isAdmin }: Props) {
  return (
    <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-md bg-black/40 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between">
        <button onClick={onHome} className="flex items-center gap-2 group">
          <span className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
            <Shield className="w-5 h-5 text-black" />
          </span>
          <span className="text-xl font-black tracking-tight text-white">{BRAND.name}</span>
          <span className="hidden sm:inline text-xs font-medium text-cyan-400 border border-cyan-400/40 rounded px-2 py-0.5 ml-1">
            CAMPAIGN
          </span>
        </button>
        <nav className="flex items-center gap-3">
          {!isAdmin && (
            <a href="#start" className="hidden sm:inline text-sm font-semibold text-white/80 hover:text-white transition">
              Get Started
            </a>
          )}
          <button
            onClick={isAdmin ? onHome : onAdmin}
            className="flex items-center gap-2 text-sm font-semibold text-white bg-white/10 hover:bg-white/20 transition rounded-lg px-3 py-2"
          >
            <LayoutDashboard className="w-4 h-4" />
            {isAdmin ? 'Back to Campaign' : 'Admin'}
          </button>
        </nav>
      </div>
    </header>
  );
}
