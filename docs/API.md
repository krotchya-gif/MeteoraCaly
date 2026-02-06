# API Documentation

## Meteora DLMM Calculator API

Base URL: `https://meteora-calculator-api.YOUR_ACCOUNT.workers.dev`

---

## Table of Contents

1. [Authentication](#authentication)
2. [Endpoints](#endpoints)
3. [Data Models](#data-models)
4. [Rate Limiting](#rate-limiting)
5. [Error Handling](#error-handling)
6. [Examples](#examples)

---

## Authentication

**No authentication required.** All endpoints are publicly accessible.

---

## Endpoints

### 1. Get All Pools

Retrieve all available DLMM pools.

```
GET /api/pools
```

#### Response

```json
{
  "pools": [
    {
      "address": "5Z66YYYfXT...",
      "name": "BFS/SOL",
      "mint_x": "BFSnj3d...",
      "mint_y": "So11111...",
      "liquidity": 1500000.50,
      "trade_volume_24h": 500000.25,
      "fee_24h": 2500.75,
      "bin_step": 25,
      "base_fee_percentage": "0.25",
      "protocol_fee_percentage": "0.05"
    }
  ],
  "count": 50,
  "timestamp": "2026-02-06T12:00:00.000Z"
}
```

#### Caching
- KV Cache: 5 minutes
- Browser Cache: Recommended 1 minute

---

### 2. Get Single Pool

Retrieve details for a specific pool.

```
GET /api/pool/:address
```

#### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| address | string | Yes | Pool public key address |

#### Response

```json
{
  "pool": {
    "address": "5Z66YYYfXT...",
    "name": "BFS/SOL",
    "mint_x": "BFSnj3d...",
    "mint_y": "So11111...",
    "liquidity": 1500000.50,
    "trade_volume_24h": 500000.25,
    "fee_24h": 2500.75,
    "bin_step": 25,
    "base_fee_percentage": "0.25",
    "protocol_fee_percentage": "0.05",
    "current_price": 0.0025,
    "bins": [...]
  },
  "timestamp": "2026-02-06T12:00:00.000Z"
}
```

#### Error Response

```json
{
  "error": "Pool not found",
  "address": "invalid_address",
  "timestamp": "2026-02-06T12:00:00.000Z"
}
```

---

### 3. Get Top N Pools

Retrieve top pools by trading volume.

```
GET /api/pools/top/:n
```

#### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| n | integer | Yes | Number of pools (1-50) |

#### Response

```json
{
  "pools": [...],
  "count": 10,
  "sorted_by": "trade_volume_24h",
  "timestamp": "2026-02-06T12:00:00.000Z"
}
```

---

### 4. Search Pools

Search pools by token symbol or name.

```
GET /api/pools/search?q={query}
```

#### Query Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| q | string | Yes | Search query (min 2 chars) |

#### Response

```json
{
  "pools": [...],
  "count": 5,
  "query": "BFS",
  "timestamp": "2026-02-06T12:00:00.000Z"
}
```

---

### 5. Health Check

Check API status.

```
GET /api/health
```

#### Response

```json
{
  "status": "ok",
  "version": "1.0.0",
  "uptime": 3600,
  "cache": {
    "status": "operational",
    "ttl": 300
  },
  "timestamp": "2026-02-06T12:00:00.000Z"
}
```

---

## Data Models

### Pool Object

```typescript
interface Pool {
  address: string;              // Pool public key
  name: string;                 // Display name (e.g., "BFS/SOL")
  mint_x: string;               // Token X mint address
  mint_y: string;               // Token Y mint address
  liquidity: number;            // Total liquidity in USD
  trade_volume_24h: number;     // 24h trading volume in USD
  fee_24h: number;              // 24h fees earned in USD
  bin_step: number;             // Price bin step size
  base_fee_percentage: string;  // Base fee percentage
  protocol_fee_percentage: string; // Protocol fee percentage
  current_price?: number;       // Current price (optional)
  bins?: Bin[];                 // Price bins (optional)
}
```

### Bin Object

```typescript
interface Bin {
  bin_id: number;     // Bin identifier
  price: number;      // Bin price
  liquidity_x: number; // Token X liquidity
  liquidity_y: number; // Token Y liquidity
}
```

### Error Object

```typescript
interface ApiError {
  error: string;           // Error message
  code?: string;           // Error code (optional)
  details?: any;           // Additional details (optional)
  timestamp: string;       // ISO 8601 timestamp
}
```

---

## Rate Limiting

### Limits

- **Per IP:** 100 requests per minute
- **Burst:** 10 requests per second
- **Global:** No global limit

### Headers

Response includes rate limit headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1638360000
```

### Exceeded Response

```json
{
  "error": "Rate limit exceeded",
  "limit": 100,
  "reset": 1638360000,
  "timestamp": "2026-02-06T12:00:00.000Z"
}
```

**HTTP Status:** 429 Too Many Requests

---

## Error Handling

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 400 | Bad Request | Invalid parameters |
| 404 | Not Found | Resource not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Upstream API down |

### Error Response Format

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "parameter_name",
    "issue": "description"
  },
  "timestamp": "2026-02-06T12:00:00.000Z"
}
```

### Common Errors

#### Invalid Pool Address
```json
{
  "error": "Pool not found",
  "code": "POOL_NOT_FOUND",
  "address": "invalid_address"
}
```

#### Invalid Search Query
```json
{
  "error": "Query too short",
  "code": "INVALID_QUERY",
  "details": {
    "min_length": 2,
    "provided": 1
  }
}
```

#### Upstream API Error
```json
{
  "error": "Failed to fetch from Meteora API",
  "code": "UPSTREAM_ERROR",
  "details": {
    "attempts": 3,
    "last_error": "Connection timeout"
  }
}
```

---

## Examples

### JavaScript/TypeScript

```javascript
// Fetch all pools
const response = await fetch('https://api.meteora-calculator.com/api/pools');
const { pools } = await response.json();

// Get single pool
const pool = await fetch(`https://api.meteora-calculator.com/api/pool/${address}`)
  .then(res => res.json());

// Search pools
const results = await fetch(
  `https://api.meteora-calculator.com/api/pools/search?q=BFS`
).then(res => res.json());

// With error handling
try {
  const response = await fetch('https://api.meteora-calculator.com/api/pools');
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }
  
  const { pools } = await response.json();
  console.log(`Loaded ${pools.length} pools`);
  
} catch (error) {
  console.error('API Error:', error.message);
}
```

### Python

```python
import requests

# Fetch all pools
response = requests.get('https://api.meteora-calculator.com/api/pools')
pools = response.json()['pools']

# Get single pool
pool = requests.get(
    f'https://api.meteora-calculator.com/api/pool/{address}'
).json()['pool']

# Search pools
results = requests.get(
    'https://api.meteora-calculator.com/api/pools/search',
    params={'q': 'BFS'}
).json()

# With error handling
try:
    response = requests.get('https://api.meteora-calculator.com/api/pools')
    response.raise_for_status()
    pools = response.json()['pools']
    print(f'Loaded {len(pools)} pools')
    
except requests.exceptions.HTTPError as e:
    print(f'API Error: {e.response.json()["error"]}')
```

### cURL

```bash
# Get all pools
curl https://api.meteora-calculator.com/api/pools

# Get single pool
curl https://api.meteora-calculator.com/api/pool/5Z66YYYfXT...

# Get top 10 pools
curl https://api.meteora-calculator.com/api/pools/top/10

# Search pools
curl "https://api.meteora-calculator.com/api/pools/search?q=BFS"

# Health check
curl https://api.meteora-calculator.com/api/health
```

---

## Caching Strategy

### Client-Side Caching

Recommended implementation:

```javascript
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function fetchPools() {
  const cached = localStorage.getItem('pools_cache');
  
  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < CACHE_TTL) {
      return data;
    }
  }
  
  const response = await fetch('/api/pools');
  const data = await response.json();
  
  localStorage.setItem('pools_cache', JSON.stringify({
    data,
    timestamp: Date.now()
  }));
  
  return data;
}
```

### Server-Side Caching

The API automatically caches responses in Cloudflare KV:

- **TTL:** 5 minutes
- **Key Format:** `pools:{endpoint}:{params}`
- **Invalidation:** Automatic after TTL

---

## Best Practices

### 1. Use Caching
```javascript
// ✅ Good - uses cache
const pools = await fetchPoolsWithCache();

// ❌ Bad - fetches every time
const pools = await fetch('/api/pools').then(r => r.json());
```

### 2. Handle Errors
```javascript
// ✅ Good - handles errors
try {
  const data = await fetchPools();
} catch (error) {
  showErrorMessage(error);
}

// ❌ Bad - no error handling
const data = await fetchPools();
```

### 3. Respect Rate Limits
```javascript
// ✅ Good - batches requests
const pools = await fetch('/api/pools');

// ❌ Bad - individual requests
for (const id of ids) {
  await fetch(`/api/pool/${id}`);
}
```

### 4. Use Appropriate Endpoints
```javascript
// ✅ Good - uses search
const results = await fetch('/api/pools/search?q=BFS');

// ❌ Bad - filters client-side
const all = await fetch('/api/pools');
const results = all.pools.filter(p => p.name.includes('BFS'));
```

---

## Webhooks

**Not supported yet.** Subscribe to our newsletter for updates.

---

## SDKs

### Official
- JavaScript/TypeScript: Coming soon

### Community
- Python: Coming soon
- Rust: Coming soon

---

## Changelog

See [CHANGELOG.md](../CHANGELOG.md) for API version history.

---

## Support

- **Issues:** [GitHub Issues](https://github.com/your-username/meteora-calculator/issues)
- **Email:** support@meteora-calculator.com
- **Discord:** [Join our community](#)

---

*Last updated: February 6, 2026*
