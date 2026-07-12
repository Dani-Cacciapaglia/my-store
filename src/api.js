/**
 * 📊 API Endpoints
 * Handles Google Calendar availability and fallback data
 */

import { getCorsHeaders, initGoogleCalendar, isEventBusy, getEventRange, markUnavailableDates } from './utils.js';

/**
 * Handle /api/availability - Fetch events from Google Calendar
 */
export async function handleAvailability(request, env) {
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
            ...getCorsHeaders(),
          },
        }
      );
    }

    const { calendar, calendarId } = await initGoogleCalendar(env);

    const response = await calendar.events.list({
      calendarId,
      timeMin: new Date(startDate).toISOString(),
      timeMax: new Date(endDate).toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 2500,
    });

    const events = response.data.items || [];
    const unavailableDates = new Set();
    const busySlots = [];

    for (const event of events) {
      if (!isEventBusy(event)) {
        continue;
      }

      const { start, end } = getEventRange(event);
      markUnavailableDates(unavailableDates, start, end);

      busySlots.push({
        title: event.summary || 'Busy',
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        isAllDay: !!event.start?.date && !event.start?.dateTime,
      });
    }

    return new Response(
      JSON.stringify({
        unavailableDates: Array.from(unavailableDates).sort(),
        busySlots,
        totalEvents: events.length,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          ...getCorsHeaders(),
        },
      }
    );

  } catch (error) {
    console.error('Availability API error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch availability',
        message: error.message,
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
      unavailableDates: STATIC_FALLBACK_DATES,
      busySlots: [],
      source: 'fallback',
      note: 'This is fallback data. Live Google Calendar data unavailable.',
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600',
        ...getCorsHeaders(),
      },
    }
  );
}
