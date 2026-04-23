

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import Hls from 'hls.js';
import mpegts from 'mpegts.js';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon } from '/src/shared/icons/heroiconsOutlineCompat';
import { usePlayerStore } from '../../app/store/playerStore';
import { StorageService } from '../../core/services/storage/StorageService';
import { resolveMediaUrl } from '../../core/services/network/proxy';
import PlayerControls from './PlayerControls';
import CinemaMode from './CinemaMode';
import MiniPlayer from './MiniPlayer';

const storageService = new StorageService();

const BUFFER_PROFILES = {
  small: {
    tsStashInitialSize: 512 * 1024,
    tsCleanupMaxBackward: 60,
    tsCleanupMinBackward: 30,
    hlsMaxBufferLengthLive: 45,
    hlsMaxMaxBufferLengthLive: 90,
    hlsBackBufferLengthLive: 60,
    hlsLiveSyncDurationCount: 6,
    hlsLiveMaxLatencyDurationCount: 12,
    waitingTimeoutLiveMs: 3000,
  },
  balanced: {
    tsStashInitialSize: 1024 * 1024,
    tsCleanupMaxBackward: 90,
    tsCleanupMinBackward: 45,
    hlsMaxBufferLengthLive: 60,
    hlsMaxMaxBufferLengthLive: 120,
    hlsBackBufferLengthLive: 90,
    hlsLiveSyncDurationCount: 9,
    hlsLiveMaxLatencyDurationCount: 18,
    waitingTimeoutLiveMs: 5000,
  },
  large: {
    tsStashInitialSize: 2048 * 1024,
    tsCleanupMaxBackward: 120,
    tsCleanupMinBackward: 60,
    hlsMaxBufferLengthLive: 90,
    hlsMaxMaxBufferLengthLive: 180,
    hlsBackBufferLengthLive: 120,
    hlsLiveSyncDurationCount: 12,
    hlsLiveMaxLatencyDurationCount: 24,
    waitingTimeoutLiveMs: 8000,
  },
  xlarge: {
    tsStashInitialSize: 4096 * 1024,
    tsCleanupMaxBackward: 180,
    tsCleanupMinBackward: 90,
    hlsMaxBufferLengthLive: 120,
    hlsMaxMaxBufferLengthLive: 240,
    hlsBackBufferLengthLive: 180,
    hlsLiveSyncDurationCount: 15,
    hlsLiveMaxLatencyDurationCount: 30,
    waitingTimeoutLiveMs: 12000,
  }
};

const BUFFER_PROFILE_ORDER = ['small', 'balanced', 'large', 'xlarge'];

const CustomPlayer = ({ source, title, type, metadata, tmdbData, onClose, startInCinema = false }) => {
  const UI_HIDE_DELAY_MS = 2800;

  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const hlsRef = useRef(null);
  const mpegtsRef = useRef(null);
  const autoplayRequestedRef = useRef(false);
  const hideUiTimeoutRef = useRef(null);
  const waitingTimerRef = useRef(null);
  const pendingLiveResumeRef = useRef(false);
  const recoveryRef = useRef({ attempts: 0, lastAttemptAt: 0, suggested: false });
  const lastTimeUpdateRef = useRef(0);
  const stallRecoveryRef = useRef(null);
  
  const [showControls, setShowControls] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [bufferProfile, setBufferProfile] = useState(() => localStorage.getItem('zix.bufferProfile') || 'balanced');
  
  const { mode, toggleMode, setMode, isMiniPlayer } = usePlayerStore();
  const isLiveContent = type === 'live';

  useEffect(() => {
    if (!startInCinema) return;

    setMode('cinema');

    return () => {
      setMode('normal');
    };
  }, [startInCinema, setMode]);

  const clearUiHideTimer = useCallback(() => {
    if (hideUiTimeoutRef.current) {
      clearTimeout(hideUiTimeoutRef.current);
      hideUiTimeoutRef.current = null;
    }
  }, []);

  const clearWaitingTimer = useCallback(() => {
    if (waitingTimerRef.current) {
      clearTimeout(waitingTimerRef.current);
      waitingTimerRef.current = null;
    }
  }, []);

  const getBufferProfileConfig = useCallback(() => BUFFER_PROFILES[bufferProfile] || BUFFER_PROFILES.balanced, [bufferProfile]);

  const setAndPersistBufferProfile = useCallback(async (nextProfile) => {
    if (!BUFFER_PROFILES[nextProfile] || nextProfile === bufferProfile) return;
    setBufferProfile(nextProfile);
    try {
      await storageService.updateSettings({ bufferProfile: nextProfile });
    } catch (error) {
    }
  }, [bufferProfile]);

  const recoverLivePlayback = useCallback((reason = 'unknown') => {
    const video = videoRef.current;
    if (!video || !isLiveContent) return;

    const now = Date.now();
    if (now - recoveryRef.current.lastAttemptAt < 2000) return;

    const attempts = recoveryRef.current.attempts + 1;
    recoveryRef.current = {
      attempts,
      lastAttemptAt: now,
      suggested: recoveryRef.current.suggested
    };

    
    if (stallRecoveryRef.current) {
      clearTimeout(stallRecoveryRef.current);
      stallRecoveryRef.current = null;
    }

    try {
      if (hlsRef.current) {
        
        hlsRef.current.stopLoad();
        setTimeout(() => {
          if (hlsRef.current) {
            hlsRef.current.startLoad();
          }
        }, 100);
      }

      if (mpegtsRef.current) {
        mpegtsRef.current.unload();
        setTimeout(() => {
          if (mpegtsRef.current) {
            mpegtsRef.current.load();
          }
        }, 100);
      }

      pendingLiveResumeRef.current = true;

      setTimeout(() => {
        if (videoRef.current && !videoRef.current.paused) {
          videoRef.current.play().catch(() => {});
        }
      }, 200);
    } catch (error) {
    }
  }, [isLiveContent]);

  const startWaitingRecovery = useCallback(() => {
    if (!isLiveContent) return;

    clearWaitingTimer();
    const profile = getBufferProfileConfig();
    waitingTimerRef.current = setTimeout(() => {
      if (videoRef.current && videoRef.current.readyState < 2) {
        setIsLoading(true);
        recoverLivePlayback('waiting-timeout');
      }
    }, profile.waitingTimeoutLiveMs);
  }, [isLiveContent, clearWaitingTimer, getBufferProfileConfig, recoverLivePlayback]);

  const scheduleUiHide = useCallback(() => {
    clearUiHideTimer();
    hideUiTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, UI_HIDE_DELAY_MS);
  }, [clearUiHideTimer]);

  const handleUserActivity = useCallback(() => {
    setShowControls(true);
    scheduleUiHide();
  }, [scheduleUiHide]);

  const handleTimeUpdate = useCallback(() => {
    if (isLiveContent) return;

    const now = performance.now();
    if (now - lastTimeUpdateRef.current < 250) return;
    lastTimeUpdateRef.current = now;

    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration);
    }
  }, [isLiveContent]);

  
  useEffect(() => {
    if (!isLiveContent || !isPlaying) return;

    let lastTime = videoRef.current?.currentTime || 0;
    let stallCount = 0;

    const checkStall = () => {
      const video = videoRef.current;
      if (!video || video.paused) return;

      const currentTime = video.currentTime;
      
      if (currentTime === lastTime && video.readyState < 3) {
        stallCount++;
        if (stallCount >= 3) {
          
          stallCount = 0;
          recoverLivePlayback('stall-detected');
        }
      } else {
        stallCount = Math.max(0, stallCount - 1);
        lastTime = currentTime;
      }
    };

    const interval = setInterval(checkStall, 2000);
    return () => clearInterval(interval);
  }, [isLiveContent, isPlaying, recoverLivePlayback]);

  
  useEffect(() => {
    let active = true;

    const loadBufferProfile = async () => {
      try {
        const saved = await storageService.getSettings();
        if (!active) return;

        if (saved?.bufferProfile && BUFFER_PROFILES[saved.bufferProfile]) {
          setBufferProfile(saved.bufferProfile);
        }
      } catch (error) {
      }
    };

    loadBufferProfile();

    return () => {
      active = false;
    };
  }, []);

  
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !source) return;
    const sourceLower = String(source).toLowerCase();
    const resolvedSource = resolveMediaUrl(source);
    const bufferConfig = getBufferProfileConfig();

    setIsLoading(true);
    setIsReady(false);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    autoplayRequestedRef.current = true;
    pendingLiveResumeRef.current = false;
    recoveryRef.current = { attempts: 0, lastAttemptAt: 0, suggested: recoveryRef.current.suggested };
    clearWaitingTimer();

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (mpegtsRef.current) {
      mpegtsRef.current.destroy();
      mpegtsRef.current = null;
    }

    const isHlsSource = sourceLower.includes('.m3u8');
    const isLikelyTsLive = isLiveContent && (
      /\.ts(\?|$)/i.test(source) ||
      sourceLower.includes('output=ts') ||
      sourceLower.includes('/live/')
    );

    video.preload = 'auto';
    video.playsInline = true;
    video.crossOrigin = 'anonymous';
    video.controlsList = 'nodownload';

    const isDirectFile = !isHlsSource && !isLiveContent && (
      source.endsWith('.mp4') ||
      source.endsWith('.mkv') ||
      source.endsWith('.avi') ||
      source.endsWith('.mov') ||
      source.endsWith('.webm')
    );

    if (isDirectFile) {
      video.src = resolvedSource;
      setIsReady(true);
      setIsLoading(false);
      return () => {};
    }

    if (isLikelyTsLive && mpegts.getFeatureList().mseLivePlayback) {
      try {
        const tsPlayer = mpegts.createPlayer(
          {
            type: 'mpegts',
            isLive: true,
            url: resolvedSource,
          },
          {
            enableWorker: false,
            lazyLoad: false,
            enableStashBuffer: true,
            stashInitialSize: bufferConfig.tsStashInitialSize,
            autoCleanupSourceBuffer: true,
            autoCleanupMaxBackwardDuration: bufferConfig.tsCleanupMaxBackward,
            autoCleanupMinBackwardDuration: bufferConfig.tsCleanupMinBackward,
            liveBufferLatencyChasing: false, 
            liveSync: false, 
            fixAudioTimestampGap: true,
            deferLoadAfterSourceOpen: true,
          }
        );

        tsPlayer.attachMediaElement(video);
        tsPlayer.load();
        mpegtsRef.current = tsPlayer;

        tsPlayer.on(mpegts.Events.ERROR, () => {
          setIsReady(false);
          setIsLoading(true);
          recoverLivePlayback('mpegts-error');
        });

        return () => {
          if (mpegtsRef.current) {
            mpegtsRef.current.destroy();
            mpegtsRef.current = null;
          }
        };
      } catch (error) {
      }
    }

    if (Hls.isSupported() && isHlsSource) {
      
      const hlsConfig = {
        enableWorker: true,
        lowLatencyMode: false, 
        capLevelToPlayerSize: true,
        maxBufferLength: bufferConfig.hlsMaxBufferLengthLive,
        maxMaxBufferLength: bufferConfig.hlsMaxMaxBufferLengthLive,
        backBufferLength: bufferConfig.hlsBackBufferLengthLive,
        liveSyncDurationCount: bufferConfig.hlsLiveSyncDurationCount,
        liveMaxLatencyDurationCount: bufferConfig.hlsLiveMaxLatencyDurationCount,
        maxBufferHole: 0.3, 
        highBufferWatchdogPeriod: 3, 
        maxBufferSize: 60 * 1000 * 1000, 
        maxFragLookUpTolerance: 0.5, 
        startFragPrefetch: false, 
        abrEwmaDefaultEstimate: 1e6,
        abrEwmaFastLive: 10, 
        abrEwmaSlowLive: 20, 
        abrBandWidthFactor: 0.95, 
        abrBandWidthUpFactor: 0.7, 
        minAutoBitrate: 0,
        autoStartLoad: true,
        startPosition: -1,
        debug: false,
      };
      
      const hls = new Hls(hlsConfig);
      
      hls.loadSource(resolvedSource);
      hls.attachMedia(video);
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (isLiveContent && video.paused && autoplayRequestedRef.current) {
          setTimeout(() => {
            if (videoRef.current && videoRef.current.paused) {
              videoRef.current.play().catch(() => {});
            }
          }, 100);
        }
      });
      
      hls.on(Hls.Events.FRAG_LOADED, () => {
        
        if (recoveryRef.current.attempts > 0) {
          recoveryRef.current.attempts = Math.max(0, recoveryRef.current.attempts - 1);
        }
      });
      
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (!data?.fatal) {
          
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            setTimeout(() => {
              if (hlsRef.current) {
                hlsRef.current.startLoad();
              }
            }, 500);
          }
          return;
        }

        setIsLoading(true);
        setIsReady(false);
        
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          setTimeout(() => {
            if (hlsRef.current) {
              hlsRef.current.startLoad();
              recoverLivePlayback('hls-network-error');
            }
          }, 1000);
          return;
        }

        if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          hls.recoverMediaError();
          return;
        }

        recoverLivePlayback('hls-fatal-error');
      });
      
      hlsRef.current = hls;
    }

    return () => {
      clearWaitingTimer();
      if (stallRecoveryRef.current) {
        clearTimeout(stallRecoveryRef.current);
      }
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (mpegtsRef.current) {
        mpegtsRef.current.destroy();
        mpegtsRef.current = null;
      }
    };
  }, [source, isLiveContent, bufferProfile, getBufferProfileConfig, clearWaitingTimer, recoverLivePlayback]);

  
  useEffect(() => {
    scheduleUiHide();

    return () => {
      clearUiHideTimer();
    };
  }, [bufferProfile, isLiveContent, scheduleUiHide, clearUiHideTimer]);

  
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onLoadedMetadata = () => {
      if (!isLiveContent) {
        setDuration(video.duration || 0);
      }
    };

    const onCanPlay = () => {
      setIsReady(true);
      setIsLoading(false);
      clearWaitingTimer();

      if (autoplayRequestedRef.current && video.paused) {
        video.play().then(() => {
          autoplayRequestedRef.current = false;
        }).catch(() => {
          setIsLoading(true);
        });
      }
    };

    const onPlaying = () => {
      setIsPlaying(true);
      setIsReady(true);
      setIsLoading(false);
      clearWaitingTimer();
      pendingLiveResumeRef.current = false;
      recoveryRef.current = { attempts: Math.max(0, recoveryRef.current.attempts - 1), lastAttemptAt: 0, suggested: recoveryRef.current.suggested };
      autoplayRequestedRef.current = false;
    };

    const onPause = () => {
      setIsPlaying(false);

      if (isLiveContent && pendingLiveResumeRef.current) {
        setIsLoading(true);
        setTimeout(() => {
          if (!videoRef.current) return;
          videoRef.current.play().catch(() => {
            setIsLoading(true);
          });
        }, 500);
      }
    };

    const onWaiting = () => {
      if (video.paused && !isLiveContent) return;

      setIsLoading(true);
      pendingLiveResumeRef.current = true;
      startWaitingRecovery();
    };

    const onSeeking = () => {
      setIsLoading(true);
    };

    const onSeeked = () => {
      if (isLiveContent) return;
      if (video.readyState >= 3) {
        setIsLoading(false);
      }
    };

    const onStalled = () => {
      pendingLiveResumeRef.current = true;
      setIsLoading(true);
      startWaitingRecovery();
      recoverLivePlayback('stalled');
    };

    const onError = () => {
      setIsReady(false);
      setIsLoading(true);
      setIsPlaying(false);
      pendingLiveResumeRef.current = true;
      autoplayRequestedRef.current = true;
      if (isLiveContent) {
        setTimeout(() => recoverLivePlayback('video-error'), 500);
      }
    };

    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('canplay', onCanPlay);
    video.addEventListener('playing', onPlaying);
    video.addEventListener('pause', onPause);
    video.addEventListener('seeking', onSeeking);
    video.addEventListener('seeked', onSeeked);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('stalled', onStalled);
    video.addEventListener('error', onError);

    return () => {
      clearWaitingTimer();
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('seeking', onSeeking);
      video.removeEventListener('seeked', onSeeked);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('stalled', onStalled);
      video.removeEventListener('error', onError);
    };
  }, [isLiveContent, clearWaitingTimer, startWaitingRecovery, recoverLivePlayback]);

  const togglePlay = useCallback(() => {
    if (!videoRef.current || !isReady) return;

    handleUserActivity();

    if (isLiveContent) {
      pendingLiveResumeRef.current = false;
      clearWaitingTimer();
    }

    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {
        setIsLoading(true);
      });
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [isReady, isLiveContent, handleUserActivity, clearWaitingTimer]);

  const handleSeek = useCallback((time) => {
    if (isLiveContent) return;
    setIsLoading(true);
    videoRef.current.currentTime = time;
    setCurrentTime(time);
  }, [isLiveContent]);

  const handleVolumeChange = useCallback((newVolume) => {
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  }, []);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
    setIsMuted(!isMuted);
  }, [isMuted]);

  const toggleFullscreen = useCallback(() => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  if (isMiniPlayer) {
    return (
      <MiniPlayer
        videoRef={videoRef}
        title={title}
        onClose={() => toggleMode('mini')}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative bg-black rounded-lg overflow-hidden group w-full aspect-[16/9] ${!showControls && isReady ? 'cursor-none' : 'cursor-default'}`}
      onMouseMove={handleUserActivity}
      onMouseLeave={() => {
        clearUiHideTimer();
        setShowControls(false);
      }}
      onMouseEnter={handleUserActivity}
    >
      <video
        ref={videoRef}
        className={`absolute inset-0 w-full h-full object-contain ${!showControls && isReady ? 'cursor-none' : 'cursor-default'}`}
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdate}
      />

      {(isLoading || !isReady) && (
        <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center bg-black/70">
          <div className="w-10 h-10 border-4 border-red-600/30 border-t-red-600 rounded-full animate-spin" />
        </div>
      )}

      <AnimatePresence>
          {showControls && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
              className="absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-black to-transparent p-4"
          >
            <PlayerControls
              isLive={type === 'live'}
              isPlaying={isPlaying}
              onPlayPause={togglePlay}
              currentTime={currentTime}
              duration={duration}
              onSeek={handleSeek}
              volume={volume}
              onVolumeChange={handleVolumeChange}
              isMuted={isMuted}
              onMute={toggleMute}
              onFullscreen={toggleFullscreen}
              onCinemaMode={() => toggleMode('cinema')}
              onMiniPlayer={() => toggleMode('mini')}
              bufferProfile={bufferProfile}
              onBufferProfileChange={(nextProfile) => {
                setAndPersistBufferProfile(nextProfile);
                if (isLiveContent) {
                  setIsLoading(true);
                  setTimeout(() => recoverLivePlayback('profile-change'), 500);
                }
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {showControls && (
        <div className="absolute top-4 left-4 z-30 text-white text-lg font-bold">
          {title}
        </div>
      )}

      {showControls && typeof onClose === 'function' && (
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-40 rounded-full bg-black/70 p-2 text-white transition-colors hover:text-red-500"
          aria-label="Fechar player"
        >
          <XIcon className="w-5 h-5" />
        </button>
      )}

      {mode === 'cinema' && (
        <CinemaMode
          title={title}
          metadata={metadata}
          type={type}
          tmdbData={tmdbData}
          onExit={() => toggleMode('cinema')}
        />
      )}
    </div>
  );
};

export default CustomPlayer;


