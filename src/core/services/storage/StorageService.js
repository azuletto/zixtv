

import { IndexedDBStorage } from './IndexedDBStorage';

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
