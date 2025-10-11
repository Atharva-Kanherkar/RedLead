import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import leadRouter from './routes/leads';
import { initializeScheduler } from './jobs/leadDiscovery';
import onboardingRouter from './routes/onboarding';
import engagementRouter from './routes/engagement';
import insightRouter from './routes/insights';
import performanceRouter from './routes/performance';
import { clerkMiddleware } from '@clerk/express';
import { generalLimiter } from './middleware/rateLimiter';
import { prisma } from './lib/prisma';
import { log } from './lib/logger';
import { initializeRedis } from './lib/redis';
import { getCacheStats } from './lib/cache';

// --- Routers ---
import campaignRouter from './routes/campaign';
import redditRouter from './routes/reddit';
import webhookRouter from './routes/webhook';
import { getUserUsage } from './controllers/aiusage.controller';
import { RequestHandler } from 'express';
import userRouter from './routes/user';
import clerkWebhookRouter from './routes/clerk.webhook';
import analyticsRouter from './routes/analytics';

const app = express();
const PORT = process.env.PORT || 5000;

// CORS Configuration - uses environment variable
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:3000'];

log.info('CORS configured', { allowedOrigins });

const corsOptions = {
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
app.use(cors(corsOptions));

// Body parser - MUST come before routes
app.use(express.json({ limit: '10mb' }));

// Trust proxy - important for rate limiting behind reverse proxies
app.set('trust proxy', 1);

// Apply general rate limiting to all routes
app.use(generalLimiter);

// Webhooks should NOT have Clerk auth (Clerk sends these)
app.use('/api/clerk-webhooks', clerkWebhookRouter);

// Apply Clerk authentication middleware to all routes after webhooks
app.use(clerkMiddleware());

// Health check endpoints - no auth required
app.get('/', (_req, res) => {
  res.send('Reddit SaaS backend is running 🚀');
});

app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/ready', async (_req, res) => {
  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`;

    // Check cache status
    const cacheStats = await getCacheStats();

    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'connected',
        server: 'running',
        cache: cacheStats.available ? 'available' : 'unavailable',
        cacheType: cacheStats.type
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'disconnected',
        server: 'running'
      },
      error: 'Database connection failed'
    });
  }
});

app.use('/api/leads', leadRouter);
app.use('/api/onboarding', onboardingRouter);
app.use('/api/engagement', engagementRouter);
app.use('/api/performance', performanceRouter);
app.use('/api/insights', insightRouter);
// app.use('/api/email', emailRouter);

// --- NEW: Add campaigns router ---
app.use('/api/campaigns', campaignRouter);
app.use('/api/reddit', redditRouter);
app.get('/api/users/:userId/usage', getUserUsage as RequestHandler);
app.use('/api/webhook', webhookRouter);
app.use('/api/user', userRouter); // Add the new user router
app.use('/api/analytics', analyticsRouter); // Add this line



// Global error handler - MUST be after all routes
app.use((err: any, req: any, res: any, next: any) => {
  // Log the error with structured logging
  log.error('Global error handler caught error', err, {
    path: req.path,
    method: req.method,
    userId: req.auth?.userId,
    ip: req.ip
  });

  // Check if it's a Clerk authentication error
  if (err.name === 'ClerkAPIResponseError' || err.message?.includes('authentication')) {
    res.status(401).json({
      error: 'Authentication failed',
      message: 'Please sign in to access this resource'
    });
    return;
  }

  // Handle different error types
  const statusCode = err.statusCode || err.status || 500;

  // Never expose internal error details in production
  const message = process.env.NODE_ENV === 'production' && statusCode === 500
    ? 'An unexpected error occurred'
    : err.message || 'An unexpected error occurred';

  res.status(statusCode).json({
    error: statusCode === 500 ? 'Internal Server Error' : 'Request Failed',
    message
  });
});

app.listen(PORT, async () => {
  log.info('Server started successfully', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version
  });

  // Initialize Redis (optional - falls back to memory if unavailable)
  await initializeRedis();

  // Initialize background job scheduler
  initializeScheduler();
  log.info('Background job scheduler initialized');

  // Log cache status
  const cacheStats = await getCacheStats();
  log.info('Cache initialized', cacheStats);
});