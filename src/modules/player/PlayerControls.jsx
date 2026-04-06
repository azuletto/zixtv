

import React, { memo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  PlayIcon,
  PauseIcon,
  VolumeUpIcon,
  VolumeOffIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowsExpandIcon,
  ViewBoardsIcon,
  DesktopComputerIcon,
  AdjustmentsIcon
} from '@heroicons/react/outline';

const PlayerControls = ({
  isLive = false,
  isPlaying,
  onPlayPause,
  currentTime,
  duration,
  onSeek,
  volume,
  onVolumeChange,
  isMuted,
  onMute,
  onFullscreen,
  onCinemaMode,
  onMiniPlayer,
  bufferProfile,
  onBufferProfileChange
}) => {
  const [hoverTime, setHoverTime] = useState(currentTime);
  const [hoverPercent, setHoverPercent] = useState(0);
  const [isProgressHovering, setIsProgressHovering] = useState(false);
  const [isBufferMenuOpen, setIsBufferMenuOpen] = useState(false);

  const bufferOptions = [
    { value: 'small', label: 'Menor' },
    { value: 'balanced', label: 'Médio' },
    { value: 'large', label: 'Maior' },
    { value: 'xlarge', label: 'Máximo' }
  ];

  useEffect(() => {
    if (!isProgressHovering) {
      setHoverTime(currentTime);
    }
  }, [currentTime, isProgressHovering]);

  const formatTime = (seconds) => {
    if (!Number.isFinite(seconds) || seconds < 0) {
      return '00:00';
    }

    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const safeCurrentTime = Number.isFinite(currentTime) ? currentTime : 0;
  const safeDuration = Number.isFinite(duration) ? duration : 0;
  const hasValidTime = safeDuration > 0;
  const progress = hasValidTime ? (safeCurrentTime / safeDuration) * 100 : 0;

  const handleProgressMove = (event) => {
    const target = event.currentTarget;
    const rect = target.getBoundingClientRect();
    const position = Math.min(Math.max(event.clientX - rect.left, 0), rect.width);
    const percent = rect.width > 0 ? position / rect.width : 0;
    const nextTime = hasValidTime ? percent * safeDuration : 0;

    setHoverPercent(percent * 100);
    setHoverTime(nextTime);
  };

  return (
    <div className="space-y-2">
      {}
      <div className="relative group/progress">
        {isLive ? (
          <div className="w-full h-1 rounded-lg bg-red-600 cursor-default" />
        ) : (
          <>
            <input
              type="range"
              min="0"
              max={hasValidTime ? safeDuration : 100}
              value={hasValidTime ? safeCurrentTime : 0}
              onChange={(e) => onSeek(parseFloat(e.target.value))}
              onMouseEnter={(event) => {
                setIsProgressHovering(true);
                handleProgressMove(event);
              }}
              onMouseMove={handleProgressMove}
              onMouseLeave={() => setIsProgressHovering(false)}
              className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 
                [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-red-600 
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:opacity-0
                group-hover/progress:[&::-webkit-slider-thumb]:opacity-100"
              style={{
                background: `linear-gradient(to right, #E50914 ${progress}%, #4a4a4a ${progress}%)`
              }}
            />
            <div
              className={`absolute -top-8 bg-black/80 text-white px-2 py-1 rounded text-sm transition-opacity pointer-events-none ${isProgressHovering ? 'opacity-100' : 'opacity-0'}`}
              style={{ left: `${hoverPercent}%`, transform: 'translateX(-50%)' }}
            >
              {formatTime(hoverTime)} / {formatTime(safeDuration)}
            </div>
          </>
        )}
      </div>

      {}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {}
          <button
            onClick={onPlayPause}
            className="text-white hover:text-red-600 transition-colors cursor-pointer"
          >
            {isPlaying ? (
              <PauseIcon className="w-8 h-8" />
            ) : (
              <PlayIcon className="w-8 h-8" />
            )}
          </button>

          {!isLive && (
            <>
              {}
              <button className="text-white hover:text-red-600 transition-colors cursor-pointer">
                <ChevronLeftIcon className="w-6 h-6" />
                <span className="text-xs">10</span>
              </button>

              {}
              <button className="text-white hover:text-red-600 transition-colors cursor-pointer">
                <ChevronRightIcon className="w-6 h-6" />
                <span className="text-xs">10</span>
              </button>
            </>
          )}

          {}
          <div className="flex items-center space-x-2 group">
            <button
              onClick={onMute}
              className="text-white hover:text-red-600 transition-colors cursor-pointer"
            >
              {isMuted || volume === 0 ? (
                <VolumeOffIcon className="w-6 h-6" />
              ) : (
                <VolumeUpIcon className="w-6 h-6" />
              )}
            </button>
            
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-default
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 
                [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white 
                [&::-webkit-slider-thumb]:rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              style={{
                background: `linear-gradient(to right, white ${volume * 100}%, #4a4a4a ${volume * 100}%)`
              }}
            />
          </div>

          {}
          {isLive ? (
            <span className="bg-red-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center">
              <span className="w-1.5 h-1.5 bg-white rounded-full mr-1 animate-pulse" />
              AO VIVO
            </span>
          ) : (
            hasValidTime ? (
              <span className="text-white text-sm">
                {formatTime(safeCurrentTime)} / {formatTime(safeDuration)}
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 text-sm text-zinc-400">
                <span className="h-3 w-10 animate-pulse rounded bg-zinc-700" />
                <span>/</span>
                <span className="h-3 w-10 animate-pulse rounded bg-zinc-700" />
              </span>
            )
          )}
        </div>

        <div className="flex items-center space-x-4">
          {}
          <div className="relative">
            <button
              onClick={() => setIsBufferMenuOpen((prev) => !prev)}
              className="text-white hover:text-red-600 transition-colors cursor-pointer"
              aria-label="Buffer do player"
            >
              <AdjustmentsIcon className="w-6 h-6" />
            </button>

            {isBufferMenuOpen && (
              <div className="absolute bottom-full right-0 mb-2 min-w-40 rounded-lg border border-zinc-800 bg-black/95 p-2 shadow-xl z-50 pointer-events-auto">
                <div className="mb-2 px-2 text-[10px] uppercase tracking-wide text-zinc-500">Tamanho do buffer de renderização</div>
                <div className="space-y-1">
                  {bufferOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        onBufferProfileChange?.(option.value);
                        setIsBufferMenuOpen(false);
                      }}
                      className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                        bufferProfile === option.value
                          ? 'bg-red-600 text-white'
                          : 'text-zinc-300 hover:bg-zinc-800'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={onCinemaMode}
            className="text-white hover:text-red-600 transition-colors"
          >
            <ViewBoardsIcon className="w-6 h-6" />
          </button>

          {}
          <button
            onClick={onMiniPlayer}
            className="text-white hover:text-red-600 transition-colors"
          >
            <DesktopComputerIcon className="w-6 h-6" />
          </button>

          {}
          <button
            onClick={onFullscreen}
            className="text-white hover:text-red-600 transition-colors"
          >
            <ArrowsExpandIcon className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default memo(PlayerControls);
