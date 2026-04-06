
const { fetchTMDB, formatMediaItem, getSearchScore, extractImageIdFromUrl } = require('../utils/tmdb');

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
    const { query, page = 1, imageId, posterId, logoId } = req.query;
    
    if (!query || query.trim() === '') {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const decodedQuery = decodeURIComponent(query);
    const preferredImageId = extractImageIdFromUrl(imageId || posterId || logoId) || (imageId || posterId || logoId || '').toString();
    
    const [movies, tvShows] = await Promise.all([
      fetchTMDB('/search/movie', { query: decodedQuery, page }),
      fetchTMDB('/search/tv', { query: decodedQuery, page })
    ]);

    const formattedMovies = (movies.results || []).map((item) => ({
      ...formatMediaItem(item, 'movie'),
      matchScore: getSearchScore(item, decodedQuery, preferredImageId),
      matchedByImage: preferredImageId ? item.poster_path?.includes(preferredImageId) || item.backdrop_path?.includes(preferredImageId) : false
    }));
    const formattedTvShows = (tvShows.results || []).map((item) => ({
      ...formatMediaItem(item, 'tv'),
      matchScore: getSearchScore(item, decodedQuery, preferredImageId),
      matchedByImage: preferredImageId ? item.poster_path?.includes(preferredImageId) || item.backdrop_path?.includes(preferredImageId) : false
    }));

    const allResults = [...formattedMovies, ...formattedTvShows]
      .sort((a, b) => {
        if ((b.matchScore || 0) !== (a.matchScore || 0)) return (b.matchScore || 0) - (a.matchScore || 0);
        return (b.popularity || 0) - (a.popularity || 0);
      });

    res.status(200).json({
      success: true,
      data: allResults,
      pagination: {
        page: parseInt(page),
        totalPages: Math.max(movies.total_pages || 0, tvShows.total_pages || 0),
        totalResults: (movies.total_results || 0) + (tvShows.total_results || 0)
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to search content', message: error.message });
  }
};
