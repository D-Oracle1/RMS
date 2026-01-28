import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import compression from 'compression';
import { join } from 'path';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);

  // Serve static files from uploads directory
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });
  const port = configService.get<number>('PORT', 4000);
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');

  // Security
  app.use(helmet());
  app.use(compression());

  // CORS
  app.enableCors({
    origin: configService.get<string>('FRONTEND_URL', 'http://localhost:3000'),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // API Versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Global prefix
  app.setGlobalPrefix('api');

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global filters
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global interceptors
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(),
  );

  // WebSocket adapter
  app.useWebSocketAdapter(new IoAdapter(app));

  // Swagger documentation
  if (nodeEnv !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('RMS Platform API')
      .setDescription('Realtors Management System - Enterprise PropTech Platform API')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .addTag('Auth', 'Authentication endpoints')
      .addTag('Users', 'User management endpoints')
      .addTag('Admin', 'Admin dashboard endpoints')
      .addTag('Realtors', 'Realtor management endpoints')
      .addTag('Clients', 'Client management endpoints')
      .addTag('Properties', 'Property management endpoints')
      .addTag('Sales', 'Sales management endpoints')
      .addTag('Commission', 'Commission management endpoints')
      .addTag('Tax', 'Tax management endpoints')
      .addTag('Loyalty', 'Loyalty system endpoints')
      .addTag('Rankings', 'Ranking system endpoints')
      .addTag('Chat', 'Chat system endpoints')
      .addTag('Notifications', 'Notification endpoints')
      .addTag('Analytics', 'Analytics endpoints')
      .addTag('Upload', 'File upload endpoints')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  await app.listen(port);

  console.log(`
  ╔════════════════════════════════════════════════════════════╗
  ║                                                            ║
  ║   🏠 RMS Platform - Realtors Management System            ║
  ║                                                            ║
  ║   Environment: ${nodeEnv.padEnd(40)}║
  ║   Server running on: http://localhost:${String(port).padEnd(21)}║
  ║   API Documentation: http://localhost:${port}/api/docs      ║
  ║                                                            ║
  ╚════════════════════════════════════════════════════════════╝
  `);
}

bootstrap();
