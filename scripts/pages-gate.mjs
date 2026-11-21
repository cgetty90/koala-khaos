import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
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
const premiumFiles=JSON.parse(fs.readFileSync('scripts/release-premium.json','utf8'));
const cinematicFiles=JSON.parse(fs.readFileSync('scripts/release-cinematic.json','utf8'));
const allowedPublic = /^\/(?:art|audio)\/|^\/index\.html$|^\/assets\//;
const textTypes = /\.(html|js|css|json|svg)$/i;
const banned = /BEGIN (?:OPENSSH |RSA |EC )?PRIVATE KEY|github_pat_[a-z0-9_]{30,}|ghp_[a-z0-9]{30,}|AKIA[A-Z0-9]{16}|\.env(?:\.|\/)|v21-preview-ledger|frozen-preview-server|KOALA_KHAOS_v(?:19|20|21|23)|(?:localhost|127\.0\.0\.1):47\d{3}|[A-Za-z]:[\\/]Users[\\/]/i;
function audit(dir) {
  for (const file of fs.readdirSync(dir, { withFileTypes: true })) {
    const name = path.join(dir, file.name);
    if (file.isDirectory()) { audit(name); continue; }
    const relative = '/' + path.relative(root, name).split(path.sep).join('/');
    assert(!file.isSymbolicLink() && (allowedPublic.test(relative)||(relative.startsWith('/premium/')&&Object.hasOwn(premiumFiles,path.basename(relative)))||(relative==='/cinematic/'+path.basename(relative)&&Object.hasOwn(cinematicFiles,path.basename(relative)))) && !/\.(?:map|zip|bin|pem|log|ts|mjs|csv|zst)$/i.test(relative),
      'Unexpected file in the Pages artifact: ' + relative);
    if (textTypes.test(relative)) assert(!banned.test(fs.readFileSync(name, 'utf8')), 'Review unexpected private marker in ' + relative);
  }
}
// The public game deliberately excludes the local viewport test harness.
fs.rmSync(path.join(root, 'embed.html'), { force:true });
audit(root);
assert(fs.readFileSync(path.join(root,'index.html'),'utf8').includes('/koala-khaos/assets/'));
console.log('Pages artifact paths and private-marker checks passed.');


const release=JSON.parse(fs.readFileSync('scripts/release-audio.json','utf8'));
const expected=new Set(['audio/forest-effects.ogg','audio/forest-tension.ogg','audio/eucalyptus-reels.ogg']);
for(const track of [...Object.values(release.tracks),...(release.entrances?[release.entrances]:[])]) {
 const bytes=fs.readFileSync(path.join(root,track.path));
 assert.equal(bytes.length,track.bytes);
 assert.equal(createHash('sha256').update(bytes).digest('hex'),track.sha256);
 expected.add(track.path);
}
function audioAudit(dir){for(const item of fs.readdirSync(dir,{withFileTypes:true})){
 const file=path.join(dir,item.name);
 if(item.isDirectory())audioAudit(file);else assert(expected.delete(path.relative(root,file).split(path.sep).join('/')),'Unexpected audio '+file);
}}
audioAudit(path.join(root,'audio'));assert.equal(expected.size,0);
for(const file of fs.readdirSync(path.join(root,'assets')))if(file.endsWith('.js'))assert(!/music-comparison|local-audio|commercial candidate/.test(fs.readFileSync(path.join(root,'assets',file),'utf8')),'Local audio testing control leaked');
console.log('Four original soundtrack hashes verified; old recordings and comparison control excluded.');

const publicHtml=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert(!/data-qa|data-fixture-count|scatter-demo|Free practice|music-comparison|local-audio/.test(publicHtml),'Testing controls in public HTML');
console.log('Public HTML excludes practice, scatter fixtures and music-comparison controls.');

for(const [name,hash] of Object.entries(premiumFiles))assert.equal(createHash('sha256').update(fs.readFileSync(path.join(root,'premium',name))).digest('hex'),hash);
console.log('Premium allowlist and hashes verified.');
for(const [name,hash] of Object.entries(cinematicFiles))assert.equal(createHash('sha256').update(fs.readFileSync(path.join(root,'cinematic',name))).digest('hex'),hash);
for(const file of fs.readdirSync(path.join(root,'assets')))if(file.endsWith('.js'))assert(!/premium-integration-disposable|koala-premium-disposable|127\.0\.0\.1:419[47]|X-Koala-Test/.test(fs.readFileSync(path.join(root,'assets',file),'utf8')),'Disposable test configuration leaked');
console.log('Approved cinematic inventory and hashes verified; disposable client excluded.');
