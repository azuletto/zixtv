const SW_PROXY_PATH = '/sw-proxy';

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  if (url.pathname === SW_PROXY_PATH) {
    event.respondWith(handleProxyRequest(url));
  }
});

async function handleProxyRequest(url) {
  try {
    const targetUrl = url.searchParams.get('url');
    const type = url.searchParams.get('type') || 'text';

    if (!targetUrl) {
      return jsonResponse({ error: 'URL required' }, 400);
    }

    let parsedTarget;

    try {
      parsedTarget = new URL(targetUrl);
    } catch (_) {
      return jsonResponse({ error: 'Invalid target URL' }, 400);
    }

    if (parsedTarget.protocol !== 'http:' && parsedTarget.protocol !== 'https:') {
      return jsonResponse({ error: 'Only http/https URLs are allowed' }, 400);
    }

    const upstreamResponse = await fetch(parsedTarget.toString(), {
      method: 'GET',
      redirect: 'follow',
      cache: 'no-store'
    });

    if (!upstreamResponse.ok) {
      return jsonResponse({ error: `Upstream request failed (${upstreamResponse.status})` }, upstreamResponse.status);
    }

    const payload = await upstreamResponse.text();

    if (type === 'json') {
      try {
        JSON.parse(payload);
      } catch (_) {
        return jsonResponse({ error: 'Upstream did not return valid JSON' }, 502);
      }

      return new Response(payload, {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store'
        }
      });
    }

    return new Response(payload, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store'
      }
    });
  } catch (error) {
    return jsonResponse({ error: error?.message || 'Service Worker proxy error' }, 500);
  }
}

function jsonResponse(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}