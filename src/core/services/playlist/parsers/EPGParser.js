

export class EPGParser {
  isLikelyXmlContent(source) {
    if (typeof source !== 'string') return false;
    const trimmed = source.trim();
    if (!trimmed) return false;
    return trimmed.startsWith('<') || trimmed.includes('<?xml');
  }

  async fetchViaProxy(targetUrl) {
    const endpoints = ['/api/proxy/fetch', '/api/fetch'];
    let response = null;

    for (const endpoint of endpoints) {
      response = await fetch(`${endpoint}?url=${encodeURIComponent(targetUrl)}`);
      if (response.status !== 404) break;
    }

    if (!response.ok) {
      throw new Error(`Falha ao carregar EPG (${response.status})`);
    }

    return response.text();
  }

  async parse(source) {
    try {
      const xmlText = this.isLikelyXmlContent(source)
        ? source
        : await this.fetchViaProxy(source);
      
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
      
      const programmes = xmlDoc.getElementsByTagName('programme');
      const epgData = {};

      for (const programme of programmes) {
        const channelId = programme.getAttribute('channel');
        const start = programme.getAttribute('start');
        const stop = programme.getAttribute('stop');
        
        const title = programme.getElementsByTagName('title')[0]?.textContent;
        const desc = programme.getElementsByTagName('desc')[0]?.textContent;
        const category = programme.getElementsByTagName('category')[0]?.textContent;

        if (!epgData[channelId]) {
          epgData[channelId] = [];
        }

        epgData[channelId].push({
          start: this.parseXmlDate(start),
          stop: this.parseXmlDate(stop),
          title,
          description: desc,
          category
        });
      }

      return epgData;
    } catch (error) {
      return {};
    }
  }

  parseXmlDate(dateStr) {
    
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    const hour = dateStr.substring(8, 10);
    const minute = dateStr.substring(10, 12);
    const second = dateStr.substring(12, 14);

    return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`);
  }

  getCurrentProgramme(epgData, channelId) {
    const now = new Date();
    const programmes = epgData[channelId] || [];
    
    return programmes.find(p => p.start <= now && p.stop >= now);
  }

  getNextProgrammes(epgData, channelId, count = 5) {
    const now = new Date();
    const programmes = epgData[channelId] || [];
    
    return programmes
      .filter(p => p.start > now)
      .sort((a, b) => a.start - b.start)
      .slice(0, count);
  }
}
