# 🔐 URGENT: Credential Rotation Guide

## ⚠️ CRITICAL ACTION REQUIRED

Your application credentials were exposed in the git repository. You MUST rotate (change) ALL credentials immediately to prevent unauthorized access.

---

## 📋 Credentials to Rotate (COMPLETE THIS CHECKLIST)

### ✅ 1. Database (Neon PostgreSQL)
**Current Status**: Connection string exposed with password

**Action Required**:
1. Go to [Neon Console](https://console.neon.tech/)
2. Navigate to your project
3. Go to Settings → Reset Password
4. Generate a new password
5. Update your `DATABASE_URL` in `.env` with the new connection string
6. Restart your backend server
7. Test database connectivity

**Test Command**:
```bash
npm run dev
# Check for database connection errors in the logs
```

---

### ✅ 2. Gemini AI API Key
**Current Status**: API key exposed (`AIzaSyCuQ0h4ALKGfWqj2TlizC9_9HoPV5uzSr0`)

**Action Required**:
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Delete the exposed API key
3. Create a new API key
4. Update `GEMINI_API_KEY` in `.env`
5. Test AI functionality

**Test Command**:
```bash
# Test via the onboarding analyze endpoint
curl -X POST http://localhost:5000/api/onboarding/analyze \
  -H "Content-Type: application/json" \
  -d '{"websiteUrl": "https://example.com"}'
```

---

### ✅ 3. Reddit OAuth Credentials
**Current Status**: Client ID, Secret, and Refresh Token exposed

**Action Required**:
1. Go to [Reddit Apps](https://www.reddit.com/prefs/apps)
2. Find your app: `xymPrASSMJXuCeSzGzNkyA`
3. Click "edit" → "Delete app" to revoke the credentials
4. Create a new app:
   - Choose "web app"
   - Set redirect URI to your backend URL + `/api/reddit/callback`
   - Note the new `client_id` and `client_secret`
5. Generate a new refresh token:
   ```bash
   node generate-token.js
   # Follow the prompts
   ```
6. Update in `.env`:
   - `REDDIT_CLIENT_ID`
   - `REDDIT_CLIENT_SECRET`
   - `REDDIT_REFRESH_TOKEN`
   - `REDDIT_REDIRECT_URI` (update to match your new app)
7. Update `FRONTEND_URL` in `.env` if needed

---

### ✅ 4. Clerk Authentication
**Current Status**: Secret key and webhook secret exposed

**Action Required**:
1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Navigate to your project
3. Go to API Keys:
   - **Publishable Key**: This is safe to expose, but regenerate for consistency
   - **Secret Key**: Click "Regenerate" → Copy new key
4. Go to Webhooks:
   - Delete the existing webhook endpoint
   - Create a new webhook endpoint
   - Copy the new signing secret
5. Update both `.env` (backend) and `frontend/.env.local`:
   - Backend `.env`:
     - `CLERK_SECRET_KEY`
     - `CLERK_PUBLISHABLE_KEY`
     - `CLERK_WEBHOOK_SECRET`
   - Frontend `frontend/.env.local`:
     - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
     - `CLERK_SECRET_KEY`
6. Test authentication by signing in

**Important**: Update your webhook URL in Clerk dashboard to point to:
```
https://your-backend-url.com/api/clerk-webhooks
```

---

### ✅ 5. Resend Email API
**Current Status**: API key exposed (`re_WKaar6jp_AbkzXDUxTQNb7eeR3AjV8hWu`)

**Action Required**:
1. Go to [Resend API Keys](https://resend.com/api-keys)
2. Delete the exposed API key
3. Create a new API key
4. Update `RESEND_API_KEY` in `.env`
5. Update `EMAIL_FROM` if needed (verify domain ownership)
6. Test email sending

**Test Command**:
```bash
# Test by triggering an email notification feature in your app
```

---

### ✅ 6. ApyHub Token
**Current Status**: Token exposed (`APY0NB5xILjajKBZ763SZJF5wFpEnf4jE7xKkW2xSmKpQYVo5FPqAjBcrRhEkl8FH8xDV`)

**Action Required**:
1. Go to [ApyHub Dashboard](https://apyhub.com/dashboard)
2. Navigate to API Keys
3. Revoke the exposed token
4. Generate a new token
5. Update `APYHUB_TOKEN` in `.env`

---

## 🔄 After Rotating All Credentials

### 1. Update Environment Variables

**Backend `.env`**:
```bash
cp .env.example .env
# Then fill in ALL new credentials
```

**Frontend `frontend/.env.local`**:
```bash
cp frontend/.env.example frontend/.env.local
# Then fill in new Clerk credentials
```

### 2. Update Production Environment

If you've deployed to Render, Vercel, or another platform:

**Render (Backend)**:
1. Go to your service dashboard
2. Navigate to Environment
3. Update ALL environment variables with new credentials
4. Click "Save Changes"
5. Render will automatically redeploy

**Vercel (Frontend)**:
1. Go to your project settings
2. Navigate to Environment Variables
3. Update Clerk keys
4. Click "Save"
5. Redeploy your frontend

### 3. Verify Everything Works

**Test Checklist**:
- [ ] Backend starts without errors
- [ ] Database connection works
- [ ] User authentication (sign in/sign up) works
- [ ] Reddit OAuth connection works
- [ ] AI features (analyze website, generate replies) work
- [ ] Email notifications work (if enabled)
- [ ] Webhook integrations work

### 4. Test with these commands:

```bash
# Backend health check
curl http://localhost:5000/

# Test authentication (should require login)
curl http://localhost:5000/api/campaigns \
  -H "Authorization: Bearer YOUR_TEST_TOKEN"

# Check logs for any credential-related errors
npm run dev
# Watch for any authentication or API errors
```

---

## 🛡️ Prevention: Never Do This Again

1. **Never commit `.env` files** - They're now properly gitignored
2. **Always use `.env.example`** - Template files with placeholder values
3. **Use secrets management** - Consider using services like:
   - Doppler
   - AWS Secrets Manager
   - HashiCorp Vault
4. **Enable git hooks** - Prevent committing secrets:
   ```bash
   npm install --save-dev git-secrets
   ```
5. **Scan your repo regularly**:
   ```bash
   npm install -g trufflehog
   trufflehog filesystem . --json
   ```

---

## 🚨 If You Can't Rotate Immediately

If you cannot rotate credentials right now, at minimum:

1. **Monitor Access Logs**:
   - Check your database for unusual queries
   - Check Clerk dashboard for unexpected sign-ins
   - Monitor Reddit API usage
   - Check email send logs

2. **Set up Alerts**:
   - Enable email alerts for unusual activity
   - Monitor your credit card for unexpected charges

3. **Limit Damage**:
   - Temporarily disable any unused services
   - Reduce API rate limits where possible

---

## ⏰ Estimated Time

- **Total Time**: 1-2 hours
- **Priority Order**:
  1. Database (10 min) - Most critical
  2. Clerk Auth (15 min) - User access
  3. Reddit (20 min) - Core functionality
  4. Gemini AI (10 min) - AI features
  5. Resend (10 min) - Emails
  6. ApyHub (5 min) - Optional

---

## 📞 Need Help?

If you encounter issues:
1. Check the service's documentation
2. Verify all environment variables are set correctly
3. Restart both backend and frontend after changes
4. Check the console logs for specific error messages

**Remember**: Better safe than sorry. Rotate ALL credentials even if you think some might not have been accessed.
