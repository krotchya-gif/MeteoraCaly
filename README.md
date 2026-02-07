# 🌟 Meteora DLMM/DAMM Calculator

> Kalkulator Impermanent Loss & Fee untuk Meteora Dynamic Liquidity Market Maker (DLMM) dan Dynamic Automated Market Maker (DAMM)

[![Status](https://img.shields.io/badge/status-production-green)]()
[![React](https://img.shields.io/badge/react-18.0-blue)]()
[![Cloudflare](https://img.shields.io/badge/cloudflare-workers-orange)]()
[![License](https://img.shields.io/badge/license-MIT-blue)]()

## 🚀 Live Deployment

- 🌐 **Frontend:** https://meteora-calysta.vercel.app
- 🔌 **Backend API:** https://meteora-calculator-api.infocyber001.workers.dev
- 🤖 **Telegram Bot:** Running on Railway
- 📦 **GitHub:** https://github.com/krotchya-gif/MeteoraCaly

**Version:** 1.0.1-kv-optimized | **Status:** ✅ 100% Complete

---

## 🌟 Features

### 📊 Core Features
- **ROI Calculator** - Calculate returns for any Meteora pool
- **Strategy Comparison** - Compare up to 3 pools × 3 strategies side-by-side
- **Visual Analytics** - 4 professional chart types for data visualization
- **Real-time Data** - Fetches live pool data from Meteora API
- **Export Options** - Export calculations and charts as CSV/PNG

### 🎨 Charts & Visualizations
- **Impermanent Loss Chart** - Visualize IL across price movements
- **Fee Projection Chart** - Project earnings over 3-24 months
- **ROI Comparison Chart** - Compare strategies with grouped bar charts
- **Price Range Chart** - See liquidity distribution across DLMM bins

### 💼 Strategies Supported
- **Spot Strategy** - Concentrated liquidity at current price (1.5x fees)
- **Curve Strategy** - Balanced distribution across range (1.0x fees)
- **Bid-Ask Strategy** - Split buy/sell zones (1.2x fees)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Cloudflare account (for backend deployment)

### Installation

```bash
# Clone repository
git clone https://github.com/your-username/meteora-calculator.git
cd meteora-calculator

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API URLs

# Start development server
npm run dev
```

### Environment Variables

```env
# Frontend (.env)
VITE_API_URL=https://meteora-calculator-api.YOUR_ACCOUNT.workers.dev

# Backend (wrangler.toml)
name = "meteora-calculator-api"
main = "src/index.js"
compatibility_date = "2024-01-01"

[[kv_namespaces]]
binding = "POOLS_CACHE"
id = "YOUR_KV_NAMESPACE_ID"
```

---

## 📁 Project Structure

```
meteora-calculator/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Calculator.jsx
│   │   │   ├── ComparisonView.jsx
│   │   │   ├── ComparisonSelector.jsx
│   │   │   ├── ComparisonTable.jsx
│   │   │   ├── charts/
│   │   │   │   ├── ChartDashboard.jsx
│   │   │   │   ├── ILChart.jsx
│   │   │   │   ├── FeeProjectionChart.jsx
│   │   │   │   ├── ROIComparisonChart.jsx
│   │   │   │   └── PriceRangeChart.jsx
│   │   │   └── ...
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── src/
│   │   └── index.js
│   ├── wrangler.toml
│   └── package.json
│
├── scripts/
│   └── collect-pools.js
│
├── docs/
│   ├── TASK-5-DOCUMENTATION.md
│   ├── TASK-6-DOCUMENTATION.md
│   └── API.md
│
├── README.md
├── CHANGELOG.md
└── LICENSE
```

---

## 🎯 Usage

### Basic Calculator

```jsx
import Calculator from './components/Calculator';

function App() {
  return <Calculator pools={pools} />;
}
```

### Comparison View

```jsx
import ComparisonView from './components/ComparisonView';

function App() {
  return (
    <ComparisonView 
      pools={pools}
      onBack={() => navigate('/')}
    />
  );
}
```

### Chart Dashboard

```jsx
import ChartDashboard from './components/charts/ChartDashboard';

function Analytics() {
  return (
    <ChartDashboard
      calculatorData={results}
      comparisonData={comparisons}
    />
  );
}
```

---

## 🧮 Calculation Formulas

### Impermanent Loss
```javascript
const ratio = 1 + priceChange / 100;
const il = (2 * Math.sqrt(ratio)) / (1 + ratio) - 1;
const ilPercent = il * 100;
```

### Fee Earnings
```javascript
const baseAPR = (pool.fee_24h * 365) / pool.liquidity * 100;
const adjustedAPR = baseAPR * strategyMultiplier;
const monthlyFees = capital * (adjustedAPR / 12 / 100);
```

### ROI
```javascript
const ilLoss = capital * (ilPercent / 100);
const netProfit = feesEarned + ilLoss; // IL is negative
const roi = (netProfit / capital) * 100;
```

---

## 🔌 API Endpoints

### Backend API (Cloudflare Workers)

```
GET /api/pools
Response: { pools: [...], count: 50 }

GET /api/pool/:id
Response: { pool: {...} }

GET /api/pools/top/:n
Response: { pools: [...], count: n }

GET /api/pools/search?q=BFS
Response: { pools: [...], query: "BFS" }

GET /api/health
Response: { status: "ok", timestamp: "..." }
```

### Meteora API (External)

```
GET https://dlmm-api.meteora.ag/pair/all
Response: { groups: [...] }
```

---

## 🎨 Customization

### Change Theme Colors

```javascript
// In tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',    // Blue
        secondary: '#22c55e',  // Green
        danger: '#ef4444',     // Red
      }
    }
  }
}
```

### Add Custom Strategy

```javascript
// In calculations.js
const strategies = {
  spot: { multiplier: 1.5, name: 'Spot' },
  curve: { multiplier: 1.0, name: 'Curve' },
  bidask: { multiplier: 1.2, name: 'Bid-Ask' },
  custom: { multiplier: 1.3, name: 'Custom' }, // Add new strategy
};
```

### Modify Chart Colors

```javascript
// In ILChart.jsx
ctx.strokeStyle = '#ef4444'; // Change IL curve color
ctx.fillStyle = '#3b82f6';   // Change marker color
```

---

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run component tests
npm run test:components

# Run E2E tests
npm run test:e2e

# Generate coverage report
npm run test:coverage
```

---

## 📦 Deployment

### Frontend (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production deployment
vercel --prod
```

### Backend (Cloudflare Workers)

```bash
# Install Wrangler
npm i -g wrangler

# Login to Cloudflare
wrangler login

# Deploy
cd backend
wrangler publish
```

### Data Collection (Cron)

```bash
# Manual run
node scripts/collect-pools.js

# Set up GitHub Actions for automatic updates
# See .github/workflows/update-pools.yml
```

---

## 🔧 Configuration

### Frontend Config (`vite.config.js`)

```javascript
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  server: {
    port: 3000,
  }
});
```

### Backend Config (`wrangler.toml`)

```toml
name = "meteora-calculator-api"
main = "src/index.js"
compatibility_date = "2024-01-01"

[[kv_namespaces]]
binding = "POOLS_CACHE"
id = "YOUR_KV_NAMESPACE_ID"

[vars]
CACHE_TTL = "300"
RATE_LIMIT = "100"
```

---

## 📊 Performance

### Metrics
- **Lighthouse Score:** 95+
- **First Contentful Paint:** <1.5s
- **Time to Interactive:** <3s
- **Bundle Size:** ~150KB (gzipped)

### Optimization
- ✅ Code splitting with React.lazy
- ✅ Component memoization
- ✅ Cloudflare edge caching
- ✅ LocalStorage client cache
- ✅ Canvas-based charts (no external libs)

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- Use ESLint configuration
- Follow React best practices
- Write meaningful commit messages
- Add tests for new features

---

## 📝 Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

### Latest Updates (v1.0.1 - Feb 7, 2026)
- ✅ Cloudflare Workers KV optimization (1000 writes/day compliance)
- ✅ Meteora API rate limit compliance (30 RPS)
- ✅ Fixed invalid API sort keys (volume, feetvlratio, volume12h, tvl)
- ✅ Removed AbortController for Workers compatibility
- ✅ Synchronized frontend/backend cache (15 min TTL)
- ✅ Smart merge: 250 pools from 4 sources
- ✅ All endpoints operational

---

## 🐛 Known Issues & Solutions

### Issue: Load More not working
**Solution:** Clear browser localStorage
```javascript
// Browser console (F12)
localStorage.clear();
location.reload();
```

### Issue: Stale pool data
**Solution:** Click refresh button or wait 15 minutes for auto-refresh

See [CLOUDFLARE-FIX-SUMMARY.md](CLOUDFLARE-FIX-SUMMARY.md) for detailed troubleshooting.

---

## 🗺️ Roadmap

### Phase 3 (Future)
- [ ] Educational content & tooltips
- [ ] Save & history feature
- [ ] Performance optimization
- [ ] Dark mode support
- [ ] Multi-language support
- [ ] Mobile app (React Native)
- [ ] DCA comparison tool
- [ ] Portfolio tracking

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Meteora Protocol** - For the excellent DLMM/DAMM infrastructure
- **Solana** - For the high-performance blockchain
- **Jupiter** - For price feed integration
- **Cloudflare** - For edge computing and caching

---

## 📞 Support

- **Documentation:** [docs/](docs/)
- **Issues:** [GitHub Issues](https://github.com/your-username/meteora-calculator/issues)
- **Discord:** [Join our community](#)
- **Twitter:** [@MeteoraCal](#)

---

## 🔗 Links

- **Live App:** https://meteora-calysta.vercel.app
- **Backend API:** https://meteora-calculator-api.infocyber001.workers.dev
- **Meteora Protocol:** https://www.meteora.ag
- **GitHub Repo:** https://github.com/krotchya-gif/MeteoraCaly

## 📚 Documentation

- 📘 [CLOUDFLARE-FIX-SUMMARY.md](CLOUDFLARE-FIX-SUMMARY.md) - Complete fix documentation
- 📗 [PROGRESS.md](PROGRESS.md) - Project progress tracker
- 📙 [DEPLOY-NOW.md](DEPLOY-NOW.md) - Deployment guide

---

## ⚡ Performance Metrics

- **Bundle Size:** 233.73 kB (gzipped: 72.27 kB)
- **Response Time (cached):** ~100-200ms
- **Response Time (fresh):** ~1.5-2s
- **Pools Available:** ~250 unique pools
- **Cache TTL:** 15 minutes
- **KV Usage:** ~100 writes/day (10% of 1000 limit) ✅

---

**Built with ❤️ for the Solana DeFi community**

*Last updated: February 7, 2026*
