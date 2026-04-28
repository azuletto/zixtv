
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePlaylistStore } from './store/playlistStore';
import AppRouter from './routes/AppRouter';
import { useKeyboardNavigation } from '../shared/hooks/useKeyboardNavigation';
import KeyboardNavigationDebugger from '../shared/components/KeyboardNavigationDebugger';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

/**
 * Componente que inicializa a navegação por teclado
 */
function KeyboardNavigationInitializer() {
  useKeyboardNavigation();
  return null;
}

function App() {
  const { playlists } = usePlaylistStore();
  const hasPlaylist = playlists && playlists.length > 0;
  const isDevelopment = import.meta.env.DEV;

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <KeyboardNavigationInitializer />
        {}
        <AppRouter />
        {isDevelopment && <KeyboardNavigationDebugger />}
      </Router>
    </QueryClientProvider>
  );
}

export default App;
