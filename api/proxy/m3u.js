module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Use POST' });
  }

  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL não fornecida' });
    }

    console.log('[API] Baixando playlist:', url);

    // O BACKEND (Vercel) PODE ACESSAR HTTP!
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'ZixTV/1.0'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: `HTTP ${response.status}` 
      });
    }

    const content = await response.text();

    if (!content || content.length === 0) {
      return res.status(502).json({ error: 'Conteúdo vazio' });
    }

    console.log('[API] Sucesso! Tamanho:', content.length, 'bytes');

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.status(200).send(content);
    
  } catch (error) {
    console.error('[API] Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
};