'use client';

import { motion } from 'framer-motion';
import {
  Home,
  TrendingUp,
  FileText,
  DollarSign,
  ArrowUpRight,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { formatCurrency, formatPercentage } from '@/lib/utils';

// Mock client data
const clientData = {
  name: 'John Doe',
  email: 'john.doe@email.com',
  phone: '+1 (555) 123-4567',
  totalProperties: 3,
  totalValue: 2850000,
  totalPurchaseValue: 2450000,
  appreciation: 16.3,
  pendingOffers: 2,
  realtor: {
    name: 'Sarah Johnson',
    email: 'sarah@rms.com',
    phone: '+1 (555) 987-6543',
    tier: 'PLATINUM',
  },
};

const properties = [
  {
    id: 1,
    title: 'Modern Downtown Condo',
    address: '123 Main St, Los Angeles, CA 90012',
    purchasePrice: 650000,
    currentValue: 780000,
    appreciation: 20,
    isListed: false,
    image: null,
  },
  {
    id: 2,
    title: 'Beachfront Villa',
    address: '456 Ocean Dr, Malibu, CA 90265',
    purchasePrice: 1200000,
    currentValue: 1450000,
    appreciation: 20.8,
    isListed: true,
    listingPrice: 1500000,
    image: null,
  },
  {
    id: 3,
    title: 'Mountain Retreat Cabin',
    address: '789 Pine Rd, Big Bear, CA 92315',
    purchasePrice: 600000,
    currentValue: 620000,
    appreciation: 3.3,
    isListed: false,
    image: null,
  },
];

const offers = [
  { property: 'Beachfront Villa', amount: 1420000, status: 'PENDING', buyer: 'Anonymous Buyer', date: '2024-01-20' },
  { property: 'Beachfront Villa', amount: 1380000, status: 'PENDING', buyer: 'Jane Smith', date: '2024-01-18' },
];

export default function ClientDashboard() {
  const totalAppreciation = clientData.totalValue - clientData.totalPurchaseValue;

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
                <h2 className="text-2xl font-bold mb-2">Welcome, {clientData.name}!</h2>
                <p className="text-white/80">Your property portfolio is performing well.</p>
              </div>
              <div className="flex gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold">{clientData.totalProperties}</p>
                  <p className="text-xs text-white/80">Properties</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-300">+{clientData.appreciation}%</p>
                  <p className="text-xs text-white/80">Total Appreciation</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: 'Total Properties', value: clientData.totalProperties, icon: Home, color: 'text-blue-600', bgColor: 'bg-blue-100' },
          { title: 'Portfolio Value', value: formatCurrency(clientData.totalValue), icon: DollarSign, color: 'text-green-600', bgColor: 'bg-green-100' },
          { title: 'Total Appreciation', value: formatCurrency(totalAppreciation), icon: TrendingUp, color: 'text-primary', bgColor: 'bg-primary/10' },
          { title: 'Pending Offers', value: clientData.pendingOffers, icon: FileText, color: 'text-orange-600', bgColor: 'bg-orange-100' },
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
                </div>
                <h3 className="text-2xl font-bold">{stat.value}</h3>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Properties */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                My Properties
              </CardTitle>
              <Button variant="outline" size="sm">View All</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {properties.map((property) => (
                  <div
                    key={property.id}
                    className="flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                  >
                    <div className="w-full md:w-32 h-24 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <Building2 className="w-10 h-10 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold">{property.title}</h4>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {property.address}
                          </p>
                        </div>
                        {property.isListed && (
                          <Badge variant="success">Listed for Sale</Badge>
                        )}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Purchase Price</p>
                          <p className="font-semibold">{formatCurrency(property.purchasePrice)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Current Value</p>
                          <p className="font-semibold text-primary">{formatCurrency(property.currentValue)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Appreciation</p>
                          <p className="font-semibold text-green-600 flex items-center">
                            <ArrowUpRight className="w-4 h-4" />
                            {formatPercentage(property.appreciation)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!property.isListed && (
                        <Button variant="outline" size="sm">List for Sale</Button>
                      )}
                      <Button variant="ghost" size="sm">Details</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Realtor Contact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Your Realtor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-6">
                <Avatar className="w-20 h-20 mx-auto mb-4">
                  <AvatarFallback className="bg-primary text-white text-xl">
                    {clientData.realtor.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <h3 className="font-semibold text-lg">{clientData.realtor.name}</h3>
                <Badge className="mt-1 bg-[#E5E4E2]/20 text-[#6B7280]">
                  {clientData.realtor.tier}
                </Badge>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm">{clientData.realtor.email}</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <Phone className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm">{clientData.realtor.phone}</span>
                </div>
              </div>
              <Button className="w-full mt-4">Contact Realtor</Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Pending Offers */}
      {offers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Pending Offers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {offers.map((offer, index) => (
                  <div
                    key={index}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-lg bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800"
                  >
                    <div>
                      <h4 className="font-semibold">{offer.property}</h4>
                      <p className="text-sm text-muted-foreground">
                        From: {offer.buyer} • {offer.date}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="text-xl font-bold text-primary">{formatCurrency(offer.amount)}</p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="success">Accept</Button>
                        <Button size="sm" variant="outline">Counter</Button>
                        <Button size="sm" variant="destructive">Reject</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
