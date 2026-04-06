

import Hls from 'hls.js';

export class HLSPlayer {
  constructor(videoElement) {
    this.video = videoElement;
    this.hls = null;
    this.qualityLevels = [];
    this.currentLevel = -1; 
    this.eventListeners = new Map();
  }

  loadSource(url) {
    if (this.hls) {
      this.destroy();
    }

    if (Hls.isSupported()) {
      this.hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
        maxBufferLength: 30,
        maxMaxBufferLength: 600,
        maxBufferSize: 60 * 1000 * 1000,
        maxBufferHole: 0.5,
        lowLatencyMode: false,
      });

      this.hls.loadSource(url);
      this.hls.attachMedia(this.video);

      this.setupEventListeners();
      this.setupQualityListeners();

      return true;
    } else if (this.video.canPlayType('application/vnd.apple.mpegurl')) {
      
      this.video.src = url;
      return true;
    }

    return false;
  }

  setupEventListeners() {
    if (!this.hls) return;

    this.hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
      this.qualityLevels = data.levels.map((level, index) => ({
        index,
        height: level.height,
        width: level.width,
        bitrate: level.bitrate,
        name: `${level.height}p`,
        codec: level.codec
      }));

      this.emit('manifestParsed', this.qualityLevels);
    });

    this.hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
      this.currentLevel = data.level;
      this.emit('levelSwitched', data.level);
    });

    this.hls.on(Hls.Events.ERROR, (event, data) => {
      this.emit('error', data);
    });

    this.hls.on(Hls.Events.FRAG_BUFFERED, (event, data) => {
      this.emit('progress', data);
    });
  }

  setupQualityListeners() {
    
    setInterval(() => {
      if (this.hls && this.currentLevel === -1) {
        const bandwidth = this.hls.bandwidthEstimate;
        this.emit('bandwidth', bandwidth);
      }
    }, 5000);
  }

  setQuality(level) {
    if (!this.hls) return;

    if (level === 'auto' || level === -1) {
      this.hls.currentLevel = -1;
      this.currentLevel = -1;
    } else {
      const levelIndex = typeof level === 'number' ? level : parseInt(level);
      if (levelIndex >= 0 && levelIndex < this.qualityLevels.length) {
        this.hls.currentLevel = levelIndex;
        this.currentLevel = levelIndex;
      }
    }
  }

  getCurrentQuality() {
    return this.currentLevel;
  }

  getQualities() {
    return this.qualityLevels;
  }

  getBandwidthEstimate() {
    return this.hls ? this.hls.bandwidthEstimate : 0;
  }

  recoverError() {
    if (this.hls) {
      this.hls.recoverMediaError();
    }
  }

  destroy() {
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }
    this.qualityLevels = [];
    this.currentLevel = -1;
    this.eventListeners.clear();
  }

  
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      const index = listeners.indexOf(callback);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => callback(data));
    }
  }

  
  getStats() {
    if (!this.hls) return null;

    return {
      bandwidth: this.hls.bandwidthEstimate,
      currentLevel: this.currentLevel,
      qualityLevels: this.qualityLevels.length,
      buffered: this.getBufferedRanges(),
      droppedFrames: this.hls.stats ? this.hls.stats.droppedFrames : 0
    };
  }

  getBufferedRanges() {
    const ranges = [];
    if (this.video && this.video.buffered.length > 0) {
      for (let i = 0; i < this.video.buffered.length; i++) {
        ranges.push({
          start: this.video.buffered.start(i),
          end: this.video.buffered.end(i)
        });
      }
    }
    return ranges;
  }
}
