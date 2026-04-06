

export class StringHelper {
  static sanitizeFileName(name) {
    return name
      .replace(/[^a-z0-9]/gi, '_')
      .toLowerCase();
  }

  static extractSeasonEpisode(str) {
    const patterns = [
      /S(\d{2})E(\d{2})/i,
      /(\d+)x(\d+)/,
      /Season (\d+) Episode (\d+)/i,
      /Temporada (\d+) Epis[óo]dio (\d+)/i
    ];

    for (const pattern of patterns) {
      const match = str.match(pattern);
      if (match) {
        return {
          season: parseInt(match[1]),
          episode: parseInt(match[2])
        };
      }
    }

    return null;
  }

  static formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  static slugify(text) {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-');
  }

  static truncate(str, length, ending = '...') {
    if (str.length > length) {
      return str.substring(0, length - ending.length) + ending;
    }
    return str;
  }
}
