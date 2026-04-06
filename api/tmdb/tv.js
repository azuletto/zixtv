
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
        endpoint = '/tv/popular';
        break;
      case 'airing_today':
        endpoint = '/tv/airing_today';
        break;
      case 'on_the_air':
        endpoint = '/tv/on_the_air';
        break;
      case 'top_rated':
        endpoint = '/tv/top_rated';
        break;
      default:
        endpoint = '/tv/popular';
    }
    
    const data = await fetchTMDB(endpoint, { page });
    
    const formattedShows = (data.results || []).map(item => formatMediaItem(item, 'tv'));

    res.status(200).json({
      success: true,
      data: formattedShows,
      pagination: {
        page: data.page,
        totalPages: data.total_pages,
        totalResults: data.total_results
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch TV shows', message: error.message });
  }
};
