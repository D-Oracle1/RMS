import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateLeaveRequestDto, ApproveLeaveDto, RejectLeaveDto, LeaveQueryDto } from '../dto/leave.dto';
import { LeaveStatus, LeaveType, AttendanceStatus } from '@prisma/client';

@Injectable()
export class LeaveService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateLeaveRequestDto) {
    const staffProfile = await this.prisma.staffProfile.findUnique({
      where: { userId },
    });

    if (!staffProfile) {
      throw new NotFoundException('Staff profile not found');
    }

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (endDate < startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    // Calculate total days (excluding weekends)
    let totalDays = 0;
    const current = new Date(startDate);
    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        totalDays++;
      }
      current.setDate(current.getDate() + 1);
    }

    // Check leave balance for applicable leave types
    if (dto.type === LeaveType.ANNUAL) {
      if (staffProfile.annualLeaveBalance < totalDays) {
        throw new BadRequestException(`Insufficient annual leave balance. Available: ${staffProfile.annualLeaveBalance} days`);
      }
    } else if (dto.type === LeaveType.SICK) {
      if (staffProfile.sickLeaveBalance < totalDays) {
        throw new BadRequestException(`Insufficient sick leave balance. Available: ${staffProfile.sickLeaveBalance} days`);
      }
    }

    // Check for overlapping leave requests
    const overlapping = await this.prisma.leaveRequest.findFirst({
      where: {
        staffProfileId: staffProfile.id,
        status: { in: [LeaveStatus.PENDING, LeaveStatus.APPROVED] },
        OR: [
          {
            startDate: { lte: endDate },
            endDate: { gte: startDate },
          },
        ],
      },
    });

    if (overlapping) {
      throw new BadRequestException('You already have a leave request for this period');
    }

    return this.prisma.leaveRequest.create({
      data: {
        staffProfileId: staffProfile.id,
        type: dto.type,
        startDate,
        endDate,
        totalDays,
        reason: dto.reason,
        attachments: dto.attachments || [],
      },
      include: {
        staffProfile: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
    });
  }

  async findAll(query: LeaveQueryDto) {
    const { page = 1, limit = 20, staffProfileId, departmentId, type, status, startDate, endDate } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (staffProfileId) {
      where.staffProfileId = staffProfileId;
    }

    if (departmentId) {
      where.staffProfile = { departmentId };
    }

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.OR = [];
      if (startDate) {
        where.OR.push({ startDate: { gte: new Date(startDate) } });
      }
      if (endDate) {
        where.OR.push({ endDate: { lte: new Date(endDate) } });
      }
    }

    const [requests, total] = await Promise.all([
      this.prisma.leaveRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          staffProfile: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  avatar: true,
                },
              },
              department: {
                select: { name: true },
              },
            },
          },
        },
      }),
      this.prisma.leaveRequest.count({ where }),
    ]);

    return {
      data: requests,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const request = await this.prisma.leaveRequest.findUnique({
      where: { id },
      include: {
        staffProfile: {
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
            manager: {
              include: {
                user: {
                  select: { firstName: true, lastName: true },
                },
              },
            },
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Leave request not found');
    }

    return request;
  }

  async approve(id: string, approverId: string, dto: ApproveLeaveDto) {
    const request = await this.prisma.leaveRequest.findUnique({
      where: { id },
      include: {
        staffProfile: true,
      },
    });

    if (!request) {
      throw new NotFoundException('Leave request not found');
    }

    if (request.status !== LeaveStatus.PENDING) {
      throw new BadRequestException('Leave request is not pending');
    }

    // Update leave request and deduct balance in transaction
    return this.prisma.$transaction(async (prisma) => {
      // Deduct from leave balance
      if (request.type === LeaveType.ANNUAL) {
        await prisma.staffProfile.update({
          where: { id: request.staffProfileId },
          data: {
            annualLeaveBalance: {
              decrement: request.totalDays,
            },
          },
        });
      } else if (request.type === LeaveType.SICK) {
        await prisma.staffProfile.update({
          where: { id: request.staffProfileId },
          data: {
            sickLeaveBalance: {
              decrement: request.totalDays,
            },
          },
        });
      }

      // Create attendance records for leave days
      const current = new Date(request.startDate);
      while (current <= request.endDate) {
        const dayOfWeek = current.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          await prisma.attendance.upsert({
            where: {
              staffProfileId_date: {
                staffProfileId: request.staffProfileId,
                date: new Date(current),
              },
            },
            update: {
              status: AttendanceStatus.ON_LEAVE,
            },
            create: {
              staffProfileId: request.staffProfileId,
              date: new Date(current),
              status: AttendanceStatus.ON_LEAVE,
            },
          });
        }
        current.setDate(current.getDate() + 1);
      }

      // Update leave request
      return prisma.leaveRequest.update({
        where: { id },
        data: {
          status: LeaveStatus.APPROVED,
          approverId,
          approvedAt: new Date(),
        },
        include: {
          staffProfile: {
            include: {
              user: {
                select: { firstName: true, lastName: true },
              },
            },
          },
        },
      });
    });
  }

  async reject(id: string, approverId: string, dto: RejectLeaveDto) {
    const request = await this.prisma.leaveRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException('Leave request not found');
    }

    if (request.status !== LeaveStatus.PENDING) {
      throw new BadRequestException('Leave request is not pending');
    }

    return this.prisma.leaveRequest.update({
      where: { id },
      data: {
        status: LeaveStatus.REJECTED,
        approverId,
        rejectionReason: dto.reason,
      },
    });
  }

  async cancel(id: string, userId: string) {
    const staffProfile = await this.prisma.staffProfile.findUnique({
      where: { userId },
    });

    if (!staffProfile) {
      throw new NotFoundException('Staff profile not found');
    }

    const request = await this.prisma.leaveRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException('Leave request not found');
    }

    if (request.staffProfileId !== staffProfile.id) {
      throw new ForbiddenException('You can only cancel your own leave requests');
    }

    if (request.status === LeaveStatus.CANCELLED) {
      throw new BadRequestException('Leave request is already cancelled');
    }

    // If approved, restore leave balance
    if (request.status === LeaveStatus.APPROVED) {
      if (request.type === LeaveType.ANNUAL) {
        await this.prisma.staffProfile.update({
          where: { id: staffProfile.id },
          data: {
            annualLeaveBalance: {
              increment: request.totalDays,
            },
          },
        });
      } else if (request.type === LeaveType.SICK) {
        await this.prisma.staffProfile.update({
          where: { id: staffProfile.id },
          data: {
            sickLeaveBalance: {
              increment: request.totalDays,
            },
          },
        });
      }
    }

    return this.prisma.leaveRequest.update({
      where: { id },
      data: {
        status: LeaveStatus.CANCELLED,
      },
    });
  }

  async getBalance(userId: string) {
    const staffProfile = await this.prisma.staffProfile.findUnique({
      where: { userId },
    });

    if (!staffProfile) {
      throw new NotFoundException('Staff profile not found');
    }

    // Get used leave this year
    const startOfYear = new Date();
    startOfYear.setMonth(0, 1);
    startOfYear.setHours(0, 0, 0, 0);

    const usedLeave = await this.prisma.leaveRequest.groupBy({
      by: ['type'],
      where: {
        staffProfileId: staffProfile.id,
        status: LeaveStatus.APPROVED,
        startDate: { gte: startOfYear },
      },
      _sum: {
        totalDays: true,
      },
    });

    const usedByType = usedLeave.reduce((acc, item) => {
      acc[item.type] = item._sum.totalDays || 0;
      return acc;
    }, {} as Record<string, number>);

    return {
      annual: {
        total: 20, // Default annual leave
        used: usedByType[LeaveType.ANNUAL] || 0,
        remaining: staffProfile.annualLeaveBalance,
      },
      sick: {
        total: 10, // Default sick leave
        used: usedByType[LeaveType.SICK] || 0,
        remaining: staffProfile.sickLeaveBalance,
      },
      other: {
        maternity: usedByType[LeaveType.MATERNITY] || 0,
        paternity: usedByType[LeaveType.PATERNITY] || 0,
        compassionate: usedByType[LeaveType.COMPASSIONATE] || 0,
        unpaid: usedByType[LeaveType.UNPAID] || 0,
        study: usedByType[LeaveType.STUDY] || 0,
      },
    };
  }
}
