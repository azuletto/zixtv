export class M3UParser {
  async fetchM3UContent(source) {
    const response = await fetch(source, {
      method: 'GET',
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText || '<none>'}`);
    }

    return response.text();
  }

  async fetchM3UContentDirect(source) {
    const response = await fetch(source, {
      method: 'GET',
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText || '<none>'}`);
    }

    return response.text();
  }

  async parse(source) {
    try {
      const content = await this.resolveContent(source);
      
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
    const trimmed = source.trim();
    if (!trimmed) return false;
    return trimmed.includes('#EXTM3U') || trimmed.includes('#EXTINF:');
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
    const trimmed = content.trim();
    if (!trimmed) return false;
    if (this.isLikelyCloudflareErrorPage(trimmed)) return false;
    return this.isLikelyM3UContent(trimmed);
  }

  async resolveContent(source) {
    // Se já é conteúdo M3U, retorna direto
    if (this.isLikelyM3UContent(source)) {
      return source;
    }

    // Se não é URL, erro
    if (!this.isHttpUrl(source)) {
      throw new Error('Fonte de playlist invalida. Use uma URL http/https ou conteudo M3U valido.');
    }

    // Requisicao direta para a URL da playlist
    try {
      console.log('[M3UParser] Baixando direto:', source);
      
      let content;

      try {
        content = await this.fetchM3UContent(source);
      } catch (error) {
        const isDev = Boolean(import.meta.env.DEV);
        const isUpstream521 = /HTTP\s*521/i.test(error?.message || '');

        if (isDev && isUpstream521) {
          // Em desenvolvimento, tenta o navegador diretamente para recuperar casos
          // em que o servidor remoto bloqueia IP de datacenter, mas libera IP residencial.
          content = await this.fetchM3UContentDirect(source);
        } else {
          throw error;
        }
      }

      if (!content || !content.trim()) {
        throw new Error('Playlist vazia');
      }

      if (!this.isValidM3UContent(content)) {
        throw new Error('A URL nao retornou uma playlist M3U valida');
      }

      console.log('[M3UParser] Playlist carregada:', content.length, 'bytes');
      return content;

    } catch (error) {
      throw new Error(`Falha ao carregar playlist: ${error.message}`);
    }
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