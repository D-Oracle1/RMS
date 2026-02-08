'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Briefcase,
  Search,
  Plus,
  MoreHorizontal,
  Mail,
  Phone,
  Home,
  DollarSign,
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
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { api } from '@/lib/api';

interface ClientData {
  id: string;
  userId: string;
  realtorId: string | null;
  totalPurchaseValue: number | string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    avatar: string | null;
    status: string;
    createdAt: string;
  };
  realtor?: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
    };
  } | null;
  _count: {
    ownedProperties: number;
    purchases: number;
  };
}

interface ClientResponse {
  data: ClientData[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface RealtorOption {
  id: string;
  user: {
    firstName: string;
    lastName: string;
  };
}

interface ClientFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  realtorId: string;
  password: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientData[]>([]);
  const [realtors, setRealtors] = useState<RealtorOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);
  const [meta, setMeta] = useState({ page: 1, limit: 50, total: 0, totalPages: 1 });
  const [formData, setFormData] = useState<ClientFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    realtorId: '',
    password: '',
  });

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', meta.page.toString());
      params.append('limit', '50');
      if (searchTerm) params.append('search', searchTerm);

      const response = await api.get<ClientResponse>(`/clients?${params.toString()}`);
      const data = response.data || response;
      setClients(Array.isArray(data) ? data : (data as any).data || []);
      if ((data as any).meta) {
        setMeta((data as any).meta);
      }
    } catch (error: any) {
      console.error('Failed to fetch clients:', error);
      toast.error(error.message || 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  }, [meta.page, searchTerm]);

  const fetchRealtors = useCallback(async () => {
    try {
      const response = await api.get<any>('/admin/realtors?limit=100');
      const data = response.data || response;
      setRealtors(Array.isArray(data) ? data : (data as any).data || []);
    } catch (error) {
      console.error('Failed to fetch realtors:', error);
    }
  }, []);

  useEffect(() => {
    fetchClients();
    fetchRealtors();
  }, [fetchClients, fetchRealtors]);

  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      const matchesStatus = filterStatus === 'ALL' || client.user.status === filterStatus;
      return matchesStatus;
    });
  }, [clients, filterStatus]);

  const stats = useMemo(() => {
    const activeCount = clients.filter(c => c.user.status === 'ACTIVE').length;
    const totalProperties = clients.reduce((sum, c) => sum + (c._count?.ownedProperties || 0), 0);
    const totalPortfolio = clients.reduce((sum, c) => sum + Number(c.totalPurchaseValue || 0), 0);

    return [
      { title: 'Total Clients', value: meta.total.toString(), icon: Briefcase, color: 'text-blue-600', bgColor: 'bg-blue-100' },
      { title: 'Active Clients', value: activeCount.toString(), icon: Briefcase, color: 'text-green-600', bgColor: 'bg-green-100' },
      { title: 'Total Properties', value: totalProperties.toString(), icon: Home, color: 'text-purple-600', bgColor: 'bg-purple-100' },
      { title: 'Portfolio Value', value: formatCurrency(totalPortfolio), icon: DollarSign, color: 'text-primary', bgColor: 'bg-primary/10' },
    ];
  }, [clients, meta.total]);

  const handleAddClient = async () => {
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
        role: 'CLIENT',
        realtorId: formData.realtorId || undefined,
      });

      setAddDialogOpen(false);
      setFormData({ firstName: '', lastName: '', email: '', phone: '', realtorId: '', password: '' });
      toast.success('Client added successfully!');
      fetchClients();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add client');
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditClient = async () => {
    if (!selectedClient) return;

    setActionLoading('edit');
    try {
      await api.patch(`/users/${selectedClient.userId}`, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
      });

      if (formData.realtorId && formData.realtorId !== selectedClient.realtorId) {
        await api.patch(`/clients/${selectedClient.id}`, {
          realtorId: formData.realtorId,
        });
      }

      setEditDialogOpen(false);
      toast.success('Client updated successfully!');
      fetchClients();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update client');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleStatus = async (client: ClientData) => {
    setActionLoading(client.id);
    try {
      const newStatus = client.user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await api.patch(`/users/${client.userId}/status`, { status: newStatus });
      toast.success(`Client ${client.user.status === 'ACTIVE' ? 'deactivated' : 'activated'} successfully!`);
      fetchClients();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteClient = async (client: ClientData) => {
    if (!confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
      return;
    }

    setActionLoading(client.id);
    try {
      await api.delete(`/users/${client.userId}`);
      toast.success('Client deleted successfully!');
      fetchClients();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete client');
    } finally {
      setActionLoading(null);
    }
  };

  const openEditDialog = (client: ClientData) => {
    setSelectedClient(client);
    setFormData({
      firstName: client.user.firstName,
      lastName: client.user.lastName,
      email: client.user.email,
      phone: client.user.phone || '',
      realtorId: client.realtorId || '',
      password: '',
    });
    setEditDialogOpen(true);
  };

  const openViewDialog = (client: ClientData) => {
    setSelectedClient(client);
    setViewDialogOpen(true);
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Properties', 'Portfolio Value', 'Assigned Realtor', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredClients.map(c => [
        `"${c.user.firstName} ${c.user.lastName}"`,
        c.user.email,
        c.user.phone || '',
        c._count?.ownedProperties || 0,
        c.totalPurchaseValue,
        c.realtor ? `"${c.realtor.user.firstName} ${c.realtor.user.lastName}"` : 'Unassigned',
        c.user.status,
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clients-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Clients data exported successfully!');
  };

  const getRealtorName = (client: ClientData) => {
    if (client.realtor) {
      return `${client.realtor.user.firstName} ${client.realtor.user.lastName}`;
    }
    return 'Unassigned';
  };

  if (loading && clients.length === 0) {
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
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <h3 className="text-2xl font-bold">{stat.value}</h3>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Clients List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-primary" />
              All Clients
            </CardTitle>
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search clients..."
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
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
              <Button variant="outline" size="sm" onClick={fetchClients} disabled={loading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportCSV}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button onClick={() => setAddDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Client
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-muted-foreground border-b">
                    <th className="pb-4 font-medium min-w-[180px]">Client</th>
                    <th className="pb-4 font-medium min-w-[200px]">Contact</th>
                    <th className="pb-4 font-medium min-w-[100px]">Properties</th>
                    <th className="pb-4 font-medium min-w-[140px]">Portfolio Value</th>
                    <th className="pb-4 font-medium min-w-[150px]">Assigned Realtor</th>
                    <th className="pb-4 font-medium min-w-[90px]">Status</th>
                    <th className="pb-4 font-medium min-w-[60px]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredClients.map((client) => (
                    <tr key={client.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            {client.user.avatar && <AvatarImage src={client.user.avatar} alt={`${client.user.firstName} ${client.user.lastName}`} />}
                            <AvatarFallback className="bg-primary text-white">
                              {client.user.firstName[0]}{client.user.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{client.user.firstName} {client.user.lastName}</span>
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="space-y-1">
                          <p className="text-sm flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {client.user.email}
                          </p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {client.user.phone || 'N/A'}
                          </p>
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-1">
                          <Home className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{client._count?.ownedProperties || 0}</span>
                        </div>
                      </td>
                      <td className="py-4 text-primary font-medium">{formatCurrency(Number(client.totalPurchaseValue || 0))}</td>
                      <td className="py-4">{getRealtorName(client)}</td>
                      <td className="py-4">
                        <Badge variant={client.user.status === 'ACTIVE' ? 'success' : 'secondary'}>
                          {client.user.status}
                        </Badge>
                      </td>
                      <td className="py-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" disabled={actionLoading === client.id}>
                              {actionLoading === client.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <MoreHorizontal className="w-4 h-4" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openViewDialog(client)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditDialog(client)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleToggleStatus(client)}>
                              {client.user.status === 'ACTIVE' ? (
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
                              onClick={() => handleDeleteClient(client)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                  {filteredClients.length === 0 && !loading && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-muted-foreground">
                        No clients found for the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Add Client Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Client</DialogTitle>
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
              <Label htmlFor="realtor">Assign Realtor</Label>
              <select
                id="realtor"
                className="w-full px-3 py-2 border rounded-md text-sm"
                value={formData.realtorId}
                onChange={(e) => setFormData({ ...formData, realtorId: e.target.value })}
              >
                <option value="">Select a realtor</option>
                {realtors.map(realtor => (
                  <option key={realtor.id} value={realtor.id}>
                    {realtor.user.firstName} {realtor.user.lastName}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddClient} disabled={actionLoading === 'add'}>
              {actionLoading === 'add' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Add Client
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Client Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
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
              <Label htmlFor="edit-realtor">Assigned Realtor</Label>
              <select
                id="edit-realtor"
                className="w-full px-3 py-2 border rounded-md text-sm"
                value={formData.realtorId}
                onChange={(e) => setFormData({ ...formData, realtorId: e.target.value })}
              >
                <option value="">Select a realtor</option>
                {realtors.map(realtor => (
                  <option key={realtor.id} value={realtor.id}>
                    {realtor.user.firstName} {realtor.user.lastName}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditClient} disabled={actionLoading === 'edit'}>
              {actionLoading === 'edit' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Client Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Client Profile</DialogTitle>
          </DialogHeader>
          {selectedClient && (
            <div className="space-y-6 py-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  {selectedClient.user.avatar && <AvatarImage src={selectedClient.user.avatar} />}
                  <AvatarFallback className="bg-primary text-white text-xl">
                    {selectedClient.user.firstName[0]}{selectedClient.user.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{selectedClient.user.firstName} {selectedClient.user.lastName}</h3>
                  <Badge variant={selectedClient.user.status === 'ACTIVE' ? 'success' : 'secondary'}>
                    {selectedClient.user.status}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{selectedClient.user.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{selectedClient.user.phone || 'N/A'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-muted-foreground">Properties Owned</p>
                  <p className="text-xl font-bold">{selectedClient._count?.ownedProperties || 0}</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-muted-foreground">Portfolio Value</p>
                  <p className="text-xl font-bold text-primary">{formatCurrency(Number(selectedClient.totalPurchaseValue || 0))}</p>
                </div>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-muted-foreground">Assigned Realtor</p>
                <p className="font-medium">{getRealtorName(selectedClient)}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setViewDialogOpen(false);
              if (selectedClient) openEditDialog(selectedClient);
            }}>
              Edit Profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
