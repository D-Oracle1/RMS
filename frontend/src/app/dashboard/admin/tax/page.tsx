'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Search,
  Download,
  DollarSign,
  TrendingUp,
  Percent,
  Settings,
  Save,
  Calendar,
  CheckCircle,
  Clock,
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
import { api } from '@/lib/api';

type TimePeriod = 'month' | 'quarter' | 'year' | 'all';

const taxReports = [
  { id: 1, realtor: 'Chioma Adeyemi', email: 'chioma.adeyemi@rms.com', tier: 'PLATINUM', grossCommission: 50000000, taxRate: 15, taxAmount: 7500000, netEarnings: 42500000, year: 2026, month: 0, status: 'FILED' },
  { id: 2, realtor: 'Emeka Okonkwo', email: 'emeka.okonkwo@rms.com', tier: 'GOLD', grossCommission: 39200000, taxRate: 15, taxAmount: 5880000, netEarnings: 33320000, year: 2026, month: 0, status: 'FILED' },
  { id: 3, realtor: 'Aisha Mohammed', email: 'aisha.mohammed@rms.com', tier: 'GOLD', grossCommission: 28800000, taxRate: 15, taxAmount: 4320000, netEarnings: 24480000, year: 2025, month: 11, status: 'PENDING' },
  { id: 4, realtor: 'Tunde Bakare', email: 'tunde.bakare@rms.com', tier: 'SILVER', grossCommission: 24400000, taxRate: 15, taxAmount: 3660000, netEarnings: 20740000, year: 2025, month: 10, status: 'FILED' },
  { id: 5, realtor: 'Ngozi Eze', email: 'ngozi.eze@rms.com', tier: 'SILVER', grossCommission: 21600000, taxRate: 15, taxAmount: 3240000, netEarnings: 18360000, year: 2025, month: 9, status: 'PENDING' },
  { id: 6, realtor: 'Olumide Adebayo', email: 'olumide.adebayo@rms.com', tier: 'SILVER', grossCommission: 18000000, taxRate: 15, taxAmount: 2700000, netEarnings: 15300000, year: 2025, month: 8, status: 'FILED' },
  { id: 7, realtor: 'Funke Oladipo', email: 'funke.oladipo@rms.com', tier: 'BRONZE', grossCommission: 15600000, taxRate: 15, taxAmount: 2340000, netEarnings: 13260000, year: 2025, month: 7, status: 'FILED' },
  { id: 8, realtor: 'Chukwudi Nnamdi', email: 'chukwudi.nnamdi@rms.com', tier: 'BRONZE', grossCommission: 12000000, taxRate: 15, taxAmount: 1800000, netEarnings: 10200000, year: 2025, month: 6, status: 'FILED' },
];

interface TaxSettings {
  standardRate: number;
  withholdingRate: number;
  vatRate: number;
  stampDutyRate: number;
}

const defaultTaxSettings: TaxSettings = {
  standardRate: 15,
  withholdingRate: 10,
  vatRate: 7.5,
  stampDutyRate: 0.5,
};

export default function TaxPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('all');
  const [showTaxSettings, setShowTaxSettings] = useState(false);
  const [taxSettings, setTaxSettings] = useState<TaxSettings>(defaultTaxSettings);
  const [editingSettings, setEditingSettings] = useState<TaxSettings>(defaultTaxSettings);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [taxRecords, setTaxRecords] = useState(taxReports);

  // Fetch tax rates from API on mount
  const fetchTaxRates = useCallback(async () => {
    try {
      const data = await api.get<{ incomeTax: number; withholdingTax: number; vat: number; stampDuty: number }>('/settings/tax-rates');
      setTaxSettings({
        standardRate: Math.round(data.incomeTax * 100 * 100) / 100,
        withholdingRate: Math.round(data.withholdingTax * 100 * 100) / 100,
        vatRate: Math.round(data.vat * 100 * 100) / 100,
        stampDutyRate: Math.round(data.stampDuty * 100 * 100) / 100,
      });
    } catch {
      // Keep existing defaults on failure
    }
  }, []);

  // Fetch tax records from API on mount
  const fetchTaxRecords = useCallback(async () => {
    try {
      const data = await api.get<typeof taxReports>('/taxes?limit=50');
      if (Array.isArray(data) && data.length > 0) {
        setTaxRecords(data);
      }
    } catch {
      // Keep mock data as fallback
    }
  }, []);

  useEffect(() => {
    fetchTaxRates();
    fetchTaxRecords();
  }, [fetchTaxRates, fetchTaxRecords]);

  // Filter by time period
  const filteredByTime = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return taxRecords.filter(report => {
      switch (timePeriod) {
        case 'month':
          return report.month === currentMonth && report.year === currentYear;
        case 'quarter':
          const currentQuarter = Math.floor(currentMonth / 3);
          const reportQuarter = Math.floor(report.month / 3);
          return reportQuarter === currentQuarter && report.year === currentYear;
        case 'year':
          return report.year === currentYear || report.year === currentYear - 1;
        case 'all':
        default:
          return true;
      }
    });
  }, [timePeriod, taxRecords]);

  const filteredReports = filteredByTime.filter(report => {
    return report.realtor.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Calculate stats based on filtered data
  const stats = useMemo(() => {
    const totalTax = filteredByTime.reduce((acc, r) => acc + r.taxAmount, 0);
    const filedCount = filteredByTime.filter(r => r.status === 'FILED').length;
    const pendingCount = filteredByTime.filter(r => r.status === 'PENDING').length;

    return [
      { title: 'Total Tax Collected', value: formatCurrency(totalTax), icon: DollarSign, color: 'text-primary', bgColor: 'bg-primary/10' },
      { title: 'Current Tax Rate', value: `${taxSettings.standardRate}%`, icon: Percent, color: 'text-blue-600', bgColor: 'bg-blue-100' },
      { title: 'Reports Filed', value: filedCount.toString(), icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100' },
      { title: 'Pending Reports', value: pendingCount.toString(), icon: Clock, color: 'text-orange-600', bgColor: 'bg-orange-100' },
    ];
  }, [filteredByTime, taxSettings.standardRate]);

  const handleSaveSettings = async () => {
    try {
      await api.put('/settings/tax-rates', {
        incomeTax: editingSettings.standardRate / 100,
        withholdingTax: editingSettings.withholdingRate / 100,
        vat: editingSettings.vatRate / 100,
        stampDuty: editingSettings.stampDutyRate / 100,
      });
      setTaxSettings(editingSettings);
      setShowTaxSettings(false);
      toast.success('Tax rates updated successfully!');
    } catch {
      toast.error('Failed to update tax rates. Please try again.');
    }
  };

  const generateTaxStatement = (report: typeof taxReports[0]) => {
    const receipt: ReceiptData = {
      type: 'tax',
      receiptNumber: `TAX-${report.year}-${report.id.toString().padStart(6, '0')}`,
      date: `${report.year}-${(report.month + 1).toString().padStart(2, '0')}-01`,
      seller: {
        name: 'RMS Platform - Tax Division',
        email: 'tax@rms.com',
        phone: '+234 800 123 4567',
        address: 'Victoria Island, Lagos, Nigeria',
      },
      buyer: {
        name: report.realtor,
        email: report.email,
      },
      items: [
        {
          description: 'Gross Commission Earnings',
          amount: report.grossCommission,
        },
        {
          description: `Income Tax Deduction (${report.taxRate}%)`,
          amount: -report.taxAmount,
        },
      ],
      subtotal: report.grossCommission,
      fees: [
        {
          label: `Tax (${report.taxRate}%)`,
          amount: report.taxAmount,
        },
      ],
      total: report.netEarnings,
      status: report.status === 'FILED' ? 'completed' : 'pending',
      notes: `Tax Year: ${report.year} | This document serves as an official tax deduction statement for income tax purposes.`,
    };

    setReceiptData(receipt);
    setShowReceipt(true);
  };

  const handleExportAll = () => {
    // In a real implementation, this would generate a CSV/Excel file
    const csvContent = [
      ['Realtor', 'Tier', 'Gross Commission', 'Tax Rate', 'Tax Amount', 'Net Earnings', 'Status'].join(','),
      ...filteredReports.map(r =>
        [r.realtor, r.tier, r.grossCommission, `${r.taxRate}%`, r.taxAmount, r.netEarnings, r.status].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `tax-reports-${timePeriod}.csv`;
    link.click();

    toast.success('Tax reports exported successfully!');
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
        <h1 className="text-2xl font-bold">Tax Management</h1>
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
        {/* Tax Rate Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Percent className="w-5 h-5 text-primary" />
                Tax Rates
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => {
                setEditingSettings(taxSettings);
                setShowTaxSettings(true);
              }}>
                <Settings className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Standard Income Tax</span>
                  <span className="text-xl font-bold text-primary">{taxSettings.standardRate}%</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Applied to all commission earnings</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Withholding Tax</span>
                  <span className="text-xl font-bold text-blue-600">{taxSettings.withholdingRate}%</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">For non-resident realtors</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">VAT Rate</span>
                  <span className="text-xl font-bold text-green-600">{taxSettings.vatRate}%</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Value Added Tax on services</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Stamp Duty</span>
                  <span className="text-xl font-bold text-orange-600">{taxSettings.stampDutyRate}%</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">On property transactions</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tax Reports */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Tax Reports - {getPeriodLabel()}
              </CardTitle>
              <div className="flex flex-wrap gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search realtors..."
                    className="pl-9 w-40"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button variant="outline" onClick={handleExportAll}>
                  <Download className="w-4 h-4 mr-2" />
                  Export All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead>
                    <tr className="text-left text-sm text-muted-foreground border-b">
                      <th className="pb-4 font-medium w-[180px]">Realtor</th>
                      <th className="pb-4 font-medium text-right w-[130px]">Gross Commission</th>
                      <th className="pb-4 font-medium text-center w-[80px]">Tax Rate</th>
                      <th className="pb-4 font-medium text-right w-[120px]">Tax Amount</th>
                      <th className="pb-4 font-medium text-right w-[130px]">Net Earnings</th>
                      <th className="pb-4 font-medium text-center w-[90px]">Status</th>
                      <th className="pb-4 font-medium text-center w-[100px]">Statement</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredReports.map((report) => (
                      <tr key={report.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8 shrink-0">
                              <AvatarFallback className="bg-primary text-white text-xs">
                                {report.realtor.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{report.realtor}</p>
                              <Badge className={`${getTierBgClass(report.tier)} text-xs`}>{report.tier}</Badge>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 font-medium text-right">{formatCurrency(report.grossCommission)}</td>
                        <td className="py-4 text-center">{report.taxRate}%</td>
                        <td className="py-4 text-red-600 font-medium text-right">-{formatCurrency(report.taxAmount)}</td>
                        <td className="py-4 text-primary font-semibold text-right">{formatCurrency(report.netEarnings)}</td>
                        <td className="py-4 text-center">
                          <Badge className={report.status === 'FILED' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}>
                            {report.status}
                          </Badge>
                        </td>
                        <td className="py-4 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => generateTaxStatement(report)}
                          >
                            <FileText className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredReports.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No tax reports found for the selected period.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Tax Settings Dialog */}
      <Dialog open={showTaxSettings} onOpenChange={setShowTaxSettings}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Edit Tax Rates
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Standard Income Tax Rate (%)</label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={editingSettings.standardRate}
                onChange={(e) => setEditingSettings(prev => ({ ...prev, standardRate: parseFloat(e.target.value) || 0 }))}
              />
              <p className="text-xs text-muted-foreground">Applied to all realtor commission earnings</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Withholding Tax Rate (%)</label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={editingSettings.withholdingRate}
                onChange={(e) => setEditingSettings(prev => ({ ...prev, withholdingRate: parseFloat(e.target.value) || 0 }))}
              />
              <p className="text-xs text-muted-foreground">For non-resident realtors only</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">VAT Rate (%)</label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={editingSettings.vatRate}
                onChange={(e) => setEditingSettings(prev => ({ ...prev, vatRate: parseFloat(e.target.value) || 0 }))}
              />
              <p className="text-xs text-muted-foreground">Value Added Tax on services</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Stamp Duty Rate (%)</label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={editingSettings.stampDutyRate}
                onChange={(e) => setEditingSettings(prev => ({ ...prev, stampDutyRate: parseFloat(e.target.value) || 0 }))}
              />
              <p className="text-xs text-muted-foreground">On property transactions</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTaxSettings(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSettings}>
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
