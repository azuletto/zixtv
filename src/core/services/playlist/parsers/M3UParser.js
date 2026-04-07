import { swProxyService } from '../../network/SWProxyService';

export class M3UParser {
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

  async resolveContent(source) {
    // Se já é conteúdo M3U, retorna direto
    if (this.isLikelyM3UContent(source)) {
      return source;
    }

    // Se não é URL, erro
    if (!this.isHttpUrl(source)) {
      throw new Error('Fonte de playlist invalida. Use uma URL http/https ou conteudo M3U valido.');
    }

    try {
      console.log('[M3UParser] Baixando via Service Worker:', source);
      const content = await swProxyService.fetchText(source);

      if (!content || !content.trim()) {
        throw new Error('Playlist vazia');
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