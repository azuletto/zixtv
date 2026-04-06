

import Dexie from 'dexie';

export class IndexedDBStorage extends Dexie {
  constructor() {
    super('IPTVDatabase');
    
    this.version(1).stores({
      playlists: '++id, name, type, createdAt',
      settings: 'key',
      favorites: '++id, type, itemId, playlistId',
      history: '++id, itemId, type, watchedAt, position'
    });

    this.playlists = this.table('playlists');
    this.settings = this.table('settings');
    this.favorites = this.table('favorites');
    this.history = this.table('history');
  }

  async savePlaylist(playlist) {
    return await this.playlists.add(playlist);
  }

  async getAllPlaylists() {
    return await this.playlists.toArray();
  }

  async getPlaylist(id) {
    return await this.playlists.get(id);
  }

  async updatePlaylist(id, updates) {
    return await this.playlists.update(id, updates);
  }

  async deletePlaylist(id) {
    return await this.playlists.delete(id);
  }

  async saveSetting(key, value) {
    return await this.settings.put({ key, value });
  }

  async getSetting(key) {
    const setting = await this.settings.get(key);
    return setting?.value;
  }

  async addToFavorites(item) {
    return await this.favorites.add({
      ...item,
      addedAt: new Date().toISOString()
    });
  }

  async removeFromFavorites(id) {
    return await this.favorites.delete(id);
  }

  async getFavorites(type) {
    let query = this.favorites.toCollection();
    if (type) {
      query = this.favorites.where('type').equals(type);
    }
    return await query.toArray();
  }

  async addToHistory(item) {
    return await this.history.add({
      ...item,
      watchedAt: new Date().toISOString()
    });
  }

  async getHistory(limit = 50) {
    return await this.history
      .orderBy('watchedAt')
      .reverse()
      .limit(limit)
      .toArray();
  }

  async updateWatchPosition(id, position) {
    return await this.history.update(id, { position });
  }

  async clearHistory() {
    return await this.history.clear();
  }
}
