/**
 * 📡 RSS Feed Handler
 * Fetches and parses RSS feeds from external sources
 */

import { getCorsHeaders } from './utils.js';

/**
 * RSS Feed URLs
 */
const RSS_FEEDS = {
  today: 'https://www.turismo.comunecervia.it/it/it/eventi/manifestazioni-e-iniziative/cosa-fare-e-vedere-oggi/RSS',
  all: 'https://www.turismo.comunecervia.it/it/eventi/manifestazioni-e-iniziative/tutti-gli-eventi/RSS',
  major: 'https://www.turismo.comunecervia.it/it/eventi/manifestazioni-e-iniziative/I-grandi-eventi/RSS'
};

/**
 * Handle RSS feed requests
 */
export async function handleRSSFeed(request, env) {
  try {
    const url = new URL(request.url);
    const feedType = url.pathname.split('/api/rss/')[1];

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
            ...getCorsHeaders(),
          },
        }
      );
    }

    const cacheKey = getCacheKey(feedType);

    if (env?.RSS_CACHE) {
      const cachedText = await env.RSS_CACHE.get(cacheKey);
      if (cachedText) {
        const cached = JSON.parse(cachedText);
        if (isCacheValid(cached)) {
          return new Response(JSON.stringify(cached), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'public, max-age=300',
              ...getCorsHeaders(),
            },
          });
        }
      }
    }

    const payload = await fetchAndCacheFeed(feedType, env);
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
        ...getCorsHeaders(),
      },
    });

  } catch (error) {
    console.error('RSS feed error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch RSS feed',
        message: error.message,
        feed: url.pathname.split('/api/rss/')[1] || 'unknown'
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
}

/**
 * Parse RSS feed XML into structured events
 */
function parseRSSFeed(rssText) {
  const events = [];

  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(rssText, 'text/xml');

    const parseError = xmlDoc.querySelector('parsererror');
    if (parseError) {
      throw new Error('Invalid RSS XML format');
    }

    const items = xmlDoc.querySelectorAll('item');

    items.forEach(item => {
      const title = item.querySelector('title')?.textContent?.trim();
      const link = item.querySelector('link')?.textContent?.trim();
      const description = item.querySelector('description')?.textContent?.trim();
      const date = item.querySelector('dc\\:date, date')?.textContent?.trim();
      const type = item.querySelector('dc\\:type, type')?.textContent?.trim();

      if (title && link) {
        events.push({
          title,
          link,
          description: description || '',
          date: date || '',
          type: type || 'Event',
        });
      }
    });

    events.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB - dateA;
    });

  } catch (error) {
    console.error('Error parsing RSS feed:', error);
    throw new Error(`Failed to parse RSS feed: ${error.message}`);
  }

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
      console.error(`Failed to prefetch RSS feed ${feedType}:`, error);
      results[feedType] = {
        feed: feedType,
        error: error.message,
      };
    }
  }
  return results;
}
