
export class TMDBService {
  constructor() {
    this.baseUrl = '/api/tmdb';
  }

  async fetchFromAPI(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = `${this.baseUrl}${endpoint}${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }
    const data = await response.json();
    return data;
  }

  async getTrending(timeWindow = 'day', page = 1) {
    const data = await this.fetchFromAPI('/trending', { timeWindow, page });
    return data.data || [];
  }

  async getMovies(category = 'popular', page = 1) {
    const data = await this.fetchFromAPI('/movies', { category, page });
    return data.data || [];
  }

  async getTVShows(category = 'popular', page = 1) {
    const data = await this.fetchFromAPI('/tv', { category, page });
    return data.data || [];
  }

  async getHeroContent() {
    const data = await this.fetchFromAPI('/hero');
    return data.data || [];
  }

  async search(query, page = 1, options = {}) {
    if (typeof page === 'object' && page !== null) {
      options = page;
      page = 1;
    }

    const data = await this.fetchFromAPI('/search', { query, page, ...options });
    return data.data || [];
  }

  async getDetails(type, id) {
    const data = await this.fetchFromAPI('/details', { type, id });
    return data.data;
  }
}

export const tmdbService = new TMDBService();