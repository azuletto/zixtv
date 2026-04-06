
const { fetchTMDB, formatMediaItem, getImageUrl } = require('../utils/tmdb');

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
    const { type, id } = req.query;
    
    if (!type || !id) {
      return res.status(400).json({ error: 'Type and id are required' });
    }

    let details, credits, videos;
    
    if (type === 'movie') {
      [details, credits, videos] = await Promise.all([
        fetchTMDB(`/movie/${id}`),
        fetchTMDB(`/movie/${id}/credits`),
        fetchTMDB(`/movie/${id}/videos`)
      ]);
    } else if (type === 'tv') {
      [details, credits, videos] = await Promise.all([
        fetchTMDB(`/tv/${id}`),
        fetchTMDB(`/tv/${id}/credits`),
        fetchTMDB(`/tv/${id}/videos`)
      ]);
    } else {
      return res.status(400).json({ error: 'Type must be movie or tv' });
    }

    const formattedDetails = {
      ...formatMediaItem(details, type),
      credits: {
        cast: (credits.cast || []).slice(0, 10).map(actor => ({
          id: actor.id,
          name: actor.name,
          character: actor.character,
          profilePath: actor.profile_path,
          profileUrl: getImageUrl(actor.profile_path, 'medium', 'poster')
        })),
        crew: (credits.crew || []).slice(0, 5).map(member => ({
          id: member.id,
          name: member.name,
          job: member.job
        }))
      },
      videos: (videos.results || []).filter(v => v.type === 'Trailer' && v.site === 'YouTube').slice(0, 3),
      genres: details.genres || [],
      runtime: type === 'movie' ? details.runtime : details.episode_run_time?.[0],
      status: details.status,
      tagline: details.tagline,
      homepage: details.homepage,
      originalLanguage: details.original_language,
      numberOfSeasons: details.number_of_seasons,
      numberOfEpisodes: details.number_of_episodes
    };

    res.status(200).json({
      success: true,
      data: formattedDetails
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch details', message: error.message });
  }
};
