/**
 * Enhanced Caching System with localStorage
 * Provides multi-layer caching with TTL and validation
 */

const CACHE_VERSION = '1.0';
const DEFAULT_TTL = 180000; // 3 minutes in milliseconds

/**
 * Cache key prefix to avoid conflicts
 */
function getCacheKey(key) {
  return `meteora_cache_${CACHE_VERSION}_${key}`;
}

/**
 * Get item from cache
 * @param {string} key - Cache key
 * @param {number} ttl - Time to live in milliseconds
 * @returns {any} Cached data or null if expired/not found
 */
export function getCached(key, ttl = DEFAULT_TTL) {
  try {
    const cacheKey = getCacheKey(key);
    const cached = localStorage.getItem(cacheKey);

    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    const age = Date.now() - timestamp;

    if (age > ttl) {
      // Expired - remove from cache
      localStorage.removeItem(cacheKey);
      return null;
    }

    return data;
  } catch (error) {
    console.warn('Cache read error:', error);
    return null;
  }
}

/**
 * Set item in cache
 * @param {string} key - Cache key
 * @param {any} data - Data to cache
 */
export function setCache(key, data) {
  try {
    const cacheKey = getCacheKey(key);
    const cacheData = {
      data,
      timestamp: Date.now(),
      version: CACHE_VERSION,
    };

    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
  } catch (error) {
    console.warn('Cache write error:', error);

    // If quota exceeded, clear old cache
    if (error.name === 'QuotaExceededError') {
      clearOldCache();
      // Try again
      try {
        localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
      } catch {
        // If still fails, ignore
      }
    }
  }
}

/**
 * Remove item from cache
 * @param {string} key - Cache key
 */
export function removeCache(key) {
  try {
    const cacheKey = getCacheKey(key);
    localStorage.removeItem(cacheKey);
  } catch (error) {
    console.warn('Cache remove error:', error);
  }
}

/**
 * Clear all cache with specific prefix
 */
export function clearAllCache() {
  try {
    const keys = Object.keys(localStorage);
    const prefix = `meteora_cache_${CACHE_VERSION}_`;

    keys.forEach((key) => {
      if (key.startsWith(prefix)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.warn('Clear cache error:', error);
  }
}

/**
 * Clear old cache entries (older than 1 hour)
 */
export function clearOldCache() {
  try {
    const keys = Object.keys(localStorage);
    const prefix = `meteora_cache_${CACHE_VERSION}_`;
    const maxAge = 3600000; // 1 hour

    keys.forEach((key) => {
      if (key.startsWith(prefix)) {
        try {
          const cached = JSON.parse(localStorage.getItem(key));
          const age = Date.now() - cached.timestamp;

          if (age > maxAge) {
            localStorage.removeItem(key);
          }
        } catch {
          // If parse fails, remove the key
          localStorage.removeItem(key);
        }
      }
    });
  } catch (error) {
    console.warn('Clear old cache error:', error);
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  try {
    const keys = Object.keys(localStorage);
    const prefix = `meteora_cache_${CACHE_VERSION}_`;
    const cacheKeys = keys.filter((k) => k.startsWith(prefix));

    let totalSize = 0;
    let oldestTimestamp = Date.now();
    let newestTimestamp = 0;

    cacheKeys.forEach((key) => {
      const item = localStorage.getItem(key);
      totalSize += item.length;

      try {
        const { timestamp } = JSON.parse(item);
        if (timestamp < oldestTimestamp) oldestTimestamp = timestamp;
        if (timestamp > newestTimestamp) newestTimestamp = timestamp;
      } catch {
        // Ignore parse errors
      }
    });

    return {
      count: cacheKeys.length,
      sizeKB: Math.round(totalSize / 1024),
      oldestAge: oldestTimestamp ? Date.now() - oldestTimestamp : 0,
      newestAge: newestTimestamp ? Date.now() - newestTimestamp : 0,
    };
  } catch (error) {
    console.warn('Get cache stats error:', error);
    return { count: 0, sizeKB: 0, oldestAge: 0, newestAge: 0 };
  }
}

/**
 * Fetch with cache
 * Tries cache first, falls back to API, then updates cache
 */
export async function fetchWithCache(url, options = {}, cacheKey, ttl = DEFAULT_TTL) {
  // Try cache first
  const cached = getCached(cacheKey, ttl);
  if (cached) {
    return { data: cached, fromCache: true };
  }

  // Fetch from API
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();

  // Update cache
  setCache(cacheKey, data);

  return { data, fromCache: false };
}

/**
 * Validate cached data structure
 * Ensures all required fields exist
 */
export function validateCachedData(data, requiredFields = []) {
  if (!data) return false;

  for (const field of requiredFields) {
    if (!(field in data)) {
      return false;
    }
  }

  return true;
}

/**
 * Get cached data with fallback
 * Returns cached data if valid, otherwise returns fallback
 */
export function getCachedWithFallback(key, fallback, ttl = DEFAULT_TTL) {
  const cached = getCached(key, ttl);

  if (cached && validateCachedData(cached, Object.keys(fallback))) {
    return cached;
  }

  return fallback;
}

// Auto-cleanup old cache on module load (runs once)
if (typeof window !== 'undefined') {
  setTimeout(() => {
    clearOldCache();
  }, 5000); // Run after 5 seconds
}
