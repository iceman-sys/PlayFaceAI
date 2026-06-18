import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, Image as ImageIcon, CheckCircle, Download, Gift, Share2, UserPlus } from 'lucide-react';

interface Sub {
  id: string;
  full_name: string;
  email: string;
  socials?: string | null;
  result_url: string | null;
  image_with_helmet_url?: string | null;
  image_without_helmet_url?: string | null;
  campaign_source?: string | null;
  prize_section_viewed?: boolean | null;
  prize_eligible?: boolean | null;
  prize_entered_at?: string | null;
  swaarm_offer_opt_in?: boolean | null;
  terms_accepted_at?: string | null;
  referral_code?: string | null;
  referred_by_submission_id?: string | null;
  share_count?: number | null;
  status: string;
  created_at: string;
}

type Filter = 'all' | 'eligible' | 'referred';

export default function AdminDashboard() {
  const [subs, setSubs] = useState<Sub[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');

  const load = async () => {
    const { data } = await supabase.from('submissions').select('*').order('created_at', { ascending: false });
    setSubs((data as Sub[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const completed = subs.filter((s) => s.status === 'completed' || s.result_url).length;
  const conversion = subs.length ? Math.round((completed / subs.length) * 100) : 0;
  const prizeViews = subs.filter((s) => s.prize_section_viewed).length;
  const eligible = subs.filter((s) => s.prize_eligible);
  const referrals = subs.filter((s) => s.referred_by_submission_id);
  const totalShares = subs.reduce((sum, s) => sum + (s.share_count ?? 0), 0);

  const filtered =
    filter === 'eligible'
      ? subs.filter((s) => s.prize_eligible)
      : filter === 'referred'
        ? subs.filter((s) => s.referred_by_submission_id)
        : subs;

  const exportCsv = (rows: Sub[], filename: string) => {
    const data = [
      [
        'Name',
        'Email',
        'Status',
        'Source',
        'Prize Viewed',
        'Prize Eligible',
        'SWAARM Offer Opt-in',
        'Prize Entered At',
        'Terms Accepted At',
        'Referral Code',
        'Referred By ID',
        'Share Count',
        'With Helmet',
        'Without Helmet',
        'Date',
      ],
    ];
    rows.forEach((s) =>
      data.push([
        s.full_name,
        s.email,
        s.status,
        s.campaign_source || '',
        s.prize_section_viewed ? 'yes' : 'no',
        s.prize_eligible ? 'yes' : 'no',
        s.swaarm_offer_opt_in ? 'yes' : 'no',
        s.prize_entered_at || '',
        s.terms_accepted_at || '',
        s.referral_code || '',
        s.referred_by_submission_id || '',
        String(s.share_count ?? 0),
        s.image_with_helmet_url || s.result_url || '',
        s.image_without_helmet_url || '',
        new Date(s.created_at).toLocaleString(),
      ]),
    );
    const csv = data.map((r) => r.map((c) => `"${(c || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black text-white">Campaign Dashboard</h1>
          <p className="text-slate-400">SWAARM in the Chorus · funnel & prize draw data</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => exportCsv(subs, 'swaarm-submissions.csv')}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-4 py-2.5 rounded-xl"
          >
            <Download size={16} /> All submissions
          </button>
          <button
            onClick={() => exportCsv(eligible, 'swaarm-prize-draw.csv')}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2.5 rounded-xl"
          >
            <Gift size={16} /> Prize draw export
          </button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <Stat icon={<Users />} label="Total signups" value={subs.length} />
        <Stat icon={<ImageIcon />} label="Images generated" value={completed} />
        <Stat icon={<CheckCircle />} label="Conversion rate" value={`${conversion}%`} />
        <Stat icon={<Gift />} label="Saw prize section" value={prizeViews} />
        <Stat icon={<Gift />} label="Prize eligible" value={eligible.length} />
        <Stat icon={<Share2 />} label="Total shares" value={totalShares} />
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {(
          [
            ['all', `All (${subs.length})`],
            ['eligible', `Eligible (${eligible.length})`],
            ['referred', `Referred (${referrals.length})`],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              filter === key ? 'bg-blue-600 text-white' : 'bg-white/10 text-slate-300 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="bg-white/5 rounded-2xl ring-1 ring-white/10 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="font-bold text-white">Submissions</h2>
          {referrals.length > 0 && (
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <UserPlus size={14} /> {referrals.length} viral referrals
            </span>
          )}
        </div>
        {loading ? (
          <p className="p-6 text-slate-400">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="p-6 text-slate-400">No submissions yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-slate-400 text-left">
                <tr className="border-b border-white/5">
                  <th className="px-4 py-3">Preview</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Eligible</th>
                  <th className="px-4 py-3">Referral</th>
                  <th className="px-4 py-3">Shares</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  const thumb = s.image_with_helmet_url || s.result_url;
                  return (
                    <tr key={s.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="px-4 py-3">
                        {thumb ? (
                          <img src={thumb} alt="" className="w-16 h-10 object-cover rounded" />
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-white font-medium">{s.full_name}</td>
                      <td className="px-4 py-3 text-slate-300">{s.email}</td>
                      <td className="px-4 py-3 text-slate-400">{s.campaign_source || '—'}</td>
                      <td className="px-4 py-3">
                        {s.prize_eligible ? (
                          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400">
                            yes
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-400 font-mono text-xs">
                        {s.referral_code || '—'}
                        {s.referred_by_submission_id && (
                          <span className="block text-[10px] text-blue-400">via referral</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-400">{s.share_count ?? 0}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            thumb ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                          }`}
                        >
                          {thumb ? 'completed' : s.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {new Date(s.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
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
    <div className="bg-white/5 rounded-2xl ring-1 ring-white/10 p-5 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-slate-400 text-xs">{label}</p>
        <p className="text-xl font-black text-white">{value}</p>
      </div>
    </div>
  );
}
