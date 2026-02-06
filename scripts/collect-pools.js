// ============================================
// METEORA POOL DATA COLLECTION SCRIPT
// ============================================
// 
// Purpose: Fetch all DLMM pools from Meteora API
// Output: data/pools.json with complete pool information
// Usage: node scripts/collect-pools.js
//
// Requirements:
// - Node.js 18+
// - npm install axios dotenv
// ============================================

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const METEORA_API = 'https://dlmm-api.meteora.ag';
const JUPITER_PRICE_API = 'https://price.jup.ag/v4/price';
const OUTPUT_DIR = path.join(__dirname, '../data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'pools.json');

// Rate limiting
const DELAY_MS = 100; // Delay between requests to avoid rate limit
const MAX_RETRIES = 3;

// ============================================
// UTILITY FUNCTIONS
// ============================================

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function retryRequest(fn, retries = MAX_RETRIES) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      console.log(`Retry ${i + 1}/${retries}...`);
      await sleep(1000 * (i + 1)); // Exponential backoff
    }
  }
}

function formatNumber(num) {
  return parseFloat(num).toFixed(2);
}

function calculateDailyYield(fees24h, tvl) {
  if (!tvl || tvl === 0) return 0;
  return ((fees24h / tvl) * 100);
}

// ============================================
// DATA FETCHING FUNCTIONS
// ============================================

async function fetchAllDLMMPools() {
  console.log('📊 Fetching all DLMM pools from Meteora...');
  
  try {
    const response = await retryRequest(() => 
      axios.get(`${METEORA_API}/pair/all`, {
        timeout: 30000,
        headers: {
          'User-Agent': 'Meteora-Calculator/1.0'
        }
      })
    );
    
    const pools = response.data.data || response.data;
    console.log(`✅ Found ${pools.length} DLMM pools`);
    return pools;
    
  } catch (error) {
    console.error('❌ Error fetching DLMM pools:', error.message);
    throw error;
  }
}

async function fetchTokenPrices(tokenMints) {
  console.log(`💰 Fetching prices for ${tokenMints.length} tokens...`);
  
  try {
    // Jupiter API accepts comma-separated mints
    const ids = tokenMints.slice(0, 100).join(','); // Max 100 at a time
    
    const response = await retryRequest(() =>
      axios.get(`${JUPITER_PRICE_API}?ids=${ids}`, {
        timeout: 15000
      })
    );
    
    const prices = response.data.data;
    console.log(`✅ Fetched ${Object.keys(prices).length} token prices`);
    return prices;
    
  } catch (error) {
    console.warn('⚠️ Error fetching token prices:', error.message);
    return {}; // Return empty object if price fetch fails
  }
}

async function fetchPoolDetails(poolAddress) {
  try {
    const response = await axios.get(`${METEORA_API}/pair/${poolAddress}`, {
      timeout: 10000
    });
    return response.data;
  } catch (error) {
    console.warn(`⚠️ Could not fetch details for ${poolAddress}`);
    return null;
  }
}

// ============================================
// DATA TRANSFORMATION
// ============================================

function transformPool(pool, prices) {
  const [token0Symbol, token1Symbol] = pool.name.split('-');
  
  // Get token prices
  const token0Price = prices[pool.mint_x]?.price || 0;
  const token1Price = prices[pool.mint_y]?.price || 0;
  
  // Calculate TVL if not provided
  let tvl = parseFloat(pool.liquidity || 0);
  if (tvl === 0 && pool.reserve_x && pool.reserve_y) {
    tvl = (parseFloat(pool.reserve_x) * token0Price) + 
          (parseFloat(pool.reserve_y) * token1Price);
  }
  
  // Calculate daily yield
  const fees24h = parseFloat(pool.fees_24h || 0);
  const dailyYield = calculateDailyYield(fees24h, tvl);
  
  // Determine pool status
  const isActive = tvl > 1000; // Consider active if TVL > $1000
  const isPopular = parseFloat(pool.trade_volume_24h || 0) > 100000; // Volume > $100k
  
  return {
    // Identification
    id: pool.address,
    pair: pool.name,
    type: 'DLMM',
    
    // Financial Data
    tvl: parseFloat(tvl.toFixed(2)),
    volume_24h: parseFloat(pool.trade_volume_24h || 0),
    volume_7d: parseFloat(pool.cumulative_trade_volume || 0), // Approximation
    fees_24h: fees24h,
    fees_7d: fees24h * 7, // Approximation
    
    // Pricing
    current_price: parseFloat(pool.current_price || 0),
    price_change_24h: 0, // Not available in API
    
    // Pool Parameters
    bin_step: parseInt(pool.bin_step || 0),
    base_fee: parseFloat(pool.base_fee_percentage || 0),
    total_trading_fee: parseFloat(pool.total_fee || 0),
    max_fee: parseFloat(pool.max_fee_rate || 10),
    protocol_fee: parseFloat(pool.protocol_fee || 0),
    
    // APY/APR
    apy: parseFloat(pool.apy || 0),
    apr: parseFloat(pool.apr || 0),
    farm_apy: parseFloat(pool.farm_apy || 0),
    daily_yield: parseFloat(dailyYield.toFixed(2)),
    
    // Tokens
    token0: {
      symbol: token0Symbol || 'UNKNOWN',
      name: token0Symbol || 'Unknown Token',
      mint: pool.mint_x,
      decimals: parseInt(pool.decimals_x || 9),
      price_usd: parseFloat(token0Price.toFixed(6)),
      amount: parseFloat(pool.reserve_x || 0)
    },
    token1: {
      symbol: token1Symbol || 'UNKNOWN',
      name: token1Symbol || 'Unknown Token',
      mint: pool.mint_y,
      decimals: parseInt(pool.decimals_y || 9),
      price_usd: parseFloat(token1Price.toFixed(6)),
      amount: parseFloat(pool.reserve_y || 0)
    },
    
    // Metadata
    pool_url: `https://app.meteora.ag/dlmm/${pool.address}`,
    created_at: pool.created_at || null,
    last_updated: new Date().toISOString(),
    is_active: isActive,
    is_popular: isPopular,
    is_featured: isPopular && tvl > 50000, // Featured if popular + TVL > $50k
    tags: generateTags(pool, tvl, fees24h)
  };
}

function generateTags(pool, tvl, fees24h) {
  const tags = [];
  
  // Volume based
  const volume = parseFloat(pool.trade_volume_24h || 0);
  if (volume > 10000000) tags.push('high-volume');
  else if (volume > 1000000) tags.push('medium-volume');
  
  // TVL based
  if (tvl > 1000000) tags.push('large-pool');
  else if (tvl > 100000) tags.push('medium-pool');
  
  // Yield based
  const dailyYield = calculateDailyYield(fees24h, tvl);
  if (dailyYield > 1) tags.push('high-yield');
  
  // Token type
  const name = pool.name.toUpperCase();
  if (name.includes('USDC') || name.includes('USDT')) tags.push('stablecoin');
  if (name.includes('SOL')) tags.push('sol-pair');
  if (name.includes('BTC') || name.includes('ETH')) tags.push('major-pair');
  
  // Activity
  if (volume > 100000) tags.push('active');
  
  return tags;
}

// ============================================
// FILTERING & SORTING
// ============================================

function filterPools(pools, options = {}) {
  let filtered = [...pools];
  
  // Filter out inactive pools
  if (options.activeOnly !== false) {
    filtered = filtered.filter(p => p.is_active);
  }
  
  // Filter by minimum TVL
  const minTVL = options.minTVL || 1000;
  filtered = filtered.filter(p => p.tvl >= minTVL);
  
  // Filter by minimum volume
  const minVolume = options.minVolume || 0;
  filtered = filtered.filter(p => p.volume_24h >= minVolume);
  
  return filtered;
}

function sortPools(pools, sortBy = 'volume') {
  const sorted = [...pools];
  
  switch (sortBy) {
    case 'volume':
      return sorted.sort((a, b) => b.volume_24h - a.volume_24h);
    case 'tvl':
      return sorted.sort((a, b) => b.tvl - a.tvl);
    case 'fees':
      return sorted.sort((a, b) => b.fees_24h - a.fees_24h);
    case 'apy':
      return sorted.sort((a, b) => b.apy - a.apy);
    case 'yield':
      return sorted.sort((a, b) => b.daily_yield - a.daily_yield);
    default:
      return sorted;
  }
}

function getTopPools(pools, count = 50) {
  // Sort by volume and get top N
  const byVolume = sortPools(pools, 'volume').slice(0, count);
  
  // Also include top TVL pools not already in list
  const byTVL = sortPools(pools, 'tvl')
    .filter(p => !byVolume.find(v => v.id === p.id))
    .slice(0, Math.floor(count * 0.3)); // Add 30% more from TVL
  
  return [...byVolume, ...byTVL];
}

// ============================================
// STATISTICS
// ============================================

function generateStatistics(pools) {
  const totalTVL = pools.reduce((sum, p) => sum + p.tvl, 0);
  const totalVolume24h = pools.reduce((sum, p) => sum + p.volume_24h, 0);
  const totalFees24h = pools.reduce((sum, p) => sum + p.fees_24h, 0);
  
  const avgTVL = totalTVL / pools.length;
  const avgVolume = totalVolume24h / pools.length;
  const avgAPY = pools.reduce((sum, p) => sum + p.apy, 0) / pools.length;
  
  return {
    total_pools: pools.length,
    total_tvl: parseFloat(totalTVL.toFixed(2)),
    total_volume_24h: parseFloat(totalVolume24h.toFixed(2)),
    total_fees_24h: parseFloat(totalFees24h.toFixed(2)),
    avg_tvl: parseFloat(avgTVL.toFixed(2)),
    avg_volume_24h: parseFloat(avgVolume.toFixed(2)),
    avg_apy: parseFloat(avgAPY.toFixed(2)),
    active_pools: pools.filter(p => p.is_active).length,
    popular_pools: pools.filter(p => p.is_popular).length,
    featured_pools: pools.filter(p => p.is_featured).length
  };
}

// ============================================
// FILE OPERATIONS
// ============================================

function ensureDirectory(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
}

function saveToFile(data, filename) {
  try {
    ensureDirectory(path.dirname(filename));
    fs.writeFileSync(filename, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`💾 Saved to: ${filename}`);
  } catch (error) {
    console.error('❌ Error saving file:', error.message);
    throw error;
  }
}

function saveSummary(pools, filename) {
  const summary = pools.map(p => ({
    pair: p.pair,
    tvl: `$${(p.tvl / 1000).toFixed(1)}K`,
    volume_24h: `$${(p.volume_24h / 1000000).toFixed(2)}M`,
    apy: `${p.apy.toFixed(1)}%`,
    tags: p.tags.join(', ')
  }));
  
  saveToFile(summary, filename);
}

// ============================================
// MAIN FUNCTION
// ============================================

async function main() {
  console.log('🚀 Starting Meteora Pool Data Collection...\n');
  
  try {
    // Step 1: Fetch all pools
    const rawPools = await fetchAllDLMMPools();
    
    if (!rawPools || rawPools.length === 0) {
      throw new Error('No pools fetched from API');
    }
    
    // Step 2: Extract unique token mints
    const tokenMints = [...new Set(
      rawPools.flatMap(p => [p.mint_x, p.mint_y])
    )].filter(Boolean);
    
    console.log(`\n🔍 Found ${tokenMints.length} unique tokens`);
    
    // Step 3: Fetch token prices
    await sleep(DELAY_MS);
    const prices = await fetchTokenPrices(tokenMints);
    
    // Step 4: Transform pools
    console.log('\n🔄 Transforming pool data...');
    const transformedPools = rawPools.map(pool => 
      transformPool(pool, prices)
    );
    
    // Step 5: Filter and sort
    console.log('\n🔍 Filtering pools...');
    const activePools = filterPools(transformedPools, {
      activeOnly: true,
      minTVL: 1000,
      minVolume: 0
    });
    
    console.log(`✅ ${activePools.length} active pools (from ${transformedPools.length} total)`);
    
    // Step 6: Get top pools
    const topPools = getTopPools(activePools, 50);
    console.log(`🏆 Selected top ${topPools.length} pools`);
    
    // Step 7: Generate statistics
    const stats = generateStatistics(topPools);
    console.log('\n📊 Statistics:');
    console.log(`   Total TVL: $${(stats.total_tvl / 1000000).toFixed(2)}M`);
    console.log(`   Total Volume 24h: $${(stats.total_volume_24h / 1000000).toFixed(2)}M`);
    console.log(`   Total Fees 24h: $${(stats.total_fees_24h / 1000).toFixed(2)}K`);
    console.log(`   Average APY: ${stats.avg_apy.toFixed(2)}%`);
    
    // Step 8: Save output files
    console.log('\n💾 Saving files...');
    
    // Main pools file
    const output = {
      meta: {
        generated_at: new Date().toISOString(),
        source: 'Meteora DLMM API',
        api_url: METEORA_API,
        version: '1.0.0'
      },
      statistics: stats,
      pools: topPools
    };
    
    saveToFile(output, OUTPUT_FILE);
    
    // Summary file (human-readable)
    const summaryFile = path.join(OUTPUT_DIR, 'pools-summary.json');
    saveSummary(topPools, summaryFile);
    
    // Top 10 by volume (for quick reference)
    const top10File = path.join(OUTPUT_DIR, 'pools-top10.json');
    const top10 = sortPools(topPools, 'volume').slice(0, 10);
    saveToFile({ pools: top10 }, top10File);
    
    console.log('\n✅ Data collection complete!');
    console.log(`📁 Files saved in: ${OUTPUT_DIR}`);
    console.log(`   - pools.json (${topPools.length} pools, complete data)`);
    console.log(`   - pools-summary.json (readable summary)`);
    console.log(`   - pools-top10.json (top 10 by volume)`);
    
  } catch (error) {
    console.error('\n❌ Error in main process:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// ============================================
// EXECUTION
// ============================================

if (require.main === module) {
  main();
}

// Export for testing
module.exports = {
  fetchAllDLMMPools,
  fetchTokenPrices,
  transformPool,
  filterPools,
  sortPools,
  getTopPools,
  generateStatistics
};