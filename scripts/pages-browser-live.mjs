import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import path from 'node:path';
import { chromium, expect } from '@playwright/test';

const api = new URL(process.env.VITE_KHAOS_API_ORIGIN);
assert.equal(api.protocol,'https:');
const site = 'https://' + (process.env.GITHUB_REPOSITORY_OWNER || 'cgetty90') + '.github.io';
const frontend = site + '/koala-khaos/';
const root = path.resolve(process.env.KHAOS_PAGES_DIST || 'dist');
const browser = await chromium.launch(process.env.KOALA_BROWSER_CHANNEL ? {channel:process.env.KOALA_BROWSER_CHANNEL} : {});
const costs = { normal:20, ante:60, regular:2000, super:6000, mystery:10000 };
const modes = Object.keys(costs);
const credits = new Intl.NumberFormat('en', {minimumFractionDigits:2,maximumFractionDigits:2});

try {
  for (const viewport of [{width:1280,height:720},{width:390,height:844}]) {
    const page = await browser.newPage({viewport,reducedMotion:'reduce'});
    const errors = [];
    page.on('request', request => {
      const url = new URL(request.url());
      if (/^(https?:)$/.test(url.protocol) && ![site, api.origin].includes(url.origin)) errors.push('Unexpected request: '+url.href);
      if (url.pathname.startsWith('/__khaos/') && url.origin !== api.origin) errors.push('Settlement used wrong origin: '+url.href);
    });
    page.on('pageerror',error => errors.push(error.message));
    page.on('requestfailed',request => errors.push(request.url()+' '+request.failure()?.errorText));
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
    await page.getByRole('button', { name:'Enter the Khaos' }).click();
    const spin = page.locator('#drop');
    await expect(spin).toBeEnabled();
    await expect(page.locator('#credits')).toHaveText('500.00');
    let initialBalance = 50000;
    for (const [index,mode] of modes.entries()) {
      if (mode === 'ante') {
        await page.locator('#ante-open').click();
        await page.locator('#ante-confirm').click();
      } else if (index > 1) {
        await page.locator('#bonus').click();
        await page.locator('[data-purchase="'+mode+'"]').click();
      }
      const response = page.waitForResponse(reply => reply.url() === api.origin+'/__khaos/round');
      if (index > 1) await page.locator('#confirm-buy').click();
      else await spin.click();
      const reply = await response;
      assert(reply.ok(),mode+' failed over the real API');
      const {receipt} = await reply.json();
      assert.equal(receipt.mode,mode);
      assert.equal(receipt.cost,costs[mode]);
      assert.equal(receipt.balance, initialBalance - receipt.cost + receipt.credit);
      initialBalance = receipt.balance;
      assert.equal(receipt.record.events.at(-1).credit,receipt.credit);
      if (receipt.record.spec.tier) {
        await page.locator('#feature-continue').click({timeout:30000});
        await page.locator('#feature-action').click({timeout:30000});
      }
      await expect(spin).toBeEnabled({timeout:30000});
      await expect(page.locator('#credits')).toHaveText(credits.format(receipt.balance / 100));
      await page.waitForLoadState('networkidle');
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
    assert.deepEqual(errors,[]);
    await page.close();
    console.log(viewport.width + 'px Pages build played and recovered five modes over HTTPS.');
  }
} finally {
  await browser.close();
}

