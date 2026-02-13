'use client';

import { useState, useEffect } from 'react';
import { Building2, Users, Home, DollarSign, Loader2, RefreshCw, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const overviewRes = await api.get<any>('/companies/overview').catch(() => null);
      const companiesRes = await api.get<any>('/companies?limit=10').catch(() => null);

      if (overviewRes) {
        setStats(overviewRes.data || overviewRes);
      }
      if (companiesRes) {
        const companyData = companiesRes.data?.data || companiesRes.data || companiesRes;
        setCompanies(Array.isArray(companyData) ? companyData : []);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const statCards = [
    { label: 'Total Companies', value: stats?.totalCompanies || 0, icon: Building2, color: 'text-blue-600' },
    { label: 'Active Companies', value: stats?.activeCompanies || 0, icon: Activity, color: 'text-green-600' },
    { label: 'Total Users', value: stats?.totalUsers || 0, icon: Users, color: 'text-purple-600' },
    { label: 'Total Properties', value: stats?.totalProperties || 0, icon: Home, color: 'text-orange-600' },
    { label: 'Total Sales', value: stats?.totalSales || 0, icon: DollarSign, color: 'text-emerald-600' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Platform Overview</h1>
          <p className="text-muted-foreground">Manage all companies from one dashboard</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-800 ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Companies */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Companies</CardTitle>
          <Button variant="outline" size="sm" onClick={() => window.location.href = '/dashboard/super-admin/companies'}>
            View All
          </Button>
        </CardHeader>
        <CardContent>
          {companies.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No companies yet. Create your first company to get started.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium">Company</th>
                    <th className="text-left py-3 px-2 font-medium">Domain</th>
                    <th className="text-left py-3 px-2 font-medium">Status</th>
                    <th className="text-left py-3 px-2 font-medium">Users</th>
                    <th className="text-left py-3 px-2 font-medium">Properties</th>
                    <th className="text-left py-3 px-2 font-medium">Sales</th>
                    <th className="text-left py-3 px-2 font-medium">Invite Code</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map((company: any) => (
                    <tr key={company.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          {company.logo ? (
                            <img src={company.logo} alt="" className="w-8 h-8 rounded object-contain" />
                          ) : (
                            <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                              <Building2 className="w-4 h-4 text-primary" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{company.name}</p>
                            <p className="text-xs text-muted-foreground">{company.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-muted-foreground">{company.domain}</td>
                      <td className="py-3 px-2">
                        <Badge variant={company.isActive ? 'default' : 'secondary'}>
                          {company.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="py-3 px-2">{company.stats?.users || 0}</td>
                      <td className="py-3 px-2">{company.stats?.properties || 0}</td>
                      <td className="py-3 px-2">{company.stats?.sales || 0}</td>
                      <td className="py-3 px-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded">{company.inviteCode}</code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
