
import { create } from 'zustand';

export const useUIStore = create((set) => ({
  sidebarOpen: true,
  theme: 'dark',
  searchQuery: '',
  filters: {
    genre: null,
    year: null,
    rating: null
  },
  notifications: [],
  modals: {
    addPlaylist: false,
    settings: false,
    about: false,
    player: false,
    'series-details': false,
    details: false
  },
  modalData: null,

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  
  setTheme: (theme) => set({ theme }),
  
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  
  setFilters: (filters) => set((state) => ({ 
    filters: { ...state.filters, ...filters } 
  })),
  
  clearFilters: () => set({ 
    filters: { genre: null, year: null, rating: null } 
  }),
  
  addNotification: (notification) => 
    set((state) => ({ 
      notifications: [...state.notifications, { 
        ...notification, 
        id: Date.now(),
        read: false 
      }] 
    })),
  
  markNotificationAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map(n =>
        n.id === id ? { ...n, read: true } : n
      )
    })),
  
  clearNotifications: () => set({ notifications: [] }),
  
  openModal: (modal, data = null) => 
    set((state) => ({ 
      modals: { ...state.modals, [modal]: true },
      modalData: data
    })),
  
  closeModal: (modal) => 
    set((state) => ({ 
      modals: { ...state.modals, [modal]: false },
      modalData: null
    })),
  
  toggleModal: (modal) =>
    set((state) => ({ 
      modals: { ...state.modals, [modal]: !state.modals[modal] } 
    })),
    
  getModalData: () => set((state) => state.modalData)
}));

export default useUIStore;