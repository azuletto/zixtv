
const { fetchTMDB, formatMediaItem } = require('../utils/tmdb');

const normalizeType = (value = '') => (String(value || '').toLowerCase() === 'tv' ? 'tv' : 'movie');

const getHeroScore = (item = {}) => {
  const overviewLength = String(item.overview || '').trim().length;
  const hasBackdrop = Boolean(item.backdropUrl || item.backdropPath);
  const hasPoster = Boolean(item.posterUrl || item.posterPath);
  const popularity = Number(item.popularity || 0);
  const voteAverage = Number(item.voteAverage || 0);
  const voteCount = Number(item.voteCount || 0);

  let score = 0;
  score += Math.min(200, popularity);
  score += Math.min(80, voteAverage * 8);
  score += Math.min(60, voteCount / 150);
  if (hasBackdrop) score += 70;
  if (hasPoster) score += 25;
  score += Math.min(40, overviewLength / 6);
  return score;
};

const isHeroCandidate = (item = {}, options = {}) => {
  const requireLongOverview = options.requireLongOverview !== false;
  const title = String(item.title || item.name || '').trim();
  const overviewLength = String(item.overview || '').trim().length;
  const hasBackdrop = Boolean(item.backdropUrl || item.backdropPath);
  const hasPoster = Boolean(item.posterUrl || item.posterPath);

  if (!title) return false;
  if (!hasBackdrop && !hasPoster) return false;
  if (requireLongOverview) {
    return overviewLength >= 20;
  }

  return true;
};

const pickBalancedHeroItems = (items = [], limit = 10) => {
  const movies = items.filter((item) => normalizeType(item.type) === 'movie');
  const series = items.filter((item) => normalizeType(item.type) === 'tv');
  const mixed = [];

  while (mixed.length < limit && (movies.length > 0 || series.length > 0)) {
    if (movies.length > 0) mixed.push(movies.shift());
    if (mixed.length >= limit) break;
    if (series.length > 0) mixed.push(series.shift());
  }

  return mixed.slice(0, limit);
};

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const [
      trendingMoviesPage1,
      trendingMoviesPage2,
      trendingTvPage1,
      trendingTvPage2,
      popularMovies,
      popularTv
    ] = await Promise.all([
      fetchTMDB('/trending/movie/week', { page: 1 }),
      fetchTMDB('/trending/movie/week', { page: 2 }),
      fetchTMDB('/trending/tv/week', { page: 1 }),
      fetchTMDB('/trending/tv/week', { page: 2 }),
      fetchTMDB('/movie/popular', { page: 1 }),
      fetchTMDB('/tv/popular', { page: 1 })
    ]);

    const allItems = [
      ...((trendingMoviesPage1.results || []).map((item) => formatMediaItem(item, 'movie'))),
      ...((trendingMoviesPage2.results || []).map((item) => formatMediaItem(item, 'movie'))),
      ...((trendingTvPage1.results || []).map((item) => formatMediaItem(item, 'tv'))),
      ...((trendingTvPage2.results || []).map((item) => formatMediaItem(item, 'tv'))),
      ...((popularMovies.results || []).map((item) => formatMediaItem(item, 'movie'))),
      ...((popularTv.results || []).map((item) => formatMediaItem(item, 'tv')))
    ].filter(Boolean);

    const uniqueMap = new Map();
    allItems.forEach((item) => {
      const key = `${normalizeType(item.type)}:${item.id}`;
      const score = getHeroScore(item);
      const current = uniqueMap.get(key);
      if (!current || score > current.score) {
        uniqueMap.set(key, { item, score });
      }
    });

    const ranked = Array.from(uniqueMap.values())
      .map((entry) => entry.item)
      .sort((a, b) => getHeroScore(b) - getHeroScore(a));

    const strictCandidates = ranked.filter((item) => isHeroCandidate(item, { requireLongOverview: true }));
    const relaxedCandidates = ranked.filter((item) => isHeroCandidate(item, { requireLongOverview: false }));

    const source = strictCandidates.length >= 10
      ? strictCandidates
      : relaxedCandidates.length >= 10
        ? relaxedCandidates
        : ranked;
    const heroItems = pickBalancedHeroItems(source, 10);

    res.status(200).json({
      success: true,
      data: heroItems
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch hero content', message: error.message });
  }
};
