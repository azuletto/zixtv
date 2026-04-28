import { create } from 'zustand';

export const useNavigationStore = create((set, get) => ({
  // Estado
  focusableElements: [],
  currentFocusedId: null,
  isSidebarOpen: true,
  
  // Ações
  registerElement: (id, ref, config = {}) => {
    set((state) => {
      const exists = state.focusableElements.find(el => el.id === id);
      if (exists) {
        const merged = { ...exists, ref, ...config };
        const didChange =
          exists.ref !== merged.ref ||
          exists.group !== merged.group ||
          exists.disabled !== merged.disabled ||
          exists.onSelect !== merged.onSelect ||
          exists.onToggle !== merged.onToggle ||
          exists.onNavigate !== merged.onNavigate;

        if (!didChange) {
          return state;
        }

        return {
          focusableElements: state.focusableElements.map((el) =>
            el.id === id ? merged : el
          ),
        };
      }

      // Adiciona novo elemento
      return {
        focusableElements: [
          ...state.focusableElements,
          { id, ref, disabled: false, group: 'default', ...config },
        ],
      };
    });
  },

  unregisterElement: (id) => {
    set((state) => {
      const exists = state.focusableElements.some((el) => el.id === id);
      if (!exists) {
        return state;
      }

      return {
        focusableElements: state.focusableElements.filter((el) => el.id !== id),
        currentFocusedId: state.currentFocusedId === id ? null : state.currentFocusedId,
      };
    });
  },

  setFocusedElement: (id) => {
    set({ currentFocusedId: id });
  },

  toggleSidebar: () => {
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen }));
  },

  setSidebarOpen: (isOpen) => {
    set({ isSidebarOpen: isOpen });
  },

  // Getters
  getFocusableElements: () => get().focusableElements,
  getCurrentFocusedElement: () => {
    const { focusableElements, currentFocusedId } = get();
    return focusableElements.find(el => el.id === currentFocusedId) || null;
  },

  getFocusedElementRef: () => {
    const focused = get().getCurrentFocusedElement();
    return focused?.ref || null;
  },

  getElementsInGroup: (group) => {
    return get().focusableElements.filter(el => el.group === group);
  },

  // Reset
  reset: () => {
    set({
      focusableElements: [],
      currentFocusedId: null,
      isSidebarOpen: true,
    });
  },
}));
