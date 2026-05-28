import React from 'react';
import { Zap, Twitter, Instagram, Youtube, Linkedin } from 'lucide-react';

const COLS = [
  { title: 'Platform', links: ['Studio', 'Helmets', 'Backgrounds', 'API Access', 'Pricing'] },
  { title: 'Use Cases', links: ['Brand Campaigns', 'Sponsorship Activations', 'Team Posters', 'Fan Engagement', 'Esports Promo'] },
  { title: 'Company', links: ['About SWAARM®', 'Careers', 'Press Kit', 'Partners', 'Contact'] },
  { title: 'Resources', links: ['Documentation', 'Tutorials', 'Brand Guidelines', 'Privacy Policy', 'Terms of Service'] },
];

const Footer: React.FC = () => {
  return (
    <footer className="bg-black border-t border-white/10 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
                <Zap className="w-5 h-5 text-black" strokeWidth={3} />
              </div>
              <div className="leading-tight">
                <div className="text-white font-bold text-sm tracking-wider">SWAARM</div>
                <div className="text-cyan-400 text-[10px] font-medium tracking-widest">AI STUDIO</div>
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-5 max-w-xs">Advanced Armour by SWAARM® — AI-powered sports photo transformation for athletes, brands, and teams.</p>
            <div className="flex gap-3">
              {[Twitter, Instagram, Youtube, Linkedin].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 rounded-lg bg-white/5 hover:bg-cyan-400/20 flex items-center justify-center text-gray-400 hover:text-cyan-400 transition">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {COLS.map(col => (
            <div key={col.title}>
              <h4 className="text-white font-bold text-sm mb-4">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map(link => (
                  <li key={link}>
                    <a href="#" className="text-gray-400 hover:text-cyan-400 text-sm transition">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-xs">© 2026 SWAARM® Advanced Armour. All rights reserved.</p>
          <div className="flex gap-6 text-xs text-gray-500">
            <a href="#" className="hover:text-cyan-400">Privacy</a>
            <a href="#" className="hover:text-cyan-400">Terms</a>
            <a href="#" className="hover:text-cyan-400">Cookies</a>
            <a href="#" className="hover:text-cyan-400">GDPR</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
