import cron from 'node-cron';
import { log } from '../lib/logger';
import { isQueueAvailable } from '../lib/queue';
import { scheduleRecurringJobs } from '../queues/jobs';

// Import worker functions (used for cron fallback)
import { runLeadDiscoveryWorker } from '../workers/lead.worker';
import { runSubredditAnalysisWorker } from '../workers/subreddit.worker';
import { findPendingRepliesWorker, trackPostedReplyPerformanceWorker } from '../workers/replyTracking.worker';
import { runMarketInsightWorker } from '../workers/marketInsight.worker';
import { expireUserTrials } from '../services/subscription.service';

/**
 * Initializes and starts all scheduled background jobs.
 *
 * Strategy:
 * - If Redis available: Use BullMQ queues (recommended)
 * - If Redis not available: Use cron jobs (fallback)
 *
 * This ensures zero breaking changes - system works either way.
 */
export const initializeScheduler = async () => {
    log.info('Initializing job scheduler...');

    // Check if we should use queues or cron
    const useQueues = isQueueAvailable() && process.env.USE_QUEUE !== 'false';

    if (useQueues) {
        log.info('Using BullMQ job queues (Redis available)');
        await scheduleRecurringJobs();
        log.info('✅ BullMQ job scheduler initialized');
        log.info('   Note: Start worker process separately with: npm run worker');
        return;
    }

    // Fallback to cron jobs if Redis not available
    log.info('Using cron scheduler (Redis not available - fallback mode)');
    initializeCronScheduler();
    log.info('✅ Cron job scheduler initialized');
};

/**
 * Legacy cron scheduler (fallback when Redis unavailable)
 */
const initializeCronScheduler = () => {

    // --- JOB 1: Lead Discovery Worker ---
    // Runs every 15 minutes.
    cron.schedule('*/15 * * * *', () => {
        console.log('-------------------------------------');
        console.log('Triggering scheduled lead discovery run...');
        runLeadDiscoveryWorker().catch((err: any) => {
            console.error('A critical error occurred during the lead discovery worker run:', err);
        });
    });

    // --- JOB 2: Subreddit Intelligence Worker ---
    // Runs once per day at 2:00 AM.
    cron.schedule('0 2 * * *', () => {
        console.log('-------------------------------------');
        console.log('Triggering daily subreddit intelligence analysis...');
        runSubredditAnalysisWorker().catch((err: any) => {
            console.error('A critical error occurred during the subreddit analysis worker run:', err);
        });
    });

    // --- JOB 3: High-Frequency Reply Finder ---
    // Runs every minute to find manually posted replies quickly.
    cron.schedule('* * * * *', () => {
        console.log('-------------------------------------');
        console.log('⚡ Triggering high-frequency reply finder...');
        findPendingRepliesWorker().catch((err: any) => {
            console.error('A critical error occurred during the pending reply finder run:', err);
        });
    });

    // --- JOB 4: Low-Frequency Performance Tracker ---
    // Runs every hour to update stats for already-found replies.
    cron.schedule('0 * * * *', () => {
        console.log('-------------------------------------');
        console.log('📊 Triggering hourly reply performance tracking...');
        trackPostedReplyPerformanceWorker().catch((err: any) => {
            console.error('A critical error occurred during the reply performance tracking run:', err);
        });
    });

    // --- JOB 5: Market Insight Worker ---
    // Runs every hour at the 5-minute mark.
    cron.schedule('5 * * * *', () => {
        console.log('-------------------------------------');
        console.log('Triggering hourly market insight discovery...');
        runMarketInsightWorker().catch((err: any) => {
            console.error('A critical error occurred during the market insight worker run:', err);
        });
    });

    // --- NEW JOB 6: Expire User Trials ---
    // Runs once per day at 3:00 AM to check for and end expired trials.
    cron.schedule('0 3 * * *', () => {
        console.log('-------------------------------------');
        console.log('💳 Triggering daily check for expired user trials...');
        expireUserTrials().catch((err: any) => {
            console.error('A critical error occurred during the user trial expiration job:', err);
        });
    });


    log.info('Cron scheduler initialized with all jobs');
};