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

    // USA allorigins.win - MAIS ESTÁVEL
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
    
    console.log('[Proxy] Buscando via allorigins:', targetUrl);

    const response = await fetch(proxyUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'ZixTV/1.0'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Proxy retornou ${response.status}: ${response.statusText}`
      });
    }

    const content = await response.text();

    if (!content || content.length === 0) {
      return res.status(502).json({ error: 'Proxy retornou conteúdo vazio' });
    }

    console.log('[Proxy] Sucesso! Tamanho:', content.length, 'bytes');

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.status(200).send(content);

  } catch (error) {
    console.error('[Proxy] Erro:', error.message);
    res.status(500).json({ error: `Erro no proxy: ${error.message}` });
  }
};