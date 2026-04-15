# Google Calendar Integration Setup Guide

This guide walks you through integrating Google Calendar with your availability calendar.

## Overview

Your availability calendar now pulls data directly from Google Calendar using the Google Calendar REST API. Days with events marked as "busy" will automatically display as unavailable.

## Step 1: Install Dependencies

```bash
cd /home/daniele/Desktop/my-store
npm install
```

This installs:
- **express**: Web server framework
- **googleapis**: Official Google API client library
- **cors**: Cross-Origin Resource Sharing for API requests
- **dotenv**: Environment variable management

## Step 2: Get Google Calendar API Credentials

### 2.1 Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a Project" → "New Project"
3. Enter project name (e.g., "My Store Availability")
4. Click "Create"

### 2.2 Enable Google Calendar API

1. In Google Cloud Console, search for "Google Calendar API"
2. Click on it and press "Enable"
3. Wait for activation to complete

### 2.3 Create OAuth 2.0 Credentials

1. Go to **Credentials** (left menu)
2. Click "Create Credentials" → "OAuth 2.0 Client ID"
3. If prompted, set up OAuth consent screen first:
   - Choose "External"
   - Fill in app name, user support email, developer email
   - In scopes, add `https://www.googleapis.com/auth/calendar.readonly`
4. Back to credentials creation:
   - Application type: **Web application**
   - Name: "My Store Calendar"
   - Authorized redirect URIs: `http://localhost:3000/auth/google/callback`
   - Click "Create"
5. Copy your **Client ID** and **Client Secret**

## Step 3: Initial Authorization

### 3.1 Create .env file

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

### 3.2 Start the server

```bash
npm start
```

You'll see:
```
Server running at http://localhost:3000
Visit http://localhost:3000/auth/google to authorize
```

### 3.3 Authorize the application

1. Open `http://localhost:3000/auth/google` in your browser
2. Sign in with your Google account
3. Grant calendar access when prompted
4. You'll be redirected and see tokens in console
5. Copy the **Refresh Token** and **Access Token** from console output

### 3.4 Update .env file

Add the tokens you just got:

```env
GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URL=http://localhost:3000/auth/google/callback
GOOGLE_ACCESS_TOKEN=your_access_token_here
GOOGLE_REFRESH_TOKEN=your_refresh_token_here
GOOGLE_CALENDAR_ID=primary
PORT=3000
```

## Step 4: Configure Calendar

### Option A: Use Primary Calendar (Recommended)

Leave `GOOGLE_CALENDAR_ID=primary` - this uses your default calendar.

### Option B: Use Specific Calendar

1. In Google Calendar, right-click the calendar name
2. Select "Settings"
3. Copy the Calendar ID (usually an email)
4. Add to .env: `GOOGLE_CALENDAR_ID=your-calendar-id@gmail.com`

## Step 5: Test the Integration

1. Restart the server:
   ```bash
   npm start
   ```

2. Open your availability page in a browser (adjust path as needed):
   ```
   http://localhost:3000/availability.html
   ```

3. Check browser console for:
   - `✓ Loaded from Google Calendar` - API is working
   - Event dates should show as unavailable
   - Busy slots should display with event titles on hover

## Step 6: Add Events to Your Calendar

1. Go to Google Calendar
2. Create events on dates you're busy
3. Make sure events are marked as "Busy" (default)
4. Events marked as "Free" or "Tentative" won't show as unavailable

The calendar updates in real-time as you refresh the page (every refresh pulls latest data).

## How It Works

```
Google Calendar → Google Calendar API → Backend Server (Node.js) → Frontend (calendar.js)
                                        ↓
                                   Processes events
                                   Extracts unavailable dates
                                   Returns JSON
```

### Event Processing Logic

- **All-day events**: Mark the entire day as unavailable
- **Timed events**: Mark all days the event spans as unavailable
- **Event status**: Only events marked as "Busy" (opaque) count as unavailable
- **Free time**: Events marked as "Free" (transparent) are ignored

## Fallback Behavior

If Google Calendar API is unavailable:
1. System attempts to load from `data/availability.json`
2. If that fails, uses hardcoded dates as fallback
3. Calendar continues to function with stale or default data

## Deployment

### For Production

1. **Get a domain** and SSL certificate
2. **Update credentials** in Google Cloud Console:
   - Add your production URL to authorized redirect URIs
   - Example: `https://yourdomain.com/auth/google/callback`
3. **Update .env** with production URLs
4. **Deploy server** to hosting (Heroku, AWS, DigitalOcean, etc.)
5. **Update frontend** JavaScript to point to your production server URL

### Environment Variables for Production

```env
GOOGLE_CLIENT_ID=production_client_id
GOOGLE_CLIENT_SECRET=production_client_secret
GOOGLE_REDIRECT_URL=https://yourdomain.com/auth/google/callback
GOOGLE_ACCESS_TOKEN=production_access_token
GOOGLE_REFRESH_TOKEN=production_refresh_token
GOOGLE_CALENDAR_ID=primary
PORT=3000
NODE_ENV=production
```

## Troubleshooting

### "Express not found" or module errors
```bash
npm install
```

### Calendar shows "Using hardcoded fallback dates"
- Check that `http://localhost:3000` is running
- Check browser console for CORS errors
- Verify tokens in .env are correct
- Tokens may have expired; restart auth process

### Events not showing as unavailable
- Make sure events are marked as "Busy" in Google Calendar
- Calendar processes once per page refresh
- Check network tab in DevTools for API response

### "Authorization failed"
- Verify Client ID and Secret are correct
- Check that redirect URI matches in Google Cloud Console
- Try clearing browser cookies and authorizing again

## Refresh Token Expiration

Refresh tokens expire after 6 months of inactivity. If you see auth errors:

1. Stop the server
2. Run authorization again: `http://localhost:3000/auth/google`
3. Update tokens in .env file
4. Restart server

## API Endpoints

### GET `/api/availability`
Returns unavailable dates and busy slots for a date range.

**Query Parameters:**
- `startDate`: ISO date string (e.g., `2026-04-01T00:00:00.000Z`)
- `endDate`: ISO date string

**Response:**
```json
{
  "unavailableDates": ["2026-04-15", "2026-04-16"],
  "busySlots": [
    {
      "title": "Team Meeting",
      "startTime": "2026-04-15T10:00:00Z",
      "endTime": "2026-04-15T11:00:00Z"
    }
  ],
  "totalEvents": 5
}
```

### GET `/auth/google`
Returns OAuth authorization URL for initial setup.

### GET `/auth/google/callback`
OAuth callback endpoint (handled automatically).

## Support

For issues with:
- **Google API**: Check [Google Calendar API docs](https://developers.google.com/calendar/api/guides/overview)
- **Express/Node.js**: Check [Express docs](https://expressjs.com/)
- **CORS issues**: Ensure frontend and backend are communicating properly
