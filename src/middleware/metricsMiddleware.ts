// src/middleware/metricsMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import { trackHttpRequest } from '../lib/metrics';

/**
 * Metrics Tracking Middleware
 *
 * Automatically tracks all HTTP requests:
 * - Request count by method, route, status
 * - Request duration
 * - Error rates
 *
 * Provides data for Prometheus monitoring dashboards.
 */
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();

    // Capture the original end function
    const originalEnd = res.end;

    // Override res.end to track when response is sent
    res.end = function (this: Response, chunk?: any, encoding?: any, callback?: any): Response {
        // Calculate duration
        const durationSeconds = (Date.now() - startTime) / 1000;

        // Extract route pattern (not the actual path with IDs)
        const route = req.route?.path || req.path;

        // Track the request
        trackHttpRequest(req.method, route, res.statusCode, durationSeconds);

        // Call original end function
        return originalEnd.call(this, chunk, encoding, callback);
    };

    next();
};
