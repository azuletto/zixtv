

import { swProxyService } from '../../network/SWProxyService';

export class XtreamParser {
  async fetchJsonViaSW(targetUrl) {
    return swProxyService.fetchJson(targetUrl);
  }

  async parse({ url, username, password, server }) {
    
    const serverUrl = url || server;
    
    
    if (!serverUrl || typeof serverUrl !== 'string') {
      throw new Error('URL do servidor é obrigatória');
    }
    
    if (!username || typeof username !== 'string') {
      throw new Error('Usuário é obrigatório');
    }
    
    if (!password || typeof password !== 'string') {
      throw new Error('Senha é obrigatória');
    }
    
    try {
      
      let baseUrl = serverUrl.trim();
      if (!baseUrl) {
        throw new Error('URL do servidor inválida');
      }
      
      
      if (baseUrl.endsWith('/')) {
        baseUrl = baseUrl.slice(0, -1);
      }
      
      
      const userInfo = await this.fetchUserInfo(baseUrl, username, password);
      
      
      const liveStreams = await this.fetchLiveStreams(baseUrl, username, password);
      
      
      const vodStreams = await this.fetchVodStreams(baseUrl, username, password);
      
      
      const series = await this.fetchSeries(baseUrl, username, password);

      return {
        type: 'xtream',
        user: userInfo,
        items: [
          ...this.parseLiveStreams(liveStreams, baseUrl, username, password),
          ...this.parseVodStreams(vodStreams, baseUrl, username, password),
          ...this.parseSeries(series, baseUrl, username, password)
        ]
      };
    } catch (error) {
      throw new Error(`Erro ao parsear Xtream Codes: ${error.message}`);
    }
  }

  async fetchUserInfo(baseUrl, username, password) {
    const data = await this.fetchJsonViaSW(
      `${baseUrl}/player_api.php?username=${username}&password=${password}`
    );
    if (data.user_info === undefined) {
      throw new Error('Credenciais inválidas ou servidor não respondeu corretamente');
    }
    return data;
  }

  async fetchLiveStreams(baseUrl, username, password) {
    const data = await this.fetchJsonViaSW(
      `${baseUrl}/player_api.php?username=${username}&password=${password}&action=get_live_streams`
    );
    return Array.isArray(data) ? data : [];
  }

  async fetchVodStreams(baseUrl, username, password) {
    const data = await this.fetchJsonViaSW(
      `${baseUrl}/player_api.php?username=${username}&password=${password}&action=get_vod_streams`
    );
    return Array.isArray(data) ? data : [];
  }

  async fetchSeries(baseUrl, username, password) {
    const data = await this.fetchJsonViaSW(
      `${baseUrl}/player_api.php?username=${username}&password=${password}&action=get_series`
    );
    return Array.isArray(data) ? data : [];
  }

  parseLiveStreams(streams, baseUrl, username, password) {
    if (!Array.isArray(streams)) return [];
    return streams.map(stream => ({
      id: stream.stream_id,
      name: stream.name,
      type: 'live',
      url: `${baseUrl}/live/${username}/${password}/${stream.stream_id}.ts`,
      logo: stream.stream_icon,
      group: stream.category_name,
      epg: stream.epg_channel_id,
      metadata: {
        rating: stream.rating || 'N/A',
        description: stream.description || 'Sem descrição'
      }
    }));
  }

  parseVodStreams(streams, baseUrl, username, password) {
    if (!Array.isArray(streams)) return [];
    return streams.map(stream => ({
      id: stream.stream_id,
      name: stream.name,
      type: 'vod',
      url: `${baseUrl}/movie/${username}/${password}/${stream.stream_id}.${stream.container_extension || 'mp4'}`,
      logo: stream.stream_icon,
      group: stream.category_name,
      metadata: {
        rating: stream.rating || 'N/A',
        year: stream.year,
        genre: stream.genre,
        description: stream.plot || stream.description || 'Sem descrição',
        backdrop: stream.backdrop_path?.[0],
        poster: stream.stream_icon
      }
    }));
  }

  parseSeries(series, baseUrl, username, password) {
    if (!Array.isArray(series)) return [];
    return series.map(show => ({
      id: show.series_id,
      name: show.name,
      type: 'series',
      cover: show.cover,
      group: show.category_name,
      episodes: this.processEpisodes(show.episodes, baseUrl, username, password),
      metadata: {
        rating: show.rating || 'N/A',
        year: show.year,
        genre: show.genre,
        description: show.plot || show.description || 'Sem descrição',
        backdrop: show.backdrop_path?.[0],
        poster: show.cover
      }
    }));
  }

  processEpisodes(episodes, baseUrl, username, password) {
    const processed = [];
    
    if (!episodes || typeof episodes !== 'object') return processed;
    
    for (const [seasonNum, seasonData] of Object.entries(episodes)) {
      if (!Array.isArray(seasonData)) continue;
      seasonData.forEach(episode => {
        if (!episode) return;
        processed.push({
          id: episode.id,
          name: episode.title,
          season: parseInt(seasonNum),
          episode: episode.episode_num,
          url: `${baseUrl}/series/${username}/${password}/${episode.id}.${episode.container_extension || 'mp4'}`,
          cover: episode.info?.movie_image,
          metadata: {
            description: episode.info?.plot || episode.info?.description,
            duration: episode.info?.duration,
            rating: episode.info?.rating
          }
        });
      });
    }

    return processed.sort((a, b) => {
      if (a.season !== b.season) return a.season - b.season;
      return a.episode - b.episode;
    });
  }
}