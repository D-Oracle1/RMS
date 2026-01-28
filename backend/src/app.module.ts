import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';

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
import { NotificationModule } from './modules/notification/notification.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AiModule } from './modules/ai/ai.module';
import { UploadModule } from './modules/upload/upload.module';
import { WebsocketModule } from './websocket/websocket.module';
import { HealthModule } from './health/health.module';

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

    // Scheduler
    ScheduleModule.forRoot(),

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
    NotificationModule,
    AnalyticsModule,
    AiModule,
    UploadModule,

    // WebSocket
    WebsocketModule,

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
export class AppModule {}
