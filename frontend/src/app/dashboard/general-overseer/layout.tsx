'use client';

import { DashboardShell } from '@/components/layout/dashboard-shell';

export default function GeneralOverseerLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell role="general-overseer">{children}</DashboardShell>;
}
