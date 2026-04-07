export class LargePlaylistLoader {
  constructor() {
    this.chunkSize = 4 * 1024 * 1024; // 4MB
  }

  async loadPlaylist(url, onProgress) {
    let fullContent = '';
    let start = 0;
    let chunkCount = 0;
    let totalSize = null;
    
    console.log(`[LargePlaylistLoader] Iniciando carregamento: ${url}`);

    while (true) {
      try {
        const response = await fetch('/api/m3u', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Range': `bytes=${start}-`
          },
          body: JSON.stringify({ url: url })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || `HTTP ${response.status}`);
        }

        const contentType = response.headers.get('content-type');
        
        // Se for texto puro (arquivo pequeno)
        if (contentType && contentType.includes('text/plain')) {
          fullContent = await response.text();
          console.log(`[LargePlaylistLoader] Arquivo pequeno, carregado diretamente: ${fullContent.length} bytes`);
          break;
        }
        
        // Se for JSON (arquivo grande em chunks)
        const result = await response.json();
        
        if (!result.data) {
          throw new Error('Resposta inválida do proxy');
        }
        
        fullContent += result.data;
        chunkCount++;
        
        if (onProgress && result.total) {
          const percent = (fullContent.length / result.total) * 100;
          onProgress({
            loaded: fullContent.length,
            total: result.total,
            percent: Math.round(percent),
            chunks: chunkCount
          });
        }
        
        console.log(`[LargePlaylistLoader] Chunk ${chunkCount}: ${result.data.length} bytes, total: ${fullContent.length}/${result.total || '?'}`);
        
        if (!result.hasMore) {
          console.log(`[LargePlaylistLoader] Carregamento completo: ${fullContent.length} bytes em ${chunkCount} chunks`);
          break;
        }
        
        start = result.nextStart;
        
        // Pequeno delay para não sobrecarregar
        await new Promise(resolve => setTimeout(resolve, 50));
        
      } catch (error) {
        console.error('[LargePlaylistLoader] Erro:', error);
        throw new Error(`Falha ao carregar playlist: ${error.message}`);
      }
    }

    return fullContent;
  }
}