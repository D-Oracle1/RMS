'use client';

import { useState } from 'react';
import {
  Pin,
  ThumbsUp,
  Lightbulb,
  Rocket,
  MessageSquare,
  Bookmark,
  Eye,
  ExternalLink,
  Video,
  Share2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { api, getImageUrl } from '@/lib/api';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PostAuthor {
  id: string;
  firstName: string;
  lastName: string;
  avatar?: string;
}

export interface PostData {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  type: string;
  mediaUrl?: string;
  mediaType?: string;
  externalLink?: string;
  isPinned: boolean;
  publishedAt: string;
  author: PostAuthor;
  userReaction: string | null;
  isSaved: boolean;
  reactionCount: number;
  commentCount: number;
  viewCount: number;
}

export interface PostCardProps {
  post: PostData;
  onReact: (postId: string, type: string) => void;
  onSave: (postId: string) => void;
  onOpenDetail: (postId: string) => void;
  onShare?: (postId: string) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function timeAgo(date: string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const TYPE_CONFIG: Record<string, { label: string; className: string }> = {
  ANNOUNCEMENT: {
    label: 'Announcement',
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  PRODUCT_UPDATE: {
    label: 'Product Update',
    className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  },
  EDUCATIONAL_TIP: {
    label: 'Educational Tip',
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
    label: 'Sponsored Feature',
    className: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  },
};

const REACTIONS = [
  { type: 'HELPFUL', icon: ThumbsUp, label: 'Helpful' },
  { type: 'INSIGHTFUL', icon: Lightbulb, label: 'Insightful' },
  { type: 'GAME_CHANGER', icon: Rocket, label: 'Game Changer' },
] as const;

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PostCard({ post, onReact, onSave, onOpenDetail, onShare }: PostCardProps) {
  const [ctaLoading, setCtaLoading] = useState(false);
  const [imgOrientation, setImgOrientation] = useState<'portrait' | 'landscape' | null>(null);

  const handleImgLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImgOrientation(img.naturalHeight > img.naturalWidth ? 'portrait' : 'landscape');
  };

  const hasImage = !!post.mediaUrl && !post.mediaType?.startsWith('video');
  const isPortrait = hasImage && imgOrientation === 'portrait';

  const typeConfig = TYPE_CONFIG[post.type] || {
    label: post.type.replace(/_/g, ' '),
    className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  };

  const handleCtaClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!post.externalLink) return;
    setCtaLoading(true);
    try {
      await api.post(`/engagement/feed/${post.id}/cta-click`);
    } catch {
      // Silently fail -- don't block the user
    } finally {
      setCtaLoading(false);
      window.open(post.externalLink, '_blank', 'noopener,noreferrer');
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Ignore clicks on interactive elements
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a')) return;
    onOpenDetail(post.id);
  };

  return (
    <Card
      className="group cursor-pointer transition-shadow hover:shadow-md"
      onClick={handleCardClick}
    >
      <CardContent className="p-4 sm:p-5">
        {/* Pinned indicator */}
        {post.isPinned && (
          <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium mb-2">
            <Pin className="h-3 w-3" />
            <span>Pinned</span>
          </div>
        )}

        {/* Type badge + author row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="h-9 w-9 shrink-0">
              {post.author.avatar && (
                <AvatarImage src={getImageUrl(post.author.avatar)} alt={post.author.firstName} />
              )}
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                {getInitials(post.author.firstName, post.author.lastName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">
                {post.author.firstName} {post.author.lastName}
              </p>
              <p className="text-xs text-muted-foreground">{timeAgo(post.publishedAt)}</p>
            </div>
          </div>
          <Badge className={cn('shrink-0 border-0 text-[11px]', typeConfig.className)}>
            {typeConfig.label}
          </Badge>
        </div>

        {/* Portrait: title+content left, thumbnail right */}
        {isPortrait ? (
          <div className="flex gap-3 mb-3 items-start">
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-bold leading-snug mb-1.5">{post.title}</h3>
              <div
                className="text-sm text-muted-foreground line-clamp-4 prose prose-sm dark:prose-invert max-w-none [&>*]:m-0"
                dangerouslySetInnerHTML={{ __html: post.excerpt || post.content }}
              />
            </div>
            <div className="w-24 sm:w-32 shrink-0 rounded-lg overflow-hidden self-stretch min-h-[96px]">
              <img
                src={getImageUrl(post.mediaUrl!)}
                alt={post.title}
                className="w-full h-full object-cover"
                loading="lazy"
                onLoad={handleImgLoad}
              />
            </div>
          </div>
        ) : (
          <>
            {/* Title */}
            <h3 className="text-lg font-bold leading-snug mb-2">{post.title}</h3>

            {/* Content preview */}
            <div
              className="text-sm text-muted-foreground mb-3 line-clamp-3 prose prose-sm dark:prose-invert max-w-none [&>*]:m-0"
              dangerouslySetInnerHTML={{ __html: post.excerpt || post.content }}
            />

            {/* Media preview: landscape or video */}
            {post.mediaUrl && (
              <div className="mb-3 rounded-lg overflow-hidden bg-muted/50">
                {post.mediaType?.startsWith('video') ? (
                  <div className="flex items-center justify-center h-40 sm:h-52 bg-muted/30">
                    <Video className="h-10 w-10 text-muted-foreground" />
                  </div>
                ) : (
                  <img
                    src={getImageUrl(post.mediaUrl)}
                    alt={post.title}
                    className="w-full max-h-[260px] object-cover"
                    loading="lazy"
                    onLoad={handleImgLoad}
                  />
                )}
              </div>
            )}
          </>
        )}

        {/* CTA button */}
        {post.externalLink && (
          <Button
            variant="outline"
            size="sm"
            className="mb-3"
            onClick={handleCtaClick}
            disabled={ctaLoading}
          >
            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
            Learn More
          </Button>
        )}

        {/* Interaction bar */}
        <div className="flex items-center justify-between border-t pt-3 -mx-1">
          {/* Reactions */}
          <div className="flex items-center gap-0.5">
            {REACTIONS.map(({ type, icon: Icon, label }) => (
              <Button
                key={type}
                variant="ghost"
                size="sm"
                className={cn(
                  'h-8 px-2 text-xs gap-1 text-muted-foreground',
                  post.userReaction === type &&
                    'text-primary bg-primary/10 hover:bg-primary/15 hover:text-primary'
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  onReact(post.id, type);
                }}
                title={label}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </Button>
            ))}
            {post.reactionCount > 0 && (
              <span className="text-xs text-muted-foreground ml-1">{post.reactionCount}</span>
            )}
          </div>

          {/* Comments, Save, Views */}
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs gap-1 text-muted-foreground"
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetail(post.id);
              }}
              title="Comments"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              {post.commentCount > 0 && <span>{post.commentCount}</span>}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-8 px-2 text-xs text-muted-foreground',
                post.isSaved && 'text-primary hover:text-primary'
              )}
              onClick={(e) => {
                e.stopPropagation();
                onSave(post.id);
              }}
              title={post.isSaved ? 'Unsave' : 'Save'}
            >
              <Bookmark className={cn('h-3.5 w-3.5', post.isSaved && 'fill-current')} />
            </Button>

            {onShare && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs text-muted-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  onShare(post.id);
                }}
                title="Share internally"
              >
                <Share2 className="h-3.5 w-3.5" />
              </Button>
            )}

            <div className="flex items-center gap-1 text-xs text-muted-foreground px-2">
              <Eye className="h-3.5 w-3.5" />
              <span>{post.viewCount}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
