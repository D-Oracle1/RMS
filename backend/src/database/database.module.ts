import { Global, Module, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { PrismaService } from './prisma.service';
import { MasterPrismaService } from './master-prisma.service';
import { TenantPrismaService } from './tenant-prisma.service';

@Global()
@Module({
  providers: [
    // Master DB — always connected, singleton
    MasterPrismaService,

    // Tenant connection pool — singleton that manages per-tenant clients
    TenantPrismaService,

    // Request-scoped PrismaService — resolves to the correct tenant DB per request
    {
      provide: PrismaService,
      scope: Scope.REQUEST,
      useFactory: async (
        tenantPrisma: TenantPrismaService,
        request: Request,
      ): Promise<PrismaService> => {
        const companyId = request?.tenant?.companyId;

        if (!companyId) {
          // SUPER_ADMIN on master domain or public route with no tenant
          // Return a default PrismaService connected to DATABASE_URL (fallback)
          // This handles cases where no tenant is resolved
          const fallback = new PrismaService();
          await fallback.onModuleInit();
          return fallback;
        }

        // Return the tenant-specific PrismaClient (cast as PrismaService)
        const client = await tenantPrisma.getClient(companyId);
        return client as unknown as PrismaService;
      },
      inject: [TenantPrismaService, REQUEST],
    },
  ],
  exports: [PrismaService, MasterPrismaService, TenantPrismaService],
})
export class DatabaseModule {}
