# Frontend API Integration - Setup Guide

## 🎯 What Changed

### Before (Phase 1):
```javascript
// Hardcoded data
const POOLS_DATA = [
  { id: 'bfs-sol', pair: 'BFS/SOL', ... },
  { id: 'bfs-usdc', pair: 'BFS/USDC', ... }
];
```

### After (Phase 2):
```javascript
// API integration
const { pools, loading, error } = usePoolsData();
// Fetches 50+ pools from backend API
```

---

## 📦 New Files Structure

```
frontend/
├── src/
│   ├── App.jsx                    # ✅ UPDATED - Now uses API
│   ├── main.jsx
│   └── index.css
├── .env                           # ✅ NEW - Environment config
├── .env.example                   # ✅ NEW - Template
├── package.json
└── vite.config.js
```

---

## 🔧 Setup Steps

### 1. Create Environment File

Create `frontend/.env`:

```bash
# Backend API URL
VITE_API_URL=https://meteora-calculator-api.your-account.workers.dev

# Optional: Enable debug logging
VITE_DEBUG=false
```

**IMPORTANT:** Replace `your-account` with your actual Cloudflare Workers URL!

---

### 2. Create Template File

Create `frontend/.env.example`:

```bash
# Backend API URL (required)
VITE_API_URL=https://your-backend-url.workers.dev

# Debug mode (optional)
VITE_DEBUG=false
```

---

### 3. Update .gitignore

Add to `frontend/.gitignore`:

```
# Environment
.env
.env.local
.env.production

# Build
dist/
build/

# Dependencies
node_modules/

# Logs
*.log
```

---

### 4. Update vite.config.js

Create or update `frontend/vite.config.js`:

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  define: {
    // Make env vars available
    'import.meta.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL)
  }
});
```

---

## 🚀 Running the App

### Development Mode

```bash
cd frontend

# Install dependencies (if not already)
npm install

# Start dev server
npm run dev

# Output:
# VITE v5.0.0  ready in 500 ms
# ➜  Local:   http://localhost:5173/
# ➜  Network: http://192.168.1.x:5173/
```

Open browser: http://localhost:5173

---

### Production Build

```bash
# Build for production
npm run build

# Output in dist/ folder
ls -lh dist/

# Preview production build
npm run preview
```

---

## 🧪 Testing the Integration

### 1. Check API Connection

Open browser console (F12) and check:

```javascript
// Should see API requests
Network tab → Filter: XHR/Fetch
→ Look for: /api/pools

// Should see successful responses
Status: 200 OK
Response: { success: true, data: { pools: [...] } }
```

---

### 2. Test Features

**Feature Checklist:**
- [ ] Pools load automatically on app start
- [ ] Loading spinner shows during fetch
- [ ] Pools display correctly (50+ pools)
- [ ] Search works (filter by name)
- [ ] Filter works (DLMM/DAMM/ALL)
- [ ] Refresh button works (clears cache + refetches)
- [ ] Click pool → calculator opens
- [ ] Calculator shows correct data
- [ ] Error handling works (disconnect internet, test)

---

### 3. Test Caching

```bash
# Open browser console
# Run:
localStorage.getItem('pools_all')

# Should see cached data:
# {"data":{"pools":[...],"last_updated":"..."},"timestamp":...}

# Test cache expiry:
# 1. Load app (data fetched)
# 2. Refresh page within 5 min (cache used)
# 3. Wait 5+ min, refresh (new fetch)
```

---

### 4. Test Offline Behavior

```bash
# 1. Load app (data cached)
# 2. Disconnect internet
# 3. Refresh page
# Expected: App still works (uses cache)
# 4. Wait 5+ min, refresh
# Expected: Error message shows
```

---

## 🐛 Troubleshooting

### Issue: "Failed to fetch pools"

**Check:**
1. **Backend URL correct?**
   ```bash
   echo $VITE_API_URL
   # Should show your Workers URL
   ```

2. **Backend deployed?**
   ```bash
   curl https://your-backend-url/api/health
   # Should return: {"success":true,"status":"healthy"}
   ```

3. **CORS issue?**
   ```bash
   # Check browser console for:
   # "Access to fetch at '...' has been blocked by CORS"
   
   # Fix: Backend already has CORS enabled
   # If still issue, verify backend CORS headers
   ```

---

### Issue: "Pools not showing"

**Debug steps:**

1. **Check console logs:**
   ```javascript
   // Open console (F12)
   // Look for errors
   ```

2. **Check API response:**
   ```bash
   curl https://your-backend-url/api/pools | jq '.data.pools | length'
   # Should return number > 0
   ```

3. **Check state:**
   ```javascript
   // In browser console:
   // React DevTools → Components → MeteoraCalculator
   // Check pools state
   ```

---

### Issue: "Stuck on loading"

**Possible causes:**

1. **Backend not responding:**
   ```bash
   curl -v https://your-backend-url/api/pools
   # Check response time
   ```

2. **Timeout:**
   ```javascript
   // Edit src/App.jsx
   // In APIClient.request(), increase timeout:
   const response = await fetch(url, {
     ...options,
     signal: AbortSignal.timeout(30000) // 30 seconds
   });
   ```

---

### Issue: "Cache not working"

**Check:**
```javascript
// Browser console:
localStorage.getItem('pools_all')

// If null, cache write might be failing
// Check: localStorage available?
try {
  localStorage.setItem('test', 'test');
  localStorage.removeItem('test');
  console.log('localStorage works');
} catch (e) {
  console.error('localStorage blocked:', e);
}
```

---

## 🔧 Configuration Options

### Change API URL

**Method 1: Environment variable (recommended)**
```bash
# frontend/.env
VITE_API_URL=https://new-backend-url.com
```

**Method 2: Edit code**
```javascript
// src/App.jsx, line ~10
const API_CONFIG = {
  BASE_URL: 'https://new-backend-url.com',
  // ...
};
```

---

### Change Cache Duration

```javascript
// src/App.jsx, line ~10
const API_CONFIG = {
  CACHE_DURATION: 10 * 60 * 1000, // 10 minutes (default: 5)
  // ...
};
```

---

### Change Retry Behavior

```javascript
// src/App.jsx, line ~10
const API_CONFIG = {
  RETRY_ATTEMPTS: 5,  // More retries (default: 3)
  RETRY_DELAY: 2000,  // Longer delay (default: 1000ms)
  // ...
};
```

---

### Enable Debug Logging

```bash
# frontend/.env
VITE_DEBUG=true
```

Then in code:
```javascript
if (import.meta.env.VITE_DEBUG === 'true') {
  console.log('Debug:', pools);
}
```

---

## 📊 Performance Monitoring

### Measure Load Time

```javascript
// Browser console:
performance.measure('app-load', 'navigationStart');
console.log(performance.getEntriesByName('app-load'));

// Or use React DevTools Profiler
```

---

### Check Network Performance

```bash
# Browser DevTools → Network tab
# Look for:
# - /api/pools: Should be < 500ms
# - Cache hits: Should show "(from cache)"
# - Failed requests: Should retry automatically
```

---

## 🚀 Deployment to Vercel

### 1. Install Vercel CLI

```bash
npm i -g vercel
```

---

### 2. Deploy

```bash
cd frontend

# First deployment (interactive)
vercel

# Follow prompts:
# - Set up new project? Yes
# - Link to existing project? No
# - Project name: meteora-calculator
# - Directory: ./

# Production deployment
vercel --prod
```

---

### 3. Set Environment Variables

```bash
# Via CLI
vercel env add VITE_API_URL production
# Enter: https://your-backend-url.workers.dev

# Or via Dashboard:
# vercel.com → Your Project → Settings → Environment Variables
# Add: VITE_API_URL = https://your-backend-url.workers.dev
```

---

### 4. Redeploy with Env Vars

```bash
vercel --prod
```

**Your app is now live!** 🎉

Example: `https://meteora-calculator.vercel.app`

---

## 📱 Telegram Mini App Setup

### Update Bot with New URL

```bash
# Talk to @BotFather
/setmenubutton
# Select your bot
# Button text: 🧮 Calculator
# Web App URL: https://meteora-calculator.vercel.app
```

Or via bot code:
```javascript
// In your bot's index.js
const MINI_APP_URL = 'https://meteora-calculator.vercel.app';
```

---

## ✅ Integration Checklist

Before considering integration complete:

- [ ] `.env` file created with correct API URL
- [ ] App runs locally (`npm run dev`)
- [ ] Pools load from API (50+ pools)
- [ ] Search works
- [ ] Filter works
- [ ] Refresh works
- [ ] Calculator works with API data
- [ ] Caching works (check localStorage)
- [ ] Error handling works
- [ ] Production build works (`npm run build`)
- [ ] Deployed to Vercel
- [ ] Environment variables set on Vercel
- [ ] Production app works
- [ ] Telegram Mini App updated

---

## 🎯 What's Different from Phase 1

| Feature | Phase 1 (Prototype) | Phase 2 (API Integration) |
|---------|-------------------|------------------------|
| Data source | Hardcoded (2 pools) | API (50+ pools) |
| Pool count | 2 static | 50+ dynamic |
| Data freshness | Never updates | Updates every 5min |
| Loading state | None | Loading spinner |
| Error handling | None | Error messages + retry |
| Caching | None | LocalStorage (5min TTL) |
| Refresh | None | Manual refresh button |
| Search | Basic filter | API-powered search |
| Scalability | Limited | Supports 100+ pools |

---

## 📈 Next Steps

After integration is working:

1. **Test thoroughly**
   - All features work
   - No console errors
   - Performance is good

2. **Gather feedback**
   - Share with test users
   - Note any issues

3. **Proceed to TASK 5**
   - Add comparison view
   - Add charts
   - Polish UI

---

## 🆘 Need Help?

**Common issues:**

1. **Pools not loading** → Check API URL in `.env`
2. **CORS error** → Verify backend CORS headers
3. **Cache issues** → Clear localStorage
4. **Slow loading** → Check backend response time
5. **Build errors** → Check all imports

**Debug mode:**
```javascript
// Add to App.jsx for debugging
console.log('API URL:', API_CONFIG.BASE_URL);
console.log('Pools loaded:', pools.length);
console.log('Error:', error);
```

---

**Status:** ✅ Frontend Integration Complete!

**Next:** Test everything, then proceed to TASK 5
