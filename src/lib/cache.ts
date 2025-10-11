// src/lib/cache.ts
import { getRedisClient, isRedisAvailable } from './redis';
import { log } from './logger';

/**
 * Cache Abstraction Layer
 *
 * Provides a unified caching interface that works with:
 * - Redis (when available) - for distributed caching
 * - In-memory Map (fallback) - for development or when Redis unavailable
 *
 * This ensures zero breaking changes and automatic fallback.
 */

// In-memory fallback cache
const memoryCache = new Map<string, { value: any; expiresAt: number }>();

// Periodic cleanup of expired in-memory cache entries
setInterval(() => {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of memoryCache.entries()) {
        if (entry.expiresAt < now) {
            memoryCache.delete(key);
            cleaned++;
        }
    }

    if (cleaned > 0) {
        log.debug('Memory cache cleanup', { removedEntries: cleaned });
    }

    // Also enforce size limit
    if (memoryCache.size > 1000) {
        log.warn('Memory cache size limit reached - clearing cache', { size: memoryCache.size });
        memoryCache.clear();
    }
}, 60 * 1000); // Run every minute

/**
 * Set a value in cache with TTL (time to live)
 *
 * @param key - Cache key
 * @param value - Value to cache (will be JSON stringified)
 * @param ttlSeconds - Time to live in seconds (default: 1 hour)
 */
export const cacheSet = async (
    key: string,
    value: any,
    ttlSeconds: number = 3600
): Promise<void> => {
    const redis = getRedisClient();

    try {
        if (redis && isRedisAvailable()) {
            // Use Redis
            const stringValue = JSON.stringify(value);
            await redis.setex(key, ttlSeconds, stringValue);
            log.debug('Cache set (Redis)', { key, ttl: ttlSeconds });
        } else {
            // Use in-memory fallback
            const expiresAt = Date.now() + (ttlSeconds * 1000);
            memoryCache.set(key, { value, expiresAt });
            log.debug('Cache set (Memory)', { key, ttl: ttlSeconds });
        }
    } catch (error) {
        log.error('Cache set failed - using memory fallback', error, { key });
        // Fallback to memory on Redis error
        const expiresAt = Date.now() + (ttlSeconds * 1000);
        memoryCache.set(key, { value, expiresAt });
    }
};

/**
 * Get a value from cache
 *
 * @param key - Cache key
 * @returns The cached value or null if not found/expired
 */
export const cacheGet = async <T = any>(key: string): Promise<T | null> => {
    const redis = getRedisClient();

    try {
        if (redis && isRedisAvailable()) {
            // Use Redis
            const stringValue = await redis.get(key);
            if (!stringValue) {
                log.debug('Cache miss (Redis)', { key });
                return null;
            }
            log.debug('Cache hit (Redis)', { key });
            return JSON.parse(stringValue) as T;
        } else {
            // Use in-memory fallback
            const entry = memoryCache.get(key);
            if (!entry) {
                log.debug('Cache miss (Memory)', { key });
                return null;
            }

            // Check if expired
            if (entry.expiresAt < Date.now()) {
                memoryCache.delete(key);
                log.debug('Cache expired (Memory)', { key });
                return null;
            }

            log.debug('Cache hit (Memory)', { key });
            return entry.value as T;
        }
    } catch (error) {
        log.error('Cache get failed - checking memory fallback', error, { key });
        // Fallback to memory on Redis error
        const entry = memoryCache.get(key);
        if (entry && entry.expiresAt >= Date.now()) {
            return entry.value as T;
        }
        return null;
    }
};

/**
 * Delete a value from cache
 *
 * @param key - Cache key to delete
 */
export const cacheDelete = async (key: string): Promise<void> => {
    const redis = getRedisClient();

    try {
        if (redis && isRedisAvailable()) {
            await redis.del(key);
            log.debug('Cache delete (Redis)', { key });
        } else {
            memoryCache.delete(key);
            log.debug('Cache delete (Memory)', { key });
        }
    } catch (error) {
        log.error('Cache delete failed', error, { key });
        memoryCache.delete(key); // Fallback
    }
};

/**
 * Clear all cache entries (use with caution)
 */
export const cacheClear = async (): Promise<void> => {
    const redis = getRedisClient();

    try {
        if (redis && isRedisAvailable()) {
            await redis.flushdb();
            log.info('Cache cleared (Redis)');
        } else {
            memoryCache.clear();
            log.info('Cache cleared (Memory)');
        }
    } catch (error) {
        log.error('Cache clear failed', error);
        memoryCache.clear(); // Fallback
    }
};

/**
 * Get cache statistics
 */
export const getCacheStats = async (): Promise<{
    type: 'redis' | 'memory';
    available: boolean;
    size?: number;
}> => {
    const redis = getRedisClient();

    if (redis && isRedisAvailable()) {
        try {
            const info = await redis.dbsize();
            return {
                type: 'redis',
                available: true,
                size: info
            };
        } catch (error) {
            return {
                type: 'redis',
                available: false
            };
        }
    }

    return {
        type: 'memory',
        available: true,
        size: memoryCache.size
    };
};
