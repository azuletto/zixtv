

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  RefreshIcon,
  DocumentDuplicateIcon,
  DownloadIcon
} from '/src/shared/icons/heroiconsOutlineCompat';
import { usePlaylist } from '../../shared/hooks/usePlaylist';
import AddPlaylistModal from '../../shared/components/Modal/AddPlaylistModal';
import ActionModal from '../../shared/components/Modal/ActionModal';
import { PlaylistValidator } from '../../core/services/playlist/validators/PlaylistValidator';

const PlaylistManager = () => {
  const { playlists, activePlaylist, selectPlaylist, deletePlaylist } = usePlaylist();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [playlistToDelete, setPlaylistToDelete] = useState(null);

  const validator = new PlaylistValidator();

  const handleRefresh = async (playlistId) => {
    setRefreshing(true);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    setRefreshing(false);
  };

  const handleDuplicate = async (playlist) => {
    const newPlaylist = {
      ...playlist,
      id: Date.now().toString(),
      name: `${playlist.name} (cópia)`,
      createdAt: new Date().toISOString()
    };
    
  };

  const handleExport = (playlist) => {
    const data = JSON.stringify(playlist, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${playlist.name.toLowerCase().replace(/\s+/g, '-')}.json`;
    a.click();
  };

  const getPlaylistStats = (playlist) => {
    return {
      live: playlist.live?.length || 0,
      movies: playlist.movies?.length || 0,
      series: playlist.series?.length || 0,
      total: (playlist.live?.length || 0) + 
             (playlist.movies?.length || 0) + 
             (playlist.series?.length || 0)
    };
  };

  return (
    <div className="p-6">
      {}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Gerenciar Playlists</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Nova Playlist
        </button>
      </div>

      {}
      {playlists.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-sm">Total Playlists</p>
            <p className="text-2xl font-bold text-white">{playlists.length}</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-sm">Canais Ao Vivo</p>
            <p className="text-2xl font-bold text-white">
              {playlists.reduce((acc, p) => acc + (p.live?.length || 0), 0)}
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-sm">Filmes</p>
            <p className="text-2xl font-bold text-white">
              {playlists.reduce((acc, p) => acc + (p.movies?.length || 0), 0)}
            </p>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-gray-400 text-sm">Séries</p>
            <p className="text-2xl font-bold text-white">
              {playlists.reduce((acc, p) => acc + (p.series?.length || 0), 0)}
            </p>
          </div>
        </div>
      )}

      {}
      {playlists.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <p className="text-gray-400 mb-4">Nenhuma playlist adicionada</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors inline-flex items-center"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Adicionar Primeira Playlist
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {playlists.map((playlist) => {
            const stats = getPlaylistStats(playlist);
            const isActive = activePlaylist?.id === playlist.id;

            return (
              <motion.div
                key={playlist.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
                className={`bg-gray-800 rounded-lg p-6 cursor-pointer transition-all ${
                  isActive ? 'ring-2 ring-red-600' : 'hover:bg-gray-750'
                }`}
                onClick={() => selectPlaylist(playlist)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-white font-bold text-lg">{playlist.name}</h3>
                    <p className="text-gray-400 text-sm">
                      {playlist.type === 'm3u' && 'URL M3U'}
                      {playlist.type === 'xtream' && 'Xtream Codes'}
                      {playlist.type === 'file' && 'Arquivo Local'}
                    </p>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingPlaylist(playlist);
                      }}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPlaylistToDelete(playlist);
                      }}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="text-center">
                    <p className="text-xl font-bold text-blue-400">{stats.live}</p>
                    <p className="text-xs text-gray-400">Ao Vivo</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-green-400">{stats.movies}</p>
                    <p className="text-xs text-gray-400">Filmes</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-purple-400">{stats.series}</p>
                    <p className="text-xs text-gray-400">Séries</p>
                  </div>
                </div>

                {}
                <div className="flex justify-between items-center pt-4 border-t border-gray-700">
                  <span className="text-xs text-gray-500">
                    Adicionada em {new Date(playlist.createdAt).toLocaleDateString()}
                  </span>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRefresh(playlist.id);
                      }}
                      disabled={refreshing}
                      className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                      title="Atualizar"
                    >
                      <RefreshIcon className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicate(playlist);
                      }}
                      className="text-gray-400 hover:text-white transition-colors"
                      title="Duplicar"
                    >
                      <DocumentDuplicateIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExport(playlist);
                      }}
                      className="text-gray-400 hover:text-white transition-colors"
                      title="Exportar"
                    >
                      <DownloadIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {}
                {isActive && (
                  <div className="absolute top-2 right-2">
                    <span className="bg-red-600 text-white text-xs px-2 py-1 rounded">
                      Ativa
                    </span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {}
      <AnimatePresence>
        {showAddModal && (
          <AddPlaylistModal
            onClose={() => setShowAddModal(false)}
            onSuccess={() => setShowAddModal(false)}
          />
        )}

        {editingPlaylist && (
          <AddPlaylistModal
            playlist={editingPlaylist}
            onClose={() => setEditingPlaylist(null)}
            onSuccess={() => setEditingPlaylist(null)}
          />
        )}
      </AnimatePresence>

      <ActionModal
        isOpen={Boolean(playlistToDelete)}
        title="Remover playlist"
        message={playlistToDelete ? `Remover playlist "${playlistToDelete.name}"?` : ''}
        confirmText="Remover"
        cancelText="Cancelar"
        danger={true}
        onConfirm={() => {
          if (playlistToDelete) {
            deletePlaylist(playlistToDelete.id);
          }
          setPlaylistToDelete(null);
        }}
        onClose={() => setPlaylistToDelete(null)}
      />
    </div>
  );
};

export default PlaylistManager;


