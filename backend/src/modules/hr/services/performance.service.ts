import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateReviewDto, UpdateReviewDto, AcknowledgeReviewDto, ReviewQueryDto } from '../dto/performance.dto';
import { ReviewStatus } from '@prisma/client';

@Injectable()
export class PerformanceService {
  constructor(private readonly prisma: PrismaService) {}

  async create(reviewerId: string, dto: CreateReviewDto) {
    // Get reviewer's staff profile
    const reviewer = await this.prisma.staffProfile.findUnique({
      where: { userId: reviewerId },
    });

    if (!reviewer) {
      throw new NotFoundException('Reviewer staff profile not found');
    }

    // Check if reviewee exists
    const reviewee = await this.prisma.staffProfile.findUnique({
      where: { id: dto.revieweeId },
    });

    if (!reviewee) {
      throw new NotFoundException('Reviewee not found');
    }

    // Check for existing review in the same period
    const existing = await this.prisma.performanceReview.findFirst({
      where: {
        revieweeId: dto.revieweeId,
        cycle: dto.cycle,
        periodStart: new Date(dto.periodStart),
        periodEnd: new Date(dto.periodEnd),
      },
    });

    if (existing) {
      throw new BadRequestException('A review already exists for this period');
    }

    return this.prisma.performanceReview.create({
      data: {
        revieweeId: dto.revieweeId,
        reviewerId: reviewer.id,
        cycle: dto.cycle,
        periodStart: new Date(dto.periodStart),
        periodEnd: new Date(dto.periodEnd),
        status: ReviewStatus.DRAFT,
      },
      include: {
        reviewee: {
          include: {
            user: {
              select: { firstName: true, lastName: true, avatar: true },
            },
            department: {
              select: { name: true },
            },
          },
        },
        reviewer: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
    });
  }

  async findAll(query: ReviewQueryDto) {
    const { page = 1, limit = 20, revieweeId, reviewerId, cycle, status } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (revieweeId) where.revieweeId = revieweeId;
    if (reviewerId) where.reviewerId = reviewerId;
    if (cycle) where.cycle = cycle;
    if (status) where.status = status;

    const [reviews, total] = await Promise.all([
      this.prisma.performanceReview.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          reviewee: {
            include: {
              user: {
                select: { firstName: true, lastName: true, avatar: true },
              },
              department: {
                select: { name: true },
              },
            },
          },
          reviewer: {
            include: {
              user: {
                select: { firstName: true, lastName: true },
              },
            },
          },
        },
      }),
      this.prisma.performanceReview.count({ where }),
    ]);

    return {
      data: reviews,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const review = await this.prisma.performanceReview.findUnique({
      where: { id },
      include: {
        reviewee: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
              },
            },
            department: true,
          },
        },
        reviewer: {
          include: {
            user: {
              select: { firstName: true, lastName: true, avatar: true },
            },
          },
        },
      },
    });

    if (!review) {
      throw new NotFoundException('Performance review not found');
    }

    return review;
  }

  async update(id: string, dto: UpdateReviewDto) {
    const review = await this.prisma.performanceReview.findUnique({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException('Performance review not found');
    }

    if (review.status === ReviewStatus.ACKNOWLEDGED) {
      throw new BadRequestException('Cannot update an acknowledged review');
    }

    return this.prisma.performanceReview.update({
      where: { id },
      data: {
        ...dto,
        status: ReviewStatus.IN_PROGRESS,
      },
      include: {
        reviewee: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
    });
  }

  async submit(id: string) {
    const review = await this.prisma.performanceReview.findUnique({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException('Performance review not found');
    }

    if (review.status === ReviewStatus.COMPLETED || review.status === ReviewStatus.ACKNOWLEDGED) {
      throw new BadRequestException('Review has already been submitted');
    }

    if (!review.overallRating) {
      throw new BadRequestException('Overall rating is required to submit the review');
    }

    return this.prisma.performanceReview.update({
      where: { id },
      data: {
        status: ReviewStatus.COMPLETED,
      },
    });
  }

  async acknowledge(id: string, userId: string, dto: AcknowledgeReviewDto) {
    const staffProfile = await this.prisma.staffProfile.findUnique({
      where: { userId },
    });

    if (!staffProfile) {
      throw new NotFoundException('Staff profile not found');
    }

    const review = await this.prisma.performanceReview.findUnique({
      where: { id },
    });

    if (!review) {
      throw new NotFoundException('Performance review not found');
    }

    if (review.revieweeId !== staffProfile.id) {
      throw new BadRequestException('You can only acknowledge your own reviews');
    }

    if (review.status !== ReviewStatus.COMPLETED) {
      throw new BadRequestException('Review must be completed before acknowledgement');
    }

    return this.prisma.performanceReview.update({
      where: { id },
      data: {
        status: ReviewStatus.ACKNOWLEDGED,
        revieweeComments: dto.revieweeComments,
        acknowledgedAt: new Date(),
      },
    });
  }

  async getMyReviews(userId: string) {
    const staffProfile = await this.prisma.staffProfile.findUnique({
      where: { userId },
    });

    if (!staffProfile) {
      throw new NotFoundException('Staff profile not found');
    }

    return this.prisma.performanceReview.findMany({
      where: { revieweeId: staffProfile.id },
      orderBy: { periodEnd: 'desc' },
      include: {
        reviewer: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
    });
  }

  async getReviewsToGive(userId: string) {
    const staffProfile = await this.prisma.staffProfile.findUnique({
      where: { userId },
    });

    if (!staffProfile) {
      throw new NotFoundException('Staff profile not found');
    }

    return this.prisma.performanceReview.findMany({
      where: {
        reviewerId: staffProfile.id,
        status: { in: [ReviewStatus.DRAFT, ReviewStatus.IN_PROGRESS] },
      },
      orderBy: { periodEnd: 'asc' },
      include: {
        reviewee: {
          include: {
            user: {
              select: { firstName: true, lastName: true, avatar: true },
            },
            department: {
              select: { name: true },
            },
          },
        },
      },
    });
  }
}
