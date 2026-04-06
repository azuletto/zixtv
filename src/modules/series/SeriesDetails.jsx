

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import EpisodeList from './EpisodeList';
import CustomPlayer from '../player/CustomPlayer';
import { tmdbService } from '../../core/services/tmdb/TMDBService';
const normalizeDescription = (value, fallback = 'Descrição não disponível') => {
  const raw = String(value || '').trim();
  if (!raw) return fallback;

  const fixed = raw
    .replace(/descri(?:Ã§|�)o/gi, 'descrição')
    .replace(/n(?:Ã£|�)o/gi, 'não')
    .replace(/dispon(?:Ã­|�)vel/gi, 'disponível')
    .trim();

  if (/^sem\s+descri/i.test(fixed)) {
    return 'Sem descrição disponível';
  }

  return fixed;
};

const extractImageIdFromUrl = (url) => {
  if (!url) return null;
  const match = url.toString().match(/\/([^/]+)\.(?:jpg|jpeg|png|webp)(?:\?.*)?$/i);
  return match ? match[1] : null;
};

const tmdbSeriesCache = new Map();
const TMDB_SERIES_TTL = 30 * 60 * 1000;

const SeriesDetails = ({ series }) => {
  const [tmdbData, setTmdbData] = useState(null);
  const [isFetchingTMDB, setIsFetchingTMDB] = useState(false);
  const [selectedEpisode, setSelectedEpisode] = useState(null);
  const [showPlayer, setShowPlayer] = useState(false);

  const seriesName = series?.name || series?.title || series?.seriesName || 'Série';
  const seriesCacheKey = useMemo(() => seriesName.toLowerCase().trim(), [seriesName]);

  useEffect(() => {
    let ignore = false;

    const fetchTMDBData = async () => {
      const cached = tmdbSeriesCache.get(seriesCacheKey);
      if (cached && (Date.now() - cached.timestamp) < TMDB_SERIES_TTL) {
        setTmdbData(cached.data);
        setIsFetchingTMDB(false);
        return;
      }

      setIsFetchingTMDB(true);
      try {
        const playlistImageId = extractImageIdFromUrl(series?.tvg?.logo || series?.logo || series?.posterUrl || series?.backdropUrl);
        const results = await tmdbService.search(seriesName, 1, {
          imageId: playlistImageId
        });
        const tvMatch = (results || []).find((item) => item.type === 'tv') || results?.[0];

        if (!tvMatch) {
          if (!ignore) setTmdbData(null);
          return;
        }

        const details = await tmdbService.getDetails('tv', tvMatch.id);
        if (!ignore) {
          const merged = {
            ...tvMatch,
            ...details
          };
          tmdbSeriesCache.set(seriesCacheKey, {
            data: merged,
            timestamp: Date.now()
          });
          setTmdbData(merged);
        }
      } catch (error) {
        if (!ignore) {
          setTmdbData(null);
        }
      } finally {
        if (!ignore) setIsFetchingTMDB(false);
      }
    };

    fetchTMDBData();

    return () => {
      ignore = true;
    };
  }, [seriesName, seriesCacheKey]);

  const orderedEpisodes = useMemo(() => {
    const episodes = Array.isArray(series?.episodes) ? series.episodes : [];

    return [...episodes]
      .sort((a, b) => {
        if ((a.season || 0) !== (b.season || 0)) return (a.season || 0) - (b.season || 0);
        return (a.episode || 0) - (b.episode || 0);
      })
      .map((episode, index) => ({
        ...episode,
        sequence: index + 1,
        rating: episode?.metadata?.rating || tmdbData?.voteAverage || 'N/A',
        description: normalizeDescription(
          episode?.metadata?.description ||
            episode?.overview ||
            tmdbData?.overview ||
            '',
          'Descrição não disponível'
        ),
        posterUrl: episode?.tvg?.logo || episode?.logo || episode?.metadata?.poster || tmdbData?.posterUrl || tmdbData?.poster || null,
        backdropUrl: episode?.tvg?.logo || episode?.logo || episode?.metadata?.backdrop || tmdbData?.backdropUrl || tmdbData?.backdrop || null
      }));
  }, [series?.episodes, tmdbData]);

  const seasonsCount = useMemo(() => {
    const unique = new Set(orderedEpisodes.map((ep) => ep.season || 0));
    return unique.size || 1;
  }, [orderedEpisodes]);

  const handleEpisodeSelect = (episode) => {
    setSelectedEpisode(episode);
    setShowPlayer(true);
  };

  const showTMDBSkeleton = isFetchingTMDB && !tmdbData;

  return (
    <div className="min-h-screen bg-zinc-950">
      {}
      <div className="relative h-[55vh] md:h-[65vh] overflow-hidden isolate">
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={series?.tvg?.logo || series?.logo || tmdbData?.backdropUrl || series?.metadata?.backdrop || '/default-banner.jpg'}
            alt={seriesName}
            className="absolute inset-0 h-full w-full scale-110 object-cover"
            style={{ filter: 'blur(4px) saturate(1.05) brightness(1)' }}
          />
          <div className="absolute inset-0 bg-zinc-950/35" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/65 to-black/15" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/20 to-transparent" />
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-10 p-6 md:p-12">
          <h1 className="text-3xl md:text-6xl font-bold text-white mb-4">{seriesName}</h1>
          {showTMDBSkeleton ? (
            <>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <div className="h-7 w-14 animate-pulse rounded bg-zinc-700/80" />
                <div className="h-5 w-28 animate-pulse rounded bg-zinc-700/70" />
                <div className="h-5 w-24 animate-pulse rounded bg-zinc-700/70" />
                <div className="h-5 w-28 animate-pulse rounded bg-zinc-700/70" />
                <div className="h-5 w-28 animate-pulse rounded bg-zinc-700/70" />
              </div>
              <div className="max-w-2xl space-y-2">
                <div className="h-4 w-full animate-pulse rounded bg-zinc-700/70" />
                <div className="h-4 w-11/12 animate-pulse rounded bg-zinc-700/70" />
                <div className="h-4 w-9/12 animate-pulse rounded bg-zinc-700/70" />
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-3 text-white mb-4">
                <span className="bg-green-600 px-2 py-1 rounded">
                  {tmdbData?.voteAverage ? tmdbData.voteAverage.toFixed(1) : (series.metadata?.rating || 'N/A')}
                </span>
                <span>{tmdbData?.year || series.metadata?.year || 'Ano desconhecido'}</span>
                <span>{tmdbData?.genre || series.metadata?.genre || 'Gênero'}</span>
                <span>{seasonsCount} Temporada(s)</span>
                <span>{orderedEpisodes.length} Episódio(s)</span>
              </div>
              <p className="text-white max-w-2xl text-base md:text-lg line-clamp-3">
                {normalizeDescription(tmdbData?.overview || series.metadata?.description || '')}
              </p>
            </>
          )}
          {isFetchingTMDB && <p className="text-xs text-zinc-300 mt-3">Buscando metadados do TMDB...</p>}
        </div>
      </div>

      <div className="px-6 md:px-12 py-8">
        <h2 className="text-2xl font-bold text-white mb-6">Episódios em sequência</h2>
        <EpisodeList
          episodes={orderedEpisodes}
          onSelectEpisode={handleEpisodeSelect}
        />
      </div>

      {}
      <AnimatePresence>
        {showPlayer && selectedEpisode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          >
            <div className="w-full max-w-6xl">
              <CustomPlayer
                source={selectedEpisode.url}
                title={`${series.name} - S${String(selectedEpisode.season).padStart(2, '0')}E${String(selectedEpisode.episode).padStart(2, '0')}`}
                type="series"
                metadata={selectedEpisode.metadata}
                tmdbData={tmdbData}
                onClose={() => setShowPlayer(false)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SeriesDetails;
