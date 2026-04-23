
export class TMDBService {
  constructor() {
    this.baseUrl = '/api/tmdb';
    this.tmdbBaseUrl = 'https://api.themoviedb.org/3';
    this.tmdbImageBaseUrl = 'https://image.tmdb.org/t/p';
    this.apiKey = import.meta.env.VITE_TMDB_API_KEY || import.meta.env.TMDB_API_KEY || '';
  }

  extractImageId(path) {
    if (!path || typeof path !== 'string') return null;
    const match = path.match(/\/([^/]+)\.(?:jpg|jpeg|png|webp)(?:\?.*)?$/i);
    return match ? match[1] : null;
  }

  getImageUrl(path, size = 'medium', type = 'poster') {
    if (!path) return null;

    const sizes = {
      poster: {
        small: 'w185',
        medium: 'w342',
        large: 'w500',
        original: 'original'
      },
      backdrop: {
        small: 'w300',
        medium: 'w780',
        large: 'w1280',
        original: 'original'
      }
    };

    const imageSize = sizes[type]?.[size] || sizes[type]?.medium;
    return `${this.tmdbImageBaseUrl}/${imageSize}${path}`;
  }

  formatMediaItem(item, type) {
    if (!item) return null;

    const posterId = this.extractImageId(item.poster_path);
    const backdropId = this.extractImageId(item.backdrop_path);

    return {
      id: item.id,
      title: item.title || item.name,
      displayTitle: item.title || item.name,
      name: item.name || item.title,
      overview: item.overview,
      posterPath: item.poster_path,
      backdropPath: item.backdrop_path,
      posterId,
      backdropId,
      releaseDate: item.release_date || item.first_air_date,
      voteAverage: item.vote_average,
      voteCount: item.vote_count,
      popularity: item.popularity,
      type,
      posterUrl: this.getImageUrl(item.poster_path, 'medium', 'poster'),
      backdropUrl: this.getImageUrl(item.backdrop_path, 'large', 'backdrop'),
      year: (item.release_date || item.first_air_date)?.split('-')[0]
    };
  }

  async fetchDirectTMDB(endpoint, params = {}) {
    if (!this.apiKey) {
      throw new Error('TMDB key missing: set VITE_TMDB_API_KEY in .env for local fallback');
    }

    const url = new URL(`${this.tmdbBaseUrl}${endpoint}`);
    url.searchParams.append('api_key', this.apiKey);
    url.searchParams.append('language', 'pt-BR');

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.append(key, String(value));
      }
    });

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`TMDB direct API error: ${response.status}`);
    }

    return response.json();
  }

  async fetchFromDirectFallback(endpoint, params = {}) {
    if (endpoint === '/hero') {
      const [trendingMovies, trendingTV] = await Promise.all([
        this.fetchDirectTMDB('/trending/movie/week', { page: 1 }),
        this.fetchDirectTMDB('/trending/tv/week', { page: 1 })
      ]);

      const heroItems = [
        ...(trendingMovies.results || []).slice(0, 5).map((item) => this.formatMediaItem(item, 'movie')),
        ...(trendingTV.results || []).slice(0, 5).map((item) => this.formatMediaItem(item, 'tv'))
      ];

      return { success: true, data: heroItems };
    }

    if (endpoint === '/trending') {
      const timeWindow = params.timeWindow || 'week';
      const page = params.page || 1;
      const limit = Number(params.limit || 50);

      const [movies, tv] = await Promise.all([
        this.fetchDirectTMDB(`/trending/movie/${timeWindow}`, { page }),
        this.fetchDirectTMDB(`/trending/tv/${timeWindow}`, { page })
      ]);

      const merged = [
        ...(movies.results || []).map((item) => this.formatMediaItem(item, 'movie')),
        ...(tv.results || []).map((item) => this.formatMediaItem(item, 'tv'))
      ]
        .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
        .slice(0, limit);

      return { success: true, data: merged };
    }

    if (endpoint === '/movies') {
      const category = params.category || 'popular';
      const page = params.page || 1;

      const movieEndpoint = {
        popular: '/movie/popular',
        now_playing: '/movie/now_playing',
        upcoming: '/movie/upcoming',
        top_rated: '/movie/top_rated'
      }[category] || '/movie/popular';

      const data = await this.fetchDirectTMDB(movieEndpoint, { page });
      return { success: true, data: (data.results || []).map((item) => this.formatMediaItem(item, 'movie')) };
    }

    if (endpoint === '/tv') {
      const category = params.category || 'popular';
      const page = params.page || 1;

      const tvEndpoint = {
        popular: '/tv/popular',
        airing_today: '/tv/airing_today',
        on_the_air: '/tv/on_the_air',
        top_rated: '/tv/top_rated'
      }[category] || '/tv/popular';

      const data = await this.fetchDirectTMDB(tvEndpoint, { page });
      return { success: true, data: (data.results || []).map((item) => this.formatMediaItem(item, 'tv')) };
    }

    if (endpoint === '/search') {
      const query = params.query || '';
      const page = params.page || 1;
      const includeAdult = params.includeAdult === true;

      const [movies, tvShows] = await Promise.all([
        this.fetchDirectTMDB('/search/movie', { query, page, include_adult: includeAdult }),
        this.fetchDirectTMDB('/search/tv', { query, page, include_adult: includeAdult })
      ]);

      const allResults = [
        ...(movies.results || []).map((item) => this.formatMediaItem(item, 'movie')),
        ...(tvShows.results || []).map((item) => this.formatMediaItem(item, 'tv'))
      ].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

      return { success: true, data: allResults };
    }

    if (endpoint === '/details') {
      const type = params.type;
      const id = params.id;

      if (!type || !id) {
        throw new Error('Type and id are required for details endpoint');
      }

      const prefix = type === 'movie' ? '/movie' : '/tv';
      const [details, credits, videos] = await Promise.all([
        this.fetchDirectTMDB(`${prefix}/${id}`),
        this.fetchDirectTMDB(`${prefix}/${id}/credits`),
        this.fetchDirectTMDB(`${prefix}/${id}/videos`)
      ]);

      const formattedDetails = {
        ...this.formatMediaItem(details, type),
        credits: {
          cast: (credits.cast || []).slice(0, 10).map((actor) => ({
            id: actor.id,
            name: actor.name,
            character: actor.character,
            profilePath: actor.profile_path,
            profileUrl: this.getImageUrl(actor.profile_path, 'medium', 'poster')
          })),
          crew: (credits.crew || []).slice(0, 5).map((member) => ({
            id: member.id,
            name: member.name,
            job: member.job
          }))
        },
        videos: (videos.results || []).filter((v) => v.type === 'Trailer' && v.site === 'YouTube').slice(0, 3),
        genres: details.genres || [],
        runtime: type === 'movie' ? details.runtime : details.episode_run_time?.[0],
        status: details.status,
        tagline: details.tagline,
        homepage: details.homepage,
        originalLanguage: details.original_language,
        numberOfSeasons: details.number_of_seasons,
        numberOfEpisodes: details.number_of_episodes
      };

      return { success: true, data: formattedDetails };
    }

    throw new Error(`Unsupported TMDB fallback endpoint: ${endpoint}`);
  }

  async fetchFromAPI(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = `${this.baseUrl}${endpoint}${queryString ? `?${queryString}` : ''}`;

    try {
      const response = await fetch(url);
      const contentType = response.headers.get('content-type') || '';

      if (!response.ok) {
        throw new Error(`TMDB API error: ${response.status}`);
      }

      if (!contentType.includes('application/json')) {
        throw new Error(`TMDB API returned non-JSON content (${contentType || 'unknown'})`);
      }

      const data = await response.json();
      return data;
    } catch (_) {
      return this.fetchFromDirectFallback(endpoint, params);
    }
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