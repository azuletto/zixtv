// public/sw.js
const CACHE_NAME = 'zix-proxy-v1';

self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  
  // Intercepta chamadas para o proxy interno
  if (url.includes('/api/proxy-m3u')) {
    event.respondWith(handleProxyRequest(event.request));
  }
});

async function handleProxyRequest(request) {
  try {
    const body = await request.json();
    const targetUrl = body.url;
    
    if (!targetUrl) {
      return new Response(JSON.stringify({ error: 'URL required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Service Worker pode fazer requisição HTTP sem CORS!
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'ZixTV/1.0'
      }
    });
    
    const content = await response.text();
    
    return new Response(content, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}