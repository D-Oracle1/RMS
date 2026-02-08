import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

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
] as const;

@Injectable()
export class CmsService {
  constructor(private readonly prisma: PrismaService) {}

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
  }

  async getAllSections(): Promise<Record<string, any>> {
    const settings = await this.prisma.systemSetting.findMany({
      where: { key: { startsWith: 'cms_' } },
    });

    const result: Record<string, any> = {};
    for (const setting of settings) {
      const key = setting.key.replace('cms_', '');
      result[key] = setting.value;
    }
    return result;
  }

  async getPublicContent(): Promise<Record<string, any>> {
    return this.getAllSections();
  }
}
