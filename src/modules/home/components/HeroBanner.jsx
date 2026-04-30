import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PlayIcon, InformationCircleIcon } from '/src/shared/icons/heroiconsOutlineCompat';
import { useFocusable } from '../../../shared/hooks/useFocusable';
import { useNavigationStore } from '../../../app/store/navigationStore';
import { resolveMediaUrl } from '../../../core/services/network/proxy';

const normalizeDescription = (value, fallback = 'Sinopse nao disponivel') => {
  const raw = String(value || '').trim();
  if (!raw) return fallback;

  return raw
    .replace(/descri(?:ÃƒÂ§|ï¿½)o/gi, 'descricao')
    .replace(/n(?:ÃƒÂ£|ï¿½)o/gi, 'nao')
    .replace(/dispon(?:ÃƒÂ­|ï¿½)vel/gi, 'disponivel')
    .trim() || fallback;
};

const getItemImage = (item = {}) => resolveMediaUrl(item.backdropUrl || item.posterUrl || '');

const HeroPlaceholder = ({ showLabel = false }) => (
  <div className="absolute inset-0 overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black" />
    <div
      className="absolute inset-0 opacity-60"
      style={{
        backgroundImage: `
          radial-gradient(circle at 18% 22%, rgba(220, 38, 38, 0.22), transparent 26%),
          radial-gradient(circle at 76% 28%, rgba(255, 255, 255, 0.08), transparent 20%),
          radial-gradient(circle at 60% 72%, rgba(220, 38, 38, 0.12), transparent 28%)
        `,
      }}
    />
    <div
      className="absolute inset-0 opacity-20"
      style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)`,
        backgroundSize: '44px 44px',
      }}
    />

    {showLabel && (
      <div className="absolute top-5 right-5 z-20 rounded-md border border-zinc-700 bg-zinc-900/80 px-3 py-1.5 text-[11px] uppercase tracking-[0.22em] text-zinc-300">
        Sem Imagem
      </div>
    )}
  </div>
);

const HeroDot = ({ isActive, onSelect }) => (
  <button
    onClick={onSelect}
    className={`h-2 rounded-full transition-all ${
      isActive ? 'w-6 bg-red-600 shadow-lg shadow-red-600/50' : 'w-2 bg-white/50 hover:bg-white/70'
    }`}
  />
);

const HeroBanner = ({ items = [], onPlay, onMoreInfo }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hasImageError, setHasImageError] = useState(false);
  const heroBannerRef = useRef(null);
  const { setFocusedElement } = useNavigationStore();

  const safeItems = Array.isArray(items) ? items : [];
  const hasItems = safeItems.length > 0;
  const currentItem = hasItems ? safeItems[currentIndex % safeItems.length] : null;
  const currentImage = getItemImage(currentItem || {});
  const voteAverage = Number(currentItem?.voteAverage);
  const displayTitle = currentItem?.displayTitle || currentItem?.title || currentItem?.name || '';

  const handleHeroNavigate = useCallback((direction) => {
    if (safeItems.length <= 1) {
      return direction === 'right';
    }

    if (direction === 'right') {
      setCurrentIndex((prev) => (prev + 1) % safeItems.length);
      setImageLoaded(false);
      return true;
    }

    if (direction === 'left') {
      if (currentIndex === 0) {
        return false;
      }

      setCurrentIndex((prev) => (prev - 1 + safeItems.length) % safeItems.length);
      setImageLoaded(false);
      return true;
    }

    return false;
  }, [currentIndex, safeItems.length]);

  const { ref: heroFocusRef, isFocused: isHeroFocused } = useFocusable('hero-banner', {
    group: 'hero-banner',
    onSelect: () => {
      if (currentItem) onPlay?.(currentItem);
    },
    onToggle: () => {
      if (currentItem) onMoreInfo?.(currentItem);
    },
    onNavigate: handleHeroNavigate,
  });

  const { ref: playFocusRef, isFocused: isPlayFocused } = useFocusable('hero-banner-play-button', {
    group: 'hero-banner-buttons',
    onSelect: () => {
      if (currentItem) onPlay?.(currentItem);
    },
    onNavigate: (direction) => {
      if (direction === 'right') {
        setFocusedElement('hero-banner-more-info-button');
        return true;
      }
      if (direction === 'left') {
        return false;
      }
      return false;
    },
  });

  const { ref: moreInfoFocusRef, isFocused: isMoreInfoFocused } = useFocusable('hero-banner-more-info-button', {
    group: 'hero-banner-buttons',
    onSelect: () => {
      if (currentItem) onMoreInfo?.(currentItem);
    },
    onNavigate: (direction) => {
      if (direction === 'right') {
        return true;
      }
      if (direction === 'left') {
        return false;
      }
      return false;
    },
  });

  useEffect(() => {
    setImageLoaded(false);
    setHasImageError(false);
  }, [currentItem?.id, currentImage]);

  // If no element is focused when the hero mounts, request focus for hero banner
  useEffect(() => {
    const current = useNavigationStore.getState?.()?.currentFocusedId;
    if (!current) {
      setTimeout(() => {
        setFocusedElement('hero-banner');
      }, 0);
    }
  }, [setFocusedElement]);

  useEffect(() => {
    if (safeItems.length <= 1) return undefined;

    const interval = setInterval(() => {
      if (!isHovered) {
        setCurrentIndex((prev) => (prev + 1) % safeItems.length);
        setImageLoaded(false);
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [safeItems.length, isHovered]);

  if (!hasItems) {
    return null;
  }

  return (
    <div
      ref={(node) => {
        heroBannerRef.current = node;
        heroFocusRef.current = node;
      }}
      className={`hero-banner relative isolate h-[50vh] w-full overflow-hidden transition-all duration-200 sm:h-[60vh] md:h-[70vh] lg:h-[80vh] ${
        isHeroFocused ? 'ring-2 ring-inset ring-red-500/60' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute inset-0 overflow-hidden">
        {(!currentImage || !imageLoaded || hasImageError) && (
          <HeroPlaceholder showLabel={!currentImage || hasImageError} />
        )}
        {currentImage && !hasImageError && (
          <img
            src={currentImage}
            alt={displayTitle}
            className={`absolute inset-0 z-10 h-full w-full object-cover transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              filter: 'blur(3px) saturate(1.08) brightness(0.96)',
              transform: 'scale(1.06)',
              objectPosition: 'center',
            }}
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              setHasImageError(true);
              setImageLoaded(false);
            }}
          />
        )}
        <div className="pointer-events-none absolute inset-0 z-20 bg-blue-500/12 mix-blend-screen" />
        <div className="absolute inset-0 z-30 bg-gradient-to-r from-zinc-950 via-zinc-950/80 to-transparent" />
        <div className="absolute inset-0 z-30 bg-gradient-to-t from-zinc-950 via-zinc-950/50 to-transparent" />
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-40 max-w-3xl p-4 opacity-100 transition-opacity duration-500 sm:p-8 md:p-12 lg:p-16">
        <h1 className="mb-2 line-clamp-2 text-2xl font-bold text-white sm:mb-3 sm:text-3xl md:mb-4 md:text-4xl lg:text-5xl xl:text-6xl">
          {displayTitle}
        </h1>

        <div className="mb-2 flex flex-wrap items-center gap-2 text-white sm:mb-3 sm:gap-3 md:mb-4 md:gap-4">
          {Number.isFinite(voteAverage) && (
            <span className="rounded bg-green-600 px-1.5 py-0.5 text-xs font-medium sm:px-2 sm:py-1 sm:text-sm">
              {voteAverage.toFixed(1)}
            </span>
          )}
          {currentItem.year && (
            <span className="text-xs text-zinc-300 sm:text-sm">{currentItem.year}</span>
          )}
          <span className="text-xs capitalize text-zinc-300 sm:text-sm">
            {currentItem.type === 'movie'
              ? 'Filme'
              : (currentItem.type === 'tv' || currentItem.type === 'series')
                ? 'Serie'
                : 'Destaque'}
          </span>
        </div>

        <p className="mb-4 max-w-2xl line-clamp-2 text-sm text-zinc-200 sm:mb-6 sm:line-clamp-3 sm:text-base md:mb-8 md:text-lg">
          {normalizeDescription(currentItem.overview)}
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          <button
            ref={playFocusRef}
            onClick={() => onPlay?.(currentItem)}
            className={`flex items-center justify-center rounded-lg border-2 bg-red-600 px-4 py-2 text-sm font-bold text-white transition-all duration-200 sm:px-6 sm:py-2.5 sm:text-base md:px-8 md:py-3 ${
              isPlayFocused
                ? 'scale-[1.02] border-white shadow-lg shadow-white/10'
                : 'border-transparent hover:scale-[1.02] hover:border-white hover:shadow-lg hover:shadow-white/10'
            }`}
          >
            <PlayIcon className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            Assistir
          </button>
          <button
            ref={moreInfoFocusRef}
            onClick={() => onMoreInfo?.(currentItem)}
            className={`flex items-center justify-center rounded-lg border-2 bg-zinc-900/75 px-4 py-2 text-sm font-bold text-white transition-all duration-200 sm:px-6 sm:py-2.5 sm:text-base md:px-8 md:py-3 ${
              isMoreInfoFocused
                ? 'scale-[1.02] border-red-500 bg-zinc-800/90 shadow-lg shadow-red-500/10'
                : 'border-transparent hover:scale-[1.02] hover:border-red-500 hover:bg-zinc-800/90 hover:shadow-lg hover:shadow-red-500/10'
            }`}
          >
            <InformationCircleIcon className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            Mais Informacoes
          </button>
        </div>
      </div>

      {safeItems.length > 1 && (
        <div className="absolute bottom-4 left-1/2 z-40 flex -translate-x-1/2 gap-2">
          {safeItems.map((_, index) => (
            <HeroDot
              key={index}
              isActive={index === currentIndex}
              onSelect={() => {
                setCurrentIndex(index);
                setImageLoaded(false);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default HeroBanner;
