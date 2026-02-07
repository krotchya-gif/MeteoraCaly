// ============================================
// METEORA CALCULATOR API - Cloudflare Worker
// Optimized for 1M writes/month plan (33k writes/day)
// ============================================

const CONFIG = {
  DLMM_API: 'https://dlmm-api.meteora.ag',        // DLMM: 30 RPS
  DAMM_API: 'https://dammv2-api.meteora.ag',      // DAMM V2: 10 RPS
  JUPITER_PRICE_API: 'https://api.jup.ag/price/v2',
  CACHE_TTL: 120,           // 2 minutes (720 writes/day = 2% of 33k limit - ultra fresh!)
  MIN_TVL: 10,
  FETCH_LIMIT: 250,
  MAX_TOP_N: 500,
  REQUEST_TIMEOUT: 25000,
  // Rate limits
  DLMM_DELAY_MS: 100,       // 100ms = 10 RPS (safe margin for 30 RPS limit)
  DAMM_DELAY_MS: 100,       // 100ms = 10 RPS (matches 10 RPS limit)
  // Smart merge ratios
  MERGE_RATIO: {
    DLMM: 0.60,       // 60% DLMM pools (more variety)
    DAMM: 0.40,       // 40% DAMM pools
  },
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

// ============================================
// UTILITIES
// ============================================

function successResponse(data, meta = {}) {
  return new Response(JSON.stringify({
    success: true,
    data,
    meta: {
      cache_ttl: CONFIG.CACHE_TTL,
      version: '1.0.1-kv-optimized',
      ...meta,
    },
    timestamp: new Date().toISOString(),
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
    },
  });
}

function errorResponse(message, status = 500, code = 'INTERNAL_ERROR', meta = {}) {
  return new Response(JSON.stringify({
    success: false,
    error: {
      message,
      code,
    },
    meta: {
      status,
      ...meta,
    },
    timestamp: new Date().toISOString(),
  }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
    },
  });
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
    },
  });
}

// ============================================
// CACHE LAYER (KV-optimized)
// ============================================

async function getCached(key, env) {
  if (!env.POOL_CACHE) return null;

  try {
    const cached = await env.POOL_CACHE.get(key, 'json');
    if (cached && cached.timestamp) {
      const age = (Date.now() - cached.timestamp) / 1000;
      if (age < CONFIG.CACHE_TTL) {
        return cached.data;
      }
    }
  } catch (e) {
    console.error('Cache read error:', e.message);
  }
  return null;
}

async function setCache(key, data, env) {
  if (!env.POOL_CACHE) return;

  try {
    await env.POOL_CACHE.put(key, JSON.stringify({
      data,
      timestamp: Date.now(),
    }), {
      expirationTtl: CONFIG.CACHE_TTL * 2,
    });
  } catch (e) {
    // Silently fail on KV write errors (429 when over limit)
    console.error('Cache write error (non-fatal):', e.message);
  }
}

// ============================================
// METEORA API FETCHING (30 RPS rate limit)
// ============================================

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Fetch DLMM pools (30 RPS limit)
async function fetchDLMMPage(sortKey, limit, page = 0) {
  const url = `${CONFIG.DLMM_API}/pair/all_with_pagination?page=${page}&limit=${limit}&sort_key=${sortKey}&order_by=desc`;
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Meteora-Calculator-API/1.0' },
  });

  if (!response.ok) {
    throw new Error(`DLMM API returned ${response.status}`);
  }

  const raw = await response.json();
  return raw.pairs || raw.data || (Array.isArray(raw) ? raw : []);
}

// Fetch DAMM V2 pools (10 RPS limit)
async function fetchDAMMPools() {
  const url = `${CONFIG.DAMM_API}/pools`;
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Meteora-Calculator-API/1.0' },
  });

  if (!response.ok) {
    throw new Error(`DAMM API returned ${response.status}`);
  }

  const raw = await response.json();
  // DAMM API returns array of pools directly
  return Array.isArray(raw) ? raw : (raw.pools || raw.data || []);
}

function smartMerge(dlmmPools, dammPools) {
  const TARGET_COUNT = 250;
  const counts = {
    dlmm: Math.floor(TARGET_COUNT * CONFIG.MERGE_RATIO.DLMM),  // 60% = 150 pools
    damm: Math.floor(TARGET_COUNT * CONFIG.MERGE_RATIO.DAMM),  // 40% = 100 pools
  };

  const seen = new Set();
  const merged = [];

  const addPools = (pools, limit) => {
    let added = 0;
    for (const pool of pools) {
      if (added >= limit) break;
      if (pool.address && !seen.has(pool.address)) {
        seen.add(pool.address);
        merged.push(pool);
        added++;
      }
    }
    return added;
  };

  // Add DLMM pools (150)
  addPools(dlmmPools, counts.dlmm);

  // Add DAMM pools (100)
  addPools(dammPools, counts.damm);

  // Fill remaining slots with any pools
  const remaining = TARGET_COUNT - merged.length;
  if (remaining > 0) {
    const all = [...dlmmPools, ...dammPools];
    addPools(all, remaining);
  }

  return merged;
}

async function fetchMeteoraPoolsRaw() {
  // Fetch DLMM pools (30 RPS limit) - prioritize by yield for better selection
  const dlmmRaw = await fetchDLMMPage('feetvlratio', 200);
  await delay(CONFIG.DLMM_DELAY_MS);

  // Fetch DAMM V2 pools (10 RPS limit)
  const dammRaw = await fetchDAMMPools();
  await delay(CONFIG.DAMM_DELAY_MS);

  // Tag pools with type before merging (remove existing type field to avoid conflicts)
  const dlmm = dlmmRaw.map(p => { const { type, ...rest } = p; return { ...rest, pool_type: 'DLMM' }; });
  const damm = dammRaw.map(p => { const { type, ...rest } = p; return { ...rest, pool_type: 'DAMM' }; });

  // Merge DLMM (60%) and DAMM (40%) pools
  return smartMerge(dlmm, damm);
}

function transformPool(pool, poolType = null) {
  // Determine type by checking pool properties (DAMM pools don't have bin_step)
  let detectedType;
  if (poolType) {
    detectedType = poolType;
  } else if (pool.pool_address && !pool.address) {
    // DAMM pools use pool_address instead of address
    detectedType = 'DAMM';
  } else if (pool.isDamm || pool.pool_type === 0) {
    // DAMM V2 specific check
    detectedType = 'DAMM';
  } else {
    // Default to DLMM
    detectedType = 'DLMM';
  }

  const tvl = parseFloat(pool.liquidity || pool.tvl || 0);
  const volume24h = parseFloat(pool.trade_volume_24h || pool.volume_24h || 0);
  const fees24h = parseFloat(pool.fees_24h || pool.fee_24h || 0);
  const dailyYield = tvl > 0 ? (fees24h / tvl) * 100 : 0;

  const reserveX = parseFloat(pool.reserve_x_amount || pool.reserve_x || 0);
  const reserveY = parseFloat(pool.reserve_y_amount || pool.reserve_y || 0);
  const decimalsX = parseInt(pool.decimals_x || pool.token_x_decimals || 9);
  const decimalsY = parseInt(pool.decimals_y || pool.token_y_decimals || 6);
  const reserveXNorm = reserveX / Math.pow(10, decimalsX);
  const reserveYNorm = reserveY / Math.pow(10, decimalsY);

  // Create result object step by step to avoid any property conflicts
  const result = {
    id: pool.address || pool.pool_address,
    pair: pool.name || pool.pool_name || 'UNKNOWN',
    tvl: parseFloat(tvl.toFixed(2)),
    volume_24h: parseFloat(volume24h.toFixed(2)),
    fees_24h: parseFloat(fees24h.toFixed(2)),
    current_price: parseFloat(pool.current_price || 0),
    bin_step: parseInt(pool.bin_step || 0),
    base_fee: parseFloat(pool.base_fee_percentage || 0),
    total_trading_fee: parseFloat(pool.base_fee_percentage || 0),
    apy: parseFloat(pool.apy || 0),
    apr: parseFloat(pool.apr || 0),
    farm_apy: parseFloat(pool.farm_apy || 0),
    daily_yield: parseFloat(dailyYield.toFixed(4)),
    token0: {
      symbol: (pool.name || '').split('-')[0] || 'UNKNOWN',
      mint: pool.mint_x,
      decimals: decimalsX,
      reserve: reserveXNorm,
      price_usd: reserveXNorm > 0 ? (tvl / 2) / reserveXNorm : 0,
    },
    token1: {
      symbol: (pool.name || '').split('-')[1] || 'UNKNOWN',
      mint: pool.mint_y,
      decimals: decimalsY,
      reserve: reserveYNorm,
      price_usd: reserveYNorm > 0 ? (tvl / 2) / reserveYNorm : 0,
    },
    pool_url: detectedType === 'DAMM'
      ? `https://app.meteora.ag/pools/${pool.address || pool.pool_address}`
      : `https://app.meteora.ag/dlmm/${pool.address}`,
    is_active: tvl > CONFIG.MIN_TVL,
    last_updated: new Date().toISOString(),
  };

  // Add type field with the detected type
  result.type = detectedType;

  return result;
}

async function fetchAllPools(env) {
  const cached = await getCached('all_pools_v13', env);
  if (cached) return cached;

  // Fetch DLMM pages (200 per page, 2 pages = 400 raw pools)
  const dlmmPage0 = await fetchDLMMPage('feetvlratio', 200, 0);
  await delay(CONFIG.DLMM_DELAY_MS);
  const dlmmPage1 = await fetchDLMMPage('feetvlratio', 200, 1);
  await delay(CONFIG.DLMM_DELAY_MS);
  const dlmmRaw = [...dlmmPage0, ...dlmmPage1];

  const dammRaw = await fetchDAMMPools();
  await delay(CONFIG.DAMM_DELAY_MS);

  // Transform with explicit type parameter
  const dlmmPools = dlmmRaw
    .map(p => transformPool(p, 'DLMM'))
    .filter(p => p.is_active);

  const dammPools = dammRaw
    .map(p => transformPool(p, 'DAMM'))
    .filter(p => p.is_active);

  // Merge and limit to 250 total (60% DLMM + 40% DAMM)
  const dlmmCount = Math.min(dlmmPools.length, 150);
  const dammCount = Math.min(dammPools.length, 100);

  const pools = [
    ...dlmmPools.slice(0, dlmmCount),
    ...dammPools.slice(0, dammCount),
  ].sort((a, b) => b.volume_24h - a.volume_24h);

  await setCache('all_pools_v13', pools, env);
  return pools;
}

// ============================================
// ROUTE HANDLERS
// ============================================

async function handleGetPools(env) {
  const pools = await fetchAllPools(env);

  return successResponse(
    {
      pools,
      count: pools.length,
    },
    {
      last_updated: pools[0]?.last_updated || new Date().toISOString(),
      source: 'meteora_api',
      merge_strategy: 'volume_yield_trending_tvl',
    }
  );
}

async function handleGetPool(poolId, env) {
  if (!poolId || poolId.length < 20) {
    return errorResponse('Invalid pool address', 400, 'INVALID_ADDRESS');
  }

  const pools = await fetchAllPools(env);
  const pool = pools.find(p => p.id === poolId);

  if (!pool) {
    return errorResponse('Pool not found', 404, 'POOL_NOT_FOUND');
  }

  return successResponse(
    { pool },
    { source: 'cache' }
  );
}

async function handleGetTopPools(n, env) {
  const count = Math.min(Math.max(parseInt(n) || 10, 1), CONFIG.MAX_TOP_N);
  const pools = await fetchAllPools(env);
  const topPools = pools.slice(0, count);

  return successResponse(
    {
      pools: topPools,
      count: topPools.length,
    },
    {
      requested: n,
      sorted_by: 'trade_volume_24h',
      max_limit: CONFIG.MAX_TOP_N,
    }
  );
}

async function handleSearchPools(query, env) {
  if (!query || query.length < 2) {
    return errorResponse('Query must be at least 2 characters', 400, 'INVALID_QUERY');
  }

  const pools = await fetchAllPools(env);
  const q = query.toUpperCase();
  const results = pools.filter(p =>
    p.pair.toUpperCase().includes(q) ||
    p.token0.symbol.toUpperCase().includes(q) ||
    p.token1.symbol.toUpperCase().includes(q)
  );

  return successResponse(
    {
      pools: results,
      count: results.length,
    },
    {
      query,
      search_in: ['pair', 'token0', 'token1'],
    }
  );
}

async function handleHealth(env) {
  let cacheStatus = 'no_kv';
  if (env.POOL_CACHE) {
    try {
      await env.POOL_CACHE.get('health_check');
      cacheStatus = 'operational';
    } catch {
      cacheStatus = 'kv_limit_exceeded';
    }
  }

  return successResponse(
    {
      status: 'healthy',
      uptime: 'operational',
      cache_status: cacheStatus,
    },
    {
      version: '1.0.1-kv-optimized',
      cache_ttl: CONFIG.CACHE_TTL,
      kv_optimization: 'Rate limiting disabled, cache TTL: 15min',
    }
  );
}

// ============================================
// SUBSCRIBER HANDLERS (KV-optimized)
// ============================================

async function handleSubscribe(chatId, env) {
  if (!chatId) {
    return errorResponse('chatId is required', 400, 'INVALID_REQUEST');
  }

  const key = 'subscribers';
  let existing = [];

  try {
    existing = await env.POOL_CACHE.get(key, 'json') || [];
  } catch (e) {
    console.error('KV read error:', e.message);
  }

  const isNew = !existing.includes(String(chatId));
  if (isNew) {
    existing.push(String(chatId));
    try {
      await env.POOL_CACHE.put(key, JSON.stringify(existing));
    } catch (e) {
      console.error('KV write error (non-fatal):', e.message);
    }
  }

  return successResponse(
    {
      chat_id: chatId,
      subscribed: true,
      is_new: isNew,
    },
    {
      total_subscribers: existing.length,
    }
  );
}

async function handleUnsubscribe(chatId, env) {
  if (!chatId) {
    return errorResponse('chatId is required', 400, 'INVALID_REQUEST');
  }

  const key = 'subscribers';
  let existing = [];

  try {
    existing = await env.POOL_CACHE.get(key, 'json') || [];
  } catch (e) {
    console.error('KV read error:', e.message);
  }

  const updated = existing.filter(id => id !== String(chatId));

  try {
    await env.POOL_CACHE.put(key, JSON.stringify(updated));
  } catch (e) {
    console.error('KV write error (non-fatal):', e.message);
  }

  return successResponse(
    {
      chat_id: chatId,
      subscribed: false,
    },
    {
      total_subscribers: updated.length,
      removed: existing.length > updated.length,
    }
  );
}

async function handleGetSubscribers(env) {
  let subscribers = [];

  try {
    subscribers = await env.POOL_CACHE.get('subscribers', 'json') || [];
  } catch (e) {
    console.error('KV read error:', e.message);
  }

  return successResponse(
    {
      subscribers,
      count: subscribers.length,
    },
    {
      storage: 'kv',
    }
  );
}

async function handleGetTrending(env) {
  const pools = await fetchAllPools(env);

  const trending = [...pools]
    .sort((a, b) => b.daily_yield - a.daily_yield)
    .slice(0, 10);

  return successResponse(
    {
      pools: trending,
      count: trending.length,
    },
    {
      sorted_by: 'daily_yield',
      description: 'Top pools by 24h yield percentage',
    }
  );
}

// ============================================
// ROUTER
// ============================================

function matchRoute(pathname, method) {
  if (pathname === '/api/health') {
    return { handler: 'health' };
  }
  if (pathname === '/api/pools') {
    return { handler: 'pools' };
  }
  if (pathname === '/api/pools/trending') {
    return { handler: 'trending' };
  }
  const topMatch = pathname.match(/^\/api\/pools\/top\/(\d+)$/);
  if (topMatch) {
    return { handler: 'top', params: { n: topMatch[1] } };
  }
  if (pathname === '/api/pools/search') {
    return { handler: 'search' };
  }
  const poolMatch = pathname.match(/^\/api\/pool\/(.+)$/);
  if (poolMatch) {
    return { handler: 'pool', params: { id: poolMatch[1] } };
  }
  const subMatch = pathname.match(/^\/api\/subscribers\/(.+)$/);
  if (subMatch) {
    return { handler: method === 'DELETE' ? 'unsubscribe' : 'subscribe', params: { chatId: subMatch[1] } };
  }
  if (pathname === '/api/subscribers') {
    return { handler: 'getSubscribers' };
  }
  return null;
}

// ============================================
// MAIN HANDLER
// ============================================

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (!['GET', 'POST', 'DELETE'].includes(request.method)) {
      return errorResponse('Method not allowed', 405, 'METHOD_NOT_ALLOWED');
    }

    const url = new URL(request.url);
    const route = matchRoute(url.pathname, request.method);

    if (!route) {
      if (url.pathname === '/' || url.pathname === '') {
        return jsonResponse({
          name: 'Meteora Calculator API',
          version: '1.0.1-kv-optimized',
          kv_optimization: 'Disabled rate limiting, 15min cache TTL',
          meteora_rate_limit: '30 RPS (sequential fetch with 100ms delays)',
          endpoints: [
            'GET /api/pools',
            'GET /api/pool/:address',
            'GET /api/pools/top/:n',
            'GET /api/pools/trending',
            'GET /api/pools/search?q=query',
            'POST /api/subscribers/:chatId',
            'DELETE /api/subscribers/:chatId',
            'GET /api/subscribers',
            'GET /api/health',
          ],
        });
      }
      return errorResponse('Not found', 404, 'NOT_FOUND');
    }

    try {
      switch (route.handler) {
        case 'health':
          return await handleHealth(env);
        case 'pools':
          return await handleGetPools(env);
        case 'pool':
          return await handleGetPool(route.params.id, env);
        case 'top':
          return await handleGetTopPools(route.params.n, env);
        case 'trending':
          return await handleGetTrending(env);
        case 'search': {
          const query = url.searchParams.get('q');
          return await handleSearchPools(query, env);
        }
        case 'subscribe':
          return await handleSubscribe(route.params.chatId, env);
        case 'unsubscribe':
          return await handleUnsubscribe(route.params.chatId, env);
        case 'getSubscribers':
          return await handleGetSubscribers(env);
        default:
          return errorResponse('Not found', 404, 'NOT_FOUND');
      }
    } catch (error) {
      console.error('Handler error:', error.message, error.stack);

      if (error.name === 'AbortError') {
        return errorResponse('Upstream API timeout', 503, 'UPSTREAM_TIMEOUT');
      }

      return errorResponse(
        'Failed to fetch data from Meteora API',
        503,
        'UPSTREAM_ERROR'
      );
    }
  },
};
