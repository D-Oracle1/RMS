'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Building2,
  LayoutDashboard,
  Users,
  Home,
  DollarSign,
  Award,
  TrendingUp,
  MessageSquare,
  Bell,
  Settings,
  LogOut,
  ChevronLeft,
  BarChart3,
  FileText,
  Calculator,
  Crown,
  Briefcase,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface SidebarProps {
  role: 'admin' | 'realtor' | 'client';
}

const navigationConfig = {
  admin: [
    { name: 'Dashboard', href: '/dashboard/admin', icon: LayoutDashboard },
    { name: 'Realtors', href: '/dashboard/admin/realtors', icon: Users },
    { name: 'Clients', href: '/dashboard/admin/clients', icon: Briefcase },
    { name: 'Properties', href: '/dashboard/admin/properties', icon: Home },
    { name: 'Sales', href: '/dashboard/admin/sales', icon: DollarSign },
    { name: 'Commission', href: '/dashboard/admin/commission', icon: Calculator },
    { name: 'Tax Reports', href: '/dashboard/admin/tax', icon: FileText },
    { name: 'Rankings', href: '/dashboard/admin/rankings', icon: Crown },
    { name: 'Analytics', href: '/dashboard/admin/analytics', icon: BarChart3 },
    { name: 'Chat', href: '/dashboard/admin/chat', icon: MessageSquare },
    { name: 'Notifications', href: '/dashboard/admin/notifications', icon: Bell },
  ],
  realtor: [
    { name: 'Dashboard', href: '/dashboard/realtor', icon: LayoutDashboard },
    { name: 'My Sales', href: '/dashboard/realtor/sales', icon: DollarSign },
    { name: 'Properties', href: '/dashboard/realtor/properties', icon: Home },
    { name: 'Clients', href: '/dashboard/realtor/clients', icon: Users },
    { name: 'Commission', href: '/dashboard/realtor/commission', icon: Calculator },
    { name: 'Loyalty', href: '/dashboard/realtor/loyalty', icon: Award },
    { name: 'Leaderboard', href: '/dashboard/realtor/leaderboard', icon: TrendingUp },
    { name: 'Chat', href: '/dashboard/realtor/chat', icon: MessageSquare },
    { name: 'Notifications', href: '/dashboard/realtor/notifications', icon: Bell },
  ],
  client: [
    { name: 'Dashboard', href: '/dashboard/client', icon: LayoutDashboard },
    { name: 'My Properties', href: '/dashboard/client/properties', icon: Home },
    { name: 'Offers', href: '/dashboard/client/offers', icon: DollarSign },
    { name: 'Documents', href: '/dashboard/client/documents', icon: FileText },
    { name: 'Chat', href: '/dashboard/client/chat', icon: MessageSquare },
    { name: 'Notifications', href: '/dashboard/client/notifications', icon: Bell },
  ],
};

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const navigation = navigationConfig[role];

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-white dark:bg-gray-900 border-r transition-all duration-300',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            {!collapsed && (
              <span className="text-lg font-bold text-primary">RMS</span>
            )}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex"
          >
            <ChevronLeft className={cn('w-4 h-4 transition-transform', collapsed && 'rotate-180')} />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-white'
                        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                    )}
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    {!collapsed && <span>{item.name}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom section */}
        <div className="border-t p-3 space-y-2">
          <Link
            href={`/dashboard/${role}/settings`}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors'
            )}
          >
            <Settings className="w-5 h-5 shrink-0" />
            {!collapsed && <span>Settings</span>}
          </Link>

          {/* User info */}
          <div className={cn('flex items-center gap-3 p-2', collapsed && 'justify-center')}>
            <Avatar className="w-9 h-9">
              <AvatarImage src="/placeholder-avatar.jpg" />
              <AvatarFallback className="bg-primary text-white text-sm">JD</AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">John Doe</p>
                <p className="text-xs text-muted-foreground capitalize">{role}</p>
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            className={cn('w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50', collapsed && 'justify-center')}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!collapsed && <span className="ml-3">Logout</span>}
          </Button>
        </div>
      </div>
    </aside>
  );
}
