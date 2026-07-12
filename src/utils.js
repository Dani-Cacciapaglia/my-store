/**
 * 🛠️ Shared Utilities and Helpers
 * Common functions, constants, and helpers used across all modules
 */

import { google } from 'googleapis';

/**
 * ============================================================================
 * CONSTANTS
 * ============================================================================
 */

export const REQUIRED_ENV_VARS = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_REDIRECT_URL',
];

/**
 * Standard CORS headers for Worker responses
 */
export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * ============================================================================
 * CORS & HEADERS
 * ============================================================================
 */

/**
 * Get CORS headers for responses
 */
export function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

/**
 * ============================================================================
 * ENVIRONMENT VALIDATION
 * ============================================================================
 */

/**
 * Check if a value is a placeholder (e.g., 'your_client_id')
 */
export function isPlaceholderValue(value) {
  if (!value || typeof value !== 'string') return true;
  return value.includes('your_') || value.includes('REPLACE_WITH');
}

/**
 * Get trimmed environment variable
 */
let localEnvLoaded = false;

export function getEnvValue(env, key) {
  const valueFromEnv = env?.[key];
  if (typeof valueFromEnv === 'string' && valueFromEnv.trim() !== '') {
    return valueFromEnv.trim();
  }

  if (typeof process !== 'undefined' && process?.env?.[key]) {
    return process.env[key].trim();
  }

  return null;
}

export async function loadLocalDotEnv() {
  if (localEnvLoaded || typeof process === 'undefined' || !process?.env) {
    return;
  }

  try {
    const dotenv = await import('dotenv');
    const result = dotenv.config({ path: '.env' });
    if (result.error) {
      throw result.error;
    }
    localEnvLoaded = true;
    console.log('✓ Local .env file loaded into process.env');
  } catch (error) {
    console.warn('⚠️ Local .env load skipped or failed:', error.message);
  }
}

/**
 * Validate Google environment variables
 * Returns error string if invalid, null if valid
 */
export function validateGoogleEnv(env) {
  const missing = [];
  
  for (const key of REQUIRED_ENV_VARS) {
    const value = getEnvValue(env, key);
    if (!value || isPlaceholderValue(value)) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    return `Missing or invalid environment variables: ${missing.join(', ')}. Set these in Cloudflare Dashboard.`;
  }

  return null;
}

/**
 * Check if valid OAuth tokens exist
 */
export function hasValidTokens(env, tokens = null) {
  const accessToken = tokens?.access_token ?? getEnvValue(env, 'GOOGLE_ACCESS_TOKEN');
  const refreshToken = tokens?.refresh_token ?? getEnvValue(env, 'GOOGLE_REFRESH_TOKEN');
  
  return (
    accessToken &&
    !isPlaceholderValue(accessToken) &&
    refreshToken &&
    !isPlaceholderValue(refreshToken)
  );
}

/**
 * Load OAuth tokens from Cloudflare KV or environment variables
 */
export async function getStoredTokens(env) {
  const access_token = getEnvValue(env, 'GOOGLE_ACCESS_TOKEN');
  const refresh_token = getEnvValue(env, 'GOOGLE_REFRESH_TOKEN');

  if (access_token && refresh_token) {
    return { access_token, refresh_token };
  }

  if (env.TOKENS) {
    const [storedAccessToken, storedRefreshToken] = await Promise.all([
      env.TOKENS.get('access_token'),
      env.TOKENS.get('refresh_token'),
    ]);

    return {
      access_token: storedAccessToken,
      refresh_token: storedRefreshToken,
    };
  }

  return { access_token: null, refresh_token: null };
}

/**
 * ============================================================================
 * GOOGLE CALENDAR API
 * ============================================================================
 */

/**
 * Initialize Google Calendar API client
 */
export async function initGoogleCalendar(env) {
  try {    // Load local .env values into process.env during development, if available.
    await loadLocalDotEnv();
    // Validate environment basics
    const validation = validateGoogleEnv(env);
    if (validation) {
      throw new Error(validation);
    }

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      getEnvValue(env, 'GOOGLE_CLIENT_ID'),
      getEnvValue(env, 'GOOGLE_CLIENT_SECRET'),
      getEnvValue(env, 'GOOGLE_REDIRECT_URL')
    );

    // Load tokens from KV or environment
    const storedTokens = await getStoredTokens(env);

    if (hasValidTokens(env, storedTokens)) {
      oauth2Client.setCredentials(storedTokens);
      console.log('✓ OAuth credentials loaded from environment or KV');
    } else {
      console.warn('⚠️ No valid OAuth tokens found in environment or KV');
    }

    const calendar = google.calendar({
      version: 'v3',
      auth: oauth2Client,
    });

    return {
      oauth2Client,
      calendar,
      calendarId: getEnvValue(env, 'GOOGLE_CALENDAR_ID') || 'primary',
      storedTokens,
    };

  } catch (error) {
    throw new Error(`Google Calendar initialization failed: ${error.message}`);
  }
}

/**
 * ============================================================================
 * DATE UTILITIES
 * ============================================================================
 */

/**
 * Format date as YYYY-MM-DD string
 */
export function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * ============================================================================
 * EVENT PROCESSING (Stubs for Phase 2)
 * ============================================================================
 */

/**
 * Check if a calendar event represents busy time.
 * Excludes cancelled events and free/transparent slots.
 */
export function isEventBusy(event) {
  return event.status !== 'cancelled' && event.transparency !== 'transparent';
}

/**
 * Get the effective event start/end range.
 * Supports both all-day and timed events.
 */
export function getEventRange(event) {
  const isAllDay = !!event.start?.date && !event.start?.dateTime;
  const start = new Date(isAllDay ? event.start.date : event.start?.dateTime || event.start?.date);
  const end = new Date(isAllDay ? event.end.date : event.end?.dateTime || event.end?.date);
  return { start, end };
}

/**
 * Mark each date in the given event range as unavailable.
 * Uses midnight-based day iteration to collect YYYY-MM-DD strings.
 */
export function markUnavailableDates(set, start, end) {
  const current = new Date(start);
  current.setHours(0, 0, 0, 0);

  while (current < end) {
    set.add(formatDate(current));
    current.setDate(current.getDate() + 1);
  }
}

/**
 * ============================================================================
 * LOGGING & DEBUGGING
 * ============================================================================
 */

/**
 * Log message if debugging enabled
 */
export function logDebug(env, ...args) {
  if (env.DEBUG === 'true' || env.DEBUG === true) {
    console.log('[DEBUG]', ...args);
  }
}
