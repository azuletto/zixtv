
import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { usePlaylist } from '../../shared/hooks/usePlaylist';
import { tmdbService } from '../../core/services/tmdb/TMDBService';
import WelcomeScreen from './components/WelcomeScreen';
import HeroBanner from './components/HeroBanner';
import CategoryRow from './components/CategoryRow';

const EmptyStateScreen = () => (
  <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
    <div className="absolute inset-0">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-600/5 via-zinc-950 to-zinc-950" />
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, rgb(255 255 255 / 0.02) 1px, transparent 0)`,
        backgroundSize: '48px 48px'
      }} />
    </div>
    <div className="relative z-10 text-center">
      <p className="text-zinc-500 mb-2">Nenhum conteúdo em alta encontrado na sua playlist</p>
      <p className="text-zinc-600 text-sm">Adicione mais conteúdo à sua playlist</p>
    </div>
  </div>
);

const HomeSkeleton = ({ sidebarWidth = 0 }) => (
  <div className="min-h-screen bg-zinc-950 w-full overflow-x-hidden">
    <div className="fixed inset-0" style={{ left: sidebarWidth }}>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-600/5 via-zinc-950 to-zinc-950" />
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, rgb(255 255 255 / 0.02) 1px, transparent 0)`,
        backgroundSize: '48px 48px'
      }} />
    </div>

    <div className="relative z-10 w-full animate-pulse">
      <div className="h-[52vh] sm:h-[62vh] md:h-[70vh] lg:h-[80vh] w-full bg-zinc-900/60" />
      <div className="w-full py-6 space-y-8">
        {[1, 2, 3].map((row) => (
          <div key={row} className="w-full mb-8 py-3">
            <div className="flex items-center justify-between mb-4 px-6">
              <div className="h-5 w-40 rounded bg-zinc-800/80" />
              <div className="h-8 w-20 rounded bg-zinc-800/80" />
            </div>
            <div className="flex gap-3 overflow-hidden px-6">
              {[1, 2, 3, 4, 5, 6].map((card) => (
                <div key={card} className="flex-none w-[105px] sm:w-[120px] md:w-[135px] lg:w-[150px]">
                  <div className="rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800">
                    <div className="w-full" style={{ aspectRatio: '2/3' }}>
                      <div className="w-full h-full bg-zinc-800/80" />
                    </div>
                    <div className="p-2 space-y-2">
                      <div className="h-2 w-5/6 rounded bg-zinc-800/80" />
                      <div className="h-2 w-2/3 rounded bg-zinc-800/80" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const extractTMDBIdFromUrl = (url = '') => {
  const raw = String(url || '').trim();
  if (!raw) return null;

  const match = raw.match(/\/([^/]+)\.(?:jpg|jpeg|png|webp)(?:\?.*)?$/i);
  if (match) return match[1];

  const filename = raw.split('/').pop();
  if (!filename) return null;

  const id = filename.replace(/\.(jpg|jpeg|png|webp)$/i, '');
  return id || null;
};

const escapeRegExp = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const stripBracketSegments = (value) => String(value || '').replace(/\[[^\]]*\]/g, ' ');

const normalizeLookupText = (value) => {
  if (!value) return '';
  return value
    .replace(/\[[^\]]*\]/g, ' ')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const TITLE_STOP_WORDS = new Set([
  'a', 'as', 'o', 'os', 'de', 'da', 'do', 'das', 'dos', 'e', 'em', 'na', 'no', 'nas', 'nos',
  'the', 'and', 'of', 'to', 'for', 'part', 'season', 'episode', 'episodio', 'filme', 'filmes',
  'movie', 'movies', 'serie', 'series', 'tv'
]);

const getMeaningfulTokens = (value = '') => {
  const normalized = normalizeLookupText(value);
  if (!normalized) return [];

  return normalized
    .split(' ')
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !TITLE_STOP_WORDS.has(token));
};

const getBestTokenOverlap = (aliasesA = [], aliasesB = []) => {
  let bestOverlap = 0;

  for (const a of aliasesA) {
    const tokensA = getMeaningfulTokens(a);
    if (tokensA.length === 0) continue;

    const tokenSetA = new Set(tokensA);

    for (const b of aliasesB) {
      const tokensB = getMeaningfulTokens(b);
      if (tokensB.length === 0) continue;

      let overlap = 0;
      for (const token of tokensB) {
        if (tokenSetA.has(token)) {
          overlap += 1;
        }
      }

      if (overlap > bestOverlap) {
        bestOverlap = overlap;
      }
    }
  }

  return bestOverlap;
};

const normalizeAliasLoose = (value = '') => getMeaningfulTokens(value).join(' ');

const CONTENT_VARIANT_WORDS = new Set([
  '4k', 'uhd', '1080p', '720p', '480p', '360p', 'hd', 'sd', 'full', 'audio', 'dual', 'dub', 'dublado',
  'legendado', 'leg', 'original', 'pt', 'br', 'brasil', 'nacional', 'bluray', 'blu', 'ray', 'remux', 'webdl', 'webrip', 'hdr'
]);

const QUALITY_ORDER = new Map([
  ['4k', 5],
  ['uhd', 5],
  ['1080p', 4],
  ['720p', 3],
  ['480p', 2],
  ['360p', 1],
  ['hd', 3],
  ['sd', 1]
]);

const normalizeSpotlightKeyText = (value = '') => {
  const normalized = normalizeLookupText(value);
  if (!normalized) return '';

  return normalized
    .split(' ')
    .filter((token) => token && !CONTENT_VARIANT_WORDS.has(token) && !TITLE_STOP_WORDS.has(token))
    .join(' ')
    .trim();
};

const getSpotlightQualityScore = (item = {}) => {
  const quality = normalizeLookupText(item.metadata?.quality || item.quality || '');
  for (const [pattern, score] of QUALITY_ORDER.entries()) {
    if (quality.includes(pattern)) return score;
  }

  const titleTokens = getMeaningfulTokens(item.name || item.title || item.seriesName || '');
  for (const token of titleTokens) {
    if (QUALITY_ORDER.has(token)) return QUALITY_ORDER.get(token);
  }

  return 0;
};

const getHomeSpotlightKey = (item = {}) => {
  if (!item) return '';

  const tmdbId = item.prefetchedTMDBData?.id || item.tmdbData?.id || item.tmdbId || null;
  const type = item.type || item.userType || 'media';

  if (tmdbId) {
    return `tmdb:${type}:${tmdbId}`;
  }

  const baseTitle = normalizeSpotlightKeyText(item.displayTitle || item.title || item.name || item.seriesName || item.metadata?.title || '');
  const year = String(item.year || item.releaseDate || item.metadata?.year || '').trim();
  if (!baseTitle) {
    return `${type}:fallback:${item.id || item.groupTitle || item.group || ''}`;
  }

  return `${type}:${baseTitle}:${year}`;
};

const getHomeSpotlightRank = (item = {}) => {
  let score = 0;

  if (item.prefetchedTMDBData || item.tmdbData) score += 1000;
  if (item.posterUrl || item.backdropUrl) score += 50;
  if (item.overview) score += 20;
  if (Number.isFinite(Number(item.voteAverage))) score += Math.min(20, Math.round(Number(item.voteAverage) * 2));
  score += getSpotlightQualityScore(item) * 10;

  return score;
};

const addBestSpotlightItem = (spotlightMap, item) => {
  if (!item) return;

  const key = getHomeSpotlightKey(item);
  if (!key) return;

  const rank = getHomeSpotlightRank(item);
  const current = spotlightMap.get(key);

  if (!current || rank > current.rank) {
    spotlightMap.set(key, { item, rank });
  }
};

const sortSpotlightEntries = (entries = []) => {
  return [...entries].sort((left, right) => {
    const rightRank = right?.rank || 0;
    const leftRank = left?.rank || 0;
    if (rightRank !== leftRank) return rightRank - leftRank;

    const leftVote = Number(left?.item?.voteAverage || 0);
    const rightVote = Number(right?.item?.voteAverage || 0);
    if (rightVote !== leftVote) return rightVote - leftVote;

    const leftTitle = String(left?.item?.displayTitle || left?.item?.title || left?.item?.name || '');
    const rightTitle = String(right?.item?.displayTitle || right?.item?.title || right?.item?.name || '');
    return leftTitle.localeCompare(rightTitle);
  });
};

const getSpotlightType = (item = {}) => {
  const type = String(item.type || item.userType || '').toLowerCase();
  if (type === 'movie' || type === 'vod') return 'movie';
  if (type === 'series' || type === 'tv') return 'series';
  return 'other';
};

const getHeroCandidateScore = (item = {}) => {
  const hasBackdrop = Boolean(item.backdropUrl || item.backdropPath);
  const hasPoster = Boolean(item.posterUrl || item.posterPath);
  const overviewLength = String(item.overview || '').trim().length;
  const voteAverage = Number(item.voteAverage || 0);
  const popularity = Number(item.popularity || 0);

  let score = 0;
  if (hasBackdrop) score += 100;
  if (hasPoster) score += 25;
  score += Math.min(45, overviewLength / 5);
  score += Math.min(35, voteAverage * 3.5);
  score += Math.min(40, popularity / 5);

  return score;
};

const isStrongHeroCandidate = (item = {}, options = {}) => {
  const relaxed = options.relaxed === true;
  const title = String(item.displayTitle || item.title || item.name || '').trim();
  const hasBackdrop = Boolean(item.backdropUrl || item.backdropPath);
  const hasPoster = Boolean(item.posterUrl || item.posterPath);
  const overviewLength = String(item.overview || '').trim().length;

  if (!title) return false;
  if (!hasBackdrop && !hasPoster) return false;
  if (relaxed) return true;
  return hasBackdrop && overviewLength >= 20;
};

const selectHeroItems = ({ preferred = [], fallback = [], targetCount = 5 }) => {
  const candidateMap = new Map();

  const push = (item) => {
    if (!item) return;
    const key = getHomeSpotlightKey(item);
    if (!key) return;
    if (!isStrongHeroCandidate(item, { relaxed: true })) return;

    const score = getHeroCandidateScore(item) + getHomeSpotlightRank(item);
    const current = candidateMap.get(key);
    if (!current || score > current.score) {
      candidateMap.set(key, { item, score });
    }
  };

  preferred.forEach(push);
  fallback.forEach(push);

  const ranked = Array.from(candidateMap.values())
    .map((entry) => entry.item)
    .sort((a, b) => (getHeroCandidateScore(b) + getHomeSpotlightRank(b)) - (getHeroCandidateScore(a) + getHomeSpotlightRank(a)));

  const strict = ranked.filter((item) => isStrongHeroCandidate(item, { relaxed: false }));
  const source = strict.length >= targetCount ? strict : ranked;
  return mixSpotlightItems({ items: source, targetCount }).slice(0, targetCount);
};

const mixSpotlightItems = ({ items = [], targetCount = 0 }) => {
  const source = Array.isArray(items) ? items.filter(Boolean) : [];
  if (source.length <= 2) return source.slice(0, targetCount || source.length);

  const movies = source.filter((item) => getSpotlightType(item) === 'movie');
  const series = source.filter((item) => getSpotlightType(item) === 'series');
  const others = source.filter((item) => getSpotlightType(item) === 'other');

  const maxItems = targetCount > 0 ? targetCount : source.length;
  const mixed = [];

  const shouldStartWithMovie = movies.length >= series.length;
  let turn = shouldStartWithMovie ? 'movie' : 'series';

  while (mixed.length < maxItems && (movies.length > 0 || series.length > 0)) {
    if (turn === 'movie') {
      if (movies.length > 0) {
        mixed.push(movies.shift());
      } else if (series.length > 0) {
        mixed.push(series.shift());
      }
      turn = 'series';
      continue;
    }

    if (series.length > 0) {
      mixed.push(series.shift());
    } else if (movies.length > 0) {
      mixed.push(movies.shift());
    }
    turn = 'movie';
  }

  while (mixed.length < maxItems && others.length > 0) {
    mixed.push(others.shift());
  }

  while (mixed.length < maxItems && movies.length > 0) {
    mixed.push(movies.shift());
  }

  while (mixed.length < maxItems && series.length > 0) {
    mixed.push(series.shift());
  }

  return mixed.slice(0, maxItems);
};

const extractSearchAliases = (item = {}) => {
  const aliases = [
    item.name,
    item.title,
    item.seriesName,
    item.originalName,
    item.originalTitle,
    item.metadata?.title,
    item.metadata?.name,
    item.metadata?.seriesName,
    item.tvg?.name
  ]
    .map(stripBracketSegments)
    .map(normalizeLookupText)
    .filter(Boolean);

  return Array.from(new Set(aliases));
};

const buildSearchIndex = (items = []) => {
  return items.map((item) => {
    const aliases = extractSearchAliases(item);

    return {
      item,
      aliases,
      tmdbId: item.tmdbImageId || item.tvg?.tmdbImageId || extractTMDBIdFromUrl(item.tvg?.logo || item.logo)
    };
  });
};

const yieldToMainThread = () => new Promise((resolve) => {
  if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
    window.requestAnimationFrame(() => resolve());
    return;
  }
  setTimeout(resolve, 0);
});

const HOME_INDEX_BATCH_SIZE = 150;
const HOME_MAX_INDEX_ITEMS = 5000;
const HOME_SPOTLIGHT_CACHE_TTL = 10 * 60 * 1000;
const homeSpotlightCache = new Map();

const createSearchIndexEntry = (item) => ({
  item,
  aliases: extractSearchAliases(item),
  tmdbId: item.tmdbImageId || item.tvg?.tmdbImageId || extractTMDBIdFromUrl(item.tvg?.logo || item.logo)
});

const interleaveIndexes = (moviesIndex = [], seriesIndex = []) => {
  const merged = [];
  const maxLength = Math.max(moviesIndex.length, seriesIndex.length);

  for (let index = 0; index < maxLength; index++) {
    if (moviesIndex[index]) merged.push(moviesIndex[index]);
    if (seriesIndex[index]) merged.push(seriesIndex[index]);
  }

  return merged;
};

const extractTMDBAliases = (item = {}) => {
  return Array.from(new Set([
    item.title,
    item.name,
    item.original_title,
    item.original_name,
    item.displayTitle
  ]
    .map(normalizeLookupText)
    .filter(Boolean)));
};

const normalizePlaylistType = (value = '') => {
  const type = String(value || '').toLowerCase();
  if (type === 'movie' || type === 'vod') return 'movie';
  if (type === 'series' || type === 'tv') return 'series';
  return 'other';
};

const normalizeTmdbType = (value = '') => {
  const type = String(value || '').toLowerCase();
  if (type === 'movie') return 'movie';
  if (type === 'tv' || type === 'series') return 'series';
  return 'other';
};

const scoreIndexMatch = (tmdbItem, indexedItem) => {
  if (!tmdbItem || !indexedItem) return 0;

  const tmdbAliases = extractTMDBAliases(tmdbItem);
  if (tmdbAliases.length === 0) return 0;

  if (tmdbItem.posterId || tmdbItem.posterUrl) {
    const posterId = tmdbItem.posterId || extractTMDBIdFromUrl(tmdbItem.posterUrl);
    if (posterId && indexedItem.tmdbId && posterId === indexedItem.tmdbId) {
      return 100;
    }
  }

  if (tmdbAliases.some((alias) => indexedItem.aliases.includes(alias))) {
    return 95;
  }

  const looseAliasMatch = tmdbAliases.some((alias) => {
    const looseAlias = normalizeAliasLoose(alias);
    if (!looseAlias) return false;
    return indexedItem.aliases.some((candidate) => normalizeAliasLoose(candidate) === looseAlias);
  });

  if (looseAliasMatch) {
    return 94;
  }

  const overlap = getBestTokenOverlap(tmdbAliases, indexedItem.aliases);
  if (overlap >= 3) {
    return 92;
  }
  if (overlap >= 2) {
    return 88;
  }

  // Evita matches genéricos curtos como "o filme" ou termos soltos.
  const hasStrongContainsMatch = tmdbAliases.some((alias) => {
    if (alias.length < 10) return false;
    return indexedItem.aliases.some((candidate) => {
      if (candidate.length < 10) return false;
      const contains = candidate.includes(alias) || alias.includes(candidate);
      if (!contains) return false;
      return getBestTokenOverlap([alias], [candidate]) >= 2;
    });
  });

  if (hasStrongContainsMatch) {
    return 86;
  }

  return 0;
};

const buildResolvedHomeItem = (playlistItem, tmdbItem = null) => {
  if (!playlistItem) return null;

  const title = tmdbItem?.title || tmdbItem?.name || playlistItem.name || playlistItem.title || playlistItem.seriesName || '';
  const posterUrl = playlistItem.tvg?.logo || playlistItem.logo || tmdbItem?.posterUrl || null;
  const backdropUrl = tmdbItem?.backdropUrl || tmdbItem?.posterUrl || playlistItem.tvg?.logo || playlistItem.logo || null;

  return {
    ...playlistItem,
    name: title,
    title,
    posterUrl,
    backdropUrl,
    voteAverage: tmdbItem?.voteAverage ?? playlistItem.voteAverage,
    overview:
      tmdbItem?.overview ||
      playlistItem.overview ||
      playlistItem.description ||
      playlistItem.plot ||
      playlistItem.metadata?.overview ||
      playlistItem.metadata?.description ||
      playlistItem.metadata?.plot ||
      '',
    year: tmdbItem?.year || playlistItem.year,
    prefetchedTMDBData: tmdbItem,
    tmdbData: tmdbItem,
    source: tmdbItem ? 'tmdb-match' : 'playlist-fallback'
  };
};

const getPlaylistItemTmdbImageId = (item = {}) => {
  const posterUrl = item.tvg?.logo || item.logo || item.posterUrl || item.backdropUrl || '';
  return extractTMDBIdFromUrl(posterUrl);
};

const resolvePlaylistMatch = (tmdbItem, indexedItem) => {
  if (!tmdbItem || !indexedItem) return 0;

  const tmdbType = normalizeTmdbType(tmdbItem.type);
  const playlistType = normalizePlaylistType(indexedItem.item?.type);
  if (tmdbType !== 'other' && playlistType !== 'other' && tmdbType !== playlistType) {
    return 0;
  }

  const tmdbAliases = extractTMDBAliases(tmdbItem);
  if (tmdbAliases.length === 0) return 0;

  const tmdbPosterId = tmdbItem.posterId || extractTMDBIdFromUrl(tmdbItem.posterUrl || tmdbItem.poster_path || tmdbItem.posterPath || '');
  const playlistPosterId = indexedItem.tmdbId || getPlaylistItemTmdbImageId(indexedItem.item);

  if (tmdbPosterId && playlistPosterId && tmdbPosterId === playlistPosterId) {
    return 100;
  }

  if (tmdbItem.backdropUrl) {
    const backdropId = extractTMDBIdFromUrl(tmdbItem.backdropUrl);
    if (backdropId && playlistPosterId && backdropId === playlistPosterId) {
      return 99;
    }
  }

  if (tmdbAliases.some((alias) => indexedItem.aliases.includes(alias))) {
    return 96;
  }

  const looseAliasMatch = tmdbAliases.some((alias) => {
    const looseAlias = normalizeAliasLoose(alias);
    if (!looseAlias) return false;
    return indexedItem.aliases.some((candidate) => normalizeAliasLoose(candidate) === looseAlias);
  });

  if (looseAliasMatch) return 94;

  const overlap = getBestTokenOverlap(tmdbAliases, indexedItem.aliases);
  if (overlap >= 3) return 92;
  if (overlap >= 2) return 88;

  const containsStrong = tmdbAliases.some((alias) => {
    if (alias.length < 10) return false;
    return indexedItem.aliases.some((candidate) => {
      if (candidate.length < 10) return false;
      return candidate.includes(alias) || alias.includes(candidate);
    });
  });

  return containsStrong ? 86 : 0;
};

const resolveTmdbItemsWithPlaylist = ({ tmdbItems = [], indexes = [], minScore = 92 }) => {
  const resolved = [];
  const usedIds = new Set();

  for (const tmdbItem of tmdbItems) {
    let bestMatch = null;
    let bestScore = 0;

    for (const indexedItem of indexes) {
      if (usedIds.has(indexedItem.item.id)) continue;

      const score = resolvePlaylistMatch(tmdbItem, indexedItem);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = indexedItem;
      }
    }

    if (bestMatch && bestScore >= minScore) {
      usedIds.add(bestMatch.item.id);
      resolved.push(buildResolvedHomeItem({ ...bestMatch.item, __matchScore: bestScore }, tmdbItem));
    }
  }

  return resolved;
};

const fillSpotlightItems = ({ resolvedItems = [], targetCount = 0, excludeKeys = new Set(), preferTypes = [] }) => {
  const spotlightMap = new Map();

  const pushItem = (item) => {
    if (!item) return;
    const key = getHomeSpotlightKey(item);
    if (!key || excludeKeys.has(key)) return;
    addBestSpotlightItem(spotlightMap, item);
  };

  for (const item of Array.isArray(resolvedItems) ? resolvedItems : []) {
    const normalizedType = getSpotlightType(item);
    if (preferTypes.length > 0) {
      const allow = preferTypes.includes(normalizedType) || (normalizedType === 'series' && preferTypes.includes('tv'));
      if (!allow) continue;
    }
    pushItem(item);
  }

  const ranked = sortSpotlightEntries(Array.from(spotlightMap.values()))
    .map((entry) => entry.item)
    .slice(0, Math.max(targetCount * 3, targetCount));

  const normalizedPrefers = (preferTypes || []).map((type) => normalizePlaylistType(type));
  const shouldBalanceMovieSeries = normalizedPrefers.includes('movie') && normalizedPrefers.includes('series');
  if (!shouldBalanceMovieSeries) {
    return mixSpotlightItems({ items: ranked, targetCount });
  }

  const movies = ranked.filter((item) => getSpotlightType(item) === 'movie');
  const series = ranked.filter((item) => getSpotlightType(item) === 'series');
  const others = ranked.filter((item) => getSpotlightType(item) === 'other');

  const wantedMoviesBase = Math.ceil(targetCount / 2);
  const wantedSeriesBase = Math.floor(targetCount / 2);

  let wantedMovies = Math.min(wantedMoviesBase, movies.length);
  let wantedSeries = Math.min(wantedSeriesBase, series.length);

  const remainingSlots = targetCount - (wantedMovies + wantedSeries);
  if (remainingSlots > 0) {
    const extraMovies = Math.min(remainingSlots, Math.max(0, movies.length - wantedMovies));
    wantedMovies += extraMovies;
  }

  const remainingAfterMovies = targetCount - (wantedMovies + wantedSeries);
  if (remainingAfterMovies > 0) {
    const extraSeries = Math.min(remainingAfterMovies, Math.max(0, series.length - wantedSeries));
    wantedSeries += extraSeries;
  }

  const balancedPool = [
    ...movies.slice(0, wantedMovies),
    ...series.slice(0, wantedSeries)
  ];

  const mixedBalanced = mixSpotlightItems({ items: balancedPool, targetCount });
  if (mixedBalanced.length >= targetCount || others.length === 0) {
    return mixedBalanced.slice(0, targetCount);
  }

  return [...mixedBalanced, ...others].slice(0, targetCount);
};

const HomeScreen = ({ sidebarWidth = 0, isSidebarCollapsed = false }) => {
  const navigate = useNavigate();
  const { 
    activePlaylist,
    playlists, 
    isLoading: playlistLoading, 
    isHydrated: playlistHydrated,
    getLiveChannels,
    getMovies,
    getSeries
  } = usePlaylist();
  
  const [matchedTrending, setMatchedTrending] = useState([]);
  const [heroTrending, setHeroTrending] = useState([]);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [isBuildingIndex, setIsBuildingIndex] = useState(false);
  const [searchIndexes, setSearchIndexes] = useState({
    moviesIndex: [],
    seriesIndex: [],
    allIndex: [],
    ready: false
  });
  
  const playlistsArray = Array.isArray(playlists) ? playlists : [];
  const hasPlaylist = playlistsArray.length > 0 || Boolean(activePlaylist);
  const activePlaylistId = activePlaylist?.id || 'no-playlist';

  const liveChannels = getLiveChannels();
  const visibleLiveChannels = liveChannels;
  const userMovies = getMovies();
  const userSeries = getSeries();
  const spotlightCacheKey = `${activePlaylistId}|m:${userMovies.length}|s:${userSeries.length}`;

  useEffect(() => {
    let isCancelled = false;

    const buildIndexes = async () => {
      if (!hasPlaylist) {
        setSearchIndexes({ moviesIndex: [], seriesIndex: [], allIndex: [], ready: true });
        setIsBuildingIndex(false);
        return;
      }

      setIsBuildingIndex(true);
      setSearchIndexes((current) => ({ ...current, ready: false }));

      let movieLimit = 0;
      let seriesLimit = 0;

      if (userMovies.length > 0 && userSeries.length > 0) {
        const halfLimit = Math.floor(HOME_MAX_INDEX_ITEMS / 2);
        movieLimit = Math.min(userMovies.length, halfLimit);
        seriesLimit = Math.min(userSeries.length, halfLimit);

        let remainingSlots = HOME_MAX_INDEX_ITEMS - movieLimit - seriesLimit;
        if (remainingSlots > 0) {
          const extraMovies = Math.min(remainingSlots, Math.max(0, userMovies.length - movieLimit));
          movieLimit += extraMovies;
          remainingSlots -= extraMovies;

          if (remainingSlots > 0) {
            const extraSeries = Math.min(remainingSlots, Math.max(0, userSeries.length - seriesLimit));
            seriesLimit += extraSeries;
          }
        }
      } else {
        movieLimit = Math.min(userMovies.length, HOME_MAX_INDEX_ITEMS);
        const remainingSlots = Math.max(0, HOME_MAX_INDEX_ITEMS - movieLimit);
        seriesLimit = Math.min(userSeries.length, remainingSlots);
      }

      const moviesSource = userMovies.slice(0, movieLimit);
      const seriesSource = userSeries.slice(0, seriesLimit);

      const moviesIndex = [];
      for (let start = 0; start < moviesSource.length; start += HOME_INDEX_BATCH_SIZE) {
        if (isCancelled) return;

        const end = Math.min(start + HOME_INDEX_BATCH_SIZE, moviesSource.length);
        for (let index = start; index < end; index++) {
          moviesIndex.push(createSearchIndexEntry(moviesSource[index]));
        }

        await yieldToMainThread();
      }

      const seriesIndex = [];
      for (let start = 0; start < seriesSource.length; start += HOME_INDEX_BATCH_SIZE) {
        if (isCancelled) return;

        const end = Math.min(start + HOME_INDEX_BATCH_SIZE, seriesSource.length);
        for (let index = start; index < end; index++) {
          seriesIndex.push(createSearchIndexEntry(seriesSource[index]));
        }

        await yieldToMainThread();
      }

      if (isCancelled) return;

      setSearchIndexes({
        moviesIndex,
        seriesIndex,
        allIndex: interleaveIndexes(moviesIndex, seriesIndex),
        ready: true
      });
      setIsBuildingIndex(false);
    };

    buildIndexes().catch(() => {
      if (isCancelled) return;
      setSearchIndexes({ moviesIndex: [], seriesIndex: [], allIndex: [], ready: true });
      setIsBuildingIndex(false);
    });

    return () => {
      isCancelled = true;
    };
  }, [hasPlaylist, activePlaylistId, userMovies.length, userSeries.length]);

  
  useEffect(() => {
    let isCancelled = false;

    const initializeData = async () => {
      if (playlistLoading || isBuildingIndex || !searchIndexes.ready) return;
      
      if (!hasPlaylist) {
        setIsInitialLoading(false);
        return;
      }

      const cached = homeSpotlightCache.get(spotlightCacheKey);
      if (cached && (Date.now() - cached.timestamp) < HOME_SPOTLIGHT_CACHE_TTL) {
        if (!isCancelled) {
          setHeroTrending(cached.heroItems || []);
          setMatchedTrending(cached.trendingItems || []);
          setIsInitialLoading(false);
        }
        return;
      }

      setIsInitialLoading(true);
      
      try {
        const [weekPage1, weekPage2, apiHeroItems] = await Promise.all([
          tmdbService.getTrending('week', 1),
          tmdbService.getTrending('week', 2),
          tmdbService.getHeroContent().catch(() => [])
        ]);

        const weeklyMap = new Map();
        [...(weekPage1 || []), ...(weekPage2 || [])].forEach((item) => {
          if (!item?.id) return;
          const type = normalizeTmdbType(item.type);
          if (type === 'other') return;
          const key = `${type}:${item.id}`;
          if (!weeklyMap.has(key)) {
            weeklyMap.set(key, item);
          }
        });

        const weeklyList = Array.from(weeklyMap.values());
        const weeklyMovies = weeklyList.filter((item) => normalizeTmdbType(item.type) === 'movie');
        const weeklySeries = weeklyList.filter((item) => normalizeTmdbType(item.type) === 'series');

        const movieMatches = resolveTmdbItemsWithPlaylist({
          tmdbItems: weeklyMovies.slice(0, 80),
          indexes: searchIndexes.moviesIndex,
          minScore: 92
        });

        const seriesMatches = resolveTmdbItemsWithPlaylist({
          tmdbItems: weeklySeries.slice(0, 80),
          indexes: searchIndexes.seriesIndex,
          minScore: 88
        });

        const weeklyMatches = mixSpotlightItems({
          items: [...movieMatches, ...seriesMatches],
          targetCount: Math.max(movieMatches.length + seriesMatches.length, 40)
        });

        const heroFromMatches = fillSpotlightItems({
          resolvedItems: weeklyMatches,
          targetCount: 5,
          preferTypes: ['movie', 'series']
        });

        const heroFallbackPool = Array.isArray(apiHeroItems)
          ? apiHeroItems.filter((item) => normalizeTmdbType(item?.type) !== 'other')
          : [];

        const weeklyFallbackPool = weeklyList.filter((item) => normalizeTmdbType(item?.type) !== 'other');

        const heroItems = selectHeroItems({
          preferred: heroFromMatches,
          fallback: [...heroFallbackPool, ...weeklyFallbackPool],
          targetCount: 5
        });

        const heroKeys = new Set(heroItems.map((item) => getHomeSpotlightKey(item)).filter(Boolean));

        const matchedCandidates = mixSpotlightItems({
          items: [...weeklyMatches, ...weeklyFallbackPool],
          targetCount: 80
        });

        const matched = fillSpotlightItems({
          resolvedItems: matchedCandidates,
          targetCount: 15,
          excludeKeys: heroKeys,
          preferTypes: ['movie', 'series']
        });

        if (!isCancelled) {
          setHeroTrending(heroItems);
          setMatchedTrending(matched);
          homeSpotlightCache.set(spotlightCacheKey, {
            heroItems,
            trendingItems: matched,
            timestamp: Date.now()
          });
        }
        
      } catch (error) {
        if (!isCancelled) {
          setMatchedTrending([]);
          setHeroTrending([]);
        }
      } finally {
        if (!isCancelled) {
          setIsInitialLoading(false);
        }
      }
    };
    
    initializeData();

    return () => {
      isCancelled = true;
    };
  }, [playlistLoading, hasPlaylist, isBuildingIndex, searchIndexes.ready, searchIndexes.allIndex.length, activePlaylistId, spotlightCacheKey]);

  
  const liveByGroup = useMemo(() => {
    const groups = new Map();
    visibleLiveChannels.forEach(channel => {
      const group = channel.groupTitle || channel.originalGroup || 'Geral';
      if (!groups.has(group)) {
        groups.set(group, []);
      }
      groups.get(group).push(channel);
    });
    return Array.from(groups.entries())
      .map(([name, items]) => ({ name, items: items.slice(0, 20) }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [visibleLiveChannels]);

  
  const heroItems = useMemo(() => {
    return heroTrending.slice(0, 5);
  }, [heroTrending]);

  const trendingForDisplay = matchedTrending;

  const movieCategories = useMemo(() => {
    return Array.from(new Set(
      userMovies
        .map((item) => item.groupTitle || item.group || item.originalGroup || 'Sem categoria')
    )).sort((a, b) => a.localeCompare(b));
  }, [userMovies]);

  const seriesCategories = useMemo(() => {
    return Array.from(new Set(
      userSeries
        .map((item) => item.groupTitle || item.group || item.originalGroup || 'Sem categoria')
    )).sort((a, b) => a.localeCompare(b));
  }, [userSeries]);

  
  if (!playlistHydrated || playlistLoading || isBuildingIndex || (isInitialLoading && hasPlaylist)) {
    return <HomeSkeleton sidebarWidth={sidebarWidth} />;
  }
  
  if (!hasPlaylist) {
    return <WelcomeScreen />;
  }
  
  const hasContent = trendingForDisplay.length > 0 || visibleLiveChannels.length > 0 || userMovies.length > 0 || userSeries.length > 0;
  
  if (!hasContent) {
    return <EmptyStateScreen />;
  }

  const handleHomeCardSelect = (item, rowType) => {
    if (!item) return;

    const prefetchedTMDBData = item.prefetchedTMDBData || item.tmdbData || null;
    const isSeriesType = item.type === 'series' || item.type === 'tv';

    const openMovie = () => {
      navigate('/movies', { state: { autoPlayItem: item, startInCinema: false, prefetchedTMDBData } });
    };

    const openSeries = () => {
      navigate('/series', { state: { openSeries: item } });
    };

    const openLive = () => {
      navigate('/live', { state: { autoPlayChannel: item } });
    };

    if (rowType === 'movies') {
      openMovie();
      return;
    }

    if (rowType === 'series') {
      openSeries();
      return;
    }

    if (rowType === 'live') {
      openLive();
      return;
    }

    if (rowType === 'tmdb') {
      if (item.type === 'movie') {
        openMovie();
        return;
      }

      if (isSeriesType) {
        openSeries();
        return;
      }

      if (item.type === 'live') {
        openLive();
        return;
      }

      if (item.userItem && item.userType === 'movie') {
        navigate('/movies', { state: { autoPlayItem: item.userItem, startInCinema: false, prefetchedTMDBData } });
        return;
      }

      if (item.userItem && item.userType === 'series') {
        navigate('/series', { state: { openSeries: item.userItem } });
        return;
      }

      if (item.userItem && item.userType === 'live') {
        navigate('/live', { state: { autoPlayChannel: item.userItem } });
      }
    }
  };

  const handleHeroPlay = (heroItem) => {
    if (!heroItem) return;
    const isSeriesType = heroItem.type === 'series' || heroItem.type === 'tv';

    if (heroItem.type === 'movie') {
      navigate('/movies', { state: { autoPlayItem: heroItem, startInCinema: false, prefetchedTMDBData: heroItem.prefetchedTMDBData || null } });
      return;
    }

    if (isSeriesType) {
      navigate('/series', { state: { openSeries: heroItem } });
      return;
    }

    if (heroItem.type === 'live') {
      navigate('/live', { state: { autoPlayChannel: heroItem } });
      return;
    }

    if (heroItem.userItem && heroItem.userType === 'movie') {
      navigate('/movies', { state: { autoPlayItem: heroItem.userItem, startInCinema: false, prefetchedTMDBData: heroItem.prefetchedTMDBData || null } });
      return;
    }

    if (heroItem.userItem && heroItem.userType === 'series') {
      navigate('/series', { state: { openSeries: heroItem.userItem } });
      return;
    }

    if (heroItem.userItem && heroItem.userType === 'live') {
      navigate('/live', { state: { autoPlayChannel: heroItem.userItem } });
    }
  };

  const handleHeroMoreInfo = (heroItem) => {
    if (!heroItem) return;
    const isSeriesType = heroItem.type === 'series' || heroItem.type === 'tv';

    if (heroItem.type === 'movie') {
      navigate('/movies', { state: { autoPlayItem: heroItem, startInCinema: true, prefetchedTMDBData: heroItem.prefetchedTMDBData || null } });
      return;
    }

    if (isSeriesType) {
      navigate('/series', { state: { openSeries: heroItem } });
      return;
    }

    if (heroItem.type === 'live') {
      navigate('/live', { state: { autoPlayChannel: heroItem } });
      return;
    }

    if (heroItem.userItem && heroItem.userType === 'movie') {
      navigate('/movies', { state: { autoPlayItem: heroItem.userItem, startInCinema: true, prefetchedTMDBData: heroItem.prefetchedTMDBData || null } });
      return;
    }

    if (heroItem.userItem && heroItem.userType === 'series') {
      navigate('/series', { state: { openSeries: heroItem.userItem } });
      return;
    }

    if (heroItem.userItem && heroItem.userType === 'live') {
      navigate('/live', { state: { autoPlayChannel: heroItem.userItem } });
    }
  };

  
  return (
    <div className="min-h-screen bg-zinc-950 w-full overflow-x-hidden">
      <div className="fixed inset-0" style={{ left: sidebarWidth }}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-600/5 via-zinc-950 to-zinc-950" />
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgb(255 255 255 / 0.02) 1px, transparent 0)`,
          backgroundSize: '48px 48px'
        }} />
      </div>

      <div className="relative z-10 w-full">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <HeroBanner
            items={heroItems}
            onPlay={handleHeroPlay}
            onMoreInfo={handleHeroMoreInfo}
          />
        </motion.div>
        
        <div className="w-full py-6 space-y-8">
          {}
          {trendingForDisplay.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.08 }}>
              <CategoryRow 
                title="Em Alta"
                type="tmdb"
                items={trendingForDisplay.slice(0, 20)}
                viewAllPath="/trending"
                showViewAll={false}
                onItemSelect={handleHomeCardSelect}
              />
            </motion.div>
          )}
          
          {}
          {userMovies.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.12 }}>
              <CategoryRow 
                title="Filmes"
                type="movies"
                items={userMovies}
                categories={movieCategories}
                viewAllPath="/movies"
                onItemSelect={handleHomeCardSelect}
              />
            </motion.div>
          )}
          
          {}
          {userSeries.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.16 }}>
              <CategoryRow 
                title="Séries"
                type="series"
                items={userSeries}
                categories={seriesCategories}
                viewAllPath="/series"
                onItemSelect={handleHomeCardSelect}
              />
            </motion.div>
          )}
          
          {}
          {liveByGroup.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
              <CategoryRow 
                title="Canais Ao Vivo"
                type="live"
                items={visibleLiveChannels.slice(0, 100)}
                categories={liveByGroup.map(g => g.name)}
                viewAllPath="/live"
                onItemSelect={handleHomeCardSelect}
              />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;
