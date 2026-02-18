'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Building2,
  Plus,
  Search,
  Loader2,
  RefreshCw,
  Copy,
  Power,
  RotateCcw,
  Eye,
  X,
  Check,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { api } from '@/lib/api';

interface Company {
  id: string;
  name: string;
  slug: string;
  domain: string;
  logo?: string;
  primaryColor?: string;
  inviteCode: string;
  isActive: boolean;
  plan: string;
  maxUsers: number;
  createdAt: string;
  stats?: { users: number; properties: number; sales: number };
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<any>({});
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState<Company | null>(null);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    domain: '',
    logo: '',
    primaryColor: '#3b82f6',
    maxUsers: 50,
  });

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      const res = await api.get<any>(`/companies?${params}`);
      const result = res.data || res;
      setCompanies(result.data || []);
      setMeta(result.meta || {});
    } catch (error) {
      console.error('Failed to fetch companies:', error);
      toast.error('Failed to load companies');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const autoSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/companies', formData);
      toast.success('Company created successfully! Database provisioned.');
      setShowCreate(false);
      setFormData({ name: '', slug: '', domain: '', logo: '', primaryColor: '#3b82f6', maxUsers: 50 });
      fetchCompanies();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create company');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (company: Company) => {
    try {
      await api.patch(`/companies/${company.id}/toggle-active`, {});
      toast.success(`Company ${company.isActive ? 'deactivated' : 'activated'}`);
      fetchCompanies();
    } catch (error: any) {
      toast.error(error.message || 'Failed to toggle status');
    }
  };

  const handleRegenerateInvite = async (company: Company) => {
    try {
      const res = await api.post<any>(`/companies/${company.id}/regenerate-invite`, {});
      const result = res.data || res;
      toast.success(`New invite code: ${result.inviteCode}`);
      fetchCompanies();
    } catch (error: any) {
      toast.error(error.message || 'Failed to regenerate invite code');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const viewDetail = async (company: Company) => {
    try {
      const res = await api.get<any>(`/companies/${company.id}`);
      setShowDetail(res.data || res);
    } catch {
      setShowDetail(company);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Companies</h1>
          <p className="text-muted-foreground">Manage tenant companies and their databases</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Company
        </Button>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search companies..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="icon" onClick={fetchCompanies}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Companies List */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : companies.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No companies yet</h3>
            <p className="text-muted-foreground mb-4">Create your first company to start onboarding clients</p>
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4 mr-2" /> Create Company
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {companies.map((company) => (
            <Card key={company.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {company.logo ? (
                      <img src={company.logo} alt="" className="w-10 h-10 rounded-lg object-contain" />
                    ) : (
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: (company.primaryColor || '#3b82f6') + '20' }}
                      >
                        <Building2 className="w-5 h-5" style={{ color: company.primaryColor || '#3b82f6' }} />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold">{company.name}</h3>
                      <p className="text-sm text-muted-foreground">{company.domain}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex gap-4 text-muted-foreground">
                      <span>{company.stats?.users || 0} users</span>
                      <span>{company.stats?.properties || 0} properties</span>
                      <span>{company.stats?.sales || 0} sales</span>
                    </div>

                    <Badge variant={company.isActive ? 'default' : 'secondary'}>
                      {company.isActive ? 'Active' : 'Inactive'}
                    </Badge>

                    <div className="flex items-center gap-1">
                      <code className="text-xs bg-muted px-2 py-1 rounded">{company.inviteCode}</code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => copyToClipboard(company.inviteCode)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>

                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => viewDetail(company)} title="View details">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggleActive(company)} title={company.isActive ? 'Deactivate' : 'Activate'}>
                        <Power className={`w-4 h-4 ${company.isActive ? 'text-green-600' : 'text-red-500'}`} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleRegenerateInvite(company)} title="Regenerate invite code">
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {meta.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= meta.totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* Create Company Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Create Company</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowCreate(false)}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Company Name *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setFormData({ ...formData, name, slug: autoSlug(name) });
                    }}
                    placeholder="Acme Realty"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Slug *</label>
                  <Input
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="acme-realty"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">URL-safe identifier (lowercase, hyphens only)</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Domain *</label>
                  <Input
                    value={formData.domain}
                    onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                    placeholder="acme-realty.com"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Primary Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={formData.primaryColor}
                        onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                        className="w-10 h-10 rounded cursor-pointer border"
                      />
                      <Input
                        value={formData.primaryColor}
                        onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Max Users</label>
                    <Input
                      type="number"
                      min={1}
                      value={formData.maxUsers}
                      onChange={(e) => setFormData({ ...formData, maxUsers: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Logo URL (optional)</label>
                  <Input
                    value={formData.logo}
                    onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                    placeholder="https://example.com/logo.png"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={creating}>
                    {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Create Company
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Company Detail Modal */}
      {showDetail && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {showDetail.logo ? (
                  <img src={showDetail.logo} alt="" className="w-8 h-8 rounded object-contain" />
                ) : (
                  <Building2 className="w-5 h-5" />
                )}
                {showDetail.name}
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowDetail(null)}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Slug</p>
                  <p className="font-medium">{showDetail.slug}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Domain</p>
                  <p className="font-medium">{showDetail.domain}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge variant={showDetail.isActive ? 'default' : 'secondary'}>
                    {showDetail.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Plan</p>
                  <p className="font-medium capitalize">{showDetail.plan}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Max Users</p>
                  <p className="font-medium">{showDetail.maxUsers}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Primary Color</p>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded" style={{ backgroundColor: showDetail.primaryColor }} />
                    <span className="font-medium">{showDetail.primaryColor}</span>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Invite Code</p>
                <div className="flex items-center gap-2">
                  <code className="bg-muted px-3 py-2 rounded text-sm flex-1">{showDetail.inviteCode}</code>
                  <Button variant="outline" size="sm" onClick={() => copyToClipboard(showDetail.inviteCode)}>
                    <Copy className="w-4 h-4 mr-1" /> Copy
                  </Button>
                </div>
              </div>

              {(showDetail as any).stats && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Statistics</p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Users', value: (showDetail as any).stats.users },
                      { label: 'Realtors', value: (showDetail as any).stats.realtors },
                      { label: 'Clients', value: (showDetail as any).stats.clients },
                      { label: 'Properties', value: (showDetail as any).stats.properties },
                      { label: 'Sales', value: (showDetail as any).stats.sales },
                      { label: 'Revenue', value: (showDetail as any).stats.revenue },
                    ].map((s) => (
                      <div key={s.label} className="bg-muted rounded-lg p-3 text-center">
                        <p className="text-lg font-bold">{typeof s.value === 'number' ? s.value.toLocaleString() : s.value}</p>
                        <p className="text-xs text-muted-foreground">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                Created: {new Date(showDetail.createdAt).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
