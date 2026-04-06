
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
    const { category = 'popular', page = 1 } = req.query;
    
    let endpoint;
    switch (category) {
      case 'popular':
        endpoint = '/movie/popular';
        break;
      case 'now_playing':
        endpoint = '/movie/now_playing';
        break;
      case 'upcoming':
        endpoint = '/movie/upcoming';
        break;
      case 'top_rated':
        endpoint = '/movie/top_rated';
        break;
      default:
        endpoint = '/movie/popular';
    }
    
    const data = await fetchTMDB(endpoint, { page });
    
    const formattedMovies = (data.results || []).map(item => formatMediaItem(item, 'movie'));

    res.status(200).json({
      success: true,
      data: formattedMovies,
      pagination: {
        page: data.page,
        totalPages: data.total_pages,
        totalResults: data.total_results
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch movies', message: error.message });
  }
};
