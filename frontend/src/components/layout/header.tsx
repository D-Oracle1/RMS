'use client';

import { useState, useRef, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Bell,
  Search,
  Sun,
  Moon,
  Menu,
  X,
  User,
  Settings,
  LogOut,
  ChevronDown,
  Check,
  DollarSign,
  Home,
  Users,
  Award,
  AlertCircle,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNotifications } from '@/contexts/notification-context';
import { CalloutButton } from '@/components/callout/callout-button';
import { cn } from '@/lib/utils';
import { getImageUrl } from '@/lib/api';
import { getUser, clearAuth } from '@/lib/auth-storage';

interface HeaderProps {
  title: string;
  onMenuClick?: () => void;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'SALE': return <DollarSign className="w-4 h-4 text-green-600" />;
    case 'COMMISSION': return <DollarSign className="w-4 h-4 text-primary" />;
    case 'PROPERTY': case 'LISTING': case 'PRICE_CHANGE': return <Home className="w-4 h-4 text-purple-600" />;
    case 'RANKING': case 'LOYALTY': return <Award className="w-4 h-4 text-yellow-600" />;
    case 'CHAT': return <MessageSquare className="w-4 h-4 text-blue-600" />;
    case 'OFFER': return <DollarSign className="w-4 h-4 text-orange-600" />;
    case 'SYSTEM': return <AlertCircle className="w-4 h-4 text-red-600" />;
    default: return <Bell className="w-4 h-4" />;
  }
};

function timeAgo(dateStr: string) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

export function Header({ title, onMenuClick }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [showSearch, setShowSearch] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  const { notifications, unreadCount, markAsRead } = useNotifications();

  // Determine current role from pathname
  const getCurrentRole = () => {
    if (pathname.includes('/dashboard/admin')) return 'admin';
    if (pathname.includes('/dashboard/realtor')) return 'realtor';
    if (pathname.includes('/dashboard/staff')) return 'staff';
    return 'client';
  };

  const role = getCurrentRole();

  // Get logged-in user from localStorage
  const [currentUser, setCurrentUser] = useState<{ firstName: string; lastName: string; email: string; role: string; avatar?: string } | null>(null);
  useEffect(() => {
    const loadUser = () => {
      setCurrentUser(getUser());
    };
    loadUser();
    window.addEventListener('user-updated', loadUser);
    return () => window.removeEventListener('user-updated', loadUser);
  }, [pathname]);

  const userName = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'User';
  const userInitials = currentUser ? `${currentUser.firstName[0]}${currentUser.lastName[0]}` : 'U';

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    clearAuth();
    router.push('/auth/login');
  };

  const recentNotifications = notifications.slice(0, 5);

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b px-4 md:px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuClick}
        >
          <Menu className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {/* Search */}
        <div className="hidden md:flex relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search..."
            className="pl-10 w-64 bg-gray-50 dark:bg-gray-800 border-0"
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setShowSearch(!showSearch)}
        >
          {showSearch ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
        </Button>

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          <Sun className="w-5 h-5 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute w-5 h-5 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
        </Button>

        {/* Callout Bell - visible for admin and staff */}
        {(role === 'admin' || role === 'staff') && (
          <CalloutButton />
        )}

        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Button>

          {/* Notification Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-900 rounded-lg shadow-lg border z-50 overflow-hidden">
              <div className="px-4 py-3 border-b flex items-center justify-between">
                <h3 className="font-semibold text-sm">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="text-xs text-primary font-medium">{unreadCount} new</span>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto">
                {recentNotifications.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    No notifications yet
                  </div>
                ) : (
                  recentNotifications.map((n) => (
                    <button
                      key={n.id}
                      className={cn(
                        'w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b last:border-b-0',
                        !n.isRead && 'bg-primary/5'
                      )}
                      onClick={async () => {
                        if (!n.isRead) await markAsRead(n.id);
                        if (n.link) {
                          setShowNotifications(false);
                          router.push(n.link);
                        }
                      }}
                    >
                      <div className="mt-0.5 shrink-0">
                        {getNotificationIcon(n.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-sm', !n.isRead && 'font-semibold')}>{n.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">{timeAgo(n.createdAt)}</p>
                      </div>
                      {!n.isRead && (
                        <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                      )}
                    </button>
                  ))
                )}
              </div>

              <div className="border-t p-2">
                <Link
                  href={`/dashboard/${role}/notifications`}
                  onClick={() => setShowNotifications(false)}
                  className="block text-center text-sm text-primary hover:underline py-1"
                >
                  View all notifications
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Avatar with Dropdown */}
        <div className="relative" ref={profileMenuRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Avatar key={currentUser?.avatar || 'no-avatar'} className="w-9 h-9 cursor-pointer">
              {currentUser?.avatar && (
                <AvatarImage src={getImageUrl(currentUser.avatar)} alt={userName} />
              )}
              <AvatarFallback className="bg-primary text-white text-sm">{userInitials}</AvatarFallback>
            </Avatar>
            <ChevronDown className={`w-4 h-4 hidden md:block transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
          </button>

          {/* Profile Dropdown Menu */}
          {showProfileMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-900 rounded-lg shadow-lg border py-2 z-50">
              <div className="px-4 py-2 border-b">
                <p className="font-medium">{userName}</p>
                <p className="text-sm text-muted-foreground capitalize">{role}</p>
              </div>
              <Link
                href={`/dashboard/${role}/settings`}
                onClick={() => setShowProfileMenu(false)}
                className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <User className="w-4 h-4" />
                <span>My Profile</span>
              </Link>
              <Link
                href={`/dashboard/${role}/settings`}
                onClick={() => setShowProfileMenu(false)}
                className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </Link>
              <div className="border-t my-1" />
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-2 w-full text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile search */}
      {showSearch && (
        <div className="absolute top-16 left-0 right-0 p-4 bg-white dark:bg-gray-900 border-b md:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder="Search..." className="pl-10" autoFocus />
          </div>
        </div>
      )}
    </header>
  );
}
