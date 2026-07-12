# Quick Start

This project now runs as a Cloudflare Pages site with Worker endpoints for the calendar API and OAuth flow.

## 1. Install dependencies

```bash
cd /home/daniele/Desktop/my-store
npm install
```

## 2. Configure environment variables

Copy the example file and fill in the real values:

```bash
cp .env.example .env
```

Required values:

```env
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URL=http://localhost:8787/auth/google/callback
GOOGLE_CALENDAR_ID=primary
```

## 3. Run locally

Use the Pages development server:

```bash
npm run pages:dev
```

Then open the preview URL shown by Wrangler. The site should be served from the local Pages preview while the Worker handles `/auth/*` and `/api/*`.

## 4. Test the calendar flow

- Visit the site home page
- Open the availability page
- Trigger `/auth/google` to start the OAuth flow
- Confirm `/api/availability` returns JSON for a date range

## 5. Deploy

```bash
npm run deploy:all
```

This runs the Pages publish step and the Worker deployment step in sequence.

## Security note

- Never commit `.env` or OAuth secrets
- Rotate credentials immediately if they are ever exposed
- Re-run `npm audit` regularly and address any remaining findings

