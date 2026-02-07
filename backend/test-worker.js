// Minimal test worker - no dependencies, no KV
export default {
  async fetch(request, env) {
    return new Response(JSON.stringify({
      status: 'ok',
      message: 'Test worker is working!',
      timestamp: new Date().toISOString(),
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  },
};
