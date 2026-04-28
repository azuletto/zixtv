import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook para gerenciar navegação por teclado em dropdowns
 * @param {Object} ref - Ref do container do dropdown
 * @param {boolean} isOpen - Se o dropdown está aberto
 * @param {Function} setIsOpen - Função para abrir/fechar
 * @param {Array} items - Items do dropdown
 * @param {Function} onSelect - Callback quando item é selecionado
 */
export const useDropdownKeyboard = (ref, isOpen, setIsOpen, items = [], onSelect) => {
  const selectedIndexRef = useRef(0);

  const handleKeyDown = useCallback((e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
        selectedIndexRef.current = 0;
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        selectedIndexRef.current = (selectedIndexRef.current + 1) % items.length;
        break;
      case 'ArrowUp':
        e.preventDefault();
        selectedIndexRef.current = (selectedIndexRef.current - 1 + items.length) % items.length;
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (items[selectedIndexRef.current]) {
          onSelect?.(items[selectedIndexRef.current]);
          setIsOpen(false);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
      default:
        break;
    }
  }, [isOpen, setIsOpen, items, onSelect]);

  useEffect(() => {
    const element = ref?.current;
    if (!element) return;

    element.addEventListener('keydown', handleKeyDown);
    return () => element.removeEventListener('keydown', handleKeyDown);
  }, [ref, handleKeyDown]);

  return selectedIndexRef;
};
