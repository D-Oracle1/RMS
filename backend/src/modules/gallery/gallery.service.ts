import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CacheService } from '../../common/services/cache.service';
import { CreateGalleryItemDto } from './dto/create-gallery-item.dto';
import { UpdateGalleryItemDto } from './dto/update-gallery-item.dto';
import { GalleryItemType } from '@prisma/client';
import { join } from 'path';
import { existsSync, unlinkSync } from 'fs';

@Injectable()
export class GalleryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  async findAll(query: { type?: GalleryItemType; page?: number; limit?: number }) {
    const { type, page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (type) where.type = type;

    const [items, total] = await Promise.all([
      this.prisma.galleryItem.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      }),
      this.prisma.galleryItem.count({ where }),
    ]);

    return {
      data: items,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findPublished(type?: GalleryItemType) {
    const cacheKey = `gallery:published:${type || 'all'}`;
    const cached = await this.cacheService.get<any>(cacheKey);
    if (cached) return cached;

    const where: any = { isPublished: true };
    if (type) where.type = type;

    const items = await this.prisma.galleryItem.findMany({
      where,
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });

    await this.cacheService.set(cacheKey, items, 300);
    return items;
  }

  async findOne(id: string) {
    const item = await this.prisma.galleryItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Gallery item not found');
    return item;
  }

  async create(dto: CreateGalleryItemDto) {
    const maxOrder = await this.prisma.galleryItem.aggregate({
      _max: { order: true },
    });
    const nextOrder = (maxOrder._max.order ?? -1) + 1;

    const item = await this.prisma.galleryItem.create({
      data: {
        title: dto.title,
        description: dto.description,
        type: dto.type,
        url: dto.url,
        thumbnailUrl: dto.thumbnailUrl,
        isPublished: dto.isPublished ?? true,
        order: nextOrder,
      },
    });
    await this.cacheService.invalidate('gallery');
    return item;
  }

  async update(id: string, dto: UpdateGalleryItemDto) {
    await this.findOne(id);
    const item = await this.prisma.galleryItem.update({
      where: { id },
      data: dto,
    });
    await this.cacheService.invalidate('gallery');
    return item;
  }

  async remove(id: string) {
    const item = await this.findOne(id);

    // Delete file from disk
    this.deleteFileFromDisk(item.url);
    if (item.thumbnailUrl) this.deleteFileFromDisk(item.thumbnailUrl);

    const deleted = await this.prisma.galleryItem.delete({ where: { id } });
    await this.cacheService.invalidate('gallery');
    return deleted;
  }

  async reorder(items: { id: string; order: number }[]) {
    const updates = items.map((item) =>
      this.prisma.galleryItem.update({
        where: { id: item.id },
        data: { order: item.order },
      }),
    );
    await this.prisma.$transaction(updates);
    await this.cacheService.invalidate('gallery');
    return { success: true };
  }

  async togglePublish(id: string) {
    const item = await this.findOne(id);
    const updated = await this.prisma.galleryItem.update({
      where: { id },
      data: { isPublished: !item.isPublished },
    });
    await this.cacheService.invalidate('gallery');
    return updated;
  }

  private deleteFileFromDisk(urlPath: string) {
    try {
      // urlPath is like /uploads/gallery/uuid.jpg
      const filename = urlPath.split('/').pop();
      if (!filename) return;
      const filePath = join(process.cwd(), 'uploads', 'gallery', filename);
      if (existsSync(filePath)) {
        unlinkSync(filePath);
      }
    } catch (error) {
      console.error('Failed to delete gallery file:', error);
    }
  }
}
