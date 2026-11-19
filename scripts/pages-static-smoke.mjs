import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createServer } from 'node:http';
import { chromium } from '@playwright/test';

const root = path.resolve(process.env.KHAOS_PAGES_DIST || 'dist');
const origin = process.env.VITE_KHAOS_API_ORIGIN;
assert(origin);
const mime = { '.html':'text/html', '.css':'text/css', '.js':'application/javascript', '.json':'application/json',
  '.webp':'image/webp', '.png':'image/png', '.svg':'image/svg+xml', '.ogg':'audio/ogg', '.mp3':'audio/mpeg' };
const server = createServer((request,response) => {
  const pathname = new URL(request.url, 'http://static.invalid').pathname;
  const prefix = '/koala-khaos/';
  const relative = pathname.startsWith(prefix) && decodeURIComponent(pathname.slice(prefix.length) || 'index.html');
  const file = relative && path.resolve(root,relative);
  if (!file || !file.startsWith(root+path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    response.writeHead(404).end();
    return;
  }
  response.writeHead(200,{'Content-Type':mime[path.extname(file)] || 'application/octet-stream'});
  fs.createReadStream(file).pipe(response);
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base = 'http://127.0.0.1:'+server.address().port;
let browser;
try {
  browser = await chromium.launch(process.env.KOALA_BROWSER_CHANNEL ? {channel:process.env.KOALA_BROWSER_CHANNEL} : {});
  for (const viewport of [{width:1280,height:720},{width:390,height:844}]) {
    const page = await browser.newPage({viewport,reducedMotion:'reduce'});
    const assetErrors=[];
    const foreign=[];
    let stateRequests=0;
    page.on('response',res=>{if(res.url().startsWith(base)&&res.status()>=400)assetErrors.push(res.url());});
    page.on('request',request=>{
      if (!request.url().startsWith(base+'/koala-khaos/') && request.url()!==origin+'/__khaos/state')
        foreign.push(request.url());
    });
    await page.route(origin+'/__khaos/state',route=>{
      stateRequests++;
      return route.fulfill({json:{balance:50000}});
    });
    await page.goto(base+'/koala-khaos/');
    await page.locator('#drop:not([disabled])').waitFor();
    assert.equal(await page.locator('#credits').innerText(),'500.00');
    assert.equal(await page.locator('#board canvas').count(),1);
    assert.equal(stateRequests,1);
    assert.deepEqual(assetErrors,[]);
    assert.deepEqual(foreign,[]);
    await page.close();
  }
  const page = await browser.newPage();
  await page.route(origin+'/__khaos/state',route=>route.fulfill({status:503,json:{error:'Backend unavailable'}}));
  await page.goto(base+'/koala-khaos/');
  await page.getByText('The candy grid could not load. Reload to try again.').waitFor();
  assert(await page.locator('#drop').isDisabled());
  console.log('Desktop and mobile Pages asset paths passed with stubbed state. Backend failure correctly disables paid play.');
} finally {
  await browser?.close();
  await new Promise(resolve=>server.close(resolve));
}
