import React from 'react';
import { Zap } from 'lucide-react';

interface HeaderProps {
  view: string;
  setView: (v: any) => void;
}

const Header: React.FC<HeaderProps> = ({ view, setView }) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[#0A0E27]/70 border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <button
          onClick={() => setView('landing')}
          className="flex items-center gap-2 group"
        >
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#00D9FF] to-[#39FF14] flex items-center justify-center shadow-lg shadow-[#00D9FF]/30 group-hover:scale-110 transition-transform">
            <Zap className="w-5 h-5 text-[#0A0E27]" strokeWidth={3} />
          </div>
          <span className="text-xl font-black tracking-tight text-white">
            SWAARM
          </span>
        </button>

        <nav className="hidden md:flex items-center gap-8">
          <button
            onClick={() => setView('landing')}
            className={`text-sm font-medium tracking-wide transition-colors ${
              view === 'landing' ? 'text-[#00D9FF]' : 'text-white/70 hover:text-white'
            }`}
          >
            CAMPAIGN
          </button>
          <button
            onClick={() => setView('form')}
            className="text-sm font-medium tracking-wide text-white/70 hover:text-white transition-colors"
          >
            JOIN TEAM
          </button>
          <button
            onClick={() => setView('admin')}
            className={`text-sm font-medium tracking-wide transition-colors ${
              view === 'admin' ? 'text-[#39FF14]' : 'text-white/70 hover:text-white'
            }`}
          >
            ADMIN
          </button>
        </nav>

        <button
          onClick={() => setView('form')}
          className="px-4 py-2 rounded-lg bg-white text-[#0A0E27] text-sm font-bold hover:bg-[#00D9FF] transition-all hover:scale-105"
        >
          Join Now
        </button>
      </div>
    </header>
  );
};

export default Header;
