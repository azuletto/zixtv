
import React, { useState, useCallback, useMemo, useTransition, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import { usePlaylist } from '../../hooks/usePlaylist';

import { 
  HomeIcon, 
  CogIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  PlusCircleIcon,
  FilmIcon,
  CollectionIcon,
  LightningBoltIcon,
  PlayIcon,
  GlobeAltIcon,
  FolderIcon,
  MenuIcon
} from '@heroicons/react/outline';

import { 
  HomeIcon as HomeSolidIcon,
  CogIcon as CogSolidIcon,
  FilmIcon as FilmSolidIcon,
  CollectionIcon as CollectionSolidIcon,
  LightningBoltIcon as LightningBoltSolidIcon
} from '@heroicons/react/solid';

import AddPlaylistModal from '../Modal/AddPlaylistModal';
import logoZixTV from '../../../assets/logo-zix-tv.png';

const PlaylistDropdown = ({ playlists, selectedPlaylist, onSelect, isCollapsed }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const selectedItemRef = useRef(null);
  const menuRef = useRef(null);

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
    if (isOpen && selectedItemRef.current && menuRef.current) {
      setTimeout(() => {
        selectedItemRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }, 50);
    }
  }, [isOpen]);

  const getPlaylistIcon = () => {
    return <FolderIcon className="w-4 h-4" />;
  };

  if (isCollapsed) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-zinc-800 transition-colors"
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
              className="absolute left-full top-0 ml-2 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl overflow-hidden z-50 min-w-[200px]"
            >
              <div className="max-h-80 overflow-y-auto">
                {playlists.map(playlist => {
                  const isSelected = selectedPlaylist?.id === playlist.id;
                  return (
                    <button
                      key={playlist.id}
                      ref={isSelected ? selectedItemRef : null}
                      onClick={() => {
                        onSelect(playlist);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2.5 transition-colors ${
                        isSelected
                          ? 'bg-red-600/20 text-red-500'
                          : 'hover:bg-zinc-800 text-gray-300'
                      }`}
                    >
                      <div className="p-1 rounded-md bg-zinc-800 text-gray-400">
                        <FolderIcon className="w-4 h-4" />
                      </div>
                      <span className="flex-1 text-left text-sm truncate">{playlist.name}</span>
                      {isSelected && (
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      )}
                    </button>
                  );
                })}
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
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 transition-all duration-200 group"
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
            className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl overflow-hidden z-50"
          >
            <div className="max-h-80 overflow-y-auto">
              {playlists.map(playlist => {
                const isSelected = selectedPlaylist?.id === playlist.id;
                return (
                  <button
                    key={playlist.id}
                    ref={isSelected ? selectedItemRef : null}
                    onClick={() => {
                      onSelect(playlist);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 transition-colors ${
                      isSelected
                        ? 'bg-red-600/20 text-red-500'
                        : 'hover:bg-zinc-800 text-gray-300'
                    }`}
                  >
                    <div className="p-1 rounded-md bg-zinc-800 text-gray-400">
                      <FolderIcon className="w-4 h-4" />
                    </div>
                    <span className="flex-1 text-left text-sm truncate">{playlist.name}</span>
                    {isSelected && (
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { playlists, activePlaylist, selectPlaylist } = usePlaylist();

  const menuItems = useMemo(() => [
    { label: 'Início', path: '/', icon: HomeIcon, solidIcon: HomeSolidIcon },
    { label: 'Ao Vivo', path: '/live', icon: LightningBoltIcon, solidIcon: LightningBoltSolidIcon },
    { label: 'Filmes', path: '/movies', icon: FilmIcon, solidIcon: FilmSolidIcon },
    { label: 'Séries', path: '/series', icon: CollectionIcon, solidIcon: CollectionSolidIcon },
  ], []);

  const bottomItems = useMemo(() => [
    { label: 'Configurações', path: '/settings', icon: CogIcon, solidIcon: CogSolidIcon },
  ], []);

  const handleAddPlaylist = useCallback(() => setShowAddModal(true), []);
  
  const handleToggleCollapse = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);

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
                onClick={handleToggleCollapse}
                className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-zinc-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 mr-3"
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
                onClick={handleToggleCollapse}
                className="w-full flex justify-center p-2 rounded-lg text-gray-400 hover:text-white hover:bg-zinc-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500"
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
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `
                  flex items-center px-3 py-2 rounded-lg transition-all duration-200
                  ${isActive 
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/25' 
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
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
              </NavLink>
            ))}
          </div>
        </nav>

        {}
        <div className="px-3 py-4 border-t border-zinc-800">
          <button
            onClick={handleAddPlaylist}
            className={`
              w-full flex items-center px-3 py-2 rounded-lg transition-all duration-200
              text-red-500 hover:text-red-400 hover:bg-zinc-800/50
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
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center px-3 py-2 rounded-lg transition-all duration-200
                ${isActive 
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/25' 
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
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
            </NavLink>
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