# Meteora DLMM/DAMM Calculator - Claude Code Development Guide

## 🎯 Project Overview

**Current Status:** MVP Prototype Complete (Phase 1)  
**Next Phase:** Complete Foundation (Phase 2)  
**Development Tool:** Claude Code (Command-line AI Coding Agent)  

---

## 📦 Project Structure

```
meteora-calculator/
├── frontend/                      # React Mini App
│   ├── src/
│   │   ├── components/
│   │   ├── utils/
│   │   ├── data/
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
│
├── backend/                       # API Server
│   ├── src/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── index.js
│   ├── package.json
│   └── wrangler.toml             # Cloudflare Workers config
│
├── bot/                          # Telegram Bot
│   ├── src/
│   │   ├── commands/
│   │   ├── handlers/
│   │   └── index.js
│   └── package.json
│
├── shared/                       # Shared utilities
│   ├── types/
│   ├── constants/
│   └── utils/
│
└── docs/                         # Documentation
    ├── PHASE1-COMPLETE.md       # MVP completion notes
    ├── PHASE2-PLAN.md           # This guide
    ├── API.md
    └── DEPLOYMENT.md
```

---

## 🔄 Phase 2: Development Tasks

### **TASK 1: Research Meteora API**

**Objective:** Find and document how to fetch all pool data from Meteora

**Claude Code Prompt:**
```
Research Meteora DLMM API and create comprehensive documentation:

1. Find API endpoints for:
   - List all DLMM pools
   - List all DAMM pools
   - Get pool details (TVL, volume, fees)
   - Get current prices

2. Test the APIs:
   - Try example requests
   - Document response format
   - Check rate limits
   - Authentication requirements?

3. Create file: docs/METEORA_API.md with:
   - Base URL
   - All endpoints
   - Request/response examples
   - Error handling
   - Rate limits

4. If Meteora API not available:
   - Research alternatives (Birdeye, DeFiLlama, Jupiter)
   - Document on-chain queries via Solana RPC
   - Create fallback strategy

Deliverable: Complete API documentation in docs/METEORA_API.md
```

**Expected Output:**
```markdown
# Meteora API Documentation

## Base URL
https://api.meteora.ag/v1

## Endpoints

### GET /dlmm/pools
List all DLMM pools

**Response:**
{
  "pools": [
    {
      "address": "...",
      "pair": "BFS/SOL",
      "tvl": 111657,
      ...
    }
  ]
}

### GET /damm/pools
...
```

---

### **TASK 2: Data Collection Script**

**Objective:** Create script to fetch and format all pool data

**Claude Code Prompt:**
```
Create Node.js script to collect pool data from Meteora:

Location: backend/scripts/collect-pools.js

Requirements:
1. Fetch all DLMM pools
2. Fetch all DAMM pools
3. Fetch token prices from Jupiter
4. Format data according to schema in shared/types/pool.ts
5. Save to JSON file: backend/data/pools.json
6. Add error handling and logging
7. Add retry logic for failed requests
8. Handle rate limiting

Output format:
{
  "pools": [...],
  "last_updated": "2025-02-06T...",
  "total_pools": 35
}

Dependencies: axios, dotenv

Usage: node scripts/collect-pools.js
```

**Expected Files:**
```
backend/scripts/collect-pools.js
backend/data/pools.json (generated)
shared/types/pool.ts (type definitions)
```

---

### **TASK 3: Backend API - Cloudflare Workers**

**Objective:** Build serverless API to serve pool data

**Claude Code Prompt:**
```
Create Cloudflare Workers API for Meteora calculator:

Location: backend/src/

Endpoints needed:
1. GET /api/pools
   - Return all pools
   - Support query params: ?type=DLMM|DAMM&sort=volume|tvl
   - Cache for 5 minutes

2. GET /api/pool/:id
   - Return single pool detail
   - Include real-time price if available

3. GET /api/prices
   - Get current token prices
   - Tokens: SOL, USDC, BFS, etc

4. GET /api/health
   - Health check endpoint

Requirements:
- Use Cloudflare Workers KV for caching
- Add CORS headers for Mini App
- Rate limiting: 100 requests per minute per IP
- Error handling with proper HTTP codes
- TypeScript

Files to create:
- backend/src/index.ts (main handler)
- backend/src/routes/pools.ts
- backend/src/routes/prices.ts
- backend/src/services/meteora.ts
- backend/src/services/cache.ts
- backend/src/utils/cors.ts
- backend/wrangler.toml (config)

Setup: 
npm create cloudflare@latest backend
cd backend
npm install
```

**Expected Files:**
```typescript
// backend/src/index.ts
export default {
  async fetch(request, env, ctx) {
    const router = new Router();
    router.get('/api/pools', handlePools);
    router.get('/api/pool/:id', handlePool);
    return router.handle(request);
  }
}

// backend/src/routes/pools.ts
export async function handlePools(request) {
  // Implementation
}
```

---

### **TASK 4: Update Frontend to Use API**

**Objective:** Connect Mini App to backend API

**Claude Code Prompt:**
```
Update React Mini App to use backend API:

Location: frontend/src/

Tasks:
1. Create API client:
   - frontend/src/services/api.ts
   - Methods: fetchPools(), fetchPool(id), fetchPrices()
   - Error handling
   - Retry logic

2. Update App.jsx:
   - Replace hardcoded POOLS_DATA
   - Add loading states
   - Add error states
   - Implement pull-to-refresh

3. Add caching:
   - frontend/src/utils/cache.ts
   - Use localStorage for offline support
   - TTL: 5 minutes

4. Create hooks:
   - frontend/src/hooks/usePoolsData.ts
   - frontend/src/hooks/usePoolDetail.ts

5. Add refresh functionality:
   - Manual refresh button
   - Auto-refresh every 5 minutes
   - Show "Last updated" timestamp

Dependencies: 
npm install @tanstack/react-query axios

Example implementation:
- Use React Query for data fetching
- Implement optimistic updates
- Handle offline mode gracefully
```

**Expected Files:**
```typescript
// frontend/src/services/api.ts
const API_BASE = import.meta.env.VITE_API_URL;

export const poolsAPI = {
  async fetchAll() {
    const response = await axios.get(`${API_BASE}/api/pools`);
    return response.data;
  },
  async fetchOne(id) {
    const response = await axios.get(`${API_BASE}/api/pool/${id}`);
    return response.data;
  }
};

// frontend/src/hooks/usePoolsData.ts
import { useQuery } from '@tanstack/react-query';

export function usePoolsData() {
  return useQuery({
    queryKey: ['pools'],
    queryFn: () => poolsAPI.fetchAll(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3
  });
}
```

---

### **TASK 5: Add Comparison View**

**Objective:** Side-by-side DLMM vs DAMM comparison

**Claude Code Prompt:**
```
Create comparison feature in Mini App:

Location: frontend/src/components/Comparison/

Components to create:
1. ComparisonView.jsx
   - Takes two strategies as input
   - Shows side-by-side metrics
   - Highlights differences
   - Visual indicators (better/worse)

2. ComparisonSelector.jsx
   - Dropdown to select strategies
   - Quick presets: "DLMM Spot vs DAMM", etc

3. ComparisonChart.jsx
   - Line chart showing fee vs IL over time
   - Interactive scenarios
   - Use Chart.js or Recharts

Metrics to compare:
- Daily/Weekly fee projections
- IL risk
- ROI (best/realistic/worst case)
- Capital efficiency
- Active management needed
- Risk level (visual gauge)

Features:
- Toggle between table and chart view
- Export comparison as image
- Share comparison link

Design:
- Mobile-first responsive
- Use cards for each strategy
- Color coding: green (better), red (worse), gray (neutral)
- Smooth animations

Dependencies:
npm install chart.js react-chartjs-2 html2canvas
```

**Expected UI:**
```
┌─────────────────────────────────┐
│     DLMM Spot   vs   DAMM       │
├────────────┬────────────────────┤
│ Fee/Day    │  $180  │  $120    │
│ IL Risk    │   🔴   │   🟡     │
│ ROI 7d     │  +230% │  +113%   │
│ Effort     │  High  │   Low    │
└────────────┴────────────────────┘
     [View Charts] [Share]
```

---

### **TASK 6: Add Charts & Visualizations**

**Objective:** Visual data representation

**Claude Code Prompt:**
```
Add charts to Mini App:

Location: frontend/src/components/Charts/

Charts to create:

1. ILChart.jsx
   - X-axis: Price change (-50% to +200%)
   - Y-axis: IL percentage
   - Show curve for DLMM vs DAMM
   - Interactive tooltips

2. FeeProjectionChart.jsx
   - X-axis: Days (1-30)
   - Y-axis: Accumulated fees ($)
   - Multiple scenarios: Best/Realistic/Worst
   - Area chart with gradient

3. ROIComparisonChart.jsx
   - Bar chart comparing strategies
   - Show fee, IL, and net ROI
   - Grouped bars by time period (1d, 7d, 30d)

4. PriceRangeChart.jsx (DLMM only)
   - Show liquidity distribution across bins
   - Current price indicator
   - Out-of-range warning visualization

Design Requirements:
- Dark theme compatible
- Mobile responsive
- Interactive (click/hover for details)
- Smooth animations
- Legend toggles

Library: Use Chart.js with react-chartjs-2

Create helper:
frontend/src/utils/chartConfig.js
- Default colors
- Theme settings
- Common options
```

**Expected Component:**
```jsx
// frontend/src/components/Charts/ILChart.jsx
import { Line } from 'react-chartjs-2';

export function ILChart({ strategy }) {
  const data = {
    labels: priceChanges,
    datasets: [
      {
        label: 'IL %',
        data: ilValues,
        borderColor: 'rgb(139, 92, 246)',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
      }
    ]
  };
  
  return <Line data={data} options={options} />;
}
```

---

### **TASK 7: Educational Content System**

**Objective:** In-app learning resources

**Claude Code Prompt:**
```
Create educational content system:

Location: frontend/src/components/Education/

Components:

1. Tooltip.jsx
   - Hover tooltips for technical terms
   - Click for expanded info
   - Link to full guide

2. InfoModal.jsx
   - Modal popup with detailed explanations
   - Support markdown content
   - Images/diagrams
   - Code examples

3. Tutorial.jsx
   - Step-by-step walkthrough
   - Interactive demo
   - Progress tracking
   - "Skip" and "Next" buttons

4. Glossary.jsx
   - Searchable term definitions
   - Categories: Basic, Intermediate, Advanced
   - Related terms linking

Content to create:
frontend/src/content/education.json
{
  "terms": {
    "IL": {
      "short": "Loss vs holding assets",
      "long": "Detailed explanation...",
      "example": "If SOL price...",
      "related": ["Fee", "ROI"]
    },
    "DLMM": {...},
    "DAMM": {...}
  },
  "tutorials": [
    {
      "id": "first-calculation",
      "title": "Your First Calculation",
      "steps": [...]
    }
  ]
}

Features:
- Markdown support (use react-markdown)
- LaTeX for formulas (use katex)
- Code syntax highlighting
- Image zoom
- Print/PDF export

Dependencies:
npm install react-markdown katex react-syntax-highlighter
```

---

### **TASK 8: Save & History Feature**

**Objective:** Let users save and review past calculations

**Claude Code Prompt:**
```
Implement calculation history:

Location: frontend/src/features/History/

Components:

1. HistoryList.jsx
   - List all saved calculations
   - Sort by date (newest first)
   - Filter by pool/strategy
   - Delete individual or all

2. SaveCalculation.jsx
   - "Save" button in calculator
   - Custom name/notes
   - Auto-save option

3. HistoryDetail.jsx
   - View saved calculation
   - Re-run with updated data
   - Compare to current market

Storage:
- Use localStorage
- Schema: 
{
  "calculations": [
    {
      "id": "uuid",
      "timestamp": "2025-02-06T...",
      "pool": "BFS/SOL",
      "capital": 500,
      "strategy": "curve",
      "results": {...},
      "notes": "Test run"
    }
  ]
}

Features:
- Export to CSV
- Import from CSV
- Backup/restore
- Sync across devices (optional, via bot)

Utils to create:
frontend/src/utils/storage.ts
- saveCalculation()
- getCalculations()
- deleteCalculation()
- exportToCSV()
- importFromCSV()

Max storage: 50 calculations
Auto-delete oldest when limit reached
```

---

### **TASK 9: Performance Optimization**

**Objective:** Ensure app is fast and smooth

**Claude Code Prompt:**
```
Optimize Mini App performance:

Tasks:

1. Code Splitting:
   - Split routes with React.lazy()
   - Lazy load charts
   - Lazy load education content

2. Memoization:
   - Use React.memo for expensive components
   - useMemo for calculations
   - useCallback for handlers

3. Virtual Scrolling:
   - Implement for pool list (if 50+ pools)
   - Use react-window or react-virtualized

4. Image Optimization:
   - Compress token logos
   - Use WebP format
   - Lazy load images

5. Bundle Size:
   - Analyze with vite-bundle-visualizer
   - Tree-shake unused code
   - Use production builds

6. Caching Strategy:
   - Service worker for offline
   - Cache API responses
   - Prefetch next pool on hover

Create:
frontend/src/utils/performance.ts
- Debounce search
- Throttle scroll
- Lazy component wrapper

Target Metrics:
- First Contentful Paint < 1.5s
- Time to Interactive < 3s
- Lighthouse Score > 90

Run:
npm run analyze
npm run lighthouse
```

---

### **TASK 10: Testing & QA**

**Objective:** Ensure quality and catch bugs

**Claude Code Prompt:**
```
Setup testing infrastructure:

Location: frontend/tests/, backend/tests/

1. Unit Tests:
   - Test calculation functions
   - Test utilities
   - Use Vitest

2. Component Tests:
   - Test React components
   - Use React Testing Library
   - Mock API calls

3. Integration Tests:
   - Test API endpoints
   - Test data flow
   - Use Supertest for backend

4. E2E Tests:
   - Test user flows
   - Use Playwright
   - Critical paths only

Files to create:
frontend/vitest.config.js
frontend/tests/utils/calculations.test.ts
frontend/tests/components/Calculator.test.tsx
backend/tests/routes/pools.test.ts

Test Coverage Goal: >80%

Scripts to add in package.json:
"test": "vitest"
"test:ui": "vitest --ui"
"test:coverage": "vitest --coverage"
"test:e2e": "playwright test"

CI/CD:
Create .github/workflows/test.yml
- Run tests on PR
- Block merge if tests fail
```

---

### **TASK 11: Documentation Update**

**Objective:** Keep docs in sync with code

**Claude Code Prompt:**
```
Update documentation:

Files to update/create:

1. docs/API.md
   - Document all backend endpoints
   - Request/response examples
   - Error codes

2. docs/ARCHITECTURE.md
   - System diagram
   - Data flow
   - Component hierarchy

3. docs/DEVELOPMENT.md
   - Setup instructions
   - Common commands
   - Troubleshooting

4. docs/DEPLOYMENT.md
   - Deployment steps
   - Environment variables
   - Monitoring setup

5. README.md
   - Update features list
   - Update screenshots
   - Update roadmap

6. CHANGELOG.md
   - Document Phase 2 changes
   - Breaking changes
   - New features

Generate diagrams using Mermaid:
- System architecture
- API flow
- Component tree

Add JSDoc comments to all functions:
/**
 * Calculate impermanent loss
 * @param {number} priceChange - New price / old price
 * @returns {number} IL percentage
 */
```

---

### **TASK 12: Deployment & DevOps**

**Objective:** Deploy Phase 2 to production

**Claude Code Prompt:**
```
Setup deployment pipeline:

1. Frontend (Vercel):
   - Create vercel.json
   - Setup environment variables
   - Enable preview deployments
   - Custom domain (optional)

2. Backend (Cloudflare Workers):
   - Run: wrangler deploy
   - Setup KV namespace
   - Configure secrets
   - Setup custom domain

3. Bot (Railway):
   - Connect GitHub repo
   - Auto-deploy on push
   - Setup environment variables
   - Configure health checks

4. Monitoring:
   - Cloudflare Analytics for API
   - Vercel Analytics for frontend
   - Sentry for error tracking

5. CI/CD:
   Create .github/workflows/deploy.yml
   - Test on push
   - Deploy on merge to main
   - Rollback on failure

Files:
.github/workflows/deploy.yml
vercel.json
wrangler.toml (update)
railway.json

Environment Variables:
VITE_API_URL=https://api.your-domain.com
BOT_TOKEN=xxx
CLOUDFLARE_API_TOKEN=xxx
SENTRY_DSN=xxx (optional)

Post-deployment:
- Smoke test all features
- Check error logs
- Monitor performance
- Update bot commands if needed
```

---

## 🎯 Execution Order

### **Week 1: Data & Backend**
```bash
# Day 1-2: Research
claude-code "Execute TASK 1: Research Meteora API"

# Day 3-4: Data Collection
claude-code "Execute TASK 2: Create data collection script"

# Day 5-7: Backend API
claude-code "Execute TASK 3: Build Cloudflare Workers API"
```

### **Week 2: Frontend Integration**
```bash
# Day 8-9: API Integration
claude-code "Execute TASK 4: Update frontend to use API"

# Day 10-11: Features
claude-code "Execute TASK 5: Add comparison view"
claude-code "Execute TASK 6: Add charts"

# Day 12-14: Polish
claude-code "Execute TASK 7: Educational content"
claude-code "Execute TASK 8: Save & history"
```

### **Week 3: Quality & Deploy**
```bash
# Day 15-17: Optimization
claude-code "Execute TASK 9: Performance optimization"
claude-code "Execute TASK 10: Testing setup"

# Day 18-19: Documentation
claude-code "Execute TASK 11: Update documentation"

# Day 20-21: Deployment
claude-code "Execute TASK 12: Deploy to production"
```

---

## 📋 Claude Code Best Practices

### **1. Clear Context**
Always provide:
- Current project state
- File locations
- Dependencies
- Expected output

### **2. Iterative Prompts**
Break complex tasks into smaller steps:
```bash
# Bad
claude-code "Build entire backend"

# Good
claude-code "Create backend project structure"
claude-code "Implement /api/pools endpoint"
claude-code "Add caching layer"
```

### **3. Verify Output**
After each task:
```bash
# Test the code
npm test

# Run locally
npm run dev

# Check file was created
ls -la backend/src/routes/
```

### **4. Provide Feedback**
If output is wrong:
```bash
claude-code "Fix error in pools.ts: 
Line 45 should filter by type, currently filtering by name"
```

### **5. Save Progress**
Commit after each successful task:
```bash
git add .
git commit -m "feat: add pools API endpoint (TASK 3)"
git push
```

---

## 🔍 Quality Checklist

After completing all tasks, verify:

### **Functionality**
- [ ] All pools load correctly
- [ ] Calculations are accurate
- [ ] API responds within 200ms
- [ ] Offline mode works
- [ ] No console errors

### **UX**
- [ ] Loading states smooth
- [ ] Error messages helpful
- [ ] Mobile-friendly
- [ ] Animations smooth (60fps)
- [ ] Tooltips informative

### **Performance**
- [ ] Lighthouse score > 90
- [ ] Bundle size < 500KB
- [ ] API cached properly
- [ ] Images optimized
- [ ] No memory leaks

### **Security**
- [ ] API rate limited
- [ ] CORS configured
- [ ] No secrets in frontend
- [ ] Input validated
- [ ] XSS protected

### **Documentation**
- [ ] All endpoints documented
- [ ] README updated
- [ ] Comments added
- [ ] Examples provided
- [ ] Changelog updated

---

## 🆘 Troubleshooting Guide

### **Claude Code Not Working?**

**Issue:** "Command not found: claude-code"
```bash
# Install Claude Code
npm install -g @anthropic-ai/claude-code

# Or use npx
npx @anthropic-ai/claude-code "your prompt"
```

**Issue:** "Context too large"
```bash
# Split task into smaller prompts
# Or use --context flag to specify files
claude-code --context src/App.jsx "Add loading state"
```

**Issue:** "Generated code has errors"
```bash
# Provide error details
claude-code "Fix error: Cannot read property 'map' of undefined
Location: src/components/PoolList.jsx line 45"
```

---

## 📊 Progress Tracking

Create a file: `PROGRESS.md`

```markdown
# Phase 2 Progress

## Week 1: Data & Backend
- [x] TASK 1: Research Meteora API (2 days)
- [x] TASK 2: Data collection script (1 day)
- [ ] TASK 3: Backend API (3 days)

## Week 2: Frontend
- [ ] TASK 4: API integration (2 days)
- [ ] TASK 5: Comparison view (2 days)
- [ ] TASK 6: Charts (2 days)
- [ ] TASK 7: Education (1 day)
- [ ] TASK 8: History (1 day)

## Week 3: Quality
- [ ] TASK 9: Optimization (2 days)
- [ ] TASK 10: Testing (2 days)
- [ ] TASK 11: Documentation (2 days)
- [ ] TASK 12: Deployment (2 days)

## Blockers
- None currently

## Notes
- Meteora API rate limit: 100/min
- Consider adding WebSocket for live prices
```

---

## ✅ Success Criteria

Phase 2 is complete when:

1. **Data:**
   - ✅ 30+ pools supported
   - ✅ Real-time data from API
   - ✅ Auto-refresh working

2. **Features:**
   - ✅ Comparison view functional
   - ✅ Charts displaying correctly
   - ✅ Educational content accessible
   - ✅ History saving/loading

3. **Performance:**
   - ✅ Page load < 2s
   - ✅ API response < 200ms
   - ✅ Smooth animations
   - ✅ Offline support

4. **Quality:**
   - ✅ Test coverage > 80%
   - ✅ Zero console errors
   - ✅ Mobile responsive
   - ✅ Docs complete

5. **Deployment:**
   - ✅ Prod environment live
   - ✅ Monitoring active
   - ✅ CI/CD working
   - ✅ Rollback tested

---

## 🎉 Next Steps After Phase 2

Once Phase 2 complete:

1. **User Testing** (1 week)
   - Beta test with 10-20 users
   - Collect feedback
   - Iterate

2. **Phase 3 Planning**
   - DCA comparison tool
   - Portfolio tracker
   - Notifications
   - Multi-language

3. **Marketing**
   - Launch announcement
   - Tutorial videos
   - Community engagement

---

**Ready to start Phase 2 with Claude Code?**

Begin with:
```bash
claude-code "Execute TASK 1: Research Meteora API and create comprehensive documentation"
```

🚀 Good luck!
