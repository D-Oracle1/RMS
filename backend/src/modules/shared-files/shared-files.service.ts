import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { put, del } from '@vercel/blob';
import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@Injectable()
export class SharedFilesService {
  constructor(private readonly prisma: PrismaService) {}

  private async uploadToBlob(file: MulterFile): Promise<string> {
    const ext = extname(file.originalname);
    const pathname = `shared-files/${uuidv4()}${ext}`;
    const blob = await put(pathname, file.buffer, { access: 'public' });
    return blob.url;
  }

  private async deleteFromBlob(url: string): Promise<void> {
    try {
      if (url && url.startsWith('https://')) {
        await del(url);
      }
    } catch (error) {
      console.error('Error deleting shared file blob:', error);
    }
  }

  async findAll(
    userId: string,
    query: {
      search?: string;
      category?: 'personal' | 'department' | 'public';
      departmentId?: string;
      channelId?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const { search, category, departmentId, channelId, page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;

    // Get user's department
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { staffProfile: { select: { departmentId: true } } },
    });
    const userDeptId = user?.staffProfile?.departmentId;

    // Build WHERE based on category
    let where: any;

    if (category === 'personal') {
      where = { uploadedById: userId };
    } else if (category === 'department') {
      where = userDeptId ? { departmentId: userDeptId } : { uploadedById: userId };
    } else if (category === 'public') {
      where = { isPublic: true };
    } else {
      // Default: all files accessible to the user
      const accessConditions: any[] = [
        { uploadedById: userId },
        { isPublic: true },
        { accessList: { has: userId } },
      ];
      if (userDeptId) {
        accessConditions.push({ departmentId: userDeptId });
      }
      where = { OR: accessConditions };
    }

    // Apply additional filters
    if (departmentId) where.departmentId = departmentId;
    if (channelId) where.channelId = channelId;
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const [files, total] = await Promise.all([
      this.prisma.sharedFile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          uploadedBy: {
            select: { id: true, firstName: true, lastName: true, avatar: true },
          },
          department: {
            select: { id: true, name: true },
          },
        },
      }),
      this.prisma.sharedFile.count({ where }),
    ]);

    return {
      data: files,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async uploadFiles(
    userId: string,
    files: MulterFile[],
    options: {
      departmentId?: string;
      channelId?: string;
      isPublic?: boolean;
    },
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    const results = await Promise.all(
      files.map(async (file) => {
        const url = await this.uploadToBlob(file);

        return this.prisma.sharedFile.create({
          data: {
            name: file.originalname,
            url,
            size: file.size,
            mimeType: file.mimetype,
            uploadedById: userId,
            departmentId: options.departmentId || null,
            channelId: options.channelId || null,
            isPublic: options.isPublic || false,
          },
          include: {
            uploadedBy: {
              select: { id: true, firstName: true, lastName: true, avatar: true },
            },
          },
        });
      }),
    );

    return results;
  }

  async deleteFile(id: string, userId: string, userRole: string) {
    const file = await this.prisma.sharedFile.findUnique({
      where: { id },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    const isAdmin = ['SUPER_ADMIN', 'ADMIN', 'GENERAL_OVERSEER'].includes(userRole);
    if (file.uploadedById !== userId && !isAdmin) {
      throw new ForbiddenException('Only the file owner or admin can delete this file');
    }

    await this.deleteFromBlob(file.url);
    await this.prisma.sharedFile.delete({ where: { id } });

    return { message: 'File deleted successfully' };
  }

  async getFileSummary(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { staffProfile: { select: { departmentId: true } } },
    });
    const userDeptId = user?.staffProfile?.departmentId;

    const [personalCount, departmentCount, publicCount, totalSizeResult] =
      await Promise.all([
        this.prisma.sharedFile.count({
          where: { uploadedById: userId },
        }),
        userDeptId
          ? this.prisma.sharedFile.count({ where: { departmentId: userDeptId } })
          : Promise.resolve(0),
        this.prisma.sharedFile.count({ where: { isPublic: true } }),
        this.prisma.sharedFile.aggregate({
          where: {
            OR: [
              { uploadedById: userId },
              { isPublic: true },
              { accessList: { has: userId } },
              ...(userDeptId ? [{ departmentId: userDeptId }] : []),
            ],
          },
          _sum: { size: true },
        }),
      ]);

    return {
      personal: { count: personalCount },
      department: { count: departmentCount },
      public: { count: publicCount },
      totalSize: totalSizeResult._sum.size || 0,
    };
  }
}
