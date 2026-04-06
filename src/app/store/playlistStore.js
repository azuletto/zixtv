
import { create } from 'zustand';

export const usePlaylistStore = create((set, get) => ({
  playlists: [],
  activePlaylist: null,
  loading: false,
  error: null,

  setPlaylists: (playlists) => set({ playlists }),
  
  setActivePlaylist: (playlist) => set({ activePlaylist: playlist }),
  
  addPlaylist: (playlist) => 
    set((state) => ({ 
      playlists: [...state.playlists, playlist] 
    })),
  
  updatePlaylist: (id, updates) =>
    set((state) => ({
      playlists: state.playlists.map(p => 
        p.id === id ? { ...p, ...updates } : p
      ),
      activePlaylist: state.activePlaylist?.id === id 
        ? { ...state.activePlaylist, ...updates }
        : state.activePlaylist
    })),
  
  removePlaylist: (id) =>
    set((state) => ({
      playlists: state.playlists.filter(p => p.id !== id),
      activePlaylist: state.activePlaylist?.id === id 
        ? null 
        : state.activePlaylist
    })),
  
  clearPlaylists: () => set({ playlists: [], activePlaylist: null }),
  
  setLoading: (loading) => set({ loading }),
  
  setError: (error) => set({ error })
}));