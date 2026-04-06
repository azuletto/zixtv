

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePlaylist } from '../../shared/hooks/usePlaylist';
import { usePaginatedContent } from '../../shared/hooks/usePaginatedContent';
import MediaCard from '../../shared/components/MediaCard/MediaCard';
import SeriesDetails from './SeriesDetails';
import CategorySection from '../../shared/components/CategorySection/CategorySection';
import ViewModeToggle from '../../shared/components/ViewModeToggle/ViewModeToggle';
import { SearchIcon, ArrowLeftIcon, XIcon, ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon } from '/src/shared/icons/heroiconsOutlineCompat';

const cleanTitle = (title) => {
  if (!title) return '';
  const match = title.match(/^(?:filmes|series|filme|serie|movies|tv)\s*[|\-:]\s*(.+)$/i);
  return match ? match[1].trim() : title;
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

const normalizeSeriesCategory = (rawCategory) => {
  if (!rawCategory) return 'Series';
  const normalized = normalizeText(rawCategory);
  if (normalized.includes('anime')) return 'Anime';
  if (normalized.includes('documentario')) return 'Documentario';
  if (normalized.includes('infantil')) return 'Infantil';
  return rawCategory.length > 28 ? `${rawCategory.slice(0, 28)}...` : rawCategory;
};

const SeriesScreen = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { getSeries, isLoading: playlistLoading } = usePlaylist();
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const allSeries = getSeries() || [];

  const seriesWithCategories = useMemo(() => {
    const result = [];
    const len = Math.min(allSeries.length, 5000);

    for (let i = 0; i < len; i++) {
      const item = allSeries[i];
      const rawCategory = item.groupTitle || item.group || item.metadata?.genre || 'Series';

      result.push({
        ...item,
        name: cleanTitle(item.name || item.title || item.seriesName || ''),
        title: cleanTitle(item.title || item.name || item.seriesName || ''),
        categoryDisplay: normalizeSeriesCategory(rawCategory)
      });
    }

    return result;
  }, [allSeries]);

  const {
    items: series,
    groupedItems,
    categories,
    totalItems,
    currentPage,
    totalPages,
    nextPage,
    prevPage,
    goToPage,
    filter,
    setFilter,
    viewMode,
    setViewMode,
    setSearchQuery: setHookSearchQuery
  } = usePaginatedContent(seriesWithCategories, 48);

  const gridSeries = series;
  const groupedSafeItems = groupedItems;
  const visibleCount = totalItems;

  const syncSearch = useCallback((value) => {
    setSearchQuery(value);
    setHookSearchQuery(value);
  }, [setHookSearchQuery]);

  useEffect(() => {
    if (viewMode === 'categories' && filter !== 'all') {
      setFilter('all');
    }

    if (viewMode === 'categories') {
      setShowCategoryDropdown(false);
    }
  }, [viewMode, filter, setFilter]);

  const handleSeriesSelect = useCallback((seriesItem) => {
    setSelectedSeries(seriesItem);
  }, []);

  const handleBackToGrid = useCallback(() => {
    setSelectedSeries(null);
  }, []);

  useEffect(() => {
    const openSeries = location.state?.openSeries;
    if (!openSeries || allSeries.length === 0) return;

    const matched = allSeries.find((seriesItem) => {
      if (openSeries.id && seriesItem.id === openSeries.id) return true;
      if (openSeries.seriesId && seriesItem.seriesId === openSeries.seriesId) return true;
      if (openSeries.seriesName && seriesItem.seriesName === openSeries.seriesName) return true;
      return false;
    }) || openSeries;

    setSelectedSeries(matched);
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.state, location.pathname, navigate, allSeries]);

  if (playlistLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-red-600/20 border-t-red-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (allSeries.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl text-white mb-4">
            Nenhuma série disponível
          </h2>
          <p className="text-gray-400">
            Adicione uma playlist com séries para começar
          </p>
        </div>
      </div>
    );
  }

  if (selectedSeries) {
    return (
      <div className="min-h-screen bg-zinc-950 overflow-x-hidden">
        <div className="sticky top-0 z-20 px-6 py-4 bg-zinc-950/95 backdrop-blur border-b border-zinc-800">
          <button
            onClick={handleBackToGrid}
            className="inline-flex items-center gap-2 text-zinc-300 hover:text-white transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Voltar para séries
          </button>
        </div>
        <SeriesDetails series={selectedSeries} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-600/5 via-zinc-950 to-zinc-950" />
      </div>

      <div className="relative z-10 p-6">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-white">Séries</h1>
            <ViewModeToggle viewMode={viewMode} setViewMode={setViewMode} />
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-xl">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="text"
              placeholder="Buscar séries..."
              value={searchQuery}
              onChange={(e) => syncSearch(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg pl-10 pr-10 py-2.5 focus:outline-none focus:border-red-600 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => syncSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <XIcon className="w-5 h-5 text-zinc-500 hover:text-zinc-300" />
              </button>
            )}
            </div>

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
                      {categories.map((category) => (
                        <button
                          key={category}
                          onClick={() => {
                            setFilter(category);
                            setShowCategoryDropdown(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-sm transition-colors truncate ${
                            filter === category ? 'text-red-500 bg-zinc-800' : 'text-zinc-300 hover:bg-zinc-800'
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

          {viewMode === 'grid' && (
            <div className="mt-4 text-sm text-zinc-500">
              {visibleCount} {visibleCount === 1 ? 'série encontrada' : 'séries encontradas'}
            </div>
          )}
        </div>

        {viewMode === 'grid' ? (
          <>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPage}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.25 }}
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4"
              >
                {gridSeries.map((show) => (
                  <motion.div
                    key={show.id}
                    whileHover={{ scale: 1.04, y: -4 }}
                    transition={{ type: 'spring', stiffness: 280, damping: 20 }}
                    className="cursor-pointer"
                    onClick={() => handleSeriesSelect(show)}
                  >
                    <MediaCard item={show} type="series" />
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>

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
                items={category.items}
                type="series"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SeriesScreen;


