import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CacheService } from '../../common/services/cache.service';
import { ContentType } from '@prisma/client';
import { CreatePageDto } from './dto/create-page.dto';
import { UpdatePageDto } from './dto/update-page.dto';

const CMS_KEYS = [
  'branding',
  'hero',
  'about',
  'mission',
  'vision',
  'core_values',
  'contact',
  'features',
  'platform_features',
  'stats',
  'agents',
  'cta',
  'footer',
  'faq',
  'user_features',
] as const;

@Injectable()
export class CmsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  async getSection(key: string): Promise<any> {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key: `cms_${key}` },
    });
    return setting?.value ?? null;
  }

  async upsertSection(key: string, value: any): Promise<void> {
    await this.prisma.systemSetting.upsert({
      where: { key: `cms_${key}` },
      update: { value },
      create: { key: `cms_${key}`, value },
    });
    await this.cacheService.invalidate('cms');
  }

  async getAllSections(): Promise<Record<string, any>> {
    const cached = await this.cacheService.get<Record<string, any>>('cms:all_sections');
    if (cached) return cached;

    const settings = await this.prisma.systemSetting.findMany({
      where: { key: { startsWith: 'cms_' } },
    });

    const result: Record<string, any> = {};
    for (const setting of settings) {
      const key = setting.key.replace('cms_', '');
      result[key] = setting.value;
    }

    await this.cacheService.set('cms:all_sections', result, 600);
    return result;
  }

  async getPublicContent(): Promise<Record<string, any>> {
    const cached = await this.cacheService.get<Record<string, any>>('cms:public');
    if (cached) return cached;

    const result = await this.getAllSections();
    await this.cacheService.set('cms:public', result, 600);
    return result;
  }

  // ============ CMS Pages ============

  async createPage(dto: CreatePageDto, authorId: string) {
    return this.prisma.cmsPage.create({
      data: {
        title: dto.title,
        slug: dto.slug,
        type: dto.type,
        content: dto.content,
        excerpt: dto.excerpt,
        featuredImage: dto.featuredImage,
        metadata: dto.metadata,
        authorId,
      },
      include: { author: { select: { firstName: true, lastName: true } } },
    });
  }

  async updatePage(id: string, dto: UpdatePageDto) {
    const page = await this.prisma.cmsPage.findUnique({ where: { id } });
    if (!page) throw new NotFoundException('Page not found');

    return this.prisma.cmsPage.update({
      where: { id },
      data: dto,
      include: { author: { select: { firstName: true, lastName: true } } },
    });
  }

  async deletePage(id: string) {
    const page = await this.prisma.cmsPage.findUnique({ where: { id } });
    if (!page) throw new NotFoundException('Page not found');

    await this.prisma.cmsPage.delete({ where: { id } });
    return { message: 'Page deleted successfully' };
  }

  async getAllPages(query: { type?: ContentType; page?: number; limit?: number }) {
    const { type, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (type) where.type = type;

    const [pages, total] = await Promise.all([
      this.prisma.cmsPage.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { author: { select: { firstName: true, lastName: true } } },
      }),
      this.prisma.cmsPage.count({ where }),
    ]);

    return {
      data: pages,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getPublishedPages(type?: ContentType) {
    const where: any = { isPublished: true };
    if (type) where.type = type;

    return this.prisma.cmsPage.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      include: { author: { select: { firstName: true, lastName: true, avatar: true } } },
    });
  }

  async getPageBySlug(slug: string) {
    const page = await this.prisma.cmsPage.findFirst({
      where: { slug, isPublished: true },
      include: { author: { select: { firstName: true, lastName: true, avatar: true } } },
    });
    if (!page) throw new NotFoundException('Page not found');
    return page;
  }

  async publishPage(id: string) {
    const page = await this.prisma.cmsPage.findUnique({ where: { id } });
    if (!page) throw new NotFoundException('Page not found');

    return this.prisma.cmsPage.update({
      where: { id },
      data: { isPublished: true, publishedAt: new Date() },
    });
  }

  async unpublishPage(id: string) {
    const page = await this.prisma.cmsPage.findUnique({ where: { id } });
    if (!page) throw new NotFoundException('Page not found');

    return this.prisma.cmsPage.update({
      where: { id },
      data: { isPublished: false, publishedAt: null },
    });
  }
}
