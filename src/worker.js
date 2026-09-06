/**
 * 🚀 Cloudflare Workers Entry Point
 * Main router that handles all incoming requests
 */

import { handleGoogleAuth, handleGoogleCallback } from './auth.js';
import { handleAvailability, handleFallbackAvailability } from './api.js';
import { serveStaticFile, serveIndexPage } from './static.js';
import { handleRSSFeed, prefetchRSSFeeds } from './rss.js';
import { getCorsHeaders, sanitizeRequestPath } from './utils.js';

/**
 * REQUEST_MAPPING - Maps URL patterns to handlers
 * Format: pattern → handler function
 */
const REQUEST_MAPPING = {
  // OAuth endpoints
  '/auth/google': handleGoogleAuth,
  '/auth/google/callback': handleGoogleCallback,

  // API endpoints
  '/api/availability': handleAvailability,
  '/api/availability/fallback': handleFallbackAvailability,
  '/api/rss/today': handleRSSFeed,
  '/api/rss/all': handleRSSFeed,
  '/api/rss/major': handleRSSFeed,

  // Auth pages
  '/auth': 'static:auth.html',
  '/auth.html': 'static:auth.html',
  '/auth.htm': 'static:auth.html',
};

/**
 * Main Worker fetch handler
 * Executes on every incoming request
 */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = sanitizeRequestPath(url.pathname) || '/';
    const method = request.method;

    // Log incoming request
    console.log(`[${method}] ${pathname}`);

    try {
      // Handle CORS preflight requests
      if (method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: getCorsHeaders(),
        });
      }

      // Route exact path matches
      if (REQUEST_MAPPING[pathname]) {
        const handler = REQUEST_MAPPING[pathname];
        
        if (typeof handler === 'string' && handler.startsWith('static:')) {
          // Static file serving
          const filename = handler.split(':')[1];
          return serveStaticFile(filename, env);
        }
        
        // Handler function
        return await handler(request, env);
      }

      // Route /api/* endpoints
      if (pathname.startsWith('/api/')) {
        // Check for dynamic API routes
        if (pathname === '/api/availability') {
          return await handleAvailability(request, env);
        }
        if (pathname === '/api/availability/fallback') {
          return await handleFallbackAvailability(request, env);
        }
        if (pathname.startsWith('/api/rss/')) {
          return await handleRSSFeed(request, env);
        }
      }

      // Route static files (CSS, JS, images, etc.)
      if (
        pathname.startsWith('/css/') ||
        pathname.startsWith('/js/') ||
        pathname.startsWith('/images/') ||
        pathname.startsWith('/data/') ||
        pathname.match(/\.(css|js|jpg|jpeg|png|gif|svg|json)$/)
      ) {
        return serveStaticFile(pathname, env);
      }

      // Serve index.html for root path
      if (pathname === '/' || pathname === '/index.html') {
        return serveIndexPage(env);
      }

      // 404 - Not Found
      return new Response('404 - Not Found', {
        status: 404,
        headers: {
          'Content-Type': 'text/plain',
          ...getCorsHeaders(),
        },
      });

    } catch (error) {
      // Error handling
      console.error(`Error processing ${pathname}:`, error);
      
      return new Response(
        JSON.stringify({
          error: 'Internal Server Error',
          message: 'An unexpected error occurred.',
          path: pathname,
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...getCorsHeaders(),
          },
        }
      );
    }
  },

  async scheduled(controller, env, ctx) {
    console.log('Scheduled RSS feed prefetch started');
    try {
      await prefetchRSSFeeds(env);
      console.log('Scheduled RSS feed prefetch completed');
    } catch (error) {
      console.error('Scheduled RSS feed prefetch failed:', error);
    }
  },
};
