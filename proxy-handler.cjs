const http = require('http');
const https = require('https');
const { URL } = require('url');
const { pipeline } = require('stream');

const HTTP_AGENT = new http.Agent({ keepAlive: true, keepAliveMsecs: 5000, maxSockets: 64 });
const HTTPS_AGENT = new https.Agent({ keepAlive: true, keepAliveMsecs: 5000, maxSockets: 64 });

const passthroughHeaders = [
  'content-type',
  'content-encoding',
  'content-disposition',
  'content-language',
  'content-length',
  'last-modified',
  'etag',
  'accept-ranges',
  'vary'
];

const buildResponseHeaders = (fetchHeaders) => {
  const responseHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'X-Content-Type-Options': 'nosniff',
    'X-Accel-Buffering': 'no'
  };

  // O fetch.headers é um iterável, precisamos extrair assim:
  const cacheControl = fetchHeaders.get('cache-control');
  responseHeaders['Cache-Control'] = cacheControl || 'no-cache';

  for (const headerName of passthroughHeaders) {
    const headerValue = fetchHeaders.get(headerName);
    if (headerValue) {
      responseHeaders[headerName] = headerValue;
    }
  }

  if (!responseHeaders['content-type']) {
    responseHeaders['content-type'] = 'application/octet-stream';
  }

  if (String(responseHeaders['content-type']).includes('video/') || String(responseHeaders['content-type']).includes('mpegurl') || String(responseHeaders['content-type']).includes('mp2t')) {
    responseHeaders['Cache-Control'] = 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0';
  }

  return responseHeaders;
};

const isLiveTransport = (targetUrl, req) => {
  const pathname = targetUrl.pathname.toLowerCase();
  const search = targetUrl.search.toLowerCase();
  return (
    pathname.endsWith('.ts') ||
    pathname.endsWith('.m3u8') ||
    search.includes('output=ts') ||
    search.includes('type=m3u_plus') ||
    search.includes('live/')
  );
};

const buildUpstreamHeaders = (req, targetUrl) => {
  const liveTransport = isLiveTransport(targetUrl, req);
  const headers = {
    'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': req.headers.accept || '*/*',
    'Accept-Language': req.headers['accept-language'] || 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Connection': 'keep-alive',
    'Host': targetUrl.host,
    'Origin': req.headers.origin || `${targetUrl.protocol}//${targetUrl.host}`,
    'Referer': req.headers.referer || `${targetUrl.protocol}//${targetUrl.host}/`
  };

  if (req.headers.range) {
    headers.Range = req.headers.range;
  }

  if (liveTransport) {
    headers['Accept-Encoding'] = 'identity';
  } else if (req.headers['accept-encoding']) {
    headers['Accept-Encoding'] = req.headers['accept-encoding'];
  }

  if (req.headers.cookie) {
    headers.Cookie = req.headers.cookie;
  }

  return headers;
};

const requestUpstream = (targetUrl, req, res, redirectsLeft = 2) => {
  return new Promise((resolve, reject) => {
    const transport = targetUrl.protocol === 'https:' ? https : http;
    const headers = buildUpstreamHeaders(req, targetUrl);
    const options = {
      protocol: targetUrl.protocol,
      hostname: targetUrl.hostname,
      port: targetUrl.port || (targetUrl.protocol === 'https:' ? 443 : 80),
      path: `${targetUrl.pathname}${targetUrl.search}`,
      method: 'GET',
      headers,
      agent: targetUrl.protocol === 'https:' ? HTTPS_AGENT : HTTP_AGENT,
      timeout: 15000
    };

    const rangeHeader = req.headers.range;
    if (rangeHeader) {
      console.log(`[PROXY RANGE] ${rangeHeader} => ${targetUrl.toString()}`);
    }

    const upstreamReq = transport.request(options, (upstreamRes) => {
      const statusCode = upstreamRes.statusCode || 500;

      if (statusCode >= 300 && statusCode < 400 && upstreamRes.headers.location && redirectsLeft > 0) {
        upstreamRes.resume();
        const redirectedUrl = new URL(upstreamRes.headers.location, targetUrl.toString());
        requestUpstream(redirectedUrl, req, res, redirectsLeft - 1).then(resolve).catch(reject);
        return;
      }

      const responseHeaders = {
        ...buildResponseHeaders({
          get: (headerName) => upstreamRes.headers[String(headerName).toLowerCase()]
        })
      };

      const passthroughHeaders = [
        'content-type',
        'content-length',
        'content-range',
        'accept-ranges',
        'content-encoding',
        'last-modified',
        'etag',
        'vary',
        'content-disposition'
      ];

      for (const headerName of passthroughHeaders) {
        const headerValue = upstreamRes.headers[headerName];
        if (headerValue) {
          responseHeaders[headerName] = headerValue;
        }
      }

      if (!responseHeaders['content-type']) {
        responseHeaders['content-type'] = 'application/octet-stream';
      }

      responseHeaders['accept-ranges'] = 'bytes';

      if (statusCode === 206 && rangeHeader) {
        console.log(`[PROXY RANGE OK] Status 206, Range: ${rangeHeader}, Content-Range: ${upstreamRes.headers['content-range']}`);
      }

      res.writeHead(statusCode, responseHeaders);

      if (statusCode === 204 || statusCode === 304) {
        res.end();
        resolve();
        return;
      }

      pipeline(upstreamRes, res, (err) => {
        if (err && !res.writableEnded) {
          reject(err);
          return;
        }
        resolve();
      });
    });

    upstreamReq.on('timeout', () => {
      upstreamReq.destroy(new Error('Upstream proxy timeout'));
    });

    upstreamReq.on('error', reject);

    req.on('aborted', () => {
      upstreamReq.destroy(new Error('Client aborted request'));
    });

    upstreamReq.end();
  });
};

const handleProxy = async (req, res) => {
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
  } catch (error) {
    res.statusCode = 400;
    res.end('Invalid URL');
    return;
  }

  const rangeHeader = req.headers.range;
  console.log(`[PROXY FETCH] ${targetUrl.toString()}${rangeHeader ? ` (Range: ${rangeHeader})` : ''}`);

  try {
    await requestUpstream(targetUrl, req, res);

  } catch (err) {
    if (err.name === 'AbortError') {
      console.log('[PROXY FETCH] Requisição abortada pelo cliente.');
    } else {
      console.error(`[PROXY FETCH] Erro na requisição (${targetUrl.hostname}): ${err.message} [${err.code || 'unknown'}]`);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.end(`Proxy Error: ${err.message}`);
      }
    }
  }
};

module.exports = { handleProxy };