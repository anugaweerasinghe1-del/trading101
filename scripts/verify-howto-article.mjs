import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {loadSiteData} from './loadData.ts';

/** Preserve complete guide content and controls without a second article after the footer. */
export async function verifyHowToArticle({send,evaluate,waitUntil,origin,delay,dist}) {
  const {HOWTO_ASSETS}=await loadSiteData();
  const normalize=text=>text.replace(/\s+/g,' ').trim().toLowerCase();
  for(const asset of HOWTO_ASSETS)for(const [width,height] of [[360,800],[390,844],[768,1024],[1280,800],[1920,1080]]) {
    const path='/how-to-trade/'+asset.symbol,page=JSON.parse(readFileSync(join(dist,'publisher-notes',path,'index.json'),'utf8'));
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<500});
    await send('Page.navigate',{url:'about:blank'});
    await waitUntil(`location.href==='about:blank'&&document.readyState==='complete'`,'Fresh guide context');
    await send('Page.navigate',{url:origin+path});
    await waitUntil(`document.querySelector('main h1')?.textContent===${JSON.stringify('How to Trade '+asset.fullName)}&&!document.querySelector('#prerender-seo')`,'Guide hydrates');
    await delay(100);
    const row=await evaluate(`(()=>{const main=document.querySelector('main');return {path:location.pathname,text:main.textContent.replace(/\\s+/g,' ').trim().toLowerCase(),mainPath:main.getAttribute('data-publisher-notes'),articles:[...document.querySelectorAll('[data-publisher-notes]')].map(e=>e.tagName),links:[...main.querySelectorAll('a')].map(a=>a.href),overflow:document.documentElement.scrollWidth>innerWidth+1};})()`);
    assert.deepEqual(row.articles,['MAIN'],'One guide article before footer '+path+' at '+width);
    assert.equal(row.mainPath,path,'Guide identifies current route');
    assert.ok(row.text.includes(normalize(page.summary)),'Preserve introduction');
    for(const section of page.sections)for(const text of [...(section.p||[]),...(section.list||[])].filter(Boolean)) {
      assert.ok(row.text.includes(normalize(text)),'Preserve '+section.h+' '+path);
    }
    for(const link of page.links)assert.ok(row.links.includes(new URL(link.href,origin).href),'Preserve destination '+link.href);
    assert.ok(row.text.includes('published by tradehq')&&row.text.includes('anuga weerasinghe')&&row.text.includes('no independent professional review is claimed'),'Preserve publisher disclosure');
    assert.ok(row.text.includes('quotes may be delayed, cached, unavailable or fixed simulator values')&&row.text.includes('practice results do not predict investment outcomes'),'Preserve simulator scope');
    assert.equal(row.overflow,false,'Guide fits viewport');
    // Open all three informational answers without any trading/account action.
    const faq=await evaluate(`Array.from(document.querySelectorAll('main section[aria-label="Frequently Asked Questions"] button[aria-expanded]')).map(b=>b.textContent.trim())`);
    assert.equal(faq.length,3,'All guide FAQ controls remain');
    const answers=[`Yes. TradeHQ gives you $100,000 in virtual cash with no signup for ${asset.fullName} practice. Simulated results do not predict real returns.`, 'On TradeHQ — zero. You get $100K practice capital instantly. For real trading, never start with more than you can afford to lose.', asset.risk];
    for(let index=0;index<3;index++) {
      await evaluate(`document.querySelectorAll('main section[aria-label="Frequently Asked Questions"] button[aria-expanded]')[${index}].click();true`);
      await waitUntil(`document.querySelectorAll('main section[aria-label="Frequently Asked Questions"] button[aria-expanded]')[${index}].getAttribute('aria-expanded')==='true'`,'Guide answer expands');
      assert.ok(await evaluate(`document.querySelector('main section[aria-label="Frequently Asked Questions"]').innerText.includes(${JSON.stringify(answers[index])})`),'Expanded answer remains visible');
    }
  }
  // Switching routes must remove stale hub notes and restore them on return.
  await send('Page.navigate',{url:origin+'/how-to-trade'});
  await waitUntil(`!!document.querySelector('main a[href="/how-to-trade/btc"]')&&!!document.querySelector('article[data-publisher-notes="/how-to-trade"]')&&!document.querySelector('#prerender-seo')`,'Guide hub hydrates');
  await evaluate(`document.querySelector('main a[href="/how-to-trade/btc"]').click();true`);
  await waitUntil(`location.pathname==='/how-to-trade/btc'&&!!document.querySelector('main[data-publisher-notes="/how-to-trade/btc"]')`,'Client guide navigation');
  assert.equal(await evaluate(`document.querySelectorAll('[data-publisher-notes]').length`),1,'No stale hub notes');
  await evaluate(`document.querySelector('main a[href="/how-to-trade"]').click();true`);
  await waitUntil(`location.pathname==='/how-to-trade'&&document.querySelector('main h1')?.textContent==='How to Trade — Guides'&&!!document.querySelector('article[data-publisher-notes="/how-to-trade"]')`,'Hub article restores');
  assert.equal(await evaluate(`document.querySelectorAll('[data-publisher-notes]').length`),1,'One hub article on return');
  console.log('PASS30guide-width states: preserved content/references,90FAQanswers and safe hub navigation');
}
