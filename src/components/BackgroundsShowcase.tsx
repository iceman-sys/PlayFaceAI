import React from 'react';

const BGS = [
  { name: 'Football Stadium', img: 'https://d64gsuwffb70l.cloudfront.net/6a177c3447adad4194082b60_1779924133843_37718392.png', tag: 'Stadium' },
  { name: 'Basketball Arena', img: 'https://d64gsuwffb70l.cloudfront.net/6a177c3447adad4194082b60_1779924149965_333acb03.jpg', tag: 'Arena' },
  { name: 'Racing Track', img: 'https://d64gsuwffb70l.cloudfront.net/6a177c3447adad4194082b60_1779924175463_880cc051.png', tag: 'Motorsport' },
  { name: 'Esports Stage', img: 'https://d64gsuwffb70l.cloudfront.net/6a177c3447adad4194082b60_1779924191408_35bdcf51.jpg', tag: 'Gaming' },
  { name: 'Media Wall', img: 'https://d64gsuwffb70l.cloudfront.net/6a177c3447adad4194082b60_1779924206808_9304e595.jpg', tag: 'Press' },
  { name: 'Locker Room', img: 'https://d64gsuwffb70l.cloudfront.net/6a177c3447adad4194082b60_1779924227749_1f8aea53.png', tag: 'Backstage' },
  { name: 'Skate Park', img: 'https://d64gsuwffb70l.cloudfront.net/6a177c3447adad4194082b60_1779924257447_dbcf33e9.png', tag: 'Action' },
  { name: 'Hockey Rink', img: 'https://d64gsuwffb70l.cloudfront.net/6a177c3447adad4194082b60_1779924274843_11c4d264.jpg', tag: 'Ice' },
];

const BackgroundsShowcase: React.FC = () => {
  return (
    <section id="backgrounds" className="bg-zinc-950 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="text-cyan-400 text-xs font-bold tracking-widest mb-3">BACKDROP LIBRARY</div>
          <h2 className="text-white text-4xl sm:text-5xl font-black mb-4">Drop yourself anywhere</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">12+ stadium-grade environments, all lit and rendered to blend with any subject. New backdrops every month.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {BGS.map(bg => (
            <div key={bg.name} className="group relative aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer">
              <img src={bg.img} alt={bg.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur text-cyan-400 text-[10px] font-bold tracking-widest px-2 py-1 rounded">
                {bg.tag.toUpperCase()}
              </div>
              <div className="absolute bottom-4 left-4 right-4">
                <div className="text-white font-bold">{bg.name}</div>
                <div className="text-cyan-400 text-xs opacity-0 group-hover:opacity-100 transition mt-1">Use this backdrop →</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BackgroundsShowcase;
