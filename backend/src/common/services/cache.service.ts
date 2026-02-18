import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private client: Redis | null = null;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    // Skip Redis in serverless — no Redis available and connection retries block cold start
    if (process.env.VERCEL) {
      this.logger.log('Vercel environment detected, skipping Redis connection');
      return;
    }

    try {
      const url = this.configService.get<string>('redis.url');
      if (url && url !== 'redis://localhost:6379') {
        this.client = new Redis(url, {
          maxRetriesPerRequest: 3,
          retryStrategy: (times) => Math.min(times * 50, 2000),
        });
      } else {
        this.client = new Redis({
          host: this.configService.get<string>('redis.host', 'localhost'),
          port: this.configService.get<number>('redis.port', 6379),
          password: this.configService.get<string>('redis.password') || undefined,
          maxRetriesPerRequest: 3,
          retryStrategy: (times) => Math.min(times * 50, 2000),
        });
      }

      this.client.on('error', (err) => {
        this.logger.warn(`Redis connection error: ${err.message}`);
      });

      this.client.on('connect', () => {
        this.logger.log('Redis connected');
      });
    } catch (error) {
      this.logger.warn(`Redis init failed: ${error.message}. Caching disabled.`);
      this.client = null;
    }
  }

  onModuleDestroy() {
    this.client?.disconnect();
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.client) return null;
    try {
      const value = await this.client.get(key);
      if (!value) return null;
      try {
        return JSON.parse(value);
      } catch {
        this.logger.warn(`Corrupted cache value for key "${key}", deleting`);
        await this.client.del(key);
        return null;
      }
    } catch {
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds = 300): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.setex(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
      this.logger.warn(`Cache set error: ${error.message}`);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.del(key);
    } catch (error) {
      this.logger.warn(`Cache del error: ${error.message}`);
    }
  }

  async invalidate(namespace: string): Promise<void> {
    if (!this.client) return;
    try {
      let cursor = '0';
      do {
        const [nextCursor, keys] = await this.client.scan(
          cursor, 'MATCH', `${namespace}:*`, 'COUNT', 100,
        );
        cursor = nextCursor;
        if (keys.length > 0) {
          await this.client.del(...keys);
        }
      } while (cursor !== '0');
    } catch (error) {
      this.logger.warn(`Cache invalidate error: ${error.message}`);
    }
  }
}
