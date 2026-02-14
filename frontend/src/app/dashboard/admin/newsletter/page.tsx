'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Mail,
  Users,
  UserMinus,
  Search,
  Trash2,
  Send,
  Loader2,
  Download,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { api } from '@/lib/api';

interface Subscriber {
  id: string;
  email: string;
  name: string | null;
  isActive: boolean;
  subscribedAt: string;
  unsubscribedAt: string | null;
}

interface Stats {
  total: number;
  active: number;
  unsubscribed: number;
}

type Tab = 'subscribers' | 'compose';
type StatusFilter = 'all' | 'active' | 'unsubscribed';

export default function NewsletterPage() {
  const [tab, setTab] = useState<Tab>('subscribers');
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, unsubscribed: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Compose state
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const data = await api.get<Stats>('/newsletter/stats');
      setStats(data);
    } catch {
      // silently fail
    }
  }, []);

  const fetchSubscribers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (searchTerm) params.set('search', searchTerm);
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const res = await api.get<{ data: Subscriber[]; meta: { totalPages: number } }>(
        `/newsletter/subscribers?${params}`
      );
      setSubscribers(res.data || []);
      setTotalPages(res.meta?.totalPages || 1);
    } catch {
      toast.error('Failed to load subscribers');
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, statusFilter]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchSubscribers();
  }, [fetchSubscribers]);

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this subscriber permanently?')) return;
    try {
      await api.delete(`/newsletter/subscribers/${id}`);
      toast.success('Subscriber removed');
      fetchSubscribers();
      fetchStats();
    } catch {
      toast.error('Failed to delete subscriber');
    }
  };

  const handleSend = async () => {
    if (!subject.trim() || !content.trim()) {
      toast.error('Subject and content are required');
      return;
    }
    setSending(true);
    try {
      const res = await api.post<{ message: string; sent: number }>('/newsletter/send', {
        subject,
        content,
      });
      toast.success(res.message || `Newsletter sent to ${res.sent} subscribers`);
      setSubject('');
      setContent('');
      setShowConfirm(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to send newsletter');
    } finally {
      setSending(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Email', 'Name', 'Status', 'Subscribed Date'];
    const csvContent = [
      headers.join(','),
      ...subscribers.map((s) =>
        [
          s.email,
          `"${s.name || ''}"`,
          s.isActive ? 'Active' : 'Unsubscribed',
          new Date(s.subscribedAt).toLocaleDateString(),
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `newsletter-subscribers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Subscribers exported');
  };

  const statCards = [
    { title: 'Total Subscribers', value: stats.total, icon: Mail, color: 'text-blue-600', bg: 'bg-blue-100' },
    { title: 'Active', value: stats.active, icon: Users, color: 'text-green-600', bg: 'bg-green-100' },
    { title: 'Unsubscribed', value: stats.unsubscribed, icon: UserMinus, color: 'text-red-600', bg: 'bg-red-100' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className={`inline-flex p-3 rounded-lg ${stat.bg} mb-4`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <h3 className="text-2xl font-bold">{stat.value}</h3>
              <p className="text-sm text-muted-foreground">{stat.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <Button
          variant={tab === 'subscribers' ? 'default' : 'outline'}
          onClick={() => setTab('subscribers')}
        >
          <Users className="w-4 h-4 mr-2" />
          Subscribers
        </Button>
        <Button
          variant={tab === 'compose' ? 'default' : 'outline'}
          onClick={() => setTab('compose')}
        >
          <Send className="w-4 h-4 mr-2" />
          Compose Email
        </Button>
      </div>

      {/* Subscribers Tab */}
      {tab === 'subscribers' && (
        <Card>
          <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              Newsletter Subscribers
            </CardTitle>
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search subscribers..."
                  className="pl-9 w-full md:w-64"
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                />
              </div>
              <select
                className="px-3 py-2 border rounded-md text-sm"
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value as StatusFilter); setPage(1); }}
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="unsubscribed">Unsubscribed</option>
              </select>
              <Button variant="outline" size="sm" onClick={handleExportCSV}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Loading...</span>
              </div>
            ) : subscribers.length === 0 ? (
              <div className="text-center py-12">
                <Mail className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-muted-foreground">No subscribers found</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Email</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Name</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Subscribed</th>
                        <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subscribers.map((sub) => (
                        <tr key={sub.id} className="border-b last:border-0 hover:bg-muted/50">
                          <td className="py-3 px-4 font-medium">{sub.email}</td>
                          <td className="py-3 px-4 text-muted-foreground">{sub.name || '—'}</td>
                          <td className="py-3 px-4">
                            {sub.isActive ? (
                              <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
                            ) : (
                              <Badge variant="secondary">Unsubscribed</Badge>
                            )}
                          </td>
                          <td className="py-3 px-4 text-muted-foreground">
                            {new Date(sub.subscribedAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(sub.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage(page - 1)}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Compose Tab */}
      {tab === 'compose' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-primary" />
              Compose Newsletter
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Subject *</label>
              <Input
                placeholder="Newsletter subject line..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Content (HTML supported) *</label>
              <textarea
                className="w-full min-h-[300px] p-4 border rounded-lg text-sm font-mono resize-y focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                placeholder={`<h2>Hello!</h2>\n<p>We have exciting new properties for you...</p>\n<p>Check out our latest listings!</p>`}
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                You can use HTML tags for formatting. An unsubscribe link will be added automatically.
              </p>
            </div>

            {/* Preview */}
            {content && (
              <div>
                <label className="text-sm font-medium mb-1 block">Preview</label>
                <div
                  className="border rounded-lg p-4 bg-white prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              </div>
            )}

            <div className="flex items-center gap-3 pt-4">
              {!showConfirm ? (
                <Button
                  onClick={() => {
                    if (!subject.trim() || !content.trim()) {
                      toast.error('Subject and content are required');
                      return;
                    }
                    setShowConfirm(true);
                  }}
                  className="bg-primary"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send to All Active Subscribers ({stats.active})
                </Button>
              ) : (
                <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg w-full">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-800">
                      Send &quot;{subject}&quot; to {stats.active} active subscribers?
                    </p>
                    <p className="text-xs text-amber-600">This action cannot be undone.</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowConfirm(false)} disabled={sending}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSend} disabled={sending} className="bg-primary">
                      {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      {sending ? 'Sending...' : 'Confirm Send'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
