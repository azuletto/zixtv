

export class M3UParser {
  async parse(url) {
    
    try {
      const response = await fetch(url);
      const content = await response.text();
      
      const lines = content.split('\n');
      const items = [];
      let currentItem = null;
      let itemIndex = 0;

      
      for (const line of lines) {
        if (line.startsWith('#EXTINF:')) {
          const info = this.parseExtInf(line);
          currentItem = {
            name: info.name,
            duration: info.duration,
            tvg: info.tvg,
            group: info.group,
            groupTitle: info.group,
            originalGroup: info.group,
            logo: info.logo,
            url: '',
            type: 'unknown'
          };
        } else if (line.trim() && !line.startsWith('#') && currentItem) {
          currentItem.url = line.trim();
          currentItem.uniqueId = `item-${itemIndex++}-${Date.now()}`;
          
          
          items.push(currentItem);
          currentItem = null;
        }
      }


      return {
        type: 'm3u',
        items: items.map(item => ({
          ...item,
          id: item.uniqueId,
        }))
      };
    } catch (error) {
      throw new Error(`Erro ao parsear M3U: ${error.message}`);
    }
  }

  parseExtInf(line) {
    const info = {
      duration: 0,
      name: '',
      tvg: {},
      group: 'General',
      logo: null,
      tmdbImageId: null
    };

    const extractImageIdFromUrl = (value) => {
      if (!value) return null;
      const match = value.match(/\/([^/]+)\.(?:jpg|jpeg|png|webp)(?:\?.*)?$/i);
      return match ? match[1] : null;
    };

    const durationMatch = line.match(/#EXTINF:(-?\d+)/);
    if (durationMatch) info.duration = parseInt(durationMatch[1]);

    const tvgIdMatch = line.match(/tvg-id="([^"]*)"/);
    if (tvgIdMatch) info.tvg.id = tvgIdMatch[1];

    const tvgNameMatch = line.match(/tvg-name="([^"]*)"/);
    if (tvgNameMatch) info.tvg.name = tvgNameMatch[1];

    const logoMatch = line.match(/tvg-logo="([^"]*)"/);
    if (logoMatch) {
      info.logo = logoMatch[1];
      info.tmdbImageId = extractImageIdFromUrl(info.logo);
      if (info.tmdbImageId) {
        info.tvg.tmdbImageId = info.tmdbImageId;
      }
    }

    const groupMatch = line.match(/group-title="([^"]*)"/);
    if (groupMatch) info.group = groupMatch[1];

    const nameMatch = line.match(/,([^,]+)$/);
    if (nameMatch) info.name = nameMatch[1].trim();

    return info;
  }
}
