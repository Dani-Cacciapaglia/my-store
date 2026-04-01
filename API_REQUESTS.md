# Google Calendar API - Request Examples

This file shows example requests to test your Google Calendar integration API.

## Setup

1. Start the server: `npm start`
2. Server runs at: `http://localhost:3000`

## Test Requests

### 1. Get Authorization URL

```
GET http://localhost:3000/auth/google
```

**Response:**
```json
{
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?..."
}
```

**What to do:**
- Open the authUrl in browser
- Sign in with your Google account
- Grant calendar access
- Copy tokens from server output

---

### 2. Get Availability for Date Range

**Request:**
```
GET http://localhost:3000/api/availability?startDate=2026-04-01T00:00:00Z&endDate=2026-06-30T23:59:59Z
```

**Response:**
```json
{
  "unavailableDates": [
    "2026-04-15",
    "2026-04-16",
    "2026-05-01",
    "2026-05-02"
  ],
  "busySlots": [
    {
      "title": "Team Meeting",
      "startTime": "2026-04-15T10:00:00Z",
      "endTime": "2026-04-15T11:00:00Z"
    },
    {
      "title": "Conference",
      "startTime": "2026-05-01T09:00:00Z",
      "endTime": "2026-05-02T17:00:00Z"
    }
  ],
  "totalEvents": 2
}
```

---

### 3. Get Fallback Availability

If Google Calendar API is unavailable or not configured:

```
GET http://localhost:3000/api/availability/fallback
```

**Response:**
```json
{
  "unavailableDates": [
    "2025-12-01",
    "2025-12-02",
    "2025-12-24",
    "2025-12-25",
    "2025-12-26"
  ],
  "busySlots": []
}
```

---

## Using cURL

### Get Authorization URL
```bash
curl http://localhost:3000/auth/google
```

### Get Availability
```bash
curl "http://localhost:3000/api/availability?startDate=2026-04-01T00:00:00Z&endDate=2026-06-30T23:59:59Z"
```

### Format JSON Output
```bash
curl "http://localhost:3000/api/availability?startDate=2026-04-01T00:00:00Z&endDate=2026-06-30T23:59:59Z" | json_pp
```

---

## Using Postman

### Import into Postman

1. Open Postman
2. Create new collection: "My Store Calendar"
3. Add requests:

#### Request 1: Get Auth URL
- **Method:** GET
- **URL:** `http://localhost:3000/auth/google`
- **Headers:** None needed
- **Body:** None

#### Request 2: Get Availability
- **Method:** GET
- **URL:** `http://localhost:3000/api/availability?startDate=2026-04-01T00:00:00Z&endDate=2026-06-30T23:59:59Z`
- **Headers:** None needed
- **Body:** None
- **Params:**
  - Key: `startDate` | Value: `2026-04-01T00:00:00Z`
  - Key: `endDate` | Value: `2026-06-30T23:59:59Z`

---

## Using JavaScript

### Fetch from Browser Console

```javascript
// Get current date range (next 3 months)
const today = new Date();
const start = new Date(today.getFullYear(), today.getMonth(), 1);
const end = new Date(today.getFullYear(), today.getMonth() + 3, 0);

fetch(`http://localhost:3000/api/availability?` +
      `startDate=${start.toISOString()}&` +
      `endDate=${end.toISOString()}`)
  .then(r => r.json())
  .then(data => {
    console.log('Unavailable dates:', data.unavailableDates);
    console.log('Busy slots:', data.busySlots);
  });
```

### Node.js Request

```javascript
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/availability?startDate=2026-04-01T00:00:00Z&endDate=2026-06-30T23:59:59Z',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    console.log(JSON.parse(data));
  });
});

req.end();
```

---

## Common Test Scenarios

### Scenario 1: Check if server is running
```bash
curl http://localhost:3000/auth/google
# Should return JSON with authUrl
# If error: server not running, check: npm start
```

### Scenario 2: Verify Google Calendar sync
```bash
curl "http://localhost:3000/api/availability?startDate=2026-04-01T00:00:00Z&endDate=2026-04-30T23:59:59Z"
# Should return events from your Google Calendar
# If empty: no events for April, try different date range
```

### Scenario 3: Test fallback
Stop server:
```bash
# Kill npm process
# Then in terminal:
curl http://localhost:3000/api/availability/fallback
# Should still work (returns static dates)
```

---

## Expected Date Format

All dates must be in ISO 8601 format with timezone:

### Valid formats:
- `2026-04-15T00:00:00Z` ✓
- `2026-04-15T10:30:45Z` ✓
- `2026-04-15T00:00:00.000Z` ✓

### Invalid formats:
- `2026-04-15` ✗ (missing time)
- `04/15/2026` ✗ (wrong format)
- `2026-4-15T0:0:0Z` ✗ (missing zero-padding)

---

## Response Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | API returned availability data |
| 400 | Bad Request | Missing startDate or endDate |
| 500 | Server Error | Google API failure or other error |

---

## Debugging Tips

### Check if API is responding
```bash
curl -i http://localhost:3000/auth/google
# Look for: HTTP/1.1 200 OK
```

### See full response headers
```bash
curl -v http://localhost:3000/auth/google
```

### Pretty print JSON
```bash
curl http://localhost:3000/api/availability/fallback | json_pp
```

### Check server logs
```bash
# Server will output:
# ✓ Loaded from Google Calendar: [dates]
# 📅 Busy slots: [events]
```

---

## Troubleshooting API Requests

### 404 Not Found
- ✓ Is server running? (`npm start`)
- ✓ Correct URL? (`http://localhost:3000`)
- ✓ Correct path? (`/api/availability`)

### Connection Refused
- ✓ Server not running (run `npm start`)
- ✓ Wrong port (check `.env` PORT variable)

### Invalid JSON Response
- ✓ Check error logs in server console
- ✓ Verify Google credentials in `.env`
- ✓ Try fallback endpoint: `/api/availability/fallback`

### Empty unavailableDates
- ✓ No events in Google Calendar for that date range
- ✓ Events may be marked "Free" instead of "Busy"
- ✓ Try different date range

---

## Next Steps

1. ✓ Test basic connectivity
2. ✓ Verify Google Calendar sync
3. ✓ Test fallback behavior
4. ✓ Use in your frontend (js/calendar.js)

See `GOOGLE_CALENDAR_SETUP.md` for full setup guide.
