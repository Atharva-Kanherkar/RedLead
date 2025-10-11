// src/worker.ts
/**
 * Separate Worker Process Entry Point
 *
 * This file starts ONLY the background workers, not the API server.
 * This allows you to:
 * - Run workers separately from API (resource isolation)
 * - Scale workers independently
 * - Restart workers without affecting API
 *
 * Usage:
 *   npm run worker  (runs this file)
 *   npm run dev     (runs API only)
 */

import 'dotenv/config';
import { log } from './lib/logger';
import { initializeRedis } from './lib/redis';
import { createWorker, isQueueAvailable } from './lib/queue';
import { prisma } from './lib/prisma';

// Import worker functions
import { runLeadDiscoveryWorker } from './workers/lead.worker';
import { runSubredditAnalysisWorker } from './workers/subreddit.worker';
import { findPendingRepliesWorker, trackPostedReplyPerformanceWorker } from './workers/replyTracking.worker';
import { runMarketInsightWorker } from './workers/marketInsight.worker';
import { expireUserTrials } from './services/subscription.service';

const startWorker = async () => {
    log.info('🔧 Worker process starting...', {
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version
    });

    // Initialize Redis (required for workers)
    await initializeRedis();

    if (!isQueueAvailable()) {
        log.error('❌ Worker cannot start - Redis not available');
        log.error('   Workers require Redis to function.');
        log.error('   Please set REDIS_URL environment variable.');
        process.exit(1);
    }

    log.info('✅ Redis connected - starting workers...');

    // Create workers for each queue
    createWorker('lead-discovery', async (job) => {
        log.info('Running lead discovery worker from queue');
        await runLeadDiscoveryWorker();
    });

    createWorker('subreddit-analysis', async (job) => {
        log.info('Running subreddit analysis worker from queue');
        await runSubredditAnalysisWorker();
    });

    createWorker('reply-tracking', async (job) => {
        log.info('Running reply tracking worker from queue');
        await findPendingRepliesWorker();
    });

    createWorker('performance-tracking', async (job) => {
        log.info('Running performance tracking worker from queue');
        await trackPostedReplyPerformanceWorker();
    });

    createWorker('market-insight', async (job) => {
        log.info('Running market insight worker from queue');
        await runMarketInsightWorker();
    });

    createWorker('trial-expiration', async (job) => {
        log.info('Running trial expiration worker from queue');
        await expireUserTrials();
    });

    log.info('🚀 All workers started successfully');
    log.info('   Workers are now processing jobs from Redis queues');
    log.info('   Press Ctrl+C to stop workers gracefully');
};

// Start the worker process
startWorker().catch((error) => {
    log.error('Failed to start worker process', error);
    process.exit(1);
});

// Keep the process alive
process.on('SIGTERM', async () => {
    log.info('SIGTERM received - shutting down workers...');
    await prisma.$disconnect();
    process.exit(0);
});

process.on('SIGINT', async () => {
    log.info('SIGINT received - shutting down workers...');
    await prisma.$disconnect();
    process.exit(0);
});
