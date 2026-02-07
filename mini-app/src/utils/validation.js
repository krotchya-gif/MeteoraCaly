/**
 * Data Validation Utilities
 * Validates API responses and provides fallback data
 */

/**
 * Fallback pool data when API fails
 */
export const FALLBACK_POOLS = [
  {
    id: 'demo-1',
    pair: 'SOL-USDC',
    type: 'DLMM',
    tvl: 1250000,
    volume_24h: 450000,
    fees_24h: 1350,
    current_price: 95.5,
    bin_step: 25,
    base_fee: 0.3,
    total_trading_fee: 0.3,
    apy: 42.5,
    apr: 38.2,
    farm_apy: 4.3,
    daily_yield: 0.108,
    token0: {
      symbol: 'SOL',
      mint: 'So11111111111111111111111111111111111111112',
      decimals: 9,
      reserve: 13089.47,
      price_usd: 95.5,
    },
    token1: {
      symbol: 'USDC',
      mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      decimals: 6,
      reserve: 625000,
      price_usd: 1.0,
    },
    pool_url: 'https://app.meteora.ag/dlmm/demo-1',
    is_active: true,
    last_updated: new Date().toISOString(),
    _isFallback: true,
  },
  {
    id: 'demo-2',
    pair: 'USDC-USDT',
    type: 'DLMM',
    tvl: 5800000,
    volume_24h: 1200000,
    fees_24h: 3600,
    current_price: 1.0,
    bin_step: 10,
    base_fee: 0.2,
    total_trading_fee: 0.2,
    apy: 22.6,
    apr: 21.4,
    farm_apy: 1.2,
    daily_yield: 0.062,
    token0: {
      symbol: 'USDC',
      mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      decimals: 6,
      reserve: 2900000,
      price_usd: 1.0,
    },
    token1: {
      symbol: 'USDT',
      mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
      decimals: 6,
      reserve: 2900000,
      price_usd: 1.0,
    },
    pool_url: 'https://app.meteora.ag/dlmm/demo-2',
    is_active: true,
    last_updated: new Date().toISOString(),
    _isFallback: true,
  },
  {
    id: 'demo-3',
    pair: 'JTO-SOL',
    type: 'DLMM',
    tvl: 850000,
    volume_24h: 320000,
    fees_24h: 960,
    current_price: 0.032,
    bin_step: 50,
    base_fee: 0.35,
    total_trading_fee: 0.35,
    apy: 52.3,
    apr: 46.8,
    farm_apy: 5.5,
    daily_yield: 0.113,
    token0: {
      symbol: 'JTO',
      mint: 'jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL',
      decimals: 9,
      reserve: 13281250,
      price_usd: 3.2,
    },
    token1: {
      symbol: 'SOL',
      mint: 'So11111111111111111111111111111111111111112',
      decimals: 9,
      reserve: 4450.55,
      price_usd: 95.5,
    },
    pool_url: 'https://app.meteora.ag/dlmm/demo-3',
    is_active: true,
    last_updated: new Date().toISOString(),
    _isFallback: true,
  },
];

/**
 * Required fields for pool data
 */
const REQUIRED_POOL_FIELDS = [
  'id',
  'pair',
  'tvl',
  'volume_24h',
  'fees_24h',
  'apr',
  'token0',
  'token1',
];

const REQUIRED_TOKEN_FIELDS = ['symbol', 'decimals'];

/**
 * Validate single pool object
 */
export function validatePool(pool) {
  if (!pool || typeof pool !== 'object') {
    return false;
  }

  // Check required fields
  for (const field of REQUIRED_POOL_FIELDS) {
    if (!(field in pool)) {
      return false;
    }
  }

  // Validate token0 and token1
  if (!pool.token0 || !pool.token1) {
    return false;
  }

  for (const field of REQUIRED_TOKEN_FIELDS) {
    if (!(field in pool.token0) || !(field in pool.token1)) {
      return false;
    }
  }

  // Validate numeric fields are actually numbers
  const numericFields = ['tvl', 'volume_24h', 'fees_24h', 'apr'];
  for (const field of numericFields) {
    if (typeof pool[field] !== 'number' || isNaN(pool[field])) {
      return false;
    }
  }

  return true;
}

/**
 * Validate array of pools
 */
export function validatePools(pools) {
  if (!Array.isArray(pools) || pools.length === 0) {
    return false;
  }

  return pools.every(validatePool);
}

/**
 * Sanitize pool data - ensure all fields are correct types
 */
export function sanitizePool(pool) {
  const sanitized = { ...pool };

  // Ensure numeric fields
  const numericFields = [
    'tvl',
    'volume_24h',
    'fees_24h',
    'current_price',
    'bin_step',
    'base_fee',
    'apy',
    'apr',
    'farm_apy',
    'daily_yield',
  ];

  numericFields.forEach((field) => {
    if (field in sanitized) {
      sanitized[field] = parseFloat(sanitized[field]) || 0;
    }
  });

  // Ensure token data exists
  if (!sanitized.token0) {
    sanitized.token0 = {
      symbol: 'UNKNOWN',
      decimals: 9,
      reserve: 0,
      price_usd: 0,
    };
  }

  if (!sanitized.token1) {
    sanitized.token1 = {
      symbol: 'UNKNOWN',
      decimals: 6,
      reserve: 0,
      price_usd: 0,
    };
  }

  return sanitized;
}

/**
 * Validate API response structure
 */
export function validateAPIResponse(response) {
  if (!response) return false;

  // Check success field
  if (!('success' in response)) return false;

  // If error, check error structure
  if (!response.success) {
    return 'error' in response;
  }

  // If success, check data structure
  return 'data' in response;
}

/**
 * Extract pools from API response with validation
 */
export function extractPools(apiResponse) {
  // Validate response structure
  if (!validateAPIResponse(apiResponse)) {
    console.warn('Invalid API response structure');
    return null;
  }

  // Handle error response
  if (!apiResponse.success) {
    console.warn('API error:', apiResponse.error);
    return null;
  }

  // Extract pools array
  const pools = apiResponse.data?.pools || apiResponse.data?.pool;

  if (!pools) {
    console.warn('No pools in API response');
    return null;
  }

  // Convert single pool to array
  const poolsArray = Array.isArray(pools) ? pools : [pools];

  // Validate and sanitize each pool
  const validPools = poolsArray
    .filter(validatePool)
    .map(sanitizePool);

  if (validPools.length === 0) {
    console.warn('No valid pools after validation');
    return null;
  }

  return validPools;
}

/**
 * Get pools with fallback
 * Returns valid pools from API or fallback data
 */
export function getPoolsWithFallback(apiResponse, showFallback = true) {
  const pools = extractPools(apiResponse);

  if (pools && pools.length > 0) {
    return pools;
  }

  if (showFallback) {
    console.info('Using fallback pool data');
    return FALLBACK_POOLS;
  }

  return [];
}

/**
 * Validate calculation inputs
 */
export function validateCalculationInputs(inputs) {
  const errors = [];

  if (!inputs.capital || inputs.capital <= 0) {
    errors.push('Capital must be greater than 0');
  }

  if (inputs.capital > 1000000) {
    errors.push('Capital exceeds maximum (1,000,000)');
  }

  if (!inputs.strategy) {
    errors.push('Strategy is required');
  }

  if (!['spot', 'curve', 'bid-ask'].includes(inputs.strategy)) {
    errors.push('Invalid strategy');
  }

  if (inputs.priceChange === undefined || inputs.priceChange === null) {
    errors.push('Price change is required');
  }

  if (inputs.priceChange < -100 || inputs.priceChange > 1000) {
    errors.push('Price change must be between -100% and 1000%');
  }

  return errors;
}

/**
 * Safe number parser with fallback
 */
export function safeParseFloat(value, fallback = 0) {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? fallback : parsed;
}

/**
 * Safe number formatter
 */
export function safeFormatNumber(value, decimals = 2) {
  const num = safeParseFloat(value);
  return num.toFixed(decimals);
}

/**
 * Check if data is fresh (less than 5 minutes old)
 */
export function isDataFresh(timestamp, maxAge = 300000) {
  if (!timestamp) return false;

  const age = Date.now() - new Date(timestamp).getTime();
  return age < maxAge;
}
