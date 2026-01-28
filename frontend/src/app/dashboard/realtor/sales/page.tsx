'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign,
  Search,
  TrendingUp,
  Calendar,
  Building2,
  ArrowUpRight,
  FileText,
  Download,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ReceiptModal, ReceiptData } from '@/components/receipt';
import { toast } from 'sonner';

type TimePeriod = 'month' | 'quarter' | 'year' | 'all';

const sales = [
  { id: 1, property: 'Prime Land in Lekki Phase 1', propertyType: 'land', buyer: 'Chukwuemeka Okafor', buyerEmail: 'chukwuemeka@email.com', amount: 285000000, commission: 11400000, date: '2024-01-20', status: 'COMPLETED' },
  { id: 2, property: 'Luxury Duplex in Banana Island', propertyType: 'house', buyer: 'Adebayo Adeleke', buyerEmail: 'adebayo@email.com', amount: 750000000, commission: 30000000, date: '2024-01-18', status: 'COMPLETED' },
  { id: 3, property: 'Commercial Land in Victoria Island', propertyType: 'land', buyer: 'Ngozi Okonkwo', buyerEmail: 'ngozi@email.com', amount: 420000000, commission: 16800000, date: '2024-01-15', status: 'PENDING' },
  { id: 4, property: '3 Bedroom Flat in Ikeja GRA', propertyType: 'house', buyer: 'Emeka Nnamdi', buyerEmail: 'emeka@email.com', amount: 48500000, commission: 1940000, date: '2024-01-12', status: 'COMPLETED' },
  { id: 5, property: 'Residential Land in Ajah', propertyType: 'land', buyer: 'Fatima Ibrahim', buyerEmail: 'fatima@email.com', amount: 62000000, commission: 2480000, date: '2023-12-10', status: 'COMPLETED' },
  { id: 6, property: 'Studio Apartment in Yaba', propertyType: 'house', buyer: 'Tunde Bakare', buyerEmail: 'tunde@email.com', amount: 38000000, commission: 1520000, date: '2023-11-05', status: 'COMPLETED' },
];

export default function RealtorSalesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('all');
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);

  const filterByTimePeriod = (date: string) => {
    const itemDate = new Date(date);
    const now = new Date();

    switch (timePeriod) {
      case 'month':
        return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
      case 'quarter':
        const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        return itemDate >= quarterStart;
      case 'year':
        return itemDate.getFullYear() === now.getFullYear();
      default:
        return true;
    }
  };

  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const matchesSearch = sale.property.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           sale.buyer.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'ALL' || sale.status === filterStatus;
      const matchesTime = filterByTimePeriod(sale.date);
      return matchesSearch && matchesStatus && matchesTime;
    });
  }, [searchTerm, filterStatus, timePeriod]);

  const stats = useMemo(() => {
    const completedSales = filteredSales.filter(s => s.status === 'COMPLETED');
    const totalRevenue = filteredSales.reduce((sum, s) => sum + s.amount, 0);
    const totalCommission = completedSales.reduce((sum, s) => sum + s.commission, 0);

    return [
      { title: 'Total Sales', value: filteredSales.length.toString(), icon: TrendingUp, color: 'text-blue-600', bgColor: 'bg-blue-100' },
      { title: 'Completed', value: completedSales.length.toString(), icon: Calendar, color: 'text-green-600', bgColor: 'bg-green-100' },
      { title: 'Total Revenue', value: formatCurrency(totalRevenue), icon: DollarSign, color: 'text-primary', bgColor: 'bg-primary/10' },
      { title: 'My Commission', value: formatCurrency(totalCommission), icon: DollarSign, color: 'text-purple-600', bgColor: 'bg-purple-100' },
    ];
  }, [filteredSales]);

  const handleViewReceipt = (sale: typeof sales[0]) => {
    const receiptData: ReceiptData = {
      receiptNumber: `REC-${sale.id.toString().padStart(6, '0')}`,
      type: 'sale',
      date: sale.date,
      seller: {
        name: 'Realtor Name', // Would come from auth context
        email: 'realtor@rms.com',
        phone: '+234 xxx xxx xxxx',
      },
      buyer: {
        name: sale.buyer,
        email: sale.buyerEmail,
      },
      property: {
        name: sale.property,
        type: sale.propertyType === 'land' ? 'Land' : 'House',
        address: 'Lagos, Nigeria',
      },
      items: [
        { description: 'Property Sale', amount: sale.amount },
      ],
      subtotal: sale.amount,
      fees: [
        { label: 'Commission (4%)', amount: sale.commission },
      ],
      total: sale.amount,
      status: sale.status === 'COMPLETED' ? 'paid' : 'pending',
    };
    setSelectedReceipt(receiptData);
    setReceiptModalOpen(true);
  };

  const handleExportCSV = () => {
    const headers = ['Property', 'Buyer', 'Amount', 'Commission', 'Date', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredSales.map(sale => [
        `"${sale.property}"`,
        `"${sale.buyer}"`,
        sale.amount,
        sale.commission,
        sale.date,
        sale.status,
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `my-sales-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Sales data exported successfully!');
  };

  const getTimePeriodLabel = () => {
    switch (timePeriod) {
      case 'month': return 'This Month';
      case 'quarter': return 'This Quarter';
      case 'year': return 'This Year';
      default: return 'All Time';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
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
                  <ArrowUpRight className="w-4 h-4 text-green-500" />
                </div>
                <h3 className="text-2xl font-bold">{stat.value}</h3>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Sales List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              My Sales History
              <Badge variant="outline" className="ml-2">{getTimePeriodLabel()}</Badge>
            </CardTitle>
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search sales..."
                  className="pl-9 w-full md:w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                className="px-3 py-2 border rounded-md text-sm"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="ALL">All Status</option>
                <option value="COMPLETED">Completed</option>
                <option value="PENDING">Pending</option>
              </select>
              <select
                className="px-3 py-2 border rounded-md text-sm"
                value={timePeriod}
                onChange={(e) => setTimePeriod(e.target.value as TimePeriod)}
              >
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
                <option value="all">All Time</option>
              </select>
              <Button variant="outline" size="sm" onClick={handleExportCSV}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-muted-foreground border-b">
                    <th className="pb-4 font-medium min-w-[250px]">Property</th>
                    <th className="pb-4 font-medium min-w-[150px]">Buyer</th>
                    <th className="pb-4 font-medium min-w-[130px]">Sale Amount</th>
                    <th className="pb-4 font-medium min-w-[130px]">My Commission</th>
                    <th className="pb-4 font-medium min-w-[100px]">Date</th>
                    <th className="pb-4 font-medium min-w-[100px]">Status</th>
                    <th className="pb-4 font-medium min-w-[100px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-5 h-5 text-primary" />
                          </div>
                          <span className="font-medium">{sale.property}</span>
                        </div>
                      </td>
                      <td className="py-4">{sale.buyer}</td>
                      <td className="py-4 font-semibold">{formatCurrency(sale.amount)}</td>
                      <td className="py-4 text-primary font-semibold">{formatCurrency(sale.commission)}</td>
                      <td className="py-4 text-muted-foreground">{formatDate(sale.date)}</td>
                      <td className="py-4">
                        <Badge variant={sale.status === 'COMPLETED' ? 'success' : 'outline'}>
                          {sale.status}
                        </Badge>
                      </td>
                      <td className="py-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewReceipt(sale)}
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          Receipt
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {filteredSales.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-muted-foreground">
                        No sales found for the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Receipt Modal */}
      <ReceiptModal
        open={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        data={selectedReceipt}
      />
    </div>
  );
}
