'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Search,
  Plus,
  MoreHorizontal,
  Mail,
  Phone,
  Eye,
  Edit,
  UserX,
  UserCheck,
  Trash2,
  Download,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatCurrency, getTierBgClass } from '@/lib/utils';
import { toast } from 'sonner';

const initialRealtors = [
  { id: 1, name: 'Adaeze Okonkwo', email: 'adaeze@rms.com.ng', phone: '+234 801 234 5678', tier: 'PLATINUM', sales: 45, totalValue: 1250000000, commission: 50000000, status: 'ACTIVE', avatar: null as string | null },
  { id: 2, name: 'Chinedu Eze', email: 'chinedu@rms.com.ng', phone: '+234 802 345 6789', tier: 'GOLD', sales: 38, totalValue: 980000000, commission: 39200000, status: 'ACTIVE', avatar: null as string | null },
  { id: 3, name: 'Funke Adeyemi', email: 'funke@rms.com.ng', phone: '+234 803 456 7890', tier: 'GOLD', sales: 32, totalValue: 720000000, commission: 28800000, status: 'ACTIVE', avatar: null as string | null },
  { id: 4, name: 'Emeka Nwankwo', email: 'emeka@rms.com.ng', phone: '+234 804 567 8901', tier: 'SILVER', sales: 28, totalValue: 610000000, commission: 24400000, status: 'ACTIVE', avatar: null as string | null },
  { id: 5, name: 'Ngozi Obi', email: 'ngozi@rms.com.ng', phone: '+234 805 678 9012', tier: 'SILVER', sales: 25, totalValue: 540000000, commission: 21600000, status: 'ACTIVE', avatar: null as string | null },
  { id: 6, name: 'Tunde Bakare', email: 'tunde@rms.com.ng', phone: '+234 806 789 0123', tier: 'BRONZE', sales: 15, totalValue: 320000000, commission: 12800000, status: 'INACTIVE', avatar: null as string | null },
  { id: 7, name: 'Fatima Ibrahim', email: 'fatima@rms.com.ng', phone: '+234 807 890 1234', tier: 'BRONZE', sales: 12, totalValue: 280000000, commission: 11200000, status: 'ACTIVE', avatar: null as string | null },
  { id: 8, name: 'Kola Adesanya', email: 'kola@rms.com.ng', phone: '+234 808 901 2345', tier: 'BRONZE', sales: 8, totalValue: 190000000, commission: 7600000, status: 'ACTIVE', avatar: null as string | null },
];

interface RealtorFormData {
  name: string;
  email: string;
  phone: string;
  tier: string;
  licenseNumber: string;
  address: string;
}

export default function RealtorsPage() {
  const [realtors, setRealtors] = useState(initialRealtors);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTier, setFilterTier] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedRealtor, setSelectedRealtor] = useState<typeof realtors[0] | null>(null);
  const [formData, setFormData] = useState<RealtorFormData>({
    name: '',
    email: '',
    phone: '',
    tier: 'BRONZE',
    licenseNumber: '',
    address: '',
  });

  const filteredRealtors = useMemo(() => {
    return realtors.filter(realtor => {
      const matchesSearch = realtor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           realtor.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTier = filterTier === 'ALL' || realtor.tier === filterTier;
      const matchesStatus = filterStatus === 'ALL' || realtor.status === filterStatus;
      return matchesSearch && matchesTier && matchesStatus;
    });
  }, [realtors, searchTerm, filterTier, filterStatus]);

  const stats = useMemo(() => {
    const activeCount = realtors.filter(r => r.status === 'ACTIVE').length;
    const platinumCount = realtors.filter(r => r.tier === 'PLATINUM').length;
    const avgCommission = realtors.reduce((sum, r) => sum + r.commission, 0) / realtors.length;

    return [
      { title: 'Total Realtors', value: realtors.length.toString(), change: `+${Math.floor(realtors.length * 0.05)} this month`, color: 'text-blue-600', bgColor: 'bg-blue-100' },
      { title: 'Platinum Tier', value: platinumCount.toString(), change: `${((platinumCount / realtors.length) * 100).toFixed(1)}% of total`, color: 'text-purple-600', bgColor: 'bg-purple-100' },
      { title: 'Active Realtors', value: activeCount.toString(), change: `${((activeCount / realtors.length) * 100).toFixed(1)}% active`, color: 'text-green-600', bgColor: 'bg-green-100' },
      { title: 'Avg. Commission', value: formatCurrency(avgCommission), change: 'Per realtor/year', color: 'text-primary', bgColor: 'bg-primary/10' },
    ];
  }, [realtors]);

  const handleAddRealtor = () => {
    if (!formData.name || !formData.email || !formData.phone) {
      toast.error('Please fill in all required fields');
      return;
    }

    const newRealtor = {
      id: realtors.length + 1,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      tier: formData.tier,
      sales: 0,
      totalValue: 0,
      commission: 0,
      status: 'ACTIVE',
      avatar: null,
    };

    setRealtors([...realtors, newRealtor]);
    setAddDialogOpen(false);
    setFormData({ name: '', email: '', phone: '', tier: 'BRONZE', licenseNumber: '', address: '' });
    toast.success('Realtor added successfully!');
  };

  const handleEditRealtor = () => {
    if (!selectedRealtor) return;

    setRealtors(realtors.map(r =>
      r.id === selectedRealtor.id
        ? { ...r, name: formData.name, email: formData.email, phone: formData.phone, tier: formData.tier }
        : r
    ));
    setEditDialogOpen(false);
    toast.success('Realtor updated successfully!');
  };

  const handleToggleStatus = (realtor: typeof realtors[0]) => {
    setRealtors(realtors.map(r =>
      r.id === realtor.id
        ? { ...r, status: r.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' }
        : r
    ));
    toast.success(`Realtor ${realtor.status === 'ACTIVE' ? 'deactivated' : 'activated'} successfully!`);
  };

  const handleDeleteRealtor = (realtor: typeof realtors[0]) => {
    setRealtors(realtors.filter(r => r.id !== realtor.id));
    toast.success('Realtor deleted successfully!');
  };

  const openEditDialog = (realtor: typeof realtors[0]) => {
    setSelectedRealtor(realtor);
    setFormData({
      name: realtor.name,
      email: realtor.email,
      phone: realtor.phone,
      tier: realtor.tier,
      licenseNumber: '',
      address: '',
    });
    setEditDialogOpen(true);
  };

  const openViewDialog = (realtor: typeof realtors[0]) => {
    setSelectedRealtor(realtor);
    setViewDialogOpen(true);
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Tier', 'Sales', 'Total Value', 'Commission', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredRealtors.map(r => [
        `"${r.name}"`,
        r.email,
        r.phone,
        r.tier,
        r.sales,
        r.totalValue,
        r.commission,
        r.status,
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `realtors-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Realtors data exported successfully!');
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
                <div className={`inline-flex p-3 rounded-lg ${stat.bgColor} mb-4`}>
                  <Users className={`w-6 h-6 ${stat.color}`} />
                </div>
                <h3 className="text-2xl font-bold">{stat.value}</h3>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Realtors List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              All Realtors
            </CardTitle>
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search realtors..."
                  className="pl-9 w-full md:w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                className="px-3 py-2 border rounded-md text-sm"
                value={filterTier}
                onChange={(e) => setFilterTier(e.target.value)}
              >
                <option value="ALL">All Tiers</option>
                <option value="PLATINUM">Platinum</option>
                <option value="GOLD">Gold</option>
                <option value="SILVER">Silver</option>
                <option value="BRONZE">Bronze</option>
              </select>
              <select
                className="px-3 py-2 border rounded-md text-sm"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
              <Button variant="outline" size="sm" onClick={handleExportCSV}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button onClick={() => setAddDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Realtor
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-muted-foreground border-b">
                    <th className="pb-4 font-medium min-w-[180px]">Realtor</th>
                    <th className="pb-4 font-medium min-w-[200px]">Contact</th>
                    <th className="pb-4 font-medium min-w-[100px]">Tier</th>
                    <th className="pb-4 font-medium min-w-[80px]">Sales</th>
                    <th className="pb-4 font-medium min-w-[130px]">Total Value</th>
                    <th className="pb-4 font-medium min-w-[120px]">Commission</th>
                    <th className="pb-4 font-medium min-w-[90px]">Status</th>
                    <th className="pb-4 font-medium min-w-[60px]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredRealtors.map((realtor) => (
                    <tr key={realtor.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            {realtor.avatar && <AvatarImage src={realtor.avatar} alt={realtor.name} />}
                            <AvatarFallback className="bg-primary text-white">
                              {realtor.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{realtor.name}</span>
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="space-y-1">
                          <p className="text-sm flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {realtor.email}
                          </p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {realtor.phone}
                          </p>
                        </div>
                      </td>
                      <td className="py-4">
                        <Badge className={getTierBgClass(realtor.tier)}>{realtor.tier}</Badge>
                      </td>
                      <td className="py-4 font-medium">{realtor.sales}</td>
                      <td className="py-4">{formatCurrency(realtor.totalValue)}</td>
                      <td className="py-4 text-primary font-medium">{formatCurrency(realtor.commission)}</td>
                      <td className="py-4">
                        <Badge variant={realtor.status === 'ACTIVE' ? 'success' : 'secondary'}>
                          {realtor.status}
                        </Badge>
                      </td>
                      <td className="py-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openViewDialog(realtor)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditDialog(realtor)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleToggleStatus(realtor)}>
                              {realtor.status === 'ACTIVE' ? (
                                <>
                                  <UserX className="w-4 h-4 mr-2" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <UserCheck className="w-4 h-4 mr-2" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDeleteRealtor(realtor)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                  {filteredRealtors.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-muted-foreground">
                        No realtors found for the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Add Realtor Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Realtor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter email address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+234 xxx xxx xxxx"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="license">License Number</Label>
              <Input
                id="license"
                value={formData.licenseNumber}
                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                placeholder="Enter license number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tier">Starting Tier</Label>
              <select
                id="tier"
                className="w-full px-3 py-2 border rounded-md text-sm"
                value={formData.tier}
                onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
              >
                <option value="BRONZE">Bronze</option>
                <option value="SILVER">Silver</option>
                <option value="GOLD">Gold</option>
                <option value="PLATINUM">Platinum</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Enter address"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddRealtor}>
              Add Realtor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Realtor Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Realtor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email *</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone *</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-tier">Tier</Label>
              <select
                id="edit-tier"
                className="w-full px-3 py-2 border rounded-md text-sm"
                value={formData.tier}
                onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
              >
                <option value="BRONZE">Bronze</option>
                <option value="SILVER">Silver</option>
                <option value="GOLD">Gold</option>
                <option value="PLATINUM">Platinum</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditRealtor}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Realtor Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Realtor Profile</DialogTitle>
          </DialogHeader>
          {selectedRealtor && (
            <div className="space-y-6 py-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarFallback className="bg-primary text-white text-xl">
                    {selectedRealtor.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{selectedRealtor.name}</h3>
                  <Badge className={getTierBgClass(selectedRealtor.tier)}>{selectedRealtor.tier} Tier</Badge>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{selectedRealtor.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{selectedRealtor.phone}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Sales</p>
                  <p className="text-xl font-bold">{selectedRealtor.sales}</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Value</p>
                  <p className="text-xl font-bold">{formatCurrency(selectedRealtor.totalValue)}</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-muted-foreground">Commission</p>
                  <p className="text-xl font-bold text-primary">{formatCurrency(selectedRealtor.commission)}</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={selectedRealtor.status === 'ACTIVE' ? 'success' : 'secondary'} className="mt-1">
                    {selectedRealtor.status}
                  </Badge>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setViewDialogOpen(false);
              if (selectedRealtor) openEditDialog(selectedRealtor);
            }}>
              Edit Profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
