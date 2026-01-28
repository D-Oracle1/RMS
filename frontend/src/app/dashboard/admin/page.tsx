'use client';

import { motion } from 'framer-motion';
import {
  Users,
  Home,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Award,
  Building2,
  Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { formatCurrency, getTierBgClass } from '@/lib/utils';

// Mock data
const stats = [
  {
    title: 'Total Realtors',
    value: '245',
    change: '+12%',
    trend: 'up',
    icon: Users,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  {
    title: 'Active Properties',
    value: '1,892',
    change: '+8%',
    trend: 'up',
    icon: Home,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  {
    title: 'Monthly Sales',
    value: '₦4.2B',
    change: '+23%',
    trend: 'up',
    icon: DollarSign,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    title: 'Commission Paid',
    value: '₦168M',
    change: '-5%',
    trend: 'down',
    icon: TrendingUp,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
];

const recentSales = [
  {
    id: 1,
    property: 'Prime Land in Lekki Phase 1',
    realtor: 'Sarah Johnson',
    amount: 285000000,
    time: '2 hours ago',
    tier: 'PLATINUM',
  },
  {
    id: 2,
    property: 'Luxury Duplex in Banana Island',
    realtor: 'Michael Chen',
    amount: 750000000,
    time: '4 hours ago',
    tier: 'GOLD',
  },
  {
    id: 3,
    property: '3 Bedroom Flat in Ikeja GRA',
    realtor: 'Emily Davis',
    amount: 48500000,
    time: '6 hours ago',
    tier: 'SILVER',
  },
  {
    id: 4,
    property: 'Commercial Land in Victoria Island',
    realtor: 'James Wilson',
    amount: 420000000,
    time: '8 hours ago',
    tier: 'GOLD',
  },
];

const topRealtors = [
  { name: 'Sarah Johnson', sales: 45, value: 1250000000, tier: 'PLATINUM', avatar: '' },
  { name: 'Michael Chen', sales: 38, value: 980000000, tier: 'GOLD', avatar: '' },
  { name: 'Emily Davis', sales: 32, value: 720000000, tier: 'GOLD', avatar: '' },
  { name: 'James Wilson', sales: 28, value: 610000000, tier: 'SILVER', avatar: '' },
  { name: 'Lisa Brown', sales: 25, value: 540000000, tier: 'SILVER', avatar: '' },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div className={`flex items-center gap-1 text-sm ${
                    stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.trend === 'up' ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4" />
                    )}
                    {stat.change}
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-2xl font-bold">{stat.value}</h3>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Sales Feed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Real-Time Sales Feed
              </CardTitle>
              <Badge variant="outline" className="animate-pulse-subtle">
                <span className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                Live
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentSales.map((sale, index) => (
                  <motion.div
                    key={sale.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{sale.property}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{sale.realtor}</span>
                          <Badge className={getTierBgClass(sale.tier)} variant="secondary">
                            {sale.tier}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary">{formatCurrency(sale.amount)}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {sale.time}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Performers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                Top Performers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topRealtors.map((realtor, index) => (
                  <div key={realtor.name} className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 font-semibold text-sm">
                      {index + 1}
                    </div>
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-primary text-white">
                        {realtor.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{realtor.name}</p>
                      <div className="flex items-center gap-2">
                        <Badge className={getTierBgClass(realtor.tier)} variant="secondary">
                          {realtor.tier}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {realtor.sales} sales
                        </span>
                      </div>
                    </div>
                    <p className="text-sm font-semibold">{formatCurrency(realtor.value)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Tier Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Realtor Tier Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              {[
                { tier: 'PLATINUM', count: 12, total: 245, color: '#E5E4E2' },
                { tier: 'GOLD', count: 45, total: 245, color: '#FFD700' },
                { tier: 'SILVER', count: 78, total: 245, color: '#C0C0C0' },
                { tier: 'BRONZE', count: 110, total: 245, color: '#CD7F32' },
              ].map((item) => (
                <div key={item.tier} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge className={getTierBgClass(item.tier)} variant="secondary">
                      {item.tier}
                    </Badge>
                    <span className="text-sm font-medium">{item.count}</span>
                  </div>
                  <Progress
                    value={(item.count / item.total) * 100}
                    className="h-2"
                    style={{ '--progress-color': item.color } as any}
                  />
                  <p className="text-xs text-muted-foreground">
                    {((item.count / item.total) * 100).toFixed(1)}% of total
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
