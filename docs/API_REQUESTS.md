# API Requests

These examples target the current Cloudflare Worker routes.

## Local development

Assuming the local preview is running at `http://localhost:8787`:

```bash
curl "http://localhost:8787/api/availability?startDate=2026-01-01T00:00:00Z&endDate=2026-01-31T23:59:59Z"
curl http://localhost:8787/auth/google
curl http://localhost:8787/api/availability/fallback
```

## Expected responses

### `/api/availability`

Returns JSON with unavailable dates and busy slots:

```json
{
  "unavailableDates": ["2026-01-15"],
  "busySlots": [],
  "totalEvents": 0
}
```

### `/api/availability/fallback`

Returns a static fallback payload when the Google Calendar API is unavailable:

```json
{
  "unavailableDates": ["2025-12-01"],
  "busySlots": [],
  "source": "fallback"
}
```

## Date format

Use ISO 8601 values with a timezone, for example:

- `2026-04-15T00:00:00Z`
- `2026-04-15T10:30:45Z`

The Worker rejects invalid dates or ranges larger than one year.


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
