
import React, { useState, useEffect } from 'react';
import { X, Upload, Link, Server, Eye, EyeOff, Shield, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlaylist } from '../../hooks/usePlaylist';
import ModernLoader from '../Loaders/ModernLoader';

const ProcessingModal = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.15 }}
    className="fixed inset-0 z-[55] flex items-center justify-center p-4"
  >
    <div className="absolute inset-0 bg-black/80" />
    <motion.div
      initial={{ scale: 0.96, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.96, opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="relative w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl p-5"
    >
      <ModernLoader
        variant="compact"
        title="Processando playlist"
        subtitle="Validando e organizando os itens"
        steps={['Lendo arquivo', 'Organizando conteúdo', 'Salvando dados']}
        activeStep={1}
        showSteps={false}
      />
    </motion.div>
  </motion.div>
);

const PrivacyTermsModal = ({ isOpen, onClose, onAccept }) => {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="relative bg-zinc-900 rounded-xl w-full max-w-md shadow-xl"
      >
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h3 className="text-lg font-bold text-white">Termos de Privacidade</h3>
          <button onClick={onClose} className="p-1 hover:bg-zinc-800 rounded-lg transition-colors">
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <p className="text-zinc-300 text-sm">
            O ZixTV respeita sua privacidade. Todas as playlists são armazenadas localmente no seu dispositivo.
          </p>
          <p className="text-zinc-300 text-sm">
            Não compartilhamos seus dados com terceiros. Seus dados de acesso permanecem apenas no seu navegador.
          </p>
          <p className="text-zinc-300 text-sm">
            Você pode remover suas playlists a qualquer momento nas configurações.
          </p>
          <div className="pt-3 border-t border-zinc-800">
            <p className="text-zinc-500 text-xs">
              Versão 1.0.0 Alpha - Atualizado em Abril de 2026
            </p>
          </div>
        </div>
        <div className="p-4 border-t border-zinc-800">
          <button
            onClick={onAccept}
            className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            Aceitar Termos
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const AddPlaylistModal = ({ isOpen, onClose, initialType = null }) => {
  const [step, setStep] = useState(initialType ? 2 : 1);
  const [playlistType, setPlaylistType] = useState(initialType);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    username: '',
    password: '',
    file: null
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPrivacyTerms, setShowPrivacyTerms] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  
  const { addPlaylist, isLoading } = usePlaylist();

  
  useEffect(() => {
    setTermsAccepted(false);
  }, [isOpen]);

  
  const handleAcceptTerms = () => {
    setTermsAccepted(true);
    localStorage.setItem('zixTV_termsAccepted', 'true');
    setShowPrivacyTerms(false);
  };

  useEffect(() => {
    if (isOpen && initialType) {
      setStep(2);
      setPlaylistType(initialType);
    } else if (!isOpen) {
      setStep(1);
      setPlaylistType(null);
      setFormData({
        name: '',
        url: '',
        username: '',
        password: '',
        file: null
      });
      setError('');
      setIsProcessing(false);
    }
  }, [isOpen, initialType]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && (file.name.endsWith('.m3u') || file.name.endsWith('.m3u8'))) {
      setFormData({ ...formData, file, name: file.name.replace('.m3u', '').replace('.m3u8', '') });
      setError('');
    } else {
      setError('Por favor, selecione um arquivo .m3u ou .m3u8 válido');
    }
  };

  const handleSubmit = async () => {
    if (!termsAccepted) {
      setShowPrivacyTerms(true);
      return;
    }

    setError('');
    setIsProcessing(true);

    try {
      let playlistData = {
        name: formData.name,
        type: playlistType,
        createdAt: new Date().toISOString()
      };

      switch (playlistType) {
        case 'upload':
          if (!formData.file) {
            setError('Selecione um arquivo');
            setIsProcessing(false);
            return;
          }
          const content = await readFileContent(formData.file);
          playlistData = {
            ...playlistData,
            source: 'file',
            content,
            fileName: formData.file.name
          };
          break;

        case 'url':
          if (!formData.url) {
            setError('Insira uma URL válida');
            setIsProcessing(false);
            return;
          }
          playlistData = {
            ...playlistData,
            source: 'url',
            url: formData.url
          };
          break;

        case 'xtream':
          if (!formData.url || !formData.username || !formData.password) {
            setError('Preencha todos os campos');
            setIsProcessing(false);
            return;
          }
          playlistData = {
            ...playlistData,
            source: 'xtream',
            url: formData.url,
            username: formData.username,
            password: formData.password
          };
          break;
      }

      await addPlaylist(playlistData);
      onClose();
      
    } catch (err) {
      setError(err.message || 'Erro ao adicionar playlist. Tente novamente.');
      setIsProcessing(false);
    }
  };

  const readFileContent = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e.target.error);
      reader.readAsText(file);
    });
  };

  const renderStep1 = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="space-y-3"
    >
      <h3 className="text-sm font-medium text-white mb-3">
        Escolha o tipo de playlist
      </h3>
      
      <button
        onClick={() => { setPlaylistType('upload'); setStep(2); }}
        className="w-full p-3 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg border border-zinc-700 hover:border-red-600/50 transition-all group text-left"
      >
        <div className="flex items-center gap-3">
          <div className="bg-red-600/10 p-2 rounded-lg group-hover:bg-red-600/20 transition-colors">
            <Upload className="w-5 h-5 text-red-500" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-white">Upload M3U</h4>
            <p className="text-xs text-zinc-400">Faça upload do seu arquivo</p>
          </div>
        </div>
      </button>

      <button
        onClick={() => { setPlaylistType('url'); setStep(2); }}
        className="w-full p-3 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg border border-zinc-700 hover:border-red-600/50 transition-all group text-left"
      >
        <div className="flex items-center gap-3">
          <div className="bg-red-600/10 p-2 rounded-lg group-hover:bg-red-600/20 transition-colors">
            <Link className="w-5 h-5 text-red-500" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-white">URL da Playlist</h4>
            <p className="text-xs text-zinc-400">Insira uma URL remota</p>
          </div>
        </div>
      </button>

      <button
        onClick={() => { setPlaylistType('xtream'); setStep(2); }}
        className="w-full p-3 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg border border-zinc-700 hover:border-red-600/50 transition-all group text-left"
      >
        <div className="flex items-center gap-3">
          <div className="bg-red-600/10 p-2 rounded-lg group-hover:bg-red-600/20 transition-colors">
            <Server className="w-5 h-5 text-red-500" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-white">Xtream Codes</h4>
            <p className="text-xs text-zinc-400">Servidor, usuário e senha</p>
          </div>
        </div>
      </button>
    </motion.div>
  );

  const renderStep2 = () => {
    const getIcon = () => {
      switch(playlistType) {
        case 'upload': return <Upload className="w-4 h-4" />;
        case 'url': return <Link className="w-4 h-4" />;
        case 'xtream': return <Server className="w-4 h-4" />;
        default: return null;
      }
    };

    const getTitle = () => {
      switch(playlistType) {
        case 'upload': return 'Upload de Playlist';
        case 'url': return 'URL da Playlist';
        case 'xtream': return 'Xtream Codes';
        default: return '';
      }
    };

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="space-y-4"
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="bg-red-600/10 p-1.5 rounded-lg">
            {getIcon()}
          </div>
          <h3 className="text-sm font-medium text-white">
            {getTitle()}
          </h3>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1">
            Nome da Playlist
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ex: Minha Playlist"
            className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm text-white placeholder-zinc-500"
            required
          />
        </div>

        {playlistType === 'upload' && (
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              Arquivo M3U
            </label>
            <div className="border-2 border-dashed border-zinc-700 rounded-lg p-4 text-center hover:border-red-600/50 transition-colors">
              <input
                type="file"
                accept=".m3u,.m3u8"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center gap-1"
              >
                <Upload className="w-6 h-6 text-zinc-500" />
                <span className="text-xs text-zinc-400 break-all px-2">
                  {formData.file ? formData.file.name : 'Clique para selecionar'}
                </span>
                <span className="text-xs text-zinc-600">.m3u ou .m3u8</span>
              </label>
            </div>
          </div>
        )}

        {playlistType === 'url' && (
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              URL da Playlist
            </label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="https://exemplo.com/playlist.m3u"
              className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm text-white placeholder-zinc-500"
              required
            />
          </div>
        )}

        {playlistType === 'xtream' && (
          <>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                URL do Servidor
              </label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://servidor.com:8080"
                className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm text-white placeholder-zinc-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Usuário
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Seu usuário"
                className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm text-white placeholder-zinc-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Sua senha"
                  className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm text-white placeholder-zinc-500 pr-8"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-zinc-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </>
        )}

        {}
        <div className="mt-4 pt-3 border-t border-zinc-800">
          <div className={`
            flex items-center gap-3 p-3 rounded-lg transition-all duration-200
            ${termsAccepted 
              ? 'bg-red-600/5 border border-red-600/20' 
              : 'bg-zinc-800/30 border border-zinc-700'
            }
          `}>
            <div className="relative flex-shrink-0">
              <input
                type="checkbox"
                id="terms-checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="peer sr-only"
              />
              <label
                htmlFor="terms-checkbox"
                className="flex items-center justify-center w-5 h-5 rounded-md border-2 cursor-pointer transition-all duration-200
                  peer-checked:bg-red-600 peer-checked:border-red-600
                  border-zinc-600 bg-zinc-800 hover:border-red-500"
              >
                {termsAccepted && (
                  <CheckCircle className="w-3.5 h-3.5 text-white" />
                )}
              </label>
            </div>

            <div className="flex-1">
              <label htmlFor="terms-checkbox" className="text-xs text-zinc-300 cursor-pointer leading-relaxed">
                Eu li e aceito os{' '}
                <button
                  type="button"
                  onClick={() => setShowPrivacyTerms(true)}
                  className="text-red-500 hover:text-red-400 hover:underline transition-colors inline-flex items-center gap-1 font-medium"
                >
                  Termos de Privacidade
                  <Shield className="w-3 h-3" />
                </button>
              </label>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                Seus dados são armazenados apenas localmente no seu dispositivo.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && !isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50"
          >
            <div className="absolute inset-0 bg-black/80" onClick={onClose} />

            <div className="absolute inset-0 flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="relative bg-zinc-900 rounded-xl w-full max-w-md shadow-2xl"
              >
                <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                  <h2 className="text-lg font-bold text-white">Adicionar Playlist</h2>
                  <button
                    onClick={onClose}
                    className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-zinc-400" />
                  </button>
                </div>

                <div className="p-4">
                  {error && (
                    <div className="mb-3 p-2 bg-red-600/10 border border-red-600/20 rounded-lg">
                      <p className="text-xs text-red-500 break-words">{error}</p>
                    </div>
                  )}

                  <AnimatePresence mode="wait">
                    {step === 1 ? renderStep1() : renderStep2()}
                  </AnimatePresence>
                </div>

                <div className="flex items-center justify-end p-4 border-t border-zinc-800">
                  <div className="flex gap-2">
                    {step === 2 && (
                      <button
                        onClick={() => setStep(1)}
                        className="px-3 py-1.5 text-zinc-400 hover:text-white transition-colors text-sm"
                      >
                        Voltar
                      </button>
                    )}
                    <button
                      onClick={onClose}
                      className="px-4 py-1.5 border border-zinc-700 rounded-lg text-zinc-300 hover:bg-zinc-800 transition-colors text-sm"
                    >
                      Cancelar
                    </button>
                    {step === 2 && (
                      <button
                        onClick={handleSubmit}
                        disabled={isLoading || isProcessing || !termsAccepted}
                        className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                      >
                        {isLoading || isProcessing ? (
                          <>
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Salvando...</span>
                          </>
                        ) : (
                          <span>Salvar</span>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {isOpen && isProcessing && <ProcessingModal />}
      </AnimatePresence>

      <PrivacyTermsModal 
        isOpen={showPrivacyTerms} 
        onClose={() => setShowPrivacyTerms(false)}
        onAccept={handleAcceptTerms}
      />
    </>
  );
};

export default AddPlaylistModal;