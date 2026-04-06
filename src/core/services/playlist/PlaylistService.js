

import { M3UParser } from './parsers/M3UParser';
import { XtreamParser } from './parsers/XtreamParser';
import { EPGParser } from './parsers/EPGParser';
import { StorageService } from '../storage/StorageService';
import { MetadataExtractor } from '../../utils/metadata/MetadataExtractor';
import { MediaAnalyzer } from './MediaAnalyzer';

export class PlaylistService {
  constructor() {
    this.storage = new StorageService();
    this.metadataExtractor = new MetadataExtractor();
    this.mediaAnalyzer = new MediaAnalyzer();
    this.parsers = {
      m3u: new M3UParser(),
      xtream: new XtreamParser()
    };
  }

  parseSeasonEpisode(name = '') {
    if (!name) return null;

    const patterns = [
      /(.*?)[\s._-]*S(\d{1,3})[\s._-]*E(\d{1,3})\b/i,
      /(.*?)(?:\b(?:temporada|season|temp)\s*(\d{1,3})\b)(?:.*?\b(?:episodio|episode|ep)\s*(\d{1,3})\b)/i,
      /(.*?)(?:\b(?:episodio|episode|ep)\s*(\d{1,3})\b)(?:.*?\b(?:temporada|season|temp)\s*(\d{1,3})\b)/i
    ];

    for (const pattern of patterns) {
      const match = name.match(pattern);
      if (!match) continue;

      let season = parseInt(match[2], 10);
      let episode = parseInt(match[3], 10);

      if (/\b(?:episodio|episode|ep)\s*\d+/i.test(match[0]) && /\b(?:temporada|season|temp)\s*\d+/i.test(match[0])) {
        const seasonMatch = match[0].match(/\b(?:temporada|season|temp)\s*(\d{1,3})\b/i);
        const episodeMatch = match[0].match(/\b(?:episodio|episode|ep)\s*(\d{1,3})\b/i);
        season = parseInt(seasonMatch?.[1] || '', 10);
        episode = parseInt(episodeMatch?.[1] || '', 10);
      }

      if (!Number.isFinite(season) || !Number.isFinite(episode)) continue;

      const rawSeriesName = (match[1] || '').trim();
      const seriesName = rawSeriesName.length > 0 ? rawSeriesName : name;

      return {
        seriesName,
        season,
        episode,
        seasonEpisode: `S${String(season).padStart(2, '0')}E${String(episode).padStart(2, '0')}`
      };
    }

    return null;
  }

  normalizeSeriesName(name = '') {
    return name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  getLowerUrl(url = '') {
    return String(url || '').split('?')[0].split('#')[0].toLowerCase();
  }

  hasExtension(url = '', extensions = []) {
    const lowerUrl = this.getLowerUrl(url);
    return extensions.some((ext) => lowerUrl.endsWith(ext));
  }

  getPrimaryGroup(item = {}) {
    const raw = String(item.groupTitle || item['group-title'] || item.originalGroup || item.group || '').trim();
    if (!raw) return 'Canais Gerais';
    if (/^(undefined|n\/a|none|null)$/i.test(raw)) return 'Canais Gerais';
    return raw;
  }

  normalizeSignalText(value = '') {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  hasKeyword(text = '', keywords = []) {
    return keywords.some((keyword) => text.includes(keyword));
  }

  classifyItemType(item = {}) {
    const explicitType = this.normalizeSignalText(item.type || '');
    const name = item.name || item.title || '';
    const primaryGroup = this.getPrimaryGroup(item);
    const url = String(item.url || '');
    const lowerUrl = url.toLowerCase();
    const duration = Number(item.duration);
    const hasFiniteDuration = Number.isFinite(duration) && duration > 0;
    const seriesInfo = this.parseSeasonEpisode(name);

    const signalText = this.normalizeSignalText(
      `${name} ${primaryGroup} ${item.group || ''} ${item.groupTitle || ''} ${item?.tvg?.id || ''} ${item?.tvg?.name || ''}`
    );

    const isTs = this.hasExtension(lowerUrl, ['.ts']);
    const isMp4 = this.hasExtension(lowerUrl, ['.mp4']);
    const isDirectVod = this.hasExtension(lowerUrl, ['.mp4', '.mkv', '.avi', '.mov', '.wmv']);
    const isHls = lowerUrl.includes('.m3u8');

    if (isMp4) {
      if (seriesInfo) return { type: 'series', primaryGroup, seriesInfo };
      return { type: 'vod', primaryGroup, seriesInfo };
    }

    const liveUrlSignals = ['live', 'channel', 'stream', '/tv', 'playlist'];
    const vodUrlSignals = ['/movie/', '/movies/', '/vod/', '/series/', '/episode/', 'action=get_vod_stream'];

    const liveTextSignals = ['news', 'ao vivo', 'live', 'canal', 'radio', 'sports', 'sport'];
    const vodTextSignals = ['filme', 'filmes', 'movie', 'cinema', 'vod', 'on demand'];

    const hasLiveSignal = this.hasKeyword(signalText, liveTextSignals) || this.hasKeyword(lowerUrl, liveUrlSignals);
    const hasVodSignal = this.hasKeyword(signalText, vodTextSignals) || this.hasKeyword(lowerUrl, vodUrlSignals);

    if (explicitType === 'series') return { type: 'series', primaryGroup, seriesInfo };
    if (explicitType === 'live') return { type: 'live', primaryGroup, seriesInfo };
    if (explicitType === 'vod' && !seriesInfo) return { type: 'vod', primaryGroup, seriesInfo };

    if (seriesInfo) return { type: 'series', primaryGroup, seriesInfo };
    if (isTs) return { type: 'live', primaryGroup, seriesInfo };
    if (isDirectVod) return { type: 'vod', primaryGroup, seriesInfo };

    if (isHls) {
      if (hasVodSignal || hasFiniteDuration) return { type: 'vod', primaryGroup, seriesInfo };
      return { type: 'live', primaryGroup, seriesInfo };
    }

    if (hasVodSignal) return { type: 'vod', primaryGroup, seriesInfo };
    if (hasLiveSignal) return { type: 'live', primaryGroup, seriesInfo };

    return { type: 'live', primaryGroup, seriesInfo };
  }

  async addPlaylist(playlistData) {
    try {
      const { type, name, url, username, password, epgSource, content, fileName } = playlistData;
      
      let parsedData;
      
      if (type === 'xtream') {
        parsedData = await this.parsers.xtream.parse({
          url,
          username,
          password
        });
      } else if (type === 'upload') {
        parsedData = await this.parsers.m3u.parse(content);
      } else {
        parsedData = await this.parsers.m3u.parse(url);
      }


      
      const itemsWithTypes = await this.classifyByExtension(parsedData.items);

      const stats = {
        live: itemsWithTypes.filter(i => i.type === 'live').length,
        vod: itemsWithTypes.filter(i => i.type === 'vod').length,
        series: itemsWithTypes.filter(i => i.type === 'series').length
      };

      const enrichedData = await this.enrichMetadata({
        ...parsedData,
        items: itemsWithTypes
      });
      
      const categorized = this.categorizeContent(enrichedData);

      const totalItems = (categorized.live?.length || 0)
        + (categorized.movies?.length || 0)
        + (categorized.series?.length || 0);

      if (totalItems === 0) {
        throw new Error('A playlist foi processada, mas nao retornou canais, filmes ou series.');
      }
      
      const playlist = {
        id: Date.now().toString(),
        name,
        type,
        ...categorized,
        stats,
        epg: epgSource ? await this.loadEPG(epgSource) : null,
        createdAt: new Date().toISOString()
      };

      await this.storage.savePlaylist(playlist);
      
      return playlist;
    } catch (error) {
      throw new Error(`Erro ao adicionar playlist: ${error.message}`);
    }
  }

  async classifyByExtension(items) {
    const classified = items.map((item) => {
      const decision = this.classifyItemType(item);
      const sourceGroup = this.getPrimaryGroup(item);
      const baseItem = {
        ...item,
        originalGroup: item.originalGroup || sourceGroup,
        groupTitle: sourceGroup,
        group: sourceGroup
      };

      if (decision.type === 'series') {
        return {
          ...baseItem,
          type: 'series',
          ...(decision.seriesInfo || {})
        };
      }

      if (decision.type === 'vod') {
        return { ...baseItem, type: 'vod' };
      }

      return { ...baseItem, type: 'live' };
    });

    const stats = {
      live: classified.filter((item) => item.type === 'live').length,
      vod: classified.filter((item) => item.type === 'vod').length,
      series: classified.filter((item) => item.type === 'series').length
    };


    return classified;
  }

  categorizeContent(data) {
    const categories = {
      live: [],
      movies: [],
      series: []
    };

    const seriesMap = new Map();

    data.items.forEach(item => {
      if (item.type === 'series') {
        const organizedEpisode = this.organizeSeries(item);
        const baseName = organizedEpisode.seriesName || organizedEpisode.name || organizedEpisode.title || 'Serie';
        const normalized = this.normalizeSeriesName(baseName);
        const seriesKey = normalized || this.normalizeSeriesName(organizedEpisode.name || 'serie');

        if (!seriesMap.has(seriesKey)) {
          seriesMap.set(seriesKey, {
            ...organizedEpisode,
            id: `series-${seriesKey}`,
            type: 'series',
            name: baseName,
            title: baseName,
            seriesName: baseName,
            episodes: []
          });
        }

        const seriesEntry = seriesMap.get(seriesKey);
        seriesEntry.episodes.push(organizedEpisode);

        if (organizedEpisode.season === 1 && organizedEpisode.episode === 1) {
          seriesMap.set(seriesKey, {
            ...seriesEntry,
            ...organizedEpisode,
            id: seriesEntry.id,
            type: 'series',
            name: baseName,
            title: baseName,
            seriesName: baseName,
            episodes: seriesEntry.episodes
          });
        }
      } else if (item.type === 'vod') {
        categories.movies.push({ ...item, type: 'movie' });
      } else {
        categories.live.push({ ...item, type: 'live' });
      }
    });

    categories.series = Array.from(seriesMap.values())
      .map((seriesItem) => ({
        ...seriesItem,
        episodes: [...seriesItem.episodes].sort((a, b) => {
          if ((a.season || 0) !== (b.season || 0)) return (a.season || 0) - (b.season || 0);
          return (a.episode || 0) - (b.episode || 0);
        })
      }))
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    return categories;
  }

  organizeSeries(episode) {
    const parsed = this.parseSeasonEpisode(episode.name || episode.title || '');

    if (parsed) {
      return {
        ...episode,
        season: parsed.season,
        episode: parsed.episode,
        seasonEpisode: parsed.seasonEpisode,
        seriesName: parsed.seriesName,
        seriesId: this.normalizeSeriesName(parsed.seriesName)
      };
    }

    return episode;
  }

  async enrichMetadata(data) {
    return {
      ...data,
      items: await Promise.all(
        data.items.map(async item => ({
          ...item,
          metadata: await this.metadataExtractor.extract(item)
        }))
      )
    };
  }

  async loadEPG(source) {
    const parser = new EPGParser();
    return await parser.parse(source);
  }
}
