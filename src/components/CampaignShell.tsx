import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, LogOut, Lock } from 'lucide-react';
import { initCampaignTracking } from '@/lib/campaignTracking';
import { CAMPAIGN, CAMPAIGN_URLS } from '@/lib/constants';
import SignInModal from './SignInModal';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  children: React.ReactNode;
  /** Show primary CTA in header */
  showJoinCta?: boolean;
}

export default function CampaignShell({ children, showJoinCta = false }: Props) {
  const [showAuth, setShowAuth] = useState(false);
  const { user, signOut, loading } = useAuth();
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  useEffect(() => {
    initCampaignTracking();
  }, []);

  return (
    <div className="min-h-screen bg-[#06142e] text-white selection:bg-blue-500/40">
      {showAuth && (
        <SignInModal
          onClose={() => {
            setShowAuth(false);
            if (!loading && user && isAdmin) {
              /* stay on admin */
            }
          }}
        />
      )}

      <header className="sticky top-0 z-40 backdrop-blur bg-[#06142e]/90 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link to={CAMPAIGN_URLS.landing} className="flex items-center gap-2 font-black tracking-tight">
            <Shield className="text-blue-400" size={20} />
            <span className="text-sm sm:text-base">
              SWAARM<span className="text-blue-400"> in the Chorus</span>
            </span>
          </Link>
          <nav className="flex items-center gap-2 sm:gap-3 text-sm">
            {!isAdmin && showJoinCta && (
              <Link
                to={CAMPAIGN_URLS.create}
                className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg font-semibold transition text-sm"
              >
                {CAMPAIGN.ctaLabel}
              </Link>
            )}
            {isAdmin ? (
              <Link to={CAMPAIGN_URLS.landing} className="text-slate-400 hover:text-white text-xs sm:text-sm px-2">
                Campaign
              </Link>
            ) : (
              <Link to="/admin" className="text-slate-400 hover:text-white text-xs sm:text-sm px-2">
                Admin
              </Link>
            )}
            {user && (
              <button
                onClick={() => signOut()}
                className="hidden sm:flex items-center gap-1 text-slate-400 hover:text-white"
                aria-label="Sign out"
              >
                <LogOut size={14} />
              </button>
            )}
          </nav>
        </div>
      </header>

      {children}

      <footer className="border-t border-white/10 py-8 px-4">
        <div className="max-w-3xl mx-auto flex flex-col items-center gap-4 text-center">
          <img
            src={CAMPAIGN.logoUrl}
            alt="North Melbourne and SWAARM"
            className="h-14 sm:h-16 w-auto object-contain"
          />
          <p className="text-slate-400 text-xs sm:text-sm">
            2026 SWAARM Headgear · North Melbourne Football Club Partner
          </p>
          <Link
            to={CAMPAIGN_URLS.terms}
            className="text-slate-500 hover:text-white text-xs underline-offset-2 hover:underline"
          >
            Competition terms
          </Link>
        </div>
      </footer>
    </div>
  );
}

export function AdminGate({
  children,
  onSignIn,
}: {
  children: React.ReactNode;
  onSignIn: () => void;
}) {
  const { user } = useAuth();

  if (user) return <>{children}</>;

  return (
    <div className="max-w-md mx-auto text-center py-28 px-6">
      <div className="w-16 h-16 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center mx-auto mb-5">
        <Lock size={28} />
      </div>
      <h1 className="text-2xl font-black text-white mb-2">Admin access required</h1>
      <p className="text-slate-400 mb-6">Sign in to view submissions and export draw data.</p>
      <button
        onClick={onSignIn}
        className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-xl font-bold transition"
      >
        Sign in
      </button>
    </div>
  );
}
