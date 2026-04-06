
const { fetchTMDB, formatMediaItem } = require('../utils/tmdb');

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
    
    const [trendingMovies, trendingTV] = await Promise.all([
      fetchTMDB('/trending/movie/week', { page: 1 }),
      fetchTMDB('/trending/tv/week', { page: 1 })
    ]);

    const heroItems = [
      ...(trendingMovies.results || []).slice(0, 5).map(item => formatMediaItem(item, 'movie')),
      ...(trendingTV.results || []).slice(0, 5).map(item => formatMediaItem(item, 'tv'))
    ].sort(() => Math.random() - 0.5); 

    res.status(200).json({
      success: true,
      data: heroItems
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch hero content', message: error.message });
  }
};
