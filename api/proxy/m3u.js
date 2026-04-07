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

    // Tamanho do chunk: 4MB (limite seguro da Vercel)
    const CHUNK_SIZE = 4 * 1024 * 1024; // 4MB
    
    // Pega o range do header ou query param
    let start = 0;
    const rangeHeader = req.headers.range || req.query.range;
    
    if (rangeHeader && rangeHeader.startsWith('bytes=')) {
      const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
      if (match) {
        start = parseInt(match[1], 10);
      }
    }

    // Primeira requisição: tenta pegar o tamanho total e os primeiros bytes
    const firstResponse = await fetch(targetUrl, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': 'ZixTV/1.0 (+https://zix-tv.vercel.app)',
        'Accept': '*/*'
      }
    });

    if (!firstResponse.ok) {
      return res.status(firstResponse.status).json({
        error: `Falha ao buscar playlist remota (${firstResponse.status})`
      });
    }

    const fullContent = await firstResponse.text();
    const totalSize = fullContent.length;

    // Se o arquivo é pequeno (< 5MB), retorna tudo de uma vez
    if (totalSize < 5 * 1024 * 1024) {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.status(200).send(fullContent);
    }

    // Para arquivos grandes, retorna em chunks
    const end = Math.min(start + CHUNK_SIZE, totalSize);
    const chunk = fullContent.substring(start, end);
    const hasMore = end < totalSize;

    // Retorna como JSON para o frontend saber se tem mais
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.status(200).json({
      data: chunk,
      hasMore: hasMore,
      nextStart: end,
      total: totalSize,
      start: start,
      end: end
    });

  } catch (error) {
    res.status(500).json({ error: `Erro no proxy M3U: ${error.message}` });
  }
};