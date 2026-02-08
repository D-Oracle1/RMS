'use client';

import { useState, useEffect } from 'react';
import { Building2, Users, Home, DollarSign, Loader2, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';

export default function SuperAdminAnalytics() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get<any>('/companies?limit=100');
      const result = res.data?.data || res.data || res;
      setCompanies(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
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

  // Sort by different metrics
  const byUsers = [...companies].sort((a, b) => (b.stats?.users || 0) - (a.stats?.users || 0));
  const byProperties = [...companies].sort((a, b) => (b.stats?.properties || 0) - (a.stats?.properties || 0));
  const bySales = [...companies].sort((a, b) => (b.stats?.sales || 0) - (a.stats?.sales || 0));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Platform Analytics</h1>
          <p className="text-muted-foreground">Cross-company performance breakdown</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Top by Users */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4" /> Top by Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {byUsers.slice(0, 10).map((c, i) => (
                <div key={c.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-5">{i + 1}.</span>
                    <span className="text-sm font-medium truncate">{c.name}</span>
                  </div>
                  <Badge variant="secondary">{c.stats?.users || 0}</Badge>
                </div>
              ))}
              {companies.length === 0 && <p className="text-sm text-muted-foreground">No data</p>}
            </div>
          </CardContent>
        </Card>

        {/* Top by Properties */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Home className="w-4 h-4" /> Top by Properties
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {byProperties.slice(0, 10).map((c, i) => (
                <div key={c.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-5">{i + 1}.</span>
                    <span className="text-sm font-medium truncate">{c.name}</span>
                  </div>
                  <Badge variant="secondary">{c.stats?.properties || 0}</Badge>
                </div>
              ))}
              {companies.length === 0 && <p className="text-sm text-muted-foreground">No data</p>}
            </div>
          </CardContent>
        </Card>

        {/* Top by Sales */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="w-4 h-4" /> Top by Sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {bySales.slice(0, 10).map((c, i) => (
                <div key={c.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-5">{i + 1}.</span>
                    <span className="text-sm font-medium truncate">{c.name}</span>
                  </div>
                  <Badge variant="secondary">{c.stats?.sales || 0}</Badge>
                </div>
              ))}
              {companies.length === 0 && <p className="text-sm text-muted-foreground">No data</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* All Companies Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Companies Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 font-medium">Company</th>
                  <th className="text-right py-3 px-2 font-medium">Users</th>
                  <th className="text-right py-3 px-2 font-medium">Properties</th>
                  <th className="text-right py-3 px-2 font-medium">Sales</th>
                  <th className="text-left py-3 px-2 font-medium">Plan</th>
                  <th className="text-left py-3 px-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((c) => (
                  <tr key={c.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-2 font-medium">{c.name}</td>
                    <td className="py-3 px-2 text-right">{c.stats?.users || 0}</td>
                    <td className="py-3 px-2 text-right">{c.stats?.properties || 0}</td>
                    <td className="py-3 px-2 text-right">{c.stats?.sales || 0}</td>
                    <td className="py-3 px-2 capitalize">{c.plan}</td>
                    <td className="py-3 px-2">
                      <Badge variant={c.isActive ? 'default' : 'secondary'} className="text-xs">
                        {c.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
