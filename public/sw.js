// public/sw.js
self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  
  // Se for requisição para playlist (qualquer URL HTTP/HTTPS)
  if (url.includes('/api/playlist-proxy')) {
    event.respondWith(handlePlaylistRequest(event.request));
  }
});

async function handlePlaylistRequest(request) {
  try {
    const body = await request.json();
    const targetUrl = body.url;
    
    if (!targetUrl) {
      return new Response(JSON.stringify({ error: 'URL required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log('[SW] Baixando playlist:', targetUrl);
    
    // Service Worker faz requisição DIRETA (sem CORS!)
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'ZixTV/1.0'
      }
    });
    
    const content = await response.text();
    
    console.log('[SW] Playlist baixada:', content.length, 'bytes');
    
    return new Response(content, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}