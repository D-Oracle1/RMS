'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { cn } from '@/lib/utils';

const CelebrationModal = dynamic(() => import('@/components/celebration-modal').then(m => ({ default: m.CelebrationModal })), { ssr: false });

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar
        role="client"
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
      <div className={cn('transition-all duration-300', 'md:ml-64')}>
        <Header onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)} />
        <CelebrationModal />
        <main className="p-3 md:p-6">{children}</main>
      </div>
    </div>
  );
}
