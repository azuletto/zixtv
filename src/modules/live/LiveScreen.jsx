
import React, { useState, useMemo, lazy, Suspense, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePlaylist } from '../../shared/hooks/usePlaylist';
import { useFocusable } from '../../shared/hooks/useFocusable';
import { 
  ViewGridIcon, 
  ViewListIcon,
  XIcon,
  SearchIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  FilmIcon,
  CollectionIcon,
  HomeIcon,
  GlobeAltIcon,
  LightningBoltIcon,
  HeartIcon,
  CameraIcon,
  ChipIcon
} from '/src/shared/icons/heroiconsOutlineCompat';
import LoadingSpinner from '../../shared/components/Loaders/Spinner';
import { resolveMediaUrl } from '../../core/services/network/proxy';

const CustomPlayer = lazy(() => import('../player/CustomPlayer'));

const resolveChannelLogo = (channel) => resolveMediaUrl(channel?.logo || channel?.tvgLogo || '');

const LazyImage = ({ src, alt, className, onError }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    setIsLoaded(false);
    setError(false);
    
    if (!src) {
      setError(true);
      return;
    }

    const img = new Image();
    img.onload = () => {
      setIsLoaded(true);
    };
    img.onerror = () => {
      setError(true);
      if (onError) onError();
    };
    img.src = src;
  }, [src, onError]);

  if (error || !src) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-red-600/20">
        <span className="text-2xl">📺</span>
      </div>
    );
  }

  return (
    <>
      {!isLoaded && (
        <div className="w-full h-full bg-zinc-800 animate-pulse" />
      )}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className={`${className} ${!isLoaded ? 'hidden' : ''}`}
        loading="lazy"
        onError={() => setError(true)}
      />
    </>
  );
};

const CustomDropdown = ({ categories, selectedCategory, onSelect, totalChannels, channelsByCategory }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const menuRef = useRef(null);
  const categoryItemRefs = useRef({});
  const { ref: dropdownToggleRef, isFocused: isDropdownFocused } = useFocusable('live-category-dropdown-toggle', {
    group: 'live-controls',
    onSelect: () => setIsOpen((prev) => !prev),
  });

  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  
  useEffect(() => {
    if (isOpen && menuRef.current) {
      const selectedElement = categoryItemRefs.current[selectedCategory];
      if (selectedElement) {
        setTimeout(() => {
          selectedElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }, 50);
      }
    }
  }, [isOpen, selectedCategory]);

  // Auto-scroll dropdown when selectedCategory changes
  useEffect(() => {
    if (isOpen && selectedCategory) {
      const categoryElement = categoryItemRefs.current[selectedCategory];
      if (categoryElement && menuRef.current) {
        categoryElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [isOpen, selectedCategory]);

  // Handle category dropdown keyboard navigation globally
  useEffect(() => {
    if (!isOpen) return;

    const handleCategoryKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(false);
        return;
      }

      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        onSelect(selectedCategory);
        setIsOpen(false);
        return;
      }

      const categoryList = ['all', ...Array.from(categories)];
      const currentIndex = categoryList.indexOf(selectedCategory);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        const nextIndex = (currentIndex + 1) % categoryList.length;
        onSelect(categoryList[nextIndex]);
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        const prevIndex = (currentIndex - 1 + categoryList.length) % categoryList.length;
        onSelect(categoryList[prevIndex]);
        return;
      }
    };

    document.addEventListener('keydown', handleCategoryKeyDown, true);
    return () => document.removeEventListener('keydown', handleCategoryKeyDown, true);
  }, [isOpen, selectedCategory, categories, onSelect]);

  
  const getCategoryIcon = (categoryName) => {
    const name = categoryName.toLowerCase();
    if (name.includes('esporte') || name.includes('sport')) return <LightningBoltIcon className="w-4 h-4" />;
    if (name.includes('notícia') || name.includes('news')) return <GlobeAltIcon className="w-4 h-4" />;
    if (name.includes('filme') || name.includes('movie')) return <FilmIcon className="w-4 h-4" />;
    if (name.includes('série') || name.includes('series')) return <CollectionIcon className="w-4 h-4" />;
    if (name.includes('internacional')) return <GlobeAltIcon className="w-4 h-4" />;
    if (name.includes('favorito') || name.includes('favorite')) return <HeartIcon className="w-4 h-4" />;
    if (name.includes('documentário') || name.includes('documentary')) return <CameraIcon className="w-4 h-4" />;
    if (name.includes('tecnologia') || name.includes('tech')) return <ChipIcon className="w-4 h-4" />;
    return <HomeIcon className="w-4 h-4" />;
  };

  const selectedCategoryName = selectedCategory === 'all' 
    ? 'Todas as categorias' 
    : selectedCategory;

  const selectedCount = selectedCategory === 'all' 
    ? totalChannels 
    : channelsByCategory.get(selectedCategory)?.length || 0;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={dropdownToggleRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`home-control home-control-hover group w-full justify-between gap-3 px-4 py-2 text-left sm:w-80 ${isDropdownFocused ? 'home-control-active' : ''}`}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="p-1 rounded-md bg-red-600/20 text-red-500">
            <HomeIcon className="w-4 h-4" />
          </div>
          <span className="text-sm text-white truncate">
            {selectedCategoryName}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 bg-zinc-800 px-2 py-0.5 rounded-full">
            {selectedCount}
          </span>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDownIcon className="w-4 h-4 text-gray-400 group-hover:text-red-500 transition-colors" />
          </motion.div>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/95 shadow-xl backdrop-blur-sm"
          >
            <div className="max-h-80 overflow-y-auto">
              <button
                ref={el => categoryItemRefs.current['all'] = el}
                onClick={() => {
                  onSelect('all');
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-zinc-800 text-red-400'
                    : 'text-gray-300 hover:bg-zinc-800 hover:text-white'
                }`}
              >
                <div className="p-1 rounded-md bg-red-600/20 text-red-500">
                  <HomeIcon className="w-4 h-4" />
                </div>
                <span className="flex-1 text-left text-sm font-medium">Todas as categorias</span>
                <span className="text-xs text-gray-500 bg-zinc-800 px-2 py-0.5 rounded-full">
                  {totalChannels}
                </span>
                {selectedCategory === 'all' && (
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                )}
              </button>

              <div className="h-px bg-zinc-800 my-1" />

              {categories.map(category => {
                const count = channelsByCategory.get(category)?.length || 0;
                return (
                  <button
                    key={category}
                    ref={el => categoryItemRefs.current[category] = el}
                    onClick={() => {
                      onSelect(category);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors ${
                      selectedCategory === category
                        ? 'bg-zinc-800 text-red-400'
                        : 'text-gray-300 hover:bg-zinc-800 hover:text-white'
                    }`}
                  >
                    <div className="p-1 rounded-md bg-zinc-800 text-gray-400">
                      {getCategoryIcon(category)}
                    </div>
                    <span className="flex-1 text-left text-sm truncate">{category}</span>
                    <span className="text-xs text-gray-500 bg-zinc-800 px-2 py-0.5 rounded-full">
                      {count}
                    </span>
                    {selectedCategory === category && (
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const LiveScreen = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { getLiveChannels, activePlaylist, isLoading } = usePlaylist();
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [showPlayer, setShowPlayer] = useState(false);
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('liveViewMode') || 'list';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const itemsPerPage = 48;
  const contentKey = `${viewMode}-${currentPage}-${selectedCategory}-${searchQuery.trim()}`;

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.015,
        delayChildren: 0.03
      }
    },
    exit: {
      opacity: 0,
      transition: {
        duration: 0.16
      }
    }
  };

  const staggerItem = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' } }
  };

  
  const { channelsByCategory, categories, totalChannels } = useMemo(() => {
    const channels = getLiveChannels();
    if (!channels.length) {
      return { channelsByCategory: new Map(), categories: [], totalChannels: 0 };
    }

    const categoryMap = new Map();
    
    channels.forEach(channel => {
      const category = channel.groupTitle || channel.originalGroup || channel.group || channel.category || 'Canais Gerais';
      if (!categoryMap.has(category)) {
        categoryMap.set(category, []);
      }
      categoryMap.get(category).push(channel);
    });

    const sortedCategories = Array.from(categoryMap.keys()).sort((a, b) => a.localeCompare(b));
    
    const sortedCategoryMap = new Map();
    sortedCategories.forEach(cat => {
      const catChannels = categoryMap.get(cat);
      sortedCategoryMap.set(cat, [...(catChannels || [])].sort((a, b) => a.name.localeCompare(b.name)));
    });

    return {
      channelsByCategory: sortedCategoryMap,
      categories: sortedCategories,
      totalChannels: channels.length
    };
  }, [getLiveChannels]);

  
  const { filteredCategories, filteredChannelsByCategory, totalFiltered } = useMemo(() => {
    let cats = [...categories];
    let channelMap = new Map(channelsByCategory);
    
    if (selectedCategory !== 'all') {
      cats = [selectedCategory];
      channelMap = new Map();
      const channels = channelsByCategory.get(selectedCategory);
      if (channels) {
        channelMap.set(selectedCategory, channels);
      }
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const newCats = [];
      const newMap = new Map();
      
      cats.forEach(cat => {
        const channels = channelMap.get(cat) || [];
        const filtered = channels.filter(ch => ch.name.toLowerCase().includes(query));
        if (filtered.length > 0) {
          newCats.push(cat);
          newMap.set(cat, filtered);
        }
      });
      
      cats = newCats;
      channelMap = newMap;
    }
    
    const total = Array.from(channelMap.values()).reduce((sum, arr) => sum + arr.length, 0);
    
    return {
      filteredCategories: cats,
      filteredChannelsByCategory: channelMap,
      totalFiltered: total
    };
  }, [categories, channelsByCategory, selectedCategory, searchQuery]);

  
  const flatList = useMemo(() => {
    const flat = [];
    filteredCategories.forEach(category => {
      const channels = filteredChannelsByCategory.get(category) || [];
      if (channels.length > 0) {
        flat.push({ type: 'header', category, count: channels.length });
        channels.forEach(channel => {
          flat.push({ type: 'channel', ...channel, category });
        });
      }
    });
    return flat;
  }, [filteredCategories, filteredChannelsByCategory]);

  
  useEffect(() => {
    setCurrentPage(1);
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [searchQuery, selectedCategory]);

  const totalPages = Math.max(1, Math.ceil(flatList.length / itemsPerPage));
  const visibleItems_ = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return flatList.slice(start, start + itemsPerPage);
  }, [flatList, currentPage]);

  const goToPage = (page) => {
    const next = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(next);
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  };

  const nextPage = () => goToPage(currentPage + 1);
  const prevPage = () => goToPage(currentPage - 1);

  const handleChannelSelect = useCallback((channel) => {
    setSelectedChannel(channel);
    setShowPlayer(true);
  }, []);

  const handleClosePlayer = useCallback(() => {
    setShowPlayer(false);
    setSelectedChannel(null);
  }, []);

  useEffect(() => {
    const autoPlayChannel = location.state?.autoPlayChannel;
    if (!autoPlayChannel) return;

    const channels = getLiveChannels();
    const matched = channels.find((channel) => {
      if (autoPlayChannel.id && channel.id === autoPlayChannel.id) return true;
      if (autoPlayChannel.url && channel.url === autoPlayChannel.url) return true;
      return false;
    }) || autoPlayChannel;

    setSelectedChannel(matched);
    setShowPlayer(true);
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.state, location.pathname, navigate, getLiveChannels]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setSelectedCategory('all');
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  const { ref: liveSearchFocusableRef, isFocused: isLiveSearchFocused } = useFocusable('live-search-input', {
    group: 'live-controls',
    onSelect: () => searchInputRef.current?.focus(),
  });

  const { ref: liveSearchClearRef, isFocused: isLiveSearchClearFocused } = useFocusable('live-search-clear', {
    group: 'live-controls',
    onSelect: handleClearSearch,
  });

  const { ref: liveViewListRef, isFocused: isLiveViewListFocused } = useFocusable('live-view-list', {
    group: 'live-controls',
    onSelect: () => {
      setViewMode('list');
      localStorage.setItem('liveViewMode', 'list');
    },
  });

  const { ref: liveViewGridRef, isFocused: isLiveViewGridFocused } = useFocusable('live-view-grid', {
    group: 'live-controls',
    onSelect: () => {
      setViewMode('grid');
      localStorage.setItem('liveViewMode', 'grid');
    },
  });

  
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (showPlayer) {
        if (e.key === 'Escape') handleClosePlayer();
        return;
      }
      
      if (e.key === '/' || e.key === 's') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape' && (searchQuery || selectedCategory !== 'all')) {
        handleClearSearch();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showPlayer, searchQuery, selectedCategory, handleClearSearch, handleClosePlayer]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!activePlaylist) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-4">📺</div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Nenhuma playlist selecionada
          </h2>
          <p className="text-gray-400">
            Selecione uma playlist na barra lateral para começar
          </p>
        </div>
      </div>
    );
  }

  if (totalChannels === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-4">📡</div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Nenhum canal disponível
          </h2>
          <p className="text-gray-400">
            A playlist não contém canais ao vivo
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-zinc-950 overflow-hidden">
      {}
      <div className="flex-shrink-0 bg-gradient-to-r from-zinc-950 via-zinc-950 to-zinc-900 border-b border-zinc-800">
        {}
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-1 h-6 bg-red-600 rounded-full" />
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                  Ao Vivo
                </h1>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="px-2.5 py-0.5 bg-red-600/20 rounded-full">
                  <span className="text-xs font-medium text-red-400">{totalChannels} canais</span>
                </div>
                {selectedCategory !== 'all' && (
                  <div className="px-2.5 py-0.5 bg-zinc-800 rounded-full">
                    <span className="text-xs text-gray-400">{selectedCategory}</span>
                  </div>
                )}
              </div>
            </div>

            {}
            <div className="flex items-center gap-2">
              {}
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  ref={(node) => {
                    searchInputRef.current = node;
                    liveSearchFocusableRef.current = node;
                  }}
                  type="text"
                  placeholder="Buscar canal..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSelectedCategory('all');
                  }}
                  className={`home-input home-input-hover w-64 pl-9 pr-8 py-2 text-sm transition-all duration-200 focus:w-80 ${isLiveSearchFocused ? 'border-red-500 ring-2 ring-red-500/20' : ''}`}
                />
                {searchQuery && (
                  <button
                    ref={liveSearchClearRef}
                    onClick={handleClearSearch}
                    className={`absolute right-2 top-1/2 transform -translate-y-1/2 transition-colors ${isLiveSearchClearFocused ? 'text-red-500' : 'text-gray-500 hover:text-white'}`}
                  >
                    <XIcon className="w-4 h-4" />
                  </button>
                )}
              </div>

              {}
              <div className="flex gap-1 rounded-lg border border-zinc-800 bg-zinc-900/80 p-1 backdrop-blur-sm">
                <button
                  ref={liveViewListRef}
                  onClick={() => {
                    setViewMode('list');
                    localStorage.setItem('liveViewMode', 'list');
                  }}
                  className={`p-1.5 rounded-md transition-all duration-200 ${
                    viewMode === 'list'
                      ? 'home-control-active'
                      : isLiveViewListFocused
                        ? 'home-control-active'
                        : 'text-gray-400 hover:bg-zinc-800 hover:text-white'
                  }`}
                  title="Modo lista"
                >
                  <ViewListIcon className="w-4 h-4" />
                </button>
                <button
                  ref={liveViewGridRef}
                  onClick={() => {
                    setViewMode('grid');
                    localStorage.setItem('liveViewMode', 'grid');
                  }}
                  className={`p-1.5 rounded-md transition-all duration-200 ${
                    viewMode === 'grid'
                      ? 'home-control-active'
                      : isLiveViewGridFocused
                        ? 'home-control-active'
                        : 'text-gray-400 hover:bg-zinc-800 hover:text-white'
                  }`}
                  title="Modo grade"
                >
                  <ViewGridIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {}
        {categories.length > 0 && (
          <div className="px-4 pb-3">
            <CustomDropdown
              categories={categories}
              selectedCategory={selectedCategory}
              onSelect={setSelectedCategory}
              totalChannels={totalChannels}
              channelsByCategory={channelsByCategory}
            />
          </div>
        )}

        {}
        {searchQuery && (
          <div className="px-4 pb-3 -mt-1">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>Resultados para:</span>
              <span className="text-red-400 font-medium">"{searchQuery}"</span>
              <button 
                onClick={handleClearSearch} 
                className="text-gray-500 hover:text-white transition-colors"
              >
                <XIcon className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>

      {}
      <div ref={containerRef} className="flex-1 overflow-y-auto">
        <div className="px-3 py-3">
          {visibleItems_.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-sm">
                {searchQuery ? `Nenhum canal encontrado para "${searchQuery}"` : 'Nenhum canal disponível'}
              </p>
            </div>
          ) : (
            <>
              <AnimatePresence mode="wait">
                {viewMode === 'grid' ? (
                  <motion.div
                    key={`grid-${contentKey}`}
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2"
                  >
                    {visibleItems_.map((item, index) => {
                      if (item.type === 'header') {
                        return (
                          <motion.div
                            key={`header-${item.category}`}
                            variants={staggerItem}
                            className="col-span-full mt-3 first:mt-0"
                          >
                            <h2 className="text-sm font-semibold text-white mb-1.5 pb-0.5 border-b border-zinc-800">
                              {item.category}
                              <span className="ml-1.5 text-xs text-gray-500">({item.count})</span>
                            </h2>
                          </motion.div>
                        );
                      }
                      return (
                        <motion.div key={item.id || item.url || index} variants={staggerItem}>
                          <ChannelCard
                            channel={item}
                            onSelect={handleChannelSelect}
                          />
                        </motion.div>
                      );
                    })}
                  </motion.div>
                ) : (
                  <motion.div
                    key={`list-${contentKey}`}
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="space-y-1"
                  >
                    {visibleItems_.map((item, index) => {
                      if (item.type === 'header') {
                        return (
                          <motion.div
                            key={`header-${item.category}`}
                            variants={staggerItem}
                            className="pt-2 first:pt-0"
                          >
                            <h2 className="text-sm font-semibold text-white pb-0.5 border-b border-zinc-800">
                              {item.category}
                              <span className="ml-1.5 text-xs text-gray-500">({item.count})</span>
                            </h2>
                          </motion.div>
                        );
                      }
                      return (
                        <motion.div key={item.id || item.url || index} variants={staggerItem}>
                          <ChannelListItem
                            channel={item}
                            onSelect={handleChannelSelect}
                          />
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8 pb-4">
                  <button
                    onClick={prevPage}
                    disabled={currentPage === 1}
                    className="home-control home-control-hover h-9 w-9 px-0 py-0 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronLeftIcon className="w-5 h-5" />
                  </button>

                  <div className="flex gap-1">
                    {(() => {
                      const pages = [];
                      const maxVisible = 5;
                      let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                      let endPage = Math.min(totalPages, startPage + maxVisible - 1);

                      if (endPage - startPage + 1 < maxVisible) {
                        startPage = Math.max(1, endPage - maxVisible + 1);
                      }

                      for (let i = startPage; i <= endPage; i++) {
                        pages.push(i);
                      }

                      return pages.map((page) => (
                        <button
                          key={page}
                          onClick={() => goToPage(page)}
                          className={`min-w-[36px] h-9 rounded-lg font-medium transition-all ${
                            currentPage === page
                              ? 'home-control home-control-active'
                              : 'home-control home-control-hover'
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
                    className="home-control home-control-hover h-9 w-9 px-0 py-0 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronRightIcon className="w-5 h-5" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {}
      <AnimatePresence>
        {showPlayer && selectedChannel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
            onClick={handleClosePlayer}
          >
            <div className="relative w-full max-w-5xl mx-3" onClick={(e) => e.stopPropagation()}>
              <Suspense fallback={<LoadingSpinner />}>
                <CustomPlayer
                  source={selectedChannel.url}
                  title={selectedChannel.name}
                  type="live"
                  metadata={{
                    ...selectedChannel.metadata,
                    title: selectedChannel.name,
                    channelLogo: selectedChannel.logo || selectedChannel.tvgLogo || selectedChannel.metadata?.channelLogo || null,
                    logo: selectedChannel.logo || selectedChannel.tvgLogo || null,
                    tvgLogo: selectedChannel.tvgLogo || selectedChannel.logo || null
                  }}
                  autoPlay={true}
                  onClose={handleClosePlayer}
                />
              </Suspense>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ChannelCard = React.memo(({ channel, onSelect }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imgError, setImgError] = useState(false);
  const channelId = channel?.id || channel?.url || channel?.name;
  const { ref: channelRef, isFocused } = useFocusable(`live-channel-card-${channelId}`, {
    group: 'live-channels',
    onSelect: () => onSelect(channel),
  });
  const isActive = isHovered || isFocused;
  
  return (
    <div
      ref={channelRef}
      onClick={() => onSelect(channel)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group cursor-pointer transition-all duration-200 ${
        isActive ? 'scale-105' : 'hover:scale-105'
      }`}
    >
      <div 
        className={`relative flex w-full items-center justify-center overflow-hidden rounded-lg border-2 bg-zinc-900 transition-all duration-200 ${
          isActive
            ? 'border-red-500 shadow-xl shadow-red-500/20'
            : 'border-zinc-800 hover:border-red-500 hover:shadow-xl hover:shadow-red-500/10'
        }`}
        style={{ aspectRatio: '1/1' }}
      >
        <div className="w-3/5 h-3/5">
          {!imgError && (channel.logo || channel.tvgLogo) ? (
            <img
              src={resolveChannelLogo(channel)}
              alt={channel.name}
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-red-600/20 rounded-md">
              <span className="text-2xl">📺</span>
            </div>
          )}
        </div>
        <div className="absolute top-1 right-1">
          <span className="text-[8px] font-bold bg-red-600 text-white px-1 py-0.5 rounded shadow-sm">
            AO VIVO
          </span>
        </div>
      </div>
      <p className="mt-1 truncate text-center text-xs text-gray-400 transition-colors group-hover:text-white">
        {channel.name}
      </p>
    </div>
  );
});

const ChannelListItem = React.memo(({ channel, onSelect }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imgError, setImgError] = useState(false);
  const channelId = channel?.id || channel?.url || channel?.name;
  const { ref: channelRef, isFocused } = useFocusable(`live-channel-list-${channelId}`, {
    group: 'live-channels',
    onSelect: () => onSelect(channel),
  });
  const isActive = isHovered || isFocused;
  
  return (
    <div
      ref={channelRef}
      onClick={() => onSelect(channel)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 bg-zinc-900 p-3 transition-all duration-200 ${
        isActive
          ? 'border-red-500 scale-[1.02] shadow-xl shadow-red-500/20'
          : 'border-zinc-800 hover:border-red-500 hover:scale-[1.02] hover:shadow-xl hover:shadow-red-500/10'
      }`}
      style={{ 
        backgroundColor: isActive ? 'rgba(24, 24, 27, 0.92)' : undefined
      }}
    >
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-zinc-900 transition-all duration-200" style={{ transform: isActive ? 'scale(1.05)' : 'scale(1)' }}>
        <div className="w-9 h-9">
          {!imgError && (channel.logo || channel.tvgLogo) ? (
            <img
              src={resolveChannelLogo(channel)}
              alt={channel.name}
              className="w-full h-full object-contain"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-red-600/20 rounded-lg">
              <span className="text-xl">📺</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-sm font-medium text-white transition-colors" style={{ color: isActive ? '#f4f4f5' : '#ffffff' }}>
            {channel.name}
          </h3>
          <span className="text-[10px] font-bold bg-red-600 text-white px-1.5 py-0.5 rounded flex-shrink-0">
            AO VIVO
          </span>
        </div>
        {channel.group && (
          <p className="text-xs text-gray-500 truncate mt-0.5">{channel.group}</p>
        )}
      </div>
      
      <div 
        className="text-red-500 transition-all duration-200"
        style={{ opacity: isActive ? 1 : 0 }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
});

export default LiveScreen;
