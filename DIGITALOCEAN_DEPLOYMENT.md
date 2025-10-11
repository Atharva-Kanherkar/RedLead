# 🌊 DigitalOcean Deployment Guide

Complete guide to deploying RedLead backend on DigitalOcean App Platform.

---

## 📋 Prerequisites

- [x] DigitalOcean account (sign up at digitalocean.com)
- [x] GitHub repository with your code
- [x] Neon PostgreSQL database (already have this)
- [x] All credentials rotated (see SECURITY_CREDENTIAL_ROTATION.md)
- [x] Code pushed to GitHub

---

## 🚀 Option 1: Deploy via DigitalOcean Dashboard (Easiest)

### Step 1: Create New App

1. Go to: https://cloud.digitalocean.com/apps
2. Click **"Create App"**
3. Choose **"GitHub"** as source
4. Authorize DigitalOcean to access your GitHub
5. Select repository: **YOUR_USERNAME/RedLead**
6. Select branch: **main**
7. Click **"Next"**

### Step 2: Configure Resources

**Detected Service: Web Service**
- Name: `redlead-backend`
- Branch: `main`
- Source Directory: `/` (root)
- **Autodeploy**: ✅ Enabled (deploys on git push)

**Build Settings:**
- Build Command: `npm run build`
- Run Command: `npm start`

**HTTP Settings:**
- HTTP Port: `8080`
- HTTP Path: `/`
- Health Check Path: `/health`

**Instance Size:**
- Start with: **Basic ($5/month)**
- Scales later if needed

Click **"Next"**

### Step 3: Set Environment Variables

**CRITICAL**: Click **"Edit"** next to environment variables and add:

```bash
# Environment
NODE_ENV=production
PORT=8080

# Database (from Neon)
DATABASE_URL=postgresql://neondb_owner:YOUR_PASSWORD@ep-frosty-river-a8maicz0-pooler.eastus2.azure.neon.tech/neondb?sslmode=require&connection_limit=20&pool_timeout=20&connect_timeout=10

# URLs (update with your actual domains)
CORS_ORIGINS=https://red-lead.vercel.app,https://www.redlead.net
FRONTEND_URL=https://red-lead.vercel.app
BACKEND_URL=https://redlead-backend-xxxxx.ondigitalocean.app

# Reddit API
REDDIT_CLIENT_ID=YOUR_CLIENT_ID
REDDIT_CLIENT_SECRET=YOUR_CLIENT_SECRET
REDDIT_USER_AGENT=RedLead/1.0.0
REDDIT_REFRESH_TOKEN=YOUR_REFRESH_TOKEN
REDDIT_REDIRECT_URI=https://redlead-backend-xxxxx.ondigitalocean.app/api/reddit/callback

# Clerk
CLERK_SECRET_KEY=sk_live_YOUR_KEY
CLERK_PUBLISHABLE_KEY=pk_live_YOUR_KEY
CLERK_WEBHOOK_SECRET=whsec_YOUR_SECRET

# Email
RESEND_API_KEY=re_YOUR_KEY
EMAIL_FROM=leads@redlead.net

# AI Services
GEMINI_API_KEY=YOUR_KEY
PERPLEXITY_API_KEY=YOUR_KEY
APYHUB_TOKEN=YOUR_TOKEN

# Logging
LOG_LEVEL=info
```

**Mark as SECRET**: All API keys, tokens, passwords

Click **"Next"**

### Step 4: Review and Launch

1. Review all settings
2. Click **"Create Resources"**
3. Wait 5-10 minutes for initial deployment

**Your app will be live at:**
```
https://redlead-backend-xxxxx.ondigitalocean.app
```

---

## 🚀 Option 2: Deploy via App Spec (Advanced)

### Step 1: Update App Spec

Edit `.do/app.yaml`:

```yaml
github:
  repo: YOUR_GITHUB_USERNAME/RedLead
  branch: main
```

### Step 2: Deploy with doctl CLI

```bash
# Install DigitalOcean CLI
brew install doctl  # macOS
# or
sudo snap install doctl  # Linux

# Authenticate
doctl auth init

# Create app from spec
doctl apps create --spec .do/app.yaml

# Or update existing app
doctl apps update YOUR_APP_ID --spec .do/app.yaml
```

---

## 🔧 Post-Deployment Configuration

### 1. Update Backend URL

After deployment, DigitalOcean gives you a URL like:
```
https://redlead-backend-abc123.ondigitalocean.app
```

**Update these environment variables in DO dashboard:**
```bash
BACKEND_URL=https://redlead-backend-abc123.ondigitalocean.app
REDDIT_REDIRECT_URI=https://redlead-backend-abc123.ondigitalocean.app/api/reddit/callback
```

### 2. Update CORS Origins

Make sure CORS includes your frontend:
```bash
CORS_ORIGINS=https://red-lead.vercel.app,https://www.redlead.net
```

### 3. Update Reddit App Settings

Go to: https://www.reddit.com/prefs/apps

Update redirect URI to:
```
https://redlead-backend-abc123.ondigitalocean.app/api/reddit/callback
```

### 4. Update Clerk Webhook

In Clerk dashboard, update webhook endpoint to:
```
https://redlead-backend-abc123.ondigitalocean.app/api/clerk-webhooks
```

---

## 🧪 Testing Deployment

### 1. Health Check
```bash
curl https://redlead-backend-abc123.ondigitalocean.app/health

# Should return:
{
  "status": "healthy",
  "timestamp": "...",
  "uptime": 123,
  "environment": "production"
}
```

### 2. Readiness Check
```bash
curl https://redlead-backend-abc123.ondigitalocean.app/ready

# Should return:
{
  "status": "ready",
  "checks": {
    "database": "connected",
    "server": "running"
  }
}
```

### 3. Test Authentication
```bash
# From your frontend, try to sign in
# Check network tab - API calls should go to DigitalOcean URL
```

---

## 📊 DigitalOcean App Platform Features

### What You Get:
- ✅ Automatic HTTPS/SSL
- ✅ Auto-deploy on git push
- ✅ Health monitoring
- ✅ Logs viewer
- ✅ Easy environment variable management
- ✅ Horizontal scaling (when needed)
- ✅ Built-in CDN
- ✅ DDoS protection

### Pricing:
- **Basic ($5/month)**: 512MB RAM, 1 vCPU - Good for 0-100 users
- **Professional ($12/month)**: 1GB RAM, 1 vCPU - Good for 100-1,000 users
- **Scale up as needed**

---

## 🔄 CI/CD Workflow

Once set up, your workflow is:

```bash
# 1. Make changes locally
git add .
git commit -m "feat: new feature"

# 2. Push to GitHub
git push origin main

# 3. DigitalOcean automatically:
#    - Detects the push
#    - Runs npm run build
#    - Runs npm start
#    - Health checks pass
#    - Routes traffic to new version
#    - Zero downtime deployment
```

---

## 🐛 Troubleshooting

### Build Fails
**Check:**
- Build logs in DigitalOcean dashboard
- Ensure `npm run build` works locally
- Check all dependencies are in package.json (not devDependencies)

### App Crashes on Startup
**Check:**
- Runtime logs in DigitalOcean dashboard
- Environment variables are all set
- DATABASE_URL is correct
- Health check passes

### Database Connection Fails
**Check:**
- DATABASE_URL includes connection pooling params
- Neon database allows external connections
- IP allowlist in Neon (if configured)

### Reddit OAuth Fails
**Check:**
- REDDIT_REDIRECT_URI matches app settings on reddit.com
- BACKEND_URL is correct DigitalOcean URL
- Reddit app has production callback URL

---

## 📁 Files for Deployment

### Required in Repository:
- ✅ `package.json` - Dependencies
- ✅ `package-lock.json` - Lock file
- ✅ `tsconfig.json` - TypeScript config
- ✅ `src/` - Source code
- ✅ `prisma/` - Database schema
- ✅ `.do/app.yaml` - DigitalOcean config (optional)

### NOT in Repository:
- ❌ `.env` - Secrets (gitignored)
- ❌ `node_modules/` - Dependencies (gitignored)
- ❌ `dist/` - Build output (gitignored)
- ❌ `logs/` - Log files (gitignored)

---

## ⚙️ DigitalOcean-Specific Configuration

### 1. PORT Configuration

DigitalOcean uses port `8080` by default:

```typescript
// src/index.ts (already correct)
const PORT = process.env.PORT || 5000;
// DO will set PORT=8080 automatically ✅
```

### 2. Trust Proxy

```typescript
// src/index.ts (already configured)
app.set('trust proxy', 1);
// Required for rate limiting behind DO's load balancer ✅
```

### 3. Health Checks

```typescript
// src/index.ts (already added)
app.get('/health', ...);
app.get('/ready', ...);
// DO will use these to monitor app health ✅
```

**Everything is already configured!** ✅

---

## 🔐 Security Checklist

Before deploying:

- [ ] All credentials rotated (not using exposed ones)
- [ ] `.env` not in git (already gitignored ✅)
- [ ] Environment variables set in DO dashboard
- [ ] CORS configured for production domains
- [ ] Rate limiting enabled (already done ✅)
- [ ] Input validation enabled (already done ✅)

---

## 📝 Quick Deploy Steps

### 1. Push to GitHub
```bash
git add .
git commit -m "chore: prepare for DigitalOcean deployment"
git push origin main
```

### 2. Create App on DigitalOcean
1. Go to https://cloud.digitalocean.com/apps
2. Click "Create App"
3. Select GitHub → YOUR_REPO → main branch
4. Configure as described above
5. Set all environment variables
6. Click "Create Resources"

### 3. Update URLs
Once deployed, update these environment variables in DO dashboard:
```bash
BACKEND_URL=https://your-app.ondigitalocean.app
REDDIT_REDIRECT_URI=https://your-app.ondigitalocean.app/api/reddit/callback
```

### 4. Update External Services
- Reddit app: Update callback URL
- Clerk: Update webhook endpoint
- Frontend: Update NEXT_PUBLIC_API_URL

### 5. Test
```bash
curl https://your-app.ondigitalocean.app/health
```

---

## 💰 Cost Estimate

**Backend on DigitalOcean:**
- Basic: $5/month (512MB RAM) - 0-100 users
- Professional: $12/month (1GB RAM) - 100-1,000 users

**Database on Neon:**
- Free tier: $0/month - 0-100 users
- Pro: $19/month - unlimited

**Total:**
- Start: **$5/month** (plus Neon if needed)
- At scale: **$12-25/month**

Much cheaper than Render! 💰

---

## 🎯 Advantages of DigitalOcean

1. **Cheaper**: $5/month vs Render's $7/month
2. **Better performance**: More RAM for same price
3. **Great monitoring**: Built-in logs, metrics
4. **Auto-scaling**: Easy to scale up
5. **Good documentation**: Excellent support

---

## 📊 Architecture After Deployment

```
┌──────────────────┐
│   Frontend       │
│   (Vercel)       │
│  red-lead.vercel │
└────────┬─────────┘
         │ HTTPS
         │
┌────────▼─────────────────┐
│  DigitalOcean App        │
│  redlead-backend.do.app  │
│                          │
│  - Auto HTTPS/SSL        │
│  - Load balancer         │
│  - Health monitoring     │
│  - Auto-deploy on push   │
└────────┬─────────────────┘
         │
         │ SSL Connection
         │
┌────────▼─────────┐
│  Neon Database   │
│  (PostgreSQL)    │
│                  │
│  - Auto backups  │
│  - Connection    │
│    pooling       │
└──────────────────┘
```

---

## ✅ You're Ready to Deploy!

Everything is already configured:
- ✅ Code is production-ready
- ✅ Environment variables documented
- ✅ Health checks implemented
- ✅ Database optimized
- ✅ Security hardened

Just follow the steps above and you'll be live in ~15 minutes!

---

## 📞 Need Help?

**DigitalOcean Docs**: https://docs.digitalocean.com/products/app-platform/
**Community**: https://www.digitalocean.com/community/
**Support**: Available 24/7 with paid plans

---

**Ready to deploy? Let me know if you need help with any specific step!**
