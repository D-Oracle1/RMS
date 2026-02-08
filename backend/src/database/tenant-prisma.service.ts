import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { MasterPrismaService } from './master-prisma.service';
import { execSync } from 'child_process';
import { join } from 'path';

interface TenantClient {
  client: PrismaClient;
  lastUsed: number;
}

@Injectable()
export class TenantPrismaService implements OnModuleDestroy {
  private readonly logger = new Logger(TenantPrismaService.name);
  private readonly clients = new Map<string, TenantClient>();
  private readonly MAX_POOL_SIZE = process.env.VERCEL ? 5 : 50;
  private readonly IDLE_TIMEOUT_MS = process.env.VERCEL
    ? 5 * 60 * 1000   // 5 minutes in serverless
    : 30 * 60 * 1000; // 30 minutes in long-running server
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(private readonly masterPrisma: MasterPrismaService) {
    // Periodically evict idle connections (skip in serverless — no persistent timers)
    if (!process.env.VERCEL) {
      this.cleanupInterval = setInterval(() => this.evictIdleClients(), 5 * 60 * 1000);
    }
  }

  async onModuleDestroy() {
    if (this.cleanupInterval) clearInterval(this.cleanupInterval);
    const disconnectPromises = Array.from(this.clients.values()).map((tc) =>
      tc.client.$disconnect().catch(() => {}),
    );
    await Promise.all(disconnectPromises);
    this.clients.clear();
    this.logger.log('All tenant connections closed');
  }

  async getClient(companyId: string): Promise<PrismaClient> {
    // Return cached client if available
    const existing = this.clients.get(companyId);
    if (existing) {
      existing.lastUsed = Date.now();
      return existing.client;
    }

    // Look up company's database URL from master DB
    const company = await this.masterPrisma.company.findUnique({
      where: { id: companyId },
      select: { databaseUrl: true, isActive: true, slug: true },
    });

    if (!company) {
      throw new Error(`Company ${companyId} not found`);
    }

    if (!company.isActive) {
      throw new Error(`Company ${companyId} is inactive`);
    }

    // Evict oldest if pool is full
    if (this.clients.size >= this.MAX_POOL_SIZE) {
      await this.evictOldestClient();
    }

    // Create new client for this tenant
    const client = new PrismaClient({
      datasourceUrl: company.databaseUrl,
      log:
        process.env.NODE_ENV === 'production'
          ? ['warn', 'error']
          : ['warn', 'error'],
    });

    await client.$connect();
    this.clients.set(companyId, { client, lastUsed: Date.now() });
    this.logger.log(`Tenant DB connected: ${company.slug}`);

    return client;
  }

  async getClientByDomain(domain: string): Promise<{ client: PrismaClient; companyId: string } | null> {
    const company = await this.masterPrisma.company.findUnique({
      where: { domain },
      select: { id: true, isActive: true },
    });

    if (!company || !company.isActive) return null;

    const client = await this.getClient(company.id);
    return { client, companyId: company.id };
  }

  async provisionDatabase(slug: string): Promise<string> {
    const dbName = `rms_tenant_${slug.replace(/[^a-z0-9_]/g, '_')}`;

    // Parse master DB URL to get connection details
    const masterUrl = process.env.MASTER_DATABASE_URL || '';
    const url = new URL(masterUrl);
    const host = url.hostname;
    const port = url.port || '5432';
    const user = url.username;
    const password = url.password;

    // Build tenant database URL
    const tenantUrl = `postgresql://${user}:${password}@${host}:${port}/${dbName}${url.search}`;

    // Create database using psql/SQL
    const adminUrl = `postgresql://${user}:${password}@${host}:${port}/postgres${url.search}`;
    const adminClient = new PrismaClient({ datasourceUrl: adminUrl });

    try {
      await adminClient.$executeRawUnsafe(
        `CREATE DATABASE "${dbName}" OWNER "${user}"`,
      );
      this.logger.log(`Created database: ${dbName}`);
    } catch (error: any) {
      // Database might already exist
      if (!error.message?.includes('already exists')) {
        throw error;
      }
      this.logger.warn(`Database ${dbName} already exists`);
    } finally {
      await adminClient.$disconnect();
    }

    // Run migrations against the new database
    const schemaPath = join(process.cwd(), 'prisma', 'schema.prisma');
    try {
      execSync(
        `npx prisma db push --schema="${schemaPath}" --accept-data-loss`,
        {
          env: { ...process.env, DATABASE_URL: tenantUrl },
          stdio: 'pipe',
          timeout: 60000,
        },
      );
      this.logger.log(`Schema pushed to: ${dbName}`);
    } catch (error: any) {
      this.logger.error(`Failed to push schema to ${dbName}: ${error.message}`);
      throw error;
    }

    return tenantUrl;
  }

  async disconnectTenant(companyId: string): Promise<void> {
    const existing = this.clients.get(companyId);
    if (existing) {
      await existing.client.$disconnect();
      this.clients.delete(companyId);
    }
  }

  private async evictIdleClients(): Promise<void> {
    const now = Date.now();
    for (const [id, tc] of this.clients.entries()) {
      if (now - tc.lastUsed > this.IDLE_TIMEOUT_MS) {
        await tc.client.$disconnect().catch(() => {});
        this.clients.delete(id);
        this.logger.debug(`Evicted idle tenant connection: ${id}`);
      }
    }
  }

  private async evictOldestClient(): Promise<void> {
    let oldestId: string | null = null;
    let oldestTime = Infinity;

    for (const [id, tc] of this.clients.entries()) {
      if (tc.lastUsed < oldestTime) {
        oldestTime = tc.lastUsed;
        oldestId = id;
      }
    }

    if (oldestId) {
      const tc = this.clients.get(oldestId);
      if (tc) {
        await tc.client.$disconnect().catch(() => {});
        this.clients.delete(oldestId);
        this.logger.debug(`Evicted oldest tenant connection: ${oldestId}`);
      }
    }
  }
}
