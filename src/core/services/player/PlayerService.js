

import { HLSPlayer } from './HLSPlayer';

export class PlayerService {
  constructor(videoElement) {
    this.video = videoElement;
    this.hlsPlayer = null;
    this.currentSource = null;
    this.playbackRate = 1;
    this.volume = 1;
    this.isMuted = false;
    this.listeners = new Map();
  }

  initialize() {
    this.hlsPlayer = new HLSPlayer(this.video);
    this.setupHLSListeners();
    this.setupVideoListeners();
  }

  setupHLSListeners() {
    if (!this.hlsPlayer) return;

    this.hlsPlayer.on('manifestParsed', (qualities) => {
      this.emit('qualities', qualities);
    });

    this.hlsPlayer.on('levelSwitched', (level) => {
      this.emit('qualityChanged', level);
    });

    this.hlsPlayer.on('error', (error) => {
      this.emit('error', error);
    });

    this.hlsPlayer.on('bandwidth', (bandwidth) => {
      this.emit('bandwidth', bandwidth);
    });
  }

  setupVideoListeners() {
    if (!this.video) return;

    const events = [
      'play', 'pause', 'ended', 'waiting', 'playing',
      'seeking', 'seeked', 'timeupdate', 'volumechange',
      'loadedmetadata', 'progress', 'error'
    ];

    events.forEach(event => {
      this.video.addEventListener(event, (e) => {
        this.emit(event, e);
      });
    });
  }

  async loadSource(source, type = 'auto') {
    this.currentSource = source;

    if (type === 'hls' || source.endsWith('.m3u8')) {
      return this.loadHLS(source);
    } else {
      return this.loadDirect(source);
    }
  }

  loadHLS(url) {
    if (!this.hlsPlayer) {
      this.hlsPlayer = new HLSPlayer(this.video);
      this.setupHLSListeners();
    }

    const supported = this.hlsPlayer.loadSource(url);
    
    if (!supported) {
      
      return this.loadDirect(url);
    }

    return true;
  }

  loadDirect(url) {
    this.video.src = url;
    return true;
  }

  play() {
    return this.video.play();
  }

  pause() {
    this.video.pause();
  }

  togglePlay() {
    if (this.video.paused) {
      return this.play();
    } else {
      this.pause();
    }
  }

  seek(time) {
    this.video.currentTime = Math.max(0, Math.min(time, this.video.duration));
  }

  setVolume(value) {
    this.volume = Math.max(0, Math.min(1, value));
    this.video.volume = this.volume;
    this.isMuted = this.volume === 0;
  }

  setMuted(muted) {
    this.video.muted = muted;
    this.isMuted = muted;
  }

  toggleMute() {
    this.setMuted(!this.isMuted);
  }

  setPlaybackRate(rate) {
    this.playbackRate = rate;
    this.video.playbackRate = rate;
  }

  setQuality(level) {
    if (this.hlsPlayer) {
      this.hlsPlayer.setQuality(level);
    }
  }

  getQualities() {
    return this.hlsPlayer ? this.hlsPlayer.getQualities() : [];
  }

  getCurrentQuality() {
    return this.hlsPlayer ? this.hlsPlayer.getCurrentQuality() : -1;
  }

  getStats() {
    const stats = {
      duration: this.video.duration,
      currentTime: this.video.currentTime,
      volume: this.volume,
      muted: this.isMuted,
      playbackRate: this.playbackRate,
      paused: this.video.paused,
      ended: this.video.ended,
      buffered: this.getBufferedProgress()
    };

    if (this.hlsPlayer) {
      Object.assign(stats, this.hlsPlayer.getStats());
    }

    return stats;
  }

  getBufferedProgress() {
    if (!this.video || this.video.buffered.length === 0) return 0;
    
    const currentTime = this.video.currentTime;
    for (let i = 0; i < this.video.buffered.length; i++) {
      if (currentTime >= this.video.buffered.start(i) && 
          currentTime <= this.video.buffered.end(i)) {
        return (this.video.buffered.end(i) - this.video.buffered.start(i)) / this.video.duration;
      }
    }
    return 0;
  }

  recoverError() {
    if (this.hlsPlayer) {
      this.hlsPlayer.recoverError();
    }
  }

  destroy() {
    if (this.hlsPlayer) {
      this.hlsPlayer.destroy();
      this.hlsPlayer = null;
    }
    
    if (this.video) {
      this.video.pause();
      this.video.removeAttribute('src');
      this.video.load();
    }

    this.listeners.clear();
  }

  
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const listeners = this.listeners.get(event);
      const index = listeners.indexOf(callback);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => callback(data));
    }
  }
}
