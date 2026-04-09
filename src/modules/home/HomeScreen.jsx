
import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { usePlaylist } from '../../shared/hooks/usePlaylist';
import { tmdbService } from '../../core/services/tmdb/TMDBService';
import WelcomeScreen from './components/WelcomeScreen';
import HeroBanner from './components/HeroBanner';
import CategoryRow from './components/CategoryRow';
import LoadingSpinner from '../../shared/components/Loaders/Spinner';

const EmptyStateScreen = () => (
  <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
    <div className="absolute inset-0">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-600/5 via-zinc-950 to-zinc-950" />
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, rgb(255 255 255 / 0.02) 1px, transparent 0)`,
        backgroundSize: '48px 48px'
      }} />
    </div>
    <div className="relative z-10 text-center">
      <p className="text-zinc-500 mb-2">Nenhum conteúdo em alta encontrado na sua playlist</p>
      <p className="text-zinc-600 text-sm">Adicione mais conteúdo à sua playlist</p>
    </div>
  </div>
);

const extractTMDBIdFromUrl = (url) => {
  if (!url) return null;
  const filename = url.split('/').pop();
  const id = filename.replace(/\.(jpg|jpeg|png|webp)$/i, '');
  return id;
};

const HOME_TRENDING_CACHE_TTL = 5 * 60 * 1000;
const homeTrendingCache = new Map();
const homeLookupCache = new Map();

const normalizeLookupText = (value) => {
  if (!value) return '';
  return value
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
};

const buildHomeLookupMaps = (userMovies = [], userSeries = []) => {
  const moviesMap = new Map();
  const seriesMap = new Map();

  userMovies.forEach((movie) => {
    const logoUrl = movie.tvg?.logo || movie.logo;
    const tmdbId = movie.tmdbImageId || movie.tvg?.tmdbImageId || extractTMDBIdFromUrl(logoUrl);

    if (tmdbId) {
      moviesMap.set(`movie_id_${tmdbId}`, { item: movie, type: 'movie' });
    }

    const name = (movie.name || movie.title || '').toLowerCase().trim();
    const normalized = normalizeLookupText(name);
    moviesMap.set(`movie_name_${name}`, { item: movie, type: 'movie' });
    moviesMap.set(`movie_name_${normalized}`, { item: movie, type: 'movie' });
  });

  userSeries.forEach((serie) => {
    const logoUrl = serie.tvg?.logo || serie.logo;
    const tmdbId = serie.tmdbImageId || serie.tvg?.tmdbImageId || extractTMDBIdFromUrl(logoUrl);

    if (tmdbId) {
      seriesMap.set(`series_id_${tmdbId}`, { item: serie, type: 'series' });
    }

    const name = (serie.name || serie.title || serie.seriesName || '').toLowerCase().trim();
    const normalized = normalizeLookupText(name);
    seriesMap.set(`series_name_${name}`, { item: serie, type: 'series' });
    seriesMap.set(`series_name_${normalized}`, { item: serie, type: 'series' });
  });

  return { moviesMap, seriesMap };
};

const HomeScreen = ({ sidebarWidth = 0, isSidebarCollapsed = false }) => {
  const navigate = useNavigate();
  const { 
    activePlaylist,
    playlists, 
    isLoading: playlistLoading, 
    getLiveChannels,
    getMovies,
    getSeries
  } = usePlaylist();
  
  const [matchedTrending, setMatchedTrending] = useState([]);
  const [fallbackTrending, setFallbackTrending] = useState([]);
  const [heroTrending, setHeroTrending] = useState([]);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  
  const playlistsArray = Array.isArray(playlists) ? playlists : [];
  const hasPlaylist = playlistsArray.length > 0;

  const liveChannels = getLiveChannels();
  const visibleLiveChannels = liveChannels;
  const userMovies = getMovies();
  const userSeries = getSeries();
  const activePlaylistId = activePlaylist?.id || 'no-playlist';

  const homeLookupKey = `${activePlaylistId}|m:${userMovies.length}|s:${userSeries.length}`;
  const { moviesMap: userMoviesMap, seriesMap: userSeriesMap } = useMemo(() => {
    const cached = homeLookupCache.get(homeLookupKey);
    if (cached) {
      return cached;
    }

    const built = buildHomeLookupMaps(userMovies, userSeries);
    homeLookupCache.set(homeLookupKey, built);
    return built;
  }, [homeLookupKey, userMovies, userSeries]);

  
  useEffect(() => {
    let isCancelled = false;

    const initializeData = async () => {
      if (playlistLoading) return;
      
      if (!hasPlaylist) {
        setIsInitialLoading(false);
        return;
      }

      const cached = homeTrendingCache.get(activePlaylistId);
      if (cached && (Date.now() - cached.timestamp) < HOME_TRENDING_CACHE_TTL) {
        setMatchedTrending(cached.items || []);
        setFallbackTrending(cached.fallbackItems || []);
        setHeroTrending(cached.heroItems || []);
        setIsInitialLoading(false);
        return;
      }
      
      setIsInitialLoading(true);
      
      try {
        const [hero, week] = await Promise.all([
          tmdbService.getHeroContent(),
          tmdbService.getTrending('week')
        ]);

        const heroItems = (hero || []).filter((item) => item?.backdropUrl || item?.posterUrl);
        setHeroTrending(heroItems);

        const trending = week || [];
        const fallbackItems = trending.slice(0, 20);
        setFallbackTrending(fallbackItems);
        
        const matched = [];
        
        for (const trend of trending) {
          if (isCancelled) return;

          const trendImageId = extractTMDBIdFromUrl(trend.posterUrl);
          const trendType = trend.type;
          const title = (trend.title || trend.name || '').toLowerCase().trim();
          const semAcento = normalizeLookupText(title);
          
          let userMatch = null;
          
          if (trendImageId) {
            if (trendType === 'movie') {
              userMatch = userMoviesMap.get(`movie_id_${trendImageId}`);
            } else if (trendType === 'tv') {
              userMatch = userSeriesMap.get(`series_id_${trendImageId}`);
            }
          }
          
          if (!userMatch) {
            if (trendType === 'movie') {
              userMatch = userMoviesMap.get(`movie_name_${title}`) || userMoviesMap.get(`movie_name_${semAcento}`);
            } else if (trendType === 'tv') {
              userMatch = userSeriesMap.get(`series_name_${title}`) || userSeriesMap.get(`series_name_${semAcento}`);
            }
          }
          
          if (userMatch) {
            matched.push({
              ...trend,
              userItem: userMatch.item,
              userType: userMatch.type,
              logo: userMatch.item.tvg?.logo || userMatch.item.logo,
              url: userMatch.item.url
            });
          }
        }

        homeTrendingCache.set(activePlaylistId, {
          items: matched,
          fallbackItems,
          heroItems,
          timestamp: Date.now()
        });

        if (!isCancelled) {
          setMatchedTrending(matched);
        }
        
      } catch (error) {
        if (!isCancelled) {
          setMatchedTrending([]);
          setHeroTrending([]);
        }
      } finally {
        if (!isCancelled) {
          setIsInitialLoading(false);
        }
      }
    };
    
    initializeData();

    return () => {
      isCancelled = true;
    };
  }, [playlistLoading, hasPlaylist, activePlaylistId, userMoviesMap, userSeriesMap]);

  
  const liveByGroup = useMemo(() => {
    const groups = new Map();
    visibleLiveChannels.forEach(channel => {
      const group = channel.groupTitle || channel.originalGroup || 'Geral';
      if (!groups.has(group)) {
        groups.set(group, []);
      }
      groups.get(group).push(channel);
    });
    return Array.from(groups.entries())
      .map(([name, items]) => ({ name, items: items.slice(0, 20) }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [visibleLiveChannels]);

  
  const heroItems = useMemo(() => {
    return heroTrending.slice(0, 5);
  }, [heroTrending]);

  const trendingForDisplay = matchedTrending.length > 0 ? matchedTrending : fallbackTrending;

  const movieCategories = useMemo(() => {
    return Array.from(new Set(
      userMovies
        .map((item) => item.groupTitle || item.group || 'Filmes')
        .filter(Boolean)
    )).sort((a, b) => a.localeCompare(b));
  }, [userMovies]);

  const seriesCategories = useMemo(() => {
    return Array.from(new Set(
      userSeries
        .map((item) => item.groupTitle || item.group || 'Series')
        .filter(Boolean)
    )).sort((a, b) => a.localeCompare(b));
  }, [userSeries]);

  
  if (playlistLoading || (isInitialLoading && hasPlaylist)) {
    return (
      <div className="min-h-screen bg-zinc-950 w-full overflow-x-hidden">
        <div className="fixed inset-0" style={{ left: sidebarWidth }}>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-600/5 via-zinc-950 to-zinc-950" />
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgb(255 255 255 / 0.02) 1px, transparent 0)`,
            backgroundSize: '48px 48px'
          }} />
        </div>
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }
  
  if (!hasPlaylist) {
    return <WelcomeScreen />;
  }
  
  const hasContent = trendingForDisplay.length > 0 || visibleLiveChannels.length > 0 || userMovies.length > 0 || userSeries.length > 0;
  
  if (!hasContent) {
    return <EmptyStateScreen />;
  }

  const handleHomeCardSelect = (item, rowType) => {
    if (!item) return;

    if (rowType === 'movies') {
      navigate('/movies', { state: { autoPlayItem: item } });
      return;
    }

    if (rowType === 'series') {
      navigate('/series', { state: { openSeries: item } });
      return;
    }

    if (rowType === 'live') {
      navigate('/live', { state: { autoPlayChannel: item } });
      return;
    }

    if (rowType === 'tmdb') {
      if (item.userItem && item.userType === 'movie') {
        navigate('/movies', { state: { autoPlayItem: item.userItem } });
        return;
      }

      if (item.userItem && item.userType === 'series') {
        navigate('/series', { state: { openSeries: item.userItem } });
        return;
      }

      if (item.userItem && item.userType === 'live') {
        navigate('/live', { state: { autoPlayChannel: item.userItem } });
      }
    }
  };

  const handleHeroPlay = (heroItem) => {
    if (!heroItem) return;

    if (heroItem.userItem && heroItem.userType === 'movie') {
      navigate('/movies', { state: { autoPlayItem: heroItem.userItem, startInCinema: false, prefetchedTMDBData: heroItem } });
      return;
    }

    if (heroItem.userItem && heroItem.userType === 'series') {
      navigate('/series', { state: { openSeries: heroItem.userItem } });
      return;
    }

    if (heroItem.userItem && heroItem.userType === 'live') {
      navigate('/live', { state: { autoPlayChannel: heroItem.userItem } });
      return;
    }

    if (heroItem.type === 'movie') {
      navigate('/movies', { state: { autoPlayItem: heroItem, startInCinema: false, prefetchedTMDBData: heroItem } });
      return;
    }

    if (heroItem.type === 'tv') {
      navigate('/series', { state: { openSeries: heroItem } });
    }
  };

  const handleHeroMoreInfo = (heroItem) => {
    if (!heroItem) return;

    if (heroItem.userItem && heroItem.userType === 'movie') {
      navigate('/movies', { state: { autoPlayItem: heroItem.userItem, startInCinema: true, prefetchedTMDBData: heroItem } });
      return;
    }

    if (heroItem.type === 'movie') {
      navigate('/movies', { state: { autoPlayItem: heroItem, startInCinema: true, prefetchedTMDBData: heroItem } });
      return;
    }

    if (heroItem.userItem && heroItem.userType === 'series') {
      navigate('/series', { state: { openSeries: heroItem.userItem } });
      return;
    }

    if (heroItem.type === 'tv') {
      navigate('/series', { state: { openSeries: heroItem } });
    }
  };

  
  return (
    <div className="min-h-screen bg-zinc-950 w-full overflow-x-hidden">
      <div className="fixed inset-0" style={{ left: sidebarWidth }}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-600/5 via-zinc-950 to-zinc-950" />
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgb(255 255 255 / 0.02) 1px, transparent 0)`,
          backgroundSize: '48px 48px'
        }} />
      </div>

      <div className="relative z-10 w-full">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <HeroBanner
            items={heroItems}
            onPlay={handleHeroPlay}
            onMoreInfo={handleHeroMoreInfo}
          />
        </motion.div>
        
        <div className="w-full py-6 space-y-8">
          {}
          {trendingForDisplay.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.08 }}>
              <CategoryRow 
                title="Em Alta"
                type="tmdb"
                items={trendingForDisplay.slice(0, 20)}
                viewAllPath="/trending"
                onItemSelect={handleHomeCardSelect}
              />
            </motion.div>
          )}
          
          {}
          {userMovies.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.12 }}>
              <CategoryRow 
                title="Filmes"
                type="movies"
                items={userMovies}
                categories={movieCategories}
                viewAllPath="/movies"
                onItemSelect={handleHomeCardSelect}
              />
            </motion.div>
          )}
          
          {}
          {userSeries.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.16 }}>
              <CategoryRow 
                title="Séries"
                type="series"
                items={userSeries}
                categories={seriesCategories}
                viewAllPath="/series"
                onItemSelect={handleHomeCardSelect}
              />
            </motion.div>
          )}
          
          {}
          {liveByGroup.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
              <CategoryRow 
                title="Canais Ao Vivo"
                type="live"
                items={visibleLiveChannels.slice(0, 100)}
                categories={liveByGroup.map(g => g.name)}
                viewAllPath="/live"
                onItemSelect={handleHomeCardSelect}
              />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;
