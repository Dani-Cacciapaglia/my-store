/**
 * 📊 API Endpoints
 * Handles Google Calendar availability and fallback data
 */

import { getCorsHeaders, initGoogleCalendar, parseAndValidateDateParam } from './utils.js';

const ROME_DATE_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Rome',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});
const ROME_MONTH_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Rome',
  year: 'numeric',
  month: '2-digit',
});

export function datesFromBusyPeriods(periods = []) {
  const dates = new Set();
  const timeFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Rome',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });

  for (const period of periods) {
    const start = new Date(period.start);
    const end = new Date(period.end);
    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end <= start) continue;

    let [year, month, day] = ROME_DATE_FORMATTER.format(start).split('-').map(Number);
    const endParts = ROME_DATE_FORMATTER.formatToParts(end);
    const endDate = `${endParts.find(part => part.type === 'year').value}-${endParts.find(part => part.type === 'month').value}-${endParts.find(part => part.type === 'day').value}`;
    const endIsMidnight = timeFormatter.format(end) === '00:00:00';

    for (let count = 0; count < 400; count += 1) {
      const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      if (date > endDate || (date === endDate && endIsMidnight)) break;
      dates.add(date);

      const nextDate = new Date(Date.UTC(year, month - 1, day + 1));
      year = nextDate.getUTCFullYear();
      month = nextDate.getUTCMonth() + 1;
      day = nextDate.getUTCDate();
    }
  }

  return Array.from(dates).sort();
}

function jsonResponse(body, status, request, cacheControl = 'no-store') {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': cacheControl,
      ...getCorsHeaders(request),
    },
  });
}

function getAvailabilityCacheRequest(startDate, endDate) {
  const cacheUrl = new URL('https://availability-cache.invalid/api/availability');
  cacheUrl.searchParams.set('startDate', new Date(startDate).toISOString());
  cacheUrl.searchParams.set('endDate', new Date(endDate).toISOString());
  return new Request(cacheUrl);
}

/**
 * Handle /api/availability - Fetch events from Google Calendar
 */
export async function handleAvailability(request, env) {
  if (request.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed' }, 405, request);
  }

  try {
    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    if (!startDate || !endDate) {
      return new Response(
        JSON.stringify({
          error: 'Missing required parameters',
          required: ['startDate', 'endDate'],
          example: '/api/availability?startDate=2025-01-01T00:00:00Z&endDate=2025-12-31T23:59:59Z',
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

    let parsedStartDate;
    let parsedEndDate;

    try {
      parsedStartDate = parseAndValidateDateParam(startDate, 'startDate');
      parsedEndDate = parseAndValidateDateParam(endDate, 'endDate');
    } catch (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...getCorsHeaders(request),
          },
        }
      );
    }

    if (parsedEndDate <= parsedStartDate) {
      return new Response(
        JSON.stringify({ error: 'endDate must be after startDate' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...getCorsHeaders(request),
          },
        }
      );
    }

    const startMonth = ROME_MONTH_FORMATTER.format(parsedStartDate).split('-').map(Number);
    const endMonth = ROME_MONTH_FORMATTER.format(parsedEndDate).split('-').map(Number);
    const monthRange = (endMonth[0] - startMonth[0]) * 12 + endMonth[1] - startMonth[1];
    if (monthRange < 0 || monthRange > 12) {
      return new Response(
        JSON.stringify({ error: 'Date range exceeds the supported maximum of 13 calendar months' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...getCorsHeaders(request),
          },
        }
      );
    }

    const calendarIds = {
      ulivo: env.GOOGLE_CALENDAR_ID_ULIVO?.trim(),
      saline: env.GOOGLE_CALENDAR_ID_SALINE?.trim(),
    };
    const sharedCalendar = calendarIds.ulivo && calendarIds.ulivo === calendarIds.saline;
    const allowSharedCalendar = env.ALLOW_SHARED_APARTMENT_CALENDAR === 'true';
    if (!calendarIds.ulivo || !calendarIds.saline || (sharedCalendar && !allowSharedCalendar)) {
      return jsonResponse({
        error: 'Two distinct apartment calendars must be configured',
        required: ['GOOGLE_CALENDAR_ID_ULIVO', 'GOOGLE_CALENDAR_ID_SALINE'],
      }, 503, request);
    }

    const cache = typeof caches !== 'undefined' ? caches.default : null;
    const cacheRequest = getAvailabilityCacheRequest(startDate, endDate);
    const cachedResponse = await cache?.match(cacheRequest);
    if (cachedResponse) {
      return new Response(cachedResponse.body, {
        status: cachedResponse.status,
        headers: { ...cachedResponse.headers, ...getCorsHeaders(request) },
      });
    }

    if (!env.UPSTREAM_RATE_LIMITER) {
      return jsonResponse({ error: 'Google request protection is not configured' }, 503, request);
    }
    const { success: googleRequestAllowed } = await env.UPSTREAM_RATE_LIMITER.limit({ key: 'google-calendar-freebusy' });
    if (!googleRequestAllowed) {
      return jsonResponse({ error: 'Availability is temporarily rate limited. Please retry shortly.' }, 429, request);
    }

    const { calendar } = await initGoogleCalendar(env);
    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin: parsedStartDate.toISOString(),
        timeMax: parsedEndDate.toISOString(),
        timeZone: 'Europe/Rome',
        items: Array.from(new Set(Object.values(calendarIds)), id => ({ id })),
      },
      fields: 'calendars',
    });

    const calendarResults = response.data.calendars || {};
    const availabilityByApartment = {};
    for (const [apartment, calendarId] of Object.entries(calendarIds)) {
      const result = calendarResults[calendarId];
      if (!result || result.errors?.length) {
        return jsonResponse({ error: 'Could not read both apartment calendars' }, 502, request);
      }
      availabilityByApartment[apartment] = datesFromBusyPeriods(result.busy || []);
    }

    const result = jsonResponse({
      availabilityByApartment,
      source: 'google-calendar',
      sharedCalendar: Boolean(sharedCalendar),
      note: sharedCalendar ? 'Modalità temporanea: entrambi gli alloggi usano lo stesso calendario Google e mostrano le stesse disponibilità.' : undefined,
    }, 200, request, 'public, max-age=300');
    if (cache) await cache.put(cacheRequest, result.clone());
    return result;

  } catch (error) {
    console.error('Availability API error:', error instanceof Error ? error.message : String(error));
    return jsonResponse({ error: 'Failed to fetch availability' }, 502, request);
  }
}

/**
 * Handle /api/availability/fallback - Return static fallback dates
 */
export async function handleFallbackAvailability(request, env) {
  const STATIC_FALLBACK_DATES = [
    '2025-12-01', '2025-12-02', '2025-12-03', '2025-12-04', '2025-12-05',
    '2025-12-06', '2025-12-07', '2025-12-08', '2025-12-12', '2025-12-13',
    '2025-12-14', '2025-12-16', '2025-12-17', '2025-12-18', '2025-12-20',
    '2025-12-24', '2025-12-25', '2025-12-26', '2025-12-27', '2025-12-31',
  ];

  return new Response(
    JSON.stringify({
      availabilityByApartment: {
        ulivo: [],
        saline: [],
      },
      source: 'fallback',
      note: 'Apartment availability could not be verified. Contact the property before planning a stay.',
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
        ...getCorsHeaders(request),
      },
    }
  );
}

const CONTACT_FIELDS = ['name', 'email', 'arrival', 'departure', 'apartment', 'adults', 'children', 'message'];
const MAX_CONTACT_BODY_BYTES = 16 * 1024;

export async function handleContactSubmission(request, env) {
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405, request);
  }

  const contentLength = Number(request.headers.get('Content-Length') || 0);
  if (contentLength > MAX_CONTACT_BODY_BYTES) {
    return jsonResponse({ error: 'Contact message is too large' }, 413, request);
  }

  if (!env.WEB3FORMS_ACCESS_KEY) {
    return jsonResponse({ error: 'Contact delivery is not configured' }, 503, request);
  }

  const contentType = request.headers.get('Content-Type') || '';
  if (!contentType.includes('multipart/form-data') && !contentType.includes('application/x-www-form-urlencoded')) {
    return jsonResponse({ error: 'Expected form data' }, 415, request);
  }

  let submittedFields;
  try {
    const reader = request.body?.getReader();
    if (!reader) return jsonResponse({ error: 'Expected a contact form body' }, 400, request);
    const chunks = [];
    let totalBytes = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_CONTACT_BODY_BYTES) {
        await reader.cancel();
        return jsonResponse({ error: 'Contact message is too large' }, 413, request);
      }
      chunks.push(value);
    }
    const body = new Uint8Array(totalBytes);
    let offset = 0;
    for (const chunk of chunks) {
      body.set(chunk, offset);
      offset += chunk.byteLength;
    }
    const boundedRequest = new Request(request.url, {
      method: 'POST',
      headers: request.headers,
      body,
    });
    submittedFields = await boundedRequest.formData();
  } catch {
    return jsonResponse({ error: 'Expected form data' }, 400, request);
  }

  const email = String(submittedFields.get('email') || '').trim();
  const message = String(submittedFields.get('message') || '').trim();
  if (!email || email.length > 254 || !message || message.length > 10_000) {
    return jsonResponse({ error: 'A valid email and message are required' }, 400, request);
  }

  if (!env.CONTACT_RATE_LIMITER || !env.UPSTREAM_RATE_LIMITER) {
    return jsonResponse({ error: 'Contact request protection is not configured' }, 503, request);
  }

  const clientId = request.headers.get('CF-Connecting-IP') || 'unknown-client';
  const { success: contactAllowed } = await env.CONTACT_RATE_LIMITER.limit({ key: clientId });
  if (!contactAllowed) {
    return jsonResponse({ error: 'Too many contact requests. Please retry later.' }, 429, request);
  }

  const { success: providerAllowed } = await env.UPSTREAM_RATE_LIMITER.limit({ key: 'web3forms-submit' });
  if (!providerAllowed) {
    return jsonResponse({ error: 'Contact delivery is temporarily rate limited. Please retry later.' }, 429, request);
  }

  const payload = new FormData();
  payload.set('access_key', env.WEB3FORMS_ACCESS_KEY);
  payload.set('from_name', 'La Papessa website');
  payload.set('subject', 'New contact form message');
  for (const field of CONTACT_FIELDS) {
    const value = String(submittedFields.get(field) || '').trim();
    if (value) payload.set(field, value);
  }

  try {
    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: payload,
      signal: AbortSignal.timeout(8_000),
    });
    const result = response.ok ? await response.json() : null;
    if (!response.ok || !result?.success) {
      return jsonResponse({ error: 'Contact provider did not accept the message' }, 502, request);
    }
    return jsonResponse({ success: true }, 200, request);
  } catch (error) {
    console.error('Contact provider error:', error instanceof Error ? error.message : String(error));
    return jsonResponse({ error: 'Contact provider is temporarily unavailable' }, 502, request);
  }
}
