
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { Shield, FileText, Heart, Tv, Zap, Lock, X, Github, Play, Copy, CheckCircle, QrCode } from 'lucide-react';
import { usePlaylist } from '../../shared/hooks/usePlaylist';
import logoZixTV from '../../assets/logo-zix-tv.png';

const PIX_KEY = 'oliveira.andre.dev@gmail.com';

const AboutScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { playlists } = usePlaylist();
  const hasPlaylist = Array.isArray(playlists) && playlists.length > 0;
  const [pixCopied, setPixCopied] = useState(false);

  useEffect(() => {
    if (location.hash !== '#doacao') return;

    const scrollToDonation = () => {
      const donationSection = document.getElementById('doacao');
      if (donationSection) {
        donationSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    requestAnimationFrame(scrollToDonation);
  }, [location.hash]);

  const handleClose = () => {
    if (hasPlaylist) {
      navigate('/');
    } else {
      navigate('/');
    }
  };

  const handleCopyPix = async () => {
    try {
      await navigator.clipboard.writeText(PIX_KEY);
      setPixCopied(true);
      setTimeout(() => setPixCopied(false), 1800);
    } catch (_) {
      setPixCopied(false);
    }
  };

  const sections = [
    {
      icon: <Tv className="w-6 h-6" />,
      title: 'Sobre o ZixTV',
      content: 'ZixTV é um player IPTV moderno e leve, desenvolvido para proporcionar a melhor experiência de streaming. Com suporte a playlists M3U, M3U8 e Xtream Codes, você tem todo o controle do seu entretenimento. Centralizado e organizado.',
      subSection: {
        title: 'Não tem uma playlist?',
        description: 'Para você testar o player, disponibilizamos uma playlist gratuita mantida pela comunidade. Esta playlist não tem ligação oficial com o ZixTV, é uma iniciativa independente para ajudar novos usuários. Os conteúdos dela não são nossa responsabilidade, e podem mudar ou ficar indisponíveis a qualquer momento.',
        link: 'https://iptv-org.github.io/iptv/index.m3u'
      }
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Características',
      content: 'ZixTV é um projeto open-source, gratuito e sem anúncios. Ele é projetado para ser rápido, leve e fácil de usar, com uma interface intuitiva e recursos avançados de reprodução.\n\nCaso queira contribuir, o código-fonte está disponível no GitHub:'
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Privacidade',
      content: 'O ZixTV não coleta, armazena ou compartilha nenhum dado pessoal dos usuários. Todas as informações são armazenadas localmente no seu dispositivo. Não utilizamos cookies de rastreamento.'
    },
    {
      icon: <FileText className="w-6 h-6" />,
      title: 'Termos de Uso',
      content: 'O ZixTV é um aplicativo destinado à reprodução de conteúdo multimídia. O usuário é responsável pelo conteúdo das playlists adicionadas. O aplicativo apenas reproduz o conteúdo fornecido.'
    },
    {
      icon: <Lock className="w-6 h-6" />,
      title: 'Licença',
      content: 'ZixTV é um software livre sob a licença GNU Affero General Public License (AGPL) v3.0. Você pode usar, modificar e distribuir conforme os termos da licença.'
    }
  ];

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

      {}
      <div className="relative z-10 h-screen overflow-y-auto">
        {}
        <div className="sticky top-0 bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-800 z-20">
          <div className="max-w-4xl mx-auto px-8 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute -inset-2 bg-red-600/20 rounded-full blur-md" />
                  <div className="relative w-10 h-10 bg-gradient-to-br from-red-600 to-red-700 rounded-full flex items-center justify-center shadow-lg">
                    <img 
                      src={logoZixTV} 
                      alt="ZixTV"
                      className="w-8 h-8 object-contain"
                    />
                  </div>
                </div>
                <h1 className="text-xl font-bold text-white">ZixTV</h1>
              </div>
              <button
                onClick={handleClose}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors text-zinc-300 hover:text-white"
              >
                <X className="w-4 h-4" />
                <span className="text-sm">Fechar</span>
              </button>
            </div>
          </div>
        </div>

        {}
        <div className="max-w-4xl mx-auto px-8 py-12">
          {}
          <div className="text-center mb-12">
            <div className="relative inline-block">
              <div className="absolute -inset-4 bg-red-600/20 rounded-full blur-xl" />
              <div className="relative w-24 h-24 bg-gradient-to-br from-red-600 to-red-700 rounded-full flex items-center justify-center shadow-xl shadow-red-600/20 mx-auto mb-5">
                <img 
                  src={logoZixTV} 
                  alt="ZixTV"
                  className="w-16 h-16 object-contain"
                />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">ZixTV - Player IPTV</h2>
            <p className="text-zinc-500 text-base">Versão 1.2.0 Alpha</p>
          </div>

          {}
          <div className="space-y-8">
            {sections.map((section, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="border-b border-zinc-800 pb-8 last:border-0"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-red-500">
                    {section.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-white">{section.title}</h3>
                </div>
                <div className="text-zinc-300 text-base leading-relaxed whitespace-pre-line pl-9">
                  {section.title === 'Sobre o ZixTV' ? (
                    <>
                      {section.content}
                      <div className="mt-6 pt-4 pl-4 border-l-2 border-red-600/30 bg-red-600/5 rounded-r-lg p-4">
                        <p className="text-white font-medium mb-2 flex items-center gap-2">
                          <Play className="w-4 h-4 text-red-500" />
                          {section.subSection.title}
                        </p>
                        <p className="text-zinc-400 text-sm mb-3">
                          {section.subSection.description}
                        </p>
                        <a 
                          href={section.subSection.link}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-red-500 hover:text-red-400 underline text-sm break-all inline-flex items-center gap-1"
                        >
                          {section.subSection.link}
                        </a>
                      </div>
                    </>
                  ) : section.title === 'Características' ? (
                    <>
                      {section.content.split('\n\n')[0]}
                      <br /><br />
                      {section.content.split('\n\n')[1]}{' '}
                      <a 
                        href="https://github.com/azuletto/zixtv" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-red-500 hover:text-red-400 underline inline-flex items-center gap-1"
                      >
                        <Github className="w-4 h-4" />
                        github.com/azuletto/zixtv
                      </a>
                    </>
                  ) : section.title === 'Licença' ? (
                    <>
                      ZixTV é um software livre sob a licença{' '}
                      <a 
                        href="https://www.gnu.org/licenses/agpl-3.0.txt" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-red-500 hover:text-red-400 underline"
                      >
                        GNU Affero General Public License (AGPL) v3.0
                      </a>
                      . Você pode usar, modificar e distribuir conforme os termos da licença.
                    </>
                  ) : (
                    section.content
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            id="doacao"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mt-10 rounded-xl border border-red-600/30 bg-gradient-to-r from-red-600/10 to-zinc-900 p-6"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="text-red-500">
                <Heart className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-semibold text-white">Apoie o Projeto</h3>
            </div>
            <p className="text-zinc-300 text-sm mb-4">
              Se o ZixTV te ajuda no dia a dia, você pode apoiar com qualquer valor via PIX.
            </p>

            <div className="rounded-lg border border-zinc-700 bg-zinc-900/80 p-4">
              <div className="flex items-center gap-2 text-zinc-400 text-xs uppercase tracking-wider mb-2">
                <QrCode className="w-4 h-4" />
                Chave PIX
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <code className="flex-1 rounded-md bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm text-zinc-200 break-all">
                  {PIX_KEY}
                </code>
                <button
                  type="button"
                  onClick={handleCopyPix}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors"
                >
                  {pixCopied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {pixCopied ? 'Copiado' : 'Copiar chave'}
                </button>
              </div>
            </div>
          </motion.div>

          {}
          <div className="mt-12 pt-8 border-t border-zinc-800 text-center">
            <p className="text-zinc-500 text-sm flex items-center justify-center gap-1">
              Feito com <Heart className="w-4 h-4 text-red-500" /> para a comunidade
            </p>
            <p className="text-zinc-600 text-sm mt-3">
              © 2026 ZixTV - Todos os direitos reservados
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutScreen;