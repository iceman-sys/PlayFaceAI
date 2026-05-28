import React, { useState } from 'react';

const ITEMS = [
  { src: 'https://d64gsuwffb70l.cloudfront.net/6a177c3447adad4194082b60_1779924295115_0dc2c5d1.png', cat: 'Rugby', name: 'Marcus T.' },
  { src: 'https://d64gsuwffb70l.cloudfront.net/6a177c3447adad4194082b60_1779924312733_174bc977.jpg', cat: 'Basketball', name: 'Jade R.' },
  { src: 'https://d64gsuwffb70l.cloudfront.net/6a177c3447adad4194082b60_1779924333072_71cc19a1.png', cat: 'Racing', name: 'Lukas M.' },
  { src: 'https://d64gsuwffb70l.cloudfront.net/6a177c3447adad4194082b60_1779924348573_cfb69e99.jpg', cat: 'Esports', name: 'Kai N.' },
  { src: 'https://d64gsuwffb70l.cloudfront.net/6a177c3447adad4194082b60_1779924389814_c3022cf1.jpg', cat: 'Youth', name: 'Theo J.' },
  { src: 'https://d64gsuwffb70l.cloudfront.net/6a177c3447adad4194082b60_1779924405926_3bfb240c.jpg', cat: 'Cycling', name: 'Elena V.' },
];

const CATS = ['All', 'Rugby', 'Basketball', 'Racing', 'Esports', 'Cycling', 'Youth'];

const Gallery: React.FC = () => {
  const [cat, setCat] = useState('All');
  const filtered = cat === 'All' ? ITEMS : ITEMS.filter(i => i.cat === cat);

  return (
    <section id="gallery" className="bg-zinc-950 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-10 gap-6">
          <div>
            <div className="text-cyan-400 text-xs font-bold tracking-widest mb-3">REAL OUTPUTS</div>
            <h2 className="text-white text-4xl sm:text-5xl font-black">Campaign-ready in seconds</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {CATS.map(c => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition ${cat === c ? 'bg-cyan-400 text-black' : 'bg-white/5 text-gray-300 hover:bg-white/10'}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {filtered.map((item, i) => (
            <div key={i} className="group relative aspect-[4/5] rounded-xl overflow-hidden bg-zinc-900 cursor-pointer">
              <img src={item.src} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <div className="text-cyan-400 text-[10px] font-bold tracking-widest mb-0.5">{item.cat.toUpperCase()}</div>
                <div className="text-white text-sm font-bold">{item.name}</div>
              </div>
              <div className="absolute top-2 right-2 bg-black/60 backdrop-blur text-cyan-400 text-[10px] font-bold px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition">
                AI GENERATED
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Gallery;
