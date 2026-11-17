import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

const api = new URL(process.env.VITE_KHAOS_API_ORIGIN);
const site = new URL('https://' + (process.env.GITHUB_REPOSITORY_OWNER || 'cgetty90') + '.github.io').origin;
const timeout = () => AbortSignal.timeout(15000);

const preflight = await fetch(new URL('/__khaos/round', api), {
  method:'OPTIONS', signal:timeout(), redirect:'error',
  headers:{origin:site,'access-control-request-method':'POST','access-control-request-headers':'content-type'},
});
assert(preflight.ok, 'The API rejected browser CORS preflight');
assert.equal(preflight.headers.get('access-control-allow-origin'),site);
assert.match(preflight.headers.get('access-control-allow-methods') || '',/\bPOST\b/i);
assert.match(preflight.headers.get('access-control-allow-headers') || '',/\bcontent-type\b/i);

async function request(action, payload, origin = site) {
  return fetch(new URL('/__khaos/'+action,api), {
    method:'POST', signal:timeout(), redirect:'error',
    headers:{origin,'content-type':'application/json'},
    body:JSON.stringify(payload),
  });
}
async function post(action, payload) {
  const response = await request(action,payload);
  assert(response.ok, 'API rejected '+action+': '+response.status);
  assert.equal(response.headers.get('access-control-allow-origin'),site);
  return response.json();
}
const rejected = await request('state',{session:randomUUID()},'https://unapproved.invalid');
assert.equal(rejected.status,403);
assert.equal(rejected.headers.get('access-control-allow-origin'),null);
for (const route of ['/', '/@vite/client', '/__khaos/qa', '/src/main.ts', '/SCATTER-CATALOGUE.json']) {
  assert.equal((await fetch(new URL(route,api),{signal:timeout(),redirect:'error'})).status,404,route);
}

const visitor = randomUUID();
const {balance: independent} = await post('state',{session:visitor});
for (const [mode, factor] of Object.entries({normal:1,ante:3,regular:100,super:300,mystery:500})) {
  const session = randomUUID();
  const {balance:opening} = await post('state',{session});
  assert.equal(opening,independent);
  const params = {session,id:randomUUID(),mode,stake:20};
  assert.equal((await request('round',{...params,fixture:1})).status,400);
  const accepted = await post('round',params);
  const {receipt} = accepted;
  assert.equal(receipt.requestId,params.id);
  assert.deepEqual(Object.keys(receipt.id),['version']);
  assert.equal(receipt.cost,20*factor);
  assert(Number.isSafeInteger(receipt.credit) && receipt.credit>=0 && receipt.credit<=120000);
  const awards = receipt.record.events.filter(event=>event.type==='award');
  if (factor >= 100) assert.equal(awards.length,10);
  assert.equal(awards.reduce((sum,event)=>sum+event.credit,0),receipt.credit);
  assert.equal(receipt.balance,opening-receipt.cost+receipt.credit);
  assert.deepEqual(await post('round',params),accepted);
  assert.equal((await post('state',{session})).balance,receipt.balance);
  console.log(mode + ' charge, awards, balance and exact retry passed.');
}
assert.equal((await post('state',{session:visitor})).balance,independent);
console.log('Independent sessions, exact CORS and route restrictions passed.');
