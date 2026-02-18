'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Wallet,
  Download,
  Calendar,
  TrendingUp,
  DollarSign,
  Loader2,
  RefreshCw,
  FileText,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { api } from '@/lib/api';

interface PayrollRecord {
  id: string;
  periodStart: string;
  periodEnd: string;
  payDate: string | null;
  baseSalary: number | string;
  overtime: number | string;
  bonus: number | string;
  allowances: { [key: string]: number } | null;
  grossPay: number | string;
  tax: number | string;
  pension: number | string;
  otherDeductions: { [key: string]: number } | null;
  totalDeductions: number | string;
  netPay: number | string;
  currency: string;
  status: string;
  paidAt: string | null;
}

const formatCurrency = (amount: number | string, currency: string = 'NGN') => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numAmount);
};

const formatPeriod = (start: string, end: string) => {
  const endDate = new Date(end);
  return endDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'PAID':
      return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Paid</Badge>;
    case 'APPROVED':
      return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Approved</Badge>;
    case 'PENDING':
      return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">Pending</Badge>;
    case 'DRAFT':
      return <Badge variant="secondary">Draft</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

const toNumber = (value: number | string): number => {
  return typeof value === 'string' ? parseFloat(value) : value;
};

export default function PayslipsPage() {
  const [loading, setLoading] = useState(true);
  const [payslips, setPayslips] = useState<PayrollRecord[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await api.get('/hr/payroll/my');
      const data = res?.data || res;
      setPayslips(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to fetch payslips:', err);
      toast.error(err.message || 'Failed to load payslips');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Get the latest payslip for current month summary
  const latestPayslip = payslips.length > 0 ? payslips[0] : null;

  // Build earnings and deductions breakdown for latest payslip
  const buildBreakdown = (payslip: PayrollRecord | null) => {
    if (!payslip) return { earnings: [], deductions: [], totalEarnings: 0, totalDeductions: 0 };

    const earnings = [
      { label: 'Base Salary', amount: toNumber(payslip.baseSalary) },
    ];

    if (toNumber(payslip.overtime) > 0) {
      earnings.push({ label: 'Overtime', amount: toNumber(payslip.overtime) });
    }

    if (toNumber(payslip.bonus) > 0) {
      earnings.push({ label: 'Bonus', amount: toNumber(payslip.bonus) });
    }

    // Add allowances from JSON field
    if (payslip.allowances && typeof payslip.allowances === 'object') {
      Object.entries(payslip.allowances).forEach(([key, value]) => {
        if (value && value > 0) {
          earnings.push({
            label: key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
            amount: value,
          });
        }
      });
    }

    const deductions = [];

    if (toNumber(payslip.tax) > 0) {
      deductions.push({ label: 'Tax (PAYE)', amount: toNumber(payslip.tax) });
    }

    if (toNumber(payslip.pension) > 0) {
      deductions.push({ label: 'Pension', amount: toNumber(payslip.pension) });
    }

    // Add other deductions from JSON field
    if (payslip.otherDeductions && typeof payslip.otherDeductions === 'object') {
      Object.entries(payslip.otherDeductions).forEach(([key, value]) => {
        if (value && value > 0) {
          deductions.push({
            label: key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
            amount: value,
          });
        }
      });
    }

    return {
      earnings,
      deductions,
      totalEarnings: toNumber(payslip.grossPay),
      totalDeductions: toNumber(payslip.totalDeductions),
    };
  };

  const breakdown = buildBreakdown(latestPayslip);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Payslips</h1>
          <p className="text-muted-foreground">View your salary details and payment history</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {payslips.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <Wallet className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No payslips yet</p>
            <p className="text-sm">Your salary information will appear here once processed</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Current Month Summary */}
          {latestPayslip && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border-primary/20 border-2">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Wallet className="w-8 h-8 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {formatPeriod(latestPayslip.periodStart, latestPayslip.periodEnd)}
                        </p>
                        <p className="text-3xl font-bold">
                          {formatCurrency(latestPayslip.netPay, latestPayslip.currency)}
                        </p>
                        <p className="text-sm text-muted-foreground">Net Salary</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {getStatusBadge(latestPayslip.status)}
                      {latestPayslip.payDate && (
                        <p className="text-sm text-muted-foreground">
                          {latestPayslip.status === 'PAID' ? 'Paid on' : 'Pay date:'} {formatDate(latestPayslip.payDate)}
                        </p>
                      )}
                      <Button variant="outline" className="gap-2">
                        <Download className="w-4 h-4" />
                        Download
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Salary Breakdown */}
          {latestPayslip && (
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Earnings */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-600">
                      <TrendingUp className="w-5 h-5" />
                      Earnings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {breakdown.earnings.map((item) => (
                        <div key={item.label} className="flex items-center justify-between py-2 border-b last:border-0">
                          <span className="text-sm">{item.label}</span>
                          <span className="font-medium text-green-600">
                            +{formatCurrency(item.amount, latestPayslip.currency)}
                          </span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between pt-2 font-semibold">
                        <span>Total Earnings</span>
                        <span className="text-green-600">
                          {formatCurrency(breakdown.totalEarnings, latestPayslip.currency)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Deductions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-600">
                      <DollarSign className="w-5 h-5" />
                      Deductions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {breakdown.deductions.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">No deductions</p>
                      ) : (
                        breakdown.deductions.map((item) => (
                          <div key={item.label} className="flex items-center justify-between py-2 border-b last:border-0">
                            <span className="text-sm">{item.label}</span>
                            <span className="font-medium text-red-600">
                              -{formatCurrency(item.amount, latestPayslip.currency)}
                            </span>
                          </div>
                        ))
                      )}
                      <div className="flex items-center justify-between pt-2 font-semibold">
                        <span>Total Deductions</span>
                        <span className="text-red-600">
                          {formatCurrency(breakdown.totalDeductions, latestPayslip.currency)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          )}

          {/* Net Salary Card */}
          {latestPayslip && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-primary text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-primary-foreground/80">
                        Net Salary for {formatPeriod(latestPayslip.periodStart, latestPayslip.periodEnd)}
                      </p>
                      <p className="text-4xl font-bold mt-2">
                        {formatCurrency(latestPayslip.netPay, latestPayslip.currency)}
                      </p>
                    </div>
                    <div className="text-right text-sm">
                      <p>Gross: {formatCurrency(latestPayslip.grossPay, latestPayslip.currency)}</p>
                      <p>Deductions: -{formatCurrency(latestPayslip.totalDeductions, latestPayslip.currency)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Payment History */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Payment History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period</TableHead>
                      <TableHead>Gross Salary</TableHead>
                      <TableHead>Net Salary</TableHead>
                      <TableHead>Payment Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payslips.map((payslip) => (
                      <TableRow key={payslip.id}>
                        <TableCell className="font-medium">
                          {formatPeriod(payslip.periodStart, payslip.periodEnd)}
                        </TableCell>
                        <TableCell>{formatCurrency(payslip.grossPay, payslip.currency)}</TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(payslip.netPay, payslip.currency)}
                        </TableCell>
                        <TableCell>{formatDate(payslip.payDate || payslip.paidAt)}</TableCell>
                        <TableCell>{getStatusBadge(payslip.status)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" className="gap-1">
                            <Download className="w-4 h-4" />
                            PDF
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </div>
  );
}
