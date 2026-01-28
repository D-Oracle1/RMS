'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Crown,
  Trophy,
  Medal,
  Star,
  TrendingUp,
  Calendar,
  Award,
  Users,
  Building,
  Wallet,
  Mail,
  Phone,
  MapPin,
  BarChart3,
  Target,
  Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatCurrency, getTierBgClass } from '@/lib/utils';

interface Realtor {
  rank: number;
  name: string;
  tier: string;
  sales: number;
  totalValue: number;
  commission: number;
  change: number;
  avatar: string | null;
  email: string;
  phone: string;
  location: string;
  joinDate: string;
  monthlySales: number[];
  specialization: string;
  activeListings: number;
  closedDeals: number;
}

interface Client {
  rank: number;
  name: string;
  propertiesOwned: number;
  portfolioValue: number;
  totalPurchases: number;
  memberSince: string;
  avatar: string | null;
  email: string;
  phone: string;
  location: string;
  monthlyInvestments: number[];
  preferredType: string;
  pendingOffers: number;
  completedDeals: number;
}

// Base data - will be filtered based on time period
const allRealtors: Realtor[] = [
  { rank: 1, name: 'Chioma Adeyemi', tier: 'PLATINUM', sales: 45, totalValue: 125000000, commission: 5000000, change: 0, avatar: null, email: 'chioma.adeyemi@rms.com', phone: '+234 801 234 5678', location: 'Lagos, Nigeria', joinDate: 'Jan 2022', monthlySales: [3, 5, 4, 6, 5, 4, 3, 5, 4, 3, 4, 5], specialization: 'Land & Commercial', activeListings: 12, closedDeals: 45 },
  { rank: 2, name: 'Emeka Okonkwo', tier: 'GOLD', sales: 38, totalValue: 98000000, commission: 3920000, change: 1, avatar: null, email: 'emeka.okonkwo@rms.com', phone: '+234 802 345 6789', location: 'Abuja, Nigeria', joinDate: 'Mar 2022', monthlySales: [2, 4, 3, 4, 3, 4, 3, 4, 3, 4, 2, 4], specialization: 'Residential', activeListings: 8, closedDeals: 38 },
  { rank: 3, name: 'Aisha Mohammed', tier: 'GOLD', sales: 35, totalValue: 82000000, commission: 3280000, change: -1, avatar: null, email: 'aisha.mohammed@rms.com', phone: '+234 803 456 7890', location: 'Kano, Nigeria', joinDate: 'Feb 2022', monthlySales: [3, 3, 2, 4, 3, 3, 2, 3, 4, 3, 3, 2], specialization: 'Land', activeListings: 6, closedDeals: 35 },
  { rank: 4, name: 'Tunde Bakare', tier: 'SILVER', sales: 32, totalValue: 71000000, commission: 2485000, change: 2, avatar: null, email: 'tunde.bakare@rms.com', phone: '+234 804 567 8901', location: 'Ibadan, Nigeria', joinDate: 'Jun 2022', monthlySales: [2, 3, 3, 2, 3, 3, 2, 3, 3, 2, 3, 3], specialization: 'Residential', activeListings: 5, closedDeals: 32 },
  { rank: 5, name: 'Ngozi Eze', tier: 'SILVER', sales: 30, totalValue: 65000000, commission: 2275000, change: 0, avatar: null, email: 'ngozi.eze@rms.com', phone: '+234 805 678 9012', location: 'Port Harcourt, Nigeria', joinDate: 'Apr 2022', monthlySales: [2, 2, 3, 3, 2, 3, 2, 3, 2, 3, 2, 3], specialization: 'Commercial', activeListings: 4, closedDeals: 30 },
  { rank: 6, name: 'Olumide Adebayo', tier: 'SILVER', sales: 28, totalValue: 59000000, commission: 2065000, change: -2, avatar: null, email: 'olumide.adebayo@rms.com', phone: '+234 806 789 0123', location: 'Lagos, Nigeria', joinDate: 'May 2022', monthlySales: [2, 3, 2, 2, 3, 2, 2, 3, 2, 2, 3, 2], specialization: 'Land', activeListings: 7, closedDeals: 28 },
  { rank: 7, name: 'Funke Oladipo', tier: 'BRONZE', sales: 25, totalValue: 52000000, commission: 1560000, change: 1, avatar: null, email: 'funke.oladipo@rms.com', phone: '+234 807 890 1234', location: 'Benin City, Nigeria', joinDate: 'Jul 2022', monthlySales: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3], specialization: 'Residential', activeListings: 3, closedDeals: 25 },
  { rank: 8, name: 'Chukwudi Nnamdi', tier: 'BRONZE', sales: 22, totalValue: 46000000, commission: 1380000, change: -1, avatar: null, email: 'chukwudi.nnamdi@rms.com', phone: '+234 808 901 2345', location: 'Enugu, Nigeria', joinDate: 'Aug 2022', monthlySales: [1, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2], specialization: 'Land', activeListings: 4, closedDeals: 22 },
  { rank: 9, name: 'Yetunde Alabi', tier: 'BRONZE', sales: 20, totalValue: 41000000, commission: 1230000, change: 3, avatar: null, email: 'yetunde.alabi@rms.com', phone: '+234 809 012 3456', location: 'Abeokuta, Nigeria', joinDate: 'Sep 2022', monthlySales: [1, 2, 1, 2, 2, 1, 2, 2, 1, 2, 2, 2], specialization: 'Residential', activeListings: 2, closedDeals: 20 },
  { rank: 10, name: 'Kelechi Uche', tier: 'BRONZE', sales: 18, totalValue: 37000000, commission: 1110000, change: -1, avatar: null, email: 'kelechi.uche@rms.com', phone: '+234 810 123 4567', location: 'Owerri, Nigeria', joinDate: 'Oct 2022', monthlySales: [1, 1, 2, 2, 1, 2, 1, 2, 1, 2, 1, 2], specialization: 'Land', activeListings: 3, closedDeals: 18 },
];

const allClients: Client[] = [
  { rank: 1, name: 'Alhaji Musa Dantata', propertiesOwned: 12, portfolioValue: 450000000, totalPurchases: 15, memberSince: '2020', avatar: null, email: 'musa.dantata@gmail.com', phone: '+234 811 234 5678', location: 'Kano, Nigeria', monthlyInvestments: [25000000, 35000000, 40000000, 30000000, 45000000, 50000000, 35000000, 40000000, 30000000, 45000000, 35000000, 40000000], preferredType: 'Land & Commercial', pendingOffers: 2, completedDeals: 15 },
  { rank: 2, name: 'Chief Emeka Okafor', propertiesOwned: 9, portfolioValue: 320000000, totalPurchases: 11, memberSince: '2019', avatar: null, email: 'emeka.okafor@yahoo.com', phone: '+234 812 345 6789', location: 'Lagos, Nigeria', monthlyInvestments: [20000000, 25000000, 30000000, 25000000, 35000000, 30000000, 25000000, 30000000, 25000000, 35000000, 20000000, 20000000], preferredType: 'Commercial', pendingOffers: 1, completedDeals: 11 },
  { rank: 3, name: 'Dr. Amina Bello', propertiesOwned: 8, portfolioValue: 280000000, totalPurchases: 10, memberSince: '2021', avatar: null, email: 'amina.bello@gmail.com', phone: '+234 813 456 7890', location: 'Abuja, Nigeria', monthlyInvestments: [18000000, 22000000, 25000000, 28000000, 30000000, 25000000, 22000000, 28000000, 25000000, 22000000, 18000000, 17000000], preferredType: 'Residential', pendingOffers: 0, completedDeals: 10 },
  { rank: 4, name: 'Engr. Chidi Nwachukwu', propertiesOwned: 7, portfolioValue: 195000000, totalPurchases: 8, memberSince: '2020', avatar: null, email: 'chidi.nwachukwu@outlook.com', phone: '+234 814 567 8901', location: 'Port Harcourt, Nigeria', monthlyInvestments: [15000000, 18000000, 16000000, 20000000, 18000000, 15000000, 16000000, 18000000, 15000000, 16000000, 14000000, 14000000], preferredType: 'Land', pendingOffers: 1, completedDeals: 8 },
  { rank: 5, name: 'Mrs. Folake Adeleke', propertiesOwned: 6, portfolioValue: 175000000, totalPurchases: 7, memberSince: '2022', avatar: null, email: 'folake.adeleke@gmail.com', phone: '+234 815 678 9012', location: 'Ibadan, Nigeria', monthlyInvestments: [12000000, 15000000, 18000000, 16000000, 14000000, 15000000, 16000000, 14000000, 15000000, 13000000, 14000000, 13000000], preferredType: 'Residential', pendingOffers: 2, completedDeals: 7 },
  { rank: 6, name: 'Barr. Kunle Ayodele', propertiesOwned: 5, portfolioValue: 145000000, totalPurchases: 6, memberSince: '2021', avatar: null, email: 'kunle.ayodele@law.com', phone: '+234 816 789 0123', location: 'Lagos, Nigeria', monthlyInvestments: [10000000, 12000000, 14000000, 12000000, 13000000, 12000000, 11000000, 13000000, 12000000, 12000000, 12000000, 12000000], preferredType: 'Commercial', pendingOffers: 0, completedDeals: 6 },
  { rank: 7, name: 'Prof. Ibrahim Sule', propertiesOwned: 5, portfolioValue: 120000000, totalPurchases: 5, memberSince: '2022', avatar: null, email: 'ibrahim.sule@uni.edu.ng', phone: '+234 817 890 1234', location: 'Zaria, Nigeria', monthlyInvestments: [8000000, 10000000, 12000000, 10000000, 11000000, 10000000, 9000000, 10000000, 10000000, 10000000, 10000000, 10000000], preferredType: 'Land', pendingOffers: 1, completedDeals: 5 },
  { rank: 8, name: 'Arc. Ngozi Obi', propertiesOwned: 4, portfolioValue: 98000000, totalPurchases: 5, memberSince: '2023', avatar: null, email: 'ngozi.obi@architecture.com', phone: '+234 818 901 2345', location: 'Enugu, Nigeria', monthlyInvestments: [6000000, 8000000, 9000000, 8000000, 9000000, 8000000, 8000000, 9000000, 8000000, 8000000, 8000000, 9000000], preferredType: 'Residential', pendingOffers: 0, completedDeals: 5 },
  { rank: 9, name: 'Hon. Babatunde Raji', propertiesOwned: 4, portfolioValue: 85000000, totalPurchases: 4, memberSince: '2022', avatar: null, email: 'babatunde.raji@gov.ng', phone: '+234 819 012 3456', location: 'Osogbo, Nigeria', monthlyInvestments: [5000000, 7000000, 8000000, 7000000, 8000000, 7000000, 7000000, 8000000, 7000000, 7000000, 7000000, 7000000], preferredType: 'Land', pendingOffers: 1, completedDeals: 4 },
  { rank: 10, name: 'Hajiya Fatima Abubakar', propertiesOwned: 3, portfolioValue: 72000000, totalPurchases: 4, memberSince: '2023', avatar: null, email: 'fatima.abubakar@gmail.com', phone: '+234 820 123 4567', location: 'Kaduna, Nigeria', monthlyInvestments: [4000000, 6000000, 7000000, 6000000, 7000000, 6000000, 6000000, 6000000, 6000000, 6000000, 6000000, 6000000], preferredType: 'Residential', pendingOffers: 0, completedDeals: 4 },
];

const getRankIcon = (rank: number) => {
  if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-500" />;
  if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
  if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />;
  return <span className="w-6 h-6 flex items-center justify-center font-bold text-muted-foreground">{rank}</span>;
};

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

type TimePeriod = 'month' | 'quarter' | 'year' | 'all';

export default function RankingsPage() {
  const [activeTab, setActiveTab] = useState<'realtors' | 'clients'>('realtors');
  const [selectedRealtor, setSelectedRealtor] = useState<Realtor | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('all');

  // Calculate rankings based on time period
  const filteredRealtors = useMemo(() => {
    const currentMonth = 0; // January (index 0)

    return allRealtors.map(realtor => {
      let periodSales: number;
      let periodValue: number;
      let periodCommission: number;

      switch (timePeriod) {
        case 'month':
          periodSales = realtor.monthlySales[currentMonth];
          periodValue = Math.round(realtor.totalValue / 12);
          periodCommission = Math.round(realtor.commission / 12);
          break;
        case 'quarter':
          periodSales = realtor.monthlySales.slice(0, 3).reduce((a, b) => a + b, 0);
          periodValue = Math.round(realtor.totalValue / 4);
          periodCommission = Math.round(realtor.commission / 4);
          break;
        case 'year':
        case 'all':
        default:
          periodSales = realtor.sales;
          periodValue = realtor.totalValue;
          periodCommission = realtor.commission;
      }

      return {
        ...realtor,
        sales: periodSales,
        totalValue: periodValue,
        commission: periodCommission,
      };
    })
    .sort((a, b) => b.sales - a.sales || b.totalValue - a.totalValue)
    .map((realtor, index) => ({
      ...realtor,
      rank: index + 1,
      change: realtor.rank - (index + 1),
    }));
  }, [timePeriod]);

  const filteredClients = useMemo(() => {
    const currentMonth = 0; // January (index 0)

    return allClients.map(client => {
      let periodPurchases: number;
      let periodValue: number;

      switch (timePeriod) {
        case 'month':
          periodPurchases = Math.ceil(client.totalPurchases / 12);
          periodValue = client.monthlyInvestments[currentMonth];
          break;
        case 'quarter':
          periodPurchases = Math.ceil(client.totalPurchases / 4);
          periodValue = client.monthlyInvestments.slice(0, 3).reduce((a, b) => a + b, 0);
          break;
        case 'year':
        case 'all':
        default:
          periodPurchases = client.totalPurchases;
          periodValue = client.portfolioValue;
      }

      return {
        ...client,
        totalPurchases: periodPurchases,
        portfolioValue: periodValue,
      };
    })
    .sort((a, b) => b.portfolioValue - a.portfolioValue || b.totalPurchases - a.totalPurchases)
    .map((client, index) => ({
      ...client,
      rank: index + 1,
    }));
  }, [timePeriod]);

  // Get top performer for featured cards
  const topRealtor = filteredRealtors[0];
  const topClient = filteredClients[0];

  const maxSales = selectedRealtor ? Math.max(...selectedRealtor.monthlySales) : 0;
  const maxInvestment = selectedClient ? Math.max(...selectedClient.monthlyInvestments) : 0;

  const getPeriodLabel = () => {
    switch (timePeriod) {
      case 'month': return 'January 2026';
      case 'quarter': return 'Q1 2026';
      case 'year': return '2025';
      case 'all': return 'All Time';
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex flex-wrap gap-2 justify-between items-center">
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'realtors' ? 'default' : 'outline'}
            onClick={() => setActiveTab('realtors')}
            className="flex items-center gap-2"
          >
            <Award className="w-4 h-4" />
            Realtor Rankings
          </Button>
          <Button
            variant={activeTab === 'clients' ? 'default' : 'outline'}
            onClick={() => setActiveTab('clients')}
            className="flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            Client Rankings
          </Button>
        </div>

        {/* Time Period Filter */}
        <div className="flex gap-2">
          <Button
            variant={timePeriod === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimePeriod('month')}
          >
            <Calendar className="w-4 h-4 mr-2" />
            This Month
          </Button>
          <Button
            variant={timePeriod === 'quarter' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimePeriod('quarter')}
          >
            Quarter
          </Button>
          <Button
            variant={timePeriod === 'year' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimePeriod('year')}
          >
            This Year
          </Button>
          <Button
            variant={timePeriod === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimePeriod('all')}
          >
            All Time
          </Button>
        </div>
      </div>

      {/* Realtor Featured Cards */}
      {activeTab === 'realtors' && topRealtor && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Top Realtor Card */}
          <motion.div
            key={`realtor-${timePeriod}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-gradient-to-br from-yellow-500 to-orange-500 text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  {timePeriod === 'month' ? 'Realtor of the Month' :
                   timePeriod === 'quarter' ? 'Realtor of the Quarter' :
                   timePeriod === 'year' ? 'Realtor of the Year' : 'Top Realtor'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Avatar
                    className="w-16 h-16 border-4 border-white/30 cursor-pointer"
                    onClick={() => setSelectedRealtor(allRealtors.find(r => r.name === topRealtor.name) || null)}
                  >
                    {topRealtor.avatar && <AvatarImage src={topRealtor.avatar} alt={topRealtor.name} />}
                    <AvatarFallback className="bg-white/20 text-white text-xl">
                      {topRealtor.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-bold">{topRealtor.name}</h3>
                    <Badge className="bg-white/20 text-white">{topRealtor.tier}</Badge>
                    <p className="text-sm text-white/80 mt-1">{getPeriodLabel()}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div>
                    <p className="text-2xl font-bold">{topRealtor.sales}</p>
                    <p className="text-sm text-white/80">Sales</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{formatCurrency(topRealtor.totalValue)}</p>
                    <p className="text-sm text-white/80">Total Value</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Stats Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-gradient-to-br from-purple-600 to-indigo-600 text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  {getPeriodLabel()} Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white/10 rounded-lg">
                    <p className="text-3xl font-bold">{filteredRealtors.reduce((acc, r) => acc + r.sales, 0)}</p>
                    <p className="text-sm text-white/80">Total Sales</p>
                  </div>
                  <div className="p-4 bg-white/10 rounded-lg">
                    <p className="text-3xl font-bold">{filteredRealtors.length}</p>
                    <p className="text-sm text-white/80">Active Realtors</p>
                  </div>
                  <div className="p-4 bg-white/10 rounded-lg">
                    <p className="text-2xl font-bold">{formatCurrency(filteredRealtors.reduce((acc, r) => acc + r.totalValue, 0))}</p>
                    <p className="text-sm text-white/80">Total Value</p>
                  </div>
                  <div className="p-4 bg-white/10 rounded-lg">
                    <p className="text-2xl font-bold">{formatCurrency(filteredRealtors.reduce((acc, r) => acc + r.commission, 0))}</p>
                    <p className="text-sm text-white/80">Total Commission</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Client Featured Cards */}
      {activeTab === 'clients' && topClient && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Top Client Card */}
          <motion.div
            key={`client-${timePeriod}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  {timePeriod === 'month' ? 'Client of the Month' :
                   timePeriod === 'quarter' ? 'Client of the Quarter' :
                   timePeriod === 'year' ? 'Client of the Year' : 'Top Client'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Avatar
                    className="w-16 h-16 border-4 border-white/30 cursor-pointer"
                    onClick={() => setSelectedClient(allClients.find(c => c.name === topClient.name) || null)}
                  >
                    {topClient.avatar && <AvatarImage src={topClient.avatar} alt={topClient.name} />}
                    <AvatarFallback className="bg-white/20 text-white text-xl">
                      {topClient.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-bold">{topClient.name}</h3>
                    <Badge className="bg-white/20 text-white">VIP Client</Badge>
                    <p className="text-sm text-white/80 mt-1">{getPeriodLabel()}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div>
                    <p className="text-2xl font-bold">{topClient.propertiesOwned}</p>
                    <p className="text-sm text-white/80">Properties Owned</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{formatCurrency(topClient.portfolioValue)}</p>
                    <p className="text-sm text-white/80">Portfolio Value</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Client Stats Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-gradient-to-br from-blue-600 to-cyan-600 text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  {getPeriodLabel()} Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white/10 rounded-lg">
                    <p className="text-3xl font-bold">{filteredClients.reduce((acc, c) => acc + c.totalPurchases, 0)}</p>
                    <p className="text-sm text-white/80">Total Purchases</p>
                  </div>
                  <div className="p-4 bg-white/10 rounded-lg">
                    <p className="text-3xl font-bold">{filteredClients.length}</p>
                    <p className="text-sm text-white/80">Active Clients</p>
                  </div>
                  <div className="p-4 bg-white/10 rounded-lg col-span-2">
                    <p className="text-2xl font-bold">{formatCurrency(filteredClients.reduce((acc, c) => acc + c.portfolioValue, 0))}</p>
                    <p className="text-sm text-white/80">Total Investment Value</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Realtor Leaderboard */}
      {activeTab === 'realtors' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                Top Realtors Leaderboard - {getPeriodLabel()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredRealtors.map((realtor, index) => (
                  <motion.div
                    key={realtor.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                    onClick={() => setSelectedRealtor(allRealtors.find(r => r.name === realtor.name) || null)}
                    className={`flex items-center gap-4 p-4 rounded-lg cursor-pointer transition-all hover:shadow-md hover:scale-[1.01] ${
                      realtor.rank <= 3
                        ? 'bg-gradient-to-r from-primary/10 to-transparent hover:from-primary/20'
                        : 'bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className="w-10 flex justify-center">
                      {getRankIcon(realtor.rank)}
                    </div>
                    <Avatar>
                      {realtor.avatar && <AvatarImage src={realtor.avatar} alt={realtor.name} />}
                      <AvatarFallback className="bg-primary text-white">
                        {realtor.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{realtor.name}</p>
                        <Badge className={getTierBgClass(realtor.tier)}>{realtor.tier}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{realtor.sales} sales</p>
                    </div>
                    <div className="text-right hidden md:block">
                      <p className="font-semibold">{formatCurrency(realtor.totalValue)}</p>
                      <p className="text-sm text-muted-foreground">Total Value</p>
                    </div>
                    <div className="text-right w-24 hidden lg:block">
                      <p className="font-semibold text-primary">{formatCurrency(realtor.commission)}</p>
                      <p className="text-sm text-muted-foreground">Commission</p>
                    </div>
                    <div className="w-12 text-center hidden md:block">
                      {realtor.change !== 0 && (
                        <span className={`text-sm font-medium ${realtor.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {realtor.change > 0 ? '↑' : '↓'} {Math.abs(realtor.change)}
                        </span>
                      )}
                      {realtor.change === 0 && (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Client Leaderboard */}
      {activeTab === 'clients' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Top Clients Leaderboard - {getPeriodLabel()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredClients.map((client, index) => (
                  <motion.div
                    key={client.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                    onClick={() => setSelectedClient(allClients.find(c => c.name === client.name) || null)}
                    className={`flex items-center gap-4 p-4 rounded-lg cursor-pointer transition-all hover:shadow-md hover:scale-[1.01] ${
                      client.rank <= 3
                        ? 'bg-gradient-to-r from-emerald-500/10 to-transparent hover:from-emerald-500/20'
                        : 'bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className="w-10 flex justify-center">
                      {getRankIcon(client.rank)}
                    </div>
                    <Avatar>
                      {client.avatar && <AvatarImage src={client.avatar} alt={client.name} />}
                      <AvatarFallback className="bg-emerald-600 text-white">
                        {client.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{client.name}</p>
                        {client.rank <= 3 && (
                          <Badge className="bg-emerald-600 text-white">VIP</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">Member since {client.memberSince}</p>
                    </div>
                    <div className="text-right hidden md:block">
                      <div className="flex items-center gap-1 justify-end">
                        <Building className="w-4 h-4 text-muted-foreground" />
                        <p className="font-semibold">{client.propertiesOwned}</p>
                      </div>
                      <p className="text-sm text-muted-foreground">Properties</p>
                    </div>
                    <div className="text-right hidden lg:block">
                      <p className="font-semibold">{formatCurrency(client.portfolioValue)}</p>
                      <p className="text-sm text-muted-foreground">Portfolio Value</p>
                    </div>
                    <div className="text-right w-24 hidden md:block">
                      <div className="flex items-center gap-1 justify-end">
                        <Wallet className="w-4 h-4 text-emerald-600" />
                        <p className="font-semibold text-emerald-600">{client.totalPurchases}</p>
                      </div>
                      <p className="text-sm text-muted-foreground">Purchases</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Realtor Detail Dialog */}
      <Dialog open={!!selectedRealtor} onOpenChange={() => setSelectedRealtor(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedRealtor && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    {selectedRealtor.avatar && <AvatarImage src={selectedRealtor.avatar} alt={selectedRealtor.name} />}
                    <AvatarFallback className="bg-primary text-white text-xl">
                      {selectedRealtor.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{selectedRealtor.name}</span>
                      <Badge className={getTierBgClass(selectedRealtor.tier)}>{selectedRealtor.tier}</Badge>
                      {selectedRealtor.rank <= 3 && <Trophy className="w-5 h-5 text-yellow-500" />}
                    </div>
                    <p className="text-sm text-muted-foreground font-normal">Rank #{selectedRealtor.rank} Realtor</p>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Contact Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedRealtor.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedRealtor.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedRealtor.location}</span>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Target className="w-6 h-6 mx-auto mb-2 text-primary" />
                      <p className="text-2xl font-bold">{selectedRealtor.sales}</p>
                      <p className="text-xs text-muted-foreground">Total Sales</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Wallet className="w-6 h-6 mx-auto mb-2 text-green-600" />
                      <p className="text-2xl font-bold">{formatCurrency(selectedRealtor.commission)}</p>
                      <p className="text-xs text-muted-foreground">Commission Earned</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Building className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                      <p className="text-2xl font-bold">{selectedRealtor.activeListings}</p>
                      <p className="text-xs text-muted-foreground">Active Listings</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Clock className="w-6 h-6 mx-auto mb-2 text-orange-600" />
                      <p className="text-2xl font-bold">{selectedRealtor.joinDate}</p>
                      <p className="text-xs text-muted-foreground">Joined</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Additional Info */}
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">Specialization</p>
                      <p className="font-semibold">{selectedRealtor.specialization}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">Total Sales Value</p>
                      <p className="font-semibold">{formatCurrency(selectedRealtor.totalValue)}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Monthly Sales Chart */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      Monthly Sales Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end gap-2 h-32">
                      {selectedRealtor.monthlySales.map((sales, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <div
                            className="w-full bg-primary rounded-t transition-all"
                            style={{ height: `${(sales / maxSales) * 100}%` }}
                          />
                          <span className="text-xs text-muted-foreground">{months[i]}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Client Detail Dialog */}
      <Dialog open={!!selectedClient} onOpenChange={() => setSelectedClient(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedClient && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-4">
                  <Avatar className="w-16 h-16">
                    {selectedClient.avatar && <AvatarImage src={selectedClient.avatar} alt={selectedClient.name} />}
                    <AvatarFallback className="bg-emerald-600 text-white text-xl">
                      {selectedClient.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{selectedClient.name}</span>
                      {selectedClient.rank <= 3 && (
                        <>
                          <Badge className="bg-emerald-600 text-white">VIP</Badge>
                          <Trophy className="w-5 h-5 text-yellow-500" />
                        </>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground font-normal">Rank #{selectedClient.rank} Client</p>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Contact Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedClient.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedClient.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedClient.location}</span>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Building className="w-6 h-6 mx-auto mb-2 text-primary" />
                      <p className="text-2xl font-bold">{selectedClient.propertiesOwned}</p>
                      <p className="text-xs text-muted-foreground">Properties Owned</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Wallet className="w-6 h-6 mx-auto mb-2 text-green-600" />
                      <p className="text-2xl font-bold">{formatCurrency(selectedClient.portfolioValue)}</p>
                      <p className="text-xs text-muted-foreground">Portfolio Value</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Target className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                      <p className="text-2xl font-bold">{selectedClient.completedDeals}</p>
                      <p className="text-xs text-muted-foreground">Completed Deals</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Clock className="w-6 h-6 mx-auto mb-2 text-orange-600" />
                      <p className="text-2xl font-bold">{selectedClient.memberSince}</p>
                      <p className="text-xs text-muted-foreground">Member Since</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Additional Info */}
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">Preferred Property Type</p>
                      <p className="font-semibold">{selectedClient.preferredType}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">Pending Offers</p>
                      <p className="font-semibold">{selectedClient.pendingOffers}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Monthly Investment Chart */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      Monthly Investment Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end gap-2 h-32">
                      {selectedClient.monthlyInvestments.map((investment, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <div
                            className="w-full bg-emerald-600 rounded-t transition-all"
                            style={{ height: `${(investment / maxInvestment) * 100}%` }}
                          />
                          <span className="text-xs text-muted-foreground">{months[i]}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
