// src/lib/queue.ts
import { Queue, Worker, QueueOptions, WorkerOptions } from 'bullmq';
import { getRedisClient, isRedisAvailable } from './redis';
import { log } from './logger';

/**
 * Job Queue Infrastructure with BullMQ
 *
 * Provides professional job processing with:
 * - Async job execution
 * - Automatic retries
 * - Priority queues
 * - Job monitoring
 * - Graceful shutdown
 *
 * Falls back to cron jobs if Redis is unavailable (zero breaking changes).
 */

// Track all queues and workers for graceful shutdown
const queues: Queue[] = [];
const workers: Worker[] = [];

/**
 * Check if queue system is available (requires Redis)
 */
export const isQueueAvailable = (): boolean => {
    return isRedisAvailable();
};

/**
 * Create a job queue
 *
 * @param name - Queue name (e.g., 'lead-discovery', 'subreddit-analysis')
 * @param options - Queue options
 * @returns Queue instance or null if Redis unavailable
 */
export const createQueue = <T = any>(
    name: string,
    options?: Partial<QueueOptions>
): Queue<T> | null => {
    if (!isQueueAvailable()) {
        log.info('Queue not available - Redis not connected', { queueName: name });
        return null;
    }

    try {
        const redis = getRedisClient();
        if (!redis) return null;

        const queue = new Queue<T>(name, {
            connection: redis,
            defaultJobOptions: {
                attempts: 3, // Retry failed jobs 3 times
                backoff: {
                    type: 'exponential',
                    delay: 1000 // Start with 1 second delay
                },
                removeOnComplete: {
                    count: 100, // Keep last 100 completed jobs
                    age: 24 * 3600 // Remove after 24 hours
                },
                removeOnFail: {
                    count: 500 // Keep last 500 failed jobs for debugging
                },
                ...options?.defaultJobOptions
            },
            ...options
        });

        queues.push(queue);
        log.info('Queue created', { queueName: name });

        return queue;
    } catch (error) {
        log.error('Failed to create queue', error, { queueName: name });
        return null;
    }
};

/**
 * Create a worker to process jobs
 *
 * @param name - Queue name to process
 * @param processor - Function to process each job
 * @param options - Worker options
 * @returns Worker instance or null if Redis unavailable
 */
export const createWorker = <T = any>(
    name: string,
    processor: (job: { data: T; id?: string; name?: string }) => Promise<void>,
    options?: Partial<WorkerOptions>
): Worker<T> | null => {
    if (!isQueueAvailable()) {
        log.info('Worker not available - Redis not connected', { workerName: name });
        return null;
    }

    try {
        const redis = getRedisClient();
        if (!redis) return null;

        const worker = new Worker<T>(
            name,
            async (job) => {
                log.info('Processing job', {
                    queue: name,
                    jobId: job.id,
                    jobName: job.name
                });

                const startTime = Date.now();

                try {
                    await processor(job);

                    const duration = Date.now() - startTime;
                    log.info('Job completed successfully', {
                        queue: name,
                        jobId: job.id,
                        duration
                    });
                } catch (error) {
                    const duration = Date.now() - startTime;
                    log.error('Job failed', error, {
                        queue: name,
                        jobId: job.id,
                        duration,
                        attempt: job.attemptsMade
                    });
                    throw error; // Re-throw to trigger retry
                }
            },
            {
                connection: redis,
                concurrency: 5, // Process 5 jobs concurrently
                ...options
            }
        );

        // Event handlers
        worker.on('completed', (job) => {
            log.debug('Job completed event', { queue: name, jobId: job.id });
        });

        worker.on('failed', (job, err) => {
            log.warn('Job failed event', {
                queue: name,
                jobId: job?.id,
                error: err.message,
                attempts: job?.attemptsMade
            });
        });

        worker.on('error', (err) => {
            log.error('Worker error', err, { workerName: name });
        });

        workers.push(worker);
        log.info('Worker created', { workerName: name });

        return worker;
    } catch (error) {
        log.error('Failed to create worker', error, { workerName: name });
        return null;
    }
};

/**
 * Gracefully close all queues and workers
 */
export const closeQueues = async (): Promise<void> => {
    log.info('Closing all queues and workers...');

    // Close all workers first
    await Promise.all(workers.map(async (worker) => {
        try {
            await worker.close();
            log.debug('Worker closed', { workerName: worker.name });
        } catch (error) {
            log.error('Error closing worker', error);
        }
    }));

    // Then close all queues
    await Promise.all(queues.map(async (queue) => {
        try {
            await queue.close();
            log.debug('Queue closed', { queueName: queue.name });
        } catch (error) {
            log.error('Error closing queue', error);
        }
    }));

    log.info('All queues and workers closed');
};

// Graceful shutdown handlers
process.on('SIGTERM', async () => {
    log.info('SIGTERM received - closing queues and workers');
    await closeQueues();
    process.exit(0);
});

process.on('SIGINT', async () => {
    log.info('SIGINT received - closing queues and workers');
    await closeQueues();
    process.exit(0);
});
