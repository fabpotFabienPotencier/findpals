import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
    private client: Redis | null = null;

    async onModuleInit() {
        const redisUrl = process.env.REDIS_URL;
        if (!redisUrl) {
            console.warn('[CacheService] REDIS_URL not set — caching disabled');
            return;
        }

        try {
            this.client = new Redis(redisUrl, {
                maxRetriesPerRequest: 3,
                retryStrategy: (times) => {
                    if (times > 3) return null; // Stop retrying
                    return Math.min(times * 200, 2000);
                },
                lazyConnect: true,
            });

            this.client.on('error', (err) => {
                // Ignore errors here to prevent Unhandled Promise Rejections from crashing the app
                // It will retry based on retryStrategy, and if it fails, get/set will gracefully degrade.
            });

            await this.client.connect();
            console.log('[CacheService] Redis connected successfully');
        } catch (error) {
            console.error('[CacheService] Redis connection failed:', error);
            this.client = null;
        }
    }

    async onModuleDestroy() {
        if (this.client) {
            await this.client.quit();
        }
    }

    private isReady(): boolean {
        return this.client !== null && this.client.status === 'ready';
    }

    /**
     * Get a cached value. Returns null if not found or cache is unavailable.
     */
    async get<T>(key: string): Promise<T | null> {
        if (!this.isReady()) return null;
        try {
            const value = await this.client.get(key);
            return value ? JSON.parse(value) : null;
        } catch {
            return null;
        }
    }

    /**
     * Set a cached value with TTL in seconds.
     */
    async set(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
        if (!this.isReady()) return;
        try {
            await this.client.setex(key, ttlSeconds, JSON.stringify(value));
        } catch (error) {
            console.error(`[CacheService] Failed to set key ${key}:`, error);
        }
    }

    /**
     * Delete a cached value.
     */
    async del(key: string): Promise<void> {
        if (!this.isReady()) return;
        try {
            await this.client.del(key);
        } catch (error) {
            console.error(`[CacheService] Failed to delete key ${key}:`, error);
        }
    }

    /**
     * Delete all keys matching a pattern (e.g., 'user:*').
     */
    async delPattern(pattern: string): Promise<void> {
        if (!this.isReady()) return;
        try {
            const keys = await this.client.keys(pattern);
            if (keys.length > 0) {
                await this.client.del(...keys);
            }
        } catch (error) {
            console.error(`[CacheService] Failed to delete pattern ${pattern}:`, error);
        }
    }

    /**
     * Increment a counter key. Useful for rate limiting.
     */
    async incr(key: string, ttlSeconds?: number): Promise<number> {
        if (!this.isReady()) return 0;
        try {
            const val = await this.client.incr(key);
            if (ttlSeconds && val === 1) {
                await this.client.expire(key, ttlSeconds);
            }
            return val;
        } catch {
            return 0;
        }
    }
}
