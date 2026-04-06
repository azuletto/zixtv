
import { useState, useEffect, useRef } from 'react';
import { metadataExtractor } from '../../core/utils/metadata/MetadataExtractor';

const metadataCache = new Map();
const METADATA_CACHE_TTL = 15 * 60 * 1000;

const buildMetadataKey = (item) => {
  if (!item) return 'empty';
  return [
    item.id || '',
    item.type || '',
    item.url || '',
    item.name || item.title || '',
    item.seriesName || '',
    item.season || '',
    item.episode || '',
    item.releaseDate || ''
  ].join('|');
};

export const useMetadata = (item) => {
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const keyRef = useRef('');

  useEffect(() => {
    const fetchMetadata = async () => {
      if (!item) {
        setMetadata(null);
        setLoading(false);
        return;
      }

      const key = buildMetadataKey(item);
      if (key === keyRef.current && metadata) {
        setLoading(false);
        return;
      }
      keyRef.current = key;

      const cached = metadataCache.get(key);
      if (cached && (Date.now() - cached.timestamp) < METADATA_CACHE_TTL) {
        setMetadata(cached.data);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const data = await metadataExtractor.extract(item, { fetchFromTMDB: false });
        setMetadata(data);
        metadataCache.set(key, {
          data,
          timestamp: Date.now()
        });
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    fetchMetadata();
  }, [item, metadata]);

  const getPosterUrl = () => {
    
    if (item?.tvg?.logo) return item.tvg.logo;
    if (item?.logo) return item.logo;
    if (item?.posterUrl) return item.posterUrl;
    return metadata?.poster || null;
  };
  
  const getBackdropUrl = () => {
    if (item?.tvg?.logo) return item.tvg.logo;
    if (item?.logo) return item.logo;
    if (item?.backdropUrl) return item.backdropUrl;
    return metadata?.backdrop || null;
  };
  
  const getFormattedRating = () => {
    
    if (item?.voteAverage) return item.voteAverage.toFixed(1);
    if (metadata?.rating && metadata.rating !== 'N/A') return metadata.rating;
    return 'N/A';
  };
  
  const getYear = () => {
    
    if (item?.year) return item.year;
    if (item?.releaseDate) return item.releaseDate.split('-')[0];
    if (metadata?.year && metadata.year !== 'Desconhecido') return metadata.year;
    return null;
  };
  
  const getGenre = () => metadata?.genre || null;
  
  const getDescription = () => {
    if (item?.overview) return item.overview;
    return metadata?.description || null;
  };
  
  const handleImageError = (type) => {
  };

  return {
    metadata,
    loading,
    getPosterUrl,
    getBackdropUrl,
    getFormattedRating,
    getYear,
    getGenre,
    getDescription,
    handleImageError
  };
};
