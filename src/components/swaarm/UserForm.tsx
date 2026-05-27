import React, { useState } from 'react';
import { ArrowRight, User, Mail, Phone, Instagram, Shield } from 'lucide-react';
import { FormData } from './types';

interface Props {
  onNext: (data: Omit<FormData, 'photo'>) => void;
  initial?: Partial<FormData>;
}

const UserForm: React.FC<Props> = ({ onNext, initial }) => {
  const [name, setName] = useState(initial?.name || '');
  const [email, setEmail] = useState(initial?.email || '');
  const [phone, setPhone] = useState(initial?.phone || '');
  const [social, setSocial] = useState(initial?.social || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Name is required';
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) e.email = 'Valid email required';
    if (!phone.trim() || phone.length < 7) e.phone = 'Valid phone required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    // CRM subscribe
    try {
      await fetch('https://famous.ai/api/crm/6a16a64a9f1788dc1cb846db/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name,
          source: 'swaarm-campaign',
          tags: ['campaign-2026', 'photo-experience'],
        }),
      });
    } catch {}
    onNext({ name, email, phone, social });
  };

  return (
    <div className="pt-28 pb-16 px-4 sm:px-6 min-h-screen">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00D9FF]/10 border border-[#00D9FF]/30 mb-4">
            <span className="text-xs font-bold tracking-widest text-[#00D9FF]">STEP 1 OF 3</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-3">
            DROP YOUR INTEL.
          </h1>
          <p className="text-white/60">We'll send your branded photo directly to your inbox.</p>
        </div>

        <form onSubmit={submit} className="space-y-4 p-6 md:p-8 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur">
          <Field
            icon={User}
            label="Full Name"
            value={name}
            onChange={setName}
            placeholder="Alex Morgan"
            error={errors.name}
          />
          <Field
            icon={Mail}
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="alex@team.com"
            error={errors.email}
          />
          <Field
            icon={Phone}
            label="Phone"
            type="tel"
            value={phone}
            onChange={setPhone}
            placeholder="+1 (555) 123-4567"
            error={errors.phone}
          />
          <Field
            icon={Instagram}
            label="Social Handle"
            value={social}
            onChange={setSocial}
            placeholder="@yourhandle (optional)"
            optional
          />

          <div className="flex items-center gap-2 p-3 rounded-lg bg-white/[0.02] border border-white/5">
            <Shield className="w-4 h-4 text-[#39FF14] shrink-0" />
            <p className="text-xs text-white/50">
              Your data is secured with AES-256 encryption. Used only for this campaign.
            </p>
          </div>

          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-[#00D9FF] to-[#39FF14] text-[#0A0E27] font-bold text-lg shadow-lg shadow-[#00D9FF]/30 hover:scale-[1.02] transition-all"
          >
            Continue to Photo Capture
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

const Field: React.FC<{
  icon: any;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  error?: string;
  optional?: boolean;
}> = ({ icon: Icon, label, value, onChange, placeholder, type = 'text', error, optional }) => (
  <div>
    <label className="flex items-center justify-between text-xs font-bold tracking-wide text-white/70 mb-1.5">
      <span>{label}</span>
      {optional && <span className="text-white/30 font-normal">Optional</span>}
    </label>
    <div className="relative">
      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border text-white placeholder:text-white/30 focus:outline-none transition-colors ${
          error ? 'border-red-500/50' : 'border-white/10 focus:border-[#00D9FF]'
        }`}
      />
    </div>
    {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
  </div>
);

export default UserForm;
