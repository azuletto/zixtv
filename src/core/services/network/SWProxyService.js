const SW_PROXY_ENDPOINT = '/sw-proxy';

export class SWProxyService {
  static async ensureReady() {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      throw new Error('Service Worker nao suportado neste navegador.');
    }

    if (navigator.serviceWorker.controller) {
      return;
    }

    await navigator.serviceWorker.ready;

    if (navigator.serviceWorker.controller) {
      return;
    }

    await new Promise((resolve) => {
      let settled = false;

      const cleanup = () => {
        navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
      };

      const onControllerChange = () => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve();
      };

      navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

      setTimeout(() => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve();
      }, 4000);
    });

    if (!navigator.serviceWorker.controller) {
      throw new Error('Service Worker ainda nao controla esta aba. Recarregue e tente novamente.');
    }
  }

  static async fetchText(targetUrl) {
    return this.fetchViaServiceWorker(targetUrl, 'text');
  }

  static async fetchJson(targetUrl) {
    return this.fetchViaServiceWorker(targetUrl, 'json');
  }

  static async fetchViaServiceWorker(targetUrl, type = 'text') {
    if (typeof targetUrl !== 'string' || !targetUrl.trim()) {
      throw new Error('URL de destino invalida.');
    }

    await this.ensureReady();

    const requestUrl = `${SW_PROXY_ENDPOINT}?url=${encodeURIComponent(targetUrl.trim())}&type=${encodeURIComponent(type)}`;
    const response = await fetch(requestUrl, {
      method: 'GET',
      cache: 'no-store'
    });

    if (!response.ok) {
      let message = `Falha na requisicao via Service Worker (${response.status})`;

      try {
        const payload = await response.json();
        if (payload?.error) {
          message = payload.error;
        }
      } catch (_) {
        // Keep fallback message when payload is not JSON.
      }

      throw new Error(message);
    }

    if (type === 'json') {
      return response.json();
    }

    return response.text();
  }
}

export const swProxyService = SWProxyService;