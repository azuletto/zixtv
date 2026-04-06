
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  PlayIcon, 
  PlusIcon, 
  ThumbUpIcon,
  ShareIcon,
  ChevronDownIcon,
  XIcon
} from '@heroicons/react/outline';
import { useMetadata } from '../../shared/hooks/useMetadata';
import { tmdbService } from '../../core/services/tmdb/TMDBService';
import CustomPlayer from '../player/CustomPlayer';
import ActionModal from '../../shared/components/Modal/ActionModal';

const extractImageIdFromUrl = (url) => {
  if (!url) return null;
  const match = url.toString().match(/\/([^/]+)\.(?:jpg|jpeg|png|webp)(?:\?.*)?$/i);
  return match ? match[1] : null;
};

const MovieDetails = ({ movie, type = 'movie', onClose }) => {
  const [showPlayer, setShowPlayer] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shareFeedback, setShareFeedback] = useState(null);
  
  const { 
    metadata, 
    getPosterUrl, 
    getBackdropUrl, 
    getFormattedRating, 
    getYear, 
    getGenre,
    getDescription 
  } = useMetadata(movie);

  
  useEffect(() => {
    const fetchDetails = async () => {
      const playlistImageId = movie?.tmdbImageId || movie?.tvg?.tmdbImageId || extractImageIdFromUrl(movie?.tvg?.logo || movie?.logo || movie?.posterUrl || movie?.backdropUrl);

      if (!movie.tmdbId && !movie.id && !playlistImageId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        let resolvedId = movie.tmdbId || (Number.isFinite(Number(movie.id)) ? movie.id : null);

        if (!resolvedId) {
          const results = await tmdbService.search(movie.name || movie.title || movie.seriesName || '', 1, {
            imageId: playlistImageId
          });
          const bestMatch = (results || []).find((item) => item.type === type) || results?.[0];
          resolvedId = bestMatch?.id || null;
        }

        if (!resolvedId) {
          setLoading(false);
          return;
        }

        const response = await fetch(`/api/tmdb/details?type=${type}&id=${resolvedId}`);
        const data = await response.json();
        
        if (data.success) {
          setDetails(data.data);
        } else {
          setError('Erro ao carregar detalhes');
        }
      } catch (err) {
        setError('Erro ao carregar detalhes');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [movie, type]);

  const handlePlay = () => {
    setShowPlayer(true);
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: movie.name,
        text: `Assista ${movie.name} no ZixTV`,
        url: window.location.href,
      });
    } catch (err) {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setShareFeedback('Link copiado para a area de transferencia.');
      } catch {
        setShareFeedback('Nao foi possivel compartilhar automaticamente.');
      }
    }
  };

  if (showPlayer) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black flex items-center justify-center"
      >
        <div className="w-full max-w-6xl px-3">
          <CustomPlayer
            source={movie.url}
            title={movie.name}
            type={type}
            metadata={movie.metadata}
            onClose={() => setShowPlayer(false)}
          />
        </div>
      </motion.div>
    );
  }

  
  const displayData = details || movie;
  const title = displayData.title || displayData.name || movie.name;
  const overview = displayData.overview || getDescription();
  const posterUrl = movie?.tvg?.logo || movie?.logo || displayData.posterUrl || getPosterUrl();
  const backdropUrl = movie?.tvg?.logo || movie?.logo || displayData.backdropUrl || getBackdropUrl();
  const rating = displayData.voteAverage || getFormattedRating();
  const year = displayData.year || getYear();
  const genres = displayData.genres || [];
  const runtime = displayData.runtime || movie.metadata?.duration;
  const cast = displayData.credits?.cast || [];
  const crew = displayData.credits?.crew || [];
  const videos = displayData.videos || [];

  
  const director = crew.find(member => member.job === 'Director')?.name || movie.metadata?.director;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black overflow-y-auto"
    >
      {}
      <div className="relative h-[70vh] min-h-[500px]">
        {backdropUrl && (
          <>
            <img
              src={backdropUrl}
              alt={title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
          </>
        )}
        
        {}
        {!backdropUrl && (
          <div className="w-full h-full bg-gradient-to-br from-red-900/50 to-zinc-900" />
        )}
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-red-600 transition-colors z-10 bg-black/50 rounded-full p-2"
        >
          <XIcon className="w-6 h-6" />
        </button>

        <div className="absolute bottom-0 left-0 p-8 md:p-12 max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">{title}</h1>
          
          <div className="flex flex-wrap items-center gap-3 text-white mb-4">
            {rating !== 'N/A' && rating !== '0' && (
              <span className="bg-green-600 px-2 py-1 rounded text-sm font-semibold">
                {typeof rating === 'number' ? rating.toFixed(1) : rating}
              </span>
            )}
            {year && <span className="text-gray-300">{year}</span>}
            {runtime && <span className="text-gray-300">{runtime} min</span>}
            {movie.metadata?.quality && (
              <span className="bg-blue-600 px-2 py-1 rounded text-xs font-semibold">
                {movie.metadata.quality}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handlePlay}
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-bold flex items-center transition-all hover:scale-105"
            >
              <PlayIcon className="w-5 h-5 mr-2" />
              Assistir Agora
            </button>
            
            <button className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-lg transition-all backdrop-blur-sm">
              <PlusIcon className="w-5 h-5" />
            </button>
            
            <button className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-lg transition-all backdrop-blur-sm">
              <ThumbUpIcon className="w-5 h-5" />
            </button>
            
            <button 
              onClick={handleShare}
              className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-lg transition-all backdrop-blur-sm"
            >
              <ShareIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <button
          onClick={onClose}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/50 hover:text-white transition-colors"
        >
          <ChevronDownIcon className="w-8 h-8 animate-bounce" />
        </button>
      </div>

      {}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-red-600/20 border-t-red-600 rounded-full animate-spin" />
        </div>
      )}

      {}
      {error && !loading && (
        <div className="text-center py-20">
          <p className="text-red-500 mb-2">{error}</p>
          <p className="text-gray-500 text-sm">Tente novamente mais tarde</p>
        </div>
      )}

      {}
      {!loading && !error && (
        <div className="p-8 md:p-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Sinopse</h2>
              <p className={`text-gray-300 leading-relaxed ${!showMore && 'line-clamp-4'}`}>
                {overview || 'Sinopse nÃ£o disponÃ­vel.'}
              </p>
              {overview && overview.length > 300 && (
                <button
                  onClick={() => setShowMore(!showMore)}
                  className="text-red-500 hover:text-red-400 mt-2 font-medium transition-colors"
                >
                  {showMore ? 'Mostrar menos' : 'Ler mais'}
                </button>
              )}
            </div>

            {}
            {cast.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-white mb-3">Elenco Principal</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {cast.slice(0, 8).map(actor => (
                    <div key={actor.id} className="flex items-center space-x-2">
                      {actor.profileUrl ? (
                        <img
                          src={actor.profileUrl}
                          alt={actor.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                          <span className="text-xs text-gray-500">?</span>
                        </div>
                      )}
                      <div>
                        <p className="text-white text-sm font-medium">{actor.name}</p>
                        <p className="text-gray-500 text-xs">{actor.character}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {}
            {director && (
              <div>
                <h3 className="text-lg font-bold text-white mb-2">DireÃ§Ã£o</h3>
                <p className="text-gray-300">{director}</p>
              </div>
            )}

            {}
            {videos.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-white mb-3">Trailers</h3>
                <div className="flex gap-3">
                  {videos.slice(0, 2).map(video => (
                    <a
                      key={video.id}
                      href={`https://www.youtube.com/watch?v=${video.key}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                    >
                      Assistir Trailer
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {}
          <div className="space-y-5">
            {genres.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">GÃªneros</h3>
                <div className="flex flex-wrap gap-2">
                  {genres.map(genre => (
                    <span key={genre.id} className="bg-zinc-800 text-gray-300 px-3 py-1 rounded-full text-sm">
                      {genre.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Idioma Original</h3>
              <p className="text-white">{displayData.originalLanguage?.toUpperCase() || 'PT'}</p>
            </div>

            {displayData.status && (
              <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Status</h3>
                <p className="text-white">{displayData.status === 'Released' ? 'LanÃ§ado' : displayData.status}</p>
              </div>
            )}

            {displayData.tagline && (
              <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Tagline</h3>
                <p className="text-white italic">"{displayData.tagline}"</p>
              </div>
            )}

            {displayData.homepage && (
              <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Site Oficial</h3>
                <a 
                  href={displayData.homepage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-red-500 hover:text-red-400 text-sm transition-colors"
                >
                  Visitar site â†’
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      <ActionModal
        isOpen={Boolean(shareFeedback)}
        title="Compartilhar"
        message={shareFeedback || ''}
        confirmText="OK"
        showCancel={false}
        onConfirm={() => setShareFeedback(null)}
        onClose={() => setShareFeedback(null)}
      />
    </motion.div>
  );
};

export default MovieDetails;
