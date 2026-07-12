/**
 * 📁 Static File Serving
 * Serves HTML, CSS, JS, images, and other static assets
 */

import { getCorsHeaders, sanitizeRequestPath } from './utils.js';

/**
 * Serve a static file (HTML, CSS, JS, images, etc.)
 */
export async function serveStaticFile(filename, env) {
  try {
    const normalized = sanitizeRequestPath(filename);
    if (!normalized) {
      return new Response('Invalid path', {
        status: 400,
        headers: getCorsHeaders(),
      });
    }

    const assetPath = normalized.startsWith('/') ? normalized.slice(1) : normalized;

    if (assetPath === 'index.html' || assetPath === '') {
      return serveIndexPage(env);
    }

    if (assetPath === 'auth.html' || assetPath === 'auth.htm') {
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
      const content = await env.STATIC_FILES.get(assetPath);
      if (content) {
        const mimeType = getMimeType(assetPath);
        const cacheHeader = getCacheDuration(assetPath);
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
    const pagesUrl = getPagesBaseUrl(env);
    const redirectUrl = pagesUrl.endsWith('/') ? `${pagesUrl}${assetPath}` : `${pagesUrl}/${assetPath}`;
    return new Response(null, {
      status: 302,
      headers: {
        Location: redirectUrl,
        ...getCorsHeaders(),
      },
    });

  } catch (error) {
    console.error(`Error serving static file ${filename}:`, error);
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
  const pagesUrl = getPagesBaseUrl(env);
  return new Response(null, {
    status: 302,
    headers: {
      Location: pagesUrl.endsWith('/') ? pagesUrl : `${pagesUrl}/`,
      ...getCorsHeaders(),
    },
  });
}

/**
 * Get MIME type for file extension
 */
function getPagesBaseUrl(env) {
  const configured = env?.PAGES_URL || 'https://lapapessavacanze.com';
  try {
    const parsed = new URL(configured);
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.origin : 'https://lapapessavacanze.com';
  } catch {
    return 'https://lapapessavacanze.com';
  }
}

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
