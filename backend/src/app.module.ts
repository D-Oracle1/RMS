import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { TenantMiddleware } from './common/middleware/tenant.middleware';

// Configuration
import configuration from './config/configuration';

// Database
import { DatabaseModule } from './database/database.module';

// Common
import { ThrottlerGuard } from '@nestjs/throttler';

// Feature Modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { AdminModule } from './modules/admin/admin.module';
import { RealtorModule } from './modules/realtor/realtor.module';
import { ClientModule } from './modules/client/client.module';
import { PropertyModule } from './modules/property/property.module';
import { SaleModule } from './modules/sale/sale.module';
import { CommissionModule } from './modules/commission/commission.module';
import { TaxModule } from './modules/tax/tax.module';
import { LoyaltyModule } from './modules/loyalty/loyalty.module';
import { RankingModule } from './modules/ranking/ranking.module';
import { ChatModule } from './modules/chat/chat.module';
import { ChannelsModule } from './modules/channels/channels.module';
import { NotificationModule } from './modules/notification/notification.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AiModule } from './modules/ai/ai.module';
import { UploadModule } from './modules/upload/upload.module';
import { PusherModule } from './common/services/pusher.module';
import { CallModule } from './modules/call/call.module';
import { CronModule } from './modules/cron/cron.module';
import { HealthModule } from './health/health.module';

// Staff & HR Modules
import { StaffModule } from './modules/staff/staff.module';
import { DepartmentModule } from './modules/department/department.module';
import { HrModule } from './modules/hr/hr.module';
import { TasksModule } from './modules/tasks/tasks.module';

// Awards
import { AwardModule } from './modules/award/award.module';
import { SettingsModule } from './modules/settings/settings.module';

// CMS & Gallery
import { CmsModule } from './modules/cms/cms.module';
import { GalleryModule } from './modules/gallery/gallery.module';

// Audit
import { AuditModule } from './modules/audit/audit.module';

// Cache
import { CacheModule } from './common/services/cache.module';

// Device (Push Notifications)
import { DeviceModule } from './modules/device/device.module';

// Queue (BullMQ)
import { QueueModule } from './common/services/queue.module';

// Multi-tenancy
import { CompanyModule } from './modules/company/company.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env', '.env.local'],
    }),

    // Rate limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('RATE_LIMIT_TTL', 60) * 1000,
          limit: config.get<number>('RATE_LIMIT_MAX', 100),
        },
      ],
    }),

    // Scheduler (disabled in serverless — cron jobs use HTTP endpoints instead)
    ...(process.env.VERCEL ? [] : [ScheduleModule.forRoot()]),

    // Database
    DatabaseModule,

    // Feature Modules
    AuthModule,
    UsersModule,
    AdminModule,
    RealtorModule,
    ClientModule,
    PropertyModule,
    SaleModule,
    CommissionModule,
    TaxModule,
    LoyaltyModule,
    RankingModule,
    ChatModule,
    ChannelsModule,
    NotificationModule,
    AnalyticsModule,
    AiModule,
    UploadModule,

    // Staff & HR Modules
    StaffModule,
    DepartmentModule,
    HrModule,
    TasksModule,

    // Awards
    AwardModule,
    SettingsModule,

    // CMS & Gallery
    CmsModule,
    GalleryModule,

    // Audit
    AuditModule,

    // Cache
    CacheModule,

    // Device (Push Notifications)
    DeviceModule,

    // Queue (BullMQ)
    QueueModule,

    // Multi-tenancy
    CompanyModule,

    // Real-time (Pusher)
    PusherModule,
    CallModule,

    // Cron (HTTP-triggered scheduled jobs)
    CronModule,

    // Health Check
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
