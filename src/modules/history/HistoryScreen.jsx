import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CustomPlayer from '../player/CustomPlayer';
import { StorageService } from '../../core/services/storage/StorageService';
import { CollectionIcon, FilmIcon, LightningBoltIcon, TrashIcon, PlayIcon, ChevronLeftIcon, ChevronRightIcon } from '/src/shared/icons/heroiconsOutlineCompat';
import { resolveMediaUrl } from '../../core/services/network/proxy';

const storageService = new StorageService();

const TABS = [
  { key: 'series', label: 'Séries', icon: CollectionIcon },
  { key: 'movie', label: 'Filmes', icon: FilmIcon },
  { key: 'live', label: 'Canais', icon: LightningBoltIcon }
];

const ITEMS_PER_PAGE = 24;

const formatTime = (seconds = 0) => {
  const safe = Math.max(0, Number(seconds) || 0);
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = Math.floor(safe % 60);

  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const formatEpisodeLabel = (entry) => {
  if (entry?.type !== 'series') return null;
  const season = Number(entry?.season);
  const episode = Number(entry?.episode);

  if (!Number.isFinite(season) || !Number.isFinite(episode)) {
    return 'EP';
  }

  return `T${String(season).padStart(2, '0')} E${String(episode).padStart(2, '0')}`;
};

const getProgressPercent = (entry) => {
  const duration = Number(entry?.duration || 0);
  const position = Number(entry?.position || 0);

  if (!Number.isFinite(duration) || duration <= 0 || !Number.isFinite(position) || position <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(100, (position / duration) * 100));
};

const HistoryScreen = () => {
  const [activeTab, setActiveTab] = useState('series');
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedForDeletion, setSelectedForDeletion] = useState(new Set());

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await storageService.getWatchHistory();
      setHistory(Array.isArray(data) ? data : []);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const tabCounts = useMemo(() => {
    const counts = { series: 0, movie: 0, live: 0 };

    for (let i = 0; i < history.length; i++) {
      const itemType = String(history[i]?.type || '').toLowerCase();
      if (counts[itemType] !== undefined) {
        counts[itemType] += 1;
      }
    }

    return counts;
  }, [history]);

  const visibleItems = useMemo(() => {
    return history.filter((item) => String(item?.type || '').toLowerCase() === activeTab);
  }, [history, activeTab]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(visibleItems.length / ITEMS_PER_PAGE));
  }, [visibleItems.length]);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return visibleItems.slice(start, start + ITEMS_PER_PAGE);
  }, [visibleItems, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Reset selection mode when changing tabs
  useEffect(() => {
    setIsSelectionMode(false);
    setSelectedForDeletion(new Set());
  }, [activeTab]);

  const clearTab = useCallback(async (tab) => {
    await storageService.clearWatchHistory([tab]);
    await loadHistory();
  }, [loadHistory]);

  const clearAll = useCallback(async () => {
    await storageService.clearWatchHistory();
    await loadHistory();
  }, [loadHistory]);

  const toggleSelectionMode = useCallback(() => {
    if (isSelectionMode && selectedForDeletion.size === 0) {
      // If in selection mode and nothing selected, exit selection mode
      setIsSelectionMode(false);
    } else if (!isSelectionMode) {
      // Enter selection mode
      setIsSelectionMode(true);
    }
  }, [isSelectionMode, selectedForDeletion.size]);

  const toggleItemSelection = useCallback((key) => {
    setSelectedForDeletion((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  }, []);

  const executeDelete = useCallback(async () => {
    if (selectedForDeletion.size === 0) return;

    const keysToDelete = Array.from(selectedForDeletion);
    const updatedHistory = history.filter((item) => !keysToDelete.includes(item.key));
    
    await storageService.setWatchHistory(updatedHistory);
    
    setSelectedForDeletion(new Set());
    setIsSelectionMode(false);
    await loadHistory();
  }, [selectedForDeletion, history, loadHistory]);

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-600/5 via-zinc-950 to-zinc-950" />
      </div>

      <div className="relative z-10 p-6 space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Histórico</h1>
            <p className="mt-1 text-sm text-zinc-500">Acompanhe o que já foi assistido e retome de onde parou.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => clearTab('series')}
              className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-300 hover:border-red-500 hover:text-white"
            >
              <TrashIcon className="h-3.5 w-3.5" />
              Limpar séries
            </button>
            <button
              onClick={() => clearTab('movie')}
              className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-300 hover:border-red-500 hover:text-white"
            >
              <TrashIcon className="h-3.5 w-3.5" />
              Limpar filmes
            </button>
            <button
              onClick={() => clearTab('live')}
              className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-300 hover:border-red-500 hover:text-white"
            >
              <TrashIcon className="h-3.5 w-3.5" />
              Limpar canais
            </button>
            <button
              onClick={clearAll}
              className="inline-flex items-center gap-1 rounded-lg border border-red-700/60 bg-red-900/20 px-3 py-2 text-xs text-red-200 hover:bg-red-900/35"
            >
              <TrashIcon className="h-3.5 w-3.5" />
              Limpar tudo
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 rounded-xl border border-zinc-800 bg-zinc-900/70 p-2">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-red-600 text-white'
                    : 'text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                <span className={`rounded-full px-1.5 py-0.5 text-[11px] ${isActive ? 'bg-white/20' : 'bg-zinc-800'}`}>
                  {tabCounts[tab.key]}
                </span>
              </button>
            );
          })}

          <button
            onClick={() => {
              if (isSelectionMode && selectedForDeletion.size > 0) {
                executeDelete();
              } else {
                toggleSelectionMode();
              }
            }}
            className={`ml-auto inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-xs transition-colors ${
              isSelectionMode
                ? selectedForDeletion.size > 0
                  ? 'border-red-600 bg-red-600/20 text-red-200 hover:bg-red-600/35'
                  : 'border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-red-500 hover:text-white'
                : 'border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-red-500 hover:text-white'
            }`}
          >
            <TrashIcon className="h-3.5 w-3.5" />
            {isSelectionMode && selectedForDeletion.size > 0
              ? 'Excluir'
              : isSelectionMode
                ? 'Cancelar exclusão'
                : 'Selecionar exclusão'}
          </button>
        </div>

        {isLoading ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-red-600/20 border-t-red-600" />
          </div>
        ) : visibleItems.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-10 text-center">
            <p className="text-zinc-300">Nenhum item nesta aba.</p>
          </div>
        ) : (
          <>
            <div className="mx-auto w-full max-w-[1180px]">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {paginatedItems.map((entry) => {
                  const isLive = entry.type === 'live';
                  const episodeLabel = formatEpisodeLabel(entry);
                  const thumb = entry.thumbnail || '';
                  const progressPercent = getProgressPercent(entry);
                  const isSelected = selectedForDeletion.has(entry.key);

                  return (
                    <button
                      key={entry.key}
                      type="button"
                      onClick={() => {
                        if (isSelectionMode) {
                          toggleItemSelection(entry.key);
                        } else {
                          setSelectedEntry(entry);
                        }
                      }}
                      className={`group w-full overflow-hidden rounded-lg border text-left transition-all duration-200 ${
                        isSelected
                          ? 'border-red-500 bg-red-600/10 hover:-translate-y-0'
                          : 'border-zinc-800 bg-zinc-900/70 hover:-translate-y-0.5 hover:border-red-500/60 hover:shadow-lg hover:shadow-red-500/10'
                      }`}
                    >
                      <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900 text-zinc-400 font-semibold text-xl">
                          {(entry.title || '?').slice(0, 1).toUpperCase()}
                        </div>

                        {thumb ? (
                          <img
                            src={thumb}
                            alt={entry.title}
                            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                            onError={(event) => {
                              event.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : null}

                        <div className="absolute inset-0 z-[2] bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
                        <span
                          className={`absolute right-2 top-2 z-[3] inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                            isSelectionMode
                              ? isSelected
                                ? 'bg-red-600 text-white'
                                : 'bg-black/50 text-zinc-300'
                              : 'bg-black/70 text-white group-hover:bg-red-600'
                          }`}
                          aria-hidden="true"
                        >
                          {isSelectionMode ? (
                            <span className={`h-4 w-4 border-2 rounded ${isSelected ? 'bg-white border-white' : 'border-zinc-400'}`} />
                          ) : (
                            <PlayIcon className="h-3.5 w-3.5" />
                          )}
                        </span>

                        <div className="absolute bottom-1.5 left-1.5 right-1.5 z-[3]">
                          <div className="h-1.5 w-full overflow-hidden rounded bg-zinc-700/80">
                            <div
                              className="h-full rounded bg-red-600"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="px-2.5 pb-2.5 pt-2">
                        <h3 className="line-clamp-2 text-xs font-semibold text-white transition-colors group-hover:text-red-300">{entry.title}</h3>
                        <div className="mt-1.5 flex items-center justify-between text-[11px] text-zinc-400">
                          <span>{episodeLabel || (isLive ? 'Canal ao vivo' : 'Filme')}</span>
                          <span>{formatTime(entry.position || 0)} / {formatTime(entry.duration || 0)}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Página anterior"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </button>

                <span className="min-w-[120px] text-center text-sm text-zinc-300">
                  Página {currentPage} de {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Próxima página"
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <AnimatePresence>
        {selectedEntry && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
          >
            <div className="w-full max-w-6xl px-3">
              <CustomPlayer
                source={selectedEntry.source}
                title={selectedEntry.title}
                type={selectedEntry.type}
                initialPosition={selectedEntry.position || 0}
                metadata={{
                  poster: selectedEntry.thumbnail,
                  backdrop: selectedEntry.thumbnail,
                  title: selectedEntry.title
                }}
                onClose={async () => {
                  setSelectedEntry(null);
                  await loadHistory();
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HistoryScreen;
