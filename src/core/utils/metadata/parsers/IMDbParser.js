

export class IMDbParser {
  constructor() {
    this.apiKey = null; 
    this.cache = new Map();
    this.ratingPatterns = [
      /(\d+(?:\.\d+)?)[\s]*\/[\s]*10/i,
      /imdb[\s]*:[\s]*(\d+(?:\.\d+)?)/i,
      /rating[\s]*:[\s]*(\d+(?:\.\d+)?)/i,
      /(\d+(?:\.\d+)?)[\s]*stars?/i
    ];
  }

  async extractFromString(text) {
    if (!text) return null;

    const metadata = {
      rating: null,
      votes: null,
      id: null,
      url: null
    };

    
    const idMatch = text.match(/tt\d{7,8}/i);
    if (idMatch) {
      metadata.id = idMatch[0];
      metadata.url = `https://www.imdb.com/title/${metadata.id}/`;
    }

    
    for (const pattern of this.ratingPatterns) {
      const match = text.match(pattern);
      if (match) {
        metadata.rating = parseFloat(match[1]).toFixed(1);
        break;
      }
    }

    
    const votesMatch = text.match(/(\d+(?:,\d+)?)[\s]*votes?/i);
    if (votesMatch) {
      metadata.votes = parseInt(votesMatch[1].replace(/,/g, ''));
    }

    return metadata;
  }

  async fetchFromAPI(title, year = null) {
    if (!this.apiKey) return null;

    
    const cacheKey = `${title}_${year}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      let url = `http://www.omdbapi.com/?apikey=${this.apiKey}&t=${encodeURIComponent(title)}`;
      if (year) {
        url += `&y=${year}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.Response === 'True') {
        const result = {
          rating: data.imdbRating !== 'N/A' ? data.imdbRating : null,
          votes: data.imdbVotes !== 'N/A' ? parseInt(data.imdbVotes.replace(/,/g, '')) : null,
          id: data.imdbID,
          url: `https://www.imdb.com/title/${data.imdbID}/`,
          poster: data.Poster !== 'N/A' ? data.Poster : null,
          plot: data.Plot !== 'N/A' ? data.Plot : null,
          genre: data.Genre !== 'N/A' ? data.Genre : null,
          year: data.Year !== 'N/A' ? data.Year : null,
          director: data.Director !== 'N/A' ? data.Director : null,
          actors: data.Actors !== 'N/A' ? data.Actors : null
        };

        
        this.cache.set(cacheKey, result);
        return result;
      }
    } catch (error) {
    }

    return null;
  }

  async extractFromItem(item) {
    if (!item || !item.name) return null;

    const metadata = {};

    
    const extracted = await this.extractFromString(item.name);
    if (extracted) {
      Object.assign(metadata, extracted);
    }

    
    if (metadata.id && this.apiKey) {
      try {
        const response = await fetch(`https://www.omdbapi.com/?apikey=${this.apiKey}&i=${metadata.id}`);
        const data = await response.json();
        
        if (data.Response === 'True') {
          metadata.plot = data.Plot !== 'N/A' ? data.Plot : null;
          metadata.genre = data.Genre !== 'N/A' ? data.Genre : null;
          metadata.director = data.Director !== 'N/A' ? data.Director : null;
          metadata.actors = data.Actors !== 'N/A' ? data.Actors : null;
          metadata.poster = data.Poster !== 'N/A' ? data.Poster : null;
        }
      } catch (error) {
      }
    }

    return metadata;
  }

  
  formatRating(rating) {
    if (!rating) return 'N/A';
    return `${rating}/10`;
  }

  formatVotes(votes) {
    if (!votes) return 'N/A';
    
    if (votes >= 1000000) {
      return `${(votes / 1000000).toFixed(1)}M`;
    }
    if (votes >= 1000) {
      return `${(votes / 1000).toFixed(1)}K`;
    }
    return votes.toString();
  }

  getStarRating(rating) {
    if (!rating) return 0;
    return (parseFloat(rating) / 2).toFixed(1);
  }

  getRatingClass(rating) {
    if (!rating) return 'bg-gray-600';
    
    const numRating = parseFloat(rating);
    if (numRating >= 8) return 'bg-green-600';
    if (numRating >= 6) return 'bg-yellow-600';
    if (numRating >= 4) return 'bg-orange-600';
    return 'bg-red-600';
  }
}
