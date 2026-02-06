# Meteora DLMM/DAMM Calculator - Complete Setup Guide

## 📦 Project Structure

```
meteora-calculator/
├── mini-app/                      # Frontend (Telegram Mini App)
│   ├── public/
│   │   ├── index.html
│   │   ├── manifest.json
│   │   └── assets/
│   │       └── logo.png
│   ├── src/
│   │   ├── components/
│   │   │   ├── PoolCard.jsx
│   │   │   ├── CalculatorView.jsx
│   │   │   └── ...
│   │   ├── utils/
│   │   │   ├── calculations.js
│   │   │   ├── formatters.js
│   │   │   └── telegram.js
│   │   ├── data/
│   │   │   └── pools.json
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── .env.example
│
├── bot/                           # Backend (Telegram Bot)
│   ├── src/
│   │   ├── commands/
│   │   │   ├── start.js
│   │   │   ├── calculate.js
│   │   │   └── help.js
│   │   ├── handlers/
│   │   │   └── webAppData.js
│   │   └── index.js
│   ├── package.json
│   └── .env.example
│
└── docs/
    ├── SETUP.md
    ├── DEPLOYMENT.md
    ├── ROADMAP.md
    └── API.md
```

---

## 🚀 Quick Start

### 1. Setup Mini App (Frontend)

```bash
# Navigate to mini-app folder
cd mini-app

# Install dependencies
npm create vite@latest . -- --template react
npm install
npm install -D tailwindcss postcss autoprefixer
npm install @twa-dev/sdk lucide-react

# Initialize Tailwind
npx tailwindcss init -p

# Run development server
npm run dev
```

**Configure Tailwind (`tailwind.config.js`):**
```javascript
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

**Add to `src/index.css`:**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

### 2. Setup Bot (Backend)

```bash
# Navigate to bot folder
cd bot

# Initialize project
npm init -y

# Install dependencies
npm install telegraf dotenv
npm install -D nodemon

# Create .env file
echo "BOT_TOKEN=your_bot_token_here" > .env
echo "MINI_APP_URL=https://your-mini-app.vercel.app" >> .env
```

---

## 🔑 Environment Variables

### Mini App (`.env`)
```env
# Optional: Analytics, etc
VITE_APP_VERSION=1.0.0
```

### Bot (`.env`)
```env
# Required
BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
MINI_APP_URL=https://your-mini-app.vercel.app

# Optional
PORT=3000
NODE_ENV=production
```

---

## 📊 Data Structure

### `pools.json` Structure

```json
{
  "pools": [
    {
      "id": "bfs-sol-dlmm",
      "pair": "BFS/SOL",
      "type": "DLMM",
      "tvl": 111657,
      "volume_24h": 11075091,
      "fees_24h": 44954,
      "current_price": 0.001480,
      "bin_step": 25,
      "base_fee": 0.25,
      "total_trading_fee": 0.7677,
      "token0": {
        "symbol": "BFS",
        "name": "BeatsFinance",
        "price_usd": 0.148,
        "decimals": 9
      },
      "token1": {
        "symbol": "SOL",
        "name": "Solana",
        "price_usd": 100.0,
        "decimals": 9
      },
      "price_range": {
        "min": 0.001303,
        "max": 0.001681
      },
      "pool_url": "https://app.meteora.ag/dlmm/...",
      "last_updated": "2025-02-06T11:35:00Z"
    }
  ],
  "last_updated": "2025-02-06T11:35:00Z"
}
```

### How to Add More Pools

1. Visit Meteora app: https://app.meteora.ag
2. Select pool
3. Collect data:
   - TVL, Volume, Fees from UI
   - Current price
   - Token info
4. Add to `pools.json` following structure above
5. Rebuild app: `npm run build`

---

## 🌐 Deployment

### Deploy Mini App (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy (from mini-app folder)
cd mini-app
vercel --prod

# Output: https://your-app.vercel.app
```

**Or use Vercel Dashboard:**
1. Push to GitHub
2. Import to Vercel
3. Auto-deploy on push

---

### Deploy Bot (Railway)

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Add environment variables
railway variables set BOT_TOKEN=your_token
railway variables set MINI_APP_URL=https://your-app.vercel.app

# Deploy
railway up
```

**Or use Railway Dashboard:**
1. Connect GitHub repo
2. Add environment variables
3. Deploy

---

## 🤖 Telegram Bot Setup

### 1. Create Bot with BotFather

```
1. Open Telegram → Search @BotFather
2. Send: /newbot
3. Name: Meteora DLMM Calculator
4. Username: @MeteoraDLMMBot (must end with 'bot')
5. Copy token: 123456789:ABC...
```

### 2. Register Mini App

```
1. Send to @BotFather: /newapp
2. Select your bot
3. Title: Meteora Calculator
4. Description: Calculate DLMM & DAMM positions
5. Photo: Upload 640x360 image (optional)
6. Demo GIF: Optional
7. Short name: meteora_calc
8. Web App URL: https://your-app.vercel.app
9. Done! App available at: t.me/your_bot/meteora_calc
```

---

## 📱 Testing

### Test Mini App Locally

```bash
cd mini-app
npm run dev

# Open: http://localhost:5173
# Test all features in browser
```

### Test in Telegram (Development)

1. Use ngrok for local testing:
```bash
ngrok http 5173

# Output: https://abc123.ngrok.io
# Use this URL in BotFather temporarily
```

2. Or deploy to Vercel preview:
```bash
vercel
# Get preview URL
```

---

## 🔧 Customization

### Add More Pools

Edit `src/data/pools.json`:
```json
{
  "pools": [
    // Existing pools...
    {
      "id": "new-pool-id",
      "pair": "TOKEN/TOKEN",
      // ... complete data
    }
  ]
}
```

### Change Theme Colors

Edit `src/App.jsx` or create `tailwind.config.js`:
```javascript
theme: {
  extend: {
    colors: {
      primary: '#8B5CF6',  // Change purple
      secondary: '#3B82F6' // Change blue
    }
  }
}
```

### Modify Calculations

Edit `src/utils/calculations.js`:
```javascript
export const calculateFees = (params) => {
  // Modify formula here
  // Add your custom logic
};
```

---

## 📚 Available Scripts

### Mini App
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run linter
```

### Bot
```bash
npm start            # Start bot (production)
npm run dev          # Start with nodemon (development)
npm run test         # Run tests
```

---

## 🐛 Troubleshooting

### Mini App Not Loading in Telegram
- Check HTTPS (Telegram requires HTTPS)
- Verify URL in BotFather settings
- Check browser console for errors
- Test in regular browser first

### Bot Not Responding
- Verify BOT_TOKEN is correct
- Check bot is running: `ps aux | grep node`
- Check logs: `railway logs` or `heroku logs --tail`
- Verify webhook URL (if using webhooks)

### Calculations Wrong
- Check pool data in `pools.json` is accurate
- Verify formulas in `calculations.js`
- Test with known examples
- Compare with Meteora app directly

---

## 📖 API Integration (Future)

### Meteora API Example
```javascript
// Fetch pool data
async function fetchPoolData(poolAddress) {
  const response = await fetch(
    `https://api.meteora.ag/dlmm/pool/${poolAddress}`
  );
  return response.json();
}

// Use in app
const liveData = await fetchPoolData('pool_address');
```

### Jupiter Price API
```javascript
async function getTokenPrice(mint) {
  const response = await fetch(
    `https://price.jup.ag/v4/price?ids=${mint}`
  );
  const data = await response.json();
  return data.data[mint].price;
}
```

---

## 🔮 Roadmap

### Phase 1: MVP (Current)
- ✅ Pool selector
- ✅ DLMM & DAMM calculator
- ✅ Basic strategies
- ✅ IL & Fee calculation
- ✅ ROI projection

### Phase 2: Enhanced Features
- [ ] DCA vs DLMM vs DAMM comparison
- [ ] Real-time price API
- [ ] More pools (10-20)
- [ ] Charts & visualizations
- [ ] Save calculations

### Phase 3: Advanced
- [ ] Portfolio tracker
- [ ] Notifications via bot
- [ ] Multi-language support
- [ ] Historical backtesting
- [ ] Community features

See `docs/ROADMAP.md` for details.

---

## 🤝 Contributing

### How to Add Features

1. Fork repository
2. Create feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m 'Add feature'`
4. Push: `git push origin feature/your-feature`
5. Open Pull Request

### Code Style
- Use Prettier for formatting
- Follow ESLint rules
- Write meaningful commit messages
- Add comments for complex logic

---

## 📄 License

MIT License - see LICENSE file

---

## 🆘 Support

- Issues: GitHub Issues
- Telegram: @YourSupportChannel (optional)
- Email: support@example.com (optional)

---

## 📝 Notes

### Data Accuracy
- Pool data is static (manual updates needed)
- Consider adding "Last updated" timestamp
- Recommend users verify on Meteora app

### Disclaimers
Always include:
- "Not financial advice"
- "DYOR (Do Your Own Research)"
- "Past performance ≠ future results"
- Crypto investing risks

### Performance
- Mini App loads in <2s on 4G
- All calculations client-side (no backend needed for MVP)
- Optimized for mobile

---

## ✅ Checklist Before Launch

- [ ] Test all calculations manually
- [ ] Verify pool data accuracy
- [ ] Test on multiple devices (iOS, Android, Desktop)
- [ ] Add disclaimers
- [ ] Setup analytics (optional)
- [ ] Prepare user documentation
- [ ] Test bot commands
- [ ] Deploy to production
- [ ] Monitor errors (Sentry, LogRocket)
- [ ] Gather user feedback

---

**Built with ❤️ for DeFi Education**

Version: 1.0.0  
Last Updated: February 6, 2026
