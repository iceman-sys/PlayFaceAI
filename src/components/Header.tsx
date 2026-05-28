import React, { useState } from 'react';
import { Menu, X, Zap } from 'lucide-react';

const Header: React.FC = () => {
  const [open, setOpen] = useState(false);

  const scrollTo = (id: string) => {
    setOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-black/70 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
            <Zap className="w-5 h-5 text-black" strokeWidth={3} />
          </div>
          <div className="leading-tight">
            <div className="text-white font-bold text-sm tracking-wider">SWAARM</div>
            <div className="text-cyan-400 text-[10px] font-medium tracking-widest">AI STUDIO</div>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          <button onClick={() => scrollTo('studio')} className="text-gray-300 hover:text-cyan-400 text-sm font-medium transition">Studio</button>
          <button onClick={() => scrollTo('styles')} className="text-gray-300 hover:text-cyan-400 text-sm font-medium transition">Helmets</button>
          <button onClick={() => scrollTo('backgrounds')} className="text-gray-300 hover:text-cyan-400 text-sm font-medium transition">Backgrounds</button>
          <button onClick={() => scrollTo('gallery')} className="text-gray-300 hover:text-cyan-400 text-sm font-medium transition">Gallery</button>
          <button onClick={() => scrollTo('pricing')} className="text-gray-300 hover:text-cyan-400 text-sm font-medium transition">Pricing</button>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <button onClick={() => scrollTo('studio')} className="px-5 py-2 rounded-lg bg-gradient-to-r from-cyan-400 to-blue-500 text-black text-sm font-bold hover:opacity-90 transition">
            Launch Studio
          </button>
        </div>

        <button className="md:hidden text-white" onClick={() => setOpen(!open)}>
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-black/95 border-t border-white/10 px-4 py-4 space-y-3">
          {['studio', 'styles', 'backgrounds', 'gallery', 'pricing'].map(id => (
            <button key={id} onClick={() => scrollTo(id)} className="block w-full text-left text-gray-300 hover:text-cyan-400 capitalize">
              {id}
            </button>
          ))}
          <button onClick={() => scrollTo('studio')} className="w-full px-5 py-2 rounded-lg bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-bold">
            Launch Studio
          </button>
        </div>
      )}
    </header>
  );
};

export default Header;
