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

app.use('/api/clerk-webhooks', clerkWebhookRouter);

app.use(clerkMiddleware());


app.use(express.json());

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



app.use((err: any, req: any, res: any, next: any) => {
  console.error(err.stack);
  res.status(401).json({ 
    error: 'Unauthenticated!',
    message: err.message 
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  initializeScheduler();
});