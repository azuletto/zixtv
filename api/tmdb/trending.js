
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
    const { timeWindow = 'week', page = 1, limit = 50 } = req.query;
    
    
    const windows = timeWindow === 'all' ? ['day', 'week'] : [timeWindow];
    const pages = [1, 2, 3]; 

    const requests = [];
    
    for (const window of windows) {
      for (const p of pages) {
        requests.push({ type: 'movie', promise: fetchTMDB(`/trending/movie/${window}`, { page: p }) });
        requests.push({ type: 'tv', promise: fetchTMDB(`/trending/tv/${window}`, { page: p }) });
      }
    }
    
    const results = await Promise.all(requests.map((reqItem) => reqItem.promise));
    
    
    let allItems = [];
    
    results.forEach((data, index) => {
      if (data.results) {
        const type = requests[index]?.type || data.results[0]?.media_type || 'movie';
        const formatted = data.results.map(item => formatMediaItem(item, item.media_type || type));
        allItems.push(...formatted);
      }
    });
    
    
    const uniqueMap = new Map();
    for (const item of allItems) {
      if (!uniqueMap.has(item.id)) {
        uniqueMap.set(item.id, item);
      }
    }
    
    const uniqueItems = Array.from(uniqueMap.values());
    
    
    const sorted = uniqueItems
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, parseInt(limit));
    
    res.status(200).json({
      success: true,
      data: sorted,
      total: sorted.length,
      fetched: allItems.length,
      unique: uniqueItems.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch trending content', message: error.message });
  }
};
