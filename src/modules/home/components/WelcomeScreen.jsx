
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import AddPlaylistModal from '../../../shared/components/Modal/AddPlaylistModal';
import { 
  UploadIcon, 
  LinkIcon, 
  ServerIcon,
  PlayIcon,
  FilmIcon,
  UsersIcon,
  TrendingUpIcon
} from '/src/shared/icons/heroiconsOutlineCompat';

import logoZixTV from '../../../assets/logo-zix-tv.png';

const WelcomeScreen = () => {
  const navigate = useNavigate();
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: null
  });

  const openModal = (type) => {
    setModalConfig({ isOpen: true, type });
  };

  const closeModal = () => {
    setModalConfig({ isOpen: false, type: null });
  };

  const cards = [
    {
      id: 'upload',
      title: 'Upload M3U',
      description: 'Carregar arquivo local',
      icon: <UploadIcon className="w-5 h-5" />
    },
    {
      id: 'url',
      title: 'URL Remota',
      description: 'Adicionar via link',
      icon: <LinkIcon className="w-5 h-5" />
    },
    {
      id: 'xtream',
      title: 'Xtream Codes',
      description: 'Conectar via API',
      icon: <ServerIcon className="w-5 h-5" />
    }
  ];

  const stats = [
    { icon: <PlayIcon className="w-3.5 h-3.5" />, label: 'Canais' },
    { icon: <FilmIcon className="w-3.5 h-3.5" />, label: 'Filmes' },
    { icon: <UsersIcon className="w-3.5 h-3.5" />, label: 'Séries' },
    { icon: <TrendingUpIcon className="w-3.5 h-3.5" />, label: 'HD/4K' }
  ];

  return (
    <div className="relative h-screen bg-zinc-950 overflow-hidden">
      {}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-950 to-red-950/20" />
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgb(255 255 255 / 0.02) 1px, transparent 0)`,
          backgroundSize: '48px 48px'
        }} />
      </div>

      {}
      <div className="absolute top-0 left-0 right-0 h-14 bg-zinc-900/40 backdrop-blur-sm border-b border-zinc-800/50 z-20" />

      {}
      <div className="relative z-10 h-full flex items-center justify-center px-6">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {}
          <motion.div
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="space-y-6"
          >
            {}
            <div className="relative flex items-center gap-4">
              <div className="relative">
                <div className="absolute -inset-2 bg-red-600/20 rounded-full blur-md" />
                <div className="relative w-20 h-20 bg-gradient-to-br from-red-600 to-red-700 rounded-full flex items-center justify-center shadow-lg">
                  <img 
                    src={logoZixTV} 
                    alt="ZixTV"
                    className="w-16 h-16 object-contain"
                  />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Zix<span className="text-red-500">TV</span></h1>
                <p className="text-zinc-300 text-x">Media Center</p>
              </div>
            </div>

            {}
            <div className="space-y-3">
              <h2 className="text-3xl font-bold text-white leading-tight">
                Sua central de<br />
                <span className="text-red-500">entretenimento</span>
              </h2>
              <p className="text-zinc-300 text-sm leading-relaxed">
                Adicione sua playlist e tenha acesso a canais, filmes e séries.
              </p>
            </div>

            {}
            <div className="flex flex-wrap gap-3 pt-2">
              {stats.map((stat, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15, delay: 0.1 + idx * 0.02 }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900/50 rounded-lg border border-zinc-800"
                >
                  <div className="text-red-500">
                    {stat.icon}
                  </div>
                  <span className="text-zinc-500 text-xs">{stat.label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {}
          <motion.div
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, ease: "easeOut", delay: 0.05 }}
            className="space-y-3"
          >
            {cards.map((card, index) => (
              <motion.button
                key={card.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15, delay: 0.15 + index * 0.03 }}
                whileHover={{ x: 3 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => openModal(card.id)}
                className="group w-full text-left"
              >
                <div className="relative bg-zinc-900/40 border-2 border-zinc-800 rounded-xl p-4 transition-all duration-100 group-hover:border-red-600/60 group-hover:bg-zinc-900/60">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-600/10 rounded-lg flex items-center justify-center text-red-500 transition-all duration-100 group-hover:bg-red-600/20">
                      {card.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-medium text-sm group-hover:text-red-500 transition-colors duration-100">
                        {card.title}
                      </h3>
                      <p className="text-zinc-500 text-xs">
                        {card.description}
                      </p>
                    </div>
                    <svg className="w-4 h-4 text-zinc-700 group-hover:text-red-500 group-hover:translate-x-0.5 transition-all duration-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </motion.button>
            ))}

            {}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15, delay: 0.25 }}
              className="text-center pt-4"
            >
              <button
                onClick={() => navigate('/about')}
                className="text-zinc-500 hover:text-red-500 text-sm font-medium transition-colors duration-100 inline-flex items-center gap-2 group"
              >
                <span>Dúvidas? Veja como obter uma playlist</span>
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {}
      <AnimatePresence>
        {modalConfig.isOpen && (
          <AddPlaylistModal
            isOpen={modalConfig.isOpen}
            onClose={closeModal}
            initialType={modalConfig.type}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default WelcomeScreen;

