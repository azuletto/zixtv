

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

  yieldToMain() {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
        window.requestAnimationFrame(() => resolve());
        return;
      }

      setTimeout(resolve, 0);
    });
  }

  throwIfAborted(signal) {
    if (signal?.aborted) {
      const error = new Error('Download cancelado pelo usuário');
      error.name = 'AbortError';
      throw error;
    }
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

  buildGroupProfiles(items = []) {
    const profiles = new Map();

    for (const item of Array.isArray(items) ? items : []) {
      const group = this.getPrimaryGroup(item);
      const url = String(item?.url || '');
      const stats = profiles.get(group) || {
        total: 0,
        tsCount: 0,
        vodExtCount: 0
      };

      stats.total += 1;
      if (this.hasExtension(url, ['.ts'])) {
        stats.tsCount += 1;
      }
      if (this.hasExtension(url, ['.mp4', '.mkv', '.avi', '.mov', '.wmv'])) {
        stats.vodExtCount += 1;
      }

      profiles.set(group, stats);
    }

    return profiles;
  }

  shouldTreatTsAsVod(groupProfile = null) {
    if (!groupProfile) return false;
    const tsCount = Number(groupProfile.tsCount || 0);
    const vodExtCount = Number(groupProfile.vodExtCount || 0);
    const total = Number(groupProfile.total || 0);

    if (total < 4) return false;
    if (tsCount <= 0 || tsCount > 2) return false;
    if (vodExtCount < 3) return false;

    return vodExtCount > tsCount;
  }

  classifyItemType(item = {}, options = {}) {
    const explicitType = this.normalizeSignalText(item.type || '');
    const name = item.name || item.title || '';
    const primaryGroup = this.getPrimaryGroup(item);
    const groupProfile = options.groupProfiles?.get?.(primaryGroup) || null;
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

    if (isTs) {
      if (this.shouldTreatTsAsVod(groupProfile)) {
        return { type: 'vod', primaryGroup, seriesInfo: null };
      }
      return { type: 'live', primaryGroup, seriesInfo: null };
    }

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
    if (isDirectVod) return { type: 'vod', primaryGroup, seriesInfo };

    if (isHls) {
      if (hasVodSignal || hasFiniteDuration) return { type: 'vod', primaryGroup, seriesInfo };
      return { type: 'live', primaryGroup, seriesInfo };
    }

    if (hasVodSignal) return { type: 'vod', primaryGroup, seriesInfo };
    if (hasLiveSignal) return { type: 'live', primaryGroup, seriesInfo };

    return { type: 'live', primaryGroup, seriesInfo };
  }

  async addPlaylist(playlistData, requestOptions = {}) {
    try {
      const { type, name, url, username, password, epgSource, content, fileName } = playlistData;
      const signal = requestOptions.signal;
      const callbacks = {
        onProgress: requestOptions.onProgress,
        onStatus: requestOptions.onStatus
      };
      
      let parsedData;
      this.throwIfAborted(signal);

      callbacks.onStatus?.({ phase: 'starting', message: 'Iniciando leitura da playlist' });
      
      if (type === 'xtream') {
        parsedData = await this.parsers.xtream.parse({
          url,
          username,
          password
        }, requestOptions);
      } else if (type === 'upload') {
        parsedData = await this.parsers.m3u.parse(content, requestOptions);
      } else {
        parsedData = await this.parsers.m3u.parse(url, {
          signal,
          onProgress: callbacks.onProgress,
          onStatus: callbacks.onStatus
        });
      }

      this.throwIfAborted(signal);
      await this.yieldToMain();

      callbacks.onStatus?.({ phase: 'organizing', message: 'Organizando itens da playlist' });
      const itemsWithTypes = await this.classifyByExtension(parsedData.items, requestOptions);

      this.throwIfAborted(signal);
      await this.yieldToMain();

      const stats = {
        live: itemsWithTypes.filter(i => i.type === 'live').length,
        vod: itemsWithTypes.filter(i => i.type === 'vod').length,
        series: itemsWithTypes.filter(i => i.type === 'series').length
      };

      callbacks.onStatus?.({ phase: 'enriching', message: 'Enriquecendo metadados' });
      const enrichedData = await this.enrichMetadata({
        ...parsedData,
        items: itemsWithTypes
      }, requestOptions);

      this.throwIfAborted(signal);
      await this.yieldToMain();

      callbacks.onStatus?.({ phase: 'categorizing', message: 'Separando canais, filmes e séries' });
      const categorized = await this.categorizeContent(enrichedData, requestOptions);

      this.throwIfAborted(signal);

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
        epg: epgSource ? await this.loadEPG(epgSource, requestOptions) : null,
        createdAt: new Date().toISOString()
      };

      callbacks.onStatus?.({ phase: 'saving', message: 'Salvando playlist no dispositivo' });
      await this.storage.savePlaylist(playlist);
      
      return playlist;
    } catch (error) {
      if (error?.name === 'AbortError') {
        throw error;
      }

      throw new Error(`Erro ao adicionar playlist: ${error.message}`);
    }
  }

  async classifyByExtension(items, requestOptions = {}) {
    const classified = [];
    const signal = requestOptions.signal;
    const groupProfiles = this.buildGroupProfiles(items);

    for (let index = 0; index < items.length; index++) {
      this.throwIfAborted(signal);
      const item = items[index];
      const decision = this.classifyItemType(item, { groupProfiles });
      const sourceGroup = this.getPrimaryGroup(item);
      const baseItem = {
        ...item,
        originalGroup: item.originalGroup || sourceGroup,
        groupTitle: sourceGroup,
        group: sourceGroup
      };

      if (decision.type === 'series') {
        classified.push({
          ...baseItem,
          type: 'series',
          ...(decision.seriesInfo || {})
        });
        if (index % 200 === 0) {
          await this.yieldToMain();
        }
        continue;
      }

      if (decision.type === 'vod') {
        classified.push({ ...baseItem, type: 'vod' });
      } else {
        classified.push({ ...baseItem, type: 'live' });
      }
      if (index % 200 === 0) {
        await this.yieldToMain();
      }
    }

    const stats = {
      live: classified.filter((item) => item.type === 'live').length,
      vod: classified.filter((item) => item.type === 'vod').length,
      series: classified.filter((item) => item.type === 'series').length
    };


    return classified;
  }

  async categorizeContent(data, requestOptions = {}) {
    const categories = {
      live: [],
      movies: [],
      series: []
    };

    const seriesMap = new Map();
    const signal = requestOptions.signal;

    for (let index = 0; index < data.items.length; index++) {
      this.throwIfAborted(signal);
      const item = data.items[index];
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

      if (index % 200 === 0) {
        await this.yieldToMain();
      }
    }

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

  async enrichMetadata(data, requestOptions = {}) {
    const sourceItems = Array.isArray(data.items) ? data.items : [];
    const totalItems = sourceItems.length;
    const items = new Array(totalItems);
    const signal = requestOptions.signal;
    const callbacks = {
      onStatus: requestOptions.onStatus,
      onProgress: requestOptions.onProgress
    };

    const batchSize = 250;

    if (totalItems === 0) {
      return {
        ...data,
        items: []
      };
    }

    for (let start = 0; start < totalItems; start += batchSize) {
      this.throwIfAborted(signal);

      const end = Math.min(start + batchSize, totalItems);
      const enrichPromises = [];

      for (let index = start; index < end; index++) {
        const item = sourceItems[index];

        if (item?.type === 'live') {
          items[index] = {
            ...item,
            metadata: this.metadataExtractor.extractLive(item)
          };
          continue;
        }

        enrichPromises.push(
          this.metadataExtractor.extract(item).then((metadata) => ({ index, item, metadata }))
        );
      }

      if (enrichPromises.length > 0) {
        const enrichedBatch = await Promise.all(enrichPromises);
        for (const entry of enrichedBatch) {
          items[entry.index] = {
            ...entry.item,
            metadata: entry.metadata
          };
        }
      }

      const progressValue = Math.round((end / totalItems) * 100);
      callbacks.onStatus?.({
        phase: 'enriching',
        message: `Enriquecendo metadados (${end}/${totalItems})`
      });

      callbacks.onProgress?.({
        phase: 'enriching',
        percentage: progressValue,
        message: `Metadados processados: ${end}/${totalItems}`
      });

      await this.yieldToMain();
    }

    return {
      ...data,
      items
    };
  }

  async loadEPG(source, requestOptions = {}) {
    this.throwIfAborted(requestOptions.signal);
    const parser = new EPGParser();
    return await parser.parse(source);
  }
}
