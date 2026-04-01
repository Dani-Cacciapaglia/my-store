# 🗓️ Google Calendar Integration - Quick Reference

Your availability calendar is now connected to Google Calendar!

## Quick Start (5 minutes)

```bash
# 1. Install dependencies
cd /home/daniele/Desktop/my-store
npm install

# 2. Copy environment template
cp .env.example .env

# 3. Get API credentials from Google Cloud Console
# → See GOOGLE_CALENDAR_SETUP.md for detailed steps

# 4. Start the server
npm start

# 5. Authorize in browser
# → Visit http://localhost:3000/auth/google
# → Copy tokens to .env

# 6. Restart and test
# → http://localhost:3000/availability.html
```

## What's New

### Files Added
- `server.js` - Express backend with Google Calendar API integration
- `package.json` - Node.js dependencies
- `.env.example` - Environment variable template
- `js/config.js` - Frontend configuration
- `GOOGLE_CALENDAR_SETUP.md` - Comprehensive setup guide
- `quickstart.sh` - Automated setup script

### Files Modified
- `js/calendar.js` - Now fetches from Google Calendar API
- `availability.html` - Added config script

## How It Works

1. **Backend Server** (`server.js`) handles:
   - OAuth authentication with Google
   - Fetching calendar events via Google Calendar API
   - Converting events to unavailable dates
   - Providing REST endpoints

2. **Frontend** (`calendar.js`) now:
   - Calls `/api/availability` endpoint
   - Displays busy days from Google Calendar
   - Shows event titles on hover
   - Falls back to JSON if API unavailable

3. **Smart Fallback**:
   - Try Google Calendar API first
   - Falls back to `data/availability.json`
   - Finally uses hardcoded dates if needed

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/availability` | GET | Get unavailable dates for date range |
| `/auth/google` | GET | Get OAuth authorization URL |
| `/auth/google/callback` | GET | OAuth callback handler |

## Key Features

✅ Real-time sync with Google Calendar  
✅ Automatic unavailable date detection  
✅ Event titles shown on hover  
✅ Graceful fallback to static data  
✅ Works offline with fallback  
✅ Easy to deploy  

## Environment Variables

```env
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_secret
GOOGLE_REDIRECT_URL=http://localhost:3000/auth/google/callback
GOOGLE_ACCESS_TOKEN=your_access_token
GOOGLE_REFRESH_TOKEN=your_refresh_token
GOOGLE_CALENDAR_ID=primary
PORT=3000
```

## Troubleshooting

**"Cannot find module 'express'"**
```bash
npm install
```

**"API unavailable" warning**
- Check `http://localhost:3000` is running
- Verify tokens in `.env` file
- Check browser console for CORS errors

**Events not showing as unavailable**
- Ensure events are marked "Busy" in Google Calendar
- Page needs refresh to fetch latest data
- Check `/api/availability` response in DevTools Network tab

**Authorization failed**
- Verify Client ID and Secret
- Check redirect URI matches Google Cloud Console
- Try new authorization: `http://localhost:3000/auth/google`

## Deployment

### Development
```bash
npm start
```

### Production
```bash
NODE_ENV=production npm start
```

Update `.env` with production URLs and deploy to server (Heroku, AWS, DigitalOcean, etc).

## Full Documentation

See `GOOGLE_CALENDAR_SETUP.md` for:
- Step-by-step Google Cloud setup
- Calendar selection options
- Event processing logic
- Production deployment
- API reference

## Support

- **Google API Issues**: [Google Calendar API Docs](https://developers.google.com/calendar/api)
- **Node.js Issues**: [Node.js Documentation](https://nodejs.org/docs/)
- **Express Issues**: [Express Documentation](https://expressjs.com/)

---

**Happy calendaring! 📅**
