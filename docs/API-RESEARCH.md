# Meteora API Research - Complete Documentation

**Date:** February 6, 2026  
**Research Status:** ✅ Complete  
**APIs Found:** DLMM API, DAMM v1 SDK, DAMM v2 SDK  

---

## 🎯 Executive Summary

### ✅ **DLMM API Available**
- Public REST API: `https://dlmm-api.meteora.ag`
- Rate limit: **30 requests per second (RPS)**
- No authentication required
- Full pool data available

### ✅ **DAMM v1 SDK Available**
- NPM Package: `@meteora-ag/dynamic-amm-sdk`
- On-chain data via Solana RPC
- No centralized API, uses program queries

### ✅ **DAMM v2 SDK Available**
- NPM Package: `@meteora-ag/cp-amm-sdk`
- Program ID: `cpamdpZCGKUy5JxQXB4dcpGPiikHawvSWAd6mEn1sGG`
- Newer version with more features

---

## 📊 DLMM API (Primary Data Source)

### Base URL
```
https://dlmm-api.meteora.ag
```

### Rate Limiting
- **30 RPS** (requests per second)
- No API key required
- Public access

---

### Key Endpoints

#### 1. **Get All DLMM Pools**
```
GET /pair/all
```

**Response Structure:**
```json
{
  "data": [
    {
      "address": "pool_address",
      "name": "BFS-SOL",
      "mint_x": "token_mint_x",
      "mint_y": "token_mint_y",
      "reserve_x": "reserve_amount_x",
      "reserve_y": "reserve_amount_y",
      "bin_step": 25,
      "base_fee_percentage": "0.25",
      "current_price": "0.001480",
      "apr": 285.5,
      "apy": 1650.2,
      "farm_apr": 0,
      "farm_apy": 0,
      "total_fee": "0.7677344",
      "liquidity": "111657.45",
      "trade_volume_24h": "11075091.32",
      "fees_24h": "44954.12",
      "cumulative_trade_volume": "545623421.12",
      "cumulative_fee_volume": "1891543.23"
    }
  ]
}
```

---

#### 2. **Get All Pools with Pagination**
```
GET /pair/all_with_pagination?offset=0&limit=100
```

**Parameters:**
- `offset`: Starting index (default: 0)
- `limit`: Number of results (max: 100)

**Use Case:** For fetching large datasets incrementally

---

#### 3. **Get Single Pool Detail**
```
GET /pair/{pair_address}
```

**Example:**
```
GET /pair/ARwi1S4DaiTG5DX7S4M4ZsrXqpMD1MrTmbu9ue2tpmEq
```

**Response:** Full pool details including bins, liquidity distribution, etc.

---

#### 4. **Get Pool Analytics**

**Fee Analytics:**
```
GET /pair/{pair_address}/analytic/pair_fee_bps
```
Returns historical fee data in basis points.

**Trade Volume:**
```
GET /pair/{pair_address}/analytic/pair_trade_volume
```
Returns 24h, 7d, 30d trade volumes.

**TVL Analytics:**
```
GET /pair/{pair_address}/analytic/pair_tvl
```
Returns historical TVL data.

**Swap History:**
```
GET /pair/{pair_address}/analytic/swap_history
```
Returns recent swap transactions.

---

#### 5. **Get Protocol Metrics**
```
GET /info/protocol_metrics
```

**Response:**
```json
{
  "total_tvl": 125643234.56,
  "total_volume_24h": 45632123.45,
  "total_fees_24h": 187654.32,
  "total_pools": 142,
  "total_positions": 8543
}
```

---

### 6. **Position Endpoints**

**Get Position by Address:**
```
GET /position/{position_address}
```

**Get Position Fees:**
```
GET /position/{position_address}/claim_fees
```

**Get Position Rewards:**
```
GET /position/{position_address}/claim_rewards
```

---

## 🔄 DAMM v1 API (Dynamic AMM)

### Important Note
**No public REST API for DAMM v1**. Data must be fetched via:
1. On-chain queries using Solana RPC
2. TypeScript SDK
3. Third-party indexers (Bitquery, Shyft)

---

### DAMM v1 SDK

**Installation:**
```bash
npm install @meteora-ag/dynamic-amm-sdk
```

**Program ID:**
```
Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy8X5EQVn5UaB
```

---

### Fetching DAMM v1 Pools

```javascript
import AmmImpl from '@meteora-ag/dynamic-amm-sdk';
import { Connection, PublicKey } from '@solana/web3.js';

const connection = new Connection('https://api.mainnet-beta.solana.com');

// Known pool addresses (must be found manually or via explorer)
const USDC_SOL_POOL = new PublicKey('...');

// Create pool instance
const pool = await AmmImpl.create(connection, USDC_SOL_POOL);

// Get pool data
const poolInfo = pool.poolState;
console.log({
  address: pool.address.toString(),
  tokenA: poolInfo.tokenAMint.toString(),
  tokenB: poolInfo.tokenBMint.toString(),
  reserveA: poolInfo.tokenAAmount.toString(),
  reserveB: poolInfo.tokenBAmount.toString(),
  lpSupply: poolInfo.lpSupply.toString(),
  currentPrice: poolInfo.currentPrice
});
```

---

### Finding All DAMM v1 Pools

**Option 1: On-chain Query**
```javascript
import { getProgramAccounts } from '@solana/web3.js';

const PROGRAM_ID = new PublicKey('Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy8X5EQVn5UaB');

// Fetch all pool accounts
const accounts = await connection.getProgramAccounts(PROGRAM_ID, {
  filters: [
    { dataSize: /* pool account size */ }
  ]
});

// Parse each account
const pools = accounts.map(account => {
  // Deserialize pool data
  return parsePoolAccount(account.account.data);
});
```

**Option 2: Use Third-party Indexer**

**Bitquery GraphQL API:**
```graphql
query {
  Solana {
    DEXTrades(
      where: {
        Trade: {
          Dex: {
            ProgramAddress: {is: "Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy8X5EQVn5UaB"}
          }
        }
      }
    ) {
      Trade {
        Dex {
          ProtocolName
          ProtocolFamily
        }
        Market {
          MarketAddress
        }
      }
    }
  }
}
```

**Shyft API:**
```javascript
// Query Meteora DAMM pools
const response = await fetch('https://programs.shyft.to/v0/graphql/?api_key={api-key}&network=mainnet-beta', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: `
      query {
        meteora_damm_pool {
          pubkey
          tokenAMint
          tokenBMint
          tokenAAmount
          tokenBAmount
        }
      }
    `
  })
});
```

---

## 🆕 DAMM v2 API (Latest Version)

### SDK Installation
```bash
npm install @meteora-ag/cp-amm-sdk
```

### Program ID
```
cpamdpZCGKUy5JxQXB4dcpGPiikHawvSWAd6mEn1sGG
```

---

### Fetching DAMM v2 Pools

```javascript
import { CpAmm } from '@meteora-ag/cp-amm-sdk';
import { Connection } from '@solana/web3.js';

const connection = new Connection('https://api.mainnet-beta.solana.com');
const cpAmm = new CpAmm(connection);

// Get all pools (requires on-chain query)
const allPools = await cpAmm.getAllPools();

// Get specific pool
const pool = await cpAmm.getPool(poolAddress);

console.log({
  address: pool.address,
  tokenA: pool.tokenAMint,
  tokenB: pool.tokenBMint,
  reserveA: pool.tokenAReserve,
  reserveB: pool.tokenBReserve,
  lpSupply: pool.lpSupply,
  fees: pool.fees,
  tvl: pool.tvl
});
```

---

## 💎 Alternative Data Sources

### 1. **Jupiter API (for prices)**
```
GET https://price.jup.ag/v4/price?ids=SOL,USDC,BFS
```

**Response:**
```json
{
  "data": {
    "SOL": {
      "id": "So11111111111111111111111111111111111111112",
      "mintSymbol": "SOL",
      "vsToken": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      "vsTokenSymbol": "USDC",
      "price": 100.45
    }
  },
  "timeTaken": 0.002
}
```

---

### 2. **DeFiLlama API**
```
GET https://api.llama.fi/protocol/meteora-dlmm
```

**Response:**
```json
{
  "name": "Meteora DLMM",
  "chain": "Solana",
  "tvl": 125643234,
  "chainTvls": {
    "Solana": 125643234
  }
}
```

---

### 3. **Birdeye API**
```
GET https://public-api.birdeye.so/defi/txs/pair?address={pair_address}
```

Requires API key. Provides:
- Trade history
- OHLC data
- Liquidity changes

---

## 🛠️ Implementation Strategy

### For Backend API (Cloudflare Workers)

```javascript
// backend/src/services/meteora.ts

export class MeteoraService {
  private baseURL = 'https://dlmm-api.meteora.ag';
  private rateLimit = 30; // RPS
  
  // Fetch all DLMM pools
  async getAllDLMMPools() {
    const response = await fetch(`${this.baseURL}/pair/all`);
    const data = await response.json();
    return this.transformPools(data.data);
  }
  
  // Fetch single pool
  async getPool(address) {
    const response = await fetch(`${this.baseURL}/pair/${address}`);
    return response.json();
  }
  
  // Fetch protocol metrics
  async getProtocolMetrics() {
    const response = await fetch(`${this.baseURL}/info/protocol_metrics`);
    return response.json();
  }
  
  // Transform to our schema
  transformPools(pools) {
    return pools.map(pool => ({
      id: pool.address,
      pair: pool.name,
      type: 'DLMM',
      tvl: parseFloat(pool.liquidity),
      volume_24h: parseFloat(pool.trade_volume_24h),
      fees_24h: parseFloat(pool.fees_24h),
      current_price: parseFloat(pool.current_price),
      bin_step: pool.bin_step,
      base_fee: parseFloat(pool.base_fee_percentage),
      total_trading_fee: parseFloat(pool.total_fee),
      apy: parseFloat(pool.apy),
      token0: {
        symbol: pool.name.split('-')[0],
        mint: pool.mint_x,
        amount: parseFloat(pool.reserve_x)
      },
      token1: {
        symbol: pool.name.split('-')[1],
        mint: pool.mint_y,
        amount: parseFloat(pool.reserve_y)
      }
    }));
  }
}
```

---

### For DAMM Pools (On-chain Query)

```javascript
// backend/src/services/damm.ts

import { Connection, PublicKey } from '@solana/web3.js';

export class DAMMService {
  private connection;
  private programId = new PublicKey('cpamdpZCGKUy5JxQXB4dcpGPiikHawvSWAd6mEn1sGG');
  
  constructor() {
    this.connection = new Connection(process.env.SOLANA_RPC_URL);
  }
  
  async getAllPools() {
    // Query all pool accounts
    const accounts = await this.connection.getProgramAccounts(this.programId, {
      filters: [
        { dataSize: 324 } // Pool account size
      ]
    });
    
    // Parse and return
    return accounts.map(acc => this.parsePoolAccount(acc));
  }
  
  parsePoolAccount(account) {
    // Deserialize pool data
    // Return structured pool info
  }
}
```

---

## 📋 Complete Pool Schema

```typescript
interface Pool {
  // Identification
  id: string;                    // Pool address
  pair: string;                  // e.g., "BFS/SOL"
  type: 'DLMM' | 'DAMM';        // Pool type
  
  // Financial Data
  tvl: number;                   // Total value locked (USD)
  volume_24h: number;            // 24h trading volume (USD)
  volume_7d?: number;            // 7d trading volume
  fees_24h: number;              // 24h fees collected (USD)
  fees_7d?: number;              // 7d fees
  
  // Pricing
  current_price: number;         // Current price (token1/token0)
  price_change_24h?: number;     // 24h price change (%)
  
  // Pool Parameters
  bin_step?: number;             // DLMM only: bin step
  base_fee: number;              // Base fee (%)
  dynamic_fee?: number;          // DAMM: dynamic component
  total_trading_fee: number;     // Total fee (%)
  protocol_fee?: number;         // Protocol fee
  
  // APY/APR
  apy?: number;                  // Annual percentage yield
  apr?: number;                  // Annual percentage rate
  farm_apy?: number;             // Farm rewards APY
  
  // Tokens
  token0: {
    symbol: string;
    name?: string;
    mint: string;               // Token mint address
    decimals: number;
    price_usd: number;
    logo?: string;
    amount: number;             // Reserve amount
  };
  token1: {
    symbol: string;
    name?: string;
    mint: string;
    decimals: number;
    price_usd: number;
    logo?: string;
    amount: number;
  };
  
  // Liquidity Distribution (DLMM)
  liquidity_distribution?: {
    active_bin: number;
    bins: Array<{
      bin_id: number;
      price: number;
      liquidity_x: number;
      liquidity_y: number;
    }>;
  };
  
  // Metadata
  pool_url?: string;             // Link to Meteora app
  created_at?: string;           // ISO timestamp
  last_updated: string;          // ISO timestamp
  is_featured?: boolean;
  tags?: string[];               // ['trending', 'high-volume', etc]
}
```

---

## ⚡ Caching Strategy

### Cloudflare Workers KV

```javascript
// Cache for 5 minutes
const CACHE_TTL = 300; // seconds

async function getCachedPools(env) {
  // Check cache
  const cached = await env.POOL_CACHE.get('all_pools', 'json');
  
  if (cached && cached.timestamp > Date.now() - CACHE_TTL * 1000) {
    return cached.data;
  }
  
  // Fetch fresh data
  const pools = await meteoraService.getAllDLMMPools();
  const dammPools = await dammService.getAllPools();
  const allPools = [...pools, ...dammPools];
  
  // Cache it
  await env.POOL_CACHE.put('all_pools', JSON.stringify({
    timestamp: Date.now(),
    data: allPools
  }), { expirationTtl: CACHE_TTL });
  
  return allPools;
}
```

---

## 🎯 Data Collection Script

```javascript
// scripts/collect-pools.js

const axios = require('axios');
const fs = require('fs');

async function collectAllPools() {
  console.log('Fetching DLMM pools...');
  
  // DLMM pools
  const dlmmResponse = await axios.get('https://dlmm-api.meteora.ag/pair/all');
  const dlmmPools = dlmmResponse.data.data;
  
  console.log(`Found ${dlmmPools.length} DLMM pools`);
  
  // Get token prices
  const tokenMints = [...new Set(dlmmPools.flatMap(p => [p.mint_x, p.mint_y]))];
  const priceResponse = await axios.get(`https://price.jup.ag/v4/price?ids=${tokenMints.join(',')}`);
  const prices = priceResponse.data.data;
  
  // Transform and enrich
  const pools = dlmmPools.map(pool => ({
    id: pool.address,
    pair: pool.name,
    type: 'DLMM',
    tvl: parseFloat(pool.liquidity),
    volume_24h: parseFloat(pool.trade_volume_24h),
    fees_24h: parseFloat(pool.fees_24h),
    current_price: parseFloat(pool.current_price),
    bin_step: pool.bin_step,
    base_fee: parseFloat(pool.base_fee_percentage),
    total_trading_fee: parseFloat(pool.total_fee),
    apy: parseFloat(pool.apy),
    token0: {
      symbol: pool.name.split('-')[0],
      mint: pool.mint_x,
      price_usd: prices[pool.mint_x]?.price || 0,
      amount: parseFloat(pool.reserve_x)
    },
    token1: {
      symbol: pool.name.split('-')[1],
      mint: pool.mint_y,
      price_usd: prices[pool.mint_y]?.price || 0,
      amount: parseFloat(pool.reserve_y)
    },
    last_updated: new Date().toISOString()
  }));
  
  // Save to file
  fs.writeFileSync('data/pools.json', JSON.stringify({
    pools,
    total_pools: pools.length,
    last_updated: new Date().toISOString()
  }, null, 2));
  
  console.log('✅ Pool data saved to data/pools.json');
}

collectAllPools().catch(console.error);
```

**Run:**
```bash
node scripts/collect-pools.js
```

---

## 📊 Expected Results

### DLMM Pools
Based on research, Meteora has **100+ DLMM pools** including:
- Major pairs: SOL/USDC, SOL/USDT, BTC/USDC
- LST pairs: JitoSOL/SOL, mSOL/SOL, bSOL/SOL
- Stablecoin pairs: USDC/USDT
- Meme coins: Various TOKEN/SOL pairs
- Project tokens: BFS/SOL, BFS/USDC, etc.

### DAMM v2 Pools
Fewer pools (estimated **20-30**), mostly:
- Launch pools (new token launches)
- Memecoin pools with special features
- Volatile pairs with dynamic fees

---

## 🚀 Next Steps

1. **Implement Backend API:**
   - Create Cloudflare Workers endpoints
   - Fetch from DLMM API
   - Implement caching
   - Add error handling

2. **Data Collection:**
   - Run collection script
   - Verify data accuracy
   - Filter top 30-50 pools by volume

3. **Frontend Integration:**
   - Update Mini App to use API
   - Add loading states
   - Implement refresh mechanism

4. **Monitoring:**
   - Track API usage
   - Monitor rate limits
   - Set up alerts

---

## ✅ Summary

### What We Found:
- ✅ **DLMM API:** Fully documented, 30 RPS, no auth
- ✅ **100+ DLMM pools** available
- ✅ **DAMM v1/v2:** On-chain only, requires SDK
- ✅ **Alternative APIs:** Jupiter (prices), DeFiLlama (TVL)

### What We Can Build:
- ✅ Backend API with Cloudflare Workers
- ✅ Cache with KV storage (5min TTL)
- ✅ Support 30-50 top pools initially
- ✅ Real-time price integration
- ✅ Auto-refresh every 5 minutes

### Limitations:
- ⚠️ DAMM pools require on-chain queries (slower)
- ⚠️ No historical data API (need to build own)
- ⚠️ Rate limit 30 RPS (sufficient for our use case)

---

**Status:** ✅ **Ready to Build Backend**

**Next Task:** Implement Cloudflare Workers API (TASK 3)
