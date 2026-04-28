import { useEffect, useCallback, useRef } from 'react';
import { useNavigationStore } from '../../app/store/navigationStore';
import { findNextFocusable } from '../../core/utils/spatialNavigation';

const ARROW_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
const SIDEBAR_GROUP = 'sidebar-menu';
const HERO_GROUPS = new Set(['hero-banner']);
const HERO_BUTTONS_GROUP = 'hero-banner-buttons';
const MEDIA_CARD_GROUP = 'media-cards';
const DIRECTION_MAP = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
};

export const useKeyboardNavigation = () => {
  const {
    focusableElements,
    currentFocusedId,
    setFocusedElement,
    isSidebarOpen,
    toggleSidebar,
  } = useNavigationStore();

  const lastKeyPressTimeRef = useRef(0);
  const keyRepeatDelayRef = useRef(150);

  const getElementById = useCallback((id) => {
    return focusableElements.find((el) => el.id === id) || null;
  }, [focusableElements]);

  const getFirstMediaCard = useCallback(() => {
    const cards = focusableElements
      .filter((el) => el.group === MEDIA_CARD_GROUP && !el.disabled && el.ref)
      .map((el) => ({
        ...el,
        rect: el.ref.getBoundingClientRect(),
      }));

    if (cards.length === 0) return null;

    cards.sort((left, right) => {
      if (left.rect.top !== right.rect.top) return left.rect.top - right.rect.top;
      return left.rect.left - right.rect.left;
    });

    return cards[0];
  }, [focusableElements]);

  const getHeroFocusTarget = useCallback(() => {
    return (
      getElementById('hero-banner') ||
      null
    );
  }, [getElementById]);

  const getHeroPrimaryButton = useCallback(() => {
    return getElementById('hero-banner-play-button') || null;
  }, [getElementById]);

  const scrollHeroIntoView = useCallback(() => {
    const heroContainer = getElementById('hero-banner');
    if (heroContainer?.ref) {
      setTimeout(() => {
        heroContainer.ref.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
          inline: 'nearest',
        });
      }, 0);
    }
  }, [getElementById]);

  const focusElement = useCallback((id, scrollOptions = null) => {
    if (!id) return;

    setFocusedElement(id);
    const element = focusableElements.find((el) => el.id === id);
    if (element?.group === HERO_BUTTONS_GROUP) {
      scrollHeroIntoView();
    }
    if (element?.ref) {
      setTimeout(() => {
        element.ref.scrollIntoView(
          scrollOptions || {
            behavior: 'smooth',
            block: 'nearest',
            inline: 'nearest',
          }
        );
      }, 0);
    }
  }, [focusableElements, scrollHeroIntoView, setFocusedElement]);

  const handleNavigation = useCallback((direction) => {
    if (focusableElements.length === 0) return;

    const currentId = currentFocusedId;

    if (!currentId) {
      const firstElement = focusableElements[0];
      if (firstElement) {
        focusElement(firstElement.id);
      }
      return;
    }

    const currentElement = focusableElements.find((el) => el.id === currentId);
    const currentGroup = currentElement?.group;

    // Se está em um item da sidebar e ela está fechada, abre
    if (currentGroup === SIDEBAR_GROUP && !isSidebarOpen) {
      const now = Date.now();
      if (now - lastKeyPressTimeRef.current >= keyRepeatDelayRef.current) {
        toggleSidebar();
        return;
      }
    }

    if ((direction === 'left' || direction === 'right') && typeof currentElement?.onNavigate === 'function') {
      const handled = currentElement.onNavigate(direction);
      if (handled === true) {
        return;
      }
    }

    if (direction === 'down' && HERO_GROUPS.has(currentGroup)) {
      const heroButton = getHeroPrimaryButton();
      if (heroButton) {
        focusElement(heroButton.id, {
          behavior: 'smooth',
          block: 'nearest',
          inline: 'nearest',
        });
        return;
      }
    }

    if (direction === 'down' && currentGroup === HERO_BUTTONS_GROUP) {
      const firstCard = getFirstMediaCard();
      if (firstCard) {
        focusElement(firstCard.id, {
          behavior: 'smooth',
          block: 'start',
          inline: 'nearest',
        });
        return;
      }
    }

    if (direction === 'up' && currentGroup === HERO_BUTTONS_GROUP) {
      const heroTarget = getHeroFocusTarget();
      if (heroTarget) {
        scrollHeroIntoView();
        focusElement(heroTarget.id);
        return;
      }
    }

    let candidateElements = focusableElements;

    if (currentGroup === SIDEBAR_GROUP) {
      if (direction === 'right') {
        candidateElements = focusableElements.filter(
          (el) => el.id === currentId || el.group !== SIDEBAR_GROUP
        );
      } else {
        candidateElements = focusableElements.filter(
          (el) => el.id === currentId || el.group === SIDEBAR_GROUP
        );
      }
    } else if (direction === 'up' || direction === 'down') {
      candidateElements = focusableElements.filter(
        (el) => el.id === currentId || el.group !== SIDEBAR_GROUP
      );
    }

    const nextElement = findNextFocusable(currentId, candidateElements, direction);
    if (nextElement) {
      focusElement(nextElement.id);
      return;
    }

    if (direction === 'up' && currentGroup === MEDIA_CARD_GROUP) {
      const heroTarget = getHeroFocusTarget();
      if (heroTarget) {
        scrollHeroIntoView();
        focusElement(heroTarget.id);
      }
    }
  }, [focusableElements, currentFocusedId, focusElement, getFirstMediaCard, getHeroFocusTarget, getHeroPrimaryButton, scrollHeroIntoView, isSidebarOpen, toggleSidebar, lastKeyPressTimeRef, keyRepeatDelayRef]);

  const handleKeyDown = useCallback((e) => {
    const activeElement = document.activeElement;
    const isInputElement =
      activeElement?.tagName === 'INPUT' ||
      activeElement?.tagName === 'TEXTAREA' ||
      activeElement?.contentEditable === 'true';

    if (e.key === 'Menu' || (e.ctrlKey && e.key === 'm')) {
      e.preventDefault();
      toggleSidebar();
      return;
    }

    // ESC sai de inputs e volta pro primeiro card
    if (e.key === 'Escape') {
      if (isInputElement) {
        e.preventDefault();
        activeElement?.blur();
        const firstCard = getFirstMediaCard();
        if (firstCard) {
          focusElement(firstCard.id);
        }
        return;
      }
      if (isSidebarOpen) {
        e.preventDefault();
        toggleSidebar();
        return;
      }
    }

    if (isInputElement && ARROW_KEYS.includes(e.key)) {
      return;
    }

    if (ARROW_KEYS.includes(e.key)) {
      e.preventDefault();

      const now = Date.now();
      if (now - lastKeyPressTimeRef.current < keyRepeatDelayRef.current) {
        return;
      }
      lastKeyPressTimeRef.current = now;

      const direction = DIRECTION_MAP[e.key];
      handleNavigation(direction);
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      const focused = focusableElements.find((el) => el.id === currentFocusedId);
      if (focused?.ref) {
        focused.ref.click?.();
        if (focused.onSelect) {
          focused.onSelect();
        }
      }
    }

    if (e.key === ' ') {
      e.preventDefault();
      const focused = focusableElements.find((el) => el.id === currentFocusedId);
      if (focused?.ref) {
        if (focused.onToggle) {
          focused.onToggle();
        } else {
          focused.ref.click?.();
        }
      }
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      const currentIndex = focusableElements.findIndex((el) => el.id === currentFocusedId);
      const nextIndex = e.shiftKey ? currentIndex - 1 : currentIndex + 1;

      if (nextIndex >= 0 && nextIndex < focusableElements.length) {
        focusElement(focusableElements[nextIndex].id);
      } else if (nextIndex >= focusableElements.length) {
        focusElement(focusableElements[0].id);
      }
    }
  }, [
    focusableElements,
    currentFocusedId,
    isSidebarOpen,
    toggleSidebar,
    handleNavigation,
    focusElement,
    getFirstMediaCard,
  ]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return {
    focusElement,
    handleNavigation,
    currentFocusedId,
    isSidebarOpen,
  };
};
