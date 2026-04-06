
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePlaylist } from '../../shared/hooks/usePlaylist';
import { usePaginatedContent } from '../../shared/hooks/usePaginatedContent';
import MediaCard from '../../shared/components/MediaCard/MediaCard';
import CategorySection from '../../shared/components/CategorySection/CategorySection';
import ViewModeToggle from '../../shared/components/ViewModeToggle/ViewModeToggle';
import CustomPlayer from '../player/CustomPlayer';
import { ChevronLeftIcon, ChevronRightIcon, SearchIcon, XIcon, ChevronDownIcon } from '/src/shared/icons/heroiconsOutlineCompat';

const genreDictionary = {
  
  'acao': 'AÃ§Ã£o',
  'aÃ§Ã£o': 'AÃ§Ã£o',
  'action': 'AÃ§Ã£o',
  'acÃ£o': 'AÃ§Ã£o',
  'accao': 'AÃ§Ã£o',
  'aÃ§ao': 'AÃ§Ã£o',
  
  
  'aventura': 'Aventura',
  'adventure': 'Aventura',
  'aventura e acao': 'AÃ§Ã£o e Aventura',
  'aventura e aÃ§Ã£o': 'AÃ§Ã£o e Aventura',
  'acao e aventura': 'AÃ§Ã£o e Aventura',
  'aÃ§Ã£o e aventura': 'AÃ§Ã£o e Aventura',
  'action adventure': 'AÃ§Ã£o e Aventura',
  
  
  'comedia': 'ComÃ©dia',
  'comÃ©dia': 'ComÃ©dia',
  'comedy': 'ComÃ©dia',
  'comedia romantica': 'ComÃ©dia RomÃ¢ntica',
  'comÃ©dia romÃ¢ntica': 'ComÃ©dia RomÃ¢ntica',
  'romantic comedy': 'ComÃ©dia RomÃ¢ntica',
  'sitcom': 'Sitcom',
  'comedia dramatica': 'ComÃ©dia DramÃ¡tica',
  'comÃ©dia dramÃ¡tica': 'ComÃ©dia DramÃ¡tica',
  
  
  'drama': 'Drama',
  'dramatico': 'Drama',
  'dramÃ¡tico': 'Drama',
  'dramatic': 'Drama',
  'drama romantico': 'Drama RomÃ¢ntico',
  'drama romÃ¢ntico': 'Drama RomÃ¢ntico',
  
  
  'terror': 'Terror',
  'horror': 'Terror',
  'suspense': 'Suspense',
  'thriller': 'Suspense',
  
  
  'ficcao cientifica': 'FicÃ§Ã£o CientÃ­fica',
  'ficÃ§Ã£o cientÃ­fica': 'FicÃ§Ã£o CientÃ­fica',
  'science fiction': 'FicÃ§Ã£o CientÃ­fica',
  'sci-fi': 'FicÃ§Ã£o CientÃ­fica',
  'scifi': 'FicÃ§Ã£o CientÃ­fica',
  
  
  'fantasia': 'Fantasia',
  'fantasy': 'Fantasia',
  
  
  'romance': 'Romance',
  'romantico': 'Romance',
  'romÃ¢ntico': 'Romance',
  'romantic': 'Romance',
  
  
  'faroeste': 'Faroeste',
  'western': 'Faroeste',
  
  
  'animacao': 'AnimaÃ§Ã£o',
  'animaÃ§Ã£o': 'AnimaÃ§Ã£o',
  'animation': 'AnimaÃ§Ã£o',
  'anime': 'Anime',
  
  
  'documentario': 'DocumentÃ¡rio',
  'documentÃ¡rio': 'DocumentÃ¡rio',
  'documentary': 'DocumentÃ¡rio',
  
  
  'policial': 'Policial',
  'crime': 'Policial',
  
  
  'guerra': 'Guerra',
  'war': 'Guerra',
  
  
  'musical': 'Musical',
  'music': 'Musical',
  
  
  'biografia': 'Biografia',
  'biography': 'Biografia',
  
  
  'esporte': 'Esporte',
  'sports': 'Esporte',
  
  
  'historia': 'HistÃ³ria',
  'histÃ³ria': 'HistÃ³ria',
  'history': 'HistÃ³ria',
  
  
  'familia': 'FamÃ­lia',
  'famÃ­lia': 'FamÃ­lia',
  'family': 'FamÃ­lia',
  'infantil': 'Infantil',
  
  
  'reality': 'Reality Show',
  'reality show': 'Reality Show',

};

const normalizeText = (text) => {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '');
};

const capitalizeWords = (text) => {
  if (!text) return '';
  return text
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const normalizeGenre = (rawGenre) => {
  if (!rawGenre) return 'Outros';
  
  const normalized = normalizeText(rawGenre);
  
  
  if (genreDictionary[normalized]) {
    return genreDictionary[normalized];
  }
  
  
  return capitalizeWords(rawGenre.slice(0, 30));
};

const cleanTitle = (title) => {
  if (!title) return '';
  const match = title.match(/^(?:filmes|series|filme|serie|movies|tv)\s*[|\-:]\s*(.+)$/i);
  return match ? match[1].trim() : title;
};

const MoviesScreen = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { getMovies, isLoading: playlistLoading } = usePlaylist();
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [showPlayer, setShowPlayer] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  
  const allMovies = getMovies() || [];
  
  
  const moviesWithCategories = useMemo(() => {
    
    const result = [];
    const len = Math.min(allMovies.length, 5000); 
    
    for (let i = 0; i < len; i++) {
      const movie = allMovies[i];
      
      
      let rawCategory = movie.groupTitle || movie.metadata?.genre || movie.genre;
      
      
      const displayCategory = normalizeGenre(rawCategory);
      
      result.push({
        ...movie,
        name: cleanTitle(movie.name || movie.title),
        title: cleanTitle(movie.name || movie.title),
        categoryDisplay: displayCategory
      });
    }
    
    return result;
  }, [allMovies]);

  const {
    items: movies,
    groupedItems,
    totalItems,
    currentPage,
    totalPages,
    nextPage,
    prevPage,
    goToPage,
    searchQuery,
    setSearchQuery,
    filter,
    setFilter,
    viewMode,
    setViewMode,
  } = usePaginatedContent(moviesWithCategories, 48);

  
  const categories = useMemo(() => {
    const categorySet = new Set();
    const len = Math.min(moviesWithCategories.length, 5000);
    
    for (let i = 0; i < len; i++) {
      const cat = moviesWithCategories[i].categoryDisplay;
      if (cat && cat !== 'Outros') {
        categorySet.add(cat);
      }
    }
    
    return ['all', ...Array.from(categorySet).sort()];
  }, [moviesWithCategories]);

  useEffect(() => {
    if (viewMode === 'categories' && filter !== 'all') {
      setFilter('all');
    }

    if (viewMode === 'categories') {
      setShowCategoryDropdown(false);
    }
  }, [viewMode, filter, setFilter]);

  const gridMovies = movies;
  const groupedSafeItems = groupedItems;
  const visibleCount = totalItems;

  const handleMovieSelect = (movie) => {
    setSelectedMovie(movie);
    setShowPlayer(true);
  };

  useEffect(() => {
    const autoPlayItem = location.state?.autoPlayItem;
    if (!autoPlayItem || allMovies.length === 0) return;

    const matched = allMovies.find((movie) => {
      if (autoPlayItem.id && movie.id === autoPlayItem.id) return true;
      if (autoPlayItem.url && movie.url === autoPlayItem.url) return true;
      return false;
    }) || autoPlayItem;

    setSelectedMovie(matched);
    setShowPlayer(true);
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.state, location.pathname, navigate, allMovies]);

  if (playlistLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-red-600/20 border-t-red-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (allMovies.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-4 text-zinc-700">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 4v16M17 4v16M3 8h18M3 16h18M5 4h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" />
            </svg>
          </div>
          <h2 className="text-xl text-white mb-2">Nenhum filme disponÃ­vel</h2>
          <p className="text-zinc-500">Adicione uma playlist com filmes para comeÃ§ar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-600/5 via-zinc-950 to-zinc-950" />
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgb(255 255 255 / 0.02) 1px, transparent 0)`,
          backgroundSize: '48px 48px'
        }} />
      </div>

      <div className="relative z-10 p-6">
        {}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-white">Filmes</h1>
            <ViewModeToggle viewMode={viewMode} setViewMode={setViewMode} />
          </div>
          
          {}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="text"
                placeholder="Buscar filmes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg pl-10 pr-10 py-2.5 focus:outline-none focus:border-red-600 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <XIcon className="w-5 h-5 text-zinc-500 hover:text-zinc-300" />
                </button>
              )}
            </div>
            
            {}
            {viewMode === 'grid' && categories.length > 1 && (
              <div className="relative">
                <button
                  onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 text-white rounded-lg px-4 py-2.5 hover:border-red-600 transition-colors"
                >
                  <span className="text-sm max-w-[150px] truncate">
                    {filter === 'all' ? 'Todas as categorias' : filter}
                  </span>
                  <ChevronDownIcon className={`w-4 h-4 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showCategoryDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowCategoryDropdown(false)} />
                    <div className="absolute right-0 mt-1 w-56 max-h-80 overflow-y-auto bg-zinc-900 border border-zinc-800 rounded-lg shadow-lg z-20 py-1">
                      {categories.map(category => (
                        <button
                          key={category}
                          onClick={() => {
                            setFilter(category);
                            setShowCategoryDropdown(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-sm transition-colors truncate ${
                            filter === category 
                              ? 'text-red-500 bg-zinc-800' 
                              : 'text-zinc-300 hover:bg-zinc-800'
                          }`}
                        >
                          {category === 'all' ? 'Todas as categorias' : category}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {}
          {viewMode === 'grid' && (
            <div className="mt-4 text-sm text-zinc-500">
              {visibleCount} {visibleCount === 1 ? 'filme encontrado' : 'filmes encontrados'}
            </div>
          )}
        </div>

        {}
        {viewMode === 'grid' ? (
          <>
            {}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPage}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4"
              >
                {gridMovies.map((movie) => (
                  <motion.div
                    key={movie.id}
                    whileHover={{ scale: 1.05, y: -4 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    onClick={() => handleMovieSelect(movie)}
                    className="cursor-pointer"
                  >
                    <MediaCard item={movie} type="movie" />
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>

            {}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8 pb-8">
                <button
                  onClick={prevPage}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeftIcon className="w-5 h-5" />
                </button>
                
                <div className="flex gap-1">
                  {(() => {
                    const pages = [];
                    const maxVisible = 5;
                    const activePage = currentPage;
                    const pageCount = totalPages;
                    let startPage = Math.max(1, activePage - Math.floor(maxVisible / 2));
                    let endPage = Math.min(pageCount, startPage + maxVisible - 1);
                    
                    if (endPage - startPage + 1 < maxVisible) {
                      startPage = Math.max(1, endPage - maxVisible + 1);
                    }
                    
                    for (let i = startPage; i <= endPage; i++) {
                      pages.push(i);
                    }
                    
                    return pages.map(page => (
                      <button
                        key={page}
                        onClick={() => goToPage(page)}
                        className={`min-w-[36px] h-9 rounded-lg font-medium transition-all ${
                          currentPage === page
                            ? 'bg-red-600 text-white'
                            : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-red-600'
                        }`}
                      >
                        {page}
                      </button>
                    ));
                  })()}
                </div>
                
                <button
                  onClick={nextPage}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRightIcon className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        ) : (
          
          <div className="space-y-6">
            {groupedSafeItems.map((category) => (
              <CategorySection
                key={category.name}
                title={category.name}
                items={category.items.map(item => ({
                  ...item,
                  name: cleanTitle(item.name || item.title),
                  title: cleanTitle(item.name || item.title)
                }))}
                type="movie"
              />
            ))}
          </div>
        )}
      </div>

      {}
      {showPlayer && selectedMovie && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
        >
          <div className="w-full max-w-6xl mx-4">
            <CustomPlayer
              source={selectedMovie.url}
              title={selectedMovie.name}
              type="movie"
              metadata={selectedMovie.metadata}
              onClose={() => setShowPlayer(false)}
            />
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default MoviesScreen;

