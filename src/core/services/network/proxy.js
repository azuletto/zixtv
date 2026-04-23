const DEFAULT_PROXY_PATH = '/api/proxy';

const getProxyBaseUrl = () => {
  const configuredBase = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_PROXY_BASE_URL : '';

  if (configuredBase) {
    return String(configuredBase).replace(/\/$/, '');
  }

  return '';
};

const getProxyEndpoint = () => {
  const baseUrl = getProxyBaseUrl();
  if (baseUrl) {
    return `${baseUrl}${DEFAULT_PROXY_PATH}`;
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${DEFAULT_PROXY_PATH}`;
  }

  return DEFAULT_PROXY_PATH;
};

export const isAbsoluteNetworkUrl = (url = '') => {
  if (typeof url !== 'string' || !url.trim()) return false;

  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (error) {
    return false;
  }
};

export const shouldProxyUrl = (url = '') => {
  if (!isAbsoluteNetworkUrl(url)) return false;
  if (typeof window === 'undefined') return false;

  const forceProxy = typeof import.meta !== 'undefined' && import.meta.env?.VITE_FORCE_PROXY === 'true';
  const parsed = new URL(url.trim());

  return (window.location.protocol === 'https:' || forceProxy) && parsed.protocol === 'http:';
};

export const buildProxyUrl = (url = '') => {
  if (!isAbsoluteNetworkUrl(url)) return url;

  const endpoint = getProxyEndpoint();
  return `${endpoint}?url=${encodeURIComponent(String(url).trim())}`;
};

export const resolveMediaUrl = (url = '') => {
  if (!url) return url;
  if (!isAbsoluteNetworkUrl(url)) return url;

  return buildProxyUrl(url);
};

export const resolvePlaylistSource = (source = '') => {
  if (!source) return source;

  if (!isAbsoluteNetworkUrl(source)) {
    return source;
  }

  return buildProxyUrl(source);
};