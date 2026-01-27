'use client';

import { motion } from 'framer-motion';
import {
  DollarSign,
  TrendingUp,
  Award,
  Users,
  Home,
  ArrowUpRight,
  Trophy,
  Target,
  Zap,
  Star,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatCurrency, getTierBgClass } from '@/lib/utils';

// Mock realtor data
const realtorStats = {
  totalSales: 32,
  monthlySales: 5,
  totalCommission: 485000,
  monthlyCommission: 75000,
  taxDeducted: 72750,
  netEarnings: 412250,
  rank: 8,
  loyaltyPoints: 12500,
  tier: 'GOLD',
  clients: 45,
  activeListings: 12,
  isRealtorOfMonth: false,
};

const recentSales = [
  { property: 'Modern Downtown Condo', amount: 650000, commission: 26000, date: '2024-01-15' },
  { property: 'Family Home in Suburbs', amount: 425000, commission: 17000, date: '2024-01-10' },
  { property: 'Luxury Penthouse', amount: 1200000, commission: 48000, date: '2024-01-05' },
];

const achievements = [
  { id: 'first_sale', name: 'First Sale', icon: '🏆', earned: true },
  { id: 'ten_sales', name: 'Rising Star', icon: '⭐', earned: true },
  { id: 'fifty_sales', name: 'Sales Expert', icon: '🌟', earned: false },
  { id: 'million_dollar', name: 'Million Dollar Agent', icon: '💎', earned: false },
];

const leaderboard = [
  { rank: 1, name: 'Sarah Johnson', sales: 45, tier: 'PLATINUM' },
  { rank: 2, name: 'Michael Chen', sales: 38, tier: 'GOLD' },
  { rank: 3, name: 'Emily Davis', sales: 35, tier: 'GOLD' },
  { rank: 8, name: 'You', sales: 32, tier: 'GOLD', isCurrentUser: true },
];

export default function RealtorDashboard() {
  const tierProgress = {
    BRONZE: { min: 0, max: 5000, next: 'SILVER' },
    SILVER: { min: 5000, max: 15000, next: 'GOLD' },
    GOLD: { min: 15000, max: 50000, next: 'PLATINUM' },
    PLATINUM: { min: 50000, max: 100000, next: null },
  };

  const currentTierInfo = tierProgress[realtorStats.tier as keyof typeof tierProgress];
  const progressToNextTier = ((realtorStats.loyaltyPoints - currentTierInfo.min) / (currentTierInfo.max - currentTierInfo.min)) * 100;

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-gradient-to-r from-primary to-primary-600 text-white">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold mb-2">Welcome back, John!</h2>
                <p className="text-white/80">You're doing great this month. Keep up the momentum!</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <Badge className={`${getTierBgClass(realtorStats.tier)} text-lg px-4 py-1`}>
                    {realtorStats.tier}
                  </Badge>
                  <p className="text-xs mt-1 text-white/80">Current Tier</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold">#{realtorStats.rank}</p>
                  <p className="text-xs text-white/80">Ranking</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: 'Total Sales', value: realtorStats.totalSales, icon: Home, color: 'text-blue-600', bgColor: 'bg-blue-100' },
          { title: 'Monthly Sales', value: realtorStats.monthlySales, icon: TrendingUp, color: 'text-green-600', bgColor: 'bg-green-100' },
          { title: 'Total Commission', value: formatCurrency(realtorStats.totalCommission), icon: DollarSign, color: 'text-primary', bgColor: 'bg-primary/10' },
          { title: 'Net Earnings', value: formatCurrency(realtorStats.netEarnings), icon: Zap, color: 'text-purple-600', bgColor: 'bg-purple-100' },
        ].map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-green-500" />
                </div>
                <h3 className="text-2xl font-bold">{stat.value}</h3>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Loyalty Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                Loyalty Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium">{realtorStats.loyaltyPoints.toLocaleString()} points</span>
                  <span className="text-muted-foreground">
                    {currentTierInfo.next ? `${(currentTierInfo.max - realtorStats.loyaltyPoints).toLocaleString()} to ${currentTierInfo.next}` : 'Max Tier'}
                  </span>
                </div>
                <Progress value={progressToNextTier} className="h-3" />
              </div>
              <div className="space-y-3">
                <p className="text-sm font-medium">Tier Benefits</p>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-primary" />
                    4% Commission Rate
                  </li>
                  <li className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-primary" />
                    1.5x Points Multiplier
                  </li>
                  <li className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-primary" />
                    Priority Support
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                Monthly Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leaderboard.map((item) => (
                  <div
                    key={item.rank}
                    className={`flex items-center gap-4 p-3 rounded-lg ${
                      item.isCurrentUser ? 'bg-primary/10 border-2 border-primary' : 'bg-gray-50 dark:bg-gray-800/50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      item.rank <= 3 ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700'
                    }`}>
                      {item.rank}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <Badge className={getTierBgClass(item.tier)} variant="secondary">
                        {item.tier}
                      </Badge>
                    </div>
                    <p className="font-semibold">{item.sales} sales</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Achievements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className={`p-4 rounded-lg text-center ${
                      achievement.earned
                        ? 'bg-primary/10 border-2 border-primary'
                        : 'bg-gray-100 dark:bg-gray-800 opacity-50'
                    }`}
                  >
                    <span className="text-3xl">{achievement.icon}</span>
                    <p className="text-sm font-medium mt-2">{achievement.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {achievement.earned ? 'Earned' : 'Locked'}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Sales */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              Recent Sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-muted-foreground">
                    <th className="pb-4">Property</th>
                    <th className="pb-4">Sale Amount</th>
                    <th className="pb-4">Commission</th>
                    <th className="pb-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {recentSales.map((sale, index) => (
                    <tr key={index} className="text-sm">
                      <td className="py-4 font-medium">{sale.property}</td>
                      <td className="py-4">{formatCurrency(sale.amount)}</td>
                      <td className="py-4 text-primary font-semibold">{formatCurrency(sale.commission)}</td>
                      <td className="py-4 text-muted-foreground">{sale.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
