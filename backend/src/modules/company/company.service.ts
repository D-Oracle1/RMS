import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { MasterPrismaService } from '../../database/master-prisma.service';
import { TenantPrismaService } from '../../database/tenant-prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CompanyService {
  private readonly logger = new Logger(CompanyService.name);

  constructor(
    private readonly masterPrisma: MasterPrismaService,
    private readonly tenantPrisma: TenantPrismaService,
  ) {}

  async create(dto: CreateCompanyDto): Promise<any> {
    // Check slug uniqueness
    const existingSlug = await this.masterPrisma.company.findUnique({
      where: { slug: dto.slug },
    });
    if (existingSlug) {
      throw new ConflictException('Company slug already in use');
    }

    // Check domain uniqueness
    const existingDomain = await this.masterPrisma.company.findUnique({
      where: { domain: dto.domain },
    });
    if (existingDomain) {
      throw new ConflictException('Domain already in use');
    }

    // Provision a new database for this tenant
    this.logger.log(`Provisioning database for ${dto.slug}...`);
    const databaseUrl = await this.tenantPrisma.provisionDatabase(dto.slug);

    // Create company record in master DB
    const inviteCode = this.generateInviteCode();
    const company = await this.masterPrisma.company.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        domain: dto.domain,
        databaseUrl,
        logo: dto.logo,
        primaryColor: dto.primaryColor || '#3b82f6',
        inviteCode,
        maxUsers: dto.maxUsers || 50,
      },
    });

    this.logger.log(`Company created: ${company.name} (${company.slug})`);

    // Return company without databaseUrl for security
    const { databaseUrl: _, ...safeCompany } = company;
    return safeCompany;
  }

  async findAll(query: { page?: number; limit?: number; search?: string }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { domain: { contains: query.search, mode: 'insensitive' } },
        { slug: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [companies, total] = await Promise.all([
      this.masterPrisma.company.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          slug: true,
          domain: true,
          logo: true,
          primaryColor: true,
          inviteCode: true,
          isActive: true,
          plan: true,
          maxUsers: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.masterPrisma.company.count({ where }),
    ]);

    // Fetch user counts for each company
    const companiesWithStats = await Promise.all(
      companies.map(async (company) => {
        try {
          const stats = await this.getCompanyQuickStats(company.id);
          return { ...company, stats };
        } catch {
          return { ...company, stats: { users: 0, properties: 0, sales: 0 } };
        }
      }),
    );

    return {
      data: companiesWithStats,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string) {
    const company = await this.masterPrisma.company.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        domain: true,
        logo: true,
        primaryColor: true,
        inviteCode: true,
        isActive: true,
        plan: true,
        maxUsers: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const stats = await this.getCompanyDetailedStats(id);
    return { ...company, stats };
  }

  async update(id: string, dto: UpdateCompanyDto) {
    const company = await this.masterPrisma.company.findUnique({
      where: { id },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // Check domain uniqueness if changing
    if (dto.domain && dto.domain !== company.domain) {
      const existing = await this.masterPrisma.company.findUnique({
        where: { domain: dto.domain },
      });
      if (existing) {
        throw new ConflictException('Domain already in use');
      }
    }

    const updated = await this.masterPrisma.company.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        name: true,
        slug: true,
        domain: true,
        logo: true,
        primaryColor: true,
        inviteCode: true,
        isActive: true,
        plan: true,
        maxUsers: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updated;
  }

  async toggleActive(id: string) {
    const company = await this.masterPrisma.company.findUnique({
      where: { id },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const updated = await this.masterPrisma.company.update({
      where: { id },
      data: { isActive: !company.isActive },
    });

    // If deactivating, disconnect tenant client
    if (!updated.isActive) {
      await this.tenantPrisma.disconnectTenant(id);
    }

    return { id: updated.id, isActive: updated.isActive };
  }

  async regenerateInviteCode(id: string) {
    const company = await this.masterPrisma.company.findUnique({
      where: { id },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const inviteCode = this.generateInviteCode();
    const updated = await this.masterPrisma.company.update({
      where: { id },
      data: { inviteCode },
      select: { id: true, inviteCode: true },
    });

    return updated;
  }

  async resolveByDomain(domain: string) {
    const company = await this.masterPrisma.company.findUnique({
      where: { domain },
      select: {
        id: true,
        name: true,
        slug: true,
        domain: true,
        logo: true,
        primaryColor: true,
        isActive: true,
      },
    });

    return company;
  }

  async resolveByInviteCode(code: string) {
    const company = await this.masterPrisma.company.findUnique({
      where: { inviteCode: code },
      select: {
        id: true,
        name: true,
        slug: true,
        domain: true,
        logo: true,
        isActive: true,
      },
    });

    return company;
  }

  async getOverviewStats() {
    const [totalCompanies, activeCompanies] = await Promise.all([
      this.masterPrisma.company.count(),
      this.masterPrisma.company.count({ where: { isActive: true } }),
    ]);

    // Aggregate stats from all active tenant DBs
    const companies = await this.masterPrisma.company.findMany({
      where: { isActive: true },
      select: { id: true },
    });

    let totalUsers = 0;
    let totalProperties = 0;
    let totalSales = 0;

    for (const company of companies) {
      try {
        const stats = await this.getCompanyQuickStats(company.id);
        totalUsers += stats.users;
        totalProperties += stats.properties;
        totalSales += stats.sales;
      } catch {
        // Skip companies with DB issues
      }
    }

    return {
      totalCompanies,
      activeCompanies,
      totalUsers,
      totalProperties,
      totalSales,
    };
  }

  private async getCompanyQuickStats(companyId: string) {
    try {
      const client = await this.tenantPrisma.getClient(companyId);
      const [users, properties, sales] = await Promise.all([
        client.user.count(),
        client.property.count(),
        client.sale.count(),
      ]);
      return { users, properties, sales };
    } catch {
      return { users: 0, properties: 0, sales: 0 };
    }
  }

  private async getCompanyDetailedStats(companyId: string) {
    try {
      const client = await this.tenantPrisma.getClient(companyId);
      const [users, realtors, clients, properties, sales, revenue] =
        await Promise.all([
          client.user.count(),
          client.realtorProfile.count(),
          client.clientProfile.count(),
          client.property.count(),
          client.sale.count(),
          client.sale.aggregate({ _sum: { salePrice: true } }),
        ]);
      return {
        users,
        realtors,
        clients,
        properties,
        sales,
        revenue: revenue._sum.salePrice || 0,
      };
    } catch {
      return {
        users: 0,
        realtors: 0,
        clients: 0,
        properties: 0,
        sales: 0,
        revenue: 0,
      };
    }
  }

  private generateInviteCode(): string {
    return `INV-${uuidv4().substring(0, 8).toUpperCase()}`;
  }
}
