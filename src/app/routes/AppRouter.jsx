import React, { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { usePlaylist } from '../../shared/hooks/usePlaylist';
import LoadingSpinner from '../../shared/components/Loaders/Spinner';
import Sidebar from '../../shared/components/Sidebar/Sidebar';

import HomeScreen from '../../modules/home/HomeScreen';
import AboutScreen from '../../modules/about/AboutScreen';
import InMaintenance from '../../modules/maintenance/InMaintenanceScreen';

const MoviesScreen = lazy(() => import('../../modules/movies/MoviesScreen'));
const SeriesScreen = lazy(() => import('../../modules/series/SeriesScreen'));
const LiveScreen = lazy(() => import('../../modules/live/LiveScreen'));
const HistoryScreen = lazy(() => import('../../modules/history/HistoryScreen'));
const SettingsScreen = lazy(() => import('../../modules/settings/SettingsScreen'));

const RouterBootLoader = () => (
  <div className="min-h-screen bg-zinc-950 w-full overflow-hidden">
    <div className="absolute inset-0">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-600/5 via-zinc-950 to-zinc-950" />
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgb(255 255 255 / 0.02) 1px, transparent 0)`,
          backgroundSize: '48px 48px'
        }}
      />
    </div>
    <div className="relative z-10 min-h-screen flex items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  </div>
);

const AppRouter = () => {
  const { playlists, activePlaylist, isLoading, isFetching, isHydrated } = usePlaylist();
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const sidebarWidthRef = useRef(256);
  const sidebarRef = useRef(null);
  const resizeObserverRef = useRef(null);
  const rafRef = useRef(null);
  
  const viteMaintenanceFlag =
    typeof import.meta !== 'undefined'
      ? (
          import.meta.env?.VITE_MAINTENANCE_MODE ??
          import.meta.env?.MAINTENANCE_MODE ??
          import.meta.env?.REACT_APP_MAINTENANCE_MODE
        )
      : undefined;
  const legacyMaintenanceFlag =
    typeof process !== 'undefined' ? process.env?.REACT_APP_MAINTENANCE_MODE : undefined;
  const isMaintenanceMode = String(viteMaintenanceFlag ?? legacyMaintenanceFlag ?? '').toLowerCase() === 'true';
  
  const playlistsArray = Array.isArray(playlists) ? playlists : [];
  const hasPlaylist = playlistsArray.length > 0 || Boolean(activePlaylist);
  
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

  if (isMaintenanceMode) {
    return (
      <Routes>
        <Route
          path="/maintenance"
          element={<InMaintenance sidebarWidth={sidebarWidth} isSidebarCollapsed={isSidebarCollapsed} />}
        />
        <Route path="*" element={<Navigate to="/maintenance" replace />} />
      </Routes>
    );
  }

  return (
    <div className="flex min-h-screen bg-zinc-950">
      {hasPlaylist && <Sidebar />}
      
      <main 
        className={`flex-1 ${hasPlaylist ? 'transition-all duration-300' : ''}`}
        style={{ 
          marginLeft: hasPlaylist ? `${sidebarWidth}px` : 0,
          width: hasPlaylist ? `calc(100% - ${sidebarWidth}px)` : '100%'
        }}
      >
        <Suspense fallback={
          <div className="flex items-center justify-center h-screen">
            <LoadingSpinner size="lg" />
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
            <Route path="/history" element={<HistoryScreen />} />
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