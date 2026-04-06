
import { useState, useMemo } from 'react';

const normalizeText = (text) => {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') 
    .replace(/\s+/g, ' '); 
};

const capitalizeWords = (text) => {
  if (!text) return '';
  return text
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export const usePaginatedContent = (items, itemsPerPage = 48) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');

  const indexedItems = useMemo(() => {
    return items.map((item) => {
      const rawCategory = item.categoryDisplay || item.groupTitle || item.metadata?.genre || item.category || '';
      return {
        item,
        searchName: normalizeText(item.name || item.title || ''),
        categoryRaw: rawCategory,
        categoryNormalized: normalizeText(rawCategory),
        categoryDisplay: rawCategory ? capitalizeWords(rawCategory) : 'Outros'
      };
    });
  }, [items]);

  
  const categories = useMemo(() => {
    const categoryMap = new Map(); 

    indexedItems.forEach(({ categoryRaw, categoryNormalized, categoryDisplay }) => {
      if (categoryRaw && !categoryMap.has(categoryNormalized)) {
        categoryMap.set(categoryNormalized, {
          original: categoryRaw,
          display: categoryDisplay,
          normalized: categoryNormalized
        });
      }
    });

    
    return ['all', ...Array.from(categoryMap.values())
      .sort((a, b) => a.normalized.localeCompare(b.normalized))
      .map(cat => cat.display)];
  }, [indexedItems]);

  const filteredIndexedItems = useMemo(() => {
    let filtered = indexedItems;

    if (searchQuery) {
      const searchNormalized = normalizeText(searchQuery);
      filtered = filtered.filter(({ searchName }) => searchName.includes(searchNormalized));
    }

    if (filter !== 'all') {
      const filterNormalized = normalizeText(filter);
      filtered = filtered.filter(({ categoryNormalized }) => categoryNormalized === filterNormalized);
    }

    return filtered;
  }, [indexedItems, searchQuery, filter]);

  const filteredItems = useMemo(
    () => filteredIndexedItems.map(({ item }) => item),
    [filteredIndexedItems]
  );

  
  const groupedByCategory = useMemo(() => {
    const groups = new Map();

    filteredIndexedItems.forEach(({ item, categoryNormalized, categoryDisplay }) => {
      const normalized = categoryNormalized || 'outros';
      const displayName = categoryDisplay || 'Outros';

      if (!groups.has(normalized)) {
        groups.set(normalized, {
          name: displayName,
          items: []
        });
      }
      groups.get(normalized).items.push(item);
    });

    return Array.from(groups.values())
      .filter((group) => Array.isArray(group.items) && group.items.length > 0)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredIndexedItems]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage, itemsPerPage]);

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const nextPage = () => goToPage(currentPage + 1);
  const prevPage = () => goToPage(currentPage - 1);

  return {
    items: paginatedItems,
    groupedItems: groupedByCategory,
    categories: categories,
    totalItems: filteredItems.length,
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
    isLoading: false
  };
};