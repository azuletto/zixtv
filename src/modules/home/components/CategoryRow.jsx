
import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon } from '/src/shared/icons/heroiconsOutlineCompat';
import { useNavigate } from 'react-router-dom';
import MediaCard from '../../../shared/components/MediaCard/MediaCard';

const CategoryRow = ({ title, items = [], type, categories = [], viewAllPath, onItemSelect, showViewAll = true }) => {
  const navigate = useNavigate();
  const rowRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [visibleCount, setVisibleCount] = useState(12);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showDropdown, setShowDropdown] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const prevFilteredItemsLengthRef = useRef(0);

  const filteredItems = useMemo(() => {
    if (selectedCategory === 'all') return items;
    return items.filter(item => {
      if (type === 'live') return (item.groupTitle || item.originalGroup) === selectedCategory;
      if (type === 'movies') return (item.groupTitle || item.group || 'Filmes') === selectedCategory;
      if (type === 'series') return (item.groupTitle || item.group || 'Series') === selectedCategory;
      if (type === 'tmdb') return true;
      return true;
    });
  }, [items, selectedCategory, type]);

  const visibleItems = filteredItems.slice(0, visibleCount);
  const totalItems = filteredItems.length;

  
  useEffect(() => {
    if (items.length > 0 && isFirstLoad) {
      setIsFirstLoad(false);
    }
  }, [items.length, isFirstLoad]);

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

  
  useEffect(() => {
    const currentLength = filteredItems.length;
    const prevLength = prevFilteredItemsLengthRef.current;
    
    if (prevLength !== currentLength && selectedCategory !== 'all') {
      setVisibleCount(12);
      setHasMore(true);
      if (rowRef.current) {
        rowRef.current.scrollLeft = 0;
        setTimeout(checkScroll, 100);
      }
    } else if (selectedCategory === 'all' && prevLength !== currentLength) {
      setVisibleCount(12);
      setHasMore(true);
      if (rowRef.current) {
        rowRef.current.scrollLeft = 0;
        setTimeout(checkScroll, 100);
      }
    }
    
    prevFilteredItemsLengthRef.current = currentLength;
  }, [filteredItems, selectedCategory, checkScroll]);

  
  if (isFirstLoad && items.length === 0) {
    return null;
  }

  if (!items || items.length === 0) {
    return null;
  }

  const uniqueCategories = useMemo(() => {
    if (categories.length) return categories;
    if (type === 'tmdb') return [];
    const cats = new Set();
    items.forEach(item => {
      if (type === 'live') cats.add(item.groupTitle || item.originalGroup || 'Geral');
      if (type === 'movies') cats.add(item.groupTitle || item.group || 'Filmes');
      if (type === 'series') cats.add(item.groupTitle || item.group || 'Series');
    });
    return Array.from(cats).sort();
  }, [items, type, categories]);

  const resolvedViewAllPath = useMemo(() => {
    if (viewAllPath) return viewAllPath;
    if (type === 'movies') return '/movies';
    if (type === 'series') return '/series';
    if (type === 'live') return '/live';
    if (type === 'tmdb') return '/';
    return '/';
  }, [type, viewAllPath]);

  const hasCategories = uniqueCategories.length > 1 && type !== 'tmdb';

  const cardWidth = 'w-[105px] sm:w-[120px] md:w-[135px] lg:w-[150px]';

  return (
    <div className="w-full mb-8 py-3">
      {}
      <div className="flex items-center justify-between mb-4 px-6">
        <h2 className="text-lg sm:text-xl font-semibold text-white">{title}</h2>
        <div className="flex items-center gap-3">
          {showViewAll && (
            <button
              onClick={() => navigate(resolvedViewAllPath)}
              className="text-xs font-medium text-zinc-300 hover:text-white transition-colors bg-zinc-800/40 hover:bg-zinc-700/60 px-3 py-1 rounded"
            >
              Ver tudo
            </button>
          )}

          {totalItems > 12 && (
            <span className="text-xs text-zinc-500">
              {visibleCount} / {totalItems}
            </span>
          )}
          
          {hasCategories && (
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors bg-zinc-800/30 px-2 py-1 rounded"
              >
                <span className="max-w-[100px] truncate">{selectedCategory === 'all' ? 'Todas' : selectedCategory}</span>
                <ChevronDownIcon className={`w-3 h-3 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showDropdown && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
                  <div className="absolute right-0 mt-1 w-48 max-h-60 overflow-y-auto bg-zinc-900 border border-zinc-800 rounded-lg shadow-lg z-20 py-1">
                    <button
                      onClick={() => {
                        setSelectedCategory('all');
                        setShowDropdown(false);
                        setVisibleCount(12);
                        setHasMore(true);
                        if (rowRef.current) rowRef.current.scrollLeft = 0;
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${selectedCategory === 'all' ? 'text-red-500 bg-zinc-800' : 'text-zinc-300 hover:bg-zinc-800'}`}
                    >
                      Todas
                    </button>
                    {uniqueCategories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => {
                          setSelectedCategory(cat);
                          setShowDropdown(false);
                          setVisibleCount(12);
                          setHasMore(true);
                          if (rowRef.current) rowRef.current.scrollLeft = 0;
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs transition-colors truncate ${selectedCategory === cat ? 'text-red-500 bg-zinc-800' : 'text-zinc-300 hover:bg-zinc-800'}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      
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
          className="flex gap-3 overflow-x-auto overflow-y-visible scroll-smooth pb-8 pt-3 px-6 scrollbar-hide"
          style={{ 
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
            minHeight: '300px'
          }}
        >
          {visibleItems.map((item, index) => {
            const uniqueKey = `${item.id || item.uniqueId || item.url}-${type}-${index}`;
            
            return (
              <div
                key={uniqueKey}
                className={`flex-none ${cardWidth}`}
              >
                <MediaCard 
                  item={item} 
                  type={type}
                  onSelect={onItemSelect}
                  onPlay={onItemSelect}
                  imageFit={type === 'live' ? 'contain' : 'cover'}
                  imageScale={type === 'live' ? 0.78 : 0.94}
                  imagePaddingClass={type === 'live' ? 'p-2' : ''}
                />
              </div>
            );
          })}
          
          {}
          {!isFirstLoad && loading && (
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

export default CategoryRow;

