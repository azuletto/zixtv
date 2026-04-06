

import { useState, useRef, useEffect } from 'react';
import { usePlayerStore } from '../../app/store/playerStore';
import { StorageService } from '../../core/services/storage/StorageService';

const storageService = new StorageService();

export const usePlayer = (item) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [qualities, setQualities] = useState([]);
  const [currentQuality, setCurrentQuality] = useState('auto');
  const [buffering, setBuffering] = useState(false);
  
  const { mode, toggleMode } = usePlayerStore();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      saveProgress(video.currentTime);
    };

    const onDurationChange = () => {
      setDuration(video.duration);
    };

    const onPlaying = () => {
      setIsPlaying(true);
      setBuffering(false);
    };

    const onPause = () => {
      setIsPlaying(false);
    };

    const onWaiting = () => {
      setBuffering(true);
    };

    const onVolumeChange = () => {
      setVolume(video.volume);
      setIsMuted(video.muted);
    };

    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('durationchange', onDurationChange);
    video.addEventListener('playing', onPlaying);
    video.addEventListener('pause', onPause);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('volumechange', onVolumeChange);

    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('durationchange', onDurationChange);
      video.removeEventListener('playing', onPlaying);
      video.addEventListener('pause', onPause);
      video.addEventListener('waiting', onWaiting);
      video.removeEventListener('volumechange', onVolumeChange);
    };
  }, []);

  const saveProgress = async (time) => {
    if (item && time > 0) {
      await storageService.addToHistory({
        itemId: item.id,
        type: item.type,
        position: time,
        duration: duration
      });
    }
  };

  const togglePlay = () => {
    if (videoRef.current.paused) {
      videoRef.current.play();
    } else {
      videoRef.current.pause();
    }
  };

  const seek = (time) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const setVolumeLevel = (level) => {
    if (videoRef.current) {
      videoRef.current.volume = level;
      setVolume(level);
      setIsMuted(level === 0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      videoRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
    setIsFullscreen(!isFullscreen);
  };

  const changeQuality = (quality) => {
    setCurrentQuality(quality);
    
  };

  const skipForward = (seconds = 10) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
  };

  const skipBackward = (seconds = 10) => {
    if (videoRef.current) {
      videoRef.current.currentTime -= seconds;
    }
  };

  return {
    videoRef,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isFullscreen,
    qualities,
    currentQuality,
    buffering,
    mode,
    togglePlay,
    seek,
    setVolume: setVolumeLevel,
    toggleMute,
    toggleFullscreen,
    changeQuality,
    skipForward,
    skipBackward,
    toggleCinemaMode: () => toggleMode('cinema'),
    toggleMiniPlayer: () => toggleMode('mini')
  };
};
