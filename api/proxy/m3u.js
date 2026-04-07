function resolveTargetUrl(req) {
  if (req.body?.url) return req.body.url;
  if (req.query?.url) return req.query.url;
  
  if (typeof req.body === 'string') {
    try {
      const parsed = JSON.parse(req.body);
      if (parsed.url) return parsed.url;
    } catch(e) {}
  }
  
  return null;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Use POST' });
  }

  try {
    const targetUrl = resolveTargetUrl(req);
    
    if (!targetUrl) {
      return res.status(400).json({ error: 'URL não fornecida' });
    }

    // USA UM PROXY CORS QUE FUNCIONA
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
    
    console.log('[Proxy] URL original:', targetUrl);
    console.log('[Proxy] Proxy URL:', proxyUrl);

    const response = await fetch(proxyUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
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
    res.status(500).json({ error: error.message });
  }
};