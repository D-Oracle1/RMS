'use client';

import dynamic from 'next/dynamic';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { useNotifications } from '@/contexts/notification-context';

const CelebrationModal = dynamic(
  () => import('@/components/celebration-modal').then((m) => ({ default: m.CelebrationModal })),
  { ssr: false },
);
const SaleApprovalModal = dynamic(
  () => import('@/components/sale-approval-modal').then((m) => ({ default: m.SaleApprovalModal })),
  { ssr: false },
);

function AdminExtras() {
  const { pendingSaleApproval, showApprovalModal, dismissApprovalModal } = useNotifications();
  return (
    <>
      <CelebrationModal />
      <SaleApprovalModal
        open={showApprovalModal}
        onClose={dismissApprovalModal}
        saleData={pendingSaleApproval}
      />
    </>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell role="admin" extras={<AdminExtras />}>
      {children}
    </DashboardShell>
  );
}
