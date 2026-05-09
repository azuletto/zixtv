import { resolvePlaylistSource } from '../../network/proxy';

export class M3UParser {
  async fetchM3UContent(source, requestOptions = {}) {
    const proxiedSource = resolvePlaylistSource(source, { forceProxy: true });
    console.log('[M3UParser] fetchM3UContent:', {
      original: source,
      proxied: proxiedSource,
      isProxied: proxiedSource !== source
    });

    const response = await fetch(proxiedSource, {
      method: 'GET',
      cache: 'no-store',
      signal: requestOptions.signal
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText || '<none>'}`);
    }

    const { onStatus } = requestOptions;
    onStatus?.({ phase: 'downloading', message: 'Baixando playlist' });

    const contentType = String(response.headers.get('content-type') || '').toLowerCase();
    if (contentType.includes('video/') || contentType.includes('mp2t') || contentType.includes('mpegts')) {
      throw new Error('A URL retornou um stream de video, nao uma playlist M3U valida');
    }

    return this.readStreamAsText(response, requestOptions);
  }

  async readStreamAsText(response, requestOptions = {}) {
    if (!response.body || typeof response.body.getReader !== 'function') {
      const fallbackContent = await response.text();
      if (!fallbackContent || !fallbackContent.trim()) {
        throw new Error('Playlist vazia');
      }
      return fallbackContent;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8', { fatal: false });
    const signal = requestOptions.signal;
    const onProgress = requestOptions.onProgress;
    const onStatus = requestOptions.onStatus;
    const totalBytes = this.getExpectedContentLength(response);
    const heartbeatIntervalMs = 1200;
    const progressEmitIntervalMs = 900;
    const progressEmitByteStep = 1024 * 1024;
    let receivedBytes = 0;
    let lastProgressAt = Date.now();
    let lastHeartbeatAt = Date.now();
    let lastProgressEmitAt = 0;
    let lastProgressEmitBytes = 0;
    const chunks = [];

    const pumpHeartbeat = () => {
      const now = Date.now();
      if (now - lastHeartbeatAt < heartbeatIntervalMs) {
        return;
      }

      lastHeartbeatAt = now;
      const message = receivedBytes > 0
        ? totalBytes
          ? `Conexão aberta: ${this.formatBytes(receivedBytes)} recebidos de ${this.formatBytes(totalBytes)}`
          : `Conexão aberta: ${this.formatBytes(receivedBytes)} recebidos`
        : 'Conexão aberta, aguardando dados da playlist';

      onStatus?.({
        phase: 'downloading',
        message,
        heartbeat: true
      });
    };

    onStatus?.({
      phase: 'downloading',
      message: 'Conexão aberta, aguardando dados da playlist'
    });

    while (true) {
      if (signal?.aborted) {
        await reader.cancel();
        throw this.createAbortError();
      }

      const chunk = await reader.read();
      if (chunk.done) {
        break;
      }

      const { value } = chunk;
      if (value && value.byteLength > 0) {
        receivedBytes += value.byteLength;
        lastProgressAt = Date.now();
        chunks.push(value);

        if (signal?.aborted) {
          await reader.cancel();
          throw this.createAbortError();
        }

        const now = Date.now();
        const bytesSinceLastEmit = receivedBytes - lastProgressEmitBytes;
        if (
          now - lastProgressEmitAt >= progressEmitIntervalMs ||
          bytesSinceLastEmit >= progressEmitByteStep
        ) {
          lastProgressEmitAt = now;
          lastProgressEmitBytes = receivedBytes;

          onProgress?.({
            phase: 'downloading',
            receivedBytes,
            totalBytes,
            percentage: totalBytes ? Math.min(99, Math.round((receivedBytes / totalBytes) * 100)) : null,
            message: totalBytes
              ? `Baixando playlist ${this.formatBytes(receivedBytes)} / ${this.formatBytes(totalBytes)}`
              : `Baixando playlist ${this.formatBytes(receivedBytes)}`
          });
        }
      }

      pumpHeartbeat();

      if (Date.now() - lastProgressAt >= heartbeatIntervalMs) {
        pumpHeartbeat();
      }
    }

    const combined = new Uint8Array(receivedBytes);
    let offset = 0;

    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.byteLength;
    }

    const content = decoder.decode(combined);

    if (signal?.aborted) {
      throw this.createAbortError();
    }

    if (!content || !content.trim()) {
      throw new Error('Playlist vazia');
    }

    if (totalBytes !== null && receivedBytes < totalBytes * 0.95) {
      throw new Error(`Download truncado: recebeu ${receivedBytes} de ${totalBytes} bytes`);
    }

    onProgress?.({
      phase: 'downloaded',
      receivedBytes,
      totalBytes,
      percentage: 100,
      message: totalBytes
        ? `Download concluído ${this.formatBytes(receivedBytes)} / ${this.formatBytes(totalBytes)}`
        : `Download concluído ${this.formatBytes(receivedBytes)}`
    });

    return content;
  }

  async parse(source, requestOptions = {}) {
    try {
      const content = await this.resolveContent(source, requestOptions);
      
      const lines = content.split('\n');
      const items = [];
      let currentItem = null;
      let itemIndex = 0;

      for (const line of lines) {
        if (line.startsWith('#EXTINF:')) {
          const info = this.parseExtInf(line);
          currentItem = {
            name: info.name,
            duration: info.duration,
            tvg: info.tvg,
            group: info.group,
            groupTitle: info.group,
            originalGroup: info.group,
            logo: info.logo,
            url: '',
            type: 'unknown'
          };
        } else if (line.trim() && !line.startsWith('#') && currentItem) {
          currentItem.url = line.trim();
          currentItem.uniqueId = `item-${itemIndex++}-${Date.now()}`;
          items.push(currentItem);
          currentItem = null;
        }
      }

      return {
        type: 'm3u',
        items: items.map(item => ({
          ...item,
          id: item.uniqueId,
        }))
      };
    } catch (error) {
      throw new Error(`Erro ao parsear M3U: ${error.message}`);
    }
  }

  isLikelyM3UContent(source) {
    if (typeof source !== 'string') return false;
    const trimmed = source.replace(/^\uFEFF/, '').trim();
    if (!trimmed) return false;
    return trimmed.startsWith('#EXTM3U') || trimmed.includes('#EXTINF:');
  }

  isHttpUrl(source) {
    if (typeof source !== 'string') return false;
    try {
      const parsed = new URL(source);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch (_) {
      return false;
    }
  }

  isLikelyCloudflareErrorPage(content) {
    if (typeof content !== 'string') return false;
    const text = content.toLowerCase();
    return text.includes('cloudflare') && (text.includes('error 521') || text.includes('web server is down'));
  }

  isValidM3UContent(content) {
    if (typeof content !== 'string') return false;
    const trimmed = content.replace(/^\uFEFF/, '').trim();
    if (!trimmed) return false;
    if (this.isLikelyCloudflareErrorPage(trimmed)) return false;
    return this.isLikelyM3UContent(trimmed);
  }

  async resolveContent(source, requestOptions = {}) {

    // Se já é conteúdo M3U, retorna direto
    if (this.isLikelyM3UContent(source)) {
      return source;
    }

    // Se não é URL, erro
    if (!this.isHttpUrl(source)) {
      throw new Error('Fonte de playlist invalida. Use uma URL http/https ou conteudo M3U valido.');
    }

    // Requisicao via proxy para a URL da playlist
    try {
      console.log('[M3UParser] Baixando via proxy:', source);
      
      const content = await this.fetchM3UContent(source, requestOptions);

      if (!content || !content.trim()) {
        throw new Error('Playlist vazia');
      }

      // Diagnóstico detalhado se falhar validação
      if (!this.isValidM3UContent(content)) {
        const preview = content.substring(0, 500);
        const isHtml = content.toLowerCase().includes('<!doctype html') || content.toLowerCase().includes('<html');
        const isCloudflare = content.toLowerCase().includes('cloudflare');
        const isEmpty = !content.trim();
        
        console.error('[M3UParser] Conteúdo inválido:', {
          length: content.length,
          isHtml,
          isCloudflare,
          isEmpty,
          preview
        });

        if (isCloudflare) {
          throw new Error('Servidor está bloqueando a requisição (Cloudflare). A URL pode estar bloqueando IPs da AWS. Tente usar um proxy diferente ou contatar o provedor.');
        }
        
        if (isHtml) {
          throw new Error('Servidor retornou HTML em vez de playlist M3U. Verifique se a URL está correta ou se o servidor requer autenticação/headers especiais.');
        }

        throw new Error('A URL nao retornou uma playlist M3U valida');
      }

      console.log('[M3UParser] Playlist carregada:', content.length, 'bytes');
      return content;

    } catch (error) {
      if (error?.name === 'AbortError') {
        throw error;
      }

      throw new Error(`Falha ao carregar playlist: ${error.message}`);
    }
  }

  getExpectedContentLength(response) {
    const rawValue = response.headers?.get?.('content-length');
    const parsedValue = Number.parseInt(rawValue || '', 10);
    return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : null;
  }

  formatBytes(bytes = 0) {
    const value = Number(bytes) || 0;
    if (value < 1024) return `${value} B`;
    const kb = value / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  }

  createAbortError() {
    const error = new Error('Download cancelado pelo usuário');
    error.name = 'AbortError';
    return error;
  }

  parseExtInf(line) {
    const info = {
      duration: 0,
      name: '',
      tvg: {},
      group: 'General',
      logo: null,
      tmdbImageId: null
    };

    const extractImageIdFromUrl = (value) => {
      if (!value) return null;
      const match = value.match(/\/([^/]+)\.(?:jpg|jpeg|png|webp)(?:\?.*)?$/i);
      return match ? match[1] : null;
    };

    const durationMatch = line.match(/#EXTINF:(-?\d+)/);
    if (durationMatch) info.duration = parseInt(durationMatch[1]);

    const tvgIdMatch = line.match(/tvg-id="([^"]*)"/);
    if (tvgIdMatch) info.tvg.id = tvgIdMatch[1];

    const tvgNameMatch = line.match(/tvg-name="([^"]*)"/);
    if (tvgNameMatch) info.tvg.name = tvgNameMatch[1];

    const logoMatch = line.match(/tvg-logo="([^"]*)"/);
    if (logoMatch) {
      info.logo = logoMatch[1];
      info.tmdbImageId = extractImageIdFromUrl(info.logo);
      if (info.tmdbImageId) {
        info.tvg.tmdbImageId = info.tmdbImageId;
      }
    }

    const groupMatch = line.match(/group-title="([^"]*)"/);
    if (groupMatch) info.group = groupMatch[1];

    const nameMatch = line.match(/,([^,]+)$/);
    if (nameMatch) info.name = nameMatch[1].trim();

    return info;
  }
}
