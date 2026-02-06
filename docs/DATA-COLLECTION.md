# Meteora Pool Data Collection - Setup & Usage

## 📦 Project Structure

```
meteora-calculator/
├── scripts/
│   └── collect-pools.js          # Main collection script
├── data/                          # Generated files (gitignored)
│   ├── pools.json                 # Complete pool data
│   ├── pools-summary.json         # Human-readable summary
│   └── pools-top10.json           # Top 10 pools
├── package.json
└── .gitignore
```

---

## 🚀 Quick Start

### 1. Setup Project

```bash
# Create project structure
mkdir -p meteora-calculator/scripts
mkdir -p meteora-calculator/data
cd meteora-calculator

# Initialize npm project
npm init -y

# Install dependencies
npm install axios dotenv

# Copy the script
# (paste collect-pools.js into scripts/ folder)
```

---

### 2. Create package.json Scripts

Add these scripts to your `package.json`:

```json
{
  "name": "meteora-calculator",
  "version": "1.0.0",
  "scripts": {
    "collect": "node scripts/collect-pools.js",
    "collect:watch": "nodemon scripts/collect-pools.js",
    "test:script": "node scripts/collect-pools.js --test"
  },
  "dependencies": {
    "axios": "^1.6.0",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
```

---

### 3. Create .gitignore

```bash
# .gitignore
node_modules/
data/*.json
!data/.gitkeep
.env
*.log
.DS_Store
```

---

### 4. Run the Script

```bash
# Collect data
npm run collect

# Or directly
node scripts/collect-pools.js
```

---

## 📊 Expected Output

### Console Output:
```
🚀 Starting Meteora Pool Data Collection...

📊 Fetching all DLMM pools from Meteora...
✅ Found 142 DLMM pools

🔍 Found 87 unique tokens

💰 Fetching prices for 87 tokens...
✅ Fetched 87 token prices

🔄 Transforming pool data...

🔍 Filtering pools...
✅ 128 active pools (from 142 total)

🏆 Selected top 50 pools

📊 Statistics:
   Total TVL: $125.64M
   Total Volume 24h: $87.32M
   Total Fees 24h: $345.2K
   Average APY: 156.3%

💾 Saving files...
💾 Saved to: data/pools.json
💾 Saved to: data/pools-summary.json
💾 Saved to: data/pools-top10.json

✅ Data collection complete!
📁 Files saved in: data/
   - pools.json (50 pools, complete data)
   - pools-summary.json (readable summary)
   - pools-top10.json (top 10 by volume)
```

---

### File: data/pools.json (Sample)

```json
{
  "meta": {
    "generated_at": "2026-02-06T12:00:00.000Z",
    "source": "Meteora DLMM API",
    "api_url": "https://dlmm-api.meteora.ag",
    "version": "1.0.0"
  },
  "statistics": {
    "total_pools": 50,
    "total_tvl": 125643234.56,
    "total_volume_24h": 87321456.78,
    "total_fees_24h": 345234.12,
    "avg_tvl": 2512864.69,
    "avg_volume_24h": 1746429.14,
    "avg_apy": 156.32,
    "active_pools": 50,
    "popular_pools": 38,
    "featured_pools": 25
  },
  "pools": [
    {
      "id": "ARwi1S4DaiTG5DX7S4M4ZsrXqpMD1MrTmbu9ue2tpmEq",
      "pair": "BFS-SOL",
      "type": "DLMM",
      "tvl": 111657.45,
      "volume_24h": 11075091.32,
      "fees_24h": 44954.12,
      "current_price": 0.001480,
      "bin_step": 25,
      "base_fee": 0.25,
      "total_trading_fee": 0.7677,
      "apy": 285.5,
      "daily_yield": 40.26,
      "token0": {
        "symbol": "BFS",
        "mint": "...",
        "price_usd": 0.148,
        "amount": 75558.26
      },
      "token1": {
        "symbol": "SOL",
        "mint": "So11...",
        "price_usd": 100.45,
        "amount": 1164.13
      },
      "pool_url": "https://app.meteora.ag/dlmm/ARwi...",
      "last_updated": "2026-02-06T12:00:00.000Z",
      "is_active": true,
      "is_popular": true,
      "is_featured": true,
      "tags": ["high-volume", "medium-pool", "high-yield", "sol-pair", "active"]
    }
    // ... 49 more pools
  ]
}
```

---

### File: data/pools-summary.json (Sample)

```json
[
  {
    "pair": "BFS-SOL",
    "tvl": "$111.7K",
    "volume_24h": "$11.08M",
    "apy": "285.5%",
    "tags": "high-volume, medium-pool, high-yield, sol-pair, active"
  },
  {
    "pair": "SOL-USDC",
    "tvl": "$5.2M",
    "volume_24h": "$23.4M",
    "apy": "145.2%",
    "tags": "high-volume, large-pool, sol-pair, stablecoin, active"
  }
  // ... more pools
]
```

---

## 🔧 Customization

### Filter Options

Edit the filtering in `main()` function:

```javascript
// Get only high-value pools
const activePools = filterPools(transformedPools, {
  activeOnly: true,
  minTVL: 50000,      // Only pools with TVL > $50k
  minVolume: 100000   // Only pools with volume > $100k
});

// Get top 30 instead of 50
const topPools = getTopPools(activePools, 30);
```

---

### Sort by Different Metrics

```javascript
// Sort by TVL instead of volume
const sorted = sortPools(pools, 'tvl');

// Sort by APY
const sorted = sortPools(pools, 'apy');

// Sort by daily yield
const sorted = sortPools(pools, 'yield');
```

---

### Save Additional Files

```javascript
// Save only SOL pairs
const solPairs = topPools.filter(p => p.pair.includes('SOL'));
saveToFile({ pools: solPairs }, 'data/pools-sol.json');

// Save only stablecoin pairs
const stablePairs = topPools.filter(p => 
  p.tags.includes('stablecoin')
);
saveToFile({ pools: stablePairs }, 'data/pools-stable.json');

// Save high-yield pools (>50% APY)
const highYield = topPools.filter(p => p.apy > 50);
saveToFile({ pools: highYield }, 'data/pools-high-yield.json');
```

---

## 🔄 Automated Collection

### Option 1: Cron Job (Linux/Mac)

```bash
# Edit crontab
crontab -e

# Add line (runs every hour)
0 * * * * cd /path/to/project && npm run collect

# Or every 6 hours
0 */6 * * * cd /path/to/project && npm run collect
```

---

### Option 2: Node Schedule

Install:
```bash
npm install node-schedule
```

Create `scripts/scheduled-collect.js`:
```javascript
const schedule = require('node-schedule');
const { exec } = require('child_process');

// Run every hour at minute 0
const job = schedule.scheduleJob('0 * * * *', () => {
  console.log('🕐 Running scheduled collection...');
  exec('npm run collect', (error, stdout, stderr) => {
    if (error) {
      console.error('Error:', error);
      return;
    }
    console.log(stdout);
  });
});

console.log('📅 Scheduled collection started (every hour)');
```

Run:
```bash
node scripts/scheduled-collect.js
```

---

### Option 3: GitHub Actions (Auto-update)

Create `.github/workflows/collect-data.yml`:
```yaml
name: Collect Pool Data

on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
  workflow_dispatch:        # Manual trigger

jobs:
  collect:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Collect data
        run: npm run collect
      
      - name: Commit changes
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add data/
          git commit -m "Update pool data" || echo "No changes"
          git push
```

---

## 🧪 Testing

### Test Script Manually

```bash
# Run with verbose output
node scripts/collect-pools.js

# Check generated files
ls -lh data/

# Validate JSON
cat data/pools.json | jq '.'

# Count pools
cat data/pools.json | jq '.pools | length'

# Get top 5 by volume
cat data/pools.json | jq '.pools[:5] | .[] | {pair, volume_24h}'
```

---

### Validate Data

Create `scripts/validate-data.js`:
```javascript
const fs = require('fs');

const data = JSON.parse(fs.readFileSync('data/pools.json', 'utf-8'));

console.log('Validation Results:');
console.log(`✅ Total pools: ${data.pools.length}`);
console.log(`✅ All pools have id: ${data.pools.every(p => p.id)}`);
console.log(`✅ All pools have tvl: ${data.pools.every(p => p.tvl >= 0)}`);
console.log(`✅ All pools have tokens: ${data.pools.every(p => p.token0 && p.token1)}`);

const duplicates = data.pools.filter((p, i, arr) => 
  arr.findIndex(x => x.id === p.id) !== i
);
console.log(`✅ No duplicates: ${duplicates.length === 0}`);

const invalidPrices = data.pools.filter(p => 
  p.current_price <= 0 || !isFinite(p.current_price)
);
console.log(`✅ All prices valid: ${invalidPrices.length === 0}`);
```

Run:
```bash
node scripts/validate-data.js
```

---

## 🐛 Troubleshooting

### Issue: "Error fetching pools"

**Solution:**
- Check internet connection
- Verify Meteora API is up: `curl https://dlmm-api.meteora.ag/pair/all`
- Check rate limiting (wait 1 minute and retry)

---

### Issue: "No token prices fetched"

**Solution:**
- Jupiter API might be down
- Script continues with $0 prices
- Re-run script later to update prices

---

### Issue: "File save error"

**Solution:**
```bash
# Create data directory
mkdir -p data

# Check permissions
chmod 755 data
```

---

### Issue: "Rate limit exceeded"

**Solution:**
Edit `DELAY_MS` in script:
```javascript
const DELAY_MS = 500; // Increase delay to 500ms
```

---

## 📈 Performance

### Current Performance:
- Fetches: **~142 pools** in **~5 seconds**
- Total time: **~10 seconds** (including prices)
- Output size: **~200KB** (50 pools)

### Optimization Tips:
1. Use caching for token prices
2. Fetch pool details in parallel (batch of 5)
3. Store previous run data to detect changes

---

## 🔐 Security Notes

1. **No sensitive data** stored in files
2. **No API keys** required (public API)
3. Safe to commit to Git (add data/ to .gitignore)
4. Rate limiting implemented to be respectful

---

## ✅ Next Steps

After running this script:

1. **Verify data:**
   ```bash
   cat data/pools.json | jq '.statistics'
   ```

2. **Review top pools:**
   ```bash
   cat data/pools-top10.json
   ```

3. **Use in backend:**
   - Copy `data/pools.json` to backend
   - Or serve via API endpoint
   - Or import directly in code

4. **Proceed to TASK 3:**
   - Build Cloudflare Workers API
   - Serve this data via endpoints
   - Add caching layer

---

## 📊 Data Quality Checklist

Before using data in production:

- [ ] All pools have valid IDs
- [ ] TVL values are reasonable (> $1000)
- [ ] Token prices fetched successfully
- [ ] No duplicate pools
- [ ] Current prices are valid numbers
- [ ] Pools have required fields (pair, type, tokens)
- [ ] Statistics make sense
- [ ] File sizes are reasonable
- [ ] JSON is valid (no syntax errors)
- [ ] Generated timestamp is recent

---

**Status:** ✅ TASK 2 Complete!

**Next:** TASK 3 - Build Backend API using this data
