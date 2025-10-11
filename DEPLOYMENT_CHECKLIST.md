# ✅ Production Deployment Checklist

Complete this checklist before deploying to DigitalOcean.

---

## 🔐 1. Security & Credentials

### Rotate All Credentials (CRITICAL)
- [ ] Database password rotated (see SECURITY_CREDENTIAL_ROTATION.md)
- [ ] Gemini API key rotated
- [ ] Reddit OAuth credentials rotated
- [ ] Clerk keys rotated (use production keys)
- [ ] Resend API key rotated
- [ ] ApyHub token rotated
- [ ] Perplexity API key rotated (if using)

### Verify Secrets Not in Git
- [ ] Run: `git log --all -- .env` (should be empty)
- [ ] Check `.gitignore` includes `.env`
- [ ] No API keys in code files

---

## 🗄️ 2. Database

### Neon Setup
- [ ] Database exists and accessible
- [ ] Connection string has pooling params: `connection_limit=20&pool_timeout=20`
- [ ] SSL enabled: `sslmode=require`
- [ ] Test connection from local: `npx prisma studio`

### Schema
- [ ] Latest migrations applied: `npx prisma migrate deploy`
- [ ] Prisma client generated: `npx prisma generate`
- [ ] Backup created (optional but recommended)

---

## 🔧 3. Code Preparation

### Test Locally
- [ ] Backend builds: `npm run build`
- [ ] Backend runs: `npm start`
- [ ] Health check works: `curl http://localhost:5000/health`
- [ ] Database connects: `curl http://localhost:5000/ready`
- [ ] No TypeScript errors
- [ ] All tests pass (if you have tests)

### Git
- [ ] All changes committed
- [ ] Pushed to GitHub: `git push origin main`
- [ ] Repository is public or DO has access

---

## 🌐 4. External Services

### Clerk (Authentication)
- [ ] Production keys obtained (not test keys!)
- [ ] Production domain added in Clerk dashboard
- [ ] Webhook endpoint ready: `https://YOUR_DO_URL/api/clerk-webhooks`
- [ ] Webhook signing secret saved

### Reddit API
- [ ] Reddit app exists: https://www.reddit.com/prefs/apps
- [ ] OAuth redirect URI ready to update
- [ ] Production refresh token obtained
- [ ] User agent updated: `RedLead/1.0.0`

### Email (Resend)
- [ ] Domain verified in Resend
- [ ] Production API key obtained
- [ ] `EMAIL_FROM` address configured

---

## 📱 5. Frontend Configuration

### Environment Variables
- [ ] `NEXT_PUBLIC_API_URL` ready to update to DO URL
- [ ] Clerk production keys set in Vercel
- [ ] CORS origins include Vercel URL

### Vercel Settings
- [ ] Environment variables set for production
- [ ] Auto-deploy on push enabled
- [ ] Preview deployments configured

---

## 🚀 6. DigitalOcean App Platform

### App Creation
- [ ] DigitalOcean account created
- [ ] GitHub repository connected
- [ ] App created from dashboard or CLI
- [ ] Region selected (recommend: nyc1 or sfo2)

### Environment Variables Set
- [ ] `NODE_ENV=production`
- [ ] `PORT=8080`
- [ ] `DATABASE_URL` (from Neon)
- [ ] `CORS_ORIGINS`
- [ ] `FRONTEND_URL`
- [ ] `BACKEND_URL` (update after deployment)
- [ ] `REDDIT_*` variables
- [ ] `CLERK_*` variables
- [ ] `RESEND_API_KEY`
- [ ] `GEMINI_API_KEY`
- [ ] All secrets marked as "SECRET" type

### Build & Run Configuration
- [ ] Build command: `npm run build`
- [ ] Run command: `npm start`
- [ ] HTTP port: `8080`
- [ ] Health check path: `/health`
- [ ] Instance size selected (start with Basic $5/mo)

---

## 🔄 7. Post-Deployment

### Get Deployment URL
- [ ] Note your DigitalOcean URL: `https://redlead-backend-xxxxx.ondigitalocean.app`

### Update Backend URL References
- [ ] Update `BACKEND_URL` env var in DO dashboard
- [ ] Update `REDDIT_REDIRECT_URI` env var in DO dashboard
- [ ] Trigger redeployment

### Update External Services
- [ ] Reddit app: Update callback URL to DO URL
- [ ] Clerk dashboard: Update webhook endpoint to DO URL
- [ ] Frontend: Update `NEXT_PUBLIC_API_URL` to DO URL

### Verify Deployment
- [ ] Health check: `curl https://YOUR_URL/health` returns 200
- [ ] Ready check: `curl https://YOUR_URL/ready` returns "connected"
- [ ] HTTPS works (should have SSL automatically)
- [ ] CORS works (test from frontend)

---

## 🧪 8. Testing

### API Endpoints
- [ ] Can create account (sign up works)
- [ ] Can sign in (authentication works)
- [ ] Can create campaign (database writes work)
- [ ] Can analyze website (AI service works)
- [ ] Can connect Reddit (OAuth works)
- [ ] Can discover leads (Reddit API works)

### Background Jobs
- [ ] Check logs - cron jobs running
- [ ] Workers don't crash
- [ ] Database queries work
- [ ] No memory leaks

### Performance
- [ ] API responds < 500ms (avg)
- [ ] Database queries < 100ms (avg)
- [ ] No 500 errors in logs
- [ ] Memory usage stable

---

## 📊 9. Monitoring

### DigitalOcean Dashboard
- [ ] Set up alerts for:
  - Deployment failures
  - High error rates
  - High CPU usage
  - High memory usage
- [ ] Check runtime logs regularly
- [ ] Monitor database connection count

### External Monitoring (Optional)
- [ ] Set up UptimeRobot or similar (free)
- [ ] Monitor `/health` endpoint every 5 minutes
- [ ] Email alerts on downtime

---

## 🐛 10. Rollback Plan

### If Deployment Fails
- [ ] Check deployment logs in DO dashboard
- [ ] Revert to previous deployment (DO keeps history)
- [ ] Check environment variables
- [ ] Verify external services (Neon, Clerk, Reddit)

### Emergency Rollback
```bash
# In DigitalOcean dashboard:
# 1. Go to your app
# 2. Click "Deployments"
# 3. Find previous successful deployment
# 4. Click "Redeploy"
```

---

## 📝 11. Documentation

- [ ] Update README with production URLs
- [ ] Document any production-specific setup
- [ ] Share deployment guide with team
- [ ] Document troubleshooting steps

---

## ✅ Final Verification

Before marking as "deployed":

```bash
# 1. Health check passes
curl https://YOUR_URL/health
# Returns: {"status":"healthy",...}

# 2. Database connects
curl https://YOUR_URL/ready
# Returns: {"status":"ready","checks":{"database":"connected"}}

# 3. Authentication works
# Sign in from frontend, check network tab

# 4. Core features work
# Create campaign, discover leads, etc.

# 5. No errors in logs
# Check DigitalOcean runtime logs

# 6. Workers running
# Check logs for cron job messages
```

---

## 🎉 Deployment Complete!

Once all checkboxes are ✅:

Your production URLs:
- **Backend**: `https://redlead-backend-xxxxx.ondigitalocean.app`
- **Frontend**: `https://red-lead.vercel.app`
- **Database**: Neon (managed)

Your app is now:
- ✅ Secure
- ✅ Scalable (up to ~1,000 users)
- ✅ Monitored
- ✅ Auto-deploying
- ✅ Production-ready

---

**Estimated Total Time**: 30-60 minutes (if all credentials are ready)

**Cost**: $5/month to start
