

import React from 'react';
import { PlayIcon } from '/src/shared/icons/heroiconsOutlineCompat';

const FALLBACK_THUMB = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="480" height="270" viewBox="0 0 480 270"%3E%3Crect width="480" height="270" fill="%2318181b"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="16" fill="%23888888"%3ESem Imagem%3C/text%3E%3C/svg%3E';

const normalizeDescription = (value, fallback = 'Descrição não disponível') => {
  const raw = String(value || '').trim();
  if (!raw) return fallback;

  const fixed = raw
    .replace(/descri(?:Ã§|�)o/gi, 'descrição')
    .replace(/n(?:Ã£|�)o/gi, 'não')
    .replace(/dispon(?:Ã­|�)vel/gi, 'disponível')
    .trim();

  if (/^sem\s+descri/i.test(fixed)) {
    return 'Sem descrição disponível';
  }

  return fixed;
};

const EpisodeList = ({ episodes, onSelectEpisode }) => {
  return (
    <div className="space-y-3">
      {episodes.map((episode, index) => (
        <EpisodeItem
          key={episode.id || `${episode.season}-${episode.episode}-${index}`}
          episode={episode}
          index={index}
          onSelect={onSelectEpisode}
        />
      ))}
    </div>
  );
};

const EpisodeItem = ({ episode, index, onSelect }) => {
  const rating = typeof episode.rating === 'number' ? episode.rating.toFixed(1) : episode.rating;
  const sequenceLabel = typeof episode.sequence === 'number'
    ? `#${episode.sequence}`
    : `S${String(episode.season || 0).padStart(2, '0')}E${String(episode.episode || 0).padStart(2, '0')}`;
  const thumb = episode.posterUrl || episode.backdropUrl || FALLBACK_THUMB;

  return (
    <div
      onClick={() => onSelect(episode)}
      className="flex gap-4 bg-zinc-900/80 border border-zinc-800 hover:border-red-600/40 hover:bg-zinc-800 rounded-lg p-4 cursor-pointer transition-colors group"
    >
      <div className="flex items-center justify-center min-w-[58px] text-xs md:text-sm font-bold text-gray-400 group-hover:text-red-500 transition-colors">
        {sequenceLabel}
      </div>

      <div className="relative w-40 h-24 flex-shrink-0">
        <img
          src={thumb}
          alt={episode.name || `Episódio ${episode.sequence || episode.episode}`}
          className="w-full h-full object-cover rounded"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = FALLBACK_THUMB;
          }}
        />
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <PlayIcon className="w-8 h-8 text-white" />
        </div>
      </div>

      <div className="flex-1">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-white font-bold line-clamp-1">{episode.name || `Episódio ${episode.sequence || episode.episode}`}</h3>
          {episode.metadata?.duration && (
            <span className="text-gray-400 text-sm">
              {Math.floor(episode.metadata.duration / 60)} min
            </span>
          )}
        </div>
        
        <p className="text-gray-400 text-sm line-clamp-2">
          {normalizeDescription(episode.description)}
        </p>

        {rating && rating !== 'N/A' && (
          <div className="mt-2 flex items-center space-x-2">
            <span className="bg-yellow-500 text-black text-xs px-1 rounded">
              IMDb {rating}
            </span>
            {(episode.season || episode.episode) && (
              <span className="text-xs text-zinc-400">
                T{String(episode.season || 0).padStart(2, '0')} E{String(episode.episode || 0).padStart(2, '0')}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EpisodeList;


