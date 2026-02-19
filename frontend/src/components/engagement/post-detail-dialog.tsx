'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ThumbsUp,
  Lightbulb,
  Rocket,
  Bookmark,
  Eye,
  Send,
  Trash2,
  Loader2,
  ExternalLink,
  Video,
  MessageSquareOff,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { api, getImageUrl } from '@/lib/api';
import { getUser } from '@/lib/auth-storage';
import { toast } from 'sonner';
import { timeAgo } from './post-card';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Author {
  id: string;
  firstName: string;
  lastName: string;
  avatar?: string;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: Author;
  parentId?: string | null;
  replies?: Comment[];
}

interface FullPost {
  id: string;
  title: string;
  content: string;
  type: string;
  mediaUrl?: string;
  mediaType?: string;
  externalLink?: string;
  isPinned: boolean;
  publishedAt: string;
  commentsDisabled?: boolean;
  author: Author;
  userReaction: string | null;
  isSaved: boolean;
  reactionCount: number;
  commentCount: number;
  viewCount: number;
  reactionBreakdown?: { HELPFUL: number; INSIGHTFUL: number; GAME_CHANGER: number };
  comments?: Comment[];
}

export interface PostDetailDialogProps {
  postId: string | null;
  open: boolean;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const REACTIONS = [
  { type: 'HELPFUL', icon: ThumbsUp, label: 'Helpful' },
  { type: 'INSIGHTFUL', icon: Lightbulb, label: 'Insightful' },
  { type: 'GAME_CHANGER', icon: Rocket, label: 'Game Changer' },
] as const;

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

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function CommentItem({
  comment,
  currentUserId,
  postId,
  depth,
  onReply,
  onDelete,
}: {
  comment: Comment;
  currentUserId: string | undefined;
  postId: string;
  depth: number;
  onReply: (parentId: string) => void;
  onDelete: (commentId: string) => void;
}) {
  const isOwn = currentUserId === comment.user.id;

  return (
    <div className={cn('group', depth > 0 && 'ml-6 sm:ml-10')}>
      <div className="flex gap-2.5 py-2.5">
        <Avatar className="h-7 w-7 shrink-0 mt-0.5">
          {comment.user.avatar && (
            <AvatarImage src={getImageUrl(comment.user.avatar)} alt={comment.user.firstName} />
          )}
          <AvatarFallback className="bg-muted text-[10px] font-semibold">
            {getInitials(comment.user.firstName, comment.user.lastName)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium">
              {comment.user.firstName} {comment.user.lastName}
            </span>
            <span className="text-xs text-muted-foreground">{timeAgo(comment.createdAt)}</span>
          </div>
          <p className="text-sm text-foreground/90 mt-0.5 whitespace-pre-wrap break-words">
            {comment.content}
          </p>
          <div className="flex items-center gap-3 mt-1">
            {depth === 0 && (
              <button
                onClick={() => onReply(comment.id)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Reply
              </button>
            )}
            {isOwn && (
              <button
                onClick={() => onDelete(comment.id)}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
              >
                <Trash2 className="h-3 w-3" />
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Threaded replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="border-l-2 border-muted">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              postId={postId}
              depth={depth + 1}
              onReply={onReply}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function PostDetailDialog({ postId, open, onClose }: PostDetailDialogProps) {
  const currentUser = getUser();
  const [post, setPost] = useState<FullPost | null>(null);
  const [loading, setLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // ---- Fetch full post ----
  const fetchPost = useCallback(async () => {
    if (!postId) return;
    setLoading(true);
    try {
      const res = await api.get<any>(`/engagement/feed/${postId}`);
      const data = res?.data ?? res;
      setPost(data);
    } catch {
      toast.error('Failed to load post');
      onClose();
    } finally {
      setLoading(false);
    }
  }, [postId, onClose]);

  useEffect(() => {
    if (open && postId) {
      fetchPost();
    }
    if (!open) {
      setPost(null);
      setCommentText('');
      setReplyTo(null);
    }
  }, [open, postId, fetchPost]);

  // ---- Handlers ----

  const handleReact = async (type: string) => {
    if (!post) return;
    try {
      const res = await api.post<any>(`/engagement/feed/${post.id}/react`, { type });
      const data = res?.data ?? res;
      setPost((prev) => {
        if (!prev) return prev;
        const wasRemove = data.action === 'removed';
        const newReaction = wasRemove ? null : type;

        // Recalculate breakdown
        const breakdown = { ...prev.reactionBreakdown } as Record<string, number>;
        if (prev.userReaction && breakdown[prev.userReaction] !== undefined) {
          breakdown[prev.userReaction] = Math.max(0, (breakdown[prev.userReaction] || 0) - 1);
        }
        if (!wasRemove) {
          breakdown[type] = (breakdown[type] || 0) + 1;
        }

        const totalReactions = Object.values(breakdown).reduce((a, b) => a + b, 0);

        return {
          ...prev,
          userReaction: newReaction,
          reactionCount: totalReactions,
          reactionBreakdown: breakdown as any,
        };
      });
    } catch {
      toast.error('Failed to react');
    }
  };

  const handleSave = async () => {
    if (!post) return;
    try {
      const res = await api.post<any>(`/engagement/feed/${post.id}/save`);
      const data = res?.data ?? res;
      setPost((prev) => (prev ? { ...prev, isSaved: data.saved } : prev));
      toast.success(data.saved ? 'Post saved' : 'Post unsaved');
    } catch {
      toast.error('Failed to save post');
    }
  };

  const handleComment = async () => {
    if (!post || !commentText.trim()) return;
    setSubmitting(true);
    try {
      const body: { content: string; parentId?: string } = { content: commentText.trim() };
      if (replyTo) body.parentId = replyTo;
      const res = await api.post<any>(`/engagement/feed/${post.id}/comment`, body);
      const newComment: Comment = res?.data ?? res;

      setPost((prev) => {
        if (!prev) return prev;
        let comments = [...(prev.comments || [])];
        if (replyTo) {
          // Add reply under parent
          comments = comments.map((c) =>
            c.id === replyTo ? { ...c, replies: [...(c.replies || []), newComment] } : c
          );
        } else {
          comments = [...comments, newComment];
        }
        return { ...prev, comments, commentCount: prev.commentCount + 1 };
      });
      setCommentText('');
      setReplyTo(null);
      toast.success('Comment added');
    } catch {
      toast.error('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!post) return;
    try {
      await api.delete(`/engagement/feed/${post.id}/comment/${commentId}`);
      setPost((prev) => {
        if (!prev) return prev;
        // Remove from top-level or from replies
        const comments = (prev.comments || [])
          .filter((c) => c.id !== commentId)
          .map((c) => ({
            ...c,
            replies: (c.replies || []).filter((r) => r.id !== commentId),
          }));
        return { ...prev, comments, commentCount: Math.max(0, prev.commentCount - 1) };
      });
      toast.success('Comment deleted');
    } catch {
      toast.error('Failed to delete comment');
    }
  };

  const handleCtaClick = async () => {
    if (!post?.externalLink) return;
    try {
      await api.post(`/engagement/feed/${post.id}/cta-click`);
    } catch {
      // silent
    }
    window.open(post.externalLink, '_blank', 'noopener,noreferrer');
  };

  const handleReply = (parentId: string) => {
    setReplyTo(parentId);
  };

  const cancelReply = () => {
    setReplyTo(null);
  };

  const typeConfig = post
    ? TYPE_CONFIG[post.type] || {
        label: post.type.replace(/_/g, ' '),
        className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
      }
    : null;

  const breakdown = post?.reactionBreakdown;

  // Find the parent comment author name for reply indicator
  const replyParentAuthor = replyTo
    ? (post?.comments || []).find((c) => c.id === replyTo)?.user
    : null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0" aria-describedby={undefined}>
        {loading || !post ? (
          <>
            <DialogHeader className="sr-only">
              <DialogTitle>Loading post</DialogTitle>
            </DialogHeader>
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </>
        ) : (
          <>
            {/* Header */}
            <DialogHeader className="px-5 pt-5 pb-0">
              <div className="flex items-center gap-2 mb-3">
                {typeConfig && (
                  <Badge className={cn('border-0 text-[11px]', typeConfig.className)}>
                    {typeConfig.label}
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">{timeAgo(post.publishedAt)}</span>
              </div>
              <DialogTitle className="text-xl leading-snug">{post.title}</DialogTitle>
              <div className="flex items-center gap-2.5 mt-3">
                <Avatar className="h-8 w-8">
                  {post.author.avatar && (
                    <AvatarImage
                      src={getImageUrl(post.author.avatar)}
                      alt={post.author.firstName}
                    />
                  )}
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    {getInitials(post.author.firstName, post.author.lastName)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">
                  {post.author.firstName} {post.author.lastName}
                </span>
              </div>
            </DialogHeader>

            {/* Body */}
            <div className="px-5 pt-4 pb-2">
              {/* Full-size media */}
              {post.mediaUrl && (
                <div className="mb-4 rounded-lg overflow-hidden bg-muted/50">
                  {post.mediaType?.startsWith('video') ? (
                    <div className="flex items-center justify-center h-56 sm:h-72 bg-muted/30">
                      <Video className="h-12 w-12 text-muted-foreground" />
                    </div>
                  ) : (
                    <img
                      src={getImageUrl(post.mediaUrl)}
                      alt={post.title}
                      className="w-full max-h-96 object-contain"
                    />
                  )}
                </div>
              )}

              {/* Full content */}
              <div
                className="prose prose-sm dark:prose-invert max-w-none mb-4"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />

              {/* CTA */}
              {post.externalLink && (
                <Button variant="outline" size="sm" className="mb-4" onClick={handleCtaClick}>
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                  Learn More
                </Button>
              )}

              {/* Reaction breakdown */}
              {breakdown && (
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-3 pb-3 border-b">
                  {REACTIONS.map(({ type, icon: Icon, label }) => {
                    const count = (breakdown as any)[type] || 0;
                    return (
                      <div key={type} className="flex items-center gap-1">
                        <Icon className="h-3.5 w-3.5" />
                        <span>
                          {label} {count}
                        </span>
                      </div>
                    );
                  })}
                  <div className="flex items-center gap-1 ml-auto">
                    <Eye className="h-3.5 w-3.5" />
                    <span>{post.viewCount} views</span>
                  </div>
                </div>
              )}

              {/* Reaction + save buttons */}
              <div className="flex items-center justify-between pb-3 border-b">
                <div className="flex items-center gap-1">
                  {REACTIONS.map(({ type, icon: Icon, label }) => (
                    <Button
                      key={type}
                      variant="ghost"
                      size="sm"
                      className={cn(
                        'h-8 px-2.5 text-xs gap-1.5 text-muted-foreground',
                        post.userReaction === type &&
                          'text-primary bg-primary/10 hover:bg-primary/15 hover:text-primary'
                      )}
                      onClick={() => handleReact(type)}
                      title={label}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'h-8 px-2.5 text-xs text-muted-foreground',
                    post.isSaved && 'text-primary hover:text-primary'
                  )}
                  onClick={handleSave}
                  title={post.isSaved ? 'Unsave' : 'Save'}
                >
                  <Bookmark className={cn('h-3.5 w-3.5', post.isSaved && 'fill-current')} />
                </Button>
              </div>
            </div>

            {/* Comments section */}
            <div className="px-5 pb-5">
              <h4 className="text-sm font-semibold mb-3">
                Comments{post.commentCount > 0 ? ` (${post.commentCount})` : ''}
              </h4>

              {post.commentsDisabled ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-6 justify-center">
                  <MessageSquareOff className="h-4 w-4" />
                  <span>Comments are disabled for this post</span>
                </div>
              ) : (
                <>
                  {/* Comments list */}
                  <div className="space-y-1 mb-4 max-h-80 overflow-y-auto">
                    {(post.comments || []).length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">
                        No comments yet. Be the first to share your thoughts.
                      </p>
                    ) : (
                      (post.comments || []).map((comment) => (
                        <CommentItem
                          key={comment.id}
                          comment={comment}
                          currentUserId={currentUser?.id}
                          postId={post.id}
                          depth={0}
                          onReply={handleReply}
                          onDelete={handleDeleteComment}
                        />
                      ))
                    )}
                  </div>

                  {/* Reply indicator */}
                  {replyTo && (
                    <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                      <span>
                        Replying to{' '}
                        <span className="font-medium text-foreground">
                          {replyParentAuthor
                            ? `${replyParentAuthor.firstName} ${replyParentAuthor.lastName}`
                            : 'comment'}
                        </span>
                      </span>
                      <button
                        onClick={cancelReply}
                        className="text-xs text-muted-foreground hover:text-foreground underline"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {/* Comment input */}
                  <div className="flex gap-2">
                    <Textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder={replyTo ? 'Write a reply...' : 'Write a comment...'}
                      className="min-h-[60px] resize-none text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                          e.preventDefault();
                          handleComment();
                        }
                      }}
                    />
                    <Button
                      size="icon"
                      className="h-10 w-10 shrink-0 self-end"
                      disabled={!commentText.trim() || submitting}
                      onClick={handleComment}
                    >
                      {submitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
