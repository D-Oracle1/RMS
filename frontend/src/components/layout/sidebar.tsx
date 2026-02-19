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
  Share2,
  Newspaper,
  Bookmark,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getImageUrl } from '@/lib/api';
import { getUser, clearAuth } from '@/lib/auth-storage';
import { useBranding, getShortName } from '@/hooks/use-branding';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SidebarProps {
  role: 'admin' | 'realtor' | 'client' | 'staff' | 'super-admin' | 'general-overseer';
  isOpen?: boolean;
  onClose?: () => void;
  collapsed?: boolean;
  onCollapsedChange?: (v: boolean) => void;
}

// ---------------------------------------------------------------------------
// Navigation config (unchanged)
// ---------------------------------------------------------------------------

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
    { name: 'Referral Tracking', href: '/dashboard/admin/referrals', icon: Share2 },
    { name: 'Newsletter', href: '/dashboard/admin/newsletter', icon: Mail },
    { name: 'Engagement', href: '/dashboard/admin/engagement', icon: Newspaper },
    { name: 'Notifications', href: '/dashboard/admin/notifications', icon: Bell },
  ],
  realtor: [
    { name: 'Dashboard', href: '/dashboard/realtor', icon: LayoutDashboard },
    { name: 'My Sales', href: '/dashboard/realtor/sales', icon: DollarSign },
    { name: 'Properties', href: '/dashboard/realtor/properties', icon: Home },
    { name: 'Clients', href: '/dashboard/realtor/clients', icon: Users },
    { name: 'Commission', href: '/dashboard/realtor/commission', icon: Calculator },
    { name: 'Loyalty', href: '/dashboard/realtor/loyalty', icon: Award },
    { name: 'My Referrals', href: '/dashboard/realtor/referrals', icon: Share2 },
    { name: 'Feed', href: '/dashboard/realtor/feed', icon: Newspaper },
    { name: 'Chat', href: '/dashboard/realtor/chat', icon: MessageSquare },
    { name: 'Notifications', href: '/dashboard/realtor/notifications', icon: Bell },
  ],
  client: [
    { name: 'Dashboard', href: '/dashboard/client', icon: LayoutDashboard },
    { name: 'My Properties', href: '/dashboard/client/properties', icon: Home },
    { name: 'Offers', href: '/dashboard/client/offers', icon: DollarSign },
    { name: 'Documents', href: '/dashboard/client/documents', icon: FileText },
    { name: 'My Referrals', href: '/dashboard/client/referrals', icon: Share2 },
    { name: 'Feed', href: '/dashboard/client/feed', icon: Newspaper },
    { name: 'Saved Posts', href: '/dashboard/client/saved', icon: Bookmark },
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
    { name: 'My Referrals', href: '/dashboard/staff/referrals', icon: Share2 },
    { name: 'Feed', href: '/dashboard/staff/feed', icon: Newspaper },
    { name: 'Chat', href: '/dashboard/staff/chat', icon: MessageSquare },
    { name: 'Notifications', href: '/dashboard/staff/notifications', icon: Bell },
  ],
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Sidebar({
  role,
  isOpen = false,
  onClose,
  collapsed = false,
  onCollapsedChange,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const navigation = navigationConfig[role];
  const branding = useBranding();

  const [currentUser, setCurrentUser] = useState<{
    firstName: string;
    lastName: string;
    role: string;
    avatar?: string;
  } | null>(null);

  useEffect(() => {
    const load = () => setCurrentUser(getUser());
    load();
    window.addEventListener('user-updated', load);
    return () => window.removeEventListener('user-updated', load);
  }, [pathname]);

  // Close mobile sidebar on route change
  useEffect(() => {
    if (onClose) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const userName = currentUser
    ? `${currentUser.firstName} ${currentUser.lastName}`
    : 'User';
  const userInitials = currentUser
    ? `${currentUser.firstName[0]}${currentUser.lastName[0]}`
    : 'U';

  const roleLabel = role.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

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
          // Base: white card sidebar
          'fixed left-0 top-0 z-50 h-screen flex flex-col',
          'bg-white dark:bg-gray-900',
          'border-r border-gray-200 dark:border-gray-800',
          'transition-all duration-300 ease-in-out',
          // Desktop always visible, width depends on collapsed
          'hidden md:flex',
          collapsed ? 'md:w-20' : 'md:w-64',
          // Mobile: slide in via isOpen
          isOpen && '!flex w-72',
        )}
      >
        {/* ── Logo row ── */}
        <div
          className={cn(
            'h-16 flex items-center border-b border-gray-100 dark:border-gray-800 shrink-0 px-4',
            collapsed ? 'justify-center' : 'justify-between',
          )}
        >
          <Link href="/" className="flex items-center gap-2.5 min-w-0">
            {branding.logo ? (
              <img
                src={getImageUrl(branding.logo)}
                alt={branding.companyName || 'Logo'}
                className="w-9 h-9 rounded-xl object-contain shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5 text-white" />
              </div>
            )}
            {!collapsed && (
              <span className="text-base font-bold text-gray-900 dark:text-white truncate">
                {getShortName(branding)}
              </span>
            )}
          </Link>

          {/* Mobile close */}
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Desktop collapse toggle */}
          {!collapsed && (
            <button
              onClick={() => onCollapsedChange?.(!collapsed)}
              className="hidden md:flex p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* ── User profile ── */}
        <div
          className={cn(
            'py-4 border-b border-gray-100 dark:border-gray-800 shrink-0',
            collapsed ? 'flex justify-center px-2' : 'px-4 flex items-center gap-3',
          )}
        >
          <Avatar className="w-10 h-10 shrink-0 ring-2 ring-primary/20">
            {currentUser?.avatar && (
              <AvatarImage src={getImageUrl(currentUser.avatar)} alt={userName} />
            )}
            <AvatarFallback className="bg-primary text-white text-sm font-semibold">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {userName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{roleLabel}</p>
            </div>
          )}
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 scrollbar-thin">
          <ul className="space-y-0.5">
            {navigation.map((item) => {
              const isActive =
                item.href === `/dashboard/${role}`
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    title={collapsed ? item.name : undefined}
                    className={cn(
                      'relative flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-150',
                      collapsed ? 'justify-center px-2 py-3' : 'px-3 py-2.5',
                      isActive
                        ? 'bg-primary/10 text-primary dark:bg-primary/15'
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white',
                    )}
                  >
                    {/* Left accent bar for active item */}
                    {isActive && !collapsed && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-primary rounded-r-full" />
                    )}
                    <item.icon
                      className={cn(
                        'w-5 h-5 shrink-0',
                        isActive ? 'text-primary' : '',
                      )}
                    />
                    {!collapsed && <span>{item.name}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* ── Bottom: expand toggle (collapsed) + Settings + Logout ── */}
        <div className="border-t border-gray-100 dark:border-gray-800 px-2 py-3 space-y-0.5 shrink-0">
          {/* Expand button shown only when collapsed */}
          {collapsed && (
            <button
              onClick={() => onCollapsedChange?.(false)}
              title="Expand sidebar"
              className="w-full flex justify-center px-2 py-2.5 rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 rotate-180" />
            </button>
          )}

          <Link
            href={`/dashboard/${role}/settings`}
            title={collapsed ? 'Settings' : undefined}
            className={cn(
              'flex items-center gap-3 rounded-xl text-sm font-medium text-gray-500 dark:text-gray-400',
              'hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-all',
              collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5',
            )}
          >
            <Settings className="w-5 h-5 shrink-0" />
            {!collapsed && <span>Settings</span>}
          </Link>

          <button
            onClick={() => {
              clearAuth();
              router.push('/auth/login');
            }}
            title={collapsed ? 'Logout' : undefined}
            className={cn(
              'w-full flex items-center gap-3 rounded-xl text-sm font-medium',
              'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all',
              collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5',
            )}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
