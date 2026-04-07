export class M3UParser {
  // ... resto do código igual ...

  async resolveContent(source) {
    if (this.isLikelyM3UContent(source)) {
      return source;
    }

    if (!this.isHttpUrl(source)) {
      throw new Error('Fonte de playlist invalida. Use uma URL http/https ou conteudo M3U valido.');
    }

    // USA A API DA VERCEL (backend)
    try {
      console.log('[M3UParser] Baixando via API Vercel:', source);
      
      const response = await fetch('/api/m3u', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: source })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      const content = await response.text();

      if (!content || !content.trim()) {
        throw new Error('Playlist vazia');
      }

      console.log('[M3UParser] Playlist carregada:', content.length, 'bytes');
      return content;

    } catch (error) {
      throw new Error(`Falha ao carregar playlist: ${error.message}`);
    }
  }
}