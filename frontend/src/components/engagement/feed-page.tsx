'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Newspaper } from 'lucide-react';
import PostCard, { PostData } from '@/components/engagement/post-card';
import TrendingSidebar from '@/components/engagement/trending-sidebar';
import PostDetailDialog from '@/components/engagement/post-detail-dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/lib/api';
import { toast } from 'sonner';

const POST_TYPES = [
  { value: 'ALL', label: 'All Types' },
  { value: 'ANNOUNCEMENT', label: 'Announcement' },
  { value: 'PRODUCT_UPDATE', label: 'Product Update' },
  { value: 'EDUCATIONAL_TIP', label: 'Educational Tip' },
  { value: 'EVENT', label: 'Event' },
  { value: 'POLL', label: 'Poll' },
  { value: 'CASE_STUDY', label: 'Case Study' },
  { value: 'SPONSORED_FEATURE', label: 'Sponsored Feature' },
];

interface FeedMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function EngagementFeedPage() {
  const [posts, setPosts] = useState<PostData[]>([]);
  const [meta, setMeta] = useState<FeedMeta>({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [detailPostId, setDetailPostId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const fetchPosts = useCallback(async (pageNum: number, type: string, append = false) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(pageNum), limit: '10' });
      if (type !== 'ALL') params.set('type', type);
      const res = await api.get<{ data: PostData[]; meta: FeedMeta }>(`/engagement/feed?${params}`);
      const newPosts = res.data || [];
      const newMeta = res.meta || { page: 1, limit: 10, total: 0, totalPages: 1 };
      setPosts((prev) => (append ? [...prev, ...newPosts] : newPosts));
      setMeta(newMeta);
    } catch {
      toast.error('Failed to load feed');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    setPage(1);
    fetchPosts(1, typeFilter, false);
  }, [typeFilter, fetchPosts]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPosts(nextPage, typeFilter, true);
  };

  const handleReact = async (postId: string, type: string) => {
    try {
      const res = await api.post<any>(`/engagement/feed/${postId}/react`, { type });
      const data = res?.data ?? res;
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p;
          const wasRemove = data.action === 'removed';
          const newReaction = wasRemove ? null : type;
          const reactionCount = wasRemove
            ? Math.max(0, p.reactionCount - 1)
            : p.userReaction
            ? p.reactionCount
            : p.reactionCount + 1;
          return { ...p, userReaction: newReaction, reactionCount };
        })
      );
    } catch {
      toast.error('Failed to react');
    }
  };

  const handleSave = async (postId: string) => {
    try {
      const res = await api.post<any>(`/engagement/feed/${postId}/save`);
      const data = res?.data ?? res;
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, isSaved: data.saved } : p))
      );
      toast.success(data.saved ? 'Post saved' : 'Post unsaved');
    } catch {
      toast.error('Failed to save post');
    }
  };

  const handleOpenDetail = (postId: string) => {
    setDetailPostId(postId);
    setDetailOpen(true);
  };

  const handleShare = async (postId: string) => {
    try {
      await api.post(`/engagement/feed/${postId}/share`);
      toast.success('Shared internally');
    } catch {
      toast.error('Failed to share');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Feed</h1>
        <p className="text-muted-foreground">Stay up to date with the latest updates and announcements</p>
      </div>

      <div className="flex gap-6">
        {/* Main feed */}
        <div className="flex-1 min-w-0 space-y-4">
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              {POST_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading feed...</span>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20">
              <Newspaper className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-muted-foreground">No posts available yet</p>
            </div>
          ) : (
            <>
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onReact={handleReact}
                  onSave={handleSave}
                  onOpenDetail={handleOpenDetail}
                  onShare={handleShare}
                />
              ))}
              {page < meta.totalPages && (
                <div className="flex justify-center pt-2">
                  <Button
                    variant="outline"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Loading...
                      </>
                    ) : (
                      'Load more'
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Trending sidebar */}
        <div className="hidden lg:block w-72 shrink-0">
          <TrendingSidebar />
        </div>
      </div>

      <PostDetailDialog
        postId={detailPostId}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      />
    </div>
  );
}
