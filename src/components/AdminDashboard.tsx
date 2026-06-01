import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, Image as ImageIcon, CheckCircle, Download } from 'lucide-react';

interface Sub {
  id: string; full_name: string; email: string; socials: string | null;
  result_url: string | null; status: string; created_at: string;
}

export default function AdminDashboard() {
  const [subs, setSubs] = useState<Sub[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase.from('submissions').select('*').order('created_at', { ascending: false });
    setSubs((data as Sub[]) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const completed = subs.filter((s) => s.status === 'completed' || s.result_url).length;
  const conversion = subs.length ? Math.round((completed / subs.length) * 100) : 0;

  const exportCsv = () => {
    const rows = [['Name', 'Email', 'Socials', 'Status', 'Result', 'Date']];
    subs.forEach((s) => rows.push([s.full_name, s.email, s.socials || '', s.status, s.result_url || '', new Date(s.created_at).toLocaleString()]));
    const csv = rows.map((r) => r.map((c) => `"${(c || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'swaarm-submissions.csv';
    a.click();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black text-white">Campaign Dashboard</h1>
          <p className="text-slate-400">SWAARM x North Melbourne · live submissions</p>
        </div>
        <button onClick={exportCsv} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 py-2.5 rounded-xl">
          <Download size={16} /> Export CSV
        </button>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <Stat icon={<Users />} label="Total Signups" value={subs.length} />
        <Stat icon={<ImageIcon />} label="Images Generated" value={completed} />
        <Stat icon={<CheckCircle />} label="Conversion Rate" value={`${conversion}%`} />
      </div>

      <div className="bg-white/5 rounded-2xl ring-1 ring-white/10 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10"><h2 className="font-bold text-white">Generated Images</h2></div>
        {loading ? (
          <p className="p-6 text-slate-400">Loading…</p>
        ) : subs.length === 0 ? (
          <p className="p-6 text-slate-400">No submissions yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-slate-400 text-left">
                <tr className="border-b border-white/5">
                  <th className="px-6 py-3">Preview</th><th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Email</th><th className="px-6 py-3">Status</th><th className="px-6 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {subs.map((s) => (
                  <tr key={s.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-6 py-3">
                      {s.result_url ? <img src={s.result_url} className="w-16 h-10 object-cover rounded" /> : <span className="text-slate-600">—</span>}
                    </td>
                    <td className="px-6 py-3 text-white font-medium">{s.full_name}</td>
                    <td className="px-6 py-3 text-slate-300">{s.email}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        s.result_url ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>{s.result_url ? 'completed' : s.status}</span>
                    </td>
                    <td className="px-6 py-3 text-slate-400">{new Date(s.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="bg-white/5 rounded-2xl ring-1 ring-white/10 p-6 flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">{icon}</div>
      <div><p className="text-slate-400 text-sm">{label}</p><p className="text-2xl font-black text-white">{value}</p></div>
    </div>
  );
}
