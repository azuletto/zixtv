
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

const HOME_TITLE_STOP_WORDS = new Set([
  'a', 'as', 'o', 'os', 'de', 'da', 'do', 'das', 'dos', 'e', 'em', 'na', 'no', 'nas', 'nos',
  'the', 'and', 'of', 'to', 'for', 'part', 'season', 'episode', 'episodio', 'episódio',
  'filme', 'filmes', 'serie', 'series', 'movie', 'movies', 'tv'
]);

const escapeRegExp = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const stripBracketSegments = (value) => String(value || '').replace(/\[[^\]]*\]/g, ' ');

const normalizeLookupText = (value) => {
  if (!value) return '';
  return value
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\[[^\]]*\]/g, ' ')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const buildFlexibleTitleRegex = (value) => {
  const normalized = normalizeLookupText(value);
  if (!normalized) return null;

  const tokens = normalized
    .split(' ')
    .filter((token) => token && !HOME_TITLE_STOP_WORDS.has(token));

  if (!tokens.length) return null;

  if (tokens.length === 1) {
    return new RegExp(`\\b${escapeRegExp(tokens[0])}\\b`, 'i');
  }

  const lookaheads = tokens.map((token) => `(?=.*\\b${escapeRegExp(token)}\\b)`).join('');
  return new RegExp(`^${lookaheads}.*$`, 'i');
};

const extractSearchAliases = (item = {}) => {
  const aliases = [
    item.name,
    item.title,
    item.seriesName,
    item.originalName,
    item.originalTitle,
    item.metadata?.title,
    item.metadata?.name,
    item.metadata?.seriesName,
    item.tvg?.name
  ]
    .map(stripBracketSegments)
    .map(normalizeLookupText)
    .filter(Boolean);

  return Array.from(new Set(aliases));
};

const buildSearchIndex = (items = []) => {
  return items.map((item) => {
    const aliases = extractSearchAliases(item);
    return {
      item,
      aliases,
      regexes: aliases.map(buildFlexibleTitleRegex).filter(Boolean),
      tmdbId: item.tmdbImageId || item.tvg?.tmdbImageId || extractTMDBIdFromUrl(item.tvg?.logo || item.logo)
    };
  });
};

const extractTMDBAliases = (item = {}) => {
  return Array.from(new Set([
    item.title,
    item.name,
    item.original_title,
    item.original_name,
    item.displayTitle
  ]
    .map(normalizeLookupText)
    .filter(Boolean)));
};

const scoreIndexMatch = (tmdbItem, indexedItem) => {
  if (!tmdbItem || !indexedItem) return 0;

  const tmdbAliases = extractTMDBAliases(tmdbItem);
  if (tmdbAliases.length === 0) return 0;

  const tmdbRegexes = tmdbAliases.map(buildFlexibleTitleRegex).filter(Boolean);
  const tmdbTokenSet = new Set(tmdbAliases.flatMap((alias) => alias.split(' ').filter(Boolean)));

  if (tmdbItem.posterUrl) {
    const posterId = extractTMDBIdFromUrl(tmdbItem.posterUrl);
    if (posterId && indexedItem.tmdbId && posterId === indexedItem.tmdbId) {
      return 100;
    }
  }

  if (tmdbAliases.some((alias) => indexedItem.aliases.includes(alias))) {
    return 95;
  }

  if (tmdbRegexes.some((regex) => indexedItem.aliases.some((alias) => regex.test(alias)))) {
    return 90;
  }

  if (indexedItem.regexes.some((regex) => tmdbAliases.some((alias) => regex.test(alias)))) {
    return 88;
  }

  let overlapScore = 0;
  indexedItem.aliases.forEach((alias) => {
    const aliasTokens = alias.split(' ').filter(Boolean);
    const overlap = aliasTokens.filter((token) => tmdbTokenSet.has(token)).length;
    if (overlap > overlapScore) {
      overlapScore = overlap;
    }
  });

  return overlapScore > 1 ? 50 + overlapScore : 0;
};

const buildResolvedHomeItem = (playlistItem, tmdbItem = null) => {
  if (!playlistItem) return null;

  const title = playlistItem.name || playlistItem.title || playlistItem.seriesName || tmdbItem?.title || tmdbItem?.name || '';
  const posterUrl = playlistItem.tvg?.logo || playlistItem.logo || tmdbItem?.posterUrl || null;
  const backdropUrl = tmdbItem?.backdropUrl || tmdbItem?.posterUrl || playlistItem.tvg?.logo || playlistItem.logo || null;

  return {
    ...playlistItem,
    name: title,
    title,
    posterUrl,
    backdropUrl,
    voteAverage: tmdbItem?.voteAverage ?? playlistItem.voteAverage,
    overview: tmdbItem?.overview || playlistItem.overview || '',
    year: tmdbItem?.year || playlistItem.year,
    prefetchedTMDBData: tmdbItem,
    tmdbData: tmdbItem,
    source: tmdbItem ? 'tmdb-match' : 'playlist-fallback'
  };
};

const pickFallbackPlaylistItem = ({ preferredType, usedIds, moviesIndex, seriesIndex, allIndex }) => {
  const pools = [
    preferredType === 'movie' ? moviesIndex : preferredType === 'tv' ? seriesIndex : [],
    allIndex
  ];

  for (const pool of pools) {
    const candidate = pool.find(({ item }) => !usedIds.has(item.id));
    if (candidate) return candidate;
  }

  return null;
};

const resolveHomeDisplayItems = ({ tmdbItems = [], preferredType, moviesIndex, seriesIndex, allIndex, usedIds }) => {
  const primaryPool = preferredType === 'movie' ? moviesIndex : preferredType === 'tv' ? seriesIndex : allIndex;

  return tmdbItems.reduce((resolved, tmdbItem) => {
    const targetType = tmdbItem?.type === 'tv' ? 'tv' : 'movie';
    const typePool = targetType === 'movie' ? moviesIndex : seriesIndex;
    const searchPools = [typePool, primaryPool, allIndex].filter((pool, index, self) => pool && self.indexOf(pool) === index);

    let bestMatch = null;
    let bestScore = 0;

    for (const pool of searchPools) {
      for (const indexedItem of pool) {
        if (usedIds.has(indexedItem.item.id)) continue;

        const score = scoreIndexMatch(tmdbItem, indexedItem);
        if (score > bestScore) {
          bestScore = score;
          bestMatch = indexedItem;
        }
      }
    }

    if (bestMatch && bestScore >= 80) {
      usedIds.add(bestMatch.item.id);
      resolved.push(buildResolvedHomeItem(bestMatch.item, tmdbItem));
      return resolved;
    }

    const fallback = pickFallbackPlaylistItem({
      preferredType: targetType,
      usedIds,
      moviesIndex,
      seriesIndex,
      allIndex
    });

    if (fallback) {
      usedIds.add(fallback.item.id);
      resolved.push(buildResolvedHomeItem(fallback.item, null));
    }

    return resolved;
  }, []);
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
  const { moviesIndex: userMoviesIndex, seriesIndex: userSeriesIndex, allIndex: userAllIndex } = useMemo(() => {
    const cached = homeLookupCache.get(homeLookupKey);
    if (cached) {
      return cached;
    }

    const built = {
      moviesIndex: buildSearchIndex(userMovies),
      seriesIndex: buildSearchIndex(userSeries)
    };

    built.allIndex = [...built.moviesIndex, ...built.seriesIndex];

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

        const usedIds = new Set();
        const heroItems = resolveHomeDisplayItems({
          tmdbItems: (hero || []).slice(0, 5),
          preferredType: 'movie',
          moviesIndex: userMoviesIndex,
          seriesIndex: userSeriesIndex,
          allIndex: userAllIndex,
          usedIds
        });

        const matched = resolveHomeDisplayItems({
          tmdbItems: (week || []).slice(0, 20),
          preferredType: 'movie',
          moviesIndex: userMoviesIndex,
          seriesIndex: userSeriesIndex,
          allIndex: userAllIndex,
          usedIds
        });

        homeTrendingCache.set(activePlaylistId, {
          items: matched,
          heroItems,
          timestamp: Date.now()
        });

        if (!isCancelled) {
          setHeroTrending(heroItems);
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
  }, [playlistLoading, hasPlaylist, activePlaylistId, userMoviesIndex, userSeriesIndex, userAllIndex]);

  
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

  const trendingForDisplay = matchedTrending;

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

    const prefetchedTMDBData = item.prefetchedTMDBData || item.tmdbData || null;

    const openMovie = () => {
      navigate('/movies', { state: { autoPlayItem: item, startInCinema: false, prefetchedTMDBData } });
    };

    const openSeries = () => {
      navigate('/series', { state: { openSeries: item } });
    };

    const openLive = () => {
      navigate('/live', { state: { autoPlayChannel: item } });
    };

    if (rowType === 'movies') {
      openMovie();
      return;
    }

    if (rowType === 'series') {
      openSeries();
      return;
    }

    if (rowType === 'live') {
      openLive();
      return;
    }

    if (rowType === 'tmdb') {
      if (item.type === 'movie') {
        openMovie();
        return;
      }

      if (item.type === 'series') {
        openSeries();
        return;
      }

      if (item.type === 'live') {
        openLive();
        return;
      }

      if (item.userItem && item.userType === 'movie') {
        navigate('/movies', { state: { autoPlayItem: item.userItem, startInCinema: false, prefetchedTMDBData } });
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

    if (heroItem.type === 'movie') {
      navigate('/movies', { state: { autoPlayItem: heroItem, startInCinema: false, prefetchedTMDBData: heroItem.prefetchedTMDBData || null } });
      return;
    }

    if (heroItem.type === 'series') {
      navigate('/series', { state: { openSeries: heroItem } });
      return;
    }

    if (heroItem.type === 'live') {
      navigate('/live', { state: { autoPlayChannel: heroItem } });
      return;
    }

    if (heroItem.userItem && heroItem.userType === 'movie') {
      navigate('/movies', { state: { autoPlayItem: heroItem.userItem, startInCinema: false, prefetchedTMDBData: heroItem.prefetchedTMDBData || null } });
      return;
    }

    if (heroItem.userItem && heroItem.userType === 'series') {
      navigate('/series', { state: { openSeries: heroItem.userItem } });
      return;
    }

    if (heroItem.userItem && heroItem.userType === 'live') {
      navigate('/live', { state: { autoPlayChannel: heroItem.userItem } });
    }
  };

  const handleHeroMoreInfo = (heroItem) => {
    if (!heroItem) return;

    if (heroItem.type === 'movie') {
      navigate('/movies', { state: { autoPlayItem: heroItem, startInCinema: true, prefetchedTMDBData: heroItem.prefetchedTMDBData || null } });
      return;
    }

    if (heroItem.type === 'series') {
      navigate('/series', { state: { openSeries: heroItem } });
      return;
    }

    if (heroItem.type === 'live') {
      navigate('/live', { state: { autoPlayChannel: heroItem } });
      return;
    }

    if (heroItem.userItem && heroItem.userType === 'movie') {
      navigate('/movies', { state: { autoPlayItem: heroItem.userItem, startInCinema: true, prefetchedTMDBData: heroItem.prefetchedTMDBData || null } });
      return;
    }

    if (heroItem.userItem && heroItem.userType === 'series') {
      navigate('/series', { state: { openSeries: heroItem.userItem } });
      return;
    }

    if (heroItem.userItem && heroItem.userType === 'live') {
      navigate('/live', { state: { autoPlayChannel: heroItem.userItem } });
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
