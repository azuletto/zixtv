import { useEffect, useCallback, useRef } from 'react';
import { useNavigationStore } from '../../app/store/navigationStore';

/**
 * Hook especializado para navegação em grade (grid) de items
 * Útil para cards em categorias que podem estar em múltiplas linhas
 */
export const useGridNavigation = (items, columns = 5) => {
  const { currentFocusedId, setFocusedElement } = useNavigationStore();
  const gridRef = useRef(null);

  const findNextItemInGrid = useCallback((currentId, direction) => {
    if (items.length === 0) return null;

    const currentIndex = items.findIndex(item => item?.id === currentId);
    if (currentIndex === -1) return items[0]?.id || null;

    let nextIndex = currentIndex;

    switch (direction) {
      case 'right':
        nextIndex = currentIndex + 1;
        if (nextIndex >= items.length) nextIndex = currentIndex; // não passa do fim
        break;
      case 'left':
        nextIndex = currentIndex - 1;
        if (nextIndex < 0) nextIndex = currentIndex; // não passa do início
        break;
      case 'down':
        nextIndex = currentIndex + columns;
        if (nextIndex >= items.length) {
          // Se passou, volta para a última linha
          nextIndex = items.length - 1;
        }
        break;
      case 'up':
        nextIndex = currentIndex - columns;
        if (nextIndex < 0) {
          // Se passou para cima, fica no começo
          nextIndex = 0;
        }
        break;
      default:
        return null;
    }

    return items[nextIndex]?.id || null;
  }, [items, columns]);

  const focusItemInGrid = useCallback((itemId) => {
    setFocusedElement(itemId);
  }, [setFocusedElement]);

  return {
    gridRef,
    findNextItemInGrid,
    focusItemInGrid,
    currentFocusedId,
  };
};
