

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { XIcon } from '@heroicons/react/outline';
import { tmdbService } from '../../core/services/tmdb/TMDBService';

const extractTMDBIdFromUrl = (url) => {
  if (!url) return null;
  const filename = String(url).split('/').pop() || '';
  return filename.replace(/\.(jpg|jpeg|png|webp)$/i, '');
};

const normalizeTMDBType = (type) => {
  if (type === 'series' || type === 'tv') return 'tv';
  if (type === 'movie' || type === 'movies') return 'movie';
  return null;
};

const CinemaMode = ({ title, metadata, type, tmdbData: prefetchedTMDBData, onExit }) => {
  const [tmdbData, setTmdbData] = useState(prefetchedTMDBData || null);
  const [isFetchingTMDB, setIsFetchingTMDB] = useState(false);

  const tmdbType = useMemo(() => normalizeTMDBType(type), [type]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        onExit();
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onExit]);

  useEffect(() => {
    if (prefetchedTMDBData) {
      setTmdbData(prefetchedTMDBData);
    }
  }, [prefetchedTMDBData]);

  useEffect(() => {
    let cancelled = false;

    const loadTMDBData = async () => {
      
      if (!tmdbType) {
        setIsFetchingTMDB(false);
        if (!cancelled) setTmdbData(null);
        return;
      }

      
      if (tmdbType === 'tv' && prefetchedTMDBData) {
        if (!cancelled) {
          setTmdbData(prefetchedTMDBData);
          setIsFetchingTMDB(false);
        }
        return;
      }

      try {
        if (!cancelled) {
          setIsFetchingTMDB(true);
        }

        const imageId = extractTMDBIdFromUrl(
          metadata?.poster || metadata?.backdrop || metadata?.logo || ''
        );

        const searchResults = await tmdbService.search(title || '', 1, {
          imageId: imageId || undefined
        });

        if (cancelled) return;

        const bestMatch = (searchResults || []).find((item) => item.type === tmdbType)
          || (searchResults || [])[0];

        if (!bestMatch?.id) {
          setTmdbData(null);
          return;
        }

        const details = await tmdbService.getDetails(tmdbType, bestMatch.id);
        if (!cancelled) {
          setTmdbData(details || null);
        }
      } catch (error) {
        if (!cancelled) {
          setTmdbData(null);
        }
      } finally {
        if (!cancelled) {
          setIsFetchingTMDB(false);
        }
      }
    };

    loadTMDBData();

    return () => {
      cancelled = true;
    };
  }, [tmdbType, title, metadata, prefetchedTMDBData]);

  const displayDescription = tmdbData?.overview || metadata?.description || 'Sem descrição disponível';
  const displayGenre = tmdbData?.genre || metadata?.genre || null;
  const displayYear = tmdbData?.year || metadata?.year || null;
  const displayRating = tmdbData?.rating || metadata?.rating || null;
  const displayQuality = metadata?.quality || null;
  const showTMDBSkeleton = isFetchingTMDB && !tmdbData;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-40 bg-gradient-to-t from-black/95 via-black/70 to-black/40"
    >
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/90 to-transparent p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-white">{title}</h2>
            {showTMDBSkeleton ? (
              <div className="mt-2 h-4 w-44 animate-pulse rounded bg-zinc-700/70" />
            ) : (
              <p className="text-gray-300">{displayGenre || '-'} • {displayYear || '-'}</p>
            )}
          </div>
          <button
            onClick={onExit}
            className="text-white hover:text-red-600 transition-colors"
          >
            <XIcon className="w-8 h-8" />
          </button>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/90 to-transparent p-6">
        <div className="max-w-4xl mx-auto">
          {showTMDBSkeleton ? (
            <div className="space-y-2">
              <div className="h-4 w-full animate-pulse rounded bg-zinc-700/70" />
              <div className="h-4 w-11/12 animate-pulse rounded bg-zinc-700/70" />
              <div className="h-4 w-8/12 animate-pulse rounded bg-zinc-700/70" />
            </div>
          ) : (
            <p className="text-gray-300 text-lg">
              {displayDescription}
            </p>
          )}
          
          {!showTMDBSkeleton && displayRating && displayRating !== 'N/A' && (
            <div className="mt-4 flex items-center space-x-2">
              <span className="bg-yellow-500 text-black px-2 py-1 rounded font-bold">
                IMDb {displayRating}
              </span>
              {displayQuality && (
                <span className="bg-blue-600 text-white px-2 py-1 rounded">
                  {displayQuality}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default CinemaMode;
