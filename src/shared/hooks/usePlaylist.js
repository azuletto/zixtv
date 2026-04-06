
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePlaylistStore } from '../../app/store/playlistStore';
import { PlaylistService } from '../../core/services/playlist/PlaylistService';
import { useCallback, useRef, useMemo } from 'react';

const playlistService = new PlaylistService();

const categoryCache = new Map();
const processingQueue = new Map();
const nameCollator = new Intl.Collator('pt-BR', { sensitivity: 'base', numeric: true });
const seasonEpisodeRegex = /(.*?)[\s._-]*S(\d{1,3})[\s._-]*E(\d{1,3})\b/i;

const compareByName = (a, b) => nameCollator.compare(a?.name || '', b?.name || '');

const normalizeSeriesKey = (value = '') => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9\s]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const migrateVodSeries = (playlist) => {
  if (!playlist) return playlist;

  const movies = Array.isArray(playlist.movies) ? playlist.movies : [];
  const currentSeries = Array.isArray(playlist.series) ? playlist.series : [];

  const detectedEpisodes = [];
  const remainingMovies = [];

  movies.forEach((movie) => {
    const rawName = movie?.name || movie?.title || '';
    const match = rawName.match(seasonEpisodeRegex);

    if (!match) {
      remainingMovies.push(movie);
      return;
    }

    const baseName = (match[1] || rawName).trim() || rawName;
    const season = parseInt(match[2], 10);
    const episode = parseInt(match[3], 10);

    detectedEpisodes.push({
      ...movie,
      type: 'series',
      name: baseName,
      title: baseName,
      seriesName: baseName,
      season,
      episode,
      seasonEpisode: `S${String(season).padStart(2, '0')}E${String(episode).padStart(2, '0')}`,
      seriesId: normalizeSeriesKey(baseName)
    });
  });

  if (detectedEpisodes.length === 0) {
    return playlist;
  }

  const seriesMap = new Map();

  [...currentSeries, ...detectedEpisodes].forEach((entry) => {
    if (Array.isArray(entry?.episodes)) {
      const key = normalizeSeriesKey(entry.seriesName || entry.name || entry.title || 'serie');
      seriesMap.set(key, {
        ...entry,
        id: entry.id || `series-${key}`,
        type: 'series',
        episodes: [...entry.episodes]
      });
      return;
    }

    const baseName = entry.seriesName || entry.name || entry.title || 'Serie';
    const key = normalizeSeriesKey(baseName);
    const episodeItem = {
      ...entry,
      type: 'series',
      name: entry.name || entry.title || baseName,
      title: entry.title || entry.name || baseName,
      seriesName: baseName,
      seriesId: key
    };

    if (!seriesMap.has(key)) {
      seriesMap.set(key, {
        ...episodeItem,
        id: `series-${key}`,
        name: baseName,
        title: baseName,
        episodes: []
      });
    }

    const seriesEntry = seriesMap.get(key);
    seriesEntry.episodes.push(episodeItem);
  });

  const mergedSeries = Array.from(seriesMap.values()).map((series) => ({
    ...series,
    episodes: [...(series.episodes || [])].sort((a, b) => {
      if ((a.season || 0) !== (b.season || 0)) return (a.season || 0) - (b.season || 0);
      return (a.episode || 0) - (b.episode || 0);
    })
  }));

  return {
    ...playlist,
    movies: remainingMovies,
    series: mergedSeries
  };
};

const buildLiveCacheEntry = (liveChannels = []) => {
  const categoriesMap = new Map();

  liveChannels.forEach(channel => {
    const category = channel.groupTitle || channel.originalGroup || channel.group || channel.category || 'Canais Gerais';
    if (!categoriesMap.has(category)) {
      categoriesMap.set(category, []);
    }
    categoriesMap.get(category).push(channel);
  });

  const sortedCategories = Array.from(categoriesMap.keys()).sort((a, b) => a.localeCompare(b));
  const channelsByCategory = new Map();
  const groupedChannels = [];
  const flatChannels = [];

  sortedCategories.forEach((cat) => {
    const sortedChannels = [...(categoriesMap.get(cat) || [])].sort(compareByName);
    channelsByCategory.set(cat, sortedChannels);
    groupedChannels.push({ name: cat, items: sortedChannels });
    flatChannels.push(...sortedChannels);
  });

  return {
    channelsByCategory,
    groupedChannels,
    categories: sortedCategories,
    flatChannels,
    totalChannels: liveChannels.length,
    timestamp: Date.now()
  };
};

export const usePlaylist = () => {
  const queryClient = useQueryClient();
  const store = usePlaylistStore();
  const preloadTimeoutRef = useRef(null);
  const lastSelectionRef = useRef(null);


  
  const { 
    data: playlists = [], 
    isLoading, 
    error,
    isFetching
  } = useQuery({
    queryKey: ['playlists'],
    queryFn: async () => {
      const data = await playlistService.storage.getPlaylists();
      const migratedData = (Array.isArray(data) ? data : []).map(migrateVodSeries);
      
      store.setPlaylists(migratedData);

      if (store.activePlaylist?.id) {
        const normalizedActive = migratedData.find((p) => p.id === store.activePlaylist.id);
        if (normalizedActive) {
          store.setActivePlaylist(normalizedActive);
        }
      }
      
      if (!store.activePlaylist && migratedData.length > 0) {
        store.setActivePlaylist(migratedData[0]);
        
        preloadPlaylistData(migratedData[0].id);
      }
      
      return migratedData;
    },
    staleTime: 10 * 60 * 1000, 
    gcTime: 30 * 60 * 1000, 
  });

  
  const preloadPlaylistData = useCallback((playlistId) => {
    if (processingQueue.has(playlistId)) return;
    
    processingQueue.set(playlistId, true);
    
    
    const idleCallback = (callback) => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(callback, { timeout: 2000 });
      } else {
        setTimeout(callback, 50);
      }
    };
    
    idleCallback(async () => {
      try {
        
        const playlist = store.playlists.find(p => p.id === playlistId);
        if (!playlist) return;
        
        
        if (categoryCache.has(playlistId)) {
          processingQueue.delete(playlistId);
          return;
        }
        
        const liveChannels = playlist.live || [];
        categoryCache.set(playlistId, buildLiveCacheEntry(liveChannels));
        
      } catch (err) {
      } finally {
        processingQueue.delete(playlistId);
      }
    });
  }, [store.playlists]);

  
  const selectPlaylist = useCallback((playlist) => {
    if (!playlist) return;

    const canonicalPlaylist = store.playlists.find(p => p.id === playlist.id) || playlist;
    
    const now = Date.now();
    const lastSelected = lastSelectionRef.current;
    
    
    if (lastSelected && lastSelected.id === canonicalPlaylist.id && (now - lastSelected.time) < 100) {
      return;
    }
    
    lastSelectionRef.current = { id: canonicalPlaylist.id, time: now };
    
    
    
    const cached = categoryCache.get(canonicalPlaylist.id);
    
    if (cached) {
      
      categoryCache.set(canonicalPlaylist.id, { ...cached, timestamp: now });
    }
    
    
    store.setActivePlaylist(canonicalPlaylist);
    
    
    if (!cached) {
      preloadPlaylistData(canonicalPlaylist.id);
    }
    
    
    const currentIndex = store.playlists.findIndex(p => p.id === canonicalPlaylist.id);
    if (currentIndex !== -1 && store.playlists.length > 1) {
      if (preloadTimeoutRef.current) clearTimeout(preloadTimeoutRef.current);
      
      preloadTimeoutRef.current = setTimeout(() => {
        
        if (store.playlists[currentIndex + 1]) {
          preloadPlaylistData(store.playlists[currentIndex + 1].id);
        }
        
        if (store.playlists[currentIndex - 1]) {
          preloadPlaylistData(store.playlists[currentIndex - 1].id);
        }
      }, 500);
    }
  }, [store, preloadPlaylistData]);

  
  const getLiveChannels = useCallback(() => {
    const playlistId = store.activePlaylist?.id;
    
    if (playlistId && categoryCache.has(playlistId)) {
      const cached = categoryCache.get(playlistId);
      return cached.flatChannels || [];
    }
    
    return store.activePlaylist?.live || [];
  }, [store.activePlaylist]);

  const getLiveChannelsByCategory = useCallback(() => {
    const playlistId = store.activePlaylist?.id;
    
    
    if (playlistId && categoryCache.has(playlistId)) {
      const cached = categoryCache.get(playlistId);
      return cached.groupedChannels || [];
    }
    
    
    const channels = store.activePlaylist?.live || [];
    const cacheEntry = buildLiveCacheEntry(channels);

    
    if (playlistId && !categoryCache.has(playlistId)) {
      categoryCache.set(playlistId, cacheEntry);
    }
    
    return cacheEntry.groupedChannels;
  }, [store.activePlaylist]);

  const getMovies = useCallback(() => store.activePlaylist?.movies || [], [store.activePlaylist]);
  const getSeries = useCallback(() => store.activePlaylist?.series || [], [store.activePlaylist]);

  const getMoviesByCategory = useCallback(() => {
    const movies = getMovies();
    const categories = new Map();
    
    movies.forEach(movie => {
      const category = movie.groupTitle || movie.group || 'Filmes';
      if (!categories.has(category)) {
        categories.set(category, []);
      }
      categories.get(category).push(movie);
    });
    
    return Array.from(categories.entries())
      .map(([name, items]) => ({ name, items }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [getMovies]);

  const getSeriesByCategory = useCallback(() => {
    const series = getSeries();
    const categories = new Map();
    
    series.forEach(serie => {
      const name = serie.seriesName || serie.name || 'SÃ©ries';
      if (!categories.has(name)) {
        categories.set(name, []);
      }
      categories.get(name).push(serie);
    });
    
    return Array.from(categories.entries())
      .map(([name, items]) => ({ 
        name, 
        items: items.sort((a, b) => {
          if (a.season !== b.season) return (a.season || 0) - (b.season || 0);
          return (a.episode || 0) - (b.episode || 0);
        })
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [getSeries]);

  
  const addPlaylistMutation = useMutation({
    mutationFn: (playlistData) => {
      return playlistService.addPlaylist(playlistData);
    },
    onSuccess: (newPlaylist) => {
      
      categoryCache.clear();
      processingQueue.clear();
      
      if (playlists.length === 0) {
        store.setActivePlaylist(newPlaylist);
      }
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
    },
  });

  const deletePlaylistMutation = useMutation({
    mutationFn: (id) => {
      return playlistService.storage.deletePlaylist(id);
    },
    onSuccess: (_, id) => {
      
      categoryCache.delete(id);
      
      if (store.activePlaylist?.id === id) {
        const remainingPlaylists = playlists.filter(p => p.id !== id);
        if (remainingPlaylists.length > 0) {
          selectPlaylist(remainingPlaylists[0]);
        } else {
          store.setActivePlaylist(null);
        }
      }
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
    },
  });

  const updatePlaylistMutation = useMutation({
    mutationFn: ({ id, updates }) => {
      return playlistService.storage.updatePlaylist(id, updates);
    },
    onSuccess: (_, { id }) => {
      
      categoryCache.delete(id);
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
    },
  });

  const addPlaylist = async (playlistData) => {
    try {
      const result = await addPlaylistMutation.mutateAsync(playlistData);
      return result;
    } catch (error) {
      throw error;
    }
  };

  const deletePlaylist = async (id) => {
    try {
      await deletePlaylistMutation.mutateAsync(id);
    } catch (error) {
      throw error;
    }
  };

  const updatePlaylist = async (id, updates) => {
    try {
      await updatePlaylistMutation.mutateAsync({ id, updates });
    } catch (error) {
      throw error;
    }
  };

  
  const clearCache = useCallback(() => {
    categoryCache.clear();
    processingQueue.clear();
  }, []);

  return {
    playlists,
    activePlaylist: store.activePlaylist,
    isLoading,
    isFetching,
    error,
    addPlaylist,
    deletePlaylist,
    updatePlaylist,
    selectPlaylist,
    getLiveChannels,
    getMovies,
    getSeries,
    getLiveChannelsByCategory,
    getMoviesByCategory,
    getSeriesByCategory,
    clearCache, 
    isAdding: addPlaylistMutation.isLoading,
    isDeleting: deletePlaylistMutation.isLoading,
    isUpdating: updatePlaylistMutation.isLoading
  };
};
