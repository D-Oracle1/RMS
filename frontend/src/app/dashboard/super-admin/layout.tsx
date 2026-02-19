'use client';

import { DashboardShell } from '@/components/layout/dashboard-shell';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell role="super-admin">{children}</DashboardShell>;
}
