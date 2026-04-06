

export class GenreParser {
  constructor() {
    this.genreMap = new Map([
      
      ['action', 'Ação'],
      ['acao', 'Ação'],
      ['accion', 'Ação'],
      
      
      ['adventure', 'Aventura'],
      ['aventura', 'Aventura'],
      
      
      ['comedy', 'Comédia'],
      ['comedia', 'Comédia'],
      ['comique', 'Comédia'],
      
      
      ['drama', 'Drama'],
      
      
      ['horror', 'Terror'],
      ['terror', 'Terror'],
      ['horreur', 'Terror'],
      
      
      ['sci-fi', 'Ficção Científica'],
      ['scifi', 'Ficção Científica'],
      ['science fiction', 'Ficção Científica'],
      ['ficcao', 'Ficção Científica'],
      
      
      ['romance', 'Romance'],
      ['romantic', 'Romance'],
      
      
      ['documentary', 'Documentário'],
      ['documentario', 'Documentário'],
      ['documental', 'Documentário'],
      
      
      ['animation', 'Animação'],
      ['animacao', 'Animação'],
      ['animated', 'Animação'],
      
      
      ['thriller', 'Suspense'],
      ['suspense', 'Suspense'],
      
      
      ['fantasy', 'Fantasia'],
      ['fantasia', 'Fantasia'],
      
      
      ['war', 'Guerra'],
      ['guerra', 'Guerra'],
      
      
      ['western', 'Faroeste'],
      ['faroeste', 'Faroeste'],
      
      
      ['musical', 'Musical'],
      
      
      ['sport', 'Esporte'],
      ['esporte', 'Esporte'],
      ['sports', 'Esporte'],
      
      
      ['news', 'Notícias'],
      ['noticias', 'Notícias'],
      ['jornal', 'Notícias'],
      
      
      ['kids', 'Infantil'],
      ['infantil', 'Infantil'],
      ['children', 'Infantil'],
      
      
      ['reality', 'Reality Show'],
      
      
      ['talk', 'Talk Show'],
      
      
      ['game', 'Game Show'],
      
      
      ['nature', 'Natureza'],
      ['natureza', 'Natureza'],
      ['animal', 'Natureza'],
      
      
      ['history', 'História'],
      ['historia', 'História'],
      ['historical', 'História']
    ]);

    this.countryMap = new Map([
      ['br', 'Brasil'],
      ['brazil', 'Brasil'],
      ['brasil', 'Brasil'],
      ['us', 'EUA'],
      ['usa', 'EUA'],
      ['uk', 'Reino Unido'],
      ['gb', 'Reino Unido'],
      ['fr', 'França'],
      ['france', 'França'],
      ['de', 'Alemanha'],
      ['germany', 'Alemanha'],
      ['it', 'Itália'],
      ['italy', 'Itália'],
      ['es', 'Espanha'],
      ['spain', 'Espanha'],
      ['jp', 'Japão'],
      ['japan', 'Japão'],
      ['kr', 'Coreia do Sul'],
      ['korea', 'Coreia do Sul']
    ]);
  }

  parse(genreString) {
    if (!genreString) return 'Geral';

    const normalized = genreString.toLowerCase().trim();
    
    
    if (this.genreMap.has(normalized)) {
      return this.genreMap.get(normalized);
    }

    
    for (const [key, value] of this.genreMap.entries()) {
      if (normalized.includes(key)) {
        return value;
      }
    }

    
    if (normalized.includes(',') || normalized.includes('|') || normalized.includes('/')) {
      const separators = /[,|/]/;
      const genres = normalized.split(separators)
        .map(g => g.trim())
        .filter(g => g.length > 0)
        .map(g => this.parse(g))
        .filter(g => g !== 'Geral');

      if (genres.length > 0) {
        return genres.join(', ');
      }
    }

    return this.capitalize(genreString);
  }

  parseCountry(countryString) {
    if (!countryString) return null;

    const normalized = countryString.toLowerCase().trim();
    
    if (this.countryMap.has(normalized)) {
      return this.countryMap.get(normalized);
    }

    for (const [key, value] of this.countryMap.entries()) {
      if (normalized.includes(key)) {
        return value;
      }
    }

    return this.capitalize(countryString);
  }

  getCommonGenres() {
    return Array.from(new Set(this.genreMap.values())).sort();
  }

  categorizeByGenre(items) {
    const categorized = new Map();

    items.forEach(item => {
      const genre = item.metadata?.genre || 'Geral';
      if (!categorized.has(genre)) {
        categorized.set(genre, []);
      }
      categorized.get(genre).push(item);
    });

    
    return new Map(
      Array.from(categorized.entries())
        .sort((a, b) => b[1].length - a[1].length)
    );
  }

  capitalize(str) {
    return str
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
}
