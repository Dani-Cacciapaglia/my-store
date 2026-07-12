# Google Calendar Setup

The availability calendar uses Google Calendar as the source of truth and the Worker routes to fetch and cache that data.

## 1. Create a Google Cloud project

1. Open the Google Cloud Console.
2. Create or select a project.
3. Enable the Google Calendar API.
4. Create OAuth credentials for a web application.

## 2. Configure OAuth redirect URIs

Add these redirect URIs in the Google Console:

- Local development: `http://localhost:8787/auth/google/callback`
- Production: `https://<your-worker-domain>.workers.dev/auth/google/callback`

## 3. Set the environment variables

The Worker reads these values from Cloudflare secrets or the local `.env` file:

```env
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URL=http://localhost:8787/auth/google/callback
GOOGLE_CALENDAR_ID=primary
```

## 4. Authorize the app

Start the local preview and open:

```text
http://localhost:8787/auth/google
```

Complete the Google consent flow. The callback stores the OAuth tokens in KV (when configured) and the calendar can then read the events.

## 5. Deploy to Cloudflare

Store the same variables in the Cloudflare Dashboard or via Wrangler secrets.

```bash
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put GOOGLE_REDIRECT_URL
wrangler secret put GOOGLE_CALENDAR_ID
```

## Security recommendations

- Rotate the Google client secret if it was ever exposed.
- Keep `.env` local and do not commit it.
- Restrict the redirect URIs to the exact hosts you use.
- Review the Worker response headers after deployment and confirm the CSP is acceptable.


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
