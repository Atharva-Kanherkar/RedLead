// src/lib/metrics.ts
import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';
import { log } from './logger';

/**
 * Prometheus Metrics Collection
 *
 * Provides observability through metrics:
 * - HTTP request duration & count
 * - Error rates
 * - Queue depths
 * - Cache hit rates
 * - Database pool usage
 */

// Create a custom registry (separate from default)
export const register = new Registry();

// Collect default metrics (CPU, memory, etc.)
collectDefaultMetrics({
    register,
    prefix: 'redlead_'
});

// HTTP Metrics
export const httpRequestsTotal = new Counter({
    name: 'redlead_http_requests_total',
    help: 'Total HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
    registers: [register]
});

export const httpRequestDuration = new Histogram({
    name: 'redlead_http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.5, 1, 2, 5, 10], // Buckets in seconds
    registers: [register]
});

// API-specific metrics
export const aiRequestsTotal = new Counter({
    name: 'redlead_ai_requests_total',
    help: 'Total AI API requests',
    labelNames: ['provider', 'status'], // provider: Gemini/OpenAI, status: success/failure
    registers: [register]
});

export const cacheHitsTotal = new Counter({
    name: 'redlead_cache_hits_total',
    help: 'Total cache hits',
    labelNames: ['cache_type'], // cache_type: redis/memory
    registers: [register]
});

export const cacheMissesTotal = new Counter({
    name: 'redlead_cache_misses_total',
    help: 'Total cache misses',
    labelNames: ['cache_type'],
    registers: [register]
});

// Queue metrics
export const jobsProcessedTotal = new Counter({
    name: 'redlead_jobs_processed_total',
    help: 'Total jobs processed',
    labelNames: ['queue', 'status'], // status: completed/failed
    registers: [register]
});

export const jobDuration = new Histogram({
    name: 'redlead_job_duration_seconds',
    help: 'Job processing duration in seconds',
    labelNames: ['queue'],
    buckets: [1, 5, 10, 30, 60, 120, 300], // Buckets in seconds
    registers: [register]
});

export const activeJobsGauge = new Gauge({
    name: 'redlead_active_jobs',
    help: 'Number of currently active jobs',
    labelNames: ['queue'],
    registers: [register]
});

// Reddit API metrics
export const redditApiCalls = new Counter({
    name: 'redlead_reddit_api_calls_total',
    help: 'Total Reddit API calls',
    labelNames: ['operation', 'status'], // operation: search/getComment, status: success/failure
    registers: [register]
});

// Database metrics
export const databaseQueriesTotal = new Counter({
    name: 'redlead_database_queries_total',
    help: 'Total database queries',
    labelNames: ['operation', 'status'], // operation: select/insert/update, status: success/failure
    registers: [register]
});

export const databaseQueryDuration = new Histogram({
    name: 'redlead_database_query_duration_seconds',
    help: 'Database query duration in seconds',
    labelNames: ['operation'],
    buckets: [0.01, 0.05, 0.1, 0.5, 1, 2], // Buckets in seconds
    registers: [register]
});

// Lead discovery metrics
export const leadsDiscoveredTotal = new Counter({
    name: 'redlead_leads_discovered_total',
    help: 'Total leads discovered',
    labelNames: ['campaign_id', 'type'], // type: global/targeted
    registers: [register]
});

/**
 * Helper function to track HTTP requests
 */
export const trackHttpRequest = (
    method: string,
    route: string,
    statusCode: number,
    durationSeconds: number
) => {
    httpRequestsTotal.inc({ method, route, status_code: statusCode });
    httpRequestDuration.observe({ method, route, status_code: statusCode }, durationSeconds);
};

/**
 * Helper function to track cache hits/misses
 */
export const trackCacheHit = (cacheType: 'redis' | 'memory') => {
    cacheHitsTotal.inc({ cache_type: cacheType });
};

export const trackCacheMiss = (cacheType: 'redis' | 'memory') => {
    cacheMissesTotal.inc({ cache_type: cacheType });
};

/**
 * Initialize metrics collection
 */
export const initializeMetrics = () => {
    log.info('Prometheus metrics initialized', {
        metricsEndpoint: '/metrics'
    });
};
