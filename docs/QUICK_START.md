# Quick Start

This project runs as a Cloudflare Pages site with Worker endpoints for the calendar API, RSS feeds, and OAuth flow.

## 1. Install dependencies

```bash
cd /home/daniele/Desktop/my-store
npm install
```

## 2. Configure environment variables

Copy the example file and fill in the real values:

```bash
./quick-setup.sh
```

The script creates `.env` with owner-only permissions, never prints credential values, and rejects credential-shaped values in tracked files. Use `.env` only for local development.

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

- Never commit `.env`, OAuth tokens, or Cloudflare credentials.
- The Worker restricts CORS, validates OAuth `state`, and returns availability without calendar titles.
- Set `GOOGLE_CLIENT_SECRET` and OAuth tokens as Cloudflare secrets/KV values, not browser variables.
- Run `npm audit --audit-level=high` before deployment. The current lockfile reports zero vulnerabilities, including development dependencies.
- The live site exposes the OAuth client ID and normal public booking/contact content. It must never expose client secrets, access tokens, refresh tokens, calendar titles, or internal error messages.
- If a Wrangler token or OAuth credential was exposed, revoke it and create a replacement before deploying:

```bash
npx wrangler logout
npx wrangler login
npx wrangler secret put GOOGLE_CLIENT_SECRET --env production
npx wrangler secret put GOOGLE_CLIENT_ID --env production
npx wrangler secret put GOOGLE_REDIRECT_URL --env production
```

