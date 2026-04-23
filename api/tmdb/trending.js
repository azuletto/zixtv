
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
    const safeWindow = String(req.query.timeWindow || 'week').toLowerCase() === 'day' ? 'day' : 'week';
    const safePage = Math.max(1, parseInt(req.query.page || '1', 10) || 1);
    const safeLimit = Math.min(100, Math.max(1, parseInt(req.query.limit || '50', 10) || 50));

    const [movieData, tvData] = await Promise.all([
      fetchTMDB(`/trending/movie/${safeWindow}`, { page: safePage }),
      fetchTMDB(`/trending/tv/${safeWindow}`, { page: safePage })
    ]);

    const movieItems = (movieData.results || []).map((item) => formatMediaItem(item, 'movie'));
    const tvItems = (tvData.results || []).map((item) => formatMediaItem(item, 'tv'));

    const uniqueMap = new Map();
    [...movieItems, ...tvItems].forEach((item) => {
      if (!item) return;
      const type = String(item.type || '').toLowerCase() === 'tv' ? 'tv' : 'movie';
      const key = `${type}:${item.id}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, item);
      }
    });

    const sorted = Array.from(uniqueMap.values())
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      .slice(0, safeLimit);
    
    res.status(200).json({
      success: true,
      data: sorted,
      total: sorted.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch trending content', message: error.message });
  }
};
