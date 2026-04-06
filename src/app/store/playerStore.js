
import { create } from 'zustand';

export const usePlayerStore = create((set, get) => ({
  
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.8,
  isMuted: false,
  playbackRate: 1,
  quality: 'auto',
  isFullscreen: false,
  isPlayerReady: false,
  error: null,
  currentSource: null,
  currentTitle: null,
  currentType: null, 
  
  
  mode: 'normal', 
  
  
  subtitleTrack: null,
  audioTrack: null,
  availableSubtitles: [],
  availableAudioTracks: [],
  
  
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setDuration: (duration) => set({ duration }),
  
  setVolume: (volume) => {
    const newVolume = Math.max(0, Math.min(1, volume));
    set({ volume: newVolume, isMuted: newVolume === 0 });
  },
  
  setIsMuted: (isMuted) => {
    const { volume } = get();
    if (isMuted) {
      set({ isMuted: true, previousVolume: volume });
    } else {
      const previousVolume = get().previousVolume || 0.8;
      set({ isMuted: false, volume: previousVolume });
    }
  },
  
  setPlaybackRate: (playbackRate) => set({ playbackRate }),
  setQuality: (quality) => set({ quality }),
  setIsFullscreen: (isFullscreen) => set({ isFullscreen }),
  setIsPlayerReady: (isPlayerReady) => set({ isPlayerReady }),
  setError: (error) => set({ error }),
  
  setCurrentSource: (source, title, type) => set({ 
    currentSource: source, 
    currentTitle: title, 
    currentType: type,
    error: null,
    isPlaying: true 
  }),
  
  setMode: (mode) => set({ mode }),
  
  toggleMode: (mode) => {
    const current = get().mode;
    if (current === mode) {
      set({ mode: 'normal' });
    } else {
      set({ mode });
    }
  },
  
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  
  seek: (time) => set({ currentTime: time }),
  
  volumeUp: () => {
    const { volume, setVolume } = get();
    setVolume(Math.min(1, volume + 0.1));
  },
  
  volumeDown: () => {
    const { volume, setVolume } = get();
    setVolume(Math.max(0, volume - 0.1));
  },
  
  toggleMute: () => {
    const { isMuted, setIsMuted } = get();
    setIsMuted(!isMuted);
  },
  
  
  setSubtitleTrack: (subtitleTrack) => set({ subtitleTrack }),
  setAvailableSubtitles: (availableSubtitles) => set({ availableSubtitles }),
  
  
  setAudioTrack: (audioTrack) => set({ audioTrack }),
  setAvailableAudioTracks: (availableAudioTracks) => set({ availableAudioTracks }),
  
  
  reset: () => set({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.8,
    isMuted: false,
    playbackRate: 1,
    quality: 'auto',
    isFullscreen: false,
    isPlayerReady: false,
    error: null,
    currentSource: null,
    currentTitle: null,
    currentType: null,
    mode: 'normal',
    subtitleTrack: null,
    audioTrack: null,
    availableSubtitles: [],
    availableAudioTracks: [],
  }),
}));

export default usePlayerStore;