# 🌍 Environment Configuration Guide

This guide explains how to configure and switch between development and production environments.

---

## 📁 Environment Files

### Available Templates:
- `.env.example` - Template with placeholders
- `.env.development` - Pre-configured for local development
- `.env.production` - Pre-configured for production deployment
- `.env` - Your active configuration (gitignored)

### Frontend Templates:
- `frontend/.env.example` - Frontend template
- `frontend/.env.local` - Frontend active config (gitignored)

---

## 🚀 Quick Start

### For Development:
```bash
# Backend
cp .env.development .env
npm run dev

# Frontend (in another terminal)
cd frontend
cp .env.example .env.local
npm run dev
```

### For Production:
```bash
# Backend
cp .env.production .env
# Edit .env and replace all "NEW_*" placeholders with rotated credentials
npm run build
npm start

# Frontend
cd frontend
# Update .env.local with production Clerk keys and API URL
npm run build
npm start
```

---

## 🔧 Environment Variables Reference

### Backend Environment Variables

| Variable | Development | Production | Description |
|----------|-------------|------------|-------------|
| `NODE_ENV` | `development` | `production` | Environment mode |
| `PORT` | `5000` | `5000` | Server port |
| `CORS_ORIGINS` | `http://localhost:3000` | `https://red-lead.vercel.app,https://www.redlead.net` | Allowed origins (comma-separated) |
| `FRONTEND_URL` | `http://localhost:3000` | `https://red-lead.vercel.app` | Frontend URL for redirects |
| `BACKEND_URL` | `http://localhost:5000` | `https://redlead.onrender.com` | Backend URL |
| `REDDIT_REDIRECT_URI` | `http://localhost:5000/api/reddit/callback` | `https://redlead.onrender.com/api/reddit/callback` | Reddit OAuth callback |
| `LOG_LEVEL` | `debug` | `info` | Logging verbosity |

### Frontend Environment Variables

| Variable | Development | Production | Description |
|----------|-------------|------------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:5000` | `https://redlead.onrender.com` | Backend API URL |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Your test key | Your production key | Clerk public key |
| `CLERK_SECRET_KEY` | Your test key | Your production key | Clerk secret key |

---

## 🔄 Switching Between Environments

### Method 1: Using Template Files (Recommended)

**Switch to Development:**
```bash
cp .env.development .env
```

**Switch to Production:**
```bash
cp .env.production .env
# IMPORTANT: Edit .env and replace all credentials!
```

### Method 2: Environment-Specific .env Files

You can keep separate `.env.development.local` and `.env.production.local` files:

```bash
# Development
cp .env.development.local .env

# Production
cp .env.production.local .env
```

---

## 🏗️ Development Setup (Detailed)

### 1. Backend Setup
```bash
# Copy development template
cp .env.development .env

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

Server will be available at: `http://localhost:5000`

### 2. Frontend Setup
```bash
cd frontend

# Copy environment template
cp .env.example .env.local

# Edit .env.local and set:
# NEXT_PUBLIC_API_URL=http://localhost:5000

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will be available at: `http://localhost:3000`

### 3. Test the Setup

**Health Check:**
```bash
curl http://localhost:5000/health
```

**Readiness Check:**
```bash
curl http://localhost:5000/ready
```

---

## 🌐 Production Deployment

### Prerequisites:
1. **Rotate ALL credentials** (see `SECURITY_CREDENTIAL_ROTATION.md`)
2. Set up production database
3. Configure Clerk for production domain
4. Set up Reddit OAuth for production callback URL

### Backend (Render/Heroku/etc.)

1. Copy production template:
```bash
cp .env.production .env
```

2. Edit `.env` and replace all placeholders:
   - `NEW_PASSWORD` → Your rotated database password
   - `NEW_GEMINI_KEY_HERE` → Your rotated Gemini API key
   - `NEW_REDDIT_CLIENT_ID` → Your rotated Reddit credentials
   - `NEW_CLERK_SECRET_KEY` → Your rotated Clerk keys
   - etc.

3. Set environment variables in your hosting platform:
   - Render: Dashboard → Environment
   - Heroku: `heroku config:set VARIABLE=value`

4. Deploy:
```bash
git push production main
```

### Frontend (Vercel/Netlify/etc.)

1. Set environment variables in dashboard:
   - `NEXT_PUBLIC_API_URL=https://redlead.onrender.com`
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...`
   - `CLERK_SECRET_KEY=sk_live_...`

2. Deploy:
```bash
git push origin main
# Vercel will auto-deploy
```

---

## 🐛 Troubleshooting

### CORS Errors in Development
**Problem:** Frontend can't connect to backend

**Solution:**
```bash
# Check backend .env has:
CORS_ORIGINS=http://localhost:3000

# Check frontend .env.local has:
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Database Connection Errors
**Problem:** Backend can't connect to database

**Solution:**
```bash
# Test connection string:
npm run build
npx prisma studio  # Opens database browser

# Check .env has correct DATABASE_URL
```

### Reddit OAuth Not Working
**Problem:** Reddit OAuth callback fails

**Solution:**
1. Check `.env` has correct `REDDIT_REDIRECT_URI`
2. Verify Reddit app settings match: https://www.reddit.com/prefs/apps
3. Development: Must use `http://localhost:5000/api/reddit/callback`
4. Production: Must use `https://redlead.onrender.com/api/reddit/callback`

### Clerk Authentication Fails
**Problem:** Can't sign in

**Solution:**
1. Check Clerk dashboard for correct domain
2. Verify `CLERK_SECRET_KEY` matches environment
3. Frontend and backend must use same Clerk project

---

## ✅ Verification Checklist

### Development Environment
- [ ] Backend starts on `http://localhost:5000`
- [ ] Frontend starts on `http://localhost:3000`
- [ ] Can access `/health` endpoint
- [ ] Can access `/ready` endpoint
- [ ] Can sign in with Clerk
- [ ] Database connection works
- [ ] No CORS errors in browser console

### Production Environment
- [ ] All credentials rotated
- [ ] Backend deployed and accessible
- [ ] Frontend deployed and accessible
- [ ] Health checks pass
- [ ] SSL/HTTPS working
- [ ] Clerk authentication working
- [ ] Reddit OAuth working
- [ ] Database connection secure
- [ ] Logs being collected

---

## 📝 Best Practices

1. **Never commit `.env` files** - They're gitignored for security
2. **Always rotate credentials** before production
3. **Use `.env.development` for local work** - Keep it updated
4. **Document any new env variables** in this file
5. **Test locally before deploying** to catch issues early
6. **Keep `.env.example` updated** with all required variables

---

## 🆘 Need Help?

1. Check logs: `tail -f logs/combined.log`
2. Check error logs: `tail -f logs/error.log`
3. Review `SECURITY_CREDENTIAL_ROTATION.md` for credential issues
4. Verify all environment variables are set correctly

---

**Last Updated:** 2025-10-10
