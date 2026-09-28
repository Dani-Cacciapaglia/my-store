import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseRSSFeed } from '../src/rss.js';
import { datesFromBusyPeriods, handleAvailability, handleContactSubmission } from '../src/api.js';
import { getStoredTokens } from '../src/utils.js';
import worker from '../src/worker.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

test('legal page discloses privacy, terms, cookies, and actual providers', () => {
  const legal = read('public/legal.html');

  for (const section of ['privacy', 'terms', 'cookies']) {
    assert.match(legal, new RegExp(`id="${section}"`));
  }
  assert.match(legal, /Web3Forms/);
  assert.match(legal, /Cloudflare/);
  assert.match(legal, /Google Calendar API/);
  assert.match(legal, /non costituisce consenso promozionale/);
});

test('contact form minimizes data and requires notice acknowledgment', () => {
  const form = read('public/contact.html');
  const contactScript = read('public/js/contact.js');
  const contactPage = read('public/contact.html');
  const styles = read('public/css/style.css');

  assert.match(form, /id="privacy-acknowledgment" required/);
  assert.match(form, /<span>Ho letto l'<a href="legal\.html#privacy">informativa privacy<\/a>/);
  assert.match(styles, /\.consent-group > label \{\s*display: grid;/);
  assert.match(styles, /\.consent-group input\[type="checkbox"\] \{[\s\S]*?appearance: auto;[\s\S]*?padding: 0;/);
  const nameInput = form.match(/<input\b[^>]*id="name"[^>]*>/s)?.[0] || '';
  assert.match(nameInput, /placeholder="Il tuo nome"/);
  assert.doesNotMatch(nameInput, /\brequired\b/);
  assert.doesNotMatch(form, /id="adults"[\s\S]*?value="2"/);
  assert.doesNotMatch(form, /name="quotation"/);
  assert.match(contactScript, /if \(!privacyAcknowledgment\.checked\)/);
  assert.match(contactScript, /Richiesta inviata\. Grazie per averci contattato/);
  assert.match(contactScript, /di norma entro 24 ore/);
  assert.match(contactPage, /js\/contact\.js\?v=20260928-24h-confirmation/);
  assert.match(contactScript, /sessionStorage\.removeItem\('bookingData'\)/);
});

test('availability responses expose dates without calendar event details', () => {
  const workerApi = read('src/api.js');
  const expressApi = read('src/server.js');

  assert.match(workerApi, /availabilityByApartment/);
  assert.match(workerApi, /calendar\.freebusy\.query/);
  assert.match(workerApi, /GOOGLE_CALENDAR_ID_ULIVO/);
  assert.match(workerApi, /GOOGLE_CALENDAR_ID_SALINE/);
  assert.match(workerApi, /ALLOW_SHARED_APARTMENT_CALENDAR/);
  assert.match(workerApi, /new Set\(Object\.values\(calendarIds\)\)/);
  assert.doesNotMatch(workerApi, /busySlots|totalEvents|event\.summary/);
  assert.match(expressApi, /unavailableDates: Array\.from\(unavailableDates\)/);
  assert.doesNotMatch(expressApi, /busySlots|totalEvents|event\.summary/);
  assert.doesNotMatch(workerApi, /console\.error\('Availability API error:', error\)/);
  assert.doesNotMatch(expressApi, /console\.error\('Calendar API error:', error\)/);
});

test('FreeBusy intervals map independently to Rome calendar dates', () => {
  assert.deepEqual(datesFromBusyPeriods([
    { start: '2026-10-24T22:00:00Z', end: '2026-10-26T23:00:00Z' },
  ]), ['2026-10-25', '2026-10-26']);
  assert.deepEqual(datesFromBusyPeriods([
    { start: '2026-01-02T11:00:00Z', end: '2026-01-03T23:00:00Z' },
  ]), ['2026-01-02', '2026-01-03']);
});

test('fresh OAuth tokens stored in KV override stale environment tokens', async () => {
  const stored = await getStoredTokens({
    GOOGLE_ACCESS_TOKEN: 'stale-access-token',
    GOOGLE_REFRESH_TOKEN: 'stale-refresh-token',
    TOKENS: {
      get: async key => key === 'access_token' ? 'new-access-token' : 'new-refresh-token',
    },
  });
  assert.deepEqual(stored, { access_token: 'new-access-token', refresh_token: 'new-refresh-token' });
});

test('availability accepts 13 displayed months and requires distinct apartment calendar IDs', async () => {
  const request = new Request('https://store.test/api/availability?startDate=2026-09-01T00:00:00%2B02:00&endDate=2027-09-30T00:00:00%2B02:00');
  const response = await handleAvailability(request, {});
  assert.equal(response.status, 503);
  assert.deepEqual((await response.json()).required, ['GOOGLE_CALENDAR_ID_ULIVO', 'GOOGLE_CALENDAR_ID_SALINE']);

  const tooWide = new Request('https://store.test/api/availability?startDate=2026-09-01T00:00:00%2B02:00&endDate=2027-10-01T00:00:00%2B02:00');
  const tooWideResponse = await handleAvailability(tooWide, {});
  assert.equal(tooWideResponse.status, 400);
});

test('contact proxy rejects oversized bodies before provider delivery', async () => {
  const request = new Request('https://store.test/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': '20000' },
    body: 'message=small',
  });
  const response = await handleContactSubmission(request, { WEB3FORMS_ACCESS_KEY: 'test-key' });
  assert.equal(response.status, 413);

  const streamedBody = new URLSearchParams({ email: 'guest@example.com', message: 'x'.repeat(17 * 1024) });
  const streamedRequest = new Request('https://store.test/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: streamedBody,
  });
  const streamedResponse = await handleContactSubmission(streamedRequest, { WEB3FORMS_ACCESS_KEY: 'test-key' });
  assert.equal(streamedResponse.status, 413);

  const missingLimiterRequest = new Request('https://store.test/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ email: 'guest@example.com', message: 'Inquiry' }),
  });
  const missingLimiterResponse = await handleContactSubmission(missingLimiterRequest, { WEB3FORMS_ACCESS_KEY: 'test-key' });
  assert.equal(missingLimiterResponse.status, 503);
});

test('Worker serves custom HTML for an unknown page with an actual 404 status', async () => {
  const response = await worker.fetch(new Request('https://store.test/not-a-page'), {
    STATIC_FILES: { get: async (key) => key === '404.html' ? '<h1>Pagina non trovata</h1>' : null },
    PAGES_URL: 'http://localhost:8788',
  }, {});
  assert.equal(response.status, 404);
  assert.match(response.headers.get('content-type'), /text\/html/);
  assert.match(response.headers.get('content-security-policy'), /http:\/\/localhost:8788/);
  assert.match(await response.text(), /Pagina non trovata/);
});

test('Worker configuration caps per-IP and outbound requests', () => {
  const config = read('wrangler.toml');
  assert.match(config, /name = "CLIENT_RATE_LIMITER"[\s\S]*?limit = 60[\s\S]*?period = 60/);
  assert.match(config, /name = "CONTACT_RATE_LIMITER"[\s\S]*?limit = 3[\s\S]*?period = 60/);
  assert.match(config, /name = "UPSTREAM_RATE_LIMITER"[\s\S]*?limit = 6[\s\S]*?period = 60/);
});

test('Worker fails closed when inbound request protection is missing', async () => {
  const response = await worker.fetch(new Request('https://store.test/api/rss/today'), {}, {});
  assert.equal(response.status, 503);
  assert.match((await response.json()).error, /protection is not configured/i);
});

test('calendar uses keyboard-operable buttons with arrow-key navigation', () => {
  const booking = read('public/js/booking.js');
  const bookingStyles = read('public/css/booking.css');

  assert.match(booking, /document\.createElement\(isSelectable \? 'button' : 'span'\)/);
  assert.match(booking, /ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7/);
  assert.match(booking, /aria-pressed/);
  assert.match(booking, /this\.maxCalendarMonth = new Date\(this\.today\.getFullYear\(\), this\.today\.getMonth\(\) \+ 11, 1\)/);
  assert.match(booking, /this\.els\.nextBtn\.disabled = this\.currentMonth >= this\.maxCalendarMonth/);
  assert.match(booking, /availabilityByApartment\.ulivo/);
  assert.match(booking, /availabilityByApartment\.saline/);
  assert.match(bookingStyles, /\.calendar-day-indicator/);
  assert.match(bookingStyles, /\.indicator-ulivo/);
  assert.match(bookingStyles, /\.indicator-saline/);
  assert.doesNotMatch(bookingStyles, /\.disabled-link/);
  const requestHandler = booking.match(/handleRequestBooking\(\) \{([\s\S]*?)\n  \}/)?.[1] || '';
  assert.ok(requestHandler);
  assert.doesNotMatch(requestHandler, /preventDefault/);
});

test('standalone events page includes privacy controls and accessible feed states', () => {
  const eventsPage = read('public/rss-events.html');

  assert.match(eventsPage, /<script src="js\/main\.js"><\/script>/);
  assert.match(eventsPage, /<script src="js\/config\.js"><\/script>/);
  assert.match(eventsPage, /fetch\(`\$\{CALENDAR_CONFIG\.API_URL\}\/api\/rss\//);
  assert.match(eventsPage, /id="events-container"[^>]*aria-live="polite"/);
  assert.match(eventsPage, /aria-pressed="true"/);
  assert.match(eventsPage, /#0056b3/);
  assert.doesNotMatch(eventsPage, /#007bff/);
});

test('all public page images provide alternative text', () => {
  const htmlFiles = fs.readdirSync(path.join(repoRoot, 'public'))
    .filter((fileName) => fileName.endsWith('.html'));

  for (const fileName of htmlFiles) {
    const page = read(path.join('public', fileName));
    for (const image of page.matchAll(/<img\b[^>]*>/gi)) {
      assert.match(image[0], /\balt="[^"]*"/i, `${fileName} has an image without alt text`);
    }
  }
});

test('RSS parser handles Worker XML, namespaces, CDATA, and one or many items', () => {
  const xml = '<rss xmlns:dc="urn:dc"><channel>'
    + '<item><title>Earlier</title><link>https://example.com/earlier</link><description><![CDATA[First event]]></description><dc:date>2026-09-20</dc:date></item>'
    + '<item><title>Later</title><link>https://example.com/later</link><description>Second event</description><dc:date>2026-09-28</dc:date><dc:type>Festival</dc:type></item>'
    + '</channel></rss>';

  assert.deepEqual(parseRSSFeed(xml), [
    { title: 'Later', link: 'https://example.com/later', description: 'Second event', date: '2026-09-28', type: 'Festival' },
    { title: 'Earlier', link: 'https://example.com/earlier', description: 'First event', date: '2026-09-20', type: 'Event' },
  ]);
  assert.throws(() => parseRSSFeed('<rss><channel>'), /Invalid RSS XML format/);
});

test('Pages preview sends local API requests to the Worker dev port', () => {
  const config = read('public/js/config.js');

  assert.match(config, /port === '8788'/);
  assert.ok(config.includes('return `http://${hostname}:8787`;'));
});