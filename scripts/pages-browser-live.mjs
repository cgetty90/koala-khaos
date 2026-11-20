import assert from 'node:assert/strict';
import { access, mkdir, writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { chromium, expect } from '@playwright/test';

const api = new URL(process.env.VITE_KHAOS_API_ORIGIN);
assert.equal(api.protocol,'https:');
const site = 'https://' + (process.env.GITHUB_REPOSITORY_OWNER || 'cgetty90') + '.github.io';
const frontend = site + '/koala-khaos/';
const root = path.resolve(process.env.KHAOS_PAGES_DIST || 'dist');
const browser = await chromium.launch(process.env.KOALA_BROWSER_EXECUTABLE ? {executablePath:process.env.KOALA_BROWSER_EXECUTABLE,args:['--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows']} : process.env.KOALA_BROWSER_CHANNEL ? {channel:process.env.KOALA_BROWSER_CHANNEL} : {});
const release=JSON.parse(await readFile('scripts/release-audio.json','utf8'));
const costs = { normal:20, ante:60, regular:2000, super:6000, mystery:10000 };
const modes = Object.keys(costs).filter(mode=>!process.env.KHAOS_VERIFY_MODE||mode===process.env.KHAOS_VERIFY_MODE);
const credits = new Intl.NumberFormat('en', {minimumFractionDigits:2,maximumFractionDigits:2});

try {
  for (const viewport of [{width:1280,height:720},{width:390,height:844}].filter(v=>!process.env.KHAOS_VERIFY_MOBILE_ONLY||v.width===390)) {
    const mobile = viewport.width < 450;
    const page = await browser.newPage({viewport,isMobile:mobile,hasTouch:mobile,reducedMotion:'reduce'});
    const errors = [];
    const pendingAssets = new Set();
    page.on("request",r=>{if(r.url().startsWith(frontend))pendingAssets.add(r)});
    page.on("requestfinished",r=>pendingAssets.delete(r));
    page.on("requestfailed",r=>pendingAssets.delete(r));
    let droppedId;
    page.on('request', request => {
      const url = new URL(request.url());
      if (/^(https?:)$/.test(url.protocol) && ![site, api.origin].includes(url.origin)) errors.push('Unexpected request: '+url.href);
      if (url.pathname.startsWith('/__khaos/') && url.origin !== api.origin) errors.push('Settlement used wrong origin: '+url.href);
    });
    page.on('pageerror',error => errors.push(error.message));
    page.on('requestfailed', request => {
      if (droppedId && request.url() === api.origin+'/__khaos/round' && request.postDataJSON()?.id === droppedId) return;
      errors.push(request.url()+' '+request.failure()?.errorText);
    });
    // Fulfil static requests under the future Pages origin. API traffic stays on the network.
    if (process.env.KHAOS_PAGES_VERIFY_DEPLOYED !== '1') await page.route(frontend+'**',async route => {
      const relative = new URL(route.request().url()).pathname.slice('/koala-khaos/'.length) || 'index.html';
      const file = path.resolve(root,relative);
      if (!file.startsWith(root+path.sep)) return route.fulfill({status:404});
      try {
        await access(file);
      } catch {
        return route.fulfill({status:404});
      }
      await route.fulfill({path:file});
    });
    await page.goto(frontend);
    assert.equal(await page.locator('meta[name=koala-release]').getAttribute('content'),release.version);
    assert.equal(await page.locator('[class*=music-comparison]').count(),0);
    for(const track of Object.values(release.tracks)) {
      const bytes=await page.evaluate(async url=>Array.from(new Uint8Array(await(await fetch(url)).arrayBuffer())),frontend+track.path);
      assert.equal(createHash('sha256').update(Buffer.from(bytes)).digest('hex'),track.sha256);
    }
    const song = page.waitForResponse(reply => reply.ok() && reply.url() === frontend+'audio/original-v1/enchanted-eucalyptus.ogg');
    const welcome = page.getByRole('button', { name:'Enter the Khaos' });
    if (mobile) await welcome.tap();
    else await welcome.click();
    await song;
    await expect(page.locator('#audio-status')).toHaveAttribute('data-state','playing');
    const logo = page.locator('.stage-logo');
    const logoUrl = await logo.evaluate(image => image.currentSrc);
    assert(logoUrl.endsWith('/art/outback/logo-h-fixed-67a95c14.webp'));
    assert.equal(createHash('sha256').update(Buffer.from(await page.evaluate(async url => Array.from(new Uint8Array(await (await fetch(url)).arrayBuffer())),logoUrl))).digest('hex'),'67a95c14d743b81da0e3f7ffaa0569ee91ebe95d503c53e71cb566a8a0063be0');
    if (process.env.KHAOS_EVIDENCE_DIR) {
      await mkdir(process.env.KHAOS_EVIDENCE_DIR,{recursive:true});
      await page.screenshot({path:path.join(process.env.KHAOS_EVIDENCE_DIR,'public-'+viewport.width+'.png'),animations:'disabled'});
    }
    assert.equal(await page.locator('#drop .spin-glyph').textContent(),'↻');
    assert((await page.locator('.demo').innerText()).includes('—'));
    const spin = page.locator('#drop');
    await expect(spin).toBeEnabled();
    await expect(page.locator('#credits')).toHaveText('500.00');
    if(process.env.KHAOS_VERIFY_INSTANT==='1') {
      await page.locator('#utility-open').click();
      await page.locator('#speed').selectOption('0');
      await page.getByRole('button',{name:'Close menu'}).click();
    }
    let initialBalance = 50000;
    for (const [index,mode] of modes.entries()) {
      console.log(viewport.width+'px: '+mode);
      if (mode === 'ante') {
        await page.locator('#ante-open').click();
        await page.locator('#ante-confirm').click();
      } else if (!['normal','ante'].includes(mode)) {
        await page.locator('#bonus').click();
        await page.locator('[data-purchase="'+mode+'"]').click();
      }
      const response = page.waitForResponse(reply => reply.url() === api.origin+'/__khaos/round');
      if (!['normal','ante'].includes(mode)) await page.locator('#confirm-buy').click();
      else await spin.click();
      const reply = await response;
      assert(reply.ok(),mode+' failed over the real API');
      const {receipt} = await reply.json();
      if (process.env.KHAOS_EVIDENCE_DIR) await writeFile(path.join(process.env.KHAOS_EVIDENCE_DIR,viewport.width+'-'+mode+'-receipt.json'),JSON.stringify(receipt,null,2));
      assert.equal(receipt.mode,mode);
      if (mode === 'normal' && !receipt.record.spec.tier) assert.equal(receipt.id.version,'khaos-3.0-offline-b.1');
      else assert.equal(receipt.id.version,'khaos-1.9-scatter-candidate.1');
      assert.equal(receipt.cost,costs[mode]);
      assert.equal(receipt.balance, initialBalance - receipt.cost + receipt.credit);
      initialBalance = receipt.balance;
      assert.equal(receipt.record.events.at(-1).credit,receipt.credit);
      if (receipt.record.spec.tier) {
        await page.locator('#feature-continue').click({timeout:30000});
        await page.locator('#feature-action').waitFor({state:'visible',timeout:30000});
        await expect(page.locator('#audio-status')).toHaveAttribute('data-scene',receipt.record.spec.tier);
        await expect(page.locator('#audio-status')).toHaveAttribute('data-state','playing');
        await page.locator('#feature-action').click({timeout:30000}).catch(async error=>{
          console.error('Bonus diagnostic',await page.locator('#feature-dialog').innerText(),await page.locator('#status').innerText(),await page.evaluate(()=>({hidden:document.hidden,reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,speed:document.querySelector('#speed').value})));
          throw error;
        });
      }
      await expect(spin).toBeEnabled({timeout:30000});
      await expect(page.locator('#credits')).toHaveText(credits.format(receipt.balance / 100));
      await page.waitForLoadState('networkidle');
      await expect.poll(()=>pendingAssets.size,{timeout:30000}).toBe(0);
      await page.reload({waitUntil:'networkidle'});
      await expect(spin).toBeEnabled();
      await expect(page.locator('#credits')).toHaveText(credits.format(receipt.balance / 100));
    }
    if (process.env.KHAOS_PAGES_SAMPLE_SCATTERS === '1' && viewport.width > 400) {
      await page.locator('#ante-open').click();
      await page.locator('#ante-confirm').click();
      await page.evaluate(() => {
        window.pagesScatterLandings = [];
        document.getElementById('board').addEventListener('scatter-landed',event => {
          window.pagesScatterLandings.push(event.detail.cell);
        });
      });
      const seen = new Set();
      let balance = Math.round(Number((await page.locator('#credits').innerText()).replaceAll(',','')) * 100);
      const isRound = response => response.url() === api.origin+'/__khaos/round'
        && response.request().method() === 'POST';
      for (let batch = 0; batch < 8 && seen.size < 2; batch++) {
        const receipts = [];
        const listener = response => {
          if (isRound(response)) receipts.push(response.json());
        };
        page.on('response',listener);
        await page.locator('#autoplay').click();
        await page.locator('#auto-count').selectOption('10');
        await page.locator('#auto-bonus').uncheck();
        await page.locator('#auto-start').click();
        for (let index = 0; index < 10; index++) {
          await expect.poll(() => receipts.length, {timeout:30000}).toBeGreaterThan(index);
          const {receipt} = await receipts[index];
          if (receipt.record.spec.tier) {
            await page.locator('#feature-continue').click({timeout:30000});
            if (index === 9) await page.locator('#feature-action').click({timeout:30000});
          }
        }
        await expect(page.locator('#status')).toHaveText('Autoplay complete.',{timeout:30000});
        page.off('response',listener);
        assert.equal(receipts.length,10);
        const expected = [];
        for (const {receipt} of await Promise.all(receipts)) {
          const {naturalScatterCount, events} = receipt.record;
          if (!receipt.record.spec.tier && (naturalScatterCount === 1 || naturalScatterCount === 2)) seen.add(naturalScatterCount);
          expected.push(...events.flatMap(event => event.scatterLandings ?? []));
          assert.equal(receipt.mode,'normal');
          if (!receipt.record.spec.tier) assert.equal(receipt.id.version,'khaos-3.0-offline-b.1');
          assert.equal(receipt.cost,20);
          assert.equal(receipt.balance,balance-receipt.cost+receipt.credit);
          balance = receipt.balance;
        }
        const actual = await page.evaluate(() => window.pagesScatterLandings.splice(0));
        assert.deepEqual(actual,expected);
        await expect(page.locator('#credits')).toHaveText(credits.format(balance / 100));
      }
      console.log('Remote autoplay, exact ledger and recorded scatter landings passed. Observed non-bonus counts: '+[...seen].sort().join(', '));
      assert.equal(seen.size, 2, 'Sample did not contain both non-bonus scatter counts.');
    }
    // Settle once on the real gateway and withhold that reply from the client.
    const roundUrl = api.origin+'/__khaos/round';
    let settleDropped;
    const dropped = new Promise(resolve => { settleDropped = resolve; });
    await page.route(roundUrl, async route => {
      droppedId = route.request().postDataJSON().id;
      const upstream = await route.fetch();
      assert(upstream.ok(), 'Interrupted round did not settle');
      const original = await upstream.json();
      await route.abort('connectionreset');
      settleDropped(original);
    }, {times:1});
    await spin.click();
    const original = await dropped;
    const retry = page.getByRole('button',{name:'Retry pending round'});
    await expect(retry).toBeVisible();
    await expect(page.locator('#credits')).toHaveText('—');
    await expect(spin).toBeDisabled();
    const retried = page.waitForResponse(reply => reply.url() === roundUrl);
    if (mobile) await retry.tap();
    else await retry.click();
    const saved = await (await retried).json();
    assert.deepEqual(saved,original);
    if (saved.receipt.record.spec.tier) {
      await page.locator('#feature-continue').click({timeout:30000});
      await page.locator('#feature-action').click({timeout:30000});
    }
    await expect(spin).toBeEnabled({timeout:30000});
    await expect(page.locator('#credits')).toHaveText(credits.format(saved.receipt.balance / 100));
    await expect.poll(()=>pendingAssets.size,{timeout:30000}).toBe(0);
    assert.deepEqual(errors,[]);
    await page.close();
    console.log(viewport.width + 'px Pages build played and recovered '+modes.length+' modes over HTTPS.');
  }
} finally {
  await browser.close();
}
