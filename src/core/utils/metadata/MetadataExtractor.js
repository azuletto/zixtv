

export class MetadataExtractor {
  constructor() {
    this.defaultMetadata = {
      rating: 'N/A',
      year: 'Desconhecido',
      genre: 'Geral',
      description: 'Sem descriÃ§Ã£o disponÃ­vel',
      poster: '/default-poster.png',
      backdrop: '/default-backdrop.png',
      quality: 'HD',
      language: 'Original',
      tmdbId: null,
      imdbId: null,
      popularity: 0,
      voteCount: 0
    };
  }''

  async extract(item, options = {}) {
    const metadata = { ...this.defaultMetadata };

    try {
      
      const titleMetadata = this.extractFromTitle(item.name || item.title);
      
      
      const categoryMetadata = this.extractFromCategory(item.group);
      
      
      const tagMetadata = this.extractFromTags(item.tags || []);
      
      
      Object.assign(metadata, titleMetadata, categoryMetadata, tagMetadata);

      
      if (item.tvg) {
        Object.assign(metadata, this.extractFromTVG(item.tvg));
      }

      
      
      
      
      
      
      

      
      return this.normalizeMetadata(metadata);
    } catch (error) {
      return this.normalizeMetadata(metadata);
    }
  }

  extractFromTitle(title) {
    const metadata = {};

    if (!title) return metadata;

    
    const yearPatterns = [
      /\((\d{4})\)/,
      /\[(\d{4})\]/,
      /[-\s](\d{4})\s/,
      /(\d{4})/ 
    ];

    for (const pattern of yearPatterns) {
      const match = title.match(pattern);
      if (match && match[1] && match[1] >= 1900 && match[1] <= new Date().getFullYear() + 5) {
        metadata.year = match[1];
        break;
      }
    }

    
    const qualityPatterns = [
      /(4K|UHD)/i,
      /(1080p|FULL HD)/i,
      /(720p|HD)/i,
      /(480p|SD)/i
    ];

    for (const pattern of qualityPatterns) {
      const match = title.match(pattern);
      if (match) {
        metadata.quality = match[0].toUpperCase();
        break;
      }
    }

    
    const langPatterns = [
      /(DUBLADO|DUB)/i,
      /(LEGENDADO|LEG)/i,
      /(NACIONAL)/i,
      /(INGLÃŠS|ENGLISH)/i
    ];

    for (const pattern of langPatterns) {
      const match = title.match(pattern);
      if (match) {
        metadata.language = match[0];
        break;
      }
    }

    
    const seasonEpisodePattern = /S(\d{1,2})E(\d{1,2})/i;
    const seasonMatch = title.match(seasonEpisodePattern);
    if (seasonMatch) {
      metadata.season = parseInt(seasonMatch[1]);
      metadata.episode = parseInt(seasonMatch[2]);
    }

    return metadata;
  }

  extractFromCategory(category) {
    if (!category) return {};

    const genreMap = {
      'action': 'AÃ§Ã£o',
      'comedy': 'ComÃ©dia',
      'drama': 'Drama',
      'horror': 'Terror',
      'sci-fi': 'FicÃ§Ã£o CientÃ­fica',
      'scifi': 'FicÃ§Ã£o CientÃ­fica',
      'romance': 'Romance',
      'documentary': 'DocumentÃ¡rio',
      'document': 'DocumentÃ¡rio',
      'thriller': 'Suspense',
      'suspense': 'Suspense',
      'fantasy': 'Fantasia',
      'animation': 'AnimaÃ§Ã£o',
      'anime': 'Anime',
      'family': 'FamÃ­lia',
      'adventure': 'Aventura',
      'crime': 'Crime',
      'mystery': 'MistÃ©rio',
      'western': 'Faroeste',
      'war': 'Guerra',
      'history': 'HistÃ³ria',
      'music': 'MÃºsica',
      'reality': 'Reality Show',
      'talk': 'Talk Show',
      'news': 'NotÃ­cias',
      'sports': 'Esportes'
    };

    const categoryLower = category.toLowerCase();
    
    for (const [key, value] of Object.entries(genreMap)) {
      if (categoryLower.includes(key)) {
        return { genre: value };
      }
    }

    return { genre: category.charAt(0).toUpperCase() + category.slice(1).toLowerCase() };
  }

  extractFromTags(tags) {
    if (!tags || !Array.isArray(tags)) return {};
    return {};
  }

  extractFromTVG(tvg) {
    return {
      channelId: tvg.id,
      channelName: tvg.name,
      channelLogo: tvg.logo,
      channelUrl: tvg.url,
      channel: tvg.name || tvg.id
    };
  }

  async fetchFromTMDB(query, type = 'auto') {
    
    return null;
  }

  normalizeMetadata(metadata) {
    return {
      rating: metadata.rating || this.defaultMetadata.rating,
      year: metadata.year || this.defaultMetadata.year,
      genre: metadata.genre || this.defaultMetadata.genre,
      description: metadata.description || this.defaultMetadata.description,
      poster: metadata.posterUrl || metadata.poster || this.defaultMetadata.poster,
      backdrop: metadata.backdropUrl || metadata.backdrop || this.defaultMetadata.backdrop,
      quality: metadata.quality || this.defaultMetadata.quality,
      language: metadata.language || this.defaultMetadata.language,
      tmdbId: metadata.tmdbId || null,
      imdbId: metadata.imdbId || null,
      popularity: metadata.popularity || 0,
      voteCount: metadata.voteCount || 0,
      channelId: metadata.channelId || null,
      channelName: metadata.channelName || null,
      season: metadata.season || null,
      episode: metadata.episode || null
    };
  }

  async extractBatch(items, options = {}) {
    const results = [];
    const batchSize = options.batchSize || 10;
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(item => this.extract(item, { ...options, fetchFromTMDB: false }))
      );
      results.push(...batchResults);
    }
    
    return results;
  }

  extractPlaybackInfo(item) {
    return {
      url: item.url,
      name: item.name,
      title: item.title,
      group: item.group,
      type: item.type || 'live',
      metadata: {
        duration: item.duration,
        bitrate: item.bitrate,
        codec: item.codec,
        resolution: item.resolution
      }
    };
  }
}

export const metadataExtractor = new MetadataExtractor();
export default metadataExtractor;
