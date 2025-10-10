# 🔧 Fix Reddit OAuth - Invalid Redirect URI

## The Problem

You're getting: **"invalid redirect_uri parameter"**

This means the redirect URI in your code doesn't match what's registered in your Reddit app settings.

---

## ✅ Quick Fix (5 minutes)

### Step 1: Find Your Reddit App

1. Go to: https://www.reddit.com/prefs/apps
2. Find your app (Client ID: `xymPrASSMJXuCeSzGzNkyA`)
3. Look at the "redirect uri" field

### Step 2: Check What's Registered

You'll see ONE of these:
- `http://localhost:5000/api/reddit/callback` (for development)
- `https://redlead.onrender.com/api/reddit/callback` (for production)
- Something else

### Step 3A: If It Shows Production URL

**Option 1 - Add Development URL (Recommended):**

Reddit apps can only have ONE redirect URI. To test locally, you need to **temporarily change it**:

1. Click "edit" on your Reddit app
2. Change redirect uri to: `http://localhost:5000/api/reddit/callback`
3. Click "update app"
4. Your `.env` already has this ✅
5. Restart backend: `npm run dev`
6. Try connecting Reddit again

**Option 2 - Use Production for Testing:**

If you don't want to change Reddit settings:
1. Keep testing on production (not localhost)
2. You'll need to deploy your changes first

---

### Step 3B: If It Shows a Different URL

Update your `.env` file:

```bash
# Change this line in .env to match what's in Reddit app:
REDDIT_REDIRECT_URI="http://localhost:5000/api/reddit/callback"
```

Then restart backend.

---

## 🔄 For Development Testing

**Your `.env` file should have:**
```bash
REDDIT_REDIRECT_URI="http://localhost:5000/api/reddit/callback"
```

**Your Reddit app settings should have:**
```
redirect uri: http://localhost:5000/api/reddit/callback
```

They MUST match exactly!

---

## 🚀 For Production

When deploying to production:

1. **Change Reddit app redirect URI to:**
   ```
   https://redlead.onrender.com/api/reddit/callback
   ```

2. **Update production .env to:**
   ```bash
   REDDIT_REDIRECT_URI="https://redlead.onrender.com/api/reddit/callback"
   ```

3. Redeploy

---

## 🐛 Common Issues

### Issue 1: "Invalid redirect_uri"
**Cause:** Mismatch between .env and Reddit app settings
**Fix:** Make them match exactly (including http/https)

### Issue 2: Works in production but not localhost
**Cause:** Reddit app has production URL
**Fix:** Change Reddit app to localhost URL for development

### Issue 3: localhost:3000 instead of localhost:5000
**Cause:** Using frontend URL instead of backend URL
**Fix:** Reddit callback goes to BACKEND (port 5000), not frontend (port 3000)

---

## ✅ Quick Checklist

- [ ] Go to https://www.reddit.com/prefs/apps
- [ ] Find your app (ID: xymPrASSMJXuCeSzGzNkyA)
- [ ] Check what redirect URI is registered
- [ ] Change it to: `http://localhost:5000/api/reddit/callback`
- [ ] Verify `.env` has: `REDDIT_REDIRECT_URI="http://localhost:5000/api/reddit/callback"`
- [ ] Restart backend
- [ ] Try connecting Reddit again

---

## 🎯 Exact Steps to Fix Right Now:

```bash
# 1. Update Reddit app settings (do this in browser)
# Go to: https://www.reddit.com/prefs/apps
# Click "edit" on your app
# Set redirect uri to: http://localhost:5000/api/reddit/callback
# Click "update app"

# 2. Verify your .env is correct
cat .env | grep REDDIT_REDIRECT_URI
# Should show: REDDIT_REDIRECT_URI="http://localhost:5000/api/reddit/callback"

# 3. Restart backend
npm run dev

# 4. Test Reddit connection in browser
# Go to: http://localhost:3000/dashboard/settings
# Click "Connect Reddit"
# Should work now!
```

---

This is a common OAuth issue - the redirect URI must be registered in the Reddit app settings BEFORE you can use it.
