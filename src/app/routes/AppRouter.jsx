
import React, { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { usePlaylist } from '../../shared/hooks/usePlaylist';
import LoadingSpinner from '../../shared/components/Loaders/Spinner';
import Sidebar from '../../shared/components/Sidebar/Sidebar';

import HomeScreen from '../../modules/home/HomeScreen';
import AboutScreen from '../../modules/about/AboutScreen';

const MoviesScreen = lazy(() => import('../../modules/movies/MoviesScreen'));
const SeriesScreen = lazy(() => import('../../modules/series/SeriesScreen'));
const LiveScreen = lazy(() => import('../../modules/live/LiveScreen'));
const SettingsScreen = lazy(() => import('../../modules/settings/SettingsScreen'));

const AppRouter = () => {
  const { playlists, isLoading, isFetching } = usePlaylist();
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const sidebarWidthRef = useRef(256);
  const sidebarRef = useRef(null);
  const resizeObserverRef = useRef(null);
  const rafRef = useRef(null);
  
  const playlistsArray = Array.isArray(playlists) ? playlists : [];
  const hasPlaylist = playlistsArray.length > 0;

  const applySidebarWidth = useCallback((width) => {
    if (!Number.isFinite(width) || width <= 0) return;
    if (width === sidebarWidthRef.current) return;

    sidebarWidthRef.current = width;
    setSidebarWidth(width);
    setIsSidebarCollapsed(width <= 72);
  }, []);

  const scheduleSidebarMeasure = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const sidebar = sidebarRef.current || document.querySelector('aside');
      if (!sidebar) return;
      applySidebarWidth(sidebar.offsetWidth);
    });
  }, [applySidebarWidth]);

  
  useEffect(() => {
    if (!hasPlaylist) {
      sidebarRef.current = null;
      return;
    }

    const sidebar = document.querySelector('aside');
    sidebarRef.current = sidebar;

    if (sidebar) {
      applySidebarWidth(sidebar.offsetWidth);

      if ('ResizeObserver' in window) {
        resizeObserverRef.current = new ResizeObserver(() => {
          scheduleSidebarMeasure();
        });
        resizeObserverRef.current.observe(sidebar);
      }
    }

    window.addEventListener('resize', scheduleSidebarMeasure);

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      window.removeEventListener('resize', scheduleSidebarMeasure);
    };
  }, [hasPlaylist, applySidebarWidth, scheduleSidebarMeasure]);

  return (
    <div className="flex min-h-screen bg-zinc-950">
      {hasPlaylist && <Sidebar />}
      
      <main 
        className="flex-1 transition-all duration-300"
        style={{ 
          marginLeft: hasPlaylist ? `${sidebarWidth}px` : 0,
          width: hasPlaylist ? `calc(100% - ${sidebarWidth}px)` : '100%'
        }}
      >
        <Suspense fallback={
          <div className="flex items-center justify-center h-screen">
            <LoadingSpinner size="large" />
          </div>
        }>
          <Routes>
            <Route 
              path="/" 
              element={
                <HomeScreen 
                  sidebarWidth={sidebarWidth} 
                  isSidebarCollapsed={isSidebarCollapsed}
                />
              } 
            />
            <Route path="/movies" element={<MoviesScreen />} />
            <Route path="/series" element={<SeriesScreen />} />
            <Route path="/live" element={<LiveScreen />} />
            <Route path="/trending" element={<HomeScreen sidebarWidth={sidebarWidth} isSidebarCollapsed={isSidebarCollapsed} />} />
            <Route path="/settings" element={<SettingsScreen />} />
            <Route path="/about" element={<AboutScreen />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
};

export default AppRouter;