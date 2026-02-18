'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AwardBanner } from '@/components/award-banner';
import {
  Home,
  TrendingUp,
  FileText,
  DollarSign,
  ArrowUpRight,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  MessageSquare,
  Eye,
  CheckCircle,
  XCircle,
  Loader2,
  Crown,
  Copy,
  Check,
  Users2,
  Link,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { api, getImageUrl } from '@/lib/api';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { toast } from 'sonner';
import { getUser } from '@/lib/auth-storage';

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

export default function ClientDashboard() {
  const router = useRouter();
  const [period, setPeriod] = useState<Period>('MONTHLY');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [clientOfMonth, setClientOfMonth] = useState<any>(null);
  const [referralCode, setReferralCode] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const user = getUser();
    if (user) {
      setUserName(`${user.firstName} ${user.lastName}`);
      if (user.referralCode) setReferralCode(user.referralCode);
    }
  }, []);

  const handleCopyReferral = () => {
    const link = `${window.location.origin}/auth/register?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success('Referral link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    const fetchClientOfMonth = async () => {
      try {
        const res: any = await api.get('/awards/client-of-month');
        setClientOfMonth(res?.data || res);
      } catch {
        setClientOfMonth(null);
      }
    };

    fetchClientOfMonth();
  }, []);

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        let url = `/clients/dashboard?period=${period.toLowerCase()}`;
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
    };
    fetchDashboard();
  }, [period, selectedMonth, selectedYear]);

  const periodLabel = useMemo(() => {
    if (period === 'MONTHLY') {
      const d = new Date(selectedYear, selectedMonth, 1);
      return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    if (period === 'YEARLY') return String(selectedYear);
    if (period === 'WEEKLY') return 'This Week';
    return 'Today';
  }, [period, selectedMonth, selectedYear]);

  const profile = dashboardData?.profile;
  const stats = dashboardData?.stats;
  const properties = dashboardData?.properties || [];
  const filteredPurchases = dashboardData?.filteredPurchases || [];

  const totalProperties = stats?.totalProperties || 0;
  const totalPropertyValue = stats?.totalPropertyValue || 0;
  const totalAppreciation = stats?.totalAppreciation || 0;
  const avgAppreciationPercentage = stats?.avgAppreciationPercentage || 0;
  const pendingOffers = stats?.pendingOffers || 0;
  const filteredPurchaseCount = stats?.filteredPurchases || 0;
  const filteredSpent = stats?.filteredSpent || 0;

  const realtor = profile?.realtor;
  const realtorName = realtor?.user
    ? `${realtor.user.firstName} ${realtor.user.lastName}`
    : 'Not assigned';

  const gradientCards = [
    { title: 'Total Properties', value: String(totalProperties), subtitle: 'In portfolio', gradient: 'from-[#0b5c46] to-[#0e7a5e]', icon: Home },
    { title: 'Portfolio Value', value: formatCurrency(totalPropertyValue), subtitle: 'Current market value', gradient: 'from-[#fca639] to-[#fdb95c]', icon: DollarSign },
    { title: 'Total Appreciation', value: formatCurrency(totalAppreciation), subtitle: `+${avgAppreciationPercentage.toFixed(1)}%`, gradient: 'from-[#0b5c46] to-[#14956e]', icon: TrendingUp },
    { title: 'Pending Offers', value: String(pendingOffers), subtitle: 'Awaiting response', gradient: 'from-[#fca639] to-[#e8953a]', icon: FileText },
  ];

  const bottomStats = [
    { label: 'Properties', value: String(totalProperties), icon: Home, color: '#0b5c46' },
    { label: 'Appreciation', value: `+${formatCurrency(totalAppreciation)}`, icon: TrendingUp, color: '#fca639' },
    { label: 'Pending Offers', value: String(pendingOffers), icon: FileText, color: '#0b5c46' },
    { label: `${periodLabel} Purchases`, value: String(filteredPurchaseCount), icon: Calendar, color: '#fca639' },
  ];

  const chartData = filteredPurchases.map((p: any) => ({
    label: new Date(p.saleDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    spent: Number(p.salePrice),
  }));

  const handleAcceptOffer = async (clientId: string, offerId: string) => {
    try {
      await api.post(`/clients/${clientId}/offers/${offerId}/respond`, { response: 'accept' });
      toast.success('Offer accepted! The buyer will be notified.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to accept offer');
    }
  };

  const handleRejectOffer = async (clientId: string, offerId: string) => {
    try {
      await api.post(`/clients/${clientId}/offers/${offerId}/respond`, { response: 'reject' });
      toast.error('Offer rejected.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to reject offer');
    }
  };

  const handleCounterOffer = (offerId: string) => {
    toast.info('Counter offer form will be available soon.');
  };


  return (
    <div className="space-y-6">
      <AwardBanner />

      {/* Client of the Month Celebration Card */}
      {clientOfMonth && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-gradient-to-br from-[#fca639] to-[#e8953a] text-white shadow-lg border-0">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Crown className="w-5 h-5 text-yellow-200" />
                <span className="text-sm font-semibold opacity-90">Client of the Month</span>
              </div>
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16 border-4 border-white/30">
                  {clientOfMonth.user?.avatar && (
                    <AvatarImage src={getImageUrl(clientOfMonth.user.avatar)} alt={clientOfMonth.user?.firstName} />
                  )}
                  <AvatarFallback className="bg-white/20 text-white text-xl">
                    {(clientOfMonth.user?.firstName?.[0] || '') + (clientOfMonth.user?.lastName?.[0] || '')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-bold">
                    {clientOfMonth.user?.firstName} {clientOfMonth.user?.lastName}
                  </h3>
                  <p className="text-sm text-white/80">
                    {new Date(0, clientOfMonth.month - 1).toLocaleString('en', { month: 'long' })} {clientOfMonth.year}
                  </p>
                </div>
              </div>
              {clientOfMonth.reason && (
                <p className="mt-4 text-sm text-white/80 bg-white/10 rounded-lg p-3">{clientOfMonth.reason}</p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Row 1: Main Chart + Realtor Card */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Portfolio Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2"
        >
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">Welcome back{userName ? `, ${userName}` : ''}!</CardTitle>
                  <p className="text-sm text-muted-foreground">Portfolio overview - {periodLabel}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
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
                  {/* Left stats */}
                  <div className="space-y-6">
                    <div>
                      <p className="text-3xl font-bold">{formatCurrency(totalPropertyValue)}</p>
                      <p className="text-sm text-muted-foreground">Portfolio Value</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-[#0b5c46]">+{avgAppreciationPercentage.toFixed(1)}%</p>
                      <p className="text-sm text-muted-foreground">Total Appreciation</p>
                    </div>
                    <Button className="bg-[#0b5c46] hover:bg-[#094a38] text-white rounded-full px-6" asChild>
                      <a href="/dashboard/client/properties">View All Properties</a>
                    </Button>
                  </div>

                  {/* Chart */}
                  <div className="h-[220px]">
                    {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorSpent" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#0b5c46" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#0b5c46" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                          <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            formatter={(value: number) => [formatCurrency(value), 'Purchase']}
                          />
                          <Area type="monotone" dataKey="spent" stroke="#0b5c46" strokeWidth={2.5} fill="url(#colorSpent)" dot={{ r: 4, fill: '#0b5c46', stroke: '#fff', strokeWidth: 2 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        No purchase data for this period
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Bottom stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
                {bottomStats.map((stat) => (
                  <div key={stat.label} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${stat.color}15` }}>
                      <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                      <p className="font-semibold">{stat.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Realtor Contact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="shadow-sm h-full">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-[#0b5c46]" />
                Your Realtor
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : realtor ? (
                <>
                  <div className="text-center mb-6">
                    <Avatar className="w-20 h-20 mx-auto mb-4">
                      <AvatarFallback className="bg-[#0b5c46] text-white text-xl">
                        {realtorName.split(' ').filter(Boolean).map((n: string) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="font-semibold text-lg">{realtorName}</h3>
                    {realtor.loyaltyTier && (
                      <Badge className={getTierBgClass(realtor.loyaltyTier)}>
                        {realtor.loyaltyTier}
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-3">
                    {realtor.user?.email && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                        <Mail className="w-5 h-5 text-muted-foreground" />
                        <span className="text-sm">{realtor.user.email}</span>
                      </div>
                    )}
                    {realtor.user?.phone && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                        <Phone className="w-5 h-5 text-muted-foreground" />
                        <span className="text-sm">{realtor.user.phone}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button className="flex-1 bg-[#0b5c46] hover:bg-[#094a38]">
                      <Phone className="w-4 h-4 mr-2" />
                      Call
                    </Button>
                    <Button variant="outline" className="flex-1">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Chat
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No realtor assigned
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Row 2: Gradient Mini Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {gradientCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.05 }}
          >
            <Card className={`bg-gradient-to-br ${card.gradient} text-white overflow-hidden shadow-sm border-0`}>
              <CardContent className="p-5 relative">
                <div className="absolute top-3 right-3 opacity-20">
                  <card.icon className="w-12 h-12" />
                </div>
                <p className="text-sm font-medium opacity-90">{card.title}</p>
                <div className="mt-2">
                  <p className="text-2xl font-bold">{card.value}</p>
                  <p className="text-xs opacity-75 mt-1">{card.subtitle}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Referral Link Card */}
      {referralCode && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="shadow-sm">
            <CardContent className="p-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#0b5c46]/10 flex items-center justify-center">
                    <Link className="w-5 h-5 text-[#0b5c46]" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Your Referral Link</p>
                    <p className="text-xs text-muted-foreground break-all">
                      {typeof window !== 'undefined' ? `${window.location.origin}/auth/register?ref=${referralCode}` : referralCode}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={handleCopyReferral} className="gap-1.5">
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                  <Button size="sm" className="bg-[#0b5c46] hover:bg-[#094a38] text-white gap-1.5" asChild>
                    <a href="/dashboard/client/referrals">
                      <Users2 className="w-4 h-4" />
                      View Leads
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Row 3: Properties + Recent Purchases */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* My Properties */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-3"
        >
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#0b5c46]" />
                My Properties
              </CardTitle>
              <Button variant="outline" size="sm" asChild>
                <a href="/dashboard/client/properties">View All</a>
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : properties.length > 0 ? (
                <div className="space-y-4">
                  {properties.slice(0, 5).map((property: any) => (
                    <div
                      key={property.id}
                      className="flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                    >
                      <div className="w-full md:w-32 h-24 bg-gradient-to-br from-[#0b5c46]/20 to-[#0b5c46]/5 rounded-lg flex items-center justify-center">
                        <Building2 className="w-10 h-10 text-[#0b5c46]" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold">{property.title}</h4>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {property.address}
                            </p>
                          </div>
                          {property.isListed && (
                            <Badge className="bg-[#fca639]/10 text-[#fca639]">Listed for Sale</Badge>
                          )}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Purchase Price</p>
                            <p className="font-semibold">{formatCurrency(Number(property.originalPrice))}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Current Value</p>
                            <p className="font-semibold text-[#0b5c46]">{formatCurrency(Number(property.price))}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Appreciation</p>
                            <p className="font-semibold text-[#0b5c46] flex items-center">
                              <ArrowUpRight className="w-4 h-4" />
                              {property.appreciationPercentage !== undefined
                                ? `${property.appreciationPercentage.toFixed(1)}%`
                                : 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No properties in your portfolio
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Purchases */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2"
        >
          <Card className="shadow-sm h-full">
            <CardHeader>
              <CardTitle className="text-lg">{periodLabel} Purchases</CardTitle>
              <p className="text-sm text-muted-foreground">
                {filteredPurchaseCount} purchase{filteredPurchaseCount !== 1 ? 's' : ''} &bull; {formatCurrency(filteredSpent)} spent
              </p>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : filteredPurchases.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-[#0b5c46] hover:bg-[#0b5c46]">
                        <TableHead className="text-white font-semibold text-xs">PROPERTY</TableHead>
                        <TableHead className="text-white font-semibold text-xs">AMOUNT</TableHead>
                        <TableHead className="text-white font-semibold text-xs">DATE</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPurchases.map((purchase: any) => (
                        <TableRow key={purchase.id}>
                          <TableCell className="text-sm">
                            <p className="font-medium truncate max-w-[180px]">{purchase.property?.title || 'Unknown'}</p>
                          </TableCell>
                          <TableCell className="font-semibold text-[#0b5c46] text-sm">
                            {formatCurrency(Number(purchase.salePrice))}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(purchase.saleDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No purchases for this period
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
