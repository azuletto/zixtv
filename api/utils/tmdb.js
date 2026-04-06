
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

const normalizeText = (value = '') => value
  .toString()
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9\s]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const extractImageIdFromUrl = (value) => {
  if (!value) return null;
  const match = value.toString().match(/\/([^/]+)\.(?:jpg|jpeg|png|webp)(?:\?.*)?$/i);
  return match ? match[1] : null;
};

const getPathImageId = (value) => {
  if (!value) return null;
  const cleanPath = value.toString().split('?')[0].split('/').pop() || '';
  return cleanPath.replace(/\.(jpg|jpeg|png|webp)$/i, '');
};

const getSearchScore = (item, query, imageId) => {
  if (!item) return 0;

  let score = 0;
  const title = normalizeText(item.title || item.name || '');
  const queryText = normalizeText(query || '');
  const posterId = getPathImageId(item.poster_path || item.posterUrl);
  const backdropId = getPathImageId(item.backdrop_path || item.backdropUrl);

  if (imageId) {
    if (posterId && posterId === imageId) score += 1000;
    if (backdropId && backdropId === imageId) score += 900;
  }

  if (queryText && title === queryText) {
    score += 500;
  } else if (queryText && title.includes(queryText)) {
    score += 250;
  }

  if (queryText) {
    const queryTokens = queryText.split(' ').filter(Boolean);
    const titleTokens = title.split(' ').filter(Boolean);
    const sharedTokens = queryTokens.filter((token) => titleTokens.includes(token)).length;
    score += sharedTokens * 15;
  }

  score += Math.min((item.popularity || 0) / 10, 100);
  return score;
};

const fetchTMDB = async (endpoint, params = {}) => {
  if (!TMDB_API_KEY) {
    throw new Error('TMDB_API_KEY não configurada');
  }

  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  url.searchParams.append('api_key', TMDB_API_KEY);
  url.searchParams.append('language', 'pt-BR');
  
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.status}`);
  }
  return response.json();
};

const getImageUrl = (path, size = 'medium', type = 'poster') => {
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
  return `${TMDB_IMAGE_BASE_URL}/${imageSize}${path}`;
};

const formatMediaItem = (item, type) => {
  if (!item) return null;
  const posterImageId = getPathImageId(item.poster_path);
  const backdropImageId = getPathImageId(item.backdrop_path);
  
  return {
    id: item.id,
    title: item.title || item.name,
    name: item.name || item.title,
    overview: item.overview,
    posterPath: item.poster_path,
    backdropPath: item.backdrop_path,
    releaseDate: item.release_date || item.first_air_date,
    voteAverage: item.vote_average,
    voteCount: item.vote_count,
    popularity: item.popularity,
    type: type,
    posterUrl: getImageUrl(item.poster_path, 'medium', 'poster'),
    backdropUrl: getImageUrl(item.backdrop_path, 'large', 'backdrop'),
    posterImageId,
    backdropImageId,
    year: (item.release_date || item.first_air_date)?.split('-')[0]
  };
};

module.exports = {
  fetchTMDB,
  getImageUrl,
  formatMediaItem,
  normalizeText,
  extractImageIdFromUrl,
  getPathImageId,
  getSearchScore
};