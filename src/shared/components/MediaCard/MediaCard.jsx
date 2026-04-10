
import React, { useState, useRef, useMemo, useCallback } from 'react';
import { PlayIcon, PlusIcon, ThumbUpIcon } from '/src/shared/icons/heroiconsOutlineCompat';
import { useUIStore } from '../../../app/store/uiStore';

const FALLBACK_IMAGE = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'300\' height=\'450\' viewBox=\'0 0 300 450\'%3E%3Crect width=\'300\' height=\'450\' fill=\'%2318181b\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' dominant-baseline=\'middle\' text-anchor=\'middle\' font-family=\'Arial\' font-size=\'14\' fill=\'%23666666\'%3ESem Imagem%3C/text%3E%3C/svg%3E';

const MediaCard = ({ item, type, imageFit = 'cover', imageScale = 0.94, imagePaddingClass = '', onSelect, onPlay }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [localImageError, setLocalImageError] = useState(false);
  const imgRef = useRef(null);

  const normalizedItem = useMemo(() => ({
    ...item,
    name: item.name || item.title,
    title: item.title || item.name,
    posterUrl: item.tvg?.logo || item.logo || item.posterUrl,
    backdropUrl: item.tvg?.logo || item.logo || item.backdropUrl
  }), [item]);

  const { openModal } = useUIStore();

  const handleClick = useCallback(() => {
    if (typeof onSelect === 'function') {
      onSelect(normalizedItem, type);
      return;
    }

    if (type === 'series') {
      openModal('series-details');
    } else if (type === 'tmdb') {
      openModal('details', { item: normalizedItem, type: normalizedItem.type || 'movie' });
    } else {
      openModal('player');
    }
  }, [type, openModal, normalizedItem, onSelect]);

  const onImageError = useCallback(() => {
    setLocalImageError(true);
  }, []);

  const title = normalizedItem.name || normalizedItem.title || 'Sem titulo';
  const year = normalizedItem.year || (normalizedItem.releaseDate ? normalizedItem.releaseDate.split('-')[0] : null);
  const formattedRating = typeof normalizedItem.voteAverage === 'number'
    ? normalizedItem.voteAverage.toFixed(1)
    : (normalizedItem.rating && normalizedItem.rating !== 'N/A' ? normalizedItem.rating : 'N/A');
  
  const subtitle = useMemo(() => {
    if (type === 'live') return normalizedItem.group || 'Ao vivo';
    if (type === 'movies') return year || 'Filme';
    if (type === 'series') {
      const totalEpisodes = Array.isArray(normalizedItem.episodes)
        ? normalizedItem.episodes.length
        : (typeof normalizedItem.totalEpisodes === 'number' ? normalizedItem.totalEpisodes : 0);

      if (totalEpisodes > 0) {
        return `${totalEpisodes} ${totalEpisodes === 1 ? 'episodio' : 'episodios'}`;
      }

      return 'Série';
    }
    if (type === 'tmdb') {
      const itemType = normalizedItem.type === 'movie'
        ? 'Filme'
        : (normalizedItem.type === 'tv' || normalizedItem.type === 'series')
          ? 'Série'
          : '';
      return itemType;
    }
    return '';
  }, [type, normalizedItem, year]);

  const isEntertainment = type === 'movies' || type === 'series';
  const isTMDBItem = type === 'tmdb';
  const isLive = type === 'live';

  const imageUrl = localImageError 
    ? FALLBACK_IMAGE 
    : (normalizedItem.tvg?.logo || normalizedItem.logo || normalizedItem.posterUrl || FALLBACK_IMAGE);

  return (
    <div
      className="relative rounded-lg overflow-hidden cursor-pointer bg-zinc-900 border border-zinc-800 transition-all duration-200 hover:scale-105 hover:border-red-500 hover:shadow-xl hover:shadow-red-500/10"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <div 
        className="relative w-full overflow-hidden"
        style={{ aspectRatio: '2/3' }}
      >
        <img
          ref={imgRef}
          src={imageUrl}
          alt={title}
          className={`w-full h-full transition-transform duration-300 group-hover:scale-105 ${imagePaddingClass}`}
          style={{ 
            objectFit: imageFit,
            objectPosition: 'center',
            transform: `scale(${imageScale})`,
            backgroundColor: '#18181b'
          }}
          onError={onImageError}
          loading="lazy"
        />

        <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`} />

        {isLive && (
          <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center z-10 shadow-lg">
            <span className="w-1.5 h-1.5 bg-white rounded-full mr-1 animate-pulse" />
            AO VIVO
          </div>
        )}

        {isEntertainment && formattedRating && formattedRating !== 'N/A' && (
          <div className="absolute top-2 right-2 bg-green-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full z-10 shadow-lg">
            Nota {formattedRating}
          </div>
        )}
        
        {isTMDBItem && (
          <div className="absolute -bottom-1 -right-1 z-20">
            <div className="bg-blue-600 text-white text-[8px] font-semibold px-2 py-0.5 rounded-tl-lg rounded-br-lg shadow-lg">
              EM DESTAQUE
            </div>
          </div>
        )}

        <div className={`absolute inset-x-0 bottom-0 p-3 flex flex-col z-10 transition-all duration-200 ${isHovered ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}`}>
          <h3 className="text-white font-bold text-sm mb-1 line-clamp-2 leading-tight">
            {title}
          </h3>
          <p className="text-gray-300 text-xs mb-2 line-clamp-1">
            {subtitle}
          </p>
          <div className="flex space-x-2">
            <button 
              className={`${isTMDBItem ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'} text-white p-1.5 rounded-full transition-all hover:scale-110 shadow-lg`}
              onClick={(e) => {
                e.stopPropagation();
                if (typeof onPlay === 'function') {
                  onPlay(normalizedItem, type);
                  return;
                }
                if (isTMDBItem) {
                  openModal('details', { item: normalizedItem, type: normalizedItem.type || 'movie' });
                } else {
                  openModal('player');
                }
              }}
            >
              <PlayIcon className="w-3.5 h-3.5" />
            </button>
            <button className="bg-white/10 hover:bg-white/20 text-white p-1.5 rounded-full transition-all hover:scale-110 backdrop-blur-sm">
              <PlusIcon className="w-3.5 h-3.5" />
            </button>
            <button className="bg-white/10 hover:bg-white/20 text-white p-1.5 rounded-full transition-all hover:scale-110 backdrop-blur-sm">
              <ThumbUpIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-2">
        <h3 className="text-white text-xs font-semibold truncate leading-tight">{title}</h3>
        {subtitle && (
          <p className="text-gray-400 text-[10px] truncate mt-1 leading-tight">{subtitle}</p>
        )}
      </div>
    </div>
  );
};

export default React.memo(MediaCard);

