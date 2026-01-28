'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Calculator,
  Search,
  DollarSign,
  TrendingUp,
  CheckCircle,
  Clock,
  Settings,
  Save,
  FileText,
  Calendar,
  Download,
  Send,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { formatCurrency, formatDate, getTierBgClass } from '@/lib/utils';
import { ReceiptModal, ReceiptData } from '@/components/receipt';
import { toast } from 'sonner';

type TimePeriod = 'month' | 'quarter' | 'year' | 'all';

const commissions = [
  { id: 1, realtor: 'Chioma Adeyemi', email: 'chioma.adeyemi@rms.com', tier: 'PLATINUM', sale: 'Prime Land in Lekki Phase 1', saleAmount: 285000000, rate: 5.0, commission: 14250000, status: 'PAID', date: '2026-01-20' },
  { id: 2, realtor: 'Emeka Okonkwo', email: 'emeka.okonkwo@rms.com', tier: 'GOLD', sale: 'Luxury Duplex in Banana Island', saleAmount: 750000000, rate: 4.0, commission: 30000000, status: 'PAID', date: '2026-01-18' },
  { id: 3, realtor: 'Chioma Adeyemi', email: 'chioma.adeyemi@rms.com', tier: 'PLATINUM', sale: 'Commercial Land in Victoria Island', saleAmount: 420000000, rate: 5.0, commission: 21000000, status: 'PENDING', date: '2026-01-15' },
  { id: 4, realtor: 'Aisha Mohammed', email: 'aisha.mohammed@rms.com', tier: 'GOLD', sale: '3 Bedroom Flat in Ikeja GRA', saleAmount: 48500000, rate: 4.0, commission: 1940000, status: 'PAID', date: '2025-12-12' },
  { id: 5, realtor: 'Tunde Bakare', email: 'tunde.bakare@rms.com', tier: 'SILVER', sale: 'Residential Land in Ajah', saleAmount: 62000000, rate: 3.5, commission: 2170000, status: 'PROCESSING', date: '2025-11-10' },
  { id: 6, realtor: 'Ngozi Eze', email: 'ngozi.eze@rms.com', tier: 'SILVER', sale: 'Office Space in Ikoyi', saleAmount: 180000000, rate: 3.5, commission: 6300000, status: 'PAID', date: '2025-10-05' },
  { id: 7, realtor: 'Olumide Adebayo', email: 'olumide.adebayo@rms.com', tier: 'SILVER', sale: 'Land in Epe', saleAmount: 35000000, rate: 3.5, commission: 1225000, status: 'PAID', date: '2025-09-20' },
  { id: 8, realtor: 'Funke Oladipo', email: 'funke.oladipo@rms.com', tier: 'BRONZE', sale: '2 Bedroom Apartment in Yaba', saleAmount: 28000000, rate: 3.0, commission: 840000, status: 'PAID', date: '2025-08-15' },
];

const defaultTierRates = [
  { tier: 'PLATINUM', rate: 5.0, realtors: 12, minSales: 40 },
  { tier: 'GOLD', rate: 4.0, realtors: 45, minSales: 25 },
  { tier: 'SILVER', rate: 3.5, realtors: 78, minSales: 10 },
  { tier: 'BRONZE', rate: 3.0, realtors: 110, minSales: 0 },
];

export default function CommissionPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('all');
  const [showRateSettings, setShowRateSettings] = useState(false);
  const [tierRates, setTierRates] = useState(defaultTierRates);
  const [editingRates, setEditingRates] = useState(defaultTierRates);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  // Filter commissions by time period
  const filteredByTime = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return commissions.filter(commission => {
      const commissionDate = new Date(commission.date);
      const commissionMonth = commissionDate.getMonth();
      const commissionYear = commissionDate.getFullYear();

      switch (timePeriod) {
        case 'month':
          return commissionMonth === currentMonth && commissionYear === currentYear;
        case 'quarter':
          const currentQuarter = Math.floor(currentMonth / 3);
          const commissionQuarter = Math.floor(commissionMonth / 3);
          return commissionQuarter === currentQuarter && commissionYear === currentYear;
        case 'year':
          return commissionYear === currentYear || commissionYear === currentYear - 1;
        case 'all':
        default:
          return true;
      }
    });
  }, [timePeriod]);

  const filteredCommissions = filteredByTime.filter(commission => {
    const matchesSearch = commission.realtor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         commission.sale.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || commission.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Calculate stats based on filtered data
  const stats = useMemo(() => {
    const paidTotal = filteredByTime.filter(c => c.status === 'PAID').reduce((acc, c) => acc + c.commission, 0);
    const pendingTotal = filteredByTime.filter(c => c.status === 'PENDING').reduce((acc, c) => acc + c.commission, 0);
    const processingTotal = filteredByTime.filter(c => c.status === 'PROCESSING').reduce((acc, c) => acc + c.commission, 0);
    const totalCommission = filteredByTime.reduce((acc, c) => acc + c.commission, 0);
    const avgRate = filteredByTime.length > 0
      ? filteredByTime.reduce((acc, c) => acc + c.rate, 0) / filteredByTime.length
      : 0;

    return [
      { title: 'Total Paid', value: formatCurrency(paidTotal), icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100' },
      { title: 'Pending', value: formatCurrency(pendingTotal), icon: Clock, color: 'text-orange-600', bgColor: 'bg-orange-100' },
      { title: 'Processing', value: formatCurrency(processingTotal), icon: TrendingUp, color: 'text-blue-600', bgColor: 'bg-blue-100' },
      { title: 'Avg. Rate', value: `${avgRate.toFixed(1)}%`, icon: Calculator, color: 'text-primary', bgColor: 'bg-primary/10' },
    ];
  }, [filteredByTime]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID': return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case 'PENDING': return <Badge className="bg-orange-100 text-orange-800">Pending</Badge>;
      case 'PROCESSING': return <Badge className="bg-blue-100 text-blue-800">Processing</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const handleSaveRates = () => {
    setTierRates(editingRates);
    setShowRateSettings(false);
    toast.success('Commission rates updated successfully!');
  };

  const handleRateChange = (tier: string, newRate: number) => {
    setEditingRates(prev => prev.map(r =>
      r.tier === tier ? { ...r, rate: newRate } : r
    ));
  };

  const generateReceipt = (commission: typeof commissions[0]) => {
    const taxRate = 15;
    const taxAmount = commission.commission * (taxRate / 100);
    const netAmount = commission.commission - taxAmount;

    const receipt: ReceiptData = {
      type: 'commission',
      receiptNumber: `COM-${commission.id.toString().padStart(6, '0')}`,
      date: formatDate(commission.date),
      from: {
        name: 'RMS Platform',
        email: 'payments@rms.com',
        phone: '+234 800 123 4567',
        address: 'Victoria Island, Lagos, Nigeria',
      },
      to: {
        name: commission.realtor,
        email: commission.email,
      },
      propertyDetails: {
        name: commission.sale,
        address: 'Lagos, Nigeria',
        type: 'Property Sale',
      },
      items: [
        {
          description: `Commission for: ${commission.sale}`,
          amount: commission.commission,
        },
      ],
      subtotal: commission.commission,
      tax: {
        rate: taxRate,
        amount: taxAmount,
      },
      total: netAmount,
      status: commission.status === 'PAID' ? 'paid' : 'pending',
      notes: `Commission rate: ${commission.rate}% | Sale Amount: ${formatCurrency(commission.saleAmount)}`,
    };

    setReceiptData(receipt);
    setShowReceipt(true);
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
      {/* Time Period Filter */}
      <div className="flex flex-wrap gap-2 justify-between items-center">
        <h1 className="text-2xl font-bold">Commission Management</h1>
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
                <div className={`inline-flex p-3 rounded-lg ${stat.bgColor} mb-4`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <h3 className="text-2xl font-bold">{stat.value}</h3>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Commission Rates by Tier */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-primary" />
                Commission Rates
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => {
                setEditingRates(tierRates);
                setShowRateSettings(true);
              }}>
                <Settings className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {tierRates.map((tier) => (
                <div key={tier.tier} className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge className={getTierBgClass(tier.tier)}>{tier.tier}</Badge>
                    <span className="text-xl font-bold text-primary">{tier.rate}%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{tier.realtors} realtors</span>
                    <span>Min. {tier.minSales} sales</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Commission History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-primary" />
                Commission Payments - {getPeriodLabel()}
              </CardTitle>
              <div className="flex flex-wrap gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
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
                  <option value="PAID">Paid</option>
                  <option value="PENDING">Pending</option>
                  <option value="PROCESSING">Processing</option>
                </select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr className="text-left text-sm text-muted-foreground border-b">
                      <th className="pb-4 font-medium w-[200px]">Realtor</th>
                      <th className="pb-4 font-medium w-[200px]">Sale</th>
                      <th className="pb-4 font-medium text-right w-[120px]">Amount</th>
                      <th className="pb-4 font-medium text-center w-[60px]">Rate</th>
                      <th className="pb-4 font-medium text-right w-[120px]">Commission</th>
                      <th className="pb-4 font-medium text-center w-[100px]">Status</th>
                      <th className="pb-4 font-medium text-center w-[80px]">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredCommissions.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <Avatar className="w-8 h-8 shrink-0">
                              <AvatarFallback className="bg-primary text-white text-xs">
                                {item.realtor.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{item.realtor}</p>
                              <Badge className={`${getTierBgClass(item.tier)} text-xs`}>{item.tier}</Badge>
                            </div>
                          </div>
                        </td>
                        <td className="py-4">
                          <p className="text-sm truncate max-w-[180px]" title={item.sale}>{item.sale}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(item.date)}</p>
                        </td>
                        <td className="py-4 text-sm text-right">{formatCurrency(item.saleAmount)}</td>
                        <td className="py-4 text-sm text-center">{item.rate}%</td>
                        <td className="py-4 font-semibold text-primary text-right">{formatCurrency(item.commission)}</td>
                        <td className="py-4 text-center">{getStatusBadge(item.status)}</td>
                        <td className="py-4 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => generateReceipt(item)}
                          >
                            <FileText className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredCommissions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No commissions found for the selected filters.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Rate Settings Dialog */}
      <Dialog open={showRateSettings} onOpenChange={setShowRateSettings}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Edit Commission Rates
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {editingRates.map((tier) => (
              <div key={tier.tier} className="flex items-center gap-4">
                <Badge className={`${getTierBgClass(tier.tier)} w-24 justify-center`}>{tier.tier}</Badge>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={tier.rate}
                      onChange={(e) => handleRateChange(tier.tier, parseFloat(e.target.value) || 0)}
                      className="w-24"
                    />
                    <span className="text-muted-foreground">%</span>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {tier.realtors} realtors
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRateSettings(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRates}>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Modal */}
      <ReceiptModal
        open={showReceipt}
        onClose={() => setShowReceipt(false)}
        data={receiptData}
      />
    </div>
  );
}
