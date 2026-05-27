import React, { useMemo, useState } from 'react';
import { Search, Download, Mail, Users, TrendingUp, Image as ImageIcon, X, ToggleLeft, ToggleRight, Activity } from 'lucide-react';
import { Submission } from './types';

interface Props {
  submissions: Submission[];
}

const MOCK_NAMES = [
  'Alex Morgan', 'Jordan Reyes', 'Casey Lin', 'Sam Patel', 'Riley Chen',
  'Morgan Diaz', 'Drew Williams', 'Taylor Brooks', 'Quinn Foster', 'Avery Hill',
  'Jamie Cole', 'Robin Park', 'Skylar Kim', 'Reese Adams', 'Parker Lee',
  'Hayden Scott', 'Phoenix Ray', 'Sage Turner', 'Rowan Bell', 'Finley Cruz',
  'Cameron Hayes', 'Dakota James', 'Emerson Vale', 'Harper Quinn', 'Indigo Rose',
  'Kai Mendez', 'Lennon Wood', 'Marlowe Pace', 'Nico Tran', 'Oakley Briggs',
  'Peyton Shaw', 'Quincy Vaughn', 'River Ash', 'Sloane Webb', 'Tatum Reid',
  'Uma Sterling', 'Vesper Knox', 'Wren Holloway', 'Xander Pierce', 'Yael Storm',
  'Zion Bailey', 'Briar Cassidy', 'Cyrus Drake', 'Delphi Ember', 'Echo Frost',
  'Forrest Gale', 'Grey Heron', 'Hollis Ivey', 'Iris Jett', 'Juno Lark',
];

const HELMETS = ['Stealth', 'Apex', 'Velocity', 'Titan'];
const TEAM_IMG = 'https://d64gsuwffb70l.cloudfront.net/6a16a64a9f1788dc1cb846db_1779869408644_5589894f.png';

function generateMockSubmissions(): Submission[] {
  const now = Date.now();
  return MOCK_NAMES.map((name, i) => {
    const first = name.split(' ')[0].toLowerCase();
    const last = name.split(' ')[1].toLowerCase();
    return {
      id: `SWM-${(1000 + i).toString()}`,
      name,
      email: `${first}.${last}@example.com`,
      phone: `+1 (555) ${String(100 + i).padStart(3, '0')}-${String(2000 + i * 7).slice(-4)}`,
      social: `@${first}${last}`,
      photo: TEAM_IMG,
      finalImage: TEAM_IMG,
      createdAt: new Date(now - i * 1000 * 60 * 47).toISOString(),
      helmetVariant: HELMETS[i % HELMETS.length],
      status: i < 3 ? 'processing' : 'completed',
      emailSent: i % 7 !== 0,
    };
  });
}

const MOCK = generateMockSubmissions();

const Admin: React.FC<Props> = ({ submissions }) => {
  const all = useMemo(() => [...submissions, ...MOCK], [submissions]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'completed' | 'processing'>('all');
  const [campaignActive, setCampaignActive] = useState(true);
  const [selectedImage, setSelectedImage] = useState<Submission | null>(null);
  const [activeHelmet, setActiveHelmet] = useState('Stealth');

  const filtered = all.filter((s) => {
    if (filter !== 'all' && s.status !== filter) return false;
    if (search && !`${s.name} ${s.email} ${s.id}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const stats = [
    { icon: Users, label: 'Total Submissions', value: all.length, accent: '#00D9FF' },
    { icon: TrendingUp, label: 'Conversion Rate', value: '87.3%', accent: '#39FF14' },
    { icon: Mail, label: 'Emails Delivered', value: all.filter((s) => s.emailSent).length, accent: '#FFB800' },
    { icon: Activity, label: 'Avg Processing', value: '3.2s', accent: '#FF4D8D' },
  ];

  const exportCSV = () => {
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Social', 'Helmet', 'Status', 'Email Sent', 'Created'];
    const rows = filtered.map((s) => [
      s.id, s.name, s.email, s.phone, s.social, s.helmetVariant, s.status, s.emailSent, s.createdAt
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `swaarm-submissions-${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="pt-24 pb-16 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-xs font-bold tracking-widest text-[#00D9FF] mb-2">ADMIN DASHBOARD</div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">CAMPAIGN CONTROL.</h1>
            <p className="text-white/60 mt-1">Live monitoring of the SWAARM 2026 photo campaign.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportCSV}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-semibold hover:bg-white/10 transition-all"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
            <button
              onClick={() => setCampaignActive((a) => !a)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                campaignActive
                  ? 'bg-[#39FF14]/10 border border-[#39FF14]/30 text-[#39FF14]'
                  : 'bg-white/5 border border-white/10 text-white/60'
              }`}
            >
              {campaignActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
              {campaignActive ? 'LIVE' : 'PAUSED'}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((s) => (
            <div key={s.label} className="p-5 rounded-2xl bg-white/[0.03] border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${s.accent}20` }}
                >
                  <s.icon className="w-5 h-5" style={{ color: s.accent }} />
                </div>
                <span className="text-xs text-[#39FF14] font-bold">↑ 12%</span>
              </div>
              <div className="text-2xl font-black text-white">{s.value}</div>
              <div className="text-xs text-white/50 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Campaign settings */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="md:col-span-2 p-5 rounded-2xl bg-white/[0.03] border border-white/10">
            <h3 className="text-sm font-bold text-white mb-3">HELMET VARIANT</h3>
            <div className="grid grid-cols-4 gap-2">
              {HELMETS.map((h) => (
                <button
                  key={h}
                  onClick={() => setActiveHelmet(h)}
                  className={`p-3 rounded-lg text-xs font-bold transition-all ${
                    activeHelmet === h
                      ? 'bg-[#00D9FF] text-[#0A0E27]'
                      : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10'
                  }`}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>
          <div className="p-5 rounded-2xl bg-gradient-to-br from-[#00D9FF]/10 to-[#39FF14]/5 border border-[#00D9FF]/20">
            <h3 className="text-sm font-bold text-white mb-2">CAMPAIGN STATUS</h3>
            <div className="text-2xl font-black text-white">SWAARM 2026</div>
            <div className="text-xs text-white/60 mt-1">Live since 14 days · Ends in 23 days</div>
          </div>
        </div>

        {/* Submissions */}
        <div className="rounded-2xl bg-white/[0.03] border border-white/10 overflow-hidden">
          <div className="p-5 border-b border-white/10 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">User Submissions</h3>
              <p className="text-xs text-white/50">{filtered.length} of {all.length} entries</p>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name, email, ID..."
                  className="pl-9 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#00D9FF] w-full sm:w-64"
                />
              </div>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none"
              >
                <option value="all">All</option>
                <option value="completed">Completed</option>
                <option value="processing">Processing</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/[0.02] border-b border-white/5">
                <tr className="text-left text-xs font-bold tracking-wide text-white/50">
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3 hidden md:table-cell">Email</th>
                  <th className="px-4 py-3 hidden lg:table-cell">Phone</th>
                  <th className="px-4 py-3 hidden lg:table-cell">Social</th>
                  <th className="px-4 py-3">Helmet</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Photo</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 30).map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-white/50">{s.id}</td>
                    <td className="px-4 py-3 text-white font-medium">{s.name}</td>
                    <td className="px-4 py-3 text-white/60 hidden md:table-cell">{s.email}</td>
                    <td className="px-4 py-3 text-white/60 hidden lg:table-cell">{s.phone}</td>
                    <td className="px-4 py-3 text-[#00D9FF] hidden lg:table-cell">{s.social}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-md bg-white/5 text-xs text-white/80">
                        {s.helmetVariant}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-md text-xs font-bold ${
                          s.status === 'completed'
                            ? 'bg-[#39FF14]/10 text-[#39FF14]'
                            : 'bg-[#FFB800]/10 text-[#FFB800]'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedImage(s)}
                        className="w-10 h-10 rounded-lg overflow-hidden border border-white/10 hover:border-[#00D9FF] transition-colors"
                      >
                        <img src={s.finalImage} alt={s.name} className="w-full h-full object-cover" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Gallery */}
        <div className="mt-8">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-[#00D9FF]" /> Recent Photo Gallery
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
            {all.slice(0, 16).map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedImage(s)}
                className="aspect-square rounded-lg overflow-hidden border border-white/10 hover:border-[#00D9FF] hover:scale-105 transition-all"
              >
                <img src={s.finalImage} alt={s.name} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Lightbox */}
        {selectedImage && (
          <div
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20">
              <X className="w-5 h-5" />
            </button>
            <div
              onClick={(e) => e.stopPropagation()}
              className="max-w-3xl w-full bg-[#0A0E27] rounded-2xl overflow-hidden border border-white/10"
            >
              <img src={selectedImage.finalImage} alt={selectedImage.name} className="w-full h-auto" />
              <div className="p-5">
                <div className="font-bold text-white text-lg">{selectedImage.name}</div>
                <div className="text-sm text-white/60">{selectedImage.email} · {selectedImage.social}</div>
                <div className="text-xs text-white/40 mt-1">ID: {selectedImage.id} · Helmet: {selectedImage.helmetVariant}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
