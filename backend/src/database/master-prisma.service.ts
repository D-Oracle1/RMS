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
    try {
      await this.$connect();
      this.logger.log('Master database connected');
    } catch (error) {
      this.logger.error(`Master database connection failed: ${error.message}`);
      // Don't throw — allow app to start even if master DB is unavailable
      // Queries will fail at runtime with a clear error instead of crashing boot
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Master database disconnected');
  }
}
