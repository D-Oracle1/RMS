'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { CelebrationModal } from '@/components/celebration-modal';
import { cn } from '@/lib/utils';

export default function RealtorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar
        role="realtor"
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
      <div className={cn('transition-all duration-300', 'md:ml-64')}>
        <Header title="Realtor Dashboard" onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)} />
        <CelebrationModal />
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
