// Simplified version - no external fetch calls
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

function successResponse(data, meta = {}) {
  return new Response(JSON.stringify({
    success: true,
    data,
    meta: {
      cache_ttl: 180,
      version: '1.0.0-simple',
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

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    // Health endpoint - no KV, no external fetch
    if (url.pathname === '/api/health' || url.pathname === '/api/health/') {
      return successResponse({
        status: 'healthy',
        uptime: 'operational',
        cache_status: env.POOL_CACHE ? 'available' : 'no_kv',
        note: 'Simplified version without external fetches',
      });
    }

    // Root endpoint
    if (url.pathname === '/' || url.pathname === '') {
      return new Response(JSON.stringify({
        name: 'Meteora Calculator API (Simplified)',
        version: '1.0.0-simple',
        status: 'testing',
        note: 'This is a simplified version to test deployment',
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...CORS_HEADERS,
        },
      });
    }

    return successResponse({
      error: 'Not found',
    }, { status: 404 });
  },
};
