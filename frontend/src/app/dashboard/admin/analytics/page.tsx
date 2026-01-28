'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Home,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Download,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

type TimePeriod = 'month' | 'quarter' | 'year' | 'all';

const analyticsData = {
  month: {
    stats: [
      { title: 'Total Revenue', value: 425000000, change: '+18%', trend: 'up', icon: DollarSign, color: 'text-primary', bgColor: 'bg-primary/10' },
      { title: 'Properties Sold', value: 15, change: '+23%', trend: 'up', icon: Home, color: 'text-green-600', bgColor: 'bg-green-100' },
      { title: 'New Clients', value: 8, change: '+12%', trend: 'up', icon: Users, color: 'text-blue-600', bgColor: 'bg-blue-100' },
      { title: 'Avg. Sale Price', value: 68500000, change: '-3%', trend: 'down', icon: TrendingUp, color: 'text-purple-600', bgColor: 'bg-purple-100' },
    ],
    monthlyData: [
      { month: 'Week 1', sales: 3, revenue: 95000000 },
      { month: 'Week 2', sales: 4, revenue: 120000000 },
      { month: 'Week 3', sales: 5, revenue: 145000000 },
      { month: 'Week 4', sales: 3, revenue: 65000000 },
    ],
    propertyTypes: [
      { type: 'Land', count: 6, percentage: 40, revenue: 170000000 },
      { type: 'House', count: 5, percentage: 33, revenue: 155000000 },
      { type: 'Flat', count: 3, percentage: 20, revenue: 75000000 },
      { type: 'Commercial', count: 1, percentage: 7, revenue: 25000000 },
    ],
    topLocations: [
      { location: 'Lekki Phase 1', sales: 5, avgPrice: 85000000 },
      { location: 'Victoria Island', sales: 4, avgPrice: 120000000 },
      { location: 'Ajah', sales: 3, avgPrice: 42000000 },
      { location: 'Banana Island', sales: 2, avgPrice: 350000000 },
      { location: 'Ikeja GRA', sales: 1, avgPrice: 65000000 },
    ],
  },
  quarter: {
    stats: [
      { title: 'Total Revenue', value: 1275000000, change: '+22%', trend: 'up', icon: DollarSign, color: 'text-primary', bgColor: 'bg-primary/10' },
      { title: 'Properties Sold', value: 42, change: '+18%', trend: 'up', icon: Home, color: 'text-green-600', bgColor: 'bg-green-100' },
      { title: 'New Clients', value: 25, change: '+15%', trend: 'up', icon: Users, color: 'text-blue-600', bgColor: 'bg-blue-100' },
      { title: 'Avg. Sale Price', value: 72000000, change: '+5%', trend: 'up', icon: TrendingUp, color: 'text-purple-600', bgColor: 'bg-purple-100' },
    ],
    monthlyData: [
      { month: 'Oct', sales: 12, revenue: 380000000 },
      { month: 'Nov', sales: 15, revenue: 470000000 },
      { month: 'Dec', sales: 15, revenue: 425000000 },
    ],
    propertyTypes: [
      { type: 'Land', count: 18, percentage: 43, revenue: 548000000 },
      { type: 'House', count: 12, percentage: 29, revenue: 420000000 },
      { type: 'Flat', count: 8, percentage: 19, revenue: 210000000 },
      { type: 'Commercial', count: 4, percentage: 9, revenue: 97000000 },
    ],
    topLocations: [
      { location: 'Lekki Phase 1', sales: 12, avgPrice: 90000000 },
      { location: 'Victoria Island', sales: 10, avgPrice: 125000000 },
      { location: 'Ajah', sales: 8, avgPrice: 45000000 },
      { location: 'Banana Island', sales: 6, avgPrice: 380000000 },
      { location: 'Ikeja GRA', sales: 6, avgPrice: 70000000 },
    ],
  },
  year: {
    stats: [
      { title: 'Total Revenue', value: 4250000000, change: '+28%', trend: 'up', icon: DollarSign, color: 'text-primary', bgColor: 'bg-primary/10' },
      { title: 'Properties Sold', value: 156, change: '+23%', trend: 'up', icon: Home, color: 'text-green-600', bgColor: 'bg-green-100' },
      { title: 'New Clients', value: 89, change: '+12%', trend: 'up', icon: Users, color: 'text-blue-600', bgColor: 'bg-blue-100' },
      { title: 'Avg. Sale Price', value: 68500000, change: '+8%', trend: 'up', icon: TrendingUp, color: 'text-purple-600', bgColor: 'bg-purple-100' },
    ],
    monthlyData: [
      { month: 'Jan', sales: 12, revenue: 420000000 },
      { month: 'Feb', sales: 15, revenue: 510000000 },
      { month: 'Mar', sales: 18, revenue: 630000000 },
      { month: 'Apr', sales: 14, revenue: 480000000 },
      { month: 'May', sales: 20, revenue: 720000000 },
      { month: 'Jun', sales: 22, revenue: 810000000 },
      { month: 'Jul', sales: 8, revenue: 280000000 },
      { month: 'Aug', sales: 10, revenue: 350000000 },
      { month: 'Sep', sales: 12, revenue: 420000000 },
      { month: 'Oct', sales: 15, revenue: 510000000 },
      { month: 'Nov', sales: 15, revenue: 470000000 },
      { month: 'Dec', sales: 15, revenue: 425000000 },
    ],
    propertyTypes: [
      { type: 'Land', count: 55, percentage: 35, revenue: 1487500000 },
      { type: 'House', count: 48, percentage: 31, revenue: 1317500000 },
      { type: 'Flat', count: 32, percentage: 21, revenue: 892500000 },
      { type: 'Commercial', count: 21, percentage: 13, revenue: 552500000 },
    ],
    topLocations: [
      { location: 'Victoria Island', sales: 35, avgPrice: 120000000 },
      { location: 'Lekki Phase 1', sales: 28, avgPrice: 85000000 },
      { location: 'Ajah', sales: 25, avgPrice: 42000000 },
      { location: 'Ikeja GRA', sales: 18, avgPrice: 65000000 },
      { location: 'Banana Island', sales: 12, avgPrice: 350000000 },
    ],
  },
  all: {
    stats: [
      { title: 'Total Revenue', value: 12750000000, change: '+45%', trend: 'up', icon: DollarSign, color: 'text-primary', bgColor: 'bg-primary/10' },
      { title: 'Properties Sold', value: 468, change: '+38%', trend: 'up', icon: Home, color: 'text-green-600', bgColor: 'bg-green-100' },
      { title: 'New Clients', value: 267, change: '+25%', trend: 'up', icon: Users, color: 'text-blue-600', bgColor: 'bg-blue-100' },
      { title: 'Avg. Sale Price', value: 72500000, change: '+12%', trend: 'up', icon: TrendingUp, color: 'text-purple-600', bgColor: 'bg-purple-100' },
    ],
    monthlyData: [
      { month: '2022', sales: 120, revenue: 3200000000 },
      { month: '2023', sales: 192, revenue: 5300000000 },
      { month: '2024', sales: 156, revenue: 4250000000 },
    ],
    propertyTypes: [
      { type: 'Land', count: 165, percentage: 35, revenue: 4462500000 },
      { type: 'House', count: 144, percentage: 31, revenue: 3952500000 },
      { type: 'Flat', count: 96, percentage: 21, revenue: 2677500000 },
      { type: 'Commercial', count: 63, percentage: 13, revenue: 1657500000 },
    ],
    topLocations: [
      { location: 'Victoria Island', sales: 105, avgPrice: 125000000 },
      { location: 'Lekki Phase 1', sales: 84, avgPrice: 90000000 },
      { location: 'Ajah', sales: 75, avgPrice: 48000000 },
      { location: 'Ikeja GRA', sales: 54, avgPrice: 68000000 },
      { location: 'Banana Island', sales: 36, avgPrice: 380000000 },
    ],
  },
};

export default function AnalyticsPage() {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('year');

  const data = analyticsData[timePeriod];
  const maxRevenue = Math.max(...data.monthlyData.map(d => d.revenue));
  const totalSales = data.topLocations.reduce((sum, loc) => sum + loc.sales, 0);

  const getTimePeriodLabel = () => {
    switch (timePeriod) {
      case 'month': return 'This Month';
      case 'quarter': return 'This Quarter';
      case 'year': return 'This Year';
      default: return 'All Time';
    }
  };

  const handleExportReport = () => {
    const headers = ['Metric', 'Value'];
    const rows = [
      ['Period', getTimePeriodLabel()],
      ['Total Revenue', formatCurrency(data.stats[0].value)],
      ['Properties Sold', data.stats[1].value.toString()],
      ['New Clients', data.stats[2].value.toString()],
      ['Avg. Sale Price', formatCurrency(data.stats[3].value)],
      [''],
      ['Property Type', 'Count', 'Revenue'],
      ...data.propertyTypes.map(pt => [pt.type, pt.count.toString(), formatCurrency(pt.revenue)]),
      [''],
      ['Location', 'Sales', 'Avg. Price'],
      ...data.topLocations.map(loc => [loc.location, loc.sales.toString(), formatCurrency(loc.avgPrice)]),
    ];

    const csvContent = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-report-${timePeriod}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Analytics report exported successfully!');
  };

  return (
    <div className="space-y-6">
      {/* Time Period Filter */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Overview of your business performance</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={timePeriod === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimePeriod('month')}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Month
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
            Year
          </Button>
          <Button
            variant={timePeriod === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimePeriod('all')}
          >
            All Time
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportReport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {data.stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div className={`flex items-center gap-1 text-sm ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    {stat.change}
                  </div>
                </div>
                <h3 className="text-2xl font-bold">
                  {typeof stat.value === 'number' && stat.title.includes('Price') || stat.title.includes('Revenue')
                    ? formatCurrency(stat.value)
                    : stat.value}
                </h3>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Monthly Sales Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Revenue Overview
              </CardTitle>
              <Badge variant="outline">{getTimePeriodLabel()}</Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.monthlyData.map((item) => (
                  <div key={item.month} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{item.month}</span>
                      <span className="text-muted-foreground">
                        {formatCurrency(item.revenue)} ({item.sales} sales)
                      </span>
                    </div>
                    <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(item.revenue / maxRevenue) * 100}%` }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                        className="h-full bg-primary rounded-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Property Types Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="w-5 h-5 text-primary" />
                Sales by Property Type
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.propertyTypes.map((type) => (
                  <div key={type.type} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{type.type}</span>
                        <Badge variant="secondary">{type.count} sales</Badge>
                      </div>
                      <span className="text-muted-foreground">{formatCurrency(type.revenue)}</span>
                    </div>
                    <Progress value={type.percentage} className="h-2" />
                    <p className="text-xs text-muted-foreground">{type.percentage}% of total</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Top Locations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Top Performing Locations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-muted-foreground border-b">
                    <th className="pb-4 font-medium min-w-[180px]">Location</th>
                    <th className="pb-4 font-medium min-w-[120px]">Total Sales</th>
                    <th className="pb-4 font-medium min-w-[150px]">Avg. Sale Price</th>
                    <th className="pb-4 font-medium min-w-[150px]">Market Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.topLocations.map((location, index) => (
                    <tr key={location.location} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                            {index + 1}
                          </span>
                          <span className="font-medium">{location.location}</span>
                        </div>
                      </td>
                      <td className="py-4">{location.sales} properties</td>
                      <td className="py-4 font-semibold text-primary">{formatCurrency(location.avgPrice)}</td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <Progress value={(location.sales / totalSales) * 100} className="h-2 w-24" />
                          <span className="text-sm text-muted-foreground">
                            {((location.sales / totalSales) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </td>
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
