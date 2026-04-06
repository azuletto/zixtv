
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayIcon, InformationCircleIcon } from '/src/shared/icons/heroiconsOutlineCompat';

const HeroBanner = ({ items = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const safeItems = Array.isArray(items) ? items : [];
  const hasItems = safeItems.length > 0;
  const currentItem = hasItems ? safeItems[currentIndex % safeItems.length] : null;

  useEffect(() => {
    if (safeItems.length <= 1) return;
    
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
      className="relative h-[50vh] sm:h-[60vh] md:h-[70vh] lg:h-[80vh] w-full overflow-hidden isolate"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {}
      <div className="absolute inset-0 overflow-hidden">
        {!imageLoaded && (
          <div className="absolute inset-0 bg-zinc-900 animate-pulse" />
        )}
        <img
          src={currentItem.backdropUrl}
          alt={currentItem.title || currentItem.name}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 z-10 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            filter: 'blur(3px) saturate(1.08) brightness(0.96)',
            transform: 'scale(1.06)',
            objectPosition: 'center'
          }}
          onLoad={() => setImageLoaded(true)}
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/1920x1080/1a1a1a/666666?text=Sem+Imagem';
            setImageLoaded(true);
          }}
        />
        <div className="absolute inset-0 bg-blue-500/12 mix-blend-screen pointer-events-none z-20" />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/80 to-transparent z-30" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/50 to-transparent z-30" />
      </div>

      {}
      <div className={`absolute bottom-0 left-0 right-0 p-4 sm:p-8 md:p-12 lg:p-16 max-w-3xl transition-opacity duration-500 z-40 ${
        imageLoaded ? 'opacity-100' : 'opacity-0'
      }`}>
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-2 sm:mb-3 md:mb-4 line-clamp-2">
          {currentItem.title || currentItem.name}
        </h1>
        
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4 text-white mb-2 sm:mb-3 md:mb-4">
          {currentItem.voteAverage && (
            <span className="bg-green-600 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs sm:text-sm font-medium">
              {currentItem.voteAverage.toFixed(1)}
            </span>
          )}
          {currentItem.year && (
            <span className="text-xs sm:text-sm text-zinc-300">{currentItem.year}</span>
          )}
          <span className="text-xs sm:text-sm text-zinc-300 capitalize">
            {currentItem.type === 'movie' ? 'Filme' : currentItem.type === 'tv' ? 'SÃ©rie' : 'Destaque'}
          </span>
        </div>

        <p className="text-sm sm:text-base md:text-lg text-zinc-200 mb-4 sm:mb-6 md:mb-8 line-clamp-2 sm:line-clamp-3 max-w-2xl">
          {currentItem.overview || 'Sinopse nÃ£o disponÃ­vel'}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <button className="bg-red-600 hover:bg-red-700 text-white px-4 sm:px-6 md:px-8 py-2 sm:py-2.5 md:py-3 rounded-lg font-bold flex items-center justify-center transition-colors text-sm sm:text-base">
            <PlayIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            Assistir
          </button>
          <button className="bg-zinc-800/80 hover:bg-zinc-700 text-white px-4 sm:px-6 md:px-8 py-2 sm:py-2.5 md:py-3 rounded-lg font-bold flex items-center justify-center transition-colors text-sm sm:text-base">
            <InformationCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            Mais InformaÃ§Ãµes
          </button>
        </div>
      </div>

      {}
      {safeItems.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-40">
          {safeItems.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentIndex(index);
                setImageLoaded(false);
              }}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex ? 'bg-red-600 w-6' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default HeroBanner;

