

import { IndexedDBStorage } from './IndexedDBStorage';

const WATCH_HISTORY_KEY = 'watchHistoryLite';
const WATCH_PROGRESS_KEY = 'watchProgressLite';
const MAX_HISTORY_ENTRIES = 300;

export class StorageService {
  constructor() {
    this.db = new IndexedDBStorage();
  }

  
  async savePlaylist(playlist) {
    return await this.db.savePlaylist(playlist);
  }

  async getPlaylists() {
    return await this.db.getAllPlaylists();
  }

  async getPlaylist(id) {
    return await this.db.getPlaylist(id);
  }

  async updatePlaylist(id, updates) {
    return await this.db.updatePlaylist(id, updates);
  }

  async deletePlaylist(id) {
    return await this.db.deletePlaylist(id);
  }

  
  async getSettings() {
    const settings = {};
    const keys = ['theme', 'defaultQuality', 'autoplay', 'rememberProgress', 'language', 'volume', 'bufferProfile'];
    
    for (const key of keys) {
      settings[key] = await this.db.getSetting(key);
    }

    if (!settings.bufferProfile) {
      settings.bufferProfile = localStorage.getItem('zix.bufferProfile') || 'balanced';
    }
    
    return settings;
  }

  async updateSettings(settings) {
    for (const [key, value] of Object.entries(settings)) {
      await this.db.saveSetting(key, value);

      if (key === 'bufferProfile') {
        localStorage.setItem('zix.bufferProfile', value);
      }
    }
  }

  
  async toggleFavorite(item) {
    const existing = await this.db.favorites
      .where('itemId')
      .equals(item.id)
      .first();

    if (existing) {
      await this.db.removeFromFavorites(existing.id);
      return false;
    } else {
      await this.db.addToFavorites(item);
      return true;
    }
  }

  async getFavorites(type) {
    return await this.db.getFavorites(type);
  }

  
  async addToHistory(item) {
    return await this.db.addToHistory(item);
  }

  async getHistory(limit) {
    return await this.db.getHistory(limit);
  }

  async updateProgress(id, position) {
    return await this.db.updateWatchPosition(id, position);
  }

  async clearHistory() {
    return await this.db.clearHistory();
  }

  async getWatchHistory() {
    const raw = await this.db.getSetting(WATCH_HISTORY_KEY);
    if (!Array.isArray(raw)) return [];

    return [...raw]
      .sort((a, b) => {
        const aTime = new Date(a?.updatedAt || 0).getTime();
        const bTime = new Date(b?.updatedAt || 0).getTime();
        return bTime - aTime;
      });
  }

  async upsertWatchHistoryEntry(entry = {}) {
    const source = String(entry.source || '').trim();
    const type = String(entry.type || '').trim();
    if (!source || !type) return;

    const current = await this.getWatchHistory();
    const key = `${type}:${source}`;
    const nowIso = new Date().toISOString();

    const normalizedEntry = {
      key,
      type,
      source,
      title: entry.title || 'Sem titulo',
      position: Number.isFinite(Number(entry.position)) ? Number(entry.position) : 0,
      duration: Number.isFinite(Number(entry.duration)) ? Number(entry.duration) : 0,
      season: Number.isFinite(Number(entry.season)) ? Number(entry.season) : null,
      episode: Number.isFinite(Number(entry.episode)) ? Number(entry.episode) : null,
      thumbnail: entry.thumbnail || null,
      updatedAt: nowIso
    };

    const filtered = current.filter((item) => item?.key !== key);
    const next = [normalizedEntry, ...filtered].slice(0, MAX_HISTORY_ENTRIES);
    await this.db.saveSetting(WATCH_HISTORY_KEY, next);
  }

  async clearWatchHistory(types = []) {
    const normalizedTypes = Array.isArray(types)
      ? types.map((value) => String(value || '').trim().toLowerCase()).filter(Boolean)
      : [];

    if (normalizedTypes.length === 0) {
      await this.db.saveSetting(WATCH_HISTORY_KEY, []);
      return;
    }

    const current = await this.getWatchHistory();
    const next = current.filter((entry) => !normalizedTypes.includes(String(entry?.type || '').toLowerCase()));
    await this.db.saveSetting(WATCH_HISTORY_KEY, next);
  }

  async setWatchHistory(entries = []) {
    const normalized = Array.isArray(entries)
      ? entries.slice(0, MAX_HISTORY_ENTRIES)
      : [];
    await this.db.saveSetting(WATCH_HISTORY_KEY, normalized);
  }

  async saveWatchProgress(source, payload = {}) {
    const sourceKey = String(source || '').trim();
    if (!sourceKey) return;

    const current = await this.db.getSetting(WATCH_PROGRESS_KEY);
    const map = (current && typeof current === 'object' && !Array.isArray(current)) ? { ...current } : {};

    map[sourceKey] = {
      position: Number.isFinite(Number(payload.position)) ? Number(payload.position) : 0,
      duration: Number.isFinite(Number(payload.duration)) ? Number(payload.duration) : 0,
      type: payload.type || null,
      title: payload.title || null,
      updatedAt: new Date().toISOString()
    };

    await this.db.saveSetting(WATCH_PROGRESS_KEY, map);
  }

  async getWatchProgress(source) {
    const sourceKey = String(source || '').trim();
    if (!sourceKey) return null;

    const map = await this.db.getSetting(WATCH_PROGRESS_KEY);
    if (!map || typeof map !== 'object' || Array.isArray(map)) return null;
    return map[sourceKey] || null;
  }

  
  async exportData() {
    const data = {
      playlists: await this.getPlaylists(),
      settings: await this.getSettings(),
      favorites: await this.getFavorites(),
      history: await this.getHistory(1000)
    };
    
    return JSON.stringify(data);
  }

  async importData(jsonData) {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.playlists) {
        for (const playlist of data.playlists) {
          await this.savePlaylist(playlist);
        }
      }
      
      if (data.settings) {
        await this.updateSettings(data.settings);
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }
}
