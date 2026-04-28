/**
 * Configurações do Sistema de Navegação por Teclado
 * 
 * Customize aqui as configurações de navegação para sua aplicação
 */

export const KEYBOARD_NAV_CONFIG = {
  // Temporizações
  timing: {
    // Atraso mínimo entre navegações repetidas (ms)
    keyRepeatDelay: 150,
    // Tempo de auto-scroll após foco (ms)
    autoScrollDelay: 50,
  },

  // Temas de foco
  focusStyles: {
    // Cor primária para elementos focados
    primaryColor: '#ef4444', // red-600
    // Cor secundária (hover)
    secondaryColor: '#dc2626', // red-700
    // Tamanho da borda (px)
    borderWidth: 2,
    // Raio da borda (px)
    borderRadius: 8,
    // Blur do glow (px)
    glowBlur: 20,
  },

  // Grupos de navegação padrão
  groups: {
    SIDEBAR_MENU: 'sidebar-menu',
    HERO_BANNER: 'hero-banner',
    HERO_BANNER_DOTS: 'hero-banner-dots',
    MEDIA_CARDS: 'media-cards',
    MODAL_BUTTONS: 'modal-buttons',
    LIST_ITEMS: 'list-items',
    DEFAULT: 'default',
  },

  // Teclas customizáveis
  keys: {
    // Navegar
    ARROW_UP: 'ArrowUp',
    ARROW_DOWN: 'ArrowDown',
    ARROW_LEFT: 'ArrowLeft',
    ARROW_RIGHT: 'ArrowRight',

    // Ações
    ENTER: 'Enter',
    SPACE: ' ',
    TAB: 'Tab',

    // Especiais
    ESCAPE: 'Escape',
    MENU: 'Menu',
    TOGGLE_KEYBOARD_NAV: 'KeyM', // Ctrl+M

    // Debug
    TOGGLE_DEBUG: 'KeyD', // Ctrl+D
  },

  // Comportamentos
  behavior: {
    // Auto-scroll quando navegando
    enableAutoScroll: true,
    // Aceitar navegação durante digitação em inputs
    allowNavigationInInputs: false,
    // Fecha sidebar ao navegar para conteúdo
    closeSidebarOnNavigate: false,
    // Memorizar última posição focada por rota
    rememberFocusPosition: true,
    // Primeira navegação foca no primeiro elemento
    autoFocusFirst: true,
  },

  // Animações
  animations: {
    // Habilitar animações de foco
    enabled: true,
    // Duração das animações (ms)
    duration: 150,
    // Tipo de easing
    easing: 'ease-out',
  },

  // Debug
  debug: {
    // Ativar logs no console
    logs: false,
    // Mostrar debugger por padrão
    showDebugger: false,
    // Logar cada navegação
    logNavigation: false,
    // Logar registro/remover elementos
    logElements: false,
  },

  // Acessibilidade
  accessibility: {
    // Anunciar mudanças via aria-live
    useAriaLive: true,
    // Prefixo para anúncios
    announcePrefix: 'Navegação por teclado',
    // Usar focus-visible apenas
    respectPrefersReducedMotion: true,
  },
};

/**
 * Combina configurações customizadas com as padrões
 */
export const mergeConfig = (customConfig) => {
  return {
    ...KEYBOARD_NAV_CONFIG,
    timing: { ...KEYBOARD_NAV_CONFIG.timing, ...customConfig?.timing },
    focusStyles: { ...KEYBOARD_NAV_CONFIG.focusStyles, ...customConfig?.focusStyles },
    groups: { ...KEYBOARD_NAV_CONFIG.groups, ...customConfig?.groups },
    keys: { ...KEYBOARD_NAV_CONFIG.keys, ...customConfig?.keys },
    behavior: { ...KEYBOARD_NAV_CONFIG.behavior, ...customConfig?.behavior },
    animations: { ...KEYBOARD_NAV_CONFIG.animations, ...customConfig?.animations },
    debug: { ...KEYBOARD_NAV_CONFIG.debug, ...customConfig?.debug },
    accessibility: { ...KEYBOARD_NAV_CONFIG.accessibility, ...customConfig?.accessibility },
  };
};

/**
 * Configuração ativa (pode ser alterada em runtime)
 */
export let activeConfig = KEYBOARD_NAV_CONFIG;

/**
 * Atualiza a configuração ativa
 */
export const updateConfig = (newConfig) => {
  activeConfig = mergeConfig(newConfig);
};

/**
 * Reseta para configuração padrão
 */
export const resetConfig = () => {
  activeConfig = KEYBOARD_NAV_CONFIG;
};
