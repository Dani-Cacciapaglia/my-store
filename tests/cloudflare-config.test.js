import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sanitizeRequestPath } from '../src/utils.js';
import { serveIndexPage } from '../src/static.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

test('Cloudflare deployment config targets lapapessavacanze.com', () => {
  const wranglerConfig = read('wrangler.toml');
  assert.match(wranglerConfig, /lapapessavacanze\.com/);
  assert.match(wranglerConfig, /www\.lapapessavacanze\.com/);

  const staticModule = read('src/static.js');
  assert.match(staticModule, /https:\/\/lapapessavacanze\.com/);

  const webConfig = read('public/js/config.js');
  assert.match(webConfig, /window\.location\.origin/);
});

test('request path sanitization rejects traversal and absolute paths', () => {
  assert.equal(sanitizeRequestPath('/css/style.css'), '/css/style.css');
  assert.equal(sanitizeRequestPath('/images/logo.png'), '/images/logo.png');
  assert.equal(sanitizeRequestPath('/about.html'), '/about.html');
  assert.equal(sanitizeRequestPath('../private'), null);
  assert.equal(sanitizeRequestPath('/..%2fsecret'), null);
  assert.equal(sanitizeRequestPath('https://evil.example/steal'), null);
});

test('HTML pages are served with no-store headers to refresh browser tab titles', async () => {
  const response = await serveIndexPage({
    STATIC_FILES: {
      get: async () => '<!DOCTYPE html><html><head><title>La Papessa | Home</title></head><body></body></html>',
    },
  });

  assert.equal(response.status, 200);
  assert.match(response.headers.get('Cache-Control') || '', /no-store/i);
  assert.match(response.headers.get('Cache-Control') || '', /must-revalidate/i);
});
