// src/queues/jobs.ts
import { createQueue, isQueueAvailable } from '../lib/queue';
import { log } from '../lib/logger';

/**
 * Job Queue Definitions
 *
 * Defines all background job queues with priorities and schedules.
 * Falls back to cron if Redis/BullMQ not available.
 */

// Job queue instances
export const leadDiscoveryQueue = createQueue('lead-discovery');
export const subredditAnalysisQueue = createQueue('subreddit-analysis');
export const marketInsightQueue = createQueue('market-insight');
export const replyTrackingQueue = createQueue('reply-tracking');
export const performanceTrackingQueue = createQueue('performance-tracking');
export const trialExpirationQueue = createQueue('trial-expiration');

/**
 * Schedule recurring jobs
 *
 * This replaces cron scheduling when queues are available.
 * Jobs are added with repeat patterns and priorities.
 */
export const scheduleRecurringJobs = async (): Promise<void> => {
    if (!isQueueAvailable()) {
        log.info('Queue not available - using cron scheduler fallback');
        return;
    }

    try {
        // Job 1: Lead Discovery - Every 15 minutes
        if (leadDiscoveryQueue) {
            await leadDiscoveryQueue.add(
                'discover-leads',
                {},
                {
                    repeat: {
                        pattern: '*/15 * * * *' // Every 15 minutes
                    },
                    priority: 1 // High priority
                }
            );
            log.info('Scheduled recurring job: lead-discovery');
        }

        // Job 2: Subreddit Analysis - Daily at 2:00 AM
        if (subredditAnalysisQueue) {
            await subredditAnalysisQueue.add(
                'analyze-subreddits',
                {},
                {
                    repeat: {
                        pattern: '0 2 * * *' // Daily at 2 AM
                    },
                    priority: 3 // Medium priority
                }
            );
            log.info('Scheduled recurring job: subreddit-analysis');
        }

        // Job 3: Reply Tracking - Every minute
        if (replyTrackingQueue) {
            await replyTrackingQueue.add(
                'track-pending-replies',
                {},
                {
                    repeat: {
                        pattern: '* * * * *' // Every minute
                    },
                    priority: 2 // High priority
                }
            );
            log.info('Scheduled recurring job: reply-tracking');
        }

        // Job 4: Performance Tracking - Every hour
        if (performanceTrackingQueue) {
            await performanceTrackingQueue.add(
                'track-performance',
                {},
                {
                    repeat: {
                        pattern: '0 * * * *' // Every hour
                    },
                    priority: 4 // Lower priority
                }
            );
            log.info('Scheduled recurring job: performance-tracking');
        }

        // Job 5: Market Insight - Every hour at :05
        if (marketInsightQueue) {
            await marketInsightQueue.add(
                'discover-insights',
                {},
                {
                    repeat: {
                        pattern: '5 * * * *' // Every hour at :05
                    },
                    priority: 3 // Medium priority
                }
            );
            log.info('Scheduled recurring job: market-insight');
        }

        // Job 6: Trial Expiration - Daily at 3:00 AM
        if (trialExpirationQueue) {
            await trialExpirationQueue.add(
                'expire-trials',
                {},
                {
                    repeat: {
                        pattern: '0 3 * * *' // Daily at 3 AM
                    },
                    priority: 4 // Lower priority
                }
            );
            log.info('Scheduled recurring job: trial-expiration');
        }

        log.info('All recurring jobs scheduled in BullMQ');

    } catch (error) {
        log.error('Failed to schedule recurring jobs', error);
        throw error;
    }
};

/**
 * Add a one-time job to the queue
 *
 * @param queueName - Which queue to use
 * @param data - Job data
 * @param priority - Job priority (1 = highest)
 */
export const addJob = async <T>(
    queue: ReturnType<typeof createQueue>,
    jobName: string,
    data: T,
    priority: number = 3
): Promise<void> => {
    if (!queue) {
        log.warn('Queue not available - job not queued', { jobName });
        return;
    }

    try {
        await queue.add(jobName, data, { priority });
        log.info('Job added to queue', { jobName, priority });
    } catch (error) {
        log.error('Failed to add job to queue', error, { jobName });
    }
};
