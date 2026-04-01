# 📅 Google Calendar Integration - Project Index

Complete reference for your Google Calendar API integration.

## 📂 Project Structure

```
my-store/
├── 📖 Documentation Files
│   ├── IMPLEMENTATION_SUMMARY.md    ← Overview of what was built
│   ├── GOOGLE_CALENDAR_SETUP.md     ← Complete step-by-step setup guide
│   ├── QUICK_START.md               ← Quick reference guide
│   ├── API_REQUESTS.md              ← API testing examples
│   └── README (this file)
│
├── 🚀 Backend Files
│   ├── server.js                    ← Express server + Google Calendar API
│   ├── package.json                 ← Node.js dependencies
│   └── .env.example                 ← Environment variables template
│
├── 🎨 Frontend Files
│   ├── availability.html            ← Updated with API integration
│   ├── js/calendar.js               ← Updated to fetch from API
│   ├── js/config.js                 ← Configuration file (NEW)
│   ├── js/main.js
│   └── css/calendar.css
│
├── 🧪 Testing & Setup
│   ├── test-setup.js                ← Verification script
│   └── quickstart.sh                ← Auto-setup script
│
├── 📊 Data Files
│   ├── data/availability.json       ← Fallback JSON data
│   └── data/products.json
│
└── 🎯 Other Files
    ├── .gitignore
    ├── index.html
    ├── products.html
    ├── contact.html
    └── about.html
```

## 🚀 Getting Started (Quick Path)

### 1️⃣ **Setup (5 minutes)**
```bash
cd /home/daniele/Desktop/my-store
npm install
cp .env.example .env
```

### 2️⃣ **Get Google Credentials (10 minutes)**
Follow: `GOOGLE_CALENDAR_SETUP.md` (Section: "Step 2: Get Google Calendar API Credentials")

### 3️⃣ **Configure & Start (2 minutes)**
```bash
# Edit .env with your credentials
nano .env

# Start server
npm start

# Authorize app
# → Visit http://localhost:3000/auth/google
# → Copy tokens to .env
# → Restart npm start
```

### 4️⃣ **Test (1 minute)**
- Open: `http://localhost:3000/availability.html`
- Check browser console for: `✓ Loaded from Google Calendar`

## 📚 Documentation Guide

| Document | Purpose | Read Time |
|----------|---------|-----------|
| **IMPLEMENTATION_SUMMARY.md** | What was built and how it works | 5 min |
| **GOOGLE_CALENDAR_SETUP.md** | Complete setup from scratch | 15 min |
| **QUICK_START.md** | Quick reference for common tasks | 3 min |
| **API_REQUESTS.md** | How to test API endpoints | 5 min |

## 🔧 Configuration

### Environment Variables (.env)

```env
# Required for Google OAuth
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_REDIRECT_URL=http://localhost:3000/auth/google/callback

# Required for Calendar Access
GOOGLE_ACCESS_TOKEN=xxx
GOOGLE_REFRESH_TOKEN=xxx
GOOGLE_CALENDAR_ID=primary

# Optional
PORT=3000
NODE_ENV=development
```

### Frontend Configuration (js/config.js)

```javascript
const CALENDAR_CONFIG = {
    API_URL: 'http://localhost:3000',  // Change for production
    USE_FALLBACK: true,                 // Use JSON fallback
    DEBUG: true                         // Show debug logs
};
```

## 🎯 Key Features

✅ **Real-time Google Calendar sync**
- Events marked as "busy" automatically show as unavailable
- Updates on every page refresh

✅ **Graceful degradation**
- Falls back to JSON if API unavailable
- Falls back to hardcoded dates if JSON fails
- Calendar always works

✅ **Event details**
- Hover over unavailable dates to see event titles
- See all busy slots for the date range

✅ **Secure OAuth 2.0**
- Official Google authentication
- Read-only access to calendar
- No password sharing

## 📊 How It Works

```
┌──────────────────┐
│  Google Calendar │
│   (Cloud)        │
└────────┬─────────┘
         │ REST API
         ▼
┌──────────────────────────────────────┐
│  Backend Server (Node.js)            │
│  • OAuth2 Auth                       │
│  • Event Processing                  │
│  • /api/availability endpoint        │
└────────┬─────────────────────────────┘
         │ HTTP + JSON
         ▼
┌──────────────────────────────────────┐
│  Frontend Browser                    │
│  • availability.html                 │
│  • Displays calendar with events     │
└──────────────────────────────────────┘
```

## 🧪 Verification

Run the test script to verify everything is set up correctly:

```bash
node test-setup.js
```

Checks:
- ✓ .env file exists and configured
- ✓ node_modules installed
- ✓ Required files present
- ✓ Environment variables set
- ✓ Node.js modules importable

## 🚀 Deployment

### Development
```bash
npm start
# Runs at http://localhost:3000
```

### Production
```bash
# 1. Update .env with production URLs
# 2. Update CALENDAR_CONFIG.API_URL in js/config.js
# 3. Deploy to server (Heroku, AWS, etc.)

NODE_ENV=production npm start
```

## 🔗 API Endpoints

All endpoints require the backend server running.

### GET `/api/availability`
```
Query Parameters:
  - startDate: ISO date-time string
  - endDate: ISO date-time string

Response:
  {
    "unavailableDates": ["2026-04-15"],
    "busySlots": [...],
    "totalEvents": 5
  }
```

### GET `/auth/google`
```
Response:
  {
    "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?..."
  }
```

### GET `/auth/google/callback`
```
Handles OAuth callback
(Usually automatic via browser redirect)
```

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| "Module not found" | `npm install` |
| "Port 3000 in use" | Change PORT in .env or kill process |
| CORS error | Check API_URL in js/config.js |
| API returning 500 | Check tokens in .env, re-authorize |
| No events showing | Check events marked "Busy" in Calendar |

More details: See `GOOGLE_CALENDAR_SETUP.md` - Troubleshooting section

## 📞 Support

- **Setup questions**: Read `GOOGLE_CALENDAR_SETUP.md`
- **API questions**: Check `API_REQUESTS.md`
- **Quick help**: See `QUICK_START.md`
- **Google API docs**: https://developers.google.com/calendar/api
- **Express.js docs**: https://expressjs.com/

## 📋 Checklist

Setup checklist:

- [ ] Run `npm install`
- [ ] Copy `.env.example` to `.env`
- [ ] Create Google Cloud Project
- [ ] Enable Google Calendar API
- [ ] Create OAuth 2.0 credentials
- [ ] Run server: `npm start`
- [ ] Authorize: Visit `/auth/google`
- [ ] Copy tokens to `.env`
- [ ] Restart server
- [ ] Test: Open `/availability.html`
- [ ] Verify: Check browser console for ✓ message

## 📦 Files Summary

### New Files Added
- `server.js` - 180 lines - Express backend
- `package.json` - Node.js config
- `.env.example` - Configuration template
- `js/config.js` - Frontend configuration
- `GOOGLE_CALENDAR_SETUP.md` - Complete setup guide
- `QUICK_START.md` - Quick reference
- `API_REQUESTS.md` - API testing guide
- `test-setup.js` - Verification script
- `quickstart.sh` - Auto-setup script

### Files Modified
- `js/calendar.js` - Now fetches from API
- `availability.html` - Added config.js script

### Files Unchanged
- All HTML files (except availability.html)
- All CSS files
- All data files (used as fallback)
- All other JS files

## 💡 Key Concepts

### OAuth 2.0
Secure authentication with Google without sharing passwords

### Event Processing
Only "Busy" events mark dates as unavailable; "Free" events ignored

### Fallback Chain
API → JSON → Hardcoded (always works)

### API Integration
Frontend calls backend `/api/availability` endpoint for real-time data

## 🎓 Learning Resources

- **Google Calendar API**: https://developers.google.com/calendar
- **Express.js**: https://expressjs.com/
- **OAuth 2.0**: https://oauth.net/2/
- **Node.js**: https://nodejs.org/

## ✨ Next Steps

1. **Complete setup**: Follow `GOOGLE_CALENDAR_SETUP.md`
2. **Test it works**: Open `/availability.html` and verify
3. **Customize** (optional):
   - Modify styling in `css/calendar.css`
   - Adjust API response in `server.js`
   - Change date range in `js/calendar.js`
4. **Deploy** (optional): Put on production server

---

**Your availability calendar is now connected to Google Calendar!** 🎉

For detailed setup, start with: **GOOGLE_CALENDAR_SETUP.md**
