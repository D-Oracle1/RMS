import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { CacheService } from '../../common/services/cache.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostStatus, ReactionType, NotificationType } from '@prisma/client';

@Injectable()
export class EngagementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly cacheService: CacheService,
  ) {}

  // ============ Admin: Post CRUD ============

  async createPost(dto: CreatePostDto, authorId: string) {
    const post = await this.prisma.engagementPost.create({
      data: {
        title: dto.title,
        content: dto.content,
        excerpt: dto.excerpt,
        type: dto.type,
        mediaUrl: dto.mediaUrl,
        mediaType: dto.mediaType,
        externalLink: dto.externalLink,
        tags: dto.tags || ['ALL'],
        isPinned: dto.isPinned || false,
        commentsDisabled: dto.commentsDisabled || false,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        status: dto.scheduledAt ? PostStatus.SCHEDULED : PostStatus.DRAFT,
        authorId,
      },
      include: { author: { select: { id: true, firstName: true, lastName: true, avatar: true } } },
    });

    // Create analytics record
    await this.prisma.contentAnalytics.create({
      data: { postId: post.id },
    });

    return post;
  }

  async updatePost(id: string, dto: UpdatePostDto) {
    const post = await this.prisma.engagementPost.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Post not found');

    const data: any = { ...dto };
    if (dto.scheduledAt) data.scheduledAt = new Date(dto.scheduledAt);
    if (dto.expiresAt) data.expiresAt = new Date(dto.expiresAt);
    if (dto.tags) data.tags = dto.tags;

    return this.prisma.engagementPost.update({
      where: { id },
      data,
      include: { author: { select: { id: true, firstName: true, lastName: true, avatar: true } } },
    });
  }

  async deletePost(id: string) {
    const post = await this.prisma.engagementPost.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Post not found');

    return this.prisma.engagementPost.update({
      where: { id },
      data: { status: PostStatus.ARCHIVED },
    });
  }

  async publishPost(id: string) {
    const post = await this.prisma.engagementPost.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Post not found');

    const updated = await this.prisma.engagementPost.update({
      where: { id },
      data: { status: PostStatus.PUBLISHED, publishedAt: new Date() },
      include: { author: { select: { id: true, firstName: true, lastName: true } } },
    });

    // Clear feed cache
    await this.cacheService.del('engagement:trending');

    // Notify targeted users
    this.notifyTargetedUsers(updated).catch(() => {});

    return updated;
  }

  // ============ Feed ============

  async getFeed(userId: string, query: { page?: number; limit?: number; type?: string }) {
    const { page = 1, limit = 10, type } = query;
    const skip = (page - 1) * limit;

    // Get user role for tag filtering
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    const userRole = user?.role || 'CLIENT';

    const where: any = {
      status: PostStatus.PUBLISHED,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    };

    if (type) where.type = type;

    const [posts, total] = await Promise.all([
      this.prisma.engagementPost.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }],
        include: {
          author: { select: { id: true, firstName: true, lastName: true, avatar: true, role: true } },
          reactions: {
            where: { userId },
            select: { type: true },
          },
          savedBy: {
            where: { userId },
            select: { id: true },
          },
          _count: {
            select: { reactions: true, comments: true, views: true },
          },
        },
      }),
      this.prisma.engagementPost.count({ where }),
    ]);

    // Record views for posts the user hasn't seen
    const postIds = posts.map((p) => p.id);
    const existingViews = await this.prisma.postView.findMany({
      where: { userId, postId: { in: postIds } },
      select: { postId: true },
    });
    const viewedIds = new Set(existingViews.map((v) => v.postId));
    const newViews = postIds.filter((id) => !viewedIds.has(id));
    if (newViews.length > 0) {
      await this.prisma.postView.createMany({
        data: newViews.map((postId) => ({ postId, userId })),
        skipDuplicates: true,
      });
      // Increment view counts
      await this.prisma.engagementPost.updateMany({
        where: { id: { in: newViews } },
        data: { viewCount: { increment: 1 } },
      });
    }

    const data = posts.map((post) => ({
      ...post,
      userReaction: post.reactions[0]?.type || null,
      isSaved: post.savedBy.length > 0,
      reactions: undefined,
      savedBy: undefined,
      reactionCount: post._count.reactions,
      commentCount: post._count.comments,
      viewCount: post._count.views,
      _count: undefined,
    }));

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getPost(id: string, userId: string) {
    const post = await this.prisma.engagementPost.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, avatar: true, role: true } },
        comments: {
          where: { parentId: null },
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: {
            user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
            replies: {
              orderBy: { createdAt: 'asc' },
              include: {
                user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
              },
            },
          },
        },
        reactions: {
          where: { userId },
          select: { type: true },
        },
        savedBy: {
          where: { userId },
          select: { id: true },
        },
        _count: { select: { reactions: true, comments: true, views: true } },
      },
    });

    if (!post || post.status === PostStatus.ARCHIVED) throw new NotFoundException('Post not found');

    // Record view
    await this.prisma.postView.upsert({
      where: { postId_userId: { postId: id, userId } },
      create: { postId: id, userId },
      update: {},
    });

    // Get reaction breakdown
    const reactionBreakdown = await this.prisma.postReaction.groupBy({
      by: ['type'],
      where: { postId: id },
      _count: { type: true },
    });

    return {
      ...post,
      userReaction: post.reactions[0]?.type || null,
      isSaved: post.savedBy.length > 0,
      reactions: undefined,
      savedBy: undefined,
      reactionBreakdown: reactionBreakdown.reduce((acc, r) => {
        acc[r.type] = r._count.type;
        return acc;
      }, {} as Record<string, number>),
      reactionCount: post._count.reactions,
      commentCount: post._count.comments,
      viewCount: post._count.views,
      _count: undefined,
    };
  }

  // ============ Interactions ============

  async reactToPost(postId: string, userId: string, type: ReactionType) {
    const post = await this.prisma.engagementPost.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    const existing = await this.prisma.postReaction.findUnique({
      where: { postId_userId: { postId, userId } },
    });

    if (existing) {
      if (existing.type === type) {
        // Remove reaction (toggle off)
        await this.prisma.postReaction.delete({ where: { id: existing.id } });
        await this.prisma.engagementPost.update({ where: { id: postId }, data: { reactionCount: { decrement: 1 } } });
        return { action: 'removed', type: null };
      }
      // Change reaction type
      await this.prisma.postReaction.update({ where: { id: existing.id }, data: { type } });
      return { action: 'changed', type };
    }

    // Add new reaction
    await this.prisma.postReaction.create({ data: { postId, userId, type } });
    await this.prisma.engagementPost.update({ where: { id: postId }, data: { reactionCount: { increment: 1 } } });
    return { action: 'added', type };
  }

  async addComment(postId: string, userId: string, content: string, parentId?: string) {
    const post = await this.prisma.engagementPost.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');
    if (post.commentsDisabled) throw new ForbiddenException('Comments are disabled for this post');

    const comment = await this.prisma.postComment.create({
      data: { postId, userId, content, parentId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
      },
    });

    await this.prisma.engagementPost.update({ where: { id: postId }, data: { commentCount: { increment: 1 } } });

    // Notify post author
    if (post.authorId !== userId) {
      const commenter = await this.prisma.user.findUnique({ where: { id: userId }, select: { firstName: true, lastName: true } });
      this.notificationService.create({
        userId: post.authorId,
        type: NotificationType.POST_COMMENT,
        title: 'New Comment',
        message: `${commenter?.firstName} ${commenter?.lastName} commented on your post "${post.title}"`,
        link: `/dashboard/client`,
        data: { postId },
      }).catch(() => {});
    }

    return comment;
  }

  async deleteComment(commentId: string, userId: string) {
    const comment = await this.prisma.postComment.findUnique({ where: { id: commentId } });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.userId !== userId) throw new ForbiddenException('Not your comment');

    await this.prisma.postComment.delete({ where: { id: commentId } });
    await this.prisma.engagementPost.update({ where: { id: comment.postId }, data: { commentCount: { decrement: 1 } } });
    return { success: true };
  }

  async toggleSave(postId: string, userId: string) {
    const existing = await this.prisma.savedPost.findUnique({
      where: { postId_userId: { postId, userId } },
    });

    if (existing) {
      await this.prisma.savedPost.delete({ where: { id: existing.id } });
      return { saved: false };
    }

    await this.prisma.savedPost.create({ data: { postId, userId } });
    return { saved: true };
  }

  async getSavedPosts(userId: string, query: { page?: number; limit?: number }) {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.savedPost.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          post: {
            include: {
              author: { select: { id: true, firstName: true, lastName: true, avatar: true } },
              _count: { select: { reactions: true, comments: true } },
            },
          },
        },
      }),
      this.prisma.savedPost.count({ where: { userId } }),
    ]);

    return {
      data: items.map((s) => ({ ...s.post, savedAt: s.createdAt })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async trackCtaClick(postId: string) {
    await this.prisma.contentAnalytics.upsert({
      where: { postId },
      create: { postId, ctaClicks: 1 },
      update: { ctaClicks: { increment: 1 } },
    });
    return { success: true };
  }

  async trackShare(postId: string) {
    await this.prisma.contentAnalytics.upsert({
      where: { postId },
      create: { postId, shares: 1 },
      update: { shares: { increment: 1 } },
    });
    return { success: true };
  }

  // ============ AI-Ready Stubs ============

  async getFeedInsights() {
    const [topPosts, reactionBreakdown, engagementByType] = await Promise.all([
      this.prisma.engagementPost.findMany({
        where: { status: PostStatus.PUBLISHED },
        orderBy: [{ reactionCount: 'desc' }, { viewCount: 'desc' }],
        take: 10,
        select: { id: true, title: true, type: true, reactionCount: true, commentCount: true, viewCount: true },
      }),
      this.prisma.postReaction.groupBy({
        by: ['type'],
        _count: { type: true },
      }),
      this.prisma.engagementPost.groupBy({
        by: ['type'],
        where: { status: PostStatus.PUBLISHED },
        _sum: { reactionCount: true, commentCount: true, viewCount: true },
      }),
    ]);

    return {
      topPosts,
      reactionBreakdown: reactionBreakdown.reduce((acc, r) => {
        acc[r.type] = r._count.type;
        return acc;
      }, {} as Record<string, number>),
      engagementByType: engagementByType.map((e) => ({
        type: e.type,
        reactions: e._sum.reactionCount || 0,
        comments: e._sum.commentCount || 0,
        views: e._sum.viewCount || 0,
      })),
      _aiReady: true,
      _generatedAt: new Date().toISOString(),
    };
  }

  async getRecommendations(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    const userRole = user?.role || 'CLIENT';

    const posts = await this.prisma.engagementPost.findMany({
      where: {
        status: PostStatus.PUBLISHED,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        tags: { hasSome: ['ALL', userRole] },
      },
      orderBy: [{ reactionCount: 'desc' }, { viewCount: 'desc' }],
      take: 5,
      select: {
        id: true, title: true, type: true, excerpt: true,
        reactionCount: true, viewCount: true, publishedAt: true,
      },
    });

    return {
      posts,
      _aiReady: true,
      _note: 'AI personalization not yet enabled. Returning top-engagement posts for user role.',
    };
  }

  // ============ Trending & Events ============

  async getTrending() {
    const cached = await this.cacheService.get('engagement:trending');
    if (cached) return cached;

    const posts = await this.prisma.engagementPost.findMany({
      where: {
        status: PostStatus.PUBLISHED,
        publishedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: [{ reactionCount: 'desc' }, { viewCount: 'desc' }],
      take: 5,
      select: {
        id: true, title: true, type: true, excerpt: true,
        reactionCount: true, commentCount: true, viewCount: true,
        publishedAt: true,
      },
    });

    await this.cacheService.set('engagement:trending', posts, 300);
    return posts;
  }

  async getUpcomingEvents() {
    return this.prisma.engagementPost.findMany({
      where: {
        type: 'EVENT',
        status: PostStatus.PUBLISHED,
        OR: [
          { scheduledAt: { gte: new Date() } },
          { expiresAt: { gte: new Date() } },
        ],
      },
      orderBy: { scheduledAt: 'asc' },
      take: 5,
      select: {
        id: true, title: true, excerpt: true, scheduledAt: true, externalLink: true,
      },
    });
  }

  // ============ Analytics (Admin) ============

  async getAdminPosts(query: { page?: number; limit?: number; status?: string; type?: string }) {
    const { page = 1, limit = 20, status, type } = query;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;
    // Exclude archived unless specifically requested
    if (!status) where.status = { not: PostStatus.ARCHIVED };

    const [posts, total] = await Promise.all([
      this.prisma.engagementPost.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: { select: { id: true, firstName: true, lastName: true } },
          _count: { select: { reactions: true, comments: true, views: true } },
        },
      }),
      this.prisma.engagementPost.count({ where }),
    ]);

    return {
      data: posts,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getFeedAnalytics() {
    const [totalPosts, published, totalViews, totalReactions, totalComments, typeBreakdown] = await Promise.all([
      this.prisma.engagementPost.count(),
      this.prisma.engagementPost.count({ where: { status: PostStatus.PUBLISHED } }),
      this.prisma.postView.count(),
      this.prisma.postReaction.count(),
      this.prisma.postComment.count(),
      this.prisma.engagementPost.groupBy({
        by: ['type'],
        where: { status: PostStatus.PUBLISHED },
        _count: { type: true },
      }),
    ]);

    const avgEngagement = totalViews > 0
      ? parseFloat(((totalReactions + totalComments) / totalViews * 100).toFixed(1))
      : 0;

    return {
      totalPosts,
      published,
      totalViews,
      totalReactions,
      totalComments,
      avgEngagementRate: avgEngagement,
      typeBreakdown: typeBreakdown.reduce((acc, t) => {
        acc[t.type] = t._count.type;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  async getPostAnalytics(postId: string) {
    const [post, reactionBreakdown, viewsOverTime] = await Promise.all([
      this.prisma.engagementPost.findUnique({
        where: { id: postId },
        include: {
          analytics: true,
          _count: { select: { reactions: true, comments: true, views: true } },
        },
      }),
      this.prisma.postReaction.groupBy({
        by: ['type'],
        where: { postId },
        _count: { type: true },
      }),
      this.prisma.postView.count({ where: { postId } }),
    ]);

    if (!post) throw new NotFoundException('Post not found');

    return {
      post: { id: post.id, title: post.title, type: post.type, status: post.status, publishedAt: post.publishedAt },
      stats: post._count,
      analytics: post.analytics,
      reactionBreakdown: reactionBreakdown.reduce((acc, r) => {
        acc[r.type] = r._count.type;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  // ============ Helpers ============

  private async notifyTargetedUsers(post: any) {
    const tags: string[] = post.tags || ['ALL'];
    const where: any = { status: 'ACTIVE', id: { not: post.authorId } };

    if (!tags.includes('ALL')) {
      where.role = { in: tags };
    }

    const users = await this.prisma.user.findMany({
      where,
      select: { id: true },
      take: 500,
    });

    const authorName = `${post.author?.firstName || ''} ${post.author?.lastName || ''}`.trim();

    for (const user of users) {
      this.notificationService.create({
        userId: user.id,
        type: NotificationType.ENGAGEMENT_POST,
        title: post.title,
        message: `New ${post.type.replace('_', ' ').toLowerCase()} by ${authorName}`,
        link: '/dashboard/client',
        data: { postId: post.id },
      }).catch(() => {});
    }
  }
}
