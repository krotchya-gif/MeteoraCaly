# 🤖 Claude Code Project Guide - Meteora Calculator

> Panduan lengkap untuk Claude Code saat bekerja dengan project Meteora DLMM/DAMM Calculator

## 📋 Project Overview

**Nama Project:** Meteora DLMM/DAMM Calculator
**Tipe:** Web Application + Telegram Bot
**Tech Stack:** React + Vite (Frontend), Cloudflare Workers (Backend), Node.js (Bot)
**Status:** ✅ Production Ready
**Version:** 1.0.3

### Live Deployments
- **Frontend:** https://meteora-calysta.vercel.app (Vercel - Auto deploy dari GitHub)
- **Backend API:** https://meteora-calculator-api.infocyber001.workers.dev (Cloudflare Workers)
- **Telegram Bot:** Running on Railway (auto deploy dari GitHub)
- **Repository:** https://github.com/krotchya-gif/MeteoraCaly

---

## 🎯 Project Purpose

Calculator untuk menghitung Impermanent Loss (IL), fee earnings, dan ROI untuk Liquidity Providers di Meteora Protocol (Solana). Mendukung:
- **DLMM** (Dynamic Liquidity Market Maker) - 60% pools
- **DAMM** (Dynamic Automated Market Maker) - 40% pools

---

## 🏗️ Architecture

### 1. Frontend (mini-app/)
- **Framework:** React 18 + Vite
- **Styling:** TailwindCSS + Custom CSS
- **State:** React Hooks (useState, useEffect, useCallback)
- **Charts:** Custom Canvas-based (no external libs)
- **Routing:** Tab-based navigation (no React Router)

**Key Components:**
```
mini-app/src/
├── App.jsx                 # Main app with tab navigation
├── components/
│   ├── MeteoraCalculator.jsx   # Pool list & calculator
│   ├── ComparisonView.jsx      # Side-by-side comparison
│   ├── HistoryView.jsx         # Calculation history
│   ├── LearnView.jsx           # Educational content
│   └── charts/
│       ├── ILChart.jsx         # Impermanent Loss visualization
│       ├── FeeProjectionChart.jsx
│       ├── ROIComparisonChart.jsx
│       └── PriceRangeChart.jsx
├── utils/
│   ├── cache.js            # LocalStorage cache (2 min TTL)
│   └── validation.js       # API response validation
└── hooks/
    ├── useToast.js         # Toast notifications
    └── useHistory.js       # History management
```

### 2. Backend (backend/)
- **Platform:** Cloudflare Workers
- **Runtime:** V8 Isolates
- **Storage:** KV Namespace (1M writes/month = 33k writes/day)
- **Cache TTL:** 2 minutes (720 writes/day = 2% of limit)

**Key Functions:**
```javascript
// backend/src/index.js
fetchDLMMPage()      // Fetch DLMM pools (30 RPS limit)
fetchDAMMPools()     // Fetch DAMM V2 pools (10 RPS limit)
transformPool()      // Transform API response to standard format
fetchAllPools()      // Main orchestrator - 60% DLMM + 40% DAMM
```

**CRITICAL: Type Field Fix**
```javascript
// ❌ JANGAN GUNAKAN INI (akan return number):
const type = pool.pool_type === 'DAMM' ? 'DAMM' : 'DLMM';

// ✅ GUNAKAN INI (transform terpisah):
const dlmmPools = dlmmRaw.map(p => transformPool(p, 'DLMM'));
const dammPools = dammRaw.map(p => transformPool(p, 'DAMM'));
```

### 3. Telegram Bot (bot/)
- **Framework:** Telegraf.js
- **Deploy:** Railway (auto from GitHub)
- **Commands:**
  - `/start` - Welcome message with Web App button
  - `/trending` - Show top trending pools
  - `/subscribe` - Daily alert subscription

---

## 🔑 Critical Issues & Solutions

### Issue #1: Type Field Returns Number Instead of String
**Problem:** API returned `type: 158` instead of `type: "DLMM"`
**Root Cause:** Property conflicts when spreading pool object
**Solution:** Transform DLMM and DAMM separately with explicit type parameter

```javascript
// ❌ WRONG - akan return angka
const pools = rawPools.map(p => {
  const type = p.pool_type === 'DAMM' ? 'DAMM' : 'DLMM';
  return { ...p, type };  // Property conflict!
});

// ✅ CORRECT - explicit type parameter
const dlmmPools = dlmmRaw.map(p => transformPool(p, 'DLMM'));
const dammPools = dammRaw.map(p => transformPool(p, 'DAMM'));
```

### Issue #2: Toast Notification Spam
**Problem:** Multiple toasts muncul saat refresh/load more
**Solution:** Disable toast untuk manual actions (showToast=false)

```javascript
// loadMore dan handleRefresh
fetchPools(nextLimit, append, false); // showToast=false
```

### Issue #3: Cache Key Versioning
**Problem:** Old cache data persists with wrong format
**Current Version:** `all_pools_v10`
**Rule:** Increment version saat schema berubah

---

## 📊 Data Flow

```
Meteora API → Cloudflare Workers → KV Cache → Frontend → LocalStorage
    ↓              ↓                   ↓          ↓            ↓
DLMM: 30 RPS    Transform        2 min TTL   Display   2 min TTL
DAMM: 10 RPS    Merge 60/40                  Filter
```

### API Endpoints

**Cloudflare Workers:**
```
GET /api/pools              - All pools (cached)
GET /api/pools/top/:n       - Top N pools by volume
GET /api/pool/:id           - Single pool detail
GET /api/pools/search?q=    - Search pools
GET /api/health             - Health check
```

**Meteora External APIs:**
```
DLMM: https://dlmm-api.meteora.ag/pair/all_with_pagination
DAMM: https://dammv2-api.meteora.ag/pools
```

---

## 🎨 Code Conventions

### 1. Naming
- **Components:** PascalCase (e.g., `MeteoraCalculator.jsx`)
- **Functions:** camelCase (e.g., `fetchPools()`)
- **Constants:** SCREAMING_SNAKE_CASE (e.g., `CACHE_TTL`)
- **Files:** kebab-case atau camelCase

### 2. File Structure
- **Imports:** External libs → Internal components → Utils → Hooks
- **Component:** Props destructure → Hooks → Handlers → Render
- **No default exports** untuk utils/hooks (named exports only)

### 3. Error Handling
```javascript
try {
  // Operation
} catch (error) {
  console.error('Context:', error);
  // Fallback or user message
}
```

### 4. Comments
- **Bahasa Indonesia** untuk business logic comments
- **English** untuk technical/code comments
- Use JSDoc untuk public functions

---

## 🚀 Deployment Workflow

### Frontend (Vercel)
```bash
git add .
git commit -m "feat: description"
git push origin main
# Vercel auto-deploys within 1-2 minutes
```

### Backend (Cloudflare Workers)
```bash
cd backend
npm run deploy  # Manual deployment required
# Check: https://meteora-calculator-api.infocyber001.workers.dev/api/health
```

### Bot (Railway)
```bash
git add .
git commit -m "feat: description"
git push origin main
# Railway auto-deploys within 2-3 minutes
```

### Cache Management
- **Frontend:** Clear with `removeCache(CACHE_KEY_POOLS)`
- **Backend:** Increment version `all_pools_vX` untuk force refresh
- **Auto-refresh:** Every 2 minutes (120 seconds)

---

## 🧪 Testing

### Quick Test Checklist
```bash
# Backend API
curl https://meteora-calculator-api.infocyber001.workers.dev/api/pools/top/5

# Check type field (must be string)
curl -s API_URL | grep -o '"type":"[^"]*"' | uniq

# Frontend
# 1. Open https://meteora-calysta.vercel.app
# 2. Check ALL filter shows pools
# 3. Check DLMM filter works
# 4. Check DAMM filter works
# 5. Click "Muat 25 pool lagi" button
# 6. No toast spam appears
```

---

## 🐛 Common Pitfalls

### 1. ❌ Jangan Destructure Pool dengan { type, ...rest }
```javascript
// ❌ WRONG - type bisa jadi getter/immutable
const { type, ...rest } = pool;
return { ...rest, type: 'DLMM' };

// ✅ CORRECT - Pass explicit parameter
transformPool(pool, 'DLMM');
```

### 2. ❌ Jangan Gunakan pool.pool_type di Ternary
```javascript
// ❌ WRONG - unreliable, returns number
const type = pool.pool_type === 'DAMM' ? 'DAMM' : 'DLMM';

// ✅ CORRECT - Use parameter
function transformPool(pool, poolType) {
  const detectedType = poolType || 'DLMM';
}
```

### 3. ❌ Jangan Lupa Update Cache Key
```javascript
// ❌ WRONG - old cache persists
const cached = await getCached('all_pools_v2', env);

// ✅ CORRECT - increment version after schema change
const cached = await getCached('all_pools_v10', env);
```

### 4. ❌ Jangan Commit Sensitive Files
```
.env
railway.json  (di .gitignore)
wrangler.toml secrets
```

---

## 📚 Important Files

### Configuration
- `mini-app/vite.config.js` - Vite config
- `backend/wrangler.toml` - Cloudflare Workers config
- `bot/railway.json` - Railway deployment config (GITIGNORED)

### Documentation
- `README.md` - Main project documentation
- `CLAUDE.md` - This file (AI assistant guide)
- `CLOUDFLARE-FIX-SUMMARY.md` - Detailed fix history
- `PROGRESS.md` - Task tracking

### Key Source Files
- `backend/src/index.js` - Main backend (800+ lines)
- `mini-app/src/App.jsx` - Main frontend
- `mini-app/src/components/MeteoraCalculator.jsx` - Core calculator
- `bot/index.js` - Telegram bot

---

## 🔐 Secrets & Environment Variables

### Frontend (.env)
```env
VITE_API_URL=https://meteora-calculator-api.infocyber001.workers.dev
```

### Backend (wrangler.toml)
```toml
[[kv_namespaces]]
binding = "POOL_CACHE"
id = "1c4300aec012448b8c0879c3e1ea633b"
```

### Bot (.env)
```env
BOT_TOKEN=<telegram_bot_token>
MINI_APP_URL=https://meteora-calysta.vercel.app
API_URL=https://meteora-calculator-api.infocyber001.workers.dev
```

---

## 📈 Performance Metrics

- **Bundle Size:** 233.73 kB (gzip: 72.27 kB)
- **Response Time (cached):** ~100-200ms
- **Response Time (fresh):** ~1.5-2s
- **Pools Available:** ~250 (150 DLMM + 100 DAMM)
- **Cache TTL:** 2 minutes (ultra fresh data)
- **KV Writes:** ~720/day (2% of 33k limit) ✅
- **Auto-refresh:** Every 2 minutes

---

## 🎯 Future Roadmap

### Phase 3 (Planned)
- [ ] Per-bin fee calculations (higher accuracy)
- [ ] Real IL simulation with concentrated liquidity
- [ ] Gas fee tracking & display
- [ ] Compounding vs linear ROI
- [ ] PnL tracking (harian/mingguan/bulanan)
- [ ] Deposit/withdraw fee calculations
- [ ] Multi-language support
- [ ] Dark mode

---

## 🆘 Troubleshooting

### Problem: Filter DLMM/DAMM kosong
**Solution:** Check API returns `type: "DLMM"` (string, bukan number)
```bash
curl -s API_URL/api/pools/top/1 | grep '"type"'
# Should show: "type": "DLMM" or "type": "DAMM"
```

### Problem: Load more button tidak muncul
**Solution:** Check `hasMore` state dan pool count
```javascript
// MeteoraCalculator.jsx line ~457
{!loading && hasMore && !searchTerm && (
  <button onClick={onLoadMore}>Muat 25 pool lagi</button>
)}
```

### Problem: Toast spam
**Solution:** Pastikan showToast=false di loadMore/handleRefresh
```javascript
fetchPools(nextLimit, true, false); // showToast=false
```

---

## 🤝 Working with Claude Code

### When Starting a Task
1. Read CLAUDE.md (this file)
2. Check current git status
3. Understand the problem fully
4. Research before coding (jangan langsung coding!)

### Before Committing
1. Test changes locally
2. Check no debug code left
3. Verify cache key version if schema changed
4. Update documentation if needed

### Git Commit Messages
Format: `type: description`
```
feat: Add dark mode support
fix: Type field returns string instead of number
docs: Update API documentation
refactor: Simplify cache logic
```

### Deployment Process
1. **Frontend:** Push to GitHub → Vercel auto-deploys
2. **Backend:** `npm run deploy` from backend/
3. **Bot:** Push to GitHub → Railway auto-deploys
4. **Cache:** Increment version if needed

---

## 📞 Contact & Support

- **GitHub Issues:** https://github.com/krotchya-gif/MeteoraCaly/issues
- **Project Owner:** @krotchya-gif
- **Last Updated:** February 8, 2026

---

**🎉 Project Status: Production Ready**

**Latest Version:** 1.0.3
**Last Major Fix:** Type field string fix (Feb 8, 2026)
**Next Focus:** Calculation accuracy improvements (future task)
