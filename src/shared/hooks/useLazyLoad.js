
import { useState, useEffect, useRef, useCallback } from 'react';

export const useLazyLoad = (items, itemsPerPage = 20) => {
  const [visibleItems, setVisibleItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const observerRef = useRef(null);
  const lastItemRef = useRef(null);

  useEffect(() => {
    
    setVisibleItems([]);
    setPage(1);
    setHasMore(true);
  }, [items]);

  useEffect(() => {
    if (!hasMore || loading) return;
    
    const loadMore = () => {
      setLoading(true);
      
      
      setTimeout(() => {
        const start = (page - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const newItems = items.slice(start, end);
        
        if (newItems.length > 0) {
          setVisibleItems(prev => [...prev, ...newItems]);
          setPage(prev => prev + 1);
        }
        
        if (end >= items.length) {
          setHasMore(false);
        }
        
        setLoading(false);
      }, 100);
    };
    
    loadMore();
  }, [page, items, hasMore, loading, itemsPerPage]);

  const lastItemCallback = useCallback((node) => {
    if (loading) return;
    
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prev => prev + 1);
      }
    });
    
    if (node) {
      observerRef.current.observe(node);
    }
    
    lastItemRef.current = node;
  }, [loading, hasMore]);

  return { visibleItems, hasMore, loading, lastItemCallback };
};