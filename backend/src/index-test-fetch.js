// Simple test - minimal fetch to Meteora API
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/test') {
      try {
        // Direct simple fetch without AbortController
        const response = await fetch('https://dlmm-api.meteora.ag/pair/all_with_pagination?page=0&limit=3&sort_key=volume&order_by=desc');

        if (!response.ok) {
          return new Response(JSON.stringify({
            error: 'Fetch failed',
            status: response.status,
            statusText: response.statusText,
          }), {
            status: 500,
            headers: CORS_HEADERS,
          });
        }

        const data = await response.json();

        return new Response(JSON.stringify({
          success: true,
          pools_count: data.pairs?.length || 0,
          first_pool: data.pairs?.[0]?.name || 'none',
        }), {
          status: 200,
          headers: CORS_HEADERS,
        });
      } catch (error) {
        return new Response(JSON.stringify({
          error: 'Exception',
          message: error.message,
          stack: error.stack,
        }), {
          status: 500,
          headers: CORS_HEADERS,
        });
      }
    }

    return new Response(JSON.stringify({
      message: 'Test endpoint: /test',
    }), {
      status: 200,
      headers: CORS_HEADERS,
    });
  },
};
