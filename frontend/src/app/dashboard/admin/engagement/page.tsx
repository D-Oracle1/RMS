'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Loader2,
  Pencil,
  Trash2,
  Send,
  Eye,
  Heart,
  BarChart3,
  Upload,
  FileText,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { cn, formatDate, formatNumber } from '@/lib/utils';

// --- Types ---

type PostType =
  | 'ANNOUNCEMENT'
  | 'PRODUCT_UPDATE'
  | 'EDUCATIONAL_TIP'
  | 'EVENT'
  | 'POLL'
  | 'CASE_STUDY'
  | 'SPONSORED_FEATURE';

type PostStatus = 'DRAFT' | 'PUBLISHED' | 'SCHEDULED' | 'ARCHIVED';

interface Post {
  id: string;
  title: string;
  type: PostType;
  status: PostStatus;
  content: string;
  excerpt?: string;
  mediaUrl?: string;
  externalLink?: string;
  tags: string[];
  scheduledAt?: string;
  expiresAt?: string;
  isPinned: boolean;
  commentsDisabled: boolean;
  viewCount: number;
  reactionCount: number;
  commentCount: number;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface PostMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface Analytics {
  totalPosts: number;
  published: number;
  totalViews: number;
  totalReactions: number;
  totalComments: number;
  avgEngagementRate: number;
  typeBreakdown: Record<string, number>;
}

interface PostFormData {
  title: string;
  type: PostType;
  content: string;
  excerpt: string;
  mediaUrl: string;
  externalLink: string;
  tags: string[];
  scheduledAt: string;
  expiresAt: string;
  isPinned: boolean;
  commentsDisabled: boolean;
}

// --- Constants ---

const POST_TYPES: PostType[] = [
  'ANNOUNCEMENT',
  'PRODUCT_UPDATE',
  'EDUCATIONAL_TIP',
  'EVENT',
  'POLL',
  'CASE_STUDY',
  'SPONSORED_FEATURE',
];

const POST_TYPE_LABELS: Record<PostType, string> = {
  ANNOUNCEMENT: 'Announcement',
  PRODUCT_UPDATE: 'Product Update',
  EDUCATIONAL_TIP: 'Educational Tip',
  EVENT: 'Event',
  POLL: 'Poll',
  CASE_STUDY: 'Case Study',
  SPONSORED_FEATURE: 'Sponsored Feature',
};

const POST_TYPE_COLORS: Record<PostType, string> = {
  ANNOUNCEMENT: 'bg-blue-100 text-blue-800',
  PRODUCT_UPDATE: 'bg-purple-100 text-purple-800',
  EDUCATIONAL_TIP: 'bg-green-100 text-green-800',
  EVENT: 'bg-orange-100 text-orange-800',
  POLL: 'bg-cyan-100 text-cyan-800',
  CASE_STUDY: 'bg-indigo-100 text-indigo-800',
  SPONSORED_FEATURE: 'bg-pink-100 text-pink-800',
};

const STATUS_COLORS: Record<PostStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  PUBLISHED: 'bg-green-100 text-green-800',
  SCHEDULED: 'bg-yellow-100 text-yellow-800',
  ARCHIVED: 'bg-red-100 text-red-800',
};

const TAG_OPTIONS = ['CLIENT', 'REALTOR', 'STAFF'] as const;

const EMPTY_FORM: PostFormData = {
  title: '',
  type: 'ANNOUNCEMENT',
  content: '',
  excerpt: '',
  mediaUrl: '',
  externalLink: '',
  tags: [],
  scheduledAt: '',
  expiresAt: '',
  isPinned: false,
  commentsDisabled: false,
};

// --- Component ---

export default function EngagementPage() {
  const [activeTab, setActiveTab] = useState<'posts' | 'analytics'>('posts');

  // Posts state
  const [posts, setPosts] = useState<Post[]>([]);
  const [meta, setMeta] = useState<PostMeta>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [form, setForm] = useState<PostFormData>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Analytics state
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // --- Data fetching ---

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (typeFilter !== 'ALL') params.set('type', typeFilter);

      const res = await api.get<{ data: Post[]; meta: PostMeta }>(
        `/engagement/posts?${params}`
      );
      setPosts(res.data || []);
      setMeta(res.meta || { page: 1, limit: 20, total: 0, totalPages: 1 });
    } catch {
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, typeFilter]);

  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const res = await api.get<Analytics>('/engagement/analytics');
      setAnalytics(res);
    } catch {
      toast.error('Failed to load analytics');
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'posts') {
      fetchPosts();
    } else {
      fetchAnalytics();
    }
  }, [activeTab, fetchPosts, fetchAnalytics]);

  // --- Handlers ---

  const updateForm = (field: keyof PostFormData, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleTag = (tag: string) => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const openCreateDialog = () => {
    setEditingPost(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEditDialog = (post: Post) => {
    setEditingPost(post);
    setForm({
      title: post.title,
      type: post.type,
      content: post.content,
      excerpt: post.excerpt || '',
      mediaUrl: post.mediaUrl || '',
      externalLink: post.externalLink || '',
      tags: post.tags || [],
      scheduledAt: post.scheduledAt
        ? new Date(post.scheduledAt).toISOString().slice(0, 16)
        : '',
      expiresAt: post.expiresAt
        ? new Date(post.expiresAt).toISOString().slice(0, 16)
        : '',
      isPinned: post.isPinned,
      commentsDisabled: post.commentsDisabled,
    });
    setDialogOpen(true);
  };

  const buildPayload = () => {
    const payload: Record<string, any> = {
      title: form.title,
      type: form.type,
      content: form.content,
    };
    if (form.excerpt) payload.excerpt = form.excerpt;
    if (form.mediaUrl) payload.mediaUrl = form.mediaUrl;
    if (form.externalLink) payload.externalLink = form.externalLink;
    if (form.tags.length > 0) payload.tags = form.tags;
    if (form.scheduledAt) payload.scheduledAt = new Date(form.scheduledAt).toISOString();
    if (form.expiresAt) payload.expiresAt = new Date(form.expiresAt).toISOString();
    payload.isPinned = form.isPinned;
    payload.commentsDisabled = form.commentsDisabled;
    return payload;
  };

  const handleSaveDraft = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error('Title and content are required');
      return;
    }
    setSubmitting(true);
    try {
      const payload = buildPayload();
      if (editingPost) {
        await api.put(`/engagement/posts/${editingPost.id}`, payload);
        toast.success('Post updated successfully');
      } else {
        await api.post('/engagement/posts', payload);
        toast.success('Post saved as draft');
      }
      setDialogOpen(false);
      fetchPosts();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save post');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublish = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error('Title and content are required');
      return;
    }
    setSubmitting(true);
    try {
      const payload = buildPayload();
      let postId: string;

      if (editingPost) {
        await api.put(`/engagement/posts/${editingPost.id}`, payload);
        postId = editingPost.id;
      } else {
        const created = await api.post<Post>('/engagement/posts', payload);
        postId = created.id;
      }

      await api.post(`/engagement/posts/${postId}/publish`);
      toast.success('Post published successfully');
      setDialogOpen(false);
      fetchPosts();
    } catch (err: any) {
      toast.error(err.message || 'Failed to publish post');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTogglePublish = async (post: Post) => {
    try {
      if (post.status === 'PUBLISHED') {
        await api.put(`/engagement/posts/${post.id}`, { status: 'DRAFT' });
        toast.success('Post unpublished');
      } else {
        await api.post(`/engagement/posts/${post.id}/publish`);
        toast.success('Post published');
      }
      fetchPosts();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update post status');
    }
  };

  const handleDelete = async (post: Post) => {
    if (!confirm(`Are you sure you want to archive "${post.title}"?`)) return;
    try {
      await api.delete(`/engagement/posts/${post.id}`);
      toast.success('Post archived');
      fetchPosts();
    } catch (err: any) {
      toast.error(err.message || 'Failed to archive post');
    }
  };

  const handleMediaUpload = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,video/*';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploading(true);
      try {
        const urls = await api.uploadFiles('/upload/cms-images', [file], 'images');
        if (urls && urls.length > 0) {
          updateForm('mediaUrl', urls[0]);
          toast.success('Media uploaded');
        }
      } catch {
        toast.error('Failed to upload media');
      } finally {
        setUploading(false);
      }
    };
    input.click();
  };

  // --- Render ---

  const renderPostsTab = () => (
    <>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="PUBLISHED">Published</SelectItem>
            <SelectItem value="SCHEDULED">Scheduled</SelectItem>
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            {POST_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {POST_TYPE_LABELS[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex-1" />

        <Button onClick={openCreateDialog} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Create Post
        </Button>
      </div>

      {/* Posts Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading posts...</span>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-muted-foreground">No posts found</p>
              <Button variant="outline" className="mt-4" onClick={openCreateDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Create your first post
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Title</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden md:table-cell">Type</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                      <th className="text-center py-3 px-4 font-medium text-muted-foreground hidden lg:table-cell">Views</th>
                      <th className="text-center py-3 px-4 font-medium text-muted-foreground hidden lg:table-cell">Reactions</th>
                      <th className="text-center py-3 px-4 font-medium text-muted-foreground hidden lg:table-cell">Comments</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground hidden xl:table-cell">Published</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {posts.map((post) => (
                      <tr key={post.id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="py-3 px-4">
                          <div className="font-medium truncate max-w-[200px] lg:max-w-[300px]">
                            {post.title}
                          </div>
                          <div className="md:hidden mt-1">
                            <Badge className={cn('text-xs', POST_TYPE_COLORS[post.type])} variant="secondary">
                              {POST_TYPE_LABELS[post.type]}
                            </Badge>
                          </div>
                        </td>
                        <td className="py-3 px-4 hidden md:table-cell">
                          <Badge className={cn('text-xs', POST_TYPE_COLORS[post.type])} variant="secondary">
                            {POST_TYPE_LABELS[post.type]}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={cn('text-xs', STATUS_COLORS[post.status])} variant="secondary">
                            {post.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-center hidden lg:table-cell text-muted-foreground">
                          {formatNumber(post.viewCount || 0)}
                        </td>
                        <td className="py-3 px-4 text-center hidden lg:table-cell text-muted-foreground">
                          {formatNumber(post.reactionCount || 0)}
                        </td>
                        <td className="py-3 px-4 text-center hidden lg:table-cell text-muted-foreground">
                          {formatNumber(post.commentCount || 0)}
                        </td>
                        <td className="py-3 px-4 hidden xl:table-cell text-muted-foreground">
                          {post.publishedAt ? formatDate(post.publishedAt) : '--'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(post)}
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleTogglePublish(post)}
                              title={post.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                              className={post.status === 'PUBLISHED' ? 'text-yellow-600 hover:text-yellow-700' : 'text-green-600 hover:text-green-700'}
                            >
                              <Send className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(post)}
                              title="Archive"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {meta.totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <p className="text-sm text-muted-foreground">
                    Showing {(meta.page - 1) * meta.limit + 1}--{Math.min(meta.page * meta.limit, meta.total)} of{' '}
                    {meta.total} posts
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage(page - 1)}
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
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
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </>
  );

  const renderAnalyticsTab = () => {
    if (analyticsLoading) {
      return (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading analytics...</span>
        </div>
      );
    }

    if (!analytics) {
      return (
        <div className="text-center py-20">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-muted-foreground">No analytics data available</p>
        </div>
      );
    }

    const statCards = [
      {
        title: 'Total Posts',
        value: formatNumber(analytics.totalPosts),
        icon: FileText,
        color: 'text-blue-600',
        bg: 'bg-blue-100',
      },
      {
        title: 'Total Views',
        value: formatNumber(analytics.totalViews),
        icon: Eye,
        color: 'text-purple-600',
        bg: 'bg-purple-100',
      },
      {
        title: 'Engagement Rate',
        value: `${(analytics.avgEngagementRate || 0).toFixed(1)}%`,
        icon: TrendingUp,
        color: 'text-green-600',
        bg: 'bg-green-100',
      },
      {
        title: 'Total Reactions',
        value: formatNumber(analytics.totalReactions),
        icon: Heart,
        color: 'text-pink-600',
        bg: 'bg-pink-100',
      },
    ];

    return (
      <div className="space-y-6">
        {/* Stat Cards */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className={cn('inline-flex p-3 rounded-lg mb-4', stat.bg)}>
                  <stat.icon className={cn('w-6 h-6', stat.color)} />
                </div>
                <h3 className="text-2xl font-bold">{stat.value}</h3>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Type Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Posts by Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.typeBreakdown && Object.keys(analytics.typeBreakdown).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(analytics.typeBreakdown).map(([type, count]) => {
                  const postType = type as PostType;
                  const maxCount = Math.max(...Object.values(analytics.typeBreakdown));
                  const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;

                  return (
                    <div key={type} className="flex items-center gap-3">
                      <Badge
                        className={cn('text-xs w-[140px] justify-center shrink-0', POST_TYPE_COLORS[postType])}
                        variant="secondary"
                      >
                        {POST_TYPE_LABELS[postType] || type}
                      </Badge>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-10 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No type breakdown data available</p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderDialog = () => (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingPost ? 'Edit Post' : 'Create Post'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Title */}
          <div>
            <label className="text-sm font-medium mb-1 block">Title *</label>
            <Input
              placeholder="Enter post title"
              value={form.title}
              onChange={(e) => updateForm('title', e.target.value)}
            />
          </div>

          {/* Post Type */}
          <div>
            <label className="text-sm font-medium mb-1 block">Post Type *</label>
            <Select value={form.type} onValueChange={(v) => updateForm('type', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {POST_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {POST_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Content */}
          <div>
            <label className="text-sm font-medium mb-1 block">Content *</label>
            <Textarea
              placeholder="Write your post content..."
              value={form.content}
              onChange={(e) => updateForm('content', e.target.value)}
              rows={6}
            />
          </div>

          {/* Excerpt */}
          <div>
            <label className="text-sm font-medium mb-1 block">Excerpt</label>
            <Textarea
              placeholder="Short summary (optional)"
              value={form.excerpt}
              onChange={(e) => updateForm('excerpt', e.target.value)}
              rows={2}
            />
          </div>

          {/* Media URL + Upload */}
          <div>
            <label className="text-sm font-medium mb-1 block">Media</label>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Media URL"
                value={form.mediaUrl}
                onChange={(e) => updateForm('mediaUrl', e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleMediaUpload}
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                <span className="ml-2 hidden sm:inline">Upload</span>
              </Button>
            </div>
            {form.mediaUrl && (
              <img
                src={form.mediaUrl}
                alt="Preview"
                className="mt-2 w-full max-h-40 object-cover rounded-lg border"
              />
            )}
          </div>

          {/* External Link */}
          <div>
            <label className="text-sm font-medium mb-1 block">External Link URL</label>
            <Input
              placeholder="https://example.com"
              value={form.externalLink}
              onChange={(e) => updateForm('externalLink', e.target.value)}
            />
          </div>

          {/* Tags */}
          <div>
            <label className="text-sm font-medium mb-1 block">
              Target Audience
            </label>
            <p className="text-xs text-muted-foreground mb-2">
              Select who should see this post. If none selected, defaults to all users.
            </p>
            <div className="flex flex-wrap gap-3">
              {TAG_OPTIONS.map((tag) => (
                <label
                  key={tag}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer transition-colors text-sm',
                    form.tags.includes(tag)
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-input hover:bg-muted'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={form.tags.includes(tag)}
                    onChange={() => toggleTag(tag)}
                    className="rounded border-gray-300"
                  />
                  {tag.charAt(0) + tag.slice(1).toLowerCase()}
                </label>
              ))}
            </div>
          </div>

          {/* Schedule & Expiry */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Schedule Date</label>
              <Input
                type="datetime-local"
                value={form.scheduledAt}
                onChange={(e) => updateForm('scheduledAt', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Expiry Date</label>
              <Input
                type="datetime-local"
                value={form.expiresAt}
                onChange={(e) => updateForm('expiresAt', e.target.value)}
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
            <div className="flex items-center gap-3">
              <Switch
                checked={form.isPinned}
                onCheckedChange={(checked) => updateForm('isPinned', checked)}
              />
              <label className="text-sm font-medium">Pin Post</label>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={form.commentsDisabled}
                onCheckedChange={(checked) => updateForm('commentsDisabled', checked)}
              />
              <label className="text-sm font-medium">Disable Comments</label>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            disabled={submitting}
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Save as Draft
          </Button>
          <Button onClick={handlePublish} disabled={submitting}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
            Publish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold">Engagement Management</h1>
        <p className="text-muted-foreground">Create and manage engagement posts for your audience</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === 'posts' ? 'default' : 'outline'}
          onClick={() => setActiveTab('posts')}
        >
          <FileText className="w-4 h-4 mr-2" />
          Posts
        </Button>
        <Button
          variant={activeTab === 'analytics' ? 'default' : 'outline'}
          onClick={() => setActiveTab('analytics')}
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          Analytics
        </Button>
      </div>

      {/* Tab Content */}
      {activeTab === 'posts' ? renderPostsTab() : renderAnalyticsTab()}

      {/* Create/Edit Dialog */}
      {renderDialog()}
    </div>
  );
}
