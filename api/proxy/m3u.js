function parseUrlFromRawString(raw) {
  if (!raw || typeof raw !== 'string') return null;

  const trimmed = raw.trim();
  if (!trimmed) return null;

  try {
    const parsedJson = JSON.parse(trimmed);
    if (parsedJson && typeof parsedJson.url === 'string') {
      return parsedJson.url;
    }
  } catch (_) {
  }

  const queryMatch = trimmed.match(/(?:^|[?&])url=([^&]+)/i);
  if (queryMatch?.[1]) {
    try {
      return decodeURIComponent(queryMatch[1]);
    } catch (_) {
      return queryMatch[1];
    }
  }

  return trimmed;
}

function resolveTargetUrl(req) {
  let candidate = req.query?.url || req.body?.url || null;

  if (!candidate && typeof req.url === 'string') {
    const urlFromPath = parseUrlFromRawString(req.url);
    if (urlFromPath && urlFromPath.includes('http')) {
      candidate = urlFromPath;
    }
  }

  if (!candidate && typeof req.body === 'string') {
    candidate = parseUrlFromRawString(req.body);
  }

  if (!candidate && Buffer.isBuffer(req.body)) {
    candidate = parseUrlFromRawString(req.body.toString('utf8'));
  }

  if (typeof candidate !== 'string') return null;

  const normalized = candidate.trim();
  if (!normalized) return null;

  if (/^https?%3a/i.test(normalized)) {
    try {
      return decodeURIComponent(normalized);
    } catch (_) {
      return normalized;
    }
  }

  return normalized;
}

function isValidTarget(url) {
  if (!url || typeof url !== 'string') return false;

  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const targetUrl = resolveTargetUrl(req);

    if (!isValidTarget(targetUrl)) {
      return res.status(400).json({ error: 'URL invalida. Informe uma URL http/https.' });
    }

    // Tenta vários proxies em sequência
    const proxies = [
      `https://cors-anywhere.herokuapp.com/${targetUrl}`,
      `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
      `https://proxy.cors.sh/${targetUrl}`,
      `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`
    ];

    let lastError = null;

    for (const proxyUrl of proxies) {
      try {
        console.log('[Proxy] Tentando:', proxyUrl.substring(0, 50) + '...');

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos

        const response = await fetch(proxyUrl, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': '*/*'
          }
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const content = await response.text();
          
          if (content && content.length > 0) {
            console.log('[Proxy] Sucesso! Tamanho:', content.length, 'bytes');
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            return res.status(200).send(content);
          }
        } else {
          console.log('[Proxy] Falhou com status:', response.status);
        }
      } catch (error) {
        console.log('[Proxy] Erro:', error.message);
        lastError = error;
      }
    }

    return res.status(408).json({ 
      error: 'Todos os proxies falharam. A playlist pode ser muito grande ou inacessivel.',
      details: lastError?.message 
    });

  } catch (error) {
    console.error('[Proxy] Erro fatal:', error.message);
    res.status(500).json({ error: `Erro no proxy: ${error.message}` });
  }
};