import { useState } from 'react';
import CampaignShell, { AdminGate } from '@/components/CampaignShell';
import AdminDashboard from '@/components/AdminDashboard';
import SignInModal from '@/components/SignInModal';

export default function AdminPage() {
  const [showAuth, setShowAuth] = useState(false);

  return (
    <CampaignShell showJoinCta={false}>
      {showAuth && <SignInModal onClose={() => setShowAuth(false)} />}
      <AdminGate onSignIn={() => setShowAuth(true)}>
        <AdminDashboard />
      </AdminGate>
    </CampaignShell>
  );
}
