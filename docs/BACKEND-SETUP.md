# Meteora Calculator Backend - Setup Guide

## 📦 Project Structure

```
meteora-calculator/
├── backend/
│   ├── src/
│   │   └── index.js              # Main worker code
│   ├── wrangler.toml              # Cloudflare config
│   ├── package.json
│   └── .dev.vars                  # Local dev secrets
├── scripts/
│   └── collect-pools.js           # Data collection
└── data/
    └── pools.json                 # Generated data
```

---

## 🚀 Quick Setup

### 1. Install Cloudflare Wrangler

```bash
# Install globally
npm install -g wrangler

# Or use npx
npx wrangler --version
```

---

### 2. Login to Cloudflare

```bash
wrangler login
```

This opens browser for authentication.

---

### 3. Create Backend Project

```bash
# Create backend directory
mkdir backend
cd backend

# Initialize project
npm init -y

# Install dependencies (none needed for Workers!)
# Cloudflare Workers run without node_modules
```

---

### 4. Create Configuration Files

#### **File: backend/wrangler.toml**

```toml
name = "meteora-calculator-api"
main = "src/index.js"
compatibility_date = "2024-01-01"
workers_dev = true

# KV Namespace for caching
[[kv_namespaces]]
binding = "POOL_CACHE"
id = "your_kv_namespace_id"  # Will be created

# Environment: Production
[env.production]
name = "meteora-calculator-api-prod"
route = "api.your-domain.com/*"  # Optional custom domain

[[env.production.kv_namespaces]]
binding = "POOL_CACHE"
id = "your_kv_namespace_id"

# Environment: Staging
[env.staging]
name = "meteora-calculator-api-staging"

[[env.staging.kv_namespaces]]
binding = "POOL_CACHE"
id = "your_kv_namespace_id"
```

---

#### **File: backend/package.json**

```json
{
  "name": "meteora-calculator-api",
  "version": "1.0.0",
  "description": "Meteora DLMM/DAMM Calculator API",
  "main": "src/index.js",
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "deploy:staging": "wrangler deploy --env staging",
    "deploy:production": "wrangler deploy --env production",
    "tail": "wrangler tail",
    "test": "wrangler dev --test"
  },
  "keywords": ["meteora", "dlmm", "solana", "defi"],
  "author": "Your Name",
  "license": "MIT"
}
```

---

#### **File: backend/.dev.vars** (Local development)

```bash
# Local development environment variables
# DO NOT COMMIT THIS FILE

# Currently no secrets needed
# Add here if needed later:
# API_KEY=your_api_key
```

---

#### **File: backend/.gitignore**

```
.wrangler/
.dev.vars
node_modules/
dist/
*.log
```

---

### 5. Create KV Namespace

```bash
# Create KV namespace for caching
wrangler kv:namespace create "POOL_CACHE"

# Output will show:
# [[kv_namespaces]]
# binding = "POOL_CACHE"
# id = "abc123def456..."

# Copy the ID to wrangler.toml
```

---

### 6. Save Worker Code

Copy the worker code from Artifact 1 to:
```
backend/src/index.js
```

---

## 🧪 Local Development

### Start Dev Server

```bash
cd backend
npm run dev

# Or
wrangler dev
```

**Output:**
```
⛅️ wrangler 3.0.0
------------------
⎔ Starting local server...
[b] open a browser, [d] open Devtools, [l] turn off local mode, [c] clear console, [x] to exit
╭──────────────────────────────────────────────────────────────────╮
│  [b] Local:    http://localhost:8787                             │
│  [b] Remote:   https://meteora-calculator-api.your-account.work  │
╰──────────────────────────────────────────────────────────────────╯
```

---

### Test Endpoints

```bash
# Health check
curl http://localhost:8787/api/health

# Get all pools
curl http://localhost:8787/api/pools

# Get top 10
curl http://localhost:8787/api/pools/top/10

# Search pools
curl "http://localhost:8787/api/pools/search?q=SOL"

# Get single pool (replace with actual ID)
curl http://localhost:8787/api/pool/ARwi1S4DaiTG5DX7S4M4ZsrXqpMD1MrTmbu9ue2tpmEq
```

---

## 🚀 Deployment

### Deploy to Production

```bash
# First deployment
wrangler deploy

# Or with environment
npm run deploy:production
```

**Output:**
```
✨  Built successfully!
⛅️  wrangler 3.0.0
------------------
Uploading...
Uploaded meteora-calculator-api (2.5 sec)
Published meteora-calculator-api (0.3 sec)
  https://meteora-calculator-api.your-account.workers.dev
```

**Your API is now live!** 🎉

---

### Custom Domain (Optional)

#### Method 1: Via Cloudflare Dashboard

1. Go to Workers & Pages
2. Select your worker
3. Click "Triggers" tab
4. Add "Custom Domain"
5. Enter: `api.your-domain.com`
6. Cloudflare auto-creates DNS record

#### Method 2: Via wrangler.toml

Update `wrangler.toml`:
```toml
[env.production]
route = "api.your-domain.com/*"
```

Then deploy:
```bash
wrangler deploy --env production
```

---

## 📊 Testing Deployed API

### Test Production Endpoints

```bash
# Replace with your actual URL
API_URL="https://meteora-calculator-api.your-account.workers.dev"

# Health check
curl $API_URL/api/health

# Get pools
curl $API_URL/api/pools | jq '.data.pools | length'

# Top 5 pools
curl $API_URL/api/pools/top/5 | jq '.data.pools[] | {pair, tvl, volume_24h}'

# Search
curl "$API_URL/api/pools/search?q=BFS" | jq '.data.total'
```

---

## 🔧 Configuration Options

### Cache TTL

Edit in `src/index.js`:
```javascript
const CONFIG = {
  CACHE_TTL: 300, // 5 minutes (change to 600 for 10min)
  // ...
};
```

---

### Rate Limiting

Edit in `src/index.js`:
```javascript
const CONFIG = {
  RATE_LIMIT: 100, // requests per minute (change as needed)
  // ...
};
```

---

### Pool Filtering

Edit `handleGetPools` function:
```javascript
// Current: TVL > $1000
const activePools = pools.filter(p => p.tvl > 1000);

// Change to: TVL > $10,000
const activePools = pools.filter(p => p.tvl > 10000);

// Or add volume filter
const activePools = pools.filter(p => 
  p.tvl > 1000 && p.volume_24h > 50000
);
```

---

## 📈 Monitoring

### View Logs

```bash
# Real-time logs
wrangler tail

# Filter by status
wrangler tail --status error

# Filter by method
wrangler tail --method POST
```

---

### Check Analytics

```bash
# View metrics
wrangler metrics

# Or visit Cloudflare Dashboard:
# Workers & Pages → Your Worker → Analytics
```

**Metrics available:**
- Requests per second
- Error rate
- CPU time
- KV operations

---

## 🐛 Debugging

### Enable Debug Mode

Edit `src/index.js`, add logging:
```javascript
async function handleRequest(request, env) {
  console.log('Request:', request.method, request.url);
  
  try {
    // ... existing code
  } catch (error) {
    console.error('Error details:', error);
    // ...
  }
}
```

View logs:
```bash
wrangler tail
```

---

### Test with curl -v

```bash
# Verbose output
curl -v http://localhost:8787/api/pools

# Check headers
curl -I http://localhost:8787/api/health

# Measure response time
curl -w "\nTime: %{time_total}s\n" http://localhost:8787/api/pools
```

---

## 💾 KV Storage Management

### View KV Data

```bash
# List all keys
wrangler kv:key list --namespace-id=your_kv_id

# Get a key
wrangler kv:key get "all_pools" --namespace-id=your_kv_id

# Delete a key
wrangler kv:key delete "all_pools" --namespace-id=your_kv_id
```

---

### Clear Cache

```bash
# Delete all keys (WARNING: deletes all cache)
wrangler kv:key list --namespace-id=your_kv_id | \
  jq -r '.[].name' | \
  xargs -I {} wrangler kv:key delete {} --namespace-id=your_kv_id

# Or via API (trigger cache refresh)
curl http://localhost:8787/api/pools
# Wait 5+ minutes for cache to expire naturally
```

---

## 🔐 Security Best Practices

### 1. Rate Limiting (Already Implemented)
- 100 requests/minute per IP
- Adjust in CONFIG if needed

### 2. CORS (Already Configured)
- Allows all origins (*)
- Change if you want to restrict:
```javascript
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://your-frontend.com',
  // ...
};
```

### 3. Input Validation
```javascript
// Already validates search query
if (!query) {
  return errorResponse('Missing query parameter: q', 400);
}

// Add more validation as needed
```

---

## 💰 Cost Estimation

### Cloudflare Workers Pricing

**Free Tier:**
- 100,000 requests/day
- 10ms CPU time per request
- Sufficient for development + small production

**Paid Plan ($5/month):**
- 10 million requests/month included
- $0.50 per additional million

**KV Storage:**
- 1GB storage free
- 100,000 reads/day free
- Usually free for this use case

**Estimated cost for 1M requests/month:** **$0** (within free tier)

---

## 📊 Performance Benchmarks

Expected performance:
- **Cached response:** < 50ms
- **Fresh API call:** 200-500ms (depends on Meteora API)
- **Cache hit rate:** 95%+ (with 5min TTL)

Test:
```bash
# Measure response time
for i in {1..10}; do
  curl -w "Time: %{time_total}s\n" -o /dev/null -s http://localhost:8787/api/pools
done
```

---

## ✅ Deployment Checklist

Before deploying to production:

- [ ] Worker code saved in `src/index.js`
- [ ] `wrangler.toml` configured
- [ ] KV namespace created
- [ ] Tested locally (`wrangler dev`)
- [ ] All endpoints working
- [ ] Cache working properly
- [ ] Rate limiting tested
- [ ] CORS headers correct
- [ ] Error handling working
- [ ] Logged in to Cloudflare (`wrangler login`)
- [ ] Ready to deploy

Deploy:
```bash
wrangler deploy
```

---

## 🔄 Update Process

When you need to update the API:

```bash
# 1. Edit code
vim src/index.js

# 2. Test locally
npm run dev

# 3. Test changes
curl http://localhost:8787/api/pools

# 4. Deploy
npm run deploy

# 5. Verify production
curl https://your-worker.workers.dev/api/health
```

---

## 📚 Next Steps

After backend is deployed:

1. **Test all endpoints** thoroughly
2. **Note your worker URL** for frontend integration
3. **Proceed to TASK 4:** Update Mini App to use this API
4. **Monitor logs** for any issues
5. **Adjust cache TTL** based on usage

---

## 🆘 Troubleshooting

### "KV namespace not found"
```bash
# Create namespace
wrangler kv:namespace create "POOL_CACHE"

# Copy ID to wrangler.toml
```

---

### "Worker exceeds size limit"
```bash
# Check size
wrangler deploy --dry-run

# Workers limit: 1MB
# Current code: ~15KB (well within limit)
```

---

### "Meteora API timeout"
```bash
# Increase timeout in code
const response = await fetch(url, {
  timeout: 30000 // 30 seconds
});
```

---

### "Rate limit not working"
```bash
# Check KV namespace is bound correctly
wrangler kv:namespace list

# Verify binding in wrangler.toml
```

---

**Status:** ✅ Backend API code ready!

**Next:** Deploy and test, then integrate with frontend (TASK 4)
