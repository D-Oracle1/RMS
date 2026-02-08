'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { CelebrationModal } from '@/components/celebration-modal';
import { SaleApprovalModal } from '@/components/sale-approval-modal';
import { useNotifications } from '@/contexts/notification-context';
import { cn } from '@/lib/utils';

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
        <Header title="Admin Dashboard" onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)} />
        <CelebrationModal />
        <SaleApprovalModal
          open={showApprovalModal}
          onClose={dismissApprovalModal}
          saleData={pendingSaleApproval}
        />
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
