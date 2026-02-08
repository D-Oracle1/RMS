import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '../generated/master-client';

@Injectable()
export class MasterPrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(MasterPrismaService.name);

  constructor() {
    super({
      datasourceUrl: process.env.MASTER_DATABASE_URL,
      log:
        process.env.NODE_ENV === 'production'
          ? ['warn', 'error']
          : ['info', 'warn', 'error'],
    });
  }

  async onModuleInit() {
    if (process.env.VERCEL) {
      // Lazy connect in serverless — Prisma connects on first query
      this.logger.log('Serverless mode: master database will connect on first query');
      return;
    }
    await this.$connect();
    this.logger.log('Master database connected');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Master database disconnected');
  }
}
