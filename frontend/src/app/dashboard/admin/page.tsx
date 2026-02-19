'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Home,
  DollarSign,
  TrendingUp,
  Activity,
  Award,
  Building2,
  Clock,
  Wallet,
  Trophy,
  Star,
  Crown,
  UserCheck,
  Loader2,
  RefreshCw,
  Briefcase,
  BarChart3,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency, getTierBgClass } from '@/lib/utils';
import { api } from '@/lib/api';
import { AwardBanner } from '@/components/award-banner';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

type Period = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

function getLast12Months() {
  const months: { label: string; month: number; year: number }[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      label: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      month: d.getMonth(),
      year: d.getFullYear(),
    });
  }
  return months;
}

function getYearOptions() {
  const years: number[] = [];
  const currentYear = new Date().getFullYear();
  for (let i = 0; i < 5; i++) {
    years.push(currentYear - i);
  }
  return years;
}

export default function AdminDashboard() {
  const [period, setPeriod] = useState<Period>('MONTHLY');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentAwards, setCurrentAwards] = useState<any[]>([]);

  const fetchAwards = useCallback(async () => {
    try {
      const res: any = await api.get('/awards/current-month');
      setCurrentAwards(Array.isArray(res) ? res : res?.data || []);
    } catch {
      setCurrentAwards([]);
    }
  }, []);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/admin/dashboard?period=${period.toLowerCase()}`;
      if (period === 'MONTHLY') {
        url += `&month=${selectedMonth}&year=${selectedYear}`;
      } else if (period === 'YEARLY') {
        url += `&year=${selectedYear}`;
      }
      const res: any = await api.get(url);
      setDashboardData(res.data || res);
    } catch {
      setDashboardData(null);
    } finally {
      setLoading(false);
    }
  }, [period, selectedMonth, selectedYear]);

  useEffect(() => {
    fetchAwards();
  }, [fetchAwards]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleRefresh = () => {
    fetchDashboard();
    fetchAwards();
  };

  // Extract data from API response
  const chartData = dashboardData?.chartData || [];
  const revenue = Number(dashboardData?.revenue?.filtered) || 0;
  const salesCount = dashboardData?.sales?.filtered || 0;
  // Use commission from sales (filteredFromSales) to match revenue/sales period
  // Commission table (filtered) may have records from different periods
  const commissionFromSales = Number(dashboardData?.commission?.filteredFromSales) || 0;
  const commissionPaid = commissionFromSales;
  const totalRealtors = dashboardData?.realtors?.total || 0;
  const activeRealtors = dashboardData?.realtors?.active || 0;
  const totalClients = dashboardData?.clients?.total || 0;
  const totalProperties = dashboardData?.properties?.total || 0;
  const activeListings = dashboardData?.properties?.activeListings || 0;
  const pendingSales = dashboardData?.sales?.pending || 0;
  const recentSales = dashboardData?.recentSales || [];

  // Get tier distribution from API
  const tierData = dashboardData?.tierDistribution || {};
  const tierDistributionData = useMemo(() => [
    { name: 'Platinum', value: tierData.PLATINUM || 0, color: '#0b5c46' },
    { name: 'Gold', value: tierData.GOLD || 0, color: '#fca639' },
    { name: 'Silver', value: tierData.SILVER || 0, color: '#94a3b8' },
    { name: 'Bronze', value: tierData.BRONZE || 0, color: '#c2956b' },
  ], [tierData]);
  const totalTiers = useMemo(() => tierDistributionData.reduce((sum, t) => sum + t.value, 0) || 1, [tierDistributionData]);

  // Find highest selling property from recent sales
  const highestSellingProperty = useMemo(() => {
    if (!recentSales || recentSales.length === 0) {
      return null;
    }
    const completed = recentSales.filter((s: any) => s.status === 'COMPLETED');
    if (completed.length === 0) return null;

    const sorted = [...completed].sort((a: any, b: any) => Number(b.salePrice) - Number(a.salePrice));
    const top = sorted[0];
    return {
      name: top.property?.title || 'Unknown Property',
      type: top.property?.type || 'Property',
      price: Number(top.salePrice) || 0,
      soldBy: top.realtor?.user ? `${top.realtor.user.firstName} ${top.realtor.user.lastName}` : 'Unknown',
      location: top.property?.address || top.property?.city || 'Unknown',
    };
  }, [recentSales]);

  // Get award highlights
  const highlights = useMemo(() => {
    const staffAward = currentAwards.find((a: any) => a.type === 'STAFF_OF_MONTH' && a.isPublished);
    const realtorAward = currentAwards.find((a: any) => a.type === 'REALTOR_OF_MONTH' && a.isPublished);
    const clientAward = currentAwards.find((a: any) => a.type === 'CLIENT_OF_MONTH' && a.isPublished);

    return {
      staffOfMonth: staffAward
        ? { name: `${staffAward.user?.firstName || ''} ${staffAward.user?.lastName || ''}`.trim(), achievement: staffAward.reason, fromApi: true }
        : { name: 'Not yet selected', achievement: 'No data available', fromApi: false },
      realtorOfMonth: realtorAward
        ? { name: `${realtorAward.user?.firstName || ''} ${realtorAward.user?.lastName || ''}`.trim(), achievement: realtorAward.reason, fromApi: true }
        : { name: 'Not yet selected', achievement: 'No data available', fromApi: false },
      clientOfMonth: clientAward
        ? { name: `${clientAward.user?.firstName || ''} ${clientAward.user?.lastName || ''}`.trim(), achievement: clientAward.reason, fromApi: true }
        : { name: 'Not yet selected', achievement: 'No data available', fromApi: false },
    };
  }, [currentAwards]);

  // Stats cards data
  const mainStats = [
    {
      label: 'Total Revenue',
      value: formatCurrency(revenue),
      icon: DollarSign,
      color: '#0b5c46',
      subtext: `${salesCount} sales this period`
    },
    {
      label: 'Total Realtors',
      value: String(totalRealtors),
      icon: Users,
      color: '#0b5c46',
      subtext: `${activeRealtors} active`
    },
    {
      label: 'Total Clients',
      value: String(totalClients),
      icon: Briefcase,
      color: '#fca639',
      subtext: 'All time'
    },
    {
      label: 'Total Properties',
      value: String(totalProperties),
      icon: Home,
      color: '#0b5c46',
      subtext: `${activeListings} listed`
    },
  ];

  const bottomStats = [
    { label: 'Commission Paid', value: formatCurrency(commissionPaid), icon: Wallet, color: '#fca639' },
    { label: 'Completed Sales', value: String(salesCount), icon: TrendingUp, color: '#0b5c46' },
    { label: 'Active Listings', value: String(activeListings), icon: Building2, color: '#0b5c46' },
    { label: 'Pending Sales', value: String(pendingSales), icon: Clock, color: '#fca639' },
  ];

  const periodLabel = useMemo(() => {
    if (period === 'MONTHLY') {
      const d = new Date(selectedYear, selectedMonth, 1);
      return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    if (period === 'YEARLY') return String(selectedYear);
    if (period === 'WEEKLY') return 'This Week';
    return 'Today';
  }, [period, selectedMonth, selectedYear]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge className="bg-[#0b5c46]/10 text-[#0b5c46] hover:bg-[#0b5c46]/20">Completed</Badge>;
      case 'PENDING':
        return <Badge className="bg-[#fca639]/10 text-[#fca639] hover:bg-[#fca639]/20">Pending</Badge>;
      case 'CANCELLED':
        return <Badge className="bg-red-100 text-red-600 hover:bg-red-200">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Award Banner */}
      <AwardBanner />

      {/* Quick Stats Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {mainStats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1">{loading ? '-' : stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.subtext}</p>
                  </div>
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${stat.color}15` }}
                  >
                    <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Row 1: Main Chart + Tier Donut */}
      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2">
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">Sales Overview</CardTitle>
                  <p className="text-sm text-muted-foreground">{periodLabel}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                    {(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'] as Period[]).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPeriod(p)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                          period === p
                            ? 'bg-white dark:bg-gray-700 shadow-sm text-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  {period === 'MONTHLY' && (
                    <Select
                      value={`${selectedYear}-${selectedMonth}`}
                      onValueChange={(val) => {
                        const [y, m] = val.split('-').map(Number);
                        setSelectedYear(y);
                        setSelectedMonth(m);
                      }}
                    >
                      <SelectTrigger className="w-[170px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {getLast12Months().map(({ label, month, year }) => (
                          <SelectItem key={`${year}-${month}`} value={`${year}-${month}`}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {period === 'YEARLY' && (
                    <Select
                      value={String(selectedYear)}
                      onValueChange={(val) => setSelectedYear(Number(val))}
                    >
                      <SelectTrigger className="w-[100px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {getYearOptions().map((year) => (
                          <SelectItem key={year} value={String(year)}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-[280px]">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="grid md:grid-cols-[200px_1fr] gap-6">
                  <div className="space-y-6">
                    <div>
                      <p className="text-3xl font-bold">{formatCurrency(revenue)}</p>
                      <p className="text-sm text-muted-foreground">Total Revenue</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold">{salesCount}</p>
                      <p className="text-sm text-muted-foreground">Completed Sales</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-[#fca639]">{formatCurrency(commissionPaid)}</p>
                      <p className="text-sm text-muted-foreground">Commission Paid</p>
                    </div>
                    <Button className="bg-[#0b5c46] hover:bg-[#094a38] text-white rounded-full px-6" asChild>
                      <a href="/dashboard/admin/sales">View All Sales</a>
                    </Button>
                  </div>
                  <div className="h-[250px]">
                    {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#0b5c46" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#0b5c46" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorSalesCount" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#fca639" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#fca639" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                          <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            formatter={(value: number, name: string) => [
                              name === 'revenue' ? formatCurrency(value) : value,
                              name === 'revenue' ? 'Revenue' : 'Sales',
                            ]}
                          />
                          <Area type="monotone" dataKey="revenue" stroke="#0b5c46" strokeWidth={2.5} fill="url(#colorRevenue)" dot={{ r: 4, fill: '#0b5c46', stroke: '#fff', strokeWidth: 2 }} />
                          <Area type="monotone" dataKey="sales" stroke="#fca639" strokeWidth={2.5} fill="url(#colorSalesCount)" dot={{ r: 4, fill: '#fca639', stroke: '#fff', strokeWidth: 2 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        No sales data for this period
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
                {bottomStats.map((stat) => (
                  <div key={stat.label} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${stat.color}15` }}>
                      <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                      <p className="font-semibold">{loading ? '-' : stat.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tier Distribution Donut */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="shadow-sm h-full">
            <CardHeader>
              <CardTitle className="text-lg">Realtor Distribution</CardTitle>
              <p className="text-sm text-muted-foreground">{totalRealtors} total realtors</p>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              {loading ? (
                <div className="flex items-center justify-center h-[200px]">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={tierDistributionData}
                          cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value" strokeWidth={0}
                        >
                          {tierDistributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} formatter={(value: number, name: string) => [`${value} realtors`, name]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-3 mt-4 w-full">
                    {tierDistributionData.map((item) => {
                      const pct = totalTiers > 0 ? ((item.value / totalTiers) * 100).toFixed(0) : 0;
                      return (
                        <div key={item.name} className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                          <div>
                            <span className="text-xl font-bold">{pct}</span>
                            <span className="text-xs text-muted-foreground">%</span>
                            <p className="text-xs text-muted-foreground">{item.name} ({item.value})</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Row 2: Monthly Highlights */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="w-5 h-5 text-[#fca639]" />
                Monthly Highlights
              </CardTitle>
              <Button variant="outline" size="sm" asChild>
                <a href="/dashboard/admin/rankings">View All Rankings</a>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Staff of the Month */}
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-5 text-white">
                <div className="absolute top-2 right-2 opacity-20"><UserCheck className="w-16 h-16" /></div>
                <div className="relative">
                  <div className="flex items-center gap-2 mb-3">
                    <Crown className="w-5 h-5 text-yellow-300" />
                    <span className="text-sm font-medium text-blue-100">Staff of the Month</span>
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="w-12 h-12 border-2 border-white/30">
                      <AvatarFallback className="bg-white/20 text-white font-bold">
                        {highlights.staffOfMonth.name.split(' ').filter(Boolean).map((n: string) => n[0]).join('') || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-bold">{highlights.staffOfMonth.name}</p>
                    </div>
                  </div>
                  <p className="text-sm font-medium">{highlights.staffOfMonth.achievement}</p>
                </div>
              </div>

              {/* Realtor of the Month */}
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#0b5c46] to-[#0e7a5e] p-5 text-white">
                <div className="absolute top-2 right-2 opacity-20"><Award className="w-16 h-16" /></div>
                <div className="relative">
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="w-5 h-5 text-yellow-300" />
                    <span className="text-sm font-medium text-green-100">Realtor of the Month</span>
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="w-12 h-12 border-2 border-white/30">
                      <AvatarFallback className="bg-white/20 text-white font-bold">
                        {highlights.realtorOfMonth.name.split(' ').filter(Boolean).map((n: string) => n[0]).join('') || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-bold">{highlights.realtorOfMonth.name}</p>
                    </div>
                  </div>
                  <p className="text-sm font-medium">{highlights.realtorOfMonth.achievement}</p>
                </div>
              </div>

              {/* Client of the Month */}
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#fca639] to-[#e8953a] p-5 text-white">
                <div className="absolute top-2 right-2 opacity-20"><Users className="w-16 h-16" /></div>
                <div className="relative">
                  <div className="flex items-center gap-2 mb-3">
                    <Trophy className="w-5 h-5 text-yellow-200" />
                    <span className="text-sm font-medium text-orange-100">Client of the Month</span>
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="w-12 h-12 border-2 border-white/30">
                      <AvatarFallback className="bg-white/20 text-white font-bold">
                        {highlights.clientOfMonth.name.split(' ').filter(Boolean).map((n: string) => n[0]).join('') || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-bold text-sm">{highlights.clientOfMonth.name}</p>
                    </div>
                  </div>
                  <p className="text-sm font-medium">{highlights.clientOfMonth.achievement}</p>
                </div>
              </div>

              {/* Highest Selling Property */}
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 p-5 text-white">
                <div className="absolute top-2 right-2 opacity-20"><Building2 className="w-16 h-16" /></div>
                <div className="relative">
                  <div className="flex items-center gap-2 mb-3">
                    <Home className="w-5 h-5 text-purple-200" />
                    <span className="text-sm font-medium text-purple-100">Top Property Sale</span>
                  </div>
                  {highestSellingProperty ? (
                    <>
                      <div className="mb-3">
                        <p className="font-bold text-sm leading-tight">{highestSellingProperty.name}</p>
                        <p className="text-xs text-purple-100 mt-1">{highestSellingProperty.type} - {highestSellingProperty.location}</p>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <p className="text-2xl font-bold">{formatCurrency(highestSellingProperty.price)}</p>
                          <p className="text-xs text-purple-100">Sale Price</p>
                        </div>
                        <p className="text-xs"><span className="text-purple-200">Sold by:</span> {highestSellingProperty.soldBy}</p>
                      </div>
                    </>
                  ) : (
                    <div className="py-4">
                      <p className="text-sm">No sales data for this period</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Row 3: Recent Sales Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg">Recent Sales</CardTitle>
                <p className="text-sm text-muted-foreground">{periodLabel} - {recentSales.length} transactions</p>
              </div>
              <Button size="sm" className="bg-[#0b5c46] hover:bg-[#094a38] text-white gap-1" asChild>
                <a href="/dashboard/admin/sales">View All Sales</a>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : recentSales.length > 0 ? (
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#0b5c46] hover:bg-[#0b5c46]">
                    <TableHead className="text-white font-semibold">PROPERTY</TableHead>
                    <TableHead className="text-white font-semibold">CLIENT</TableHead>
                    <TableHead className="text-white font-semibold">REALTOR</TableHead>
                    <TableHead className="text-white font-semibold">AMOUNT</TableHead>
                    <TableHead className="text-white font-semibold">STATUS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentSales.map((sale: any) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium">{sale.property?.title || 'Unknown'}</TableCell>
                      <TableCell>{sale.client?.user ? `${sale.client.user.firstName} ${sale.client.user.lastName}` : 'Unknown'}</TableCell>
                      <TableCell>{sale.realtor?.user ? `${sale.realtor.user.firstName} ${sale.realtor.user.lastName}` : 'Unknown'}</TableCell>
                      <TableCell className="font-semibold">{formatCurrency(Number(sale.salePrice))}</TableCell>
                      <TableCell>{getStatusBadge(sale.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No sales found for this period
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
