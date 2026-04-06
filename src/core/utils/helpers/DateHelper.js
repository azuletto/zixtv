

export class DateHelper {
  static formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  }

  static formatDate(date, format = 'DD/MM/YYYY') {
    const d = new Date(date);
    
    const formats = {
      'DD/MM/YYYY': `${d.getDate().toString().padStart(2, '0')}/${
        (d.getMonth() + 1).toString().padStart(2, '0')}/${
        d.getFullYear()}`,
      
      'YYYY-MM-DD': `${d.getFullYear()}-${
        (d.getMonth() + 1).toString().padStart(2, '0')}-${
        d.getDate().toString().padStart(2, '0')}`,
      
      'DD/MM': `${d.getDate().toString().padStart(2, '0')}/${
        (d.getMonth() + 1).toString().padStart(2, '0')}`,
      
      'HH:MM': `${d.getHours().toString().padStart(2, '0')}:${
        d.getMinutes().toString().padStart(2, '0')}`
    };

    return formats[format] || formats['DD/MM/YYYY'];
  }

  static timeAgo(date) {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    
    const intervals = {
      ano: 31536000,
      mês: 2592000,
      semana: 604800,
      dia: 86400,
      hora: 3600,
      minuto: 60,
      segundo: 1
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit);
      
      if (interval >= 1) {
        return `${interval} ${unit}${interval > 1 ? 's' : ''} atrás`;
      }
    }

    return 'agora mesmo';
  }

  static getWeekDay(date) {
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    return days[new Date(date).getDay()];
  }

  static isToday(date) {
    const today = new Date();
    const checkDate = new Date(date);
    
    return today.toDateString() === checkDate.toDateString();
  }
}
