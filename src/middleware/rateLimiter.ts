// src/middleware/rateLimiter.ts
import rateLimit from 'express-rate-limit';

/**
 * General rate limiter for most API endpoints
 * Allows 100 requests per 15 minutes per IP
 */
export const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    skip: (req) => req.method === 'OPTIONS', // Skip rate limiting for CORS preflight requests
    handler: (req, res) => {
        console.warn(`[RATE LIMIT] IP ${req.ip} exceeded general rate limit`);
        res.status(429).json({
            error: 'Too many requests',
            message: 'You have exceeded the rate limit. Please try again later.',
            retryAfter: '15 minutes'
        });
    }
});

/**
 * Strict rate limiter for authentication endpoints
 * Allows 5 requests per 15 minutes per IP to prevent brute force
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    skipSuccessfulRequests: true, // Don't count successful requests
    skip: (req) => req.method === 'OPTIONS', // Skip rate limiting for CORS preflight requests
    message: {
        error: 'Too many authentication attempts, please try again later.',
        retryAfter: '15 minutes'
    },
    handler: (req, res) => {
        console.warn(`[RATE LIMIT] IP ${req.ip} exceeded auth rate limit`);
        res.status(429).json({
            error: 'Too many authentication attempts',
            message: 'You have exceeded the authentication rate limit. Please try again later.',
            retryAfter: '15 minutes'
        });
    }
});

/**
 * Moderate rate limiter for AI-powered endpoints
 * Allows 20 requests per 15 minutes per IP due to higher computational cost
 */
export const aiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Limit each IP to 20 requests per windowMs
    message: {
        error: 'Too many AI requests, please try again later.',
        retryAfter: '15 minutes'
    },
    skip: (req) => req.method === 'OPTIONS', // Skip rate limiting for CORS preflight requests
    handler: (req, res) => {
        console.warn(`[RATE LIMIT] IP ${req.ip} exceeded AI rate limit`);
        res.status(429).json({
            error: 'Too many AI requests',
            message: 'You have exceeded the AI request rate limit. Please try again later.',
            retryAfter: '15 minutes'
        });
    }
});

/**
 * Strict rate limiter for webhook endpoints
 * Allows 30 requests per minute to prevent webhook spam
 */
export const webhookLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // Limit each IP to 30 requests per minute
    message: {
        error: 'Too many webhook requests, please try again later.',
        retryAfter: '1 minute'
    },
    skip: (req) => req.method === 'OPTIONS', // Skip rate limiting for CORS preflight requests
    handler: (req, res) => {
        console.warn(`[RATE LIMIT] IP ${req.ip} exceeded webhook rate limit`);
        res.status(429).json({
            error: 'Too many webhook requests',
            message: 'You have exceeded the webhook rate limit. Please try again later.',
            retryAfter: '1 minute'
        });
    }
});
