// ============================================
// METEORA CALCULATOR API - Cloudflare Worker
// Optimized for KV free tier (1000 puts/day)
// ============================================

const CONFIG = {
  METEORA_API: 'https://dlmm-api.meteora.ag',
  JUPITER_PRICE_API: 'https://api.jup.ag/price/v2',
  CACHE_TTL: 900,           // 15 minutes (reduced KV writes: ~96/day vs 480/day)
  MIN_TVL: 500,
  FETCH_LIMIT: 250,
  MAX_TOP_N: 500,
  REQUEST_TIMEOUT: 25000,
  // Meteora API: 30 RPS limit
  FETCH_DELAY_MS: 100,      // 100ms between requests = max 10 RPS (safe margin)
  // Opsi 3: Smart merge ratios
  MERGE_RATIO: {
    VOLUME: 0.35,     // 35% top volume pools
    YIELD: 0.25,      // 25% top yield pools
    TRENDING: 0.20,   // 20% trending by daily yield
    NEWEST: 0.20,     // 20% newest pools
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

async function fetchMeteoraPage(sortKey, limit, page = 0) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT);

  try {
    const url = `${CONFIG.METEORA_API}/pair/all_with_pagination?page=${page}&limit=${limit}&sort_key=${sortKey}&order_by=desc`;
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Meteora-Calculator-API/1.0' },
    });

    if (!response.ok) {
      throw new Error(`Meteora API returned ${response.status}`);
    }

    const raw = await response.json();
    return raw.pairs || raw.data || (Array.isArray(raw) ? raw : []);
  } finally {
    clearTimeout(timeout);
  }
}

function smartMerge(byVolume, byYield, byTrending, byNewest) {
  const TARGET_COUNT = 250;
  const counts = {
    volume: Math.floor(TARGET_COUNT * CONFIG.MERGE_RATIO.VOLUME),
    yield: Math.floor(TARGET_COUNT * CONFIG.MERGE_RATIO.YIELD),
    trending: Math.floor(TARGET_COUNT * CONFIG.MERGE_RATIO.TRENDING),
    newest: Math.floor(TARGET_COUNT * CONFIG.MERGE_RATIO.NEWEST),
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

  addPools(byVolume, counts.volume);
  addPools(byYield, counts.yield);
  addPools(byTrending, counts.trending);
  addPools(byNewest, counts.newest);

  const remaining = TARGET_COUNT - merged.length;
  if (remaining > 0) {
    const all = [...byVolume, ...byYield, ...byTrending, ...byNewest];
    addPools(all, remaining);
  }

  return merged;
}

async function fetchMeteoraPoolsRaw() {
  // Sequential fetch with delays to respect Meteora 30 RPS limit
  const byVolume = await fetchMeteoraPage('volume', 150);
  await delay(CONFIG.FETCH_DELAY_MS);

  const byYield = await fetchMeteoraPage('feetvlratio', 150);
  await delay(CONFIG.FETCH_DELAY_MS);

  const byTrending = await fetchMeteoraPage('trade_volume_24h', 100);
  await delay(CONFIG.FETCH_DELAY_MS);

  const byNewest = await fetchMeteoraPage('updated_at', 100);

  return smartMerge(byVolume, byYield, byTrending, byNewest);
}

function transformPool(pool) {
  const tvl = parseFloat(pool.liquidity || 0);
  const volume24h = parseFloat(pool.trade_volume_24h || 0);
  const fees24h = parseFloat(pool.fees_24h || 0);
  const dailyYield = tvl > 0 ? (fees24h / tvl) * 100 : 0;

  const reserveX = parseFloat(pool.reserve_x_amount || 0);
  const reserveY = parseFloat(pool.reserve_y_amount || 0);
  const decimalsX = parseInt(pool.decimals_x || 9);
  const decimalsY = parseInt(pool.decimals_y || 6);
  const reserveXNorm = reserveX / Math.pow(10, decimalsX);
  const reserveYNorm = reserveY / Math.pow(10, decimalsY);

  return {
    id: pool.address,
    pair: pool.name,
    type: 'DLMM',
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
    pool_url: `https://app.meteora.ag/dlmm/${pool.address}`,
    is_active: tvl > CONFIG.MIN_TVL,
    last_updated: new Date().toISOString(),
  };
}

async function fetchAllPools(env) {
  const cached = await getCached('all_pools', env);
  if (cached) return cached;

  const rawPools = await fetchMeteoraPoolsRaw();
  const pools = rawPools
    .map(transformPool)
    .filter(p => p.is_active)
    .sort((a, b) => b.volume_24h - a.volume_24h);

  await setCache('all_pools', pools, env);
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
      merge_strategy: 'volume_yield_trending_newest',
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
