# 🚀 Remaining Tasks for Cloudflare Workers Migration

This is the single consolidated task and prompt file for the Cloudflare migration. It replaces older plan/instruction documents in the repository.

This file contains all remaining tasks that require external credentials, accounts, or system changes that cannot be completed automatically. Each task includes detailed instructions and optimized prompts for execution.

## 📋 Prerequisites Checklist

Before proceeding with any tasks, ensure:
- ✅ Node.js upgraded to v22+ (current: v18.19.1)
- ✅ Cloudflare account with Workers enabled
- ✅ Google Cloud Console project with Calendar API enabled
- ✅ Domain configured (optional, can use .workers.dev initially)

---

## 🔧 Task 1: Upgrade Node.js Version

**Status:** BLOCKED - Wrangler requires Node.js v22.0.0 or higher

**Instructions:**
1. Install a Node version manager (recommended: nvm or volta)
2. Install and switch to Node.js v22+
3. Verify installation: `node --version` should show v22.x.x
4. Reinstall wrangler if needed: `npm install wrangler@latest`

**Optimized Prompt:**
```
Upgrade Node.js to v22+ for Wrangler compatibility:
1. Install nvm: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
2. Restart terminal and run: nvm install 22 && nvm use 22
3. Verify: node --version (should show v22.x.x)
4. In project directory: npm install wrangler@latest
```

---

## 🔐 Task 2: Authenticate with Cloudflare

**Status:** BLOCKED - Required for all Wrangler operations

**Instructions:**
1. Ensure Node.js v22+ is installed
2. Run `wrangler login` in project directory
3. Follow browser authentication flow
4. Verify with `wrangler whoami`

**Optimized Prompt:**
```
Authenticate Wrangler with Cloudflare:
1. cd /home/daniele/Desktop/my-store
2. wrangler login
3. Complete browser authentication
4. Verify: wrangler whoami
```

---

## 🗄️ Task 3: Create KV Namespaces

**Status:** BLOCKED - Required for token storage and static files

**Instructions:**
1. Complete Task 2 first
2. Create TOKENS namespace for OAuth tokens
3. Create STATIC_FILES namespace for static assets
4. Create RSS_CACHE namespace for daily RSS caching
5. Update wrangler.toml with actual namespace IDs

**Development Namespaces (with --preview flag):**
- TOKENS: `wrangler kv:namespace create "TOKENS" --preview`
- STATIC_FILES: `wrangler kv:namespace create "STATIC_FILES" --preview`
- RSS_CACHE: `wrangler kv:namespace create "RSS_CACHE" --preview`

**Production Namespaces (without --preview flag):**
- TOKENS: `wrangler kv:namespace create "TOKENS"`
- STATIC_FILES: `wrangler kv:namespace create "STATIC_FILES"`
- RSS_CACHE: `wrangler kv:namespace create "RSS_CACHE"`

**Optimized Prompt:**
```
Create KV namespaces for development:
1. cd /home/daniele/Desktop/my-store
2. wrangler kv:namespace create "TOKENS" --preview
3. wrangler kv:namespace create "STATIC_FILES" --preview
4. wrangler kv:namespace create "RSS_CACHE" --preview
5. Copy the returned IDs and update wrangler.toml [env.development] section
6. Replace all REPLACE_WITH_* IDs with actual IDs
```

---

## 🌐 Task 4: Set Up Google OAuth Credentials

**Status:** BLOCKED - Required for Calendar API integration

**Instructions:**
1. Go to Google Cloud Console: https://console.cloud.google.com/
2. Create/select a project
3. Enable Google Calendar API
4. Create OAuth 2.0 credentials (Web application)
5. Set authorized redirect URIs:
   - Development: `http://localhost:8787/auth/google/callback` (Wrangler dev server)
   - Production: `https://your-domain.workers.dev/auth/google/callback`
6. Note down: Client ID, Client Secret

**Optimized Prompt:**
```
Set up Google OAuth for Calendar API:
1. Go to https://console.cloud.google.com/
2. Create/select project "my-store-calendar"
3. Enable APIs: Google Calendar API
4. Create Credentials → OAuth 2.0 Client ID → Web application
5. Authorized redirect URIs:
   - http://localhost:8787/auth/google/callback (dev)
   - https://my-store.your-subdomain.workers.dev/auth/google/callback (prod)
6. Copy Client ID and Client Secret
```

---

## 🧩 Task 5: Configure Cloudflare Pages Hybrid Deployment for Static Files

**Status:** BLOCKED - Recommended before production deployment.

**Instructions:**
1. Decide to use Cloudflare Pages for `public/` and Cloudflare Workers for `/auth/*` and `/api/*`.
2. Connect the GitHub repository `Dani-Cacciapaglia/my-store` to Cloudflare Pages.
3. Set the Pages build command to:
   - `npm run build` (or leave empty if no build step is required)
4. Set the publish directory to:
   - `public/`
5. Add required environment variables for Pages or Workers if needed:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REDIRECT_URL`
   - `GOOGLE_CALENDAR_ID`
6. Confirm Pages serves static files while Workers handles `/auth/*` and `/api/*`.

**Optimized Prompt:**
```
Configure Cloudflare Pages for static assets and hybrid Worker routing:
1. Connect GitHub repo Dani-Cacciapaglia/my-store to Cloudflare Pages
2. Set publish directory: public/
3. Set build command: npm run build
4. Configure environment variables needed by the site
5. Use Cloudflare Workers for /auth/* and /api/* only
6. Keep public/ static files unchanged and served by Pages
```

---

## ⚙️ Task 6: Configure Environment Variables

**Status:** BLOCKED - Required after Tasks 3 & 4 completion

**Instructions:**
1. Complete Tasks 3 & 4 first
2. Set secrets in Cloudflare Dashboard or via wrangler
3. Required variables:
   - GOOGLE_CLIENT_ID (from Task 4)
   - GOOGLE_CLIENT_SECRET (from Task 4)
   - GOOGLE_REDIRECT_URL (matches Google Console)
   - GOOGLE_CALENDAR_ID (usually "primary")

**Using Wrangler CLI:**
```bash
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put GOOGLE_REDIRECT_URL
wrangler secret put GOOGLE_CALENDAR_ID
```

**Optimized Prompt:**
```
Set Cloudflare environment variables:
1. cd /home/daniele/Desktop/my-store
2. wrangler secret put GOOGLE_CLIENT_ID (paste from Google Console)
3. wrangler secret put GOOGLE_CLIENT_SECRET (paste from Google Console)
4. wrangler secret put GOOGLE_REDIRECT_URL
   - Dev: http://localhost:8787/auth/google/callback
   - Prod: https://my-store.your-subdomain.workers.dev/auth/google/callback
5. wrangler secret put GOOGLE_CALENDAR_ID
   - Value: primary (or your calendar ID)
```

---

## 🧪 Task 7: Local Testing & Validation

**Status:** BLOCKED - Requires Tasks 1-6 completion

**Instructions:**
1. Complete all prerequisites
2. Start local development server
3. Test OAuth flow: visit /auth/google
4. Test API endpoints: /api/availability
5. Test static file serving

**Commands:**
```bash
npm run dev  # Starts Wrangler dev server on localhost:8787
```

**Test URLs:**
- Home: http://localhost:8787/
- Auth: http://localhost:8787/auth
- API: http://localhost:8787/api/availability?startDate=2024-01-01T00:00:00Z&endDate=2024-12-31T23:59:59Z

**Optimized Prompt:**
```
Test local development setup:
1. cd /home/daniele/Desktop/my-store
2. npm run dev
3. In browser, test:
   - http://localhost:8787/ (should show index.html)
   - http://localhost:8787/auth (should show auth page)
   - http://localhost:8787/auth/google (should redirect to Google)
4. After OAuth: http://localhost:8787/api/availability?startDate=2024-01-01T00:00:00Z&endDate=2024-12-31T23:59:59Z
```

---

## 🚀 Task 8: Production Deployment

**Status:** BLOCKED - Requires Tasks 1-7 completion

**Instructions:**
1. Complete local testing successfully
2. Update wrangler.toml production KV IDs (from Task 3)
3. Deploy to production
4. Configure custom domain (optional)
5. Test production endpoints

**Commands:**
```bash
wrangler deploy  # Deploy to production
```

**Post-deployment:**
- Update Google Console redirect URI if using custom domain
- Test OAuth flow in production
- Verify API responses

**Optimized Prompt:**
```
Deploy to production:
1. cd /home/daniele/Desktop/my-store
2. Update wrangler.toml [env.production] KV IDs with production namespace IDs
3. wrangler deploy
4. Test production URL: https://my-store.your-subdomain.workers.dev/
5. Update Google Console redirect URI if needed
6. Test OAuth: https://my-store.your-subdomain.workers.dev/auth/google
```

---

## 📋 Execution Order

Execute tasks in this exact order:

1. **Task 1** → Node.js upgrade
2. **Task 2** → Cloudflare authentication  
3. **Task 3** → KV namespace creation
4. **Task 4** → Google OAuth setup
5. **Task 5** → Environment variables
6. **Task 6** → Local testing
7. **Task 7** → Production deployment

## 🔍 Validation Checklist

After completing all tasks, verify:

- [ ] `wrangler whoami` shows authenticated account
- [ ] `wrangler kv:namespace list` shows TOKENS and STATIC_FILES
- [ ] Local dev server starts without errors
- [ ] OAuth flow completes successfully
- [ ] API endpoints return valid JSON responses
- [ ] Static files load correctly
- [ ] Production deployment succeeds
- [ ] Production URLs work as expected

## 🔐 Security Review & Remediation Checklist

**Status:** IN PROGRESS - Review and rotate secrets regularly.

**What was hardened in this pass:**
1. Added security headers such as CSP, `X-Content-Type-Options`, `Referrer-Policy`, and `X-Frame-Options`.
2. Sanitized requested asset paths to prevent traversal-style access and reject malformed requests.
3. Validated API date parameters and limited the supported range to one year.
4. Restricted the debug endpoint so it is not exposed by default.
5. Reduced the amount of internal error detail returned to clients during OAuth and API failures.

**Recommended follow-up actions:**
1. Rotate the Google OAuth client secret and any exposed refresh/access tokens immediately if they were ever shared or committed.
2. Store production secrets in Cloudflare secrets or the Pages/Workers dashboard rather than relying on local `.env` files.
3. Review the deployed CSP in a browser and adjust if any legitimate resource is being blocked.
4. Run `npm audit` and `node --test tests/cloudflare-config.test.js` regularly after dependency updates.
5. If the site will receive public traffic, enable Cloudflare WAF / rate limiting / bot management on the zone where the project is hosted.

**Optimized Prompt:**
```
Perform a security review for the Cloudflare deployment:
1. Rotate all exposed Google OAuth secrets and tokens.
2. Confirm that Cloudflare secrets and environment variables are set for production.
3. Review the Worker response headers and adjust CSP as needed.
4. Enable Cloudflare security protections such as WAF, rate limiting, and bot management if available.
5. Re-run dependency and regression checks before publishing further changes.
```

---

## 🆘 Troubleshooting

**Common Issues:**

1. **"Wrangler requires Node.js v22"**
   - Solution: Complete Task 1

2. **"Not authenticated"**
   - Solution: Complete Task 2

3. **"KV namespace not found"**
   - Solution: Complete Task 3, update wrangler.toml

4. **"Invalid OAuth redirect URI"**
   - Solution: Ensure redirect URI matches Google Console exactly

5. **"Calendar API not enabled"**
   - Solution: Enable Calendar API in Google Cloud Console

**Debug Commands:**
```bash
wrangler tail  # View production logs
wrangler kv:key list --namespace-id YOUR_TOKENS_ID  # Check stored tokens
```

---

*Generated on: May 13, 2026*
*Migration Status: Phases 1-4 Complete, Phase 5 Blocked by External Dependencies*