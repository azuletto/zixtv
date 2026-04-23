

export class MediaAnalyzer {
  constructor() {
    this.seriesThreshold = 2;
  }

  analyzeItem(item) {
    const url = item.url?.toLowerCase() || '';
    const name = item.name || item.title || '';
    const groupTitle = item.group || item['group-title'] || '';
    
    
    let baseType = 'unknown';
    if (url.endsWith('.ts')) {
      baseType = 'live';
    } else if (url.endsWith('.mp4') || url.endsWith('.mkv') || url.endsWith('.avi')) {
      baseType = 'vod';
    } else if (url.endsWith('.m3u8')) {
      const vodSignals = ['filme', 'filmes', 'movie', 'cinema', 'vod', 'on demand'];
      const text = `${name} ${groupTitle}`.toLowerCase();
      baseType = vodSignals.some((signal) => text.includes(signal)) ? 'vod' : 'live';
    }
    
    
    if (baseType === 'vod') {
      const hasSeasonEpisode = this.hasSeasonEpisodePattern(name);
      
      if (hasSeasonEpisode) {
        const seriesInfo = this.extractSeriesInfo(name);
        return {
          ...item,
          type: 'series',
          groupTitle: groupTitle,
          seriesName: seriesInfo.seriesName,
          season: seriesInfo.season,
          episode: seriesInfo.episode,
          seasonEpisode: seriesInfo.seasonEpisode
        };
      } else {
        return {
          ...item,
          type: 'movies',
          groupTitle: groupTitle
        };
      }
    }
    
    
    if (baseType === 'live') {
      return {
        ...item,
        type: 'live',
        groupTitle: groupTitle
      };
    }
    
    
    return {
      ...item,
      type: 'live',
      groupTitle: groupTitle
    };
  }

  hasSeasonEpisodePattern(name) {
    if (!name) return false;
    return /S\d{1,3}E\d{1,3}/i.test(name);
  }

  extractSeriesInfo(name) {
    const result = {
      seriesName: name,
      season: null,
      episode: null,
      seasonEpisode: null
    };
    
    
    const mainMatch = name.match(/(.*?)\s*S(\d{1,3})E(\d{1,3})/i);
    if (mainMatch) {
      result.seriesName = mainMatch[1].trim();
      result.season = parseInt(mainMatch[2]);
      result.episode = parseInt(mainMatch[3]);
      result.seasonEpisode = `S${mainMatch[2]}E${mainMatch[3]}`;
      return result;
    }
    
    return result;
  }

  async analyzeBatch(items, options = {}) {
    
    const analyzedItems = items.map(item => this.analyzeItem(item));
    
    
    const nameGroups = new Map();
    
    for (const item of analyzedItems) {
      let baseName = item.name || item.title || '';
      baseName = baseName
        .replace(/S\d{1,3}E\d{1,3}/i, '')
        .trim();
      
      if (baseName.length < 3) baseName = item.name || item.title || '';
      
      if (!nameGroups.has(baseName)) {
        nameGroups.set(baseName, []);
      }
      nameGroups.get(baseName).push(item);
    }
    
    
    const seriesNames = new Set();
    
    for (const [baseName, groupItems] of nameGroups.entries()) {
      if (groupItems.length >= this.seriesThreshold) {
        seriesNames.add(baseName);
      }
    }
    
    
    const finalResults = analyzedItems.map(item => {
      let baseName = item.name || item.title || '';
      baseName = baseName
        .replace(/S\d{1,3}E\d{1,3}/i, '')
        .trim();
      
      if (baseName.length < 3) baseName = item.name || item.title || '';
      
      if (seriesNames.has(baseName)) {
        const seriesInfo = this.extractSeriesInfo(item.name || item.title || '');
        return {
          ...item,
          type: 'series',
          seriesName: seriesInfo.seriesName || baseName,
          season: seriesInfo.season,
          episode: seriesInfo.episode,
          seasonEpisode: seriesInfo.seasonEpisode
        };
      }
      
      return item;
    });
    
    
    const stats = {
      live: finalResults.filter(r => r.type === 'live').length,
      movies: finalResults.filter(r => r.type === 'movies').length,
      series: finalResults.filter(r => r.type === 'series').length
    };
    
    
    return finalResults;
  }
}

export const mediaAnalyzer = new MediaAnalyzer();
export default mediaAnalyzer;
