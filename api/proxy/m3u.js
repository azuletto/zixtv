function resolveTargetUrl(req) {
  if (req.method === 'GET') {
    return req.query?.url;
  }

  if (req.method === 'POST') {
    if (typeof req.body === 'string') {
      try {
        const parsed = JSON.parse(req.body);
        return parsed?.url;
      } catch (_) {
        return null;
      }
    }
    return req.body?.url;
  }

  return null;
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

    const upstreamResponse = await fetch(targetUrl, {
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
