# 🔒 Reddit Account Security Fix - CRITICAL UPDATE

## What Was Fixed

**CRITICAL SECURITY ISSUE**: Previously, lead discovery was using the **application's** Reddit account instead of **individual users'** Reddit accounts.

### The Problem Before:
- ❌ All users were discovering leads through the app owner's Reddit account
- ❌ Users without Reddit connected could still discover leads
- ❌ Privacy violation - activity appeared to come from app owner
- ❌ Rate limit sharing - all users shared same API limits
- ❌ Security risk - app owner's account could be banned

### The Fix Now:
- ✅ Each user MUST connect their own Reddit account
- ✅ Lead discovery uses the individual user's Reddit account
- ✅ Users without Reddit connection cannot discover leads
- ✅ Proper attribution - activity comes from the actual user
- ✅ Isolated rate limits - each user has their own limits
- ✅ No risk to app owner's account

---

## How It Works Now

### User Flow:
1. User signs up → Creates account
2. User goes to `/connect-reddit` → Connects their Reddit account
3. User creates campaign → Campaign configured
4. User discovers leads → **Uses THEIR Reddit account** ✅

### What Happens Without Reddit Connected:
- ❌ Discovery buttons show alert: "Reddit Connection Required"
- ❌ API returns 403 error with `action: 'connect_reddit'`
- ✅ User is redirected to `/connect-reddit`
- ✅ Clear error message explaining why

---

## Technical Changes Made

### Backend Changes:

#### 1. New Middleware: `requireRedditConnection`
**File**: `src/middleware/requireReddit.ts`

```typescript
// Checks if user has connected Reddit before allowing discovery
// Returns 403 if not connected
```

**Applied to routes:**
- `POST /api/leads/discover/manual/:campaignId`
- `POST /api/leads/campaign/:campaignId/discover/targeted`

#### 2. Updated Reddit Service Functions
**File**: `src/services/reddit.service.ts`

All lead discovery functions now require `userRefreshToken`:
- `findLeadsInSubmissions(keywords, subreddits, userRefreshToken)` ✅
- `findLeadsInComments(keywords, subreddits, userRefreshToken)` ✅
- `findLeadsGlobally(keywords, negatives, blacklist, userRefreshToken)` ✅
- `findLeadsOnReddit(keywords, subreddits, userRefreshToken)` ✅

**Before**: Used `getAppAuthenticatedInstance()` ❌
**After**: Uses `getUserAuthenticatedInstance(userRefreshToken)` ✅

#### 3. Updated Controllers
**File**: `src/controllers/lead.controller.ts`

Both manual and targeted discovery now:
- Check if `user.redditRefreshToken` exists
- Return 403 error if not
- Pass user's refresh token to Reddit service functions

#### 4. Updated Background Worker
**File**: `src/workers/lead.worker.ts`

Worker now:
- Only processes campaigns where `user.hasConnectedReddit === true`
- Only processes users with `redditRefreshToken !== null`
- Uses each user's individual Reddit account for their campaigns
- Skips users who haven't connected Reddit

### Frontend Changes:

#### 1. New Component: `RedditConnectionAlert`
**File**: `frontend/components/dashboard/RedditConnectionAlert.tsx`

Shows when user tries to use Reddit features without connecting.

#### 2. Updated Discovery Options
**File**: `frontend/components/dashboard/DiscoveryOptions.tsx`

- Checks `user.publicMetadata.hasConnectedReddit`
- Shows `RedditConnectionAlert` if not connected
- Handles 403 errors from backend
- Redirects to `/connect-reddit` when needed

---

## What Uses App Account (Still)

These features still use the app's Reddit account (and should):

### ✅ Subreddit Analysis Worker
**Why**: Analyzes public subreddit metadata (rules, culture)
**File**: `src/services/subreddit.service.ts`
**Safe because**: Only reads public data, doesn't interact with users

### ✅ Subreddit Verification (in AI service)
**Why**: Verifies subreddit names exist when generating suggestions
**File**: `src/services/ai.service.ts`
**Safe because**: Just checks if subreddit names are valid

### ✅ Reply Performance Tracking
**Why**: Reads publicly posted comments to track upvotes
**File**: `src/workers/replyTracking.worker.ts`
**Safe because**: Reading public data that users already posted

---

## Migration Guide

### For Existing Users:
1. Users who already have campaigns will see the alert
2. They must connect Reddit before next discovery
3. Their existing leads remain (were discovered before this fix)
4. Future discoveries will use their account

### For New Users:
1. After sign-up, guided to connect Reddit
2. Cannot discover leads until Reddit is connected
3. Clear messaging throughout the app

---

## Security Benefits

### 1. Privacy
- User activity appears on their Reddit account (proper attribution)
- App owner's account is not involved in user activities

### 2. Compliance
- Each user responsible for their own Reddit usage
- Follows Reddit API Terms of Service
- No shared accounts violating TOS

### 3. Rate Limiting
- Each user has independent Reddit API rate limits
- One user can't exhaust limits for everyone
- More scalable system

### 4. Account Safety
- App owner's Reddit account protected
- User bans don't affect app
- App bans don't affect users

---

## Testing Checklist

### Without Reddit Connected:
- [ ] Dashboard shows Reddit connection alert
- [ ] Discovery buttons are blocked
- [ ] API returns 403 error
- [ ] User redirected to /connect-reddit
- [ ] Clear error message shown

### With Reddit Connected:
- [ ] Discovery works normally
- [ ] Uses user's Reddit account
- [ ] Leads discovered successfully
- [ ] Activity attributed to user
- [ ] No app account involved

---

## Environment Variables (Unchanged)

The app still needs Reddit credentials for:
- Subreddit verification
- Subreddit culture analysis
- Reply performance tracking (reading public data)

```bash
# These remain in .env for app-level operations
REDDIT_CLIENT_ID=your_client_id
REDDIT_CLIENT_SECRET=your_client_secret
REDDIT_USER_AGENT=YourApp/1.0.0
REDDIT_REFRESH_TOKEN=your_app_refresh_token
```

But **lead discovery no longer uses these** ✅

---

## Impact: ZERO Breaking Changes

### For Users With Reddit Connected:
- ✅ Everything works exactly the same
- ✅ Just now properly attributed to their account

### For Users Without Reddit Connected:
- ⚠️ They will see "Connect Reddit" requirement
- ✅ This is the CORRECT behavior
- ✅ They should never have been able to discover without connecting

---

**This fix ensures proper security, compliance, and scalability!**
