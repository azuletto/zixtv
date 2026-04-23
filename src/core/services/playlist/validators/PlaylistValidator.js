

export class PlaylistValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }

  validate(playlistData) {
    this.errors = [];
    this.warnings = [];

    if (!playlistData) {
      this.errors.push('Dados da playlist não fornecidos');
      return { isValid: false, errors: this.errors, warnings: this.warnings };
    }

    
    this.validateType(playlistData.type);

    
    this.validateName(playlistData.name);

    
    switch (playlistData.type) {
      case 'm3u':
        this.validateM3U(playlistData);
        break;
      case 'xtream':
        this.validateXtream(playlistData);
        break;
      case 'file':
        this.validateFile(playlistData);
        break;
      default:
        this.errors.push('Tipo de playlist inválido');
    }

    
    if (playlistData.epgUrl) {
      this.validateEPG(playlistData.epgUrl);
    }

    return {
      isValid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings
    };
  }

  validateType(type) {
    const validTypes = ['m3u', 'xtream', 'file'];
    if (!validTypes.includes(type)) {
      this.errors.push(`Tipo de playlist inválido: ${type}`);
    }
  }

  validateName(name) {
    if (!name || name.trim() === '') {
      this.errors.push('Nome da playlist é obrigatório');
    } else if (name.length < 3) {
      this.errors.push('Nome da playlist deve ter pelo menos 3 caracteres');
    } else if (name.length > 100) {
      this.errors.push('Nome da playlist não pode ter mais de 100 caracteres');
    }
  }

  validateM3U(data) {
    if (!data.url) {
      this.errors.push('URL da playlist M3U é obrigatória');
      return;
    }

    
    try {
      const url = new URL(data.url);
      
      
      if (!['http:', 'https:'].includes(url.protocol)) {
        this.errors.push('URL deve usar protocolo HTTP ou HTTPS');
      }

      
      if (!url.pathname.endsWith('.m3u') && !url.pathname.endsWith('.m3u8')) {
        this.warnings.push('URL pode não ser um arquivo M3U válido');
      }
    } catch (error) {
      this.errors.push('URL inválida');
    }
  }

  validateXtream(data) {
    const required = ['url', 'username', 'password'];
    
    required.forEach(field => {
      if (!data[field]) {
        this.errors.push(`Campo ${field} é obrigatório para Xtream Codes`);
      }
    });

    if (data.url) {
      try {
        const url = new URL(data.url);
        if (!['http:', 'https:'].includes(url.protocol)) {
          this.errors.push('URL deve usar protocolo HTTP ou HTTPS');
        }
      } catch (error) {
        this.errors.push('URL inválida');
      }
    }

    
    if (data.username && data.username.length < 3) {
      this.errors.push('Usuário muito curto');
    }

    if (data.password && data.password.length < 3) {
      this.errors.push('Senha muito curta');
    }
  }

  validateFile(data) {
    if (!data.file) {
      this.errors.push('Arquivo é obrigatório');
      return;
    }

    
    const validExtensions = ['.m3u', '.m3u8', '.txt'];
    const fileName = data.file.name;
    const extension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();

    if (!validExtensions.includes(extension)) {
      this.errors.push('Arquivo deve ser do tipo M3U');
    }

    
    if (data.file.size > 10 * 1024 * 1024) {
      this.errors.push('Arquivo muito grande (máximo 10MB)');
    }
  }

  validateEPG(epgUrl) {
    try {
      const url = new URL(epgUrl);
      
      if (!['http:', 'https:'].includes(url.protocol)) {
        this.warnings.push('EPG: URL deve usar protocolo HTTP ou HTTPS');
      }

      const extension = url.pathname.substring(url.pathname.lastIndexOf('.')).toLowerCase();
      if (!['.xml', '.xml.gz'].includes(extension)) {
        this.warnings.push('EPG: URL pode não ser um arquivo XML válido');
      }
    } catch (error) {
      this.warnings.push('EPG: URL inválida - será ignorada');
    }
  }

  validateContent(items) {
    if (!items || items.length === 0) {
      this.warnings.push('Playlist não contém itens');
      return;
    }

    
    const invalidItems = items.filter(item => !item.url || !item.name);
    if (invalidItems.length > 0) {
      this.warnings.push(`${invalidItems.length} itens podem estar corrompidos`);
    }

    
    const types = {
      live: items.filter(i => i.type === 'live').length,
      movie: items.filter(i => i.type === 'vod').length,
      series: items.filter(i => i.type === 'series').length
    };

    return {
      total: items.length,
      valid: items.length - invalidItems.length,
      types
    };
  }

  
  validateStreamUrl(url) {
    try {
      const urlObj = new URL(url);
      
      
      if (!['http:', 'https:', 'rtmp:', 'rtsp:'].includes(urlObj.protocol)) {
        return { valid: false, reason: 'Protocolo não suportado' };
      }

      
      const validExtensions = ['.m3u8', '.mp4', '.mkv', '.avi', '.ts'];
      const extension = urlObj.pathname.substring(urlObj.pathname.lastIndexOf('.')).toLowerCase();
      
      if (validExtensions.includes(extension)) {
        return { valid: true, format: extension.substring(1) };
      }

      
      return { valid: true, format: 'live' };
    } catch (error) {
      return { valid: false, reason: 'URL inválida' };
    }
  }
}
