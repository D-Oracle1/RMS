'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, getUser } from '@/lib/auth-storage';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const token = getToken();
    const user = getUser();

    if (!token || !user) {
      router.replace('/auth/login');
      return;
    }

    // Verify user is accessing the correct role dashboard
    const role = user.role?.toLowerCase();
    const path = window.location.pathname;

    const rolePrefix =
      role === 'super_admin' || role === 'admin'
        ? '/dashboard/admin'
        : role === 'realtor'
          ? '/dashboard/realtor'
          : role === 'staff'
            ? '/dashboard/staff'
            : '/dashboard/client';

    if (!path.startsWith(rolePrefix)) {
      router.replace(rolePrefix);
      return;
    }

    setChecked(true);
  }, [router]);

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
