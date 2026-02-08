'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Building,
  Plus,
  Users,
  MoreVertical,
  Edit,
  Trash2,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { api } from '@/lib/api';

interface DepartmentData {
  id: string;
  name: string;
  code: string;
  description: string | null;
  parentId: string | null;
  headId: string | null;
  parent?: { id: string; name: string } | null;
  head?: {
    id: string;
    user: { firstName: string; lastName: string; avatar: string | null };
  } | null;
  _count?: { staff: number; children: number };
}

const COLORS = [
  'bg-blue-500',
  'bg-purple-500',
  'bg-green-500',
  'bg-yellow-500',
  'bg-red-500',
  'bg-cyan-500',
  'bg-indigo-500',
  'bg-pink-500',
];

export default function AdminDepartmentsPage() {
  const router = useRouter();
  const [departments, setDepartments] = useState<DepartmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<DepartmentData | null>(null);

  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formDescription, setFormDescription] = useState('');

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    try {
      const response: any = await api.get('/departments');
      const data = response.data || response;
      setDepartments(Array.isArray(data) ? data : (data as any).data || []);
    } catch (error: any) {
      console.error('Failed to fetch departments:', error);
      toast.error(error.message || 'Failed to load departments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const totalStaff = useMemo(
    () => departments.reduce((sum, d) => sum + (d._count?.staff || 0), 0),
    [departments],
  );

  const resetForm = () => {
    setFormName('');
    setFormCode('');
    setFormDescription('');
  };

  const handleAddDepartment = async () => {
    if (!formName.trim() || !formCode.trim()) {
      toast.error('Please fill in name and code');
      return;
    }

    setActionLoading('add');
    try {
      await api.post('/departments', {
        name: formName.trim(),
        code: formCode.trim().toUpperCase(),
        description: formDescription.trim() || undefined,
      });
      setAddDialogOpen(false);
      resetForm();
      toast.success('Department created successfully!');
      fetchDepartments();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create department');
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditDepartment = async () => {
    if (!selectedDept || !formName.trim()) {
      toast.error('Please fill in the department name');
      return;
    }

    setActionLoading('edit');
    try {
      await api.put(`/departments/${selectedDept.id}`, {
        name: formName.trim(),
        description: formDescription.trim() || undefined,
      });
      setEditDialogOpen(false);
      resetForm();
      toast.success('Department updated successfully!');
      fetchDepartments();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update department');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteDepartment = async (dept: DepartmentData) => {
    if (!confirm(`Are you sure you want to delete "${dept.name}"? This cannot be undone.`)) {
      return;
    }

    setActionLoading(dept.id);
    try {
      await api.delete(`/departments/${dept.id}`);
      toast.success('Department deleted successfully!');
      fetchDepartments();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete department');
    } finally {
      setActionLoading(null);
    }
  };

  const openEditDialog = (dept: DepartmentData) => {
    setSelectedDept(dept);
    setFormName(dept.name);
    setFormCode(dept.code);
    setFormDescription(dept.description || '');
    setEditDialogOpen(true);
  };

  if (loading && departments.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Departments</h1>
          <p className="text-muted-foreground">Manage organizational departments and structure</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={fetchDepartments} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button className="gap-2" onClick={() => { resetForm(); setAddDialogOpen(true); }}>
            <Plus className="w-4 h-4" />
            Add Department
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardContent className="p-6">
              <p className="text-3xl font-bold">{departments.length}</p>
              <p className="text-sm text-muted-foreground">Total Departments</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="p-6">
              <p className="text-3xl font-bold">{totalStaff}</p>
              <p className="text-sm text-muted-foreground">Total Staff Across Departments</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Department Cards */}
      {departments.length === 0 && !loading ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <Building className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No departments yet</p>
            <p className="text-sm mb-4">Create your first department to start organizing your staff.</p>
            <Button onClick={() => { resetForm(); setAddDialogOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Create Department
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {departments.map((dept, index) => {
            const color = COLORS[index % COLORS.length];
            const headName = dept.head?.user
              ? `${dept.head.user.firstName} ${dept.head.user.lastName}`
              : null;
            const headInitials = dept.head?.user
              ? `${dept.head.user.firstName[0]}${dept.head.user.lastName[0]}`
              : null;

            return (
              <motion.div
                key={dept.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
              >
                <Card
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => router.push(`/dashboard/admin/staff?department=${dept.id}`)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center`}>
                          <Building className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{dept.name}</h3>
                          <Badge variant="secondary" className="text-xs">{dept.code}</Badge>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            disabled={actionLoading === dept.id}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {actionLoading === dept.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <MoreVertical className="w-4 h-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEditDialog(dept); }}>
                            <Edit className="w-4 h-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={(e) => { e.stopPropagation(); handleDeleteDepartment(dept); }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {dept.description && (
                      <p className="text-xs text-muted-foreground mb-3">{dept.description}</p>
                    )}

                    <div className="space-y-3">
                      {headName && (
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-primary text-white text-xs">
                              {headInitials}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-xs text-muted-foreground">Department Head</p>
                            <p className="text-sm font-medium">{headName}</p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="w-4 h-4" />
                          <span>{dept._count?.staff || 0} staff</span>
                        </div>
                        {dept.parent && (
                          <Badge variant="outline" className="text-xs">
                            Under: {dept.parent.name}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add Department Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Department</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="dept-name">Department Name *</Label>
              <Input
                id="dept-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g., Sales"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dept-code">Department Code *</Label>
              <Input
                id="dept-code"
                value={formCode}
                onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                placeholder="e.g., SALES"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dept-description">Description</Label>
              <Input
                id="dept-description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Brief description of the department"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddDepartment} disabled={actionLoading === 'add'}>
              {actionLoading === 'add' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Department
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Department Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-dept-name">Department Name *</Label>
              <Input
                id="edit-dept-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-dept-code">Department Code</Label>
              <Input
                id="edit-dept-code"
                value={formCode}
                disabled
                className="bg-gray-100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-dept-description">Description</Label>
              <Input
                id="edit-dept-description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditDepartment} disabled={actionLoading === 'edit'}>
              {actionLoading === 'edit' && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
