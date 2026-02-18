'use client';

import { forwardRef } from 'react';
import { Building2 } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

export interface ReceiptData {
  type: 'sale' | 'commission' | 'tax' | 'offer';
  receiptNumber: string;
  date: string;
  // Parties
  seller?: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  buyer?: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  // Property Details
  property?: {
    name: string;
    type: string;
    address: string;
  };
  // Items
  items: {
    description: string;
    quantity?: number;
    unitPrice?: number;
    amount: number;
  }[];
  // Summary
  subtotal: number;
  fees?: {
    label: string;
    amount: number;
  }[];
  total: number;
  // Status
  status: 'paid' | 'pending' | 'completed' | 'cancelled';
  // Payment history (for installment sales)
  paymentHistory?: {
    number: number;
    amount: number;
    date: string;
    method?: string;
    reference?: string;
    commission?: number;
    tax?: number;
  }[];
  totalPaid?: number;
  remainingBalance?: number;
  // Additional info
  notes?: string;
}

interface ReceiptProps {
  data: ReceiptData;
  className?: string;
  branding?: {
    companyName?: string;
    supportEmail?: string;
    supportPhone?: string;
    address?: string;
  };
}

export const Receipt = forwardRef<HTMLDivElement, ReceiptProps>(
  ({ data, className = '', branding }, ref) => {
    const brandName = branding?.companyName || 'RMS Platform';
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'paid':
        case 'completed':
          return 'bg-green-100 text-green-800';
        case 'pending':
          return 'bg-yellow-100 text-yellow-800';
        case 'cancelled':
          return 'bg-red-100 text-red-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    };

    const getReceiptTitle = (type: string) => {
      switch (type) {
        case 'sale':
          return 'Sales Receipt';
        case 'commission':
          return 'Commission Receipt';
        case 'tax':
          return 'Tax Statement';
        case 'offer':
          return 'Offer Confirmation';
        default:
          return 'Receipt';
      }
    };

    return (
      <div
        ref={ref}
        className={`bg-white p-8 max-w-2xl mx-auto ${className}`}
        style={{ fontFamily: 'Arial, sans-serif' }}
      >
        {/* Header */}
        <div className="flex justify-between items-start border-b pb-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{brandName}</h1>
              <p className="text-sm text-gray-500">Realtors Management System</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-semibold text-gray-900">{getReceiptTitle(data.type)}</h2>
            <p className="text-sm text-gray-500">#{data.receiptNumber}</p>
            <p className="text-sm text-gray-500">{formatDate(data.date)}</p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="mb-6">
          <span className={`px-3 py-1 rounded-full text-sm font-medium uppercase ${getStatusColor(data.status)}`}>
            {data.status}
          </span>
        </div>

        {/* Parties */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          {data.seller && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">From (Seller)</h3>
              <p className="font-semibold text-gray-900">{data.seller.name}</p>
              {data.seller.email && <p className="text-sm text-gray-600">{data.seller.email}</p>}
              {data.seller.phone && <p className="text-sm text-gray-600">{data.seller.phone}</p>}
              {data.seller.address && <p className="text-sm text-gray-600">{data.seller.address}</p>}
            </div>
          )}
          {data.buyer && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">To (Buyer)</h3>
              <p className="font-semibold text-gray-900">{data.buyer.name}</p>
              {data.buyer.email && <p className="text-sm text-gray-600">{data.buyer.email}</p>}
              {data.buyer.phone && <p className="text-sm text-gray-600">{data.buyer.phone}</p>}
              {data.buyer.address && <p className="text-sm text-gray-600">{data.buyer.address}</p>}
            </div>
          )}
        </div>

        {/* Property Details */}
        {data.property && (
          <div className="mb-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Property Details</h3>
            <p className="font-semibold text-gray-900">{data.property.name}</p>
            <p className="text-sm text-gray-600">{data.property.address}</p>
            <p className="text-sm text-gray-600">Type: {data.property.type}</p>
          </div>
        )}

        {/* Items Table */}
        <div className="mb-8">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 text-sm font-semibold text-gray-500 uppercase">Description</th>
                {data.items.some(item => item.quantity) && (
                  <th className="text-center py-3 text-sm font-semibold text-gray-500 uppercase">Qty</th>
                )}
                {data.items.some(item => item.unitPrice) && (
                  <th className="text-right py-3 text-sm font-semibold text-gray-500 uppercase">Unit Price</th>
                )}
                <th className="text-right py-3 text-sm font-semibold text-gray-500 uppercase">Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, index) => (
                <tr key={index} className="border-b">
                  <td className="py-3 text-gray-900">{item.description}</td>
                  {data.items.some(i => i.quantity) && (
                    <td className="text-center py-3 text-gray-600">{item.quantity || '-'}</td>
                  )}
                  {data.items.some(i => i.unitPrice) && (
                    <td className="text-right py-3 text-gray-600">
                      {item.unitPrice ? formatCurrency(item.unitPrice) : '-'}
                    </td>
                  )}
                  <td className="text-right py-3 font-medium text-gray-900">{formatCurrency(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="border-t pt-4">
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatCurrency(data.subtotal)}</span>
              </div>
              {data.fees && data.fees.map((fee, index) => (
                <div key={index} className="flex justify-between text-gray-600">
                  <span>{fee.label}</span>
                  <span className={fee.amount < 0 ? 'text-red-600' : ''}>
                    {fee.amount < 0 ? '' : '+'}{formatCurrency(Math.abs(fee.amount))}
                  </span>
                </div>
              ))}
              <div className="flex justify-between text-lg font-bold text-gray-900 border-t pt-2">
                <span>Total</span>
                <span>{formatCurrency(data.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment History */}
        {data.paymentHistory && data.paymentHistory.length > 0 && (
          <div className="mt-8">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Payment History</h3>
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase">#</th>
                  <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase">Method</th>
                  <th className="text-right py-2 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.paymentHistory.map((p) => (
                  <tr key={p.number} className="border-b">
                    <td className="py-2 text-sm text-gray-600">{p.number}</td>
                    <td className="py-2 text-sm text-gray-600">{formatDate(p.date)}</td>
                    <td className="py-2 text-sm text-gray-600">
                      {p.method?.replace('_', ' ') || '—'}
                      {p.reference ? <span className="text-xs text-gray-400 ml-1">({p.reference})</span> : ''}
                    </td>
                    <td className="py-2 text-sm text-gray-900 font-medium text-right">{formatCurrency(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t">
                  <td colSpan={3} className="py-2 text-sm font-semibold text-gray-700">Total Paid</td>
                  <td className="py-2 text-sm font-bold text-gray-900 text-right">
                    {formatCurrency(data.totalPaid ?? data.paymentHistory.reduce((sum, p) => sum + p.amount, 0))}
                  </td>
                </tr>
                {data.remainingBalance !== undefined && data.remainingBalance > 0 && (
                  <tr>
                    <td colSpan={3} className="py-1 text-sm font-semibold text-orange-600">Remaining Balance</td>
                    <td className="py-1 text-sm font-bold text-orange-600 text-right">{formatCurrency(data.remainingBalance)}</td>
                  </tr>
                )}
              </tfoot>
            </table>
          </div>
        )}

        {/* Notes */}
        {data.notes && (
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Notes</h3>
            <p className="text-sm text-gray-600">{data.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t text-center text-sm text-gray-500">
          <p>Thank you for your business!</p>
          <p className="mt-2">{brandName}{branding?.address ? ` | ${branding.address}` : ''}{branding?.supportEmail ? ` | ${branding.supportEmail}` : ''}{branding?.supportPhone ? ` | ${branding.supportPhone}` : ''}</p>
        </div>
      </div>
    );
  }
);

Receipt.displayName = 'Receipt';
