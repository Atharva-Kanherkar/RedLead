# 🚀 RedLead - AI-Powered Reddit Lead Generation SaaS

<div align="center">

![RedLead Banner](https://img.shields.io/badge/RedLead-Production%20Ready-orange?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue?style=for-the-badge&logo=typescript)
![Production Grade](https://img.shields.io/badge/Architecture-Grade%20A-success?style=for-the-badge)

**Transform Reddit into your lead generation engine with AI-powered discovery and analysis**

[Features](#-features) • [Demo](#-demo) • [Quick Start](#-quick-start) • [Architecture](#-architecture) • [Documentation](#-documentation)

</div>

---

## 📋 Table of Contents

- [About](#-about)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Development](#-development)
- [Deployment](#-deployment)
- [API Documentation](#-api-documentation)
- [Project Structure](#-project-structure)
- [Performance](#-performance)
- [Security](#-security)
- [Scalability](#-scalability)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 About

**RedLead** is a production-grade SaaS platform that helps businesses discover and engage with potential customers on Reddit through AI-powered lead generation, sentiment analysis, and automated engagement tracking.

### The Problem
Finding relevant conversations on Reddit manually is time-consuming and inefficient. Businesses miss opportunities because they can't monitor thousands of subreddits in real-time.

### The Solution
RedLead uses AI to automatically:
- 🔍 Discover relevant Reddit posts and comments mentioning your keywords
- 🎯 Score leads by opportunity level (pain points, solution-seeking, comparisons)
- 💬 Generate contextual reply suggestions that sound natural
- 📊 Track engagement performance and competitor mentions
- ⚡ Send real-time webhooks for high-value opportunities

---

## ✨ Features

### 🤖 AI-Powered Discovery
- **Smart Lead Scoring**: ML-based scoring algorithm (0-100) based on intent, sentiment, and engagement
- **Multi-Strategy Search**: Global, targeted, and competitor-focused discovery
- **Intent Analysis**: Classifies posts as pain points, solution-seeking, or brand comparisons
- **Sentiment Detection**: Identifies positive, negative, or neutral discussions

### 🎨 Reply Generation
- **Context-Aware Replies**: AI generates 3 natural-sounding reply options
- **Subreddit Culture Analysis**: Respects community rules and culture
- **Fun Mode**: Optional humorous replies for creative engagement
- **Reply Refinement**: Edit and refine AI suggestions with instructions

### 📊 Analytics & Insights
- **Lead Trends**: 30-day trend analysis with daily breakdowns
- **Subreddit Performance**: Identify your best-performing subreddits
- **Opportunity Distribution**: High/medium/low quality lead breakdown
- **Weekly Activity Patterns**: Discover peak posting times
- **Competitor Intelligence**: Automatic discovery of competitor mentions

### 🔔 Integrations
- **Webhooks**: Real-time notifications to Slack, Discord, or custom endpoints
- **Email Notifications**: Alerts for new high-value leads
- **Reddit OAuth**: Users connect their own Reddit accounts
- **Performance Tracking**: Monitor reply upvotes and author responses

### 🛡️ Enterprise-Grade
- **Multi-Tenant**: Secure user isolation with per-user Reddit accounts
- **Rate Limiting**: Protects against abuse (100 req/15min general, 20 req/15min AI)
- **Input Validation**: Joi schema validation on all endpoints
- **Distributed Caching**: Redis with automatic in-memory fallback
- **Job Queue**: BullMQ for async processing with retry logic
- **Circuit Breaker**: Prevents cascading failures
- **Prometheus Metrics**: Full observability and monitoring

---

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js 20.x
- **Language**: TypeScript 5.x (100% type-safe)
- **Framework**: Express 5.x
- **Database**: PostgreSQL (Neon) with Prisma ORM
- **Cache**: Redis (ioredis) with in-memory fallback
- **Queue**: BullMQ for job processing
- **Auth**: Clerk (user authentication)
- **Logging**: Winston (structured JSON logs)
- **Metrics**: Prometheus (prom-client)

### Frontend
- **Framework**: Next.js 15.x (App Router)
- **UI Library**: React 19
- **Styling**: TailwindCSS 4.x
- **Components**: shadcn/ui + Radix UI
- **Animations**: Framer Motion
- **Auth**: Clerk
- **Charts**: Recharts

### External APIs
- **Reddit API**: Snoowrap client
- **AI Services**: Google Gemini 2.0, OpenAI GPT-4, Perplexity
- **Email**: Resend
- **Web Scraping**: Puppeteer + Cheerio

### Infrastructure
- **Backend Hosting**: DigitalOcean App Platform
- **Frontend Hosting**: Vercel
- **Database**: Neon (serverless PostgreSQL)
- **Cache/Queue**: Redis (Upstash or DigitalOcean Managed)
- **CI/CD**: GitHub Actions (auto-deploy)

---

## 🏗️ Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────┐
│         Frontend (Next.js - Vercel)         │
│  - Server-Side Rendering                    │
│  - Optimistic Updates                       │
│  - Real-time UI                             │
└──────────────────┬──────────────────────────┘
                   │ HTTPS/REST API
                   │
┌──────────────────▼──────────────────────────┐
│      Load Balancer (DigitalOcean)           │
└──────────────────┬──────────────────────────┘
                   │
        ┌──────────┴──────────┬──────────────┐
        │                     │              │
┌───────▼──────┐      ┌───────▼───┐   ┌─────▼─────┐
│   API #1     │      │  API #2   │   │  API #N   │
│              │      │           │   │           │
│  Express     │      │ Express   │   │ Express   │
│  - Routes    │      │ - Routes  │   │ - Routes  │
│  - Middleware│      │ - Middleware  │ - Middleware
│  - No State  │      │ - No State│   │ - No State│
└──────┬───────┘      └──────┬────┘   └─────┬─────┘
       │                     │              │
       └─────────────────────┴──────────────┘
                             │
                  ┌──────────┴──────────┐
                  │                     │
            ┌─────▼──────┐       ┌──────▼────────┐
            │   Redis    │       │  PostgreSQL   │
            │            │       │    (Neon)     │
            │ - Cache    │       │               │
            │ - Queues   │       │ - User Data   │
            │ - Sessions │       │ - Campaigns   │
            └─────┬──────┘       │ - Leads       │
                  │              │ - Indexes     │
                  │              └───────────────┘
                  │
            ┌─────▼──────────────────┐
            │                        │
     ┌──────▼────────┐      ┌────────▼──────┐
     │   Worker #1   │      │   Worker #2   │
     │               │      │               │
     │ - Lead Disc.  │      │ - Subreddit   │
     │ - Reply Track │      │ - Insights    │
     │ - BullMQ      │      │ - BullMQ      │
     └───────────────┘      └───────────────┘
```

### Request Flow

```
User Action (Frontend)
    ↓
Clerk Auth Check
    ↓
API Request (HTTPS)
    ↓
Rate Limiting (100 req/15min)
    ↓
Input Validation (Joi)
    ↓
Authorization (gateKeeper)
    ↓
Reddit Connection Check (if needed)
    ↓
Controller Logic
    ↓
Service Layer (Business Logic)
    ├─→ Cache Check (Redis/Memory)
    ├─→ Database Query (Prisma)
    ├─→ External API (with Circuit Breaker)
    └─→ Job Queue (BullMQ)
    ↓
Response to User
    ↓
Metrics Recorded (Prometheus)
```

### Background Job Processing

```
BullMQ Queue (Redis)
    ↓
Worker Process
    ↓
Execute Job with Retry
    ├─→ Lead Discovery (every 15 min)
    ├─→ Subreddit Analysis (daily)
    ├─→ Reply Tracking (every minute)
    ├─→ Performance Tracking (hourly)
    ├─→ Market Insights (hourly)
    └─→ Trial Expiration (daily)
    ↓
Update Database
    ↓
Send Webhooks (if configured)
    ↓
Send Email Notifications
    ↓
Record Metrics
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20.x or higher
- **npm** 10.x or higher
- **PostgreSQL** database (Neon recommended)
- **Redis** (optional - for production scaling)
- **Accounts**: Clerk, Reddit API, Google Gemini

### 1. Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/RedLead.git
cd RedLead
```

### 2. Install Dependencies

```bash
# Backend
npm install

# Frontend
cd frontend
npm install
cd ..
```

### 3. Configure Environment

```bash
# Backend
cp .env.development .env
# Edit .env with your credentials

# Frontend
cd frontend
cp .env.example .env.local
# Edit .env.local with your credentials
```

### 4. Set Up Database

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma db push
```

### 5. Start Development Servers

```bash
# Terminal 1 - Backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

**🎉 Done!** Open http://localhost:3000

---

## 📦 Installation

### Detailed Backend Setup

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.development .env

# Edit .env and fill in:
# - DATABASE_URL (from Neon)
# - GEMINI_API_KEY (from Google AI Studio)
# - REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET (from reddit.com/prefs/apps)
# - CLERK_SECRET_KEY, CLERK_PUBLISHABLE_KEY (from Clerk dashboard)
# - RESEND_API_KEY (from Resend)

# 3. Generate Prisma client
npx prisma generate

# 4. Initialize database
npx prisma db push

# 5. Test the build
npm run build

# 6. Start development server
npm run dev
```

### Detailed Frontend Setup

```bash
cd frontend

# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local

# Edit .env.local and set:
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# 3. Start development server
npm run dev
```

---

## ⚙️ Configuration

### Environment Variables

#### Backend (.env)

```bash
# ========== REQUIRED ==========

# Database
DATABASE_URL=postgresql://user:password@host:port/database?connection_limit=20

# Server
PORT=5000
NODE_ENV=development
CORS_ORIGINS=http://localhost:3000

# AI Service
GEMINI_API_KEY=your_gemini_api_key

# Reddit API
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
REDDIT_USER_AGENT=RedLead/1.0.0
REDDIT_REFRESH_TOKEN=your_refresh_token
REDDIT_REDIRECT_URI=http://localhost:5000/api/reddit/callback

# Clerk Authentication
CLERK_SECRET_KEY=sk_test_your_key
CLERK_PUBLISHABLE_KEY=pk_test_your_key
CLERK_WEBHOOK_SECRET=whsec_your_secret

# Email
RESEND_API_KEY=re_your_key
EMAIL_FROM=noreply@yourdomain.com

# ========== OPTIONAL ==========

# Redis (for production scaling)
REDIS_URL=redis://localhost:6379

# Additional AI providers (fallback)
PERPLEXITY_API_KEY=your_key
OPENAI_API_KEY=your_key

# Logging
LOG_LEVEL=debug
```

#### Frontend (.env.local)

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key
CLERK_SECRET_KEY=sk_test_your_key

# Clerk Redirects
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
```

### Getting API Credentials

<details>
<summary><b>🔑 Reddit API</b></summary>

1. Go to https://www.reddit.com/prefs/apps
2. Click "create another app..."
3. Select "web app"
4. Set redirect URI: `http://localhost:5000/api/reddit/callback`
5. Copy client ID and secret
6. Run `node generate-token.js` to get refresh token

</details>

<details>
<summary><b>🔑 Google Gemini</b></summary>

1. Go to https://makersuite.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key

</details>

<details>
<summary><b>🔑 Clerk</b></summary>

1. Go to https://dashboard.clerk.com
2. Create a new application
3. Copy publishable and secret keys
4. Set up webhook endpoint: `https://your-backend/api/clerk-webhooks`

</details>

<details>
<summary><b>🔑 Resend (Email)</b></summary>

1. Go to https://resend.com/api-keys
2. Create API key
3. Verify your domain

</details>

---

## 💻 Development

### Running Locally

#### Option 1: Standard Mode (API + Workers in same process)

```bash
# Backend
npm run dev

# Frontend (separate terminal)
cd frontend
npm run dev
```

#### Option 2: Separate Processes (Recommended for testing scaling)

```bash
# Set Redis URL
export REDIS_URL=redis://localhost:6379

# Terminal 1 - API Server
npm run dev

# Terminal 2 - Worker Process
npm run dev:worker

# Terminal 3 - Frontend
cd frontend
npm run dev
```

### Available Scripts

**Backend:**
```bash
npm run dev          # Start development server (API + workers)
npm run dev:worker   # Start worker process only (requires Redis)
npm run build        # Compile TypeScript to JavaScript
npm start            # Run production build
npm run start:worker # Run worker in production
npm test             # Run tests (if configured)
```

**Frontend:**
```bash
npm run dev          # Start Next.js dev server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
```

### Development Workflow

1. **Create a branch**
   ```bash
   git checkout -b feature/your-feature
   ```

2. **Make changes**
   - Backend: Edit files in `src/`
   - Frontend: Edit files in `frontend/`

3. **Test locally**
   ```bash
   npm run build  # Ensure TypeScript compiles
   npm run dev    # Test functionality
   ```

4. **Commit**
   ```bash
   git add .
   git commit -m "feat: your feature description"
   ```

5. **Push**
   ```bash
   git push origin feature/your-feature
   ```

---

## 🌐 Deployment

### Backend Deployment (DigitalOcean)

**Recommended**: DigitalOcean App Platform ($5-12/month)

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Create App on DigitalOcean**
   - Go to https://cloud.digitalocean.com/apps
   - Click "Create App"
   - Connect GitHub repository
   - Select `main` branch

3. **Configure Build**
   - Build Command: `npm run build`
   - Run Command: `npm start`
   - HTTP Port: `8080`
   - Health Check: `/health`

4. **Set Environment Variables**
   - Copy all variables from `.env.production`
   - Mark secrets as "SECRET" type
   - Update URLs with your DigitalOcean app URL

5. **Deploy**
   - Click "Create Resources"
   - Wait 5-10 minutes for deployment

**See**: `DIGITALOCEAN_DEPLOYMENT.md` for detailed guide

### Frontend Deployment (Vercel)

**Recommended**: Vercel (Free tier available)

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Import on Vercel**
   - Go to https://vercel.com
   - Click "Import Project"
   - Select your repository
   - Root directory: `frontend`

3. **Configure Environment Variables**
   ```bash
   NEXT_PUBLIC_API_URL=https://your-backend.ondigitalocean.app
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
   CLERK_SECRET_KEY=sk_live_...
   ```

4. **Deploy**
   - Click "Deploy"
   - Auto-deploys on every push to main

### Database Setup (Neon)

1. Go to https://neon.tech
2. Create a new project
3. Copy connection string
4. Update `DATABASE_URL` in your environment

**Already configured with**:
- Connection pooling (20 connections)
- SSL enabled
- Auto-backups

### Redis Setup (Optional - for scaling)

**Option 1: Upstash (Recommended - $0.20/month)**
1. Go to https://upstash.com
2. Create Redis database
3. Copy connection URL
4. Set `REDIS_URL` environment variable

**Option 2: DigitalOcean Managed Redis ($15/month)**
1. In DigitalOcean dashboard
2. Create managed Redis cluster
3. Copy connection URL
4. Set `REDIS_URL` environment variable

**Option 3: No Redis**
- System works fine without Redis
- Uses in-memory cache (single instance only)

---

## 📚 API Documentation

### Authentication

All API requests (except `/health`, `/ready`, `/metrics`) require authentication.

**Headers:**
```
Authorization: Bearer <clerk_token>
Content-Type: application/json
```

### Core Endpoints

#### POST `/api/onboarding/analyze`
Analyze a website to generate keywords and description.

**Request:**
```json
{
  "websiteUrl": "https://example.com"
}
```

**Response:**
```json
{
  "websiteUrl": "https://example.com",
  "generatedKeywords": ["saas", "analytics", "dashboard"],
  "generatedDescription": "A powerful analytics platform..."
}
```

#### POST `/api/onboarding/complete`
Complete onboarding and create first campaign.

**Request:**
```json
{
  "websiteUrl": "https://example.com",
  "generatedKeywords": ["saas", "analytics"],
  "generatedDescription": "Analytics platform",
  "competitors": ["competitor1", "competitor2"]
}
```

#### GET `/api/campaigns`
Get all campaigns for authenticated user.

**Response:**
```json
[
  {
    "id": "campaign_id",
    "name": "Main Campaign",
    "analyzedUrl": "https://example.com",
    "targetSubreddits": ["startups", "saas"],
    "isActive": true,
    "createdAt": "2025-10-11T00:00:00.000Z"
  }
]
```

#### GET `/api/leads/campaign/:campaignId`
Get leads for a specific campaign.

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 20)
- `status` (new, saved, replied, ignored, all)
- `sortBy` (opportunityScore, createdAt)
- `sortOrder` (asc, desc)

**Response:**
```json
{
  "data": [
    {
      "id": "lead_id",
      "title": "Looking for analytics tools",
      "author": "reddit_user",
      "subreddit": "startups",
      "opportunityScore": 85,
      "intent": "solution_seeking",
      "status": "new",
      "url": "https://reddit.com/r/startups/...",
      "createdAt": 1234567890
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

#### POST `/api/leads/discover/manual/:campaignId`
Manually trigger lead discovery for a campaign.

**Requires**: Reddit account connected

**Response:**
```json
[
  {
    "id": "lead_id",
    "title": "...",
    "opportunityScore": 85,
    "status": "new"
  }
]
```

#### POST `/api/engagement/generate`
Generate AI reply options for a lead.

**Request:**
```json
{
  "leadId": "lead_id",
  "context": "Additional context",
  "funMode": false
}
```

**Response:**
```json
{
  "replies": [
    "Reply option 1...",
    "Reply option 2...",
    "Reply option 3..."
  ]
}
```

### Health & Monitoring

#### GET `/health`
Basic health check (always returns 200 if server is running).

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-11T12:00:00.000Z",
  "uptime": 12345,
  "environment": "production"
}
```

#### GET `/ready`
Readiness check (validates dependencies).

**Response:**
```json
{
  "status": "ready",
  "timestamp": "2025-10-11T12:00:00.000Z",
  "checks": {
    "database": "connected",
    "server": "running",
    "cache": "available",
    "cacheType": "redis"
  }
}
```

#### GET `/metrics`
Prometheus metrics endpoint.

**Response:** Prometheus text format with metrics like:
- `redlead_http_requests_total`
- `redlead_http_request_duration_seconds`
- `redlead_cache_hits_total`
- `redlead_ai_requests_total`
- `redlead_jobs_processed_total`

---

## 📁 Project Structure

```
RedLead/
├── src/                          # Backend source code
│   ├── controllers/              # Request handlers
│   │   ├── lead.controller.ts    # Lead discovery & management
│   │   ├── onboarding.controller.ts
│   │   ├── engagement.controller.ts
│   │   ├── analytics.controller.ts
│   │   └── ...
│   ├── services/                 # Business logic
│   │   ├── ai.service.ts         # AI provider integrations
│   │   ├── reddit.service.ts     # Reddit API wrapper
│   │   ├── scraper.service.ts    # Web scraping
│   │   └── ...
│   ├── workers/                  # Background jobs
│   │   ├── lead.worker.ts        # Lead discovery worker
│   │   ├── subreddit.worker.ts   # Subreddit analysis
│   │   └── ...
│   ├── middleware/               # Express middleware
│   │   ├── rateLimiter.ts        # Rate limiting
│   │   ├── validator.ts          # Input validation
│   │   ├── gateKeeper.ts         # Authorization
│   │   ├── requireReddit.ts      # Reddit connection check
│   │   └── metricsMiddleware.ts  # Request tracking
│   ├── routes/                   # API routes
│   │   ├── leads.ts
│   │   ├── onboarding.ts
│   │   └── ...
│   ├── lib/                      # Shared utilities
│   │   ├── prisma.ts             # Database singleton
│   │   ├── logger.ts             # Structured logging
│   │   ├── redis.ts              # Redis client
│   │   ├── cache.ts              # Cache abstraction
│   │   ├── queue.ts              # Job queue
│   │   ├── retry.ts              # Retry utility
│   │   ├── circuitBreaker.ts     # Circuit breaker
│   │   └── metrics.ts            # Prometheus metrics
│   ├── queues/                   # Job queue definitions
│   │   └── jobs.ts
│   ├── types/                    # TypeScript types
│   │   ├── reddit.types.ts
│   │   └── snoowrap.types.ts
│   ├── index.ts                  # API server entry point
│   └── worker.ts                 # Worker process entry point
├── frontend/                     # Frontend source code
│   ├── app/                      # Next.js App Router
│   │   ├── page.tsx              # Landing page
│   │   ├── dashboard/            # Dashboard pages
│   │   ├── onboarding/           # Onboarding flow
│   │   └── ...
│   ├── components/               # React components
│   │   ├── dashboard/            # Dashboard components
│   │   ├── onboarding/           # Onboarding components
│   │   ├── ui/                   # shadcn/ui components
│   │   └── ...
│   ├── lib/                      # Utilities
│   │   └── api.ts                # API client
│   └── middleware.ts             # Clerk auth middleware
├── prisma/                       # Database schema
│   └── schema.prisma             # Prisma schema with indexes
├── .do/                          # DigitalOcean config
│   └── app.yaml                  # App Platform spec
├── .env.example                  # Environment template
├── .env.development              # Development config
├── .env.production               # Production config
├── package.json                  # Dependencies & scripts
├── tsconfig.json                 # TypeScript config
└── README.md                     # This file
```

---

 
---

## 🙏 Acknowledgments

- **Clerk** - Authentication platform
- **Neon** - Serverless PostgreSQL
- **Vercel** - Frontend hosting
- **DigitalOcean** - Backend hosting
- **Google** - Gemini AI API
- **Reddit** - API access

---

## 🎯 Project Status

**Current Version**: 1.0.0
**Status**: ✅ Production Ready
**Last Updated**: October 2025

### Roadmap

- [ ] Add unit tests (Jest)
- [ ] Add E2E tests (Playwright)
- [ ] Add API versioning (/api/v1/...)
- [ ] Extract scraper to microservice
- [ ] Add GraphQL API (optional)
- [ ] Mobile app (React Native)
- [ ] AI model fine-tuning
- [ ] Advanced analytics dashboard

---

<div align="center">

**Built with ❤️ using TypeScript, Redis, and modern cloud architecture**

[⬆ Back to Top](#-redlead---ai-powered-reddit-lead-generation-saas)

</div>
