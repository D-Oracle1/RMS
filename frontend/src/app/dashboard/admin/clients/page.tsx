'use client';

import { useState, useMemo } from 'react';
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
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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

const initialClients = [
  { id: 1, name: 'Chukwuemeka Okafor', email: 'chukwuemeka@email.com', phone: '+234 801 111 2222', properties: 3, portfolioValue: 850000000, realtor: 'Adaeze Okonkwo', status: 'ACTIVE' },
  { id: 2, name: 'Adebayo Adeleke', email: 'adebayo@email.com', phone: '+234 802 222 3333', properties: 2, portfolioValue: 650000000, realtor: 'Chinedu Eze', status: 'ACTIVE' },
  { id: 3, name: 'Ngozi Okonkwo', email: 'ngozi.o@email.com', phone: '+234 803 333 4444', properties: 5, portfolioValue: 1200000000, realtor: 'Adaeze Okonkwo', status: 'ACTIVE' },
  { id: 4, name: 'Fatima Ibrahim', email: 'fatima.i@email.com', phone: '+234 804 444 5555', properties: 1, portfolioValue: 180000000, realtor: 'Funke Adeyemi', status: 'ACTIVE' },
  { id: 5, name: 'Emeka Nnamdi', email: 'emeka.n@email.com', phone: '+234 805 555 6666', properties: 4, portfolioValue: 510000000, realtor: 'Emeka Nwankwo', status: 'INACTIVE' },
  { id: 6, name: 'Tunde Bakare', email: 'tunde.b@email.com', phone: '+234 806 666 7777', properties: 2, portfolioValue: 125000000, realtor: 'Ngozi Obi', status: 'ACTIVE' },
];

const realtorsList = [
  'Adaeze Okonkwo',
  'Chinedu Eze',
  'Funke Adeyemi',
  'Emeka Nwankwo',
  'Ngozi Obi',
  'Tunde Bakare',
  'Fatima Ibrahim',
  'Kola Adesanya',
];

interface ClientFormData {
  name: string;
  email: string;
  phone: string;
  realtor: string;
  address: string;
  preferredPropertyType: string;
  budget: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState(initialClients);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<typeof clients[0] | null>(null);
  const [formData, setFormData] = useState<ClientFormData>({
    name: '',
    email: '',
    phone: '',
    realtor: '',
    address: '',
    preferredPropertyType: 'any',
    budget: '',
  });

  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           client.realtor.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'ALL' || client.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [clients, searchTerm, filterStatus]);

  const stats = useMemo(() => {
    const activeCount = clients.filter(c => c.status === 'ACTIVE').length;
    const totalProperties = clients.reduce((sum, c) => sum + c.properties, 0);
    const totalPortfolio = clients.reduce((sum, c) => sum + c.portfolioValue, 0);

    return [
      { title: 'Total Clients', value: clients.length.toString(), icon: Briefcase, color: 'text-blue-600', bgColor: 'bg-blue-100' },
      { title: 'Active Clients', value: activeCount.toString(), icon: Briefcase, color: 'text-green-600', bgColor: 'bg-green-100' },
      { title: 'Total Properties', value: totalProperties.toString(), icon: Home, color: 'text-purple-600', bgColor: 'bg-purple-100' },
      { title: 'Portfolio Value', value: formatCurrency(totalPortfolio), icon: DollarSign, color: 'text-primary', bgColor: 'bg-primary/10' },
    ];
  }, [clients]);

  const handleAddClient = () => {
    if (!formData.name || !formData.email || !formData.phone) {
      toast.error('Please fill in all required fields');
      return;
    }

    const newClient = {
      id: clients.length + 1,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      properties: 0,
      portfolioValue: 0,
      realtor: formData.realtor || 'Unassigned',
      status: 'ACTIVE',
    };

    setClients([...clients, newClient]);
    setAddDialogOpen(false);
    setFormData({ name: '', email: '', phone: '', realtor: '', address: '', preferredPropertyType: 'any', budget: '' });
    toast.success('Client added successfully!');
  };

  const handleEditClient = () => {
    if (!selectedClient) return;

    setClients(clients.map(c =>
      c.id === selectedClient.id
        ? { ...c, name: formData.name, email: formData.email, phone: formData.phone, realtor: formData.realtor }
        : c
    ));
    setEditDialogOpen(false);
    toast.success('Client updated successfully!');
  };

  const handleToggleStatus = (client: typeof clients[0]) => {
    setClients(clients.map(c =>
      c.id === client.id
        ? { ...c, status: c.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' }
        : c
    ));
    toast.success(`Client ${client.status === 'ACTIVE' ? 'deactivated' : 'activated'} successfully!`);
  };

  const handleDeleteClient = (client: typeof clients[0]) => {
    setClients(clients.filter(c => c.id !== client.id));
    toast.success('Client deleted successfully!');
  };

  const openEditDialog = (client: typeof clients[0]) => {
    setSelectedClient(client);
    setFormData({
      name: client.name,
      email: client.email,
      phone: client.phone,
      realtor: client.realtor,
      address: '',
      preferredPropertyType: 'any',
      budget: '',
    });
    setEditDialogOpen(true);
  };

  const openViewDialog = (client: typeof clients[0]) => {
    setSelectedClient(client);
    setViewDialogOpen(true);
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Properties', 'Portfolio Value', 'Assigned Realtor', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredClients.map(c => [
        `"${c.name}"`,
        c.email,
        c.phone,
        c.properties,
        c.portfolioValue,
        `"${c.realtor}"`,
        c.status,
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
                            <AvatarFallback className="bg-primary text-white">
                              {client.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{client.name}</span>
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="space-y-1">
                          <p className="text-sm flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {client.email}
                          </p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {client.phone}
                          </p>
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-1">
                          <Home className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{client.properties}</span>
                        </div>
                      </td>
                      <td className="py-4 text-primary font-medium">{formatCurrency(client.portfolioValue)}</td>
                      <td className="py-4">{client.realtor}</td>
                      <td className="py-4">
                        <Badge variant={client.status === 'ACTIVE' ? 'success' : 'secondary'}>
                          {client.status}
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
                              {client.status === 'ACTIVE' ? (
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
                  {filteredClients.length === 0 && (
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
              <Label htmlFor="realtor">Assign Realtor</Label>
              <select
                id="realtor"
                className="w-full px-3 py-2 border rounded-md text-sm"
                value={formData.realtor}
                onChange={(e) => setFormData({ ...formData, realtor: e.target.value })}
              >
                <option value="">Select a realtor</option>
                {realtorsList.map(realtor => (
                  <option key={realtor} value={realtor}>{realtor}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="propertyType">Preferred Property Type</Label>
              <select
                id="propertyType"
                className="w-full px-3 py-2 border rounded-md text-sm"
                value={formData.preferredPropertyType}
                onChange={(e) => setFormData({ ...formData, preferredPropertyType: e.target.value })}
              >
                <option value="any">Any</option>
                <option value="land">Land</option>
                <option value="house">House</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget">Budget Range</Label>
              <Input
                id="budget"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                placeholder="e.g., 50M - 200M"
              />
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
            <Button onClick={handleAddClient}>
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
              <Label htmlFor="edit-realtor">Assigned Realtor</Label>
              <select
                id="edit-realtor"
                className="w-full px-3 py-2 border rounded-md text-sm"
                value={formData.realtor}
                onChange={(e) => setFormData({ ...formData, realtor: e.target.value })}
              >
                <option value="">Select a realtor</option>
                {realtorsList.map(realtor => (
                  <option key={realtor} value={realtor}>{realtor}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditClient}>
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
                  <AvatarFallback className="bg-primary text-white text-xl">
                    {selectedClient.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{selectedClient.name}</h3>
                  <Badge variant={selectedClient.status === 'ACTIVE' ? 'success' : 'secondary'}>
                    {selectedClient.status}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{selectedClient.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{selectedClient.phone}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-muted-foreground">Properties Owned</p>
                  <p className="text-xl font-bold">{selectedClient.properties}</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-muted-foreground">Portfolio Value</p>
                  <p className="text-xl font-bold text-primary">{formatCurrency(selectedClient.portfolioValue)}</p>
                </div>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-muted-foreground">Assigned Realtor</p>
                <p className="font-medium">{selectedClient.realtor}</p>
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
