import { useEffect, useRef, useCallback } from 'react';
import { useNavigationStore } from '../../app/store/navigationStore';

/**
 * Hook para registrar um elemento como focável
 * @param {string} id - Identificador único do elemento
 * @param {Object} config - Configuração do elemento
 * @param {string} config.group - Grupo do elemento (default: 'default')
 * @param {Function} config.onSelect - Callback quando Enter é pressionado
 * @param {Function} config.onToggle - Callback quando Space é pressionado
 * @param {boolean} config.disabled - Se o elemento é focável
 */
export const useFocusable = (id, config = {}) => {
  const ref = useRef(null);
  const onSelectRef = useRef(config.onSelect);
  const onToggleRef = useRef(config.onToggle);
  const onNavigateRef = useRef(config.onNavigate);

  const {
    group = 'default',
    disabled = false,
  } = config;

  useEffect(() => {
    onSelectRef.current = config.onSelect;
    onToggleRef.current = config.onToggle;
    onNavigateRef.current = config.onNavigate;
  }, [config.onSelect, config.onToggle, config.onNavigate]);

  const stableOnSelect = useCallback(() => {
    onSelectRef.current?.();
  }, []);

  const stableOnToggle = useCallback(() => {
    onToggleRef.current?.();
  }, []);

  const stableOnNavigate = useCallback((direction) => {
    return onNavigateRef.current?.(direction);
  }, []);

  // Use getState for functions to avoid subscribing and changing identity on each render
  const registerElement = useNavigationStore.getState().registerElement;
  const unregisterElement = useNavigationStore.getState().unregisterElement;
  const setFocusedElement = useNavigationStore.getState().setFocusedElement;
  // Subscribe reactively only to the focused id
  const currentFocusedId = useNavigationStore((s) => s.currentFocusedId);

  const isFocused = currentFocusedId === id;

  // Registra o elemento ao montar
  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;

    if (!element.hasAttribute('tabindex')) {
      element.setAttribute('tabindex', '-1');
    }

    registerElement(id, element, {
      group,
      disabled,
      onSelect: stableOnSelect,
      onToggle: stableOnToggle,
      onNavigate: stableOnNavigate,
    });

    return () => {
      unregisterElement(id);
    };
  }, [id, group, disabled, stableOnSelect, stableOnToggle, stableOnNavigate]);

  // Efeitos visuais quando focado
  useEffect(() => {
    if (isFocused && ref.current) {
      // Remove qualquer classe de hover anterior
      ref.current.classList.remove('hover-effect');
      // Adiciona a classe de foco
      ref.current.classList.add('focused-element');
      // Scroll para o elemento
      ref.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest',
      });
    } else if (ref.current) {
      // Remove a classe de foco
      ref.current.classList.remove('focused-element');
      // Adiciona classe para hover de mouse (opcional)
      ref.current.classList.add('hover-effect');
    }
  }, [isFocused]);

  // Função para colocar foco via programação
  const requestFocus = useCallback(() => {
    setFocusedElement(id);
  }, [id, setFocusedElement]);

  return {
    ref,
    isFocused,
    requestFocus,
  };
};
