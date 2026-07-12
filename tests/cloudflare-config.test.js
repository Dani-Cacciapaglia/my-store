import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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
