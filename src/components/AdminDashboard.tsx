import { useEffect, useState } from 'react';
import { Users, Image as ImageIcon, Share2, Download, TrendingUp, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface Gen {
  id: string; full_name: string; email: string; social_handle: string;
  result_url: string; status: string; created_at: string;
}

export default function AdminDashboard({ onSignOut }: { onSignOut: () => void }) {
  const { signOut, session } = useAuth();
  const [rows, setRows] = useState<Gen[]>([]);
  const [loading, setLoading] = useState(true);

  const handleSignOut = async () => { await signOut(); onSignOut(); };


  useEffect(() => {
    supabase.from('generations').select('*').order('created_at', { ascending: false }).limit(200)
      .then(({ data }) => { setRows((data as Gen[]) || []); setLoading(false); });
  }, []);

  const completed = rows.filter((r) => r.status === 'completed').length;
  const conversion = rows.length ? Math.round((completed / rows.length) * 100) : 0;

  const exportCsv = () => {
    const header = 'Name,Email,Social,Status,Date,ResultUrl\n';
    const body = rows.map((r) => `"${r.full_name}","${r.email}","${r.social_handle || ''}","${r.status}","${new Date(r.created_at).toLocaleString()}","${r.result_url || ''}"`).join('\n');
    const blob = new Blob([header + body], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'swaarm-leads.csv'; a.click();
  };

  const stats = [
    { label: 'Total Submissions', value: rows.length, icon: Users },
    { label: 'Completed Shots', value: completed, icon: ImageIcon },
    { label: 'Conversion Rate', value: `${conversion}%`, icon: TrendingUp },
    { label: 'With Socials', value: rows.filter((r) => r.social_handle).length, icon: Share2 }
  ];

  return (
    <div className="min-h-screen bg-[#08090d] pt-24 pb-16 px-5">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-black text-white">Admin Dashboard</h1>
            <p className="text-white/50">SWAARM Rugby 2026 · {session?.user?.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={exportCsv} className="flex items-center gap-2 bg-cyan-400 text-black font-bold px-5 py-3 rounded-xl hover:bg-cyan-300 transition">
              <Download className="w-4 h-4" /> Export CSV
            </button>
            <button onClick={handleSignOut} className="flex items-center gap-2 border border-white/15 text-white font-semibold px-5 py-3 rounded-xl hover:bg-white/10 transition">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>


        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((s, i) => (
            <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <s.icon className="w-7 h-7 text-cyan-400 mb-3" />
              <p className="text-3xl font-black text-white">{s.value}</p>
              <p className="text-white/50 text-sm">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10"><h2 className="font-bold text-white">Generated Campaign Images</h2></div>
          {loading ? (
            <p className="p-8 text-white/40 text-center">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="p-8 text-white/40 text-center">No submissions yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-white/40 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-3 font-medium">Preview</th>
                    <th className="px-6 py-3 font-medium">Name</th>
                    <th className="px-6 py-3 font-medium">Email</th>
                    <th className="px-6 py-3 font-medium">Social</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="px-6 py-3">
                        {r.result_url ? <img src={r.result_url} className="w-12 h-12 rounded object-cover" alt="" /> : <span className="text-white/30">—</span>}
                      </td>
                      <td className="px-6 py-3 text-white">{r.full_name}</td>
                      <td className="px-6 py-3 text-white/60">{r.email}</td>
                      <td className="px-6 py-3 text-white/60">{r.social_handle || '—'}</td>
                      <td className="px-6 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${r.status === 'completed' ? 'bg-cyan-400/15 text-cyan-300' : 'bg-yellow-400/15 text-yellow-300'}`}>{r.status}</span>
                      </td>
                      <td className="px-6 py-3 text-white/40">{new Date(r.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
