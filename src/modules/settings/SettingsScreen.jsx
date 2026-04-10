

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  MoonIcon, 
  SunIcon, 
  DownloadIcon, 
  UploadIcon,
  TrashIcon,
  VideoCameraIcon,
  VolumeUpIcon,
  GlobeAltIcon,
  ChevronRightIcon
} from '/src/shared/icons/heroiconsOutlineCompat';
import { usePlaylist } from '../../shared/hooks/usePlaylist';
import { StorageService } from '../../core/services/storage/StorageService';
import ActionModal from '../../shared/components/Modal/ActionModal';

const storageService = new StorageService();
const COMING_SOON_HINT = 'Será adicionado em breve';

const ComingSoonHint = () => (
  <span className="group relative inline-flex items-center">
    <span className="ml-2 inline-flex cursor-default rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-200">
      Em breve
    </span>
    <span className="pointer-events-none absolute left-1/2 top-full z-[10000] mt-1 -translate-x-1/2 whitespace-nowrap rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-200 opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
      {COMING_SOON_HINT}
    </span>
  </span>
);

const SettingsDropdown = ({ options, value, onChange, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const selected = options.find((option) => option.value === value) || options[0];

  const updateMenuPosition = () => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    setMenuPosition({
      top: rect.bottom + 6,
      left: rect.left,
      width: rect.width
    });
  };

  useEffect(() => {
    if (disabled && isOpen) {
      setIsOpen(false);
    }
  }, [disabled, isOpen]);

  useEffect(() => {
    const handleOutside = (event) => {
      if (!triggerRef.current || !menuRef.current) return;

      const target = event.target;
      if (!(target instanceof Node)) return;

      if (!triggerRef.current.contains(target) && !menuRef.current.contains(target)) {
        setIsOpen(false);
      }
    };

    const handleViewportChange = () => {
      updateMenuPosition();
    };

    if (isOpen) {
      updateMenuPosition();
      document.addEventListener('mousedown', handleOutside);
      window.addEventListener('resize', handleViewportChange);
      window.addEventListener('scroll', handleViewportChange, true);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
    };
  }, [isOpen]);

  const dropdownMenu = isOpen && !disabled && menuPosition && typeof document !== 'undefined'
    ? createPortal(
      <div
        ref={menuRef}
        style={{
          position: 'fixed',
          top: `${menuPosition.top}px`,
          left: `${menuPosition.left}px`,
          width: `${menuPosition.width}px`
        }}
        className="z-[9999] max-h-60 overflow-y-auto rounded-lg border border-zinc-700 bg-zinc-900 py-1 shadow-lg"
      >
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              onChange(option.value);
              setIsOpen(false);
            }}
            className={`w-full px-3 py-2 text-left text-sm transition-colors ${
              option.value === value
                ? 'bg-zinc-800 text-red-500'
                : 'text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>,
      document.body
    )
    : null;

  return (
    <div className="relative min-w-[150px]">
      <div ref={triggerRef} className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen((prev) => !prev)}
          className={`w-full flex items-center justify-between gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
            disabled
              ? 'cursor-not-allowed border-zinc-800 bg-zinc-900 text-zinc-500'
              : 'border-zinc-700 bg-zinc-800 text-white hover:border-red-500'
          }`}
        >
          <span className="truncate">{selected?.label || ''}</span>
          <svg className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {dropdownMenu}
    </div>
  );
};

const SettingsScreen = () => {
  const navigate = useNavigate();
  const { playlists, deletePlaylist } = usePlaylist();
  const [settings, setSettings] = useState({
    theme: 'dark',
    defaultQuality: 'auto',
    autoplay: true,
    rememberProgress: true,
    language: 'pt-BR',
    volume: 1,
    bufferProfile: localStorage.getItem('zix.bufferProfile') || 'balanced'
  });
  const [confirmAction, setConfirmAction] = useState(null);

  const playlistsArray = Array.isArray(playlists) ? playlists : [];
  const hasPlaylist = playlistsArray.length > 0;

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (!hasPlaylist) {
      navigate('/', { replace: true });
    }
  }, [hasPlaylist, navigate]);

  const loadSettings = async () => {
    const saved = await storageService.getSettings();
    const nextSettings = { ...saved, theme: 'dark' };
    setSettings(prev => ({ ...prev, ...nextSettings }));

    if (saved?.theme !== 'dark') {
      await storageService.updateSettings(nextSettings);
    }
  };

  const saveSettings = async (key, value) => {
    if (key === 'theme') return;
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    await storageService.updateSettings(newSettings);
  };

  const handleExport = async () => {
    const data = await storageService.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `iptv-backup-${new Date().toISOString()}.json`;
    a.click();
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        await storageService.importData(e.target.result);
        window.location.reload();
      };
      reader.readAsText(file);
    }
  };

  const handleClearHistory = async () => {
    setConfirmAction({
      title: 'Limpar histórico',
      message: 'Tem certeza que deseja limpar todo o histórico?',
      danger: true,
      confirmText: 'Limpar',
      onConfirm: async () => {
        await storageService.clearHistory();
      }
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmAction?.onConfirm) {
      setConfirmAction(null);
      return;
    }

    await confirmAction.onConfirm();
    setConfirmAction(null);
  };

  
  if (!hasPlaylist) {
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-600/5 via-zinc-950 to-zinc-950" />
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgb(255 255 255 / 0.02) 1px, transparent 0)`,
          backgroundSize: '48px 48px'
        }} />
      </div>

      <div className="relative z-10 p-6">
        {}
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/', { replace: true })}
              className="text-zinc-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h1 className="text-3xl font-bold text-white">Configurações</h1>
          </div>
          <div className="mt-3 ml-10">
            <button
              type="button"
              onClick={() => navigate('/about')}
              className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-red-500 transition-colors"
            >
              <span>Sobre a ZixTV</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-500/10 border border-amber-500/40 rounded-xl p-4"
          >
            <p className="text-amber-200 text-sm font-medium">
              Aviso: a tela de configurações ainda nao esta totalmente funcional e muitas opções podem mudar nas proximas versões ou ainda não foram implementadas.
            </p>
          </motion.div>

          {}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900/80 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-colors"
          >
            <div className="p-5">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                <MoonIcon className="w-5 h-5 mr-2 text-red-500" />
                Aparência
              </h2>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-300 text-sm flex items-center">Tema <ComingSoonHint /></span>
                  <div className="flex gap-2 relative">
                    <button
                      type="button"
                      disabled
                      className={`px-4 py-1.5 rounded-lg text-sm flex items-center gap-2 transition-all ${
                        settings.theme === 'light'
                          ? 'bg-red-600 text-white'
                          : 'bg-zinc-900 text-zinc-500 cursor-not-allowed border border-zinc-800'
                      }`}
                    >
                      <SunIcon className="w-4 h-4" />
                      Claro
                    </button>
                    <button
                      type="button"
                      disabled
                      className={`px-4 py-1.5 rounded-lg text-sm flex items-center gap-2 transition-all ${
                        settings.theme === 'dark'
                          ? 'bg-red-600 text-white'
                          : 'bg-zinc-800 text-zinc-400 cursor-not-allowed'
                      }`}
                    >
                      <MoonIcon className="w-4 h-4" />
                      Escuro
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-zinc-900/80 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-colors"
          >
            <div className="p-5">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                <VideoCameraIcon className="w-5 h-5 mr-2 text-red-500" />
                Reprodução
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-300 text-sm flex items-center">Qualidade padrão <ComingSoonHint /></span>
                  <SettingsDropdown
                    disabled
                    value={settings.defaultQuality}
                    onChange={(nextValue) => saveSettings('defaultQuality', nextValue)}
                    options={[
                      { value: 'auto', label: 'Auto' },
                      { value: '1080p', label: '1080p' },
                      { value: '720p', label: '720p' },
                      { value: '480p', label: '480p' }
                    ]}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-zinc-300 text-sm flex items-center">Auto-play <ComingSoonHint /></span>
                  <button
                    type="button"
                    disabled
                    className={`w-11 h-6 rounded-full transition-colors ${
                      settings.autoplay ? 'bg-red-900/70 cursor-not-allowed' : 'bg-zinc-800 cursor-not-allowed'
                    }`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full transform transition-transform ${
                      settings.autoplay ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-zinc-300 text-sm flex items-center">Lembrar progresso <ComingSoonHint /></span>
                  <button
                    type="button"
                    disabled
                    className={`w-11 h-6 rounded-full transition-colors ${
                      settings.rememberProgress ? 'bg-red-900/70 cursor-not-allowed' : 'bg-zinc-800 cursor-not-allowed'
                    }`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full transform transition-transform ${
                      settings.rememberProgress ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-zinc-300 text-sm flex items-center">Volume padrão <ComingSoonHint /></span>
                  <div className="flex items-center gap-3">
                    <VolumeUpIcon className="w-4 h-4 text-zinc-500" />
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={settings.volume}
                      disabled
                      onChange={(e) => saveSettings('volume', parseFloat(e.target.value))}
                      className="w-28 h-1 bg-zinc-800 rounded-lg appearance-none cursor-not-allowed accent-red-600"
                    />
                    <span className="text-white text-sm w-10">{Math.round(settings.volume * 100)}%</span>
                  </div>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-zinc-300 text-sm">Tamanho do buffer de renderização</span>
                    <p className="mt-1 text-xs text-zinc-500 max-w-sm">
                      Ajusta quanto o player tenta manter carregado para reduzir travamentos em canais ao vivo.
                    </p>
                  </div>
                  <SettingsDropdown
                    value={settings.bufferProfile || 'balanced'}
                    onChange={(nextValue) => saveSettings('bufferProfile', nextValue)}
                    options={[
                      { value: 'small', label: 'Menor' },
                      { value: 'balanced', label: 'Médio' },
                      { value: 'large', label: 'Maior' },
                      { value: 'xlarge', label: 'Máximo' }
                    ]}
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-zinc-900/80 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-colors"
          >
            <div className="p-5">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                <GlobeAltIcon className="w-5 h-5 mr-2 text-red-500" />
                Idioma <ComingSoonHint />
              </h2>
              
              <SettingsDropdown
                disabled
                value={settings.language}
                onChange={(nextValue) => saveSettings('language', nextValue)}
                options={[
                  { value: 'pt-BR', label: 'Português (Brasil)' },
                  { value: 'en', label: 'English' },
                  { value: 'es', label: 'Español' }
                ]}
              />
            </div>
          </motion.div>

          {}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-zinc-900/80 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-colors"
          >
            <div className="p-5">
              <h2 className="text-lg font-semibold text-white mb-4">Playlists</h2>
              
              <div className="space-y-2">
                {playlistsArray.map((playlist) => (
                  <div
                    key={playlist.id}
                    className="flex items-center justify-between bg-zinc-800/50 rounded-lg p-3"
                  >
                    <div className="flex-1">
                      <h3 className="text-white font-medium text-sm">{playlist.name}</h3>
                      <p className="text-zinc-500 text-xs">
                        {playlist.type} - {playlist.live?.length || 0} canais -{' '}
                        {playlist.movies?.length || 0} filmes -{' '}
                        {playlist.series?.length || 0} séries
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setConfirmAction({
                          title: 'Remover playlist',
                          message: `Remover playlist "${playlist.name}"?`,
                          danger: true,
                          confirmText: 'Remover',
                          onConfirm: async () => {
                            deletePlaylist(playlist.id);
                          }
                        });
                      }}
                      className="text-red-500 hover:text-red-400 transition-colors p-1"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-zinc-900/80 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-colors"
          >
            <div className="p-5">
              <h2 className="text-lg font-semibold text-white mb-4">Backup</h2>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleExport}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <DownloadIcon className="w-4 h-4" />
                  Exportar Dados
                </button>
                
                <label className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer">
                  <UploadIcon className="w-4 h-4" />
                  Importar Dados
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    className="hidden"
                  />
                </label>
              </div>

              <button
                onClick={handleClearHistory}
                className="mt-3 w-full bg-zinc-800 hover:bg-zinc-700 text-red-500 py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                Limpar Histórico
              </button>
            </div>
          </motion.div>

          {}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-zinc-900/80 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-colors"
          >
            <div className="p-5">
              <h2 className="text-lg font-semibold text-white mb-2">ZixTV</h2>
              <p className="text-zinc-500 text-sm">v1.0.0 Alpha</p>
              <p className="text-zinc-500 text-sm mt-2">
                Um organizador e player IPTV completo com interface moderna. Futuras atualizações em breve!
              </p>
              <p className="text-zinc-600 text-xs mt-4">
                © 2026 - Todos os direitos reservados
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      <ActionModal
        isOpen={Boolean(confirmAction)}
        title={confirmAction?.title || ''}
        message={confirmAction?.message || ''}
        confirmText={confirmAction?.confirmText || 'Confirmar'}
        cancelText="Cancelar"
        danger={Boolean(confirmAction?.danger)}
        onConfirm={handleConfirmAction}
        onClose={() => setConfirmAction(null)}
      />
    </div>
  );
};

export default SettingsScreen;

