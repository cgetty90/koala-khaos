import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.env.KHAOS_PAGES_DIST || 'dist');
const raw = process.env.VITE_KHAOS_API_ORIGIN;
assert(raw, 'Pages cannot settle rounds without an approved public HTTPS game API. See the publication guide.');
const api = new URL(raw);
assert(api.protocol === 'https:' && api.origin === raw && !api.username && !api.password,
  'Supply only the verified HTTPS API origin, without credentials, paths or trailing slash.');
assert(!/^(localhost|127\.|0\.|10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.|\[)/i.test(api.hostname)
  && api.hostname.includes('.') && !api.hostname.endsWith('.local'),
  'Use a public HTTPS API origin. A PC-hosted API requires the PC and tunnel to stay online.');
if (process.argv[2] === 'preflight') process.exit(0);
const allowedPublic = /^\/(?:art|audio)\/|^\/index\.html$|^\/assets\//;
const textTypes = /\.(html|js|css|json|svg)$/i;
const banned = /BEGIN (?:OPENSSH |RSA |EC )?PRIVATE KEY|github_pat_[a-z0-9_]{30,}|ghp_[a-z0-9]{30,}|AKIA[A-Z0-9]{16}|\.env(?:\.|\/)|v21-preview-ledger|frozen-preview-server|KOALA_KHAOS_v(?:19|20|21|23)|(?:localhost|127\.0\.0\.1):47\d{3}|[A-Za-z]:[\\/]Users[\\/]/i;
function audit(dir) {
  for (const file of fs.readdirSync(dir, { withFileTypes: true })) {
    const name = path.join(dir, file.name);
    if (file.isDirectory()) { audit(name); continue; }
    const relative = '/' + path.relative(root, name).split(path.sep).join('/');
    assert(!file.isSymbolicLink() && allowedPublic.test(relative) && !/\.(?:map|zip|bin|pem|log|ts|mjs)$/i.test(relative),
      'Unexpected file in the Pages artifact: ' + relative);
    if (textTypes.test(relative)) assert(!banned.test(fs.readFileSync(name, 'utf8')), 'Review unexpected private marker in ' + relative);
  }
}
// The public game deliberately excludes the local viewport test harness.
fs.rmSync(path.join(root, 'embed.html'), { force:true });
audit(root);
assert(fs.readFileSync(path.join(root,'index.html'),'utf8').includes('/koala-khaos/assets/'));
console.log('Pages artifact paths and private-marker checks passed.');

