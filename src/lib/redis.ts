// src/lib/redis.ts
import Redis from 'ioredis';
import { log } from './logger';

/**
 * Redis Client Singleton with Fallback
 *
 * Creates a Redis connection if REDIS_URL is provided.
 * If not available, returns null and system falls back to in-memory cache.
 *
 * This ensures zero breaking changes - works with or without Redis.
 */

let redisClient: Redis | null = null;
let redisAvailable = false;

export const initializeRedis = async (): Promise<void> => {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
        log.info('Redis URL not configured - using in-memory cache fallback');
        redisAvailable = false;
        return;
    }

    try {
        log.info('Initializing Redis connection...', { url: redisUrl.split('@')[1] || 'localhost' });

        redisClient = new Redis(redisUrl, {
            maxRetriesPerRequest: 3,
            retryStrategy: (times: number) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
            reconnectOnError: (err) => {
                log.warn('Redis reconnect on error', { error: err.message });
                return true;
            }
        });

        // Test connection
        await redisClient.ping();

        redisAvailable = true;
        log.info('Redis connected successfully');

        // Handle connection events
        redisClient.on('error', (err) => {
            log.error('Redis connection error', err);
            redisAvailable = false;
        });

        redisClient.on('connect', () => {
            log.info('Redis connected');
            redisAvailable = true;
        });

        redisClient.on('ready', () => {
            log.info('Redis ready');
            redisAvailable = true;
        });

        redisClient.on('close', () => {
            log.warn('Redis connection closed');
            redisAvailable = false;
        });

    } catch (error) {
        log.error('Failed to initialize Redis - falling back to in-memory cache', error);
        redisClient = null;
        redisAvailable = false;
    }
};

/**
 * Get Redis client (may be null if Redis not available)
 */
export const getRedisClient = (): Redis | null => {
    return redisAvailable ? redisClient : null;
};

/**
 * Check if Redis is available
 */
export const isRedisAvailable = (): boolean => {
    return redisAvailable;
};

/**
 * Graceful shutdown - close Redis connection
 */
export const closeRedis = async (): Promise<void> => {
    if (redisClient) {
        try {
            await redisClient.quit();
            log.info('Redis connection closed gracefully');
        } catch (error) {
            log.error('Error closing Redis connection', error);
        }
    }
};

// Graceful shutdown handler
process.on('SIGTERM', async () => {
    log.info('SIGTERM received - closing Redis connection');
    await closeRedis();
});

process.on('SIGINT', async () => {
    log.info('SIGINT received - closing Redis connection');
    await closeRedis();
});
