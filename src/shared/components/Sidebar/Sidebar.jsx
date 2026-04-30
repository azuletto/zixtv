
import React, { useState, useCallback, useMemo, useTransition, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import { usePlaylist } from '../../hooks/usePlaylist';
import { useFocusable } from '../../hooks/useFocusable';
import { useNavigationStore } from '../../../app/store/navigationStore';

import { 
  HomeIcon, 
  CogIcon,
  HeartIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  PlusCircleIcon,
  FilmIcon,
  CollectionIcon,
  LightningBoltIcon,
  HistoryIcon,
  GlobeAltIcon,
  FolderIcon,
  MenuIcon
} from '/src/shared/icons/heroiconsOutlineCompat';

import { 
  HomeIcon as HomeSolidIcon,
  CogIcon as CogSolidIcon,
  FilmIcon as FilmSolidIcon,
  CollectionIcon as CollectionSolidIcon,
  LightningBoltIcon as LightningBoltSolidIcon
} from '/src/shared/icons/heroiconsSolidCompat';

import AddPlaylistModal from '../Modal/AddPlaylistModal';
import logoZixTV from '../../../assets/logo-zix-tv.png';

// Extract PlaylistItem outside PlaylistDropdown to avoid re-creating component on every render
const PlaylistItemButton = React.memo(({ playlist, index, selectedPlaylist, onSelect, setIsOpen, itemRefs }) => {
  const itemId = `sidebar-playlist-item-${playlist.id}`;
  const { ref, isFocused } = useFocusable(itemId, {
    group: 'sidebar-menu',
    onSelect: () => {
      onSelect(playlist);
      setIsOpen(false);
    },
  });

  const setRef = useCallback((el) => {
    try {
      ref.current = el;
    } catch (err) {
      // ignore
    }
    itemRefs.current[index] = el;
  }, [index, ref, itemRefs]);

  return (
    <button
      ref={setRef}
      onClick={() => {
        onSelect(playlist);
        setIsOpen(false);
      }}
      className={`w-full flex items-center gap-2 px-3 py-2.5 transition-colors ${
        isFocused
          ? 'bg-red-600/30 text-red-400 border-l-2 border-red-500'
          : (selectedPlaylist?.id === playlist.id)
            ? 'bg-zinc-800 text-red-400'
            : 'text-gray-300 hover:bg-zinc-800 hover:text-white'
      }`}
    >
      <div className="p-1 rounded-md bg-zinc-800 text-gray-400">
        <FolderIcon className="w-4 h-4" />
      </div>
      <span className="flex-1 text-left text-sm truncate">{playlist.name}</span>
      {selectedPlaylist?.id === playlist.id && (
        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
      )}
    </button>
  );
});

PlaylistItemButton.displayName = 'PlaylistItemButton';

const PlaylistDropdown = ({ playlists, selectedPlaylist, onSelect, isCollapsed }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(
    playlists.findIndex(p => p.id === selectedPlaylist?.id) || 0
  );
  const dropdownRef = useRef(null);
  const menuRef = useRef(null);
  const itemRefs = useRef([]);

  const { ref: dropdownToggleRef, isFocused: isDropdownFocused } = useFocusable('sidebar-playlist-dropdown', {
    group: 'sidebar-menu',
    onSelect: () => setIsOpen((prev) => !prev),
  });

  // Register each playlist item as focusable so keyboard Enter can activate selection
  const { setFocusedElement } = useNavigationStore();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      // focus first (or previously selected) item for keyboard activation
      const target = itemRefs.current[selectedIndex] || itemRefs.current[0];
      if (target) {
        setTimeout(() => {
          target.focus();
          setFocusedElement(`sidebar-playlist-item-${playlists[selectedIndex]?.id || playlists[0]?.id}`);
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 50);
      }
    }
  }, [isOpen, selectedIndex, setFocusedElement, playlists]);

  // Handle keyboard navigation when dropdown is open (global listener)
  useEffect(() => {
    if (!isOpen) return;

    const handleDropdownKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(false);
        return;
      }

      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        onSelect(playlists[selectedIndex]);
        setIsOpen(false);
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        setSelectedIndex((prev) => (prev + 1) % playlists.length);
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        setSelectedIndex((prev) => (prev - 1 + playlists.length) % playlists.length);
        return;
      }
    };

    document.addEventListener('keydown', handleDropdownKeyDown, true);
    return () => document.removeEventListener('keydown', handleDropdownKeyDown, true);
  }, [isOpen, playlists, selectedIndex, onSelect]);

  const getPlaylistIcon = () => {
    return <FolderIcon className="w-4 h-4" />;
  };

  if (isCollapsed) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          ref={dropdownToggleRef}
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-center rounded-lg border transition-all duration-200 p-2 ${
            isDropdownFocused
              ? 'border-red-500 bg-zinc-800/90 shadow-lg shadow-red-500/10'
              : 'border-transparent hover:border-red-500 hover:bg-zinc-800/90 hover:shadow-lg hover:shadow-red-500/10'
          }`}
        >
          <div className="p-1 rounded-md bg-red-600/20 text-red-500">
            <FolderIcon className="w-5 h-5" />
          </div>
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, x: -10, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute left-full top-0 z-50 ml-2 min-w-[200px] overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/95 shadow-xl backdrop-blur-sm"
            >
              <div className="max-h-80 overflow-y-auto">
                {playlists.map((playlist, index) => (
                  <PlaylistItemButton
                    key={playlist.id}
                    playlist={playlist}
                    index={index}
                    selectedPlaylist={selectedPlaylist}
                    onSelect={onSelect}
                    setIsOpen={setIsOpen}
                    itemRefs={itemRefs}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={dropdownToggleRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2 rounded-lg border px-3 py-2 transition-all duration-200 group ${
          isDropdownFocused
            ? 'border-red-500 bg-zinc-800/90 shadow-lg shadow-red-500/10'
            : 'border-zinc-800 bg-zinc-900 hover:border-red-500 hover:bg-zinc-800/90 hover:shadow-lg hover:shadow-red-500/10'
        }`}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="p-1 rounded-md bg-red-600/20 text-red-500">
            <FolderIcon className="w-4 h-4" />
          </div>
          <span className="text-sm text-white truncate">
            {selectedPlaylist?.name || 'Selecione uma playlist'}
          </span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDownIcon className="w-3.5 h-3.5 text-gray-400 group-hover:text-red-500 transition-colors" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 z-50 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/95 shadow-xl backdrop-blur-sm"
          >
            <div className="max-h-80 overflow-y-auto">
              {playlists.map((playlist, index) => (
                <PlaylistItemButton
                  key={playlist.id}
                  playlist={playlist}
                  index={index}
                  selectedPlaylist={selectedPlaylist}
                  onSelect={onSelect}
                  setIsOpen={setIsOpen}
                  itemRefs={itemRefs}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FocusableNavItem = ({ itemId, to, className, children }) => {
  const { ref, isFocused } = useFocusable(itemId, {
    group: 'sidebar-menu',
    onSelect: () => {
      // trigger native nav click when activated via keyboard
      try {
        ref.current?.click?.();
      } catch (err) {
        // ignore
      }
    },
  });

  return (
    <NavLink
      ref={ref}
      to={to}
      className={({ isActive }) => {
        const baseClass = typeof className === 'function' ? className({ isActive }) : className;
        if (isActive) {
          return `${baseClass} border-red-500 bg-red-600 text-white scale-[1.02] shadow-xl shadow-red-500/20`;
        }
        if (isFocused) {
          // Remove hover: prefixes and apply classes directly for keyboard focus
          const focusedClass = baseClass
            .replace(/hover:border-red-500/g, 'border-red-500')
            .replace(/hover:bg-zinc-800\/90/g, 'bg-zinc-800/90')
            .replace(/hover:text-white/g, 'text-white')
            .replace(/hover:scale-\[1\.02\]/g, 'scale-[1.02]')
            .replace(/hover:shadow-lg/g, 'shadow-lg')
            .replace(/hover:shadow-red-500\/10/g, 'shadow-red-500/10');
          return focusedClass;
        }
        return baseClass;
      }}
    >
      {children}
    </NavLink>
  );
};

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [donatePulseKey, setDonatePulseKey] = useState(0);
  const [isPending, startTransition] = useTransition();
  const { playlists, activePlaylist, selectPlaylist } = usePlaylist();
  const { isSidebarOpen, setSidebarOpen } = useNavigationStore();

  useEffect(() => {
    setDonatePulseKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    setIsCollapsed(!isSidebarOpen);
  }, [isSidebarOpen]);

  const menuItems = useMemo(() => [
    { label: 'Início', path: '/', icon: HomeIcon, solidIcon: HomeSolidIcon },
    { label: 'Ao Vivo', path: '/live', icon: LightningBoltIcon, solidIcon: LightningBoltSolidIcon },
    { label: 'Filmes', path: '/movies', icon: FilmIcon, solidIcon: FilmSolidIcon },
    { label: 'Séries', path: '/series', icon: CollectionIcon, solidIcon: CollectionSolidIcon },
    { label: 'Histórico', path: '/history', icon: HistoryIcon, solidIcon: HistoryIcon },
  ], []);

  const bottomItems = useMemo(() => [
    {
      label: 'Doar',
      to: { pathname: '/about', hash: '#doacao' },
      icon: HeartIcon,
      solidIcon: HeartIcon,
      highlight: true
    },
    { label: 'Configurações', to: '/settings', icon: CogIcon, solidIcon: CogSolidIcon },
  ], []);

  const handleAddPlaylist = useCallback(() => setShowAddModal(true), []);
  
  const { ref: toggleButtonRef, isFocused: isToggleFocused } = useFocusable('sidebar-toggle-button', {
    group: 'sidebar-menu',
    onSelect: () => {
      setDonatePulseKey((prev) => prev + 1);
      const nextCollapsed = !isCollapsed;
      setIsCollapsed(nextCollapsed);
      setSidebarOpen(!nextCollapsed);
    },
  });

  const handleToggleCollapse = useCallback(() => {
    setDonatePulseKey((prev) => prev + 1);
    const nextCollapsed = !isCollapsed;
    setIsCollapsed(nextCollapsed);
    setSidebarOpen(!nextCollapsed);
  }, [isCollapsed, setSidebarOpen]);

  const handlePlaylistSelect = useCallback((playlist) => {
    if (playlist && playlist.id !== activePlaylist?.id) {
      startTransition(() => {
        selectPlaylist(playlist);
      });
    }
  }, [activePlaylist, selectPlaylist]);

  return (
    <>
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 72 : 256 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="h-screen bg-zinc-950 text-white fixed left-0 top-0 z-20 border-r border-zinc-800 flex flex-col"
      >
        {}
        <div className="h-16 flex items-center px-4 border-b border-zinc-800">
          {!isCollapsed ? (
            
            <>
              <button
                ref={toggleButtonRef}
                onClick={handleToggleCollapse}
                className={`p-2 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 mr-3 ${
                  isToggleFocused
                    ? 'text-white bg-zinc-800'
                    : 'text-gray-400 hover:text-white hover:bg-zinc-800'
                }`}
                title="Recolher menu"
                aria-label="Recolher menu"
              >
                <MenuIcon className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-2">
                <img src={logoZixTV} alt="ZixTV" className="w-8 h-8" />
                <span className="text-lg font-semibold text-white">ZixTV</span>
              </div>
            </>
          ) : (
            
            <>
              <button
                ref={toggleButtonRef}
                onClick={handleToggleCollapse}
                className={`w-full flex justify-center p-2 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 ${
                  isToggleFocused
                    ? 'text-white bg-zinc-800'
                    : 'text-gray-400 hover:text-white hover:bg-zinc-800'
                }`}
                title="Expandir menu"
                aria-label="Expandir menu"
              >
                <MenuIcon className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {}
        {playlists?.length > 0 && (
          <div className="px-3 py-4 border-b border-zinc-800">
            {!isCollapsed && (
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Playlist Ativa</p>
            )}
            <PlaylistDropdown
              playlists={playlists}
              selectedPlaylist={activePlaylist}
              onSelect={handlePlaylistSelect}
              isCollapsed={isCollapsed}
            />
          </div>
        )}

        {}
        <nav className="flex-1 py-4 overflow-y-auto">
          <div className="px-3 space-y-1">
            {menuItems.map((item) => (
              <FocusableNavItem
                key={item.path}
                itemId={`sidebar-item-${item.path}`}
                to={item.path}
                className={({ isActive }) => `
                  flex items-center px-3 py-2 rounded-lg border border-transparent transition-all duration-200
                  ${isActive 
                    ? 'border-red-500 bg-red-600 text-white scale-[1.02] shadow-xl shadow-red-500/20' 
                    : 'text-zinc-400 hover:border-red-500 hover:bg-zinc-800/90 hover:text-white hover:scale-[1.02] hover:shadow-lg hover:shadow-red-500/10'
                  }
                  ${isCollapsed ? 'justify-center' : ''}
                `}
              >
                {({ isActive }) => (
                  <>
                    {isActive ? (
                      <item.solidIcon className="w-5 h-5" />
                    ) : (
                      <item.icon className="w-5 h-5" />
                    )}
                    {!isCollapsed && <span className="ml-3 text-sm">{item.label}</span>}
                  </>
                )}
              </FocusableNavItem>
            ))}
          </div>
        </nav>

        {}
        <div className="px-3 py-4 border-t border-zinc-800">
          <button
            onClick={handleAddPlaylist}
            className={`
              w-full flex items-center px-3 py-2 rounded-lg border border-transparent transition-all duration-200
              text-red-400 hover:border-red-500 hover:bg-zinc-800/90 hover:text-white hover:scale-[1.02] hover:shadow-lg hover:shadow-red-500/10
              ${isCollapsed ? 'justify-center' : ''}
              focus:outline-none focus:ring-2 focus:ring-red-500
            `}
          >
            <PlusCircleIcon className="w-5 h-5" />
            {!isCollapsed && <span className="ml-3 text-sm">Adicionar Playlist</span>}
          </button>
        </div>

        {}
        <div className="px-3 py-4 border-t border-zinc-800">
          {bottomItems.map((item) => (
            <FocusableNavItem
              key={typeof item.to === 'string' ? item.to : `${item.to.pathname}${item.to.hash || ''}`}
              itemId={`sidebar-item-${typeof item.to === 'string' ? item.to : `${item.to.pathname}${item.to.hash || ''}`}`}
              to={item.to}
              className={({ isActive }) => `
                relative flex items-center px-3 py-2 rounded-lg border border-transparent transition-all duration-200 overflow-visible
                ${isActive 
                  ? 'border-red-500 bg-red-600 text-white scale-[1.02] shadow-xl shadow-red-500/20' 
                  : 'text-zinc-400 hover:border-red-500 hover:bg-zinc-800/90 hover:text-white hover:scale-[1.02] hover:shadow-lg hover:shadow-red-500/10'
                }
                ${isCollapsed ? 'justify-center' : ''}
              `}
            >
              {({ isActive }) => (
                <>
                  {item.highlight && (
                    <motion.span
                      key={`donate-pulse-${donatePulseKey}`}
                      aria-hidden="true"
                      initial={{ opacity: 0, scale: 1 }}
                      animate={{
                        opacity: [0, 0.7, 0],
                        scale: [1, 1.02, 1.06]
                      }}
                      transition={{
                        duration: 0.78,
                        times: [0, 0.45, 1],
                        ease: 'easeInOut',
                        repeat: 2,
                        repeatType: 'loop',
                        repeatDelay: 0.3
                      }}
                      className="absolute -inset-1 rounded-lg border border-red-500/35 pointer-events-none"
                      style={{ boxShadow: '0 0 0 1px rgba(255, 48, 64, 0.14), 0 0 10px rgba(255, 48, 64, 0.2)' }}
                    />
                  )}
                  {isActive ? (
                    <item.solidIcon className="w-5 h-5" />
                  ) : (
                    <item.icon className="w-5 h-5" />
                  )}
                  {!isCollapsed && <span className="ml-3 text-sm">{item.label}</span>}
                </>
              )}
            </FocusableNavItem>
          ))}
        </div>
      </motion.aside>

      <AnimatePresence>
        {showAddModal && (
          <AddPlaylistModal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
