import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

interface MemoryCacheEntry {
  value: string;
  expiresAt: number;
}

const MAX_MEMORY_ENTRIES = 500;

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private client: Redis | null = null;
  /** In-memory fallback for serverless environments without Redis */
  private readonly memoryCache = new Map<string, MemoryCacheEntry>();

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    // Skip Redis in serverless — use in-memory cache instead
    if (process.env.VERCEL) {
      this.logger.log('Vercel environment: using in-memory cache');
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
      this.logger.warn(`Redis init failed: ${error.message}. Using in-memory cache.`);
      this.client = null;
    }
  }

  onModuleDestroy() {
    this.client?.disconnect();
  }

  async get<T>(key: string): Promise<T | null> {
    // Try Redis first
    if (this.client) {
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

    // In-memory fallback
    const entry = this.memoryCache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.memoryCache.delete(key);
      return null;
    }
    try {
      return JSON.parse(entry.value);
    } catch {
      this.memoryCache.delete(key);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds = 300): Promise<void> {
    const serialized = JSON.stringify(value);

    // Try Redis first
    if (this.client) {
      try {
        await this.client.setex(key, ttlSeconds, serialized);
      } catch (error) {
        this.logger.warn(`Cache set error: ${error.message}`);
      }
      return;
    }

    // In-memory fallback — evict oldest entries if at capacity
    if (this.memoryCache.size >= MAX_MEMORY_ENTRIES) {
      const firstKey = this.memoryCache.keys().next().value;
      if (firstKey) this.memoryCache.delete(firstKey);
    }
    this.memoryCache.set(key, {
      value: serialized,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async del(key: string): Promise<void> {
    if (this.client) {
      try {
        await this.client.del(key);
      } catch (error) {
        this.logger.warn(`Cache del error: ${error.message}`);
      }
      return;
    }
    this.memoryCache.delete(key);
  }

  async invalidate(namespace: string): Promise<void> {
    if (this.client) {
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
      return;
    }

    // In-memory: delete all keys matching namespace prefix
    const prefix = `${namespace}:`;
    for (const key of this.memoryCache.keys()) {
      if (key.startsWith(prefix)) {
        this.memoryCache.delete(key);
      }
    }
  }
}
