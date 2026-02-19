'use client';

import { useState, useEffect } from 'react';
import { ExternalLink, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { api, getImageUrl } from '@/lib/api';

interface SpotlightPost {
  id: string;
  title: string;
  excerpt?: string;
  content: string;
  type: string;
  mediaUrl?: string;
  externalLink?: string;
  publishedAt: string;
}

const TYPE_COLORS: Record<string, string> = {
  ANNOUNCEMENT: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  PRODUCT_UPDATE: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  EDUCATIONAL_TIP: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  EVENT: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  SPONSORED_FEATURE: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  CASE_STUDY: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
};

const TYPE_LABELS: Record<string, string> = {
  ANNOUNCEMENT: 'Announcement',
  PRODUCT_UPDATE: 'Product Update',
  EDUCATIONAL_TIP: 'Tip',
  EVENT: 'Event',
  SPONSORED_FEATURE: 'Feature',
  CASE_STUDY: 'Case Study',
  POLL: 'Poll',
};

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '').trim();
}

export default function FeatureSpotlight() {
  const [post, setPost] = useState<SpotlightPost | null>(null);

  useEffect(() => {
    // Fetch the latest pinned or SPONSORED_FEATURE/ANNOUNCEMENT post
    api
      .get<{ data: SpotlightPost[] }>('/engagement/feed?limit=5&type=SPONSORED_FEATURE')
      .then((res: any) => {
        const posts: SpotlightPost[] = res?.data ?? res ?? [];
        if (posts.length > 0) {
          setPost(posts[0]);
        } else {
          // Fallback to latest announcement
          return api
            .get<{ data: SpotlightPost[] }>('/engagement/feed?limit=3&type=ANNOUNCEMENT')
            .then((r: any) => {
              const ann: SpotlightPost[] = r?.data ?? r ?? [];
              if (ann.length > 0) setPost(ann[0]);
            });
        }
      })
      .catch(() => {});
  }, []);

  if (!post) return null;

  const typeLabel = TYPE_LABELS[post.type] || post.type.replace(/_/g, ' ');
  const typeColor = TYPE_COLORS[post.type] || 'bg-gray-100 text-gray-700';
  const preview = post.excerpt || stripHtml(post.content).slice(0, 120) + (post.content.length > 120 ? '…' : '');

  const handleCtaClick = async () => {
    try {
      await api.post(`/engagement/feed/${post.id}/cta-click`);
    } catch {
      // silent
    }
    if (post.externalLink) {
      window.open(post.externalLink, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Card className="overflow-hidden border shadow-sm">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-2">
        <div className="w-6 h-6 rounded-md bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
          <Zap className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">Feature Spotlight</h3>
      </div>

      <CardContent className="px-4 pb-4 pt-0">
        {/* Media */}
        {post.mediaUrl && (
          <div className="rounded-lg overflow-hidden mb-3 bg-muted/30">
            <img
              src={getImageUrl(post.mediaUrl)}
              alt={post.title}
              className="w-full h-28 object-cover"
              loading="lazy"
            />
          </div>
        )}

        {/* Badge + Title */}
        <div className="flex items-start gap-2 mb-2">
          <Badge className={cn('text-[10px] px-1.5 py-0 border-0 shrink-0 mt-0.5', typeColor)}>
            {typeLabel}
          </Badge>
        </div>
        <h4 className="text-sm font-semibold leading-snug mb-1.5 line-clamp-2">
          {post.title}
        </h4>
        <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed mb-3">
          {preview}
        </p>

        {/* CTA */}
        {post.externalLink && (
          <Button
            size="sm"
            variant="outline"
            className="w-full text-xs h-8 gap-1.5"
            onClick={handleCtaClick}
          >
            <ExternalLink className="w-3 h-3" />
            Learn More
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
