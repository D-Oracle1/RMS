'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { useNotifications } from '@/contexts/notification-context';
import { cn } from '@/lib/utils';

const CelebrationModal = dynamic(() => import('@/components/celebration-modal').then(m => ({ default: m.CelebrationModal })), { ssr: false });
const SaleApprovalModal = dynamic(() => import('@/components/sale-approval-modal').then(m => ({ default: m.SaleApprovalModal })), { ssr: false });

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { pendingSaleApproval, showApprovalModal, dismissApprovalModal } = useNotifications();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar
        role="admin"
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
      <div className={cn('transition-all duration-300', 'md:ml-64')}>
        <Header onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)} />
        <CelebrationModal />
        <SaleApprovalModal
          open={showApprovalModal}
          onClose={dismissApprovalModal}
          saleData={pendingSaleApproval}
        />
        <main className="p-3 md:p-6">{children}</main>
      </div>
    </div>
  );
}
