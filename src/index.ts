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

// --- NEW: Import campaigns router ---
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
const allowedOrigins = [
  'https://red-lead.vercel.app', // Your deployed frontend
  'http://localhost:3000',
   'https://www.redlead.net',
    'https://www.redlead.net'       // Your local frontend for development
];

const corsOptions = {
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
app.use(cors(corsOptions));

// Body parser - MUST come before routes
app.use(express.json({ limit: '10mb' }));

// Trust proxy - important for rate limiting behind reverse proxies (Render, Heroku, etc.)
app.set('trust proxy', 1);

// Apply general rate limiting to all routes
app.use(generalLimiter);

// Webhooks should NOT have Clerk auth (Clerk sends these)
app.use('/api/clerk-webhooks', clerkWebhookRouter);

// Apply Clerk authentication middleware to all routes after webhooks
app.use(clerkMiddleware());

app.get('/', (_req, res) => {
  res.send('Reddit SaaS backend is running 🚀');
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
  // Log the error with context
  console.error('[ERROR] Global error handler caught:');
  console.error('  Path:', req.method, req.path);
  console.error('  Error:', err.message);

  // In development, log the full stack trace
  if (process.env.NODE_ENV === 'development') {
    console.error('  Stack:', err.stack);
  }

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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  initializeScheduler();
});