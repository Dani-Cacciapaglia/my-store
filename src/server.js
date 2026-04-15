const express = require('express');
const path = require('path');
const { google } = require('googleapis');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware and CORS setup
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

const REQUIRED_ENV_VARS = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GOOGLE_REDIRECT_URL',
];

const isPlaceholderValue = value => typeof value === 'string' && value.includes('your_');

const getEnvValue = key => process.env[key]?.trim();
const hasValidTokens = () => ['GOOGLE_ACCESS_TOKEN', 'GOOGLE_REFRESH_TOKEN']
    .every(key => {
        const value = getEnvValue(key);
        return value && !isPlaceholderValue(value);
    });

const validateEnv = () => {
    const missing = REQUIRED_ENV_VARS.filter(key => {
        const value = getEnvValue(key);
        return !value || isPlaceholderValue(value);
    });

    if (missing.length > 0) {
        console.error('\n❌ ERROR: Missing or invalid environment variables:');
        missing.forEach(key => console.error(`   - ${key}`));
        console.error('\nPlease update your .env file with proper values from Google Cloud Console\n');
        process.exit(1);
    }
};

validateEnv();

const STATIC_FALLBACK_DATES = [
    '2025-12-01', '2025-12-02', '2025-12-03', '2025-12-04', '2025-12-05',
    '2025-12-06', '2025-12-07', '2025-12-08', '2025-12-12', '2025-12-13',
    '2025-12-14', '2025-12-16', '2025-12-17', '2025-12-18', '2025-12-20',
    '2025-12-24', '2025-12-25', '2025-12-26', '2025-12-27', '2025-12-31',
];

const getAuthSuccessHtml = tokens => `
<!DOCTYPE html>
<html>
<head>
    <title>Authorization Success</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { background: white; padding: 30px; border-radius: 8px; max-width: 800px; margin: 0 auto; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { color: #4CAF50; }
        .code { background: #f0f0f0; padding: 15px; border-radius: 4px; font-family: monospace; word-break: break-all; margin: 10px 0; }
        .label { font-weight: bold; color: #333; margin-top: 15px; }
        button { background: #4CAF50; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; }
        button:hover { background: #45a049; }
        .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 4px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>✅ Authorization Successful!</h1>

        <div class="warning">
            <strong>⚠️ Important:</strong> Copy the tokens below and add them to your <code>.env</code> file
        </div>

        <div class="label">Access Token:</div>
        <div class="code">${tokens.access_token}</div>

        <div class="label">Refresh Token:</div>
        <div class="code">${tokens.refresh_token}</div>

        <h3>Next Steps:</h3>
        <ol>
            <li>Open your <code>.env</code> file</li>
            <li>Replace <code>GOOGLE_ACCESS_TOKEN=your_access_token_here</code> with the Access Token above</li>
            <li>Replace <code>GOOGLE_REFRESH_TOKEN=your_refresh_token_here</code> with the Refresh Token above</li>
            <li>Save the file</li>
            <li>Restart the server: <code>npm start</code></li>
        </ol>

        <h3>Verify it works:</h3>
        <ol>
            <li>Open <a href="http://localhost:3000/availability.html">http://localhost:3000/availability.html</a></li>
            <li>Check browser console for: <code>✓ Loaded from Google Calendar</code></li>
        </ol>

        <button onclick="window.location.href='http://localhost:3000/availability.html'">Go to Calendar</button>
    </div>
</body>
</html>
`;

const isEventBusy = event => event.status !== 'cancelled' && event.transparency !== 'transparent';

const getEventRange = event => {
    const isAllDay = !!event.start.date && !event.start.dateTime;
    const start = new Date(isAllDay ? event.start.date : event.start.dateTime || event.start.date);
    const end = new Date(isAllDay ? event.end.date : event.end.dateTime || event.end.date);
    return { start, end };
};

const markUnavailableDates = (set, start, end) => {
    const current = new Date(start);
    current.setHours(0, 0, 0, 0);
    while (current < end) {
        set.add(formatDate(current));
        current.setDate(current.getDate() + 1);
    }
};

// Google Calendar API Setup
let oauth2Client;
let calendar;

try {
    oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URL
    );

    calendar = google.calendar({
        version: 'v3',
        auth: oauth2Client
    });
    if (hasValidTokens()) {
        oauth2Client.setCredentials({
            access_token: getEnvValue('GOOGLE_ACCESS_TOKEN'),
            refresh_token: getEnvValue('GOOGLE_REFRESH_TOKEN'),
        });
        console.log('✓ OAuth credentials loaded from environment');
    } else {
        console.log('⚠️  No valid OAuth tokens found - authorization required');
    }
} catch (error) {
    console.error('❌ OAuth client setup failed:', error.message);
    console.error('Check your GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URL in .env');
    process.exit(1);
}

// Endpoint to get authorization URL (for initial setup)
app.get('/auth/google', (req, res) => {
    try {
        const authUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: ['https://www.googleapis.com/auth/calendar.readonly'],
            prompt: 'consent',
        });
        res.redirect(authUrl);
    } catch (error) {
        console.error('Auth URL generation failed:', error);
        res.status(500).send('OAuth configuration error. Check your .env file.');
    }
});

// Serve auth page at multiple endpoints to avoid "not found" mistakes
app.get(['/auth', '/auth.html', '/auth.htm'], (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'auth.html'));
});

// Endpoint to handle OAuth callback
app.get('/auth/google/callback', async (req, res) => {
    try {
        const { code, error } = req.query;

        if (error) {
            console.error('OAuth error:', error);
            return res.redirect('/auth.html?error=' + encodeURIComponent(error));
        }

        if (!code) {
            return res.redirect('/auth.html?error=No authorization code received');
        }

        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        // Store tokens in environment or database
        console.log('\n====================================');
        console.log('✅ AUTHORIZATION SUCCESSFUL!');
        console.log('====================================');
        console.log('\nAdd these to your .env file:\n');
        console.log(`GOOGLE_ACCESS_TOKEN=${tokens.access_token}`);
        console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
        console.log('\n====================================\n');
        const htmlResponse = getAuthSuccessHtml(tokens);

        res.send(htmlResponse);
    } catch (error) {
        console.error('Auth error:', error);
        res.redirect('/auth.html?error=' + encodeURIComponent(error.message));
    }
});

// Endpoint to get availability data from Google Calendar
app.get('/api/availability', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'startDate and endDate required' });
        }

        // Get events from Google Calendar
        const response = await calendar.events.list({
            calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
            timeMin: new Date(startDate).toISOString(),
            timeMax: new Date(endDate).toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
        });

        const events = response.data.items || [];

        // Extract unavailable dates (busy times)
        const unavailableDates = new Set();
        const busySlots = [];

        events.forEach(event => {
            if (!isEventBusy(event)) return;
            const { start, end } = getEventRange(event);
            markUnavailableDates(unavailableDates, start, end);
            busySlots.push({
                title: event.summary || 'Busy',
                startTime: event.start.dateTime || event.start.date,
                endTime: event.end.dateTime || event.end.date,
            });
        });

        res.json({
            unavailableDates: Array.from(unavailableDates),
            busySlots: busySlots,
            totalEvents: events.length,
        });
    } catch (error) {
        console.error('Calendar API error:', error);
        res.status(500).json({ error: 'Failed to fetch calendar data' });
    }
});

// Helper function to format dates
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Endpoint for fallback (static availability if Google Calendar fails)
app.get('/api/availability/fallback', (req, res) => {
    res.json({
        unavailableDates: STATIC_FALLBACK_DATES,
        busySlots: [],
    });
});
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log('Visit http://localhost:3000/auth/google to authorize');
});
