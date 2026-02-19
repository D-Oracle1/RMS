'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, CalendarDays, ThumbsUp, MessageSquare, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TrendingPost {
  id: string;
  title: string;
  type: string;
  excerpt: string;
  reactionCount: number;
  commentCount: number;
  viewCount: number;
  publishedAt: string;
}

interface UpcomingEvent {
  id: string;
  title: string;
  excerpt: string;
  scheduledAt: string;
  externalLink?: string;
}

export interface TrendingSidebarProps {
  className?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TYPE_CONFIG: Record<string, { label: string; className: string }> = {
  ANNOUNCEMENT: {
    label: 'Announcement',
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  PRODUCT_UPDATE: {
    label: 'Update',
    className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  },
  EDUCATIONAL_TIP: {
    label: 'Tip',
    className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  },
  EVENT: {
    label: 'Event',
    className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  },
  POLL: {
    label: 'Poll',
    className: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  },
  CASE_STUDY: {
    label: 'Case Study',
    className: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  },
  SPONSORED_FEATURE: {
    label: 'Sponsored',
    className: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  },
};

function formatEventDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} days`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// ---------------------------------------------------------------------------
// Skeleton loader
// ---------------------------------------------------------------------------

function SidebarSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Trending skeleton */}
      <div>
        <div className="h-4 w-20 bg-muted rounded mb-3" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="py-2.5 space-y-1.5">
            <div className="h-3.5 bg-muted rounded w-full" />
            <div className="h-3 bg-muted rounded w-2/3" />
            <div className="flex gap-3">
              <div className="h-3 w-10 bg-muted rounded" />
              <div className="h-3 w-10 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
      {/* Events skeleton */}
      <div>
        <div className="h-4 w-32 bg-muted rounded mb-3" />
        {[1, 2].map((i) => (
          <div key={i} className="py-2.5 space-y-1.5">
            <div className="h-3.5 bg-muted rounded w-full" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TrendingSidebar({ className }: TrendingSidebarProps) {
  const [trending, setTrending] = useState<TrendingPost[]>([]);
  const [events, setEvents] = useState<UpcomingEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [trendingRes, eventsRes] = await Promise.all([
          api.get<any>('/engagement/trending').catch(() => null),
          api.get<any>('/engagement/events').catch(() => null),
        ]);

        if (cancelled) return;

        const trendingData = trendingRes?.data ?? trendingRes;
        const eventsData = eventsRes?.data ?? eventsRes;

        setTrending(Array.isArray(trendingData) ? trendingData : []);
        setEvents(Array.isArray(eventsData) ? eventsData : []);
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="p-4 sm:p-5">
        {loading ? (
          <SidebarSkeleton />
        ) : (
          <div className="space-y-6">
            {/* Trending section */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">Trending</h3>
              </div>

              {trending.length === 0 ? (
                <p className="text-xs text-muted-foreground py-3 text-center">
                  No trending posts right now
                </p>
              ) : (
                <div className="divide-y">
                  {trending.map((post) => {
                    const typeConf = TYPE_CONFIG[post.type] || {
                      label: post.type.replace(/_/g, ' '),
                      className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
                    };

                    return (
                      <div
                        key={post.id}
                        className="py-2.5 first:pt-0 last:pb-0 cursor-pointer group"
                      >
                        <div className="flex items-start gap-2 mb-1">
                          <h4 className="text-sm font-medium leading-snug flex-1 group-hover:text-primary transition-colors line-clamp-2">
                            {post.title}
                          </h4>
                          <Badge
                            className={cn(
                              'shrink-0 border-0 text-[10px] px-1.5 py-0',
                              typeConf.className
                            )}
                          >
                            {typeConf.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="h-3 w-3" />
                            {post.reactionCount}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {post.commentCount}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {post.viewCount}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Upcoming events section */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <CalendarDays className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">Upcoming Events</h3>
              </div>

              {events.length === 0 ? (
                <p className="text-xs text-muted-foreground py-3 text-center">
                  No upcoming events
                </p>
              ) : (
                <div className="divide-y">
                  {events.map((event) => (
                    <div
                      key={event.id}
                      className="py-2.5 first:pt-0 last:pb-0 cursor-pointer group"
                    >
                      <h4 className="text-sm font-medium leading-snug group-hover:text-primary transition-colors line-clamp-2">
                        {event.title}
                      </h4>
                      {event.excerpt && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {event.excerpt}
                        </p>
                      )}
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                        <CalendarDays className="h-3 w-3" />
                        <span>{formatEventDate(event.scheduledAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
