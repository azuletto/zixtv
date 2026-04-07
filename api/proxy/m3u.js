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

function buildProxyUrl(targetUrl) {
  return `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

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

    const proxyUrl = buildProxyUrl(targetUrl);

    const upstreamResponse = await fetch(proxyUrl, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': 'ZixTV/1.0 (+https://zix-tv.vercel.app)',
        Accept: '*/*'
      }
    });

    if (!upstreamResponse.ok) {
      return res.status(upstreamResponse.status).json({
        error: `Falha ao buscar playlist remota (${upstreamResponse.status})`
      });
    }

    const content = await upstreamResponse.text();

    if (!content || !content.trim()) {
      return res.status(502).json({ error: 'A URL remota retornou conteudo vazio.' });
    }

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.status(200).send(content);
  } catch (error) {
    res.status(500).json({ error: `Erro no proxy M3U: ${error.message}` });
  }
};