'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
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
  RefreshCw,
  Loader2,
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
import { api } from '@/lib/api';

interface RealtorData {
  id: string;
  userId: string;
  licenseNumber: string | null;
  loyaltyTier: string;
  loyaltyPoints: number;
  totalSales: number;
  totalSalesValue: number | string;
  totalCommission: number | string;
  currentRank: number;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    avatar: string | null;
    status: string;
    lastLoginAt?: string;
  };
  _count: {
    sales: number;
    clients: number;
  };
}

interface RealtorResponse {
  data: RealtorData[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface RealtorFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  tier: string;
  licenseNumber: string;
  password: string;
}

export default function RealtorsPage() {
  const [realtors, setRealtors] = useState<RealtorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTier, setFilterTier] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedRealtor, setSelectedRealtor] = useState<RealtorData | null>(null);
  const [meta, setMeta] = useState({ page: 1, limit: 50, total: 0, totalPages: 1 });
  const [formData, setFormData] = useState<RealtorFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    tier: 'BRONZE',
    licenseNumber: '',
    password: '',
  });

  const fetchRealtors = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', meta.page.toString());
      params.append('limit', '50');
      if (searchTerm) params.append('search', searchTerm);
      if (filterTier !== 'ALL') params.append('tier', filterTier);

      const response = await api.get<RealtorResponse>(`/admin/realtors?${params.toString()}`);
      const data = response.data || response;
      setRealtors(Array.isArray(data) ? data : (data as any).data || []);
      if ((data as any).meta) {
        setMeta((data as any).meta);
      }
    } catch (error: any) {
      console.error('Failed to fetch realtors:', error);
      toast.error(error.message || 'Failed to load realtors');
    } finally {
      setLoading(false);
    }
  }, [meta.page, searchTerm, filterTier]);

  useEffect(() => {
    fetchRealtors();
  }, [fetchRealtors]);

  const filteredRealtors = useMemo(() => {
    return realtors.filter(realtor => {
      const matchesStatus = filterStatus === 'ALL' || realtor.user.status === filterStatus;
      return matchesStatus;
    });
  }, [realtors, filterStatus]);

  const stats = useMemo(() => {
    const activeCount = realtors.filter(r => r.user.status === 'ACTIVE').length;
    const platinumCount = realtors.filter(r => r.loyaltyTier === 'PLATINUM').length;
    const totalCommission = realtors.reduce((sum, r) => sum + Number(r.totalCommission || 0), 0);
    const avgCommission = realtors.length > 0 ? totalCommission / realtors.length : 0;

    return [
      { title: 'Total Realtors', value: meta.total.toString(), change: `${realtors.length} loaded`, color: 'text-blue-600', bgColor: 'bg-blue-100' },
      { title: 'Platinum Tier', value: platinumCount.toString(), change: realtors.length > 0 ? `${((platinumCount / realtors.length) * 100).toFixed(1)}% of total` : '0%', color: 'text-purple-600', bgColor: 'bg-purple-100' },
      { title: 'Active Realtors', value: activeCount.toString(), change: realtors.length > 0 ? `${((activeCount / realtors.length) * 100).toFixed(1)}% active` : '0%', color: 'text-green-600', bgColor: 'bg-green-100' },
      { title: 'Avg. Commission', value: formatCurrency(avgCommission), change: 'Per realtor', color: 'text-primary', bgColor: 'bg-primary/10' },
    ];
  }, [realtors, meta.total]);

  const handleAddRealtor = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    setActionLoading('add');
    try {
      await api.post('/auth/register', {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        role: 'REALTOR',
      });

      setAddDialogOpen(false);
      setFormData({ firstName: '', lastName: '', email: '', phone: '', tier: 'BRONZE', licenseNumber: '', password: '' });
      toast.success('Realtor added successfully!');
      fetchRealtors();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add realtor');
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditRealtor = async () => {
    if (!selectedRealtor) return;

    setActionLoading('edit');
    try {
      await api.patch(`/realtors/${selectedRealtor.id}`, {
        licenseNumber: formData.licenseNumber,
      });

      // Also update user info if needed
      await api.patch(`/users/${selectedRealtor.userId}`, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
      });

      setEditDialogOpen(false);
      toast.success('Realtor updated successfully!');
      fetchRealtors();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update realtor');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleStatus = async (realtor: RealtorData) => {
    setActionLoading(realtor.id);
    try {
      const newStatus = realtor.user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await api.patch(`/users/${realtor.userId}/status`, { status: newStatus });
      toast.success(`Realtor ${realtor.user.status === 'ACTIVE' ? 'deactivated' : 'activated'} successfully!`);
      fetchRealtors();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteRealtor = async (realtor: RealtorData) => {
    if (!confirm('Are you sure you want to delete this realtor? This action cannot be undone.')) {
      return;
    }

    setActionLoading(realtor.id);
    try {
      await api.delete(`/users/${realtor.userId}`);
      toast.success('Realtor deleted successfully!');
      fetchRealtors();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete realtor');
    } finally {
      setActionLoading(null);
    }
  };

  const openEditDialog = (realtor: RealtorData) => {
    setSelectedRealtor(realtor);
    setFormData({
      firstName: realtor.user.firstName,
      lastName: realtor.user.lastName,
      email: realtor.user.email,
      phone: realtor.user.phone || '',
      tier: realtor.loyaltyTier,
      licenseNumber: realtor.licenseNumber || '',
      password: '',
    });
    setEditDialogOpen(true);
  };

  const openViewDialog = (realtor: RealtorData) => {
    setSelectedRealtor(realtor);
    setViewDialogOpen(true);
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Tier', 'Sales', 'Total Value', 'Commission', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredRealtors.map(r => [
        `"${r.user.firstName} ${r.user.lastName}"`,
        r.user.email,
        r.user.phone || '',
        r.loyaltyTier,
        r.totalSales,
        r.totalSalesValue,
        r.totalCommission,
        r.user.status,
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

  if (loading && realtors.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

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
              <Button variant="outline" size="sm" onClick={fetchRealtors} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
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
                            {realtor.user.avatar && <AvatarImage src={realtor.user.avatar} alt={`${realtor.user.firstName} ${realtor.user.lastName}`} />}
                            <AvatarFallback className="bg-primary text-white">
                              {realtor.user.firstName[0]}{realtor.user.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{realtor.user.firstName} {realtor.user.lastName}</span>
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="space-y-1">
                          <p className="text-sm flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {realtor.user.email}
                          </p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {realtor.user.phone || 'N/A'}
                          </p>
                        </div>
                      </td>
                      <td className="py-4">
                        <Badge className={getTierBgClass(realtor.loyaltyTier)}>{realtor.loyaltyTier}</Badge>
                      </td>
                      <td className="py-4 font-medium">{realtor.totalSales}</td>
                      <td className="py-4">{formatCurrency(Number(realtor.totalSalesValue || 0))}</td>
                      <td className="py-4 text-primary font-medium">{formatCurrency(Number(realtor.totalCommission || 0))}</td>
                      <td className="py-4">
                        <Badge variant={realtor.user.status === 'ACTIVE' ? 'success' : 'secondary'}>
                          {realtor.user.status}
                        </Badge>
                      </td>
                      <td className="py-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" disabled={actionLoading === realtor.id}>
                              {actionLoading === realtor.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <MoreHorizontal className="w-4 h-4" />
                              )}
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
                              {realtor.user.status === 'ACTIVE' ? (
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
                  {filteredRealtors.length === 0 && !loading && (
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="First name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Last name"
                />
              </div>
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
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddRealtor} disabled={actionLoading === 'add'}>
              {actionLoading === 'add' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-firstName">First Name *</Label>
                <Input
                  id="edit-firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-lastName">Last Name *</Label>
                <Input
                  id="edit-lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                disabled
                className="bg-gray-100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-license">License Number</Label>
              <Input
                id="edit-license"
                value={formData.licenseNumber}
                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditRealtor} disabled={actionLoading === 'edit'}>
              {actionLoading === 'edit' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
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
                  {selectedRealtor.user.avatar && <AvatarImage src={selectedRealtor.user.avatar} />}
                  <AvatarFallback className="bg-primary text-white text-xl">
                    {selectedRealtor.user.firstName[0]}{selectedRealtor.user.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{selectedRealtor.user.firstName} {selectedRealtor.user.lastName}</h3>
                  <Badge className={getTierBgClass(selectedRealtor.loyaltyTier)}>{selectedRealtor.loyaltyTier} Tier</Badge>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{selectedRealtor.user.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{selectedRealtor.user.phone || 'N/A'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Sales</p>
                  <p className="text-xl font-bold">{selectedRealtor.totalSales}</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Value</p>
                  <p className="text-xl font-bold">{formatCurrency(Number(selectedRealtor.totalSalesValue || 0))}</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-muted-foreground">Commission</p>
                  <p className="text-xl font-bold text-primary">{formatCurrency(Number(selectedRealtor.totalCommission || 0))}</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={selectedRealtor.user.status === 'ACTIVE' ? 'success' : 'secondary'} className="mt-1">
                    {selectedRealtor.user.status}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-muted-foreground">Clients</p>
                  <p className="text-xl font-bold">{selectedRealtor._count?.clients || 0}</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-muted-foreground">Rank</p>
                  <p className="text-xl font-bold">#{selectedRealtor.currentRank || 'N/A'}</p>
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
