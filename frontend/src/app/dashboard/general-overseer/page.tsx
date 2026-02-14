'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Home,
  UserCog,
  CalendarDays,
  BarChart3,
  Shield,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { getUser } from '@/lib/auth-storage';

export default function GeneralOverseerDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const user = getUser();
    if (user) setUserName(`${user.firstName} ${user.lastName}`);
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res: any = await api.get('/users/stats');
        setStats(res?.data || res);
      } catch {
        setStats(null);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const statCards = [
    { title: 'Total Users', value: stats?.totalUsers || 0, icon: Users, gradient: 'from-[#0b5c46] to-[#0e7a5e]' },
    { title: 'Active Users', value: stats?.activeUsers || 0, icon: Shield, gradient: 'from-[#fca639] to-[#fdb95c]' },
    { title: 'Realtors', value: stats?.realtors || 0, icon: Home, gradient: 'from-[#0b5c46] to-[#14956e]' },
    { title: 'Clients', value: stats?.clients || 0, icon: Users, gradient: 'from-[#fca639] to-[#e8953a]' },
    { title: 'Admins', value: stats?.admins || 0, icon: UserCog, gradient: 'from-[#0b5c46] to-[#0e7a5e]' },
  ];

  const quickActions = [
    { label: 'Manage Users & Roles', href: '/dashboard/general-overseer/users', icon: Users, desc: 'Promote, demote, and manage all users' },
    { label: 'Leave Approvals', href: '/dashboard/general-overseer/leave', icon: CalendarDays, desc: 'Review and approve admin leave requests' },
    { label: 'Staff Management', href: '/dashboard/general-overseer/staff', icon: UserCog, desc: 'View and manage staff members' },
    { label: 'Analytics', href: '/dashboard/general-overseer/analytics', icon: BarChart3, desc: 'Platform-wide analytics and reports' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome back{userName ? `, ${userName}` : ''}
        </h1>
        <p className="text-sm text-muted-foreground">General Overseer Dashboard — Full platform oversight</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((card) => (
          <Card key={card.title} className={`bg-gradient-to-br ${card.gradient} text-white border-0 shadow-md`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <card.icon className="w-5 h-5 text-white/80" />
              </div>
              <div className="text-2xl font-bold">{card.value}</div>
              <div className="text-xs text-white/70">{card.title}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Quick Actions</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {quickActions.map((action) => (
            <Link key={action.label} href={action.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <action.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{action.label}</h3>
                      <p className="text-sm text-muted-foreground">{action.desc}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
