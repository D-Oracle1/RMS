'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
  X,
  Clock,
  CalendarDays,
  CheckSquare,
  UserCog,
  Building,
  ClipboardList,
  Wallet,
  Star,
  Hash,
  FolderOpen,
  FileEdit,
  ImageIcon,
  Mail,
  Headphones,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getImageUrl } from '@/lib/api';
import { getUser, clearAuth } from '@/lib/auth-storage';
import { useBranding, getShortName } from '@/hooks/use-branding';

interface SidebarProps {
  role: 'admin' | 'realtor' | 'client' | 'staff' | 'super-admin' | 'general-overseer';
  isOpen?: boolean;
  onClose?: () => void;
}

const navigationConfig: Record<string, { name: string; href: string; icon: any }[]> = {
  'super-admin': [
    { name: 'Dashboard', href: '/dashboard/super-admin', icon: LayoutDashboard },
    { name: 'Companies', href: '/dashboard/super-admin/companies', icon: Building },
    { name: 'Analytics', href: '/dashboard/super-admin/analytics', icon: BarChart3 },
  ],
  'general-overseer': [
    { name: 'Dashboard', href: '/dashboard/general-overseer', icon: LayoutDashboard },
    { name: 'Users', href: '/dashboard/general-overseer/users', icon: Users },
    { name: 'Realtors', href: '/dashboard/general-overseer/realtors', icon: Users },
    { name: 'Clients', href: '/dashboard/general-overseer/clients', icon: Briefcase },
    { name: 'Properties', href: '/dashboard/general-overseer/properties', icon: Home },
    { name: 'Staff', href: '/dashboard/general-overseer/staff', icon: UserCog },
    { name: 'Leave Approvals', href: '/dashboard/general-overseer/leave', icon: CalendarDays },
    { name: 'HR', href: '/dashboard/general-overseer/hr', icon: ClipboardList },
    { name: 'Analytics', href: '/dashboard/general-overseer/analytics', icon: BarChart3 },
    { name: 'Audit Logs', href: '/dashboard/general-overseer/audit', icon: FileText },
    { name: 'Chat', href: '/dashboard/general-overseer/chat', icon: MessageSquare },
    { name: 'Notifications', href: '/dashboard/general-overseer/notifications', icon: Bell },
  ],
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
    { name: 'Staff', href: '/dashboard/admin/staff', icon: UserCog },
    { name: 'Departments', href: '/dashboard/admin/departments', icon: Building },
    { name: 'HR', href: '/dashboard/admin/hr', icon: ClipboardList },
    { name: 'CMS', href: '/dashboard/admin/cms', icon: FileEdit },
    { name: 'Gallery', href: '/dashboard/admin/gallery', icon: ImageIcon },
    { name: 'Audit Logs', href: '/dashboard/admin/audit', icon: FileText },
    { name: 'Channels', href: '/dashboard/admin/channels', icon: Hash },
    { name: 'Chat', href: '/dashboard/admin/chat', icon: MessageSquare },
    { name: 'Support Chats', href: '/dashboard/admin/support', icon: Headphones },
    { name: 'Newsletter', href: '/dashboard/admin/newsletter', icon: Mail },
    { name: 'Notifications', href: '/dashboard/admin/notifications', icon: Bell },
  ],
  realtor: [
    { name: 'Dashboard', href: '/dashboard/realtor', icon: LayoutDashboard },
    { name: 'My Sales', href: '/dashboard/realtor/sales', icon: DollarSign },
    { name: 'Properties', href: '/dashboard/realtor/properties', icon: Home },
    { name: 'Clients', href: '/dashboard/realtor/clients', icon: Users },
    { name: 'Commission', href: '/dashboard/realtor/commission', icon: Calculator },
    { name: 'Loyalty', href: '/dashboard/realtor/loyalty', icon: Award },
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
  staff: [
    { name: 'Dashboard', href: '/dashboard/staff', icon: LayoutDashboard },
    { name: 'My Tasks', href: '/dashboard/staff/tasks', icon: CheckSquare },
    { name: 'Attendance', href: '/dashboard/staff/attendance', icon: Clock },
    { name: 'Leave', href: '/dashboard/staff/leave', icon: CalendarDays },
    { name: 'Team', href: '/dashboard/staff/team', icon: Users },
    { name: 'Channels', href: '/dashboard/staff/channels', icon: Hash },
    { name: 'Files', href: '/dashboard/staff/files', icon: FolderOpen },
    { name: 'Reviews', href: '/dashboard/staff/reviews', icon: Star },
    { name: 'Payslips', href: '/dashboard/staff/payslips', icon: Wallet },
    { name: 'Chat', href: '/dashboard/staff/chat', icon: MessageSquare },
    { name: 'Notifications', href: '/dashboard/staff/notifications', icon: Bell },
  ],
};

export function Sidebar({ role, isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const navigation = navigationConfig[role];
  const branding = useBranding();

  // Get logged-in user from localStorage
  const [currentUser, setCurrentUser] = useState<{ firstName: string; lastName: string; role: string; avatar?: string } | null>(null);
  useEffect(() => {
    const loadUser = () => {
      setCurrentUser(getUser());
    };
    loadUser();
    // Listen for profile updates from settings page
    window.addEventListener('user-updated', loadUser);
    return () => window.removeEventListener('user-updated', loadUser);
  }, [pathname]);

  const userName = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'User';
  const userInitials = currentUser ? `${currentUser.firstName[0]}${currentUser.lastName[0]}` : 'U';

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (onClose) {
      onClose();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-screen bg-primary dark:bg-primary-950 border-r border-primary-700 transition-all duration-300',
          // Desktop: always visible
          'hidden md:block',
          collapsed ? 'md:w-20' : 'md:w-64',
          // Mobile: slide in/out
          isOpen && 'block w-64'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-primary-700">
            <Link href="/" className="flex items-center gap-2">
              {branding.logo ? (
                <img src={getImageUrl(branding.logo)} alt={branding.companyName || 'Logo'} className="w-10 h-10 rounded-lg object-contain" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
              )}
              {!collapsed && (
                <span className="text-lg font-bold text-white">{getShortName(branding)}</span>
              )}
            </Link>
            {/* Close button on mobile */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="md:hidden text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </Button>
            {/* Collapse button on desktop */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(!collapsed)}
              className="hidden md:flex text-white hover:bg-white/10"
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
                      'flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'text-primary-100 hover:bg-white/10 hover:text-white'
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
        <div className="border-t border-primary-700 p-3 space-y-2">
          <Link
            href={`/dashboard/${role}/settings`}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-primary-100 hover:bg-white/10 hover:text-white transition-colors'
            )}
          >
            <Settings className="w-5 h-5 shrink-0" />
            {!collapsed && <span>Settings</span>}
          </Link>

          {/* User info */}
          <div className={cn('flex items-center gap-3 p-2', collapsed && 'justify-center')}>
            <Avatar key={currentUser?.avatar || 'no-avatar'} className="w-9 h-9">
              {currentUser?.avatar && (
                <AvatarImage src={getImageUrl(currentUser.avatar)} alt={userName} />
              )}
              <AvatarFallback className="bg-white/20 text-white text-sm">{userInitials}</AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-white">{userName}</p>
                <p className="text-xs text-primary-200 capitalize">{role}</p>
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            className={cn('w-full justify-start text-red-300 hover:text-red-200 hover:bg-white/10', collapsed && 'justify-center')}
            onClick={() => {
              clearAuth();
              router.push('/auth/login');
            }}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!collapsed && <span className="ml-3">Logout</span>}
          </Button>
        </div>
      </div>
    </aside>
    </>
  );
}
