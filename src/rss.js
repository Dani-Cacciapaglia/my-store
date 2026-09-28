/**
 * 📡 RSS Feed Handler
 * Fetches and parses RSS feeds from external sources
 */

import { getCorsHeaders } from './utils.js';
import { XMLParser, XMLValidator } from 'fast-xml-parser';

/**
 * RSS Feed URLs
 */
const RSS_FEEDS = {
  today: 'https://www.turismo.comunecervia.it/it/it/eventi/manifestazioni-e-iniziative/cosa-fare-e-vedere-oggi/RSS',
  all: 'https://www.turismo.comunecervia.it/it/eventi/manifestazioni-e-iniziative/tutti-gli-eventi/RSS',
  major: 'https://www.turismo.comunecervia.it/it/eventi/manifestazioni-e-iniziative/I-grandi-eventi/RSS'
};

const rssParser = new XMLParser({ parseTagValue: false, trimValues: true });

/**
 * Handle RSS feed requests
 */
export async function handleRSSFeed(request, env) {
  const url = new URL(request.url);
  const feedType = url.pathname.split('/api/rss/')[1];

  try {
    if (request.method !== 'GET') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json; charset=utf-8', 'Allow': 'GET', ...getCorsHeaders(request) },
      });
    }

    if (!feedType || !RSS_FEEDS[feedType]) {
      return new Response(
        JSON.stringify({
          error: 'Invalid feed type',
          available: Object.keys(RSS_FEEDS)
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...getCorsHeaders(request),
          },
        }
      );
    }

    const cacheKey = getCacheKey(feedType);
    const edgeCache = typeof caches !== 'undefined' ? caches.default : null;
    const edgeCacheRequest = new Request(`https://rss-cache.invalid/${feedType}`);
    const edgeResponse = await edgeCache?.match(edgeCacheRequest);
    if (edgeResponse) {
      return new Response(edgeResponse.body, {
        status: edgeResponse.status,
        headers: { ...edgeResponse.headers, ...getCorsHeaders(request) },
      });
    }

    if (env?.RSS_CACHE) {
      const cachedText = await env.RSS_CACHE.get(cacheKey);
      if (cachedText) {
        const cached = JSON.parse(cachedText);
        if (isCacheValid(cached)) {
          const response = new Response(JSON.stringify(cached), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'public, max-age=3600',
              ...getCorsHeaders(request),
            },
          });
          if (edgeCache) await edgeCache.put(edgeCacheRequest, response.clone());
          return response;
        }
      }
    }

    if (!env?.UPSTREAM_RATE_LIMITER) {
      return new Response(JSON.stringify({ error: 'RSS request protection is not configured' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json; charset=utf-8', ...getCorsHeaders(request) },
      });
    }
    const { success } = await env.UPSTREAM_RATE_LIMITER.limit({ key: `cervia-rss-${feedType}` });
    if (!success) {
      return new Response(JSON.stringify({ error: 'Events are temporarily rate limited. Please retry shortly.' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json; charset=utf-8', 'Retry-After': '60', ...getCorsHeaders(request) },
      });
    }

    const payload = await fetchAndCacheFeed(feedType, env);
    const response = new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
        ...getCorsHeaders(request),
      },
    });
    if (edgeCache) await edgeCache.put(edgeCacheRequest, response.clone());
    return response;

  } catch (error) {
    console.error('RSS feed error:', error instanceof Error ? error.message : String(error));
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch RSS feed',
        feed: feedType || 'unknown'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...getCorsHeaders(request),
        },
      }
    );
  }
}

/**
 * Parse RSS feed XML into structured events
 */
export function parseRSSFeed(rssText) {
  const validation = XMLValidator.validate(rssText);
  if (validation !== true) {
    throw new Error('Invalid RSS XML format');
  }

  const parsed = rssParser.parse(rssText);
  const rawItems = parsed.rss?.channel?.item;
  const items = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : [];
  const readText = value => {
    if (typeof value === 'string' || typeof value === 'number') return String(value).trim();
    if (value && typeof value['#text'] === 'string') return value['#text'].trim();
    return '';
  };

  const events = items.map(item => ({
    title: readText(item.title),
    link: readText(item.link),
    description: readText(item.description),
    date: readText(item['dc:date'] ?? item.date),
    type: readText(item['dc:type'] ?? item.type) || 'Event',
  })).filter(event => event.title && event.link);

  events.sort((a, b) => new Date(b.date) - new Date(a.date));
  return events;
}

function getCacheKey(feedType) {
  return `rss-cache:${feedType}`;
}

function isCacheValid(cached) {
  if (!cached?.lastFetched) return false;
  const lastFetched = Date.parse(cached.lastFetched);
  if (Number.isNaN(lastFetched)) return false;
  return Date.now() - lastFetched < 24 * 60 * 60 * 1000;
}

async function fetchAndCacheFeed(feedType, env) {
  const feedUrl = RSS_FEEDS[feedType];
  const response = await fetch(feedUrl, {
    signal: AbortSignal.timeout(8_000),
    headers: {
      'User-Agent': 'Cervia-Events-App/1.0 (https://your-domain.com)',
      Accept: 'application/rss+xml, application/xml, text/xml',
    },
    cf: {
      cacheTtl: 300,
      cacheEverything: true,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch RSS feed: ${response.status}`);
  }

  const rssText = await response.text();
  const events = parseRSSFeed(rssText);
  const lastFetched = new Date().toISOString();
  const payload = {
    feed: feedType,
    events,
    source: 'Comune di Cervia Tourism Office',
    lastFetched,
    cachedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };

  if (env?.RSS_CACHE) {
    await env.RSS_CACHE.put(getCacheKey(feedType), JSON.stringify(payload));
  }

  return payload;
}

export async function prefetchRSSFeeds(env) {
  const results = {};
  for (const feedType of Object.keys(RSS_FEEDS)) {
    try {
      results[feedType] = await fetchAndCacheFeed(feedType, env);
    } catch (error) {
      console.error(`Failed to prefetch RSS feed ${feedType}:`, error instanceof Error ? error.message : String(error));
      results[feedType] = {
        feed: feedType,
        error: error.message,
      };
    }
  }
  return results;
}
