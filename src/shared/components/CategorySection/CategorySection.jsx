
import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/outline';
import MediaCard from '../MediaCard/MediaCard';

const cleanTitle = (title) => {
  if (!title) return '';
  const match = title.match(/^(?:filmes|series|filme|serie|movies|tv)\s*[|\-:]\s*(.+)$/i);
  return match ? match[1].trim() : title;
};

const CategorySection = ({ title, items, type }) => {
  const rowRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [visibleCount, setVisibleCount] = useState(12);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  
  const processedItems = useMemo(() => {
    return items.map(item => ({
      ...item,
      name: cleanTitle(item.name || item.title),
      title: cleanTitle(item.name || item.title)
    }));
  }, [items]);

  const visibleItems = processedItems.slice(0, visibleCount);
  const totalItems = processedItems.length;

  const checkScroll = useCallback(() => {
    const el = rowRef.current;
    if (!el) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const isAtStart = scrollLeft <= 10;
    const isAtEnd = scrollLeft + clientWidth >= scrollWidth - 10;
    
    setShowLeftArrow(!isAtStart);
    setShowRightArrow(!isAtEnd);
    
    const nearEnd = scrollLeft + clientWidth >= scrollWidth - 300;
    if (nearEnd && !loading && hasMore && visibleCount < totalItems) {
      setLoading(true);
      setTimeout(() => {
        const newCount = Math.min(visibleCount + 12, totalItems);
        setVisibleCount(newCount);
        setHasMore(newCount < totalItems);
        setLoading(false);
      }, 300);
    }
  }, [totalItems, visibleCount, loading, hasMore]);

  const scroll = (direction) => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth, scrollWidth } = rowRef.current;
      let scrollTo;
      
      if (direction === 'left') {
        scrollTo = Math.max(0, scrollLeft - clientWidth * 0.8);
      } else {
        scrollTo = Math.min(scrollWidth - clientWidth, scrollLeft + clientWidth * 0.8);
      }
      
      rowRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    
    checkScroll();
    el.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);
    
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll]);

  const cardWidth = 'w-[105px] sm:w-[120px] md:w-[135px] lg:w-[150px]';

  return (
    <div className="w-full mb-8">
      <h3 className="text-lg font-semibold text-white mb-3 px-6">{title}</h3>
      
      <div className="relative">
        {showLeftArrow && (
          <>
            <div className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none bg-gradient-to-r from-zinc-950 to-transparent" />
            <button
              onClick={() => scroll('left')}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/70 text-white p-2 rounded-full hover:bg-red-600 transition-all shadow-lg"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
          </>
        )}

        {showRightArrow && (
          <>
            <div className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none bg-gradient-to-l from-zinc-950 to-transparent" />
            <button
              onClick={() => scroll('right')}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/70 text-white p-2 rounded-full hover:bg-red-600 transition-all shadow-lg"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </>
        )}

        <div
          ref={rowRef}
          className="flex gap-3 overflow-x-auto overflow-y-visible scroll-smooth pb-8 pt-2 px-6 scrollbar-hide"
          style={{ 
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
            minHeight: '280px'
          }}
        >
          {visibleItems.map((item, index) => (
            <motion.div
              key={item.id || index}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.15 }}
              className={`flex-none ${cardWidth}`}
            >
              <MediaCard item={item} type={type} />
            </motion.div>
          ))}
          
          {}
          {loading && (
            <>
              {[...Array(3)].map((_, i) => (
                <div key={`skeleton-${i}`} className={`flex-none ${cardWidth}`}>
                  <div className="rounded-lg overflow-hidden bg-zinc-800">
                    <div className="relative w-full" style={{ aspectRatio: '2/3' }}>
                      <div className="w-full h-full bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800 animate-pulse" />
                    </div>
                    <div className="p-2">
                      <div className="h-2 bg-zinc-700 rounded animate-pulse mb-1" />
                      <div className="h-1.5 bg-zinc-700 rounded animate-pulse w-2/3" />
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategorySection;