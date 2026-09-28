/**
 * 📁 Static File Serving
 * Serves HTML, CSS, JS, images, and other static assets
 */

import { getCorsHeaders } from './utils.js';

/**
 * Serve a static file (HTML, CSS, JS, images, etc.)
 */
export async function serveStaticFile(filename, env) {
  try {
    const normalized = filename.startsWith('/') ? filename.slice(1) : filename;

    if (normalized === 'index.html' || normalized === '') {
      return serveIndexPage(env);
    }

    if (normalized === 'auth.html' || normalized === 'auth.htm') {
      return new Response(
        `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Google Calendar Auth</title>
</head>
<body>
    <h1>Google Calendar Authorization</h1>
    <p>Use <code>/auth/google</code> to begin the OAuth flow.</p>
</body>
</html>`,
        {
          status: 200,
          headers: {
            'Content-Type': 'text/html',
            ...getCorsHeaders(),
          },
        }
      );
    }

    // Try to get file from KV if configured
    if (env.STATIC_FILES) {
      const content = await env.STATIC_FILES.get(normalized);
      if (content) {
        const mimeType = getMimeType(normalized);
        const cacheHeader = getCacheDuration(normalized);
        return new Response(content, {
          status: 200,
          headers: {
            'Content-Type': mimeType,
            'Cache-Control': cacheHeader,
            ...getCorsHeaders(),
          },
        });
      }
    } else {
      console.warn('STATIC_FILES KV namespace not configured, redirecting to Pages');
    }

    // Fall back to Cloudflare Pages for static assets
    const pagesUrl = env.PAGES_URL || 'https://lapapessavacanze.com';
    const redirectUrl = pagesUrl.endsWith('/') ? `${pagesUrl}${normalized}` : `${pagesUrl}/${normalized}`;
    return new Response(null, {
      status: 302,
      headers: {
        Location: redirectUrl,
        ...getCorsHeaders(),
      },
    });

  } catch (error) {
    console.error(`Error serving static file ${filename}:`, error instanceof Error ? error.message : String(error));
    return new Response('Not Found', {
      status: 404,
      headers: getCorsHeaders(),
    });
  }
}

/**
 * Serve index.html or redirect to home
 */
export async function serveIndexPage(env) {
  if (env.STATIC_FILES) {
    const content = await env.STATIC_FILES.get('index.html');
    if (content) {
      return new Response(content, {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'no-cache',
          ...getCorsHeaders(),
        },
      });
    }
  }

  // Redirect to Cloudflare Pages for the main site when static KV is not available.
  const pagesUrl = env.PAGES_URL || 'https://lapapessavacanze.com';
  return new Response(null, {
    status: 302,
    headers: {
      Location: pagesUrl.endsWith('/') ? pagesUrl : `${pagesUrl}/`,
      ...getCorsHeaders(),
    },
  });
}

export async function serveNotFound(env, request) {
  let html = null;
  if (env.STATIC_FILES) {
    html = await env.STATIC_FILES.get('404.html');
  }

  if (!html) {
    const pagesUrl = env.PAGES_URL || 'https://lapapessavacanze.com';
    try {
      const pageUrl = new URL('/404.html', pagesUrl);
      const response = await fetch(pageUrl, { headers: { Accept: 'text/html' } });
      if (response.ok) html = await response.text();
    } catch (error) {
      console.warn('Could not load the custom not-found page:', error instanceof Error ? error.message : String(error));
    }
  }

  if (!html) {
    html = '<!doctype html><html lang="it"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Pagina non trovata | La Papessa</title><main><h1>Pagina non trovata</h1><p>La pagina richiesta non esiste o e\' stata spostata.</p><a href="/">Torna alla home</a></main></html>';
  }

  const pagesOrigin = new URL(env.PAGES_URL || 'https://lapapessavacanze.com').origin;
  const notFoundHeaders = getCorsHeaders(request);
  notFoundHeaders['Content-Security-Policy'] = `default-src 'self'; style-src 'self' 'unsafe-inline' ${pagesOrigin}; img-src 'self' data: https:; script-src 'self' ${pagesOrigin}; connect-src 'self' https:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'`;

  return new Response(html, {
    status: 404,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      ...notFoundHeaders,
    },
  });
}

/**
 * Get MIME type for file extension
 */
function getMimeType(filename) {
  const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.txt': 'text/plain',
  };

  const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'));
  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * Get cache duration for file type
 */
function getCacheDuration(filename) {
  // HTML: no cache (content changes frequently)
  if (filename.endsWith('.html')) return 'no-cache';
  
  // CSS, JS: cache for 1 year (versioned)
  if (filename.match(/\.(css|js)$/)) return 'public, max-age=31536000';
  
  // Images: cache for 1 month
  if (filename.match(/\.(jpg|jpeg|png|gif|svg)$/)) return 'public, max-age=2592000';
  
  // Default: cache for 1 day
  return 'public, max-age=86400';
}
