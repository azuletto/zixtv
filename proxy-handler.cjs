const http = require('http');
const https = require('https');
const { URL } = require('url');
const { pipeline } = require('stream');

const HTTP_AGENT = new http.Agent({ keepAlive: false, maxSockets: 128 });
const HTTPS_AGENT = new https.Agent({ keepAlive: false, maxSockets: 128 });

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(String(value || ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const CONNECT_TIMEOUT_MS = parsePositiveInt(process.env.PROXY_CONNECT_TIMEOUT_MS, 15000);
const FIRST_BYTE_TIMEOUT_MS = parsePositiveInt(process.env.PROXY_FIRST_BYTE_TIMEOUT_MS, 20000);
const SOCKET_IDLE_TIMEOUT_MS = parsePositiveInt(process.env.PROXY_SOCKET_IDLE_TIMEOUT_MS, 120000);
const STREAM_IDLE_TIMEOUT_MS = parsePositiveInt(process.env.PROXY_STREAM_IDLE_TIMEOUT_MS, 180000);
const MAX_RETRIES = parsePositiveInt(process.env.PROXY_MAX_RETRIES, 1);
const RETRY_DELAY_MS = parsePositiveInt(process.env.PROXY_RETRY_DELAY_MS, 400);

const RETRYABLE_CODES = new Set(['ECONNRESET', 'ECONNREFUSED', 'EHOSTUNREACH', 'ENETUNREACH']);
const NETWORK_CODES = new Set(['ETIMEDOUT', 'ECONNREFUSED', 'EHOSTUNREACH', 'ENETUNREACH', 'ENOTFOUND', 'ECONNRESET']);

const HEADER_PROFILES = [
  {
    name: 'vlc',
    headers: {
      'User-Agent': 'VLC/3.0.18 LibVLC/3.0.18',
      Accept: '*/*',
      Connection: 'close'
    }
  },
  {
    name: 'browser',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      Connection: 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Cache-Control': 'max-age=0',
      DNT: '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Sec-CH-UA': '"Chromium";v="124", "Google Chrome";v="124", ";Not A Brand";v="99"',
      'Sec-CH-UA-Mobile': '?0',
      'Sec-CH-UA-Platform': '"Windows"'
    }
  },
    {
      name: 'firefox',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0',
        Accept: '*/*',
        'Accept-Language': 'pt-BR,pt;q=0.9',
        Connection: 'close'
      }
    },
  {
    name: 'minimal',
    headers: {
      'User-Agent': 'Mozilla/5.0',
      Accept: '*/*',
      Connection: 'close'
    }
  }
];

const passthroughHeaders = [
  'content-type',
  'content-encoding',
  'content-disposition',
  'content-language',
  'content-length',
  'content-range',
  'last-modified',
  'etag',
  'accept-ranges',
  'vary'
];

const sanitizeHeaderValue = (value) => {
  if (value === null || value === undefined) return '';
  const str = Array.isArray(value) ? value.join(', ') : String(value);
  return str.replace(/[\r\n\0]/g, '').trim().slice(0, 8192);
};

const isClientAbort = (err) => {
  const message = String(err?.message || '').toLowerCase();
  return err?.code === 'ERR_CLIENT_ABORTED' || message.includes('client aborted request') || message.includes('aborted by client');
};

const isTimeoutError = (err) => {
  const message = String(err?.message || '').toLowerCase();
  return err?.code === 'ETIMEDOUT' || message.includes('timeout') || message.includes('timed out');
};

const buildResponseHeaders = (upstreamRes, req) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
    'X-Content-Type-Options': 'nosniff',
    'X-Accel-Buffering': 'no'
  };

  for (const name of passthroughHeaders) {
    const value = sanitizeHeaderValue(upstreamRes.headers[name]);
    if (value) {
      headers[name] = value;
    }
  }

  if (!headers['content-type']) {
    headers['content-type'] = 'application/octet-stream';
  }

  if (headers['content-length']) {
    const length = Number.parseInt(headers['content-length'], 10);
    if (!Number.isFinite(length) || length < 0) {
      delete headers['content-length'];
    }
  }

  if (!headers['accept-ranges']) {
    headers['accept-ranges'] = 'bytes';
  }

  if (upstreamRes.headers['transfer-encoding']?.includes('chunk')) {
    delete headers['content-length'];
     const isHttp2 = req.httpVersionMajor >= 2;
     if (!isHttp2) {
       headers['transfer-encoding'] = 'chunked';
     }
  }

  return headers;
};

const buildUpstreamHeaders = (req, targetUrl, profile = HEADER_PROFILES[0]) => {
  const headers = {
    Host: targetUrl.host,
    ...profile.headers
  };

  if (req.headers['accept-language']) headers['Accept-Language'] = req.headers['accept-language'];
  if (req.headers.range) headers.Range = req.headers.range;
  if (req.headers.cookie) headers.Cookie = req.headers.cookie;
  if (!req.headers['accept-encoding']) headers['Accept-Encoding'] = 'identity';

  return headers;
};

const requestUpstream = (targetUrl, req, res, context, redirectsLeft = 3, attempt = 0, profileIndex = 0) => {
  return new Promise((resolve, reject) => {
    if (context.aborted || req.aborted) {
      const err = new Error('Client aborted request');
      err.code = 'ERR_CLIENT_ABORTED';
      reject(err);
      return;
    }

    const transport = targetUrl.protocol === 'https:' ? https : http;
    const isHttps = targetUrl.protocol === 'https:';
    const port = targetUrl.port || (isHttps ? 443 : 80);
    const requestId = context.id;

    const options = {
      protocol: targetUrl.protocol,
      hostname: targetUrl.hostname,
      port,
      family: 4,
      method: 'GET',
      path: `${targetUrl.pathname}${targetUrl.search}`,
      headers: buildUpstreamHeaders(req, targetUrl, HEADER_PROFILES[profileIndex] || HEADER_PROFILES[0]),
      agent: isHttps ? HTTPS_AGENT : HTTP_AGENT,
      servername: isHttps ? targetUrl.hostname : undefined,
      ALPNProtocols: isHttps ? ['http/1.1'] : undefined,
      rejectUnauthorized: process.env.PROXY_TLS_INSECURE === 'true' ? false : undefined
    };

    const startedAt = Date.now();
    const isRange = Boolean(req.headers.range);

    let settled = false;
    let connectTimer = null;
    let firstByteTimer = null;
    let streamIdleTimer = null;

    const cleanup = () => {
      if (connectTimer) clearTimeout(connectTimer);
      if (firstByteTimer) clearTimeout(firstByteTimer);
      if (streamIdleTimer) clearTimeout(streamIdleTimer);
      connectTimer = null;
      firstByteTimer = null;
      streamIdleTimer = null;
    };

    const doneResolve = () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve();
    };

    const doneReject = (err) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(err);
    };

    const profileName = HEADER_PROFILES[profileIndex]?.name || 'default';
    console.log(`${requestId} [PROXY] CONNECT ${targetUrl.hostname}:${port} attempt=${attempt + 1}/${MAX_RETRIES + 1} profile=${profileName}${isRange ? ' range' : ''}`);

    const upstreamReq = transport.request(options, (upstreamRes) => {
      if (firstByteTimer) clearTimeout(firstByteTimer);

      const statusCode = upstreamRes.statusCode || 500;
      const elapsed = Date.now() - startedAt;
      console.log(`${requestId} [PROXY] RESPONSE ${statusCode} in=${elapsed}ms`);

      if (statusCode >= 300 && statusCode < 400 && upstreamRes.headers.location && redirectsLeft > 0) {
        upstreamRes.resume();
        const redirectedUrl = new URL(upstreamRes.headers.location, targetUrl.toString());
        console.log(`${requestId} [PROXY] REDIRECT -> ${redirectedUrl.toString()}`);
        requestUpstream(redirectedUrl, req, res, context, redirectsLeft - 1, attempt, profileIndex).then(doneResolve).catch(doneReject);
        return;
      }

      let headers;
      try {
        headers = buildResponseHeaders(upstreamRes, req);
     } catch (error) {
        doneReject(new Error(`Failed to build headers: ${error.message}`));
        upstreamRes.destroy();
        upstreamReq.destroy();
        return;
      }

      try {
        res.writeHead(statusCode, headers);
      } catch (error) {
        doneReject(new Error(`Failed to write headers: ${error.message}`));
        upstreamRes.destroy();
        upstreamReq.destroy();
        return;
      }

      const armStreamIdle = () => {
        if (streamIdleTimer) clearTimeout(streamIdleTimer);
        streamIdleTimer = setTimeout(() => {
          const timeoutErr = new Error('Upstream stream idle timeout');
          timeoutErr.code = 'ETIMEDOUT';
          upstreamReq.destroy(timeoutErr);
        }, STREAM_IDLE_TIMEOUT_MS);
      };

      armStreamIdle();
      upstreamRes.on('data', armStreamIdle);

      upstreamRes.on('error', (error) => {
        doneReject(error);
      });

      if (statusCode === 204 || statusCode === 304) {
        res.end();
        doneResolve();
        return;
      }

      pipeline(upstreamRes, res, (error) => {
        if (error) {
          if (context.aborted || req.aborted || isClientAbort(error)) {
            const abortErr = new Error('Client aborted request');
            abortErr.code = 'ERR_CLIENT_ABORTED';
            doneReject(abortErr);
            return;
          }
          doneReject(error);
          return;
        }

        doneResolve();
      });
    });

    connectTimer = setTimeout(() => {
      const timeoutErr = new Error('Upstream connect timeout');
      timeoutErr.code = 'ETIMEDOUT';
      upstreamReq.destroy(timeoutErr);
    }, CONNECT_TIMEOUT_MS);

    upstreamReq.on('socket', (socket) => {
      socket.setTimeout(SOCKET_IDLE_TIMEOUT_MS, () => {
        const timeoutErr = new Error('Upstream socket idle timeout');
        timeoutErr.code = 'ETIMEDOUT';
        upstreamReq.destroy(timeoutErr);
      });

      const onConnected = () => {
        if (connectTimer) clearTimeout(connectTimer);
        firstByteTimer = setTimeout(() => {
          const timeoutErr = new Error('Upstream first byte timeout');
          timeoutErr.code = 'ETIMEDOUT';
          upstreamReq.destroy(timeoutErr);
        }, FIRST_BYTE_TIMEOUT_MS);
      };

      if (socket.connecting) {
        if (isHttps) {
          socket.once('secureConnect', onConnected);
        } else {
          socket.once('connect', onConnected);
        }
      } else {
        onConnected();
      }
    });

    upstreamReq.on('error', (error) => {
      if (context.aborted || req.aborted || isClientAbort(error)) {
        const abortErr = new Error('Client aborted request');
        abortErr.code = 'ERR_CLIENT_ABORTED';
        doneReject(abortErr);
        return;
      }

      const shouldRotateProfile = profileIndex < HEADER_PROFILES.length - 1 && !context.aborted && !req.aborted;
      const canRetry = RETRYABLE_CODES.has(error.code) && attempt < MAX_RETRIES && !isRange && !isTimeoutError(error);
      const shouldRetry = canRetry || shouldRotateProfile;
      console.error(`${requestId} [PROXY] ERROR code=${error.code || 'unknown'} message=${error.message} retry=${shouldRetry} profile=${HEADER_PROFILES[profileIndex]?.name || 'default'}`);

      if (shouldRetry) {
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt);
        const nextProfileIndex = shouldRotateProfile ? profileIndex + 1 : profileIndex;
        setTimeout(() => {
          if (context.aborted || req.aborted) {
            const abortErr = new Error('Client aborted request');
            abortErr.code = 'ERR_CLIENT_ABORTED';
            doneReject(abortErr);
            return;
          }

          requestUpstream(targetUrl, req, res, context, redirectsLeft, canRetry ? attempt + 1 : attempt, nextProfileIndex).then(doneResolve).catch(doneReject);
        }, delay);
        return;
      }

      doneReject(error);
    });

    try {
      upstreamReq.end();
    } catch (error) {
      doneReject(new Error(`Failed to send upstream request: ${error.message}`));
    }
  });
};

const handleProxy = async (req, res) => {
  const startedAt = Date.now();
  const requestId = `[${startedAt}]`;
  const context = { id: requestId, aborted: false };

  req.once('aborted', () => {
    context.aborted = true;
    console.warn(`${requestId} [PROXY] CLIENT_ABORT`);
  });

  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const urlParam = parsedUrl.searchParams.get('url');

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  if (!urlParam) {
    res.statusCode = 400;
    res.end('URL missing');
    return;
  }

  let targetUrl;
  try {
    targetUrl = new URL(urlParam);
  } catch (_error) {
    res.statusCode = 400;
    res.end('Invalid URL');
    return;
  }

  if (!['http:', 'https:'].includes(targetUrl.protocol)) {
    res.statusCode = 400;
    res.end('Unsupported protocol');
    return;
  }

  const rangeHeader = req.headers.range;
  console.log(`${requestId} [PROXY] START ${req.method} ${targetUrl.toString()}${rangeHeader ? ` (Range: ${rangeHeader})` : ''}`);

  try {
    await requestUpstream(targetUrl, req, res, context);
    console.log(`${requestId} [PROXY] COMPLETE in=${Date.now() - startedAt}ms`);
  } catch (error) {
    const elapsed = Date.now() - startedAt;

    if (context.aborted || req.aborted || isClientAbort(error)) {
      console.warn(`${requestId} [PROXY] ABORTED in=${elapsed}ms`);
      if (!res.writableEnded) {
        res.destroy();
      }
      return;
    }

    const statusCode = isTimeoutError(error)
      ? 504
      : NETWORK_CODES.has(error.code)
        ? 502
        : 500;

    console.error(`${requestId} [PROXY] FAIL status=${statusCode} in=${elapsed}ms code=${error.code || 'unknown'} message=${error.message}`);

    if (!res.headersSent) {
      res.statusCode = statusCode;
      res.setHeader('Content-Type', 'text/plain');
      res.end(`Proxy Error (${elapsed}ms): ${error.message}`);
      return;
    }

    if (!res.writableEnded) {
      res.end();
    }
  }
};

module.exports = { handleProxy };
