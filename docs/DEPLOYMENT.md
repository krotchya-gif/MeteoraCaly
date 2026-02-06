# Deployment Guide

Complete guide for deploying Meteora DLMM Calculator to production.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
3. [Backend Deployment (Cloudflare Workers)](#backend-deployment-cloudflare-workers)
4. [Data Collection Setup](#data-collection-setup)
5. [Environment Variables](#environment-variables)
6. [Post-Deployment](#post-deployment)
7. [Monitoring](#monitoring)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Accounts
- [ ] GitHub account
- [ ] Vercel account (free tier OK)
- [ ] Cloudflare account (free tier OK)

### Required Tools
```bash
# Node.js 18+
node --version  # Should be 18.0.0 or higher

# npm or yarn
npm --version

# Git
git --version

# Vercel CLI (optional but recommended)
npm i -g vercel

# Wrangler CLI
npm i -g wrangler
```

---

## Frontend Deployment (Vercel)

### Step 1: Prepare Project

```bash
# Clone repository
git clone https://github.com/your-username/meteora-calculator.git
cd meteora-calculator/frontend

# Install dependencies
npm install

# Build locally to test
npm run build

# Test build
npm run preview
```

### Step 2: Configure Environment

Create `.env.production`:

```env
VITE_API_URL=https://meteora-calculator-api.YOUR_ACCOUNT.workers.dev
VITE_APP_NAME=Meteora Calculator
VITE_APP_VERSION=1.0.0
```

### Step 3: Deploy to Vercel

#### Option A: Via Vercel Dashboard (Recommended)

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Add environment variables from `.env.production`
6. Click "Deploy"

#### Option B: Via CLI

```bash
# Login to Vercel
vercel login

# Deploy
cd frontend
vercel

# Production deployment
vercel --prod
```

### Step 4: Configure Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your domain: `meteora-calculator.com`
3. Follow DNS configuration instructions
4. Wait for SSL certificate (automatic)

### Vercel Configuration

`vercel.json`:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

---

## Backend Deployment (Cloudflare Workers)

### Step 1: Setup Cloudflare Account

```bash
# Login to Cloudflare
wrangler login

# This will open browser for authentication
```

### Step 2: Create KV Namespace

```bash
# Create production KV namespace
wrangler kv:namespace create "POOLS_CACHE"

# Output will show:
# { binding = "POOLS_CACHE", id = "abc123..." }

# Create preview namespace (for testing)
wrangler kv:namespace create "POOLS_CACHE" --preview

# Save these IDs for wrangler.toml
```

### Step 3: Configure Wrangler

`wrangler.toml`:
```toml
name = "meteora-calculator-api"
main = "src/index.js"
compatibility_date = "2024-01-01"

# Production KV namespace
[[kv_namespaces]]
binding = "POOLS_CACHE"
id = "YOUR_PRODUCTION_KV_ID"

# Preview KV namespace (for wrangler dev)
[[kv_namespaces]]
binding = "POOLS_CACHE"
preview_id = "YOUR_PREVIEW_KV_ID"

[vars]
CACHE_TTL = "300"
RATE_LIMIT = "100"
METEORA_API_URL = "https://dlmm-api.meteora.ag"

[build]
command = "npm install"

[env.production]
name = "meteora-calculator-api"
workers_dev = false
route = "api.meteora-calculator.com/*"

[env.development]
name = "meteora-calculator-api-dev"
workers_dev = true
```

### Step 4: Deploy Backend

```bash
cd backend

# Install dependencies
npm install

# Test locally
wrangler dev

# Deploy to production
wrangler publish

# Or deploy to specific environment
wrangler publish --env production
```

### Step 5: Verify Deployment

```bash
# Test health endpoint
curl https://meteora-calculator-api.YOUR_ACCOUNT.workers.dev/api/health

# Expected response:
# {"status":"ok","version":"1.0.0",...}

# Test pools endpoint
curl https://meteora-calculator-api.YOUR_ACCOUNT.workers.dev/api/pools
```

### Step 6: Configure Custom Domain (Optional)

1. Go to Cloudflare Dashboard
2. Workers & Pages → Your Worker
3. Settings → Triggers → Custom Domains
4. Add: `api.meteora-calculator.com`
5. DNS will be configured automatically

---

## Data Collection Setup

### Option 1: Manual Updates

```bash
# Run collection script
cd scripts
node collect-pools.js

# Output will be in:
# - pools.json (all pools)
# - pools-top10.json (top 10)
# - pools-summary.json (statistics)
```

### Option 2: GitHub Actions (Automated)

Create `.github/workflows/update-pools.yml`:

```yaml
name: Update Pool Data

on:
  schedule:
    # Run every 6 hours
    - cron: '0 */6 * * *'
  workflow_dispatch:

jobs:
  update-pools:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
        working-directory: ./scripts
      
      - name: Collect pool data
        run: node collect-pools.js
        working-directory: ./scripts
      
      - name: Commit and push
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add data/
          git commit -m "Update pool data $(date)" || exit 0
          git push
```

### Option 3: Cloudflare Cron Trigger

`wrangler.toml`:
```toml
[triggers]
crons = ["0 */6 * * *"]  # Every 6 hours
```

Add to `src/index.js`:
```javascript
export default {
  async scheduled(event, env, ctx) {
    // Update pools in KV
    const pools = await fetchPoolsFromMeteora();
    await env.POOLS_CACHE.put('pools:all', JSON.stringify(pools), {
      expirationTtl: 21600 // 6 hours
    });
  }
}
```

---

## Environment Variables

### Frontend (.env.production)

```env
# API Configuration
VITE_API_URL=https://meteora-calculator-api.YOUR_ACCOUNT.workers.dev

# App Configuration
VITE_APP_NAME=Meteora Calculator
VITE_APP_VERSION=1.0.0
VITE_APP_ENV=production

# Analytics (optional)
VITE_GA_ID=G-XXXXXXXXXX
VITE_SENTRY_DSN=https://...

# Feature Flags (optional)
VITE_ENABLE_CHARTS=true
VITE_ENABLE_COMPARISON=true
VITE_ENABLE_HISTORY=true
```

### Backend (wrangler.toml [vars])

```toml
[vars]
CACHE_TTL = "300"
RATE_LIMIT = "100"
METEORA_API_URL = "https://dlmm-api.meteora.ag"
JUPITER_API_URL = "https://price.jup.ag/v4"
CORS_ORIGINS = "https://meteora-calculator.com"
```

### Secrets (Cloudflare)

For sensitive data (if needed):

```bash
# Set secret
wrangler secret put API_KEY

# List secrets
wrangler secret list

# Delete secret
wrangler secret delete API_KEY
```

---

## Post-Deployment

### 1. Smoke Tests

```bash
# Frontend
curl https://meteora-calculator.com
# Should return HTML

# Backend Health
curl https://api.meteora-calculator.com/api/health
# Should return {"status":"ok"}

# Backend Pools
curl https://api.meteora-calculator.com/api/pools
# Should return pool data

# CORS Test
curl -H "Origin: https://meteora-calculator.com" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     https://api.meteora-calculator.com/api/pools
# Should include CORS headers
```

### 2. Performance Tests

```bash
# Lighthouse audit
npx lighthouse https://meteora-calculator.com --view

# Should have:
# - Performance: 90+
# - Accessibility: 90+
# - Best Practices: 90+
# - SEO: 90+
```

### 3. Functionality Tests

- [ ] Calculator loads with pool data
- [ ] Calculations are accurate
- [ ] Comparison view works
- [ ] Charts render properly
- [ ] Export to CSV works
- [ ] Mobile responsive
- [ ] Error handling works

### 4. Update DNS (If Custom Domain)

```
# A Records
@ → 76.76.21.21 (Vercel)
www → 76.76.21.21 (Vercel)

# CNAME Records
api → meteora-calculator-api.workers.dev (Cloudflare)
```

---

## Monitoring

### Vercel Analytics

1. Go to Project → Analytics
2. Enable Web Vitals tracking
3. Monitor:
   - Page views
   - Core Web Vitals
   - Visitor stats

### Cloudflare Analytics

1. Go to Workers & Pages → Your Worker
2. Metrics tab
3. Monitor:
   - Requests per second
   - CPU time
   - Errors
   - Cache hit ratio

### Error Tracking (Optional)

#### Sentry Setup

```bash
# Frontend
npm install @sentry/react @sentry/vite-plugin

# Initialize
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: "production",
  tracesSampleRate: 0.1,
});
```

#### Cloudflare Logpush (Optional)

For advanced logging:
1. Go to Analytics → Logs → Logpush
2. Configure destination (e.g., S3)
3. Enable for your worker

---

## Troubleshooting

### Frontend Issues

#### Build Fails
```bash
# Clear cache
rm -rf node_modules dist
npm install
npm run build
```

#### Environment Variables Not Working
- Check `.env.production` exists
- Variables must start with `VITE_`
- Restart dev server after changes

#### 404 on Routes
- Add rewrite rules in `vercel.json`
- Configure SPA fallback

### Backend Issues

#### KV Namespace Not Found
```bash
# Verify namespace exists
wrangler kv:namespace list

# Check wrangler.toml has correct ID
```

#### CORS Errors
- Check CORS headers in response
- Verify origin is allowed
- Options requests must return 200

#### Rate Limiting Too Aggressive
- Adjust `RATE_LIMIT` in wrangler.toml
- Clear KV cache:
```bash
wrangler kv:key delete --namespace-id=YOUR_ID "ratelimit:IP"
```

### Performance Issues

#### Slow API Responses
- Check Meteora API status
- Verify KV cache is working
- Check cache TTL settings

#### Large Bundle Size
```bash
# Analyze bundle
npm run build -- --mode analyze

# Remove unused dependencies
npm prune

# Use code splitting
import('./HeavyComponent.jsx')
```

---

## Rollback Procedure

### Frontend (Vercel)

1. Go to Deployments
2. Find previous working deployment
3. Click "..." → Promote to Production

### Backend (Cloudflare)

```bash
# List previous versions
wrangler deployments list

# Rollback to specific version
wrangler rollback [deployment-id]
```

---

## Scaling Considerations

### Cloudflare Workers

- Free tier: 100,000 requests/day
- Paid tier: $5/month for 10M requests
- Scales automatically, no configuration needed

### Vercel

- Free tier: 100GB bandwidth/month
- Pro tier: $20/month, 1TB bandwidth
- Auto-scales globally

### When to Upgrade

- Frontend: >100GB traffic/month
- Backend: >100k requests/day
- Need: Custom domains, team features, analytics

---

## Security Checklist

- [ ] HTTPS enabled (automatic on Vercel/Cloudflare)
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] No API keys in frontend code
- [ ] No sensitive data in localStorage
- [ ] CSP headers configured (optional)
- [ ] Regular dependency updates

---

## Maintenance

### Weekly
- [ ] Check error logs
- [ ] Monitor performance metrics
- [ ] Review user feedback

### Monthly
- [ ] Update dependencies
- [ ] Review and optimize bundle size
- [ ] Check for security vulnerabilities

### Quarterly
- [ ] Performance audit
- [ ] Security audit
- [ ] User experience review

---

## Support

If you encounter issues:

1. Check [Troubleshooting](#troubleshooting)
2. Search [GitHub Issues](https://github.com/your-username/meteora-calculator/issues)
3. Join [Discord Community](#)
4. Contact support@meteora-calculator.com

---

*Last updated: February 6, 2026*
