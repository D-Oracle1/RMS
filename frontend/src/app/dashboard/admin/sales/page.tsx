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
  ArrowDownRight,
  CheckCircle,
  XCircle,
  Loader2,
  FileText,
  Download,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatCurrency, formatDate, getTierBgClass } from '@/lib/utils';
import { api } from '@/lib/api';
import { ReceiptModal, ReceiptData } from '@/components/receipt';
import { toast } from 'sonner';

type TimePeriod = 'month' | 'quarter' | 'year' | 'all';

const sales = [
  { id: 1, property: 'Prime Land in Lekki Phase 1', propertyType: 'Land', buyer: 'Chukwuemeka Okafor', buyerEmail: 'chukwuemeka@email.com', seller: 'Lagos Estates Ltd', realtor: 'Chioma Adeyemi', realtorEmail: 'chioma.adeyemi@rms.com', realtorTier: 'PLATINUM', amount: 285000000, commission: 14250000, date: '2026-01-20', status: 'COMPLETED' },
  { id: 2, property: 'Luxury Duplex in Banana Island', propertyType: 'Residential', buyer: 'Adebayo Adeleke', buyerEmail: 'adebayo@email.com', seller: 'Urban Investments', realtor: 'Emeka Okonkwo', realtorEmail: 'emeka.okonkwo@rms.com', realtorTier: 'GOLD', amount: 750000000, commission: 30000000, date: '2026-01-18', status: 'COMPLETED' },
  { id: 3, property: 'Commercial Land in Victoria Island', propertyType: 'Commercial', buyer: 'Ngozi Okonkwo', buyerEmail: 'ngozi@email.com', seller: 'VI Properties Inc', realtor: 'Chioma Adeyemi', realtorEmail: 'chioma.adeyemi@rms.com', realtorTier: 'PLATINUM', amount: 420000000, commission: 21000000, date: '2026-01-15', status: 'PENDING' },
  { id: 4, property: '3 Bedroom Flat in Ikeja GRA', propertyType: 'Residential', buyer: 'Emeka Nnamdi', buyerEmail: 'emeka.n@email.com', seller: 'Home Sellers Ltd', realtor: 'Aisha Mohammed', realtorEmail: 'aisha.mohammed@rms.com', realtorTier: 'GOLD', amount: 48500000, commission: 1940000, date: '2025-12-12', status: 'COMPLETED' },
  { id: 5, property: 'Residential Land in Ajah', propertyType: 'Land', buyer: 'Fatima Ibrahim', buyerEmail: 'fatima@email.com', seller: 'Nature Homes', realtor: 'Tunde Bakare', realtorEmail: 'tunde.bakare@rms.com', realtorTier: 'SILVER', amount: 62000000, commission: 2170000, date: '2025-11-10', status: 'PENDING' },
  { id: 6, property: 'Office Space in Ikoyi', propertyType: 'Commercial', buyer: 'Corporate Holdings Ltd', buyerEmail: 'corp@holdings.com', seller: 'Ikoyi Realty', realtor: 'Ngozi Eze', realtorEmail: 'ngozi.eze@rms.com', realtorTier: 'SILVER', amount: 180000000, commission: 6300000, date: '2025-10-05', status: 'COMPLETED' },
  { id: 7, property: 'Land in Epe', propertyType: 'Land', buyer: 'Investment Group', buyerEmail: 'invest@group.com', seller: 'Epe Developers', realtor: 'Olumide Adebayo', realtorEmail: 'olumide.adebayo@rms.com', realtorTier: 'SILVER', amount: 35000000, commission: 1225000, date: '2025-09-20', status: 'COMPLETED' },
  { id: 8, property: '2 Bedroom Apartment in Yaba', propertyType: 'Residential', buyer: 'Young Professional', buyerEmail: 'young@pro.com', seller: 'Yaba Properties', realtor: 'Funke Oladipo', realtorEmail: 'funke.oladipo@rms.com', realtorTier: 'BRONZE', amount: 28000000, commission: 840000, date: '2025-08-15', status: 'CANCELLED' },
];

export default function SalesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('all');
  const [salesData, setSalesData] = useState(sales);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  // Filter by time period
  const filteredByTime = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return salesData.filter(sale => {
      const saleDate = new Date(sale.date);
      const saleMonth = saleDate.getMonth();
      const saleYear = saleDate.getFullYear();

      switch (timePeriod) {
        case 'month':
          return saleMonth === currentMonth && saleYear === currentYear;
        case 'quarter':
          const currentQuarter = Math.floor(currentMonth / 3);
          const saleQuarter = Math.floor(saleMonth / 3);
          return saleQuarter === currentQuarter && saleYear === currentYear;
        case 'year':
          return saleYear === currentYear || saleYear === currentYear - 1;
        case 'all':
        default:
          return true;
      }
    });
  }, [salesData, timePeriod]);

  const filteredSales = filteredByTime.filter(sale => {
    const matchesSearch = sale.property.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sale.realtor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sale.buyer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || sale.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Calculate stats based on filtered data
  const stats = useMemo(() => {
    const totalSales = filteredByTime.filter(s => s.status === 'COMPLETED').reduce((acc, s) => acc + s.amount, 0);
    const totalTransactions = filteredByTime.filter(s => s.status === 'COMPLETED').length;
    const avgSalePrice = totalTransactions > 0 ? totalSales / totalTransactions : 0;
    const pendingCount = filteredByTime.filter(s => s.status === 'PENDING').length;

    return [
      { title: 'Total Sales', value: formatCurrency(totalSales), change: '+18%', trend: 'up', icon: DollarSign, color: 'text-primary', bgColor: 'bg-primary/10' },
      { title: 'Completed', value: totalTransactions.toString(), change: '+23%', trend: 'up', icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100' },
      { title: 'Pending', value: pendingCount.toString(), change: '', trend: 'up', icon: TrendingUp, color: 'text-orange-600', bgColor: 'bg-orange-100' },
      { title: 'Avg. Sale Price', value: formatCurrency(avgSalePrice), change: '-3%', trend: 'down', icon: Building2, color: 'text-purple-600', bgColor: 'bg-purple-100' },
    ];
  }, [filteredByTime]);

  const handleConfirmSale = async (saleId: number) => {
    setProcessingId(saleId);
    try {
      await api.patch(`/sales/${saleId}/status`, { status: 'COMPLETED' });
      setSalesData(prev => prev.map(sale =>
        sale.id === saleId ? { ...sale, status: 'COMPLETED' } : sale
      ));
      toast.success('Sale confirmed successfully!');
    } catch (error) {
      // Demo fallback
      setSalesData(prev => prev.map(sale =>
        sale.id === saleId ? { ...sale, status: 'COMPLETED' } : sale
      ));
      toast.success('Sale confirmed successfully! (Demo)');
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancelSale = async (saleId: number) => {
    if (!confirm('Are you sure you want to cancel this sale?')) return;

    setProcessingId(saleId);
    try {
      await api.patch(`/sales/${saleId}/status`, { status: 'CANCELLED' });
      setSalesData(prev => prev.map(sale =>
        sale.id === saleId ? { ...sale, status: 'CANCELLED' } : sale
      ));
      toast.success('Sale cancelled.');
    } catch (error) {
      // Demo fallback
      setSalesData(prev => prev.map(sale =>
        sale.id === saleId ? { ...sale, status: 'CANCELLED' } : sale
      ));
      toast.success('Sale cancelled. (Demo)');
    } finally {
      setProcessingId(null);
    }
  };

  const generateReceipt = (sale: typeof sales[0]) => {
    const taxRate = 15;
    const taxAmount = sale.commission * (taxRate / 100);

    const receipt: ReceiptData = {
      type: 'sale',
      receiptNumber: `SALE-${sale.id.toString().padStart(6, '0')}`,
      date: formatDate(sale.date),
      from: {
        name: sale.seller,
        address: 'Lagos, Nigeria',
      },
      to: {
        name: sale.buyer,
        email: sale.buyerEmail,
      },
      propertyDetails: {
        name: sale.property,
        address: 'Lagos, Nigeria',
        type: sale.propertyType,
      },
      items: [
        {
          description: `Property Sale: ${sale.property}`,
          quantity: 1,
          unitPrice: sale.amount,
          amount: sale.amount,
        },
      ],
      subtotal: sale.amount,
      commission: {
        rate: (sale.commission / sale.amount) * 100,
        amount: sale.commission,
      },
      total: sale.amount,
      status: sale.status === 'COMPLETED' ? 'completed' : sale.status === 'CANCELLED' ? 'cancelled' : 'pending',
      notes: `Realtor: ${sale.realtor} (${sale.realtorTier}) | Commission: ${formatCurrency(sale.commission)}`,
    };

    setReceiptData(receipt);
    setShowReceipt(true);
  };

  const handleExportAll = () => {
    const csvContent = [
      ['Property', 'Buyer', 'Seller', 'Realtor', 'Amount', 'Commission', 'Date', 'Status'].join(','),
      ...filteredSales.map(s =>
        [s.property, s.buyer, s.seller, s.realtor, s.amount, s.commission, s.date, s.status].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `sales-report-${timePeriod}.csv`;
    link.click();

    toast.success('Sales report exported!');
  };

  const getPeriodLabel = () => {
    switch (timePeriod) {
      case 'month': return 'This Month';
      case 'quarter': return 'This Quarter';
      case 'year': return 'This Year';
      case 'all': return 'All Time';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Time Filter */}
      <div className="flex flex-wrap gap-4 justify-between items-center">
        <h1 className="text-2xl font-bold">Sales Management</h1>
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
                  {stat.change && (
                    <div className={`flex items-center gap-1 text-sm ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                      {stat.trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                      {stat.change}
                    </div>
                  )}
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
              Sales History - {getPeriodLabel()}
            </CardTitle>
            <div className="flex flex-wrap gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search sales..."
                  className="pl-9 w-40"
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
                <option value="CANCELLED">Cancelled</option>
              </select>
              <Button variant="outline" onClick={handleExportAll}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead>
                  <tr className="text-left text-sm text-muted-foreground border-b">
                    <th className="pb-4 font-medium w-[220px]">Property</th>
                    <th className="pb-4 font-medium w-[130px]">Buyer</th>
                    <th className="pb-4 font-medium w-[150px]">Realtor</th>
                    <th className="pb-4 font-medium text-right w-[120px]">Amount</th>
                    <th className="pb-4 font-medium text-right w-[100px]">Commission</th>
                    <th className="pb-4 font-medium text-center w-[90px]">Date</th>
                    <th className="pb-4 font-medium text-center w-[90px]">Status</th>
                    <th className="pb-4 font-medium text-center w-[160px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Building2 className="w-5 h-5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate" title={sale.property}>{sale.property}</p>
                            <p className="text-xs text-muted-foreground">{sale.propertyType}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <p className="text-sm truncate" title={sale.buyer}>{sale.buyer}</p>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8 shrink-0">
                            <AvatarFallback className="bg-primary text-white text-xs">
                              {sale.realtor.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{sale.realtor}</p>
                            <Badge className={`${getTierBgClass(sale.realtorTier)} text-xs`}>{sale.realtorTier}</Badge>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 font-semibold text-right">{formatCurrency(sale.amount)}</td>
                      <td className="py-4 text-primary font-medium text-right">{formatCurrency(sale.commission)}</td>
                      <td className="py-4 text-muted-foreground text-center text-sm">{formatDate(sale.date)}</td>
                      <td className="py-4 text-center">
                        <Badge className={
                          sale.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                          sale.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                          'bg-orange-100 text-orange-800'
                        }>
                          {sale.status}
                        </Badge>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center justify-center gap-1">
                          {sale.status === 'PENDING' && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-green-600 hover:bg-green-50 h-8 px-2"
                                onClick={() => handleConfirmSale(sale.id)}
                                disabled={processingId === sale.id}
                              >
                                {processingId === sale.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <CheckCircle className="w-4 h-4" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-600 hover:bg-red-50 h-8 px-2"
                                onClick={() => handleCancelSale(sale.id)}
                                disabled={processingId === sale.id}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2"
                            onClick={() => generateReceipt(sale)}
                          >
                            <FileText className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredSales.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No sales found for the selected filters.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Receipt Modal */}
      <ReceiptModal
        open={showReceipt}
        onClose={() => setShowReceipt(false)}
        data={receiptData}
      />
    </div>
  );
}
