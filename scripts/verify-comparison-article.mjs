import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {loadSiteData} from './loadData.ts';

/** Keep every comparison paragraph/reference in main without repeating it after the footer. */
export async function verifyComparisonArticle({send,evaluate,waitUntil,origin,delay,dist}) {
  const {COMPARE_PAIRS}=await loadSiteData();
  const normalize=text=>text.replace(/\s+/g,' ').trim().toLowerCase();
  for(const pair of COMPARE_PAIRS)for(const [width,height] of [[360,800],[390,844],[768,1024],[1280,800],[1920,1080]]) {
    const path='/compare/'+pair.slug,page=JSON.parse(readFileSync(join(dist,'publisher-notes',path,'index.json'),'utf8'));
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<500});
    await send('Page.navigate',{url:'about:blank'});
    await waitUntil(`location.href==='about:blank'&&document.readyState==='complete'`,'Fresh comparison context');
    await send('Page.navigate',{url:origin+path});
    await waitUntil(`!!document.querySelector('main h1')&&!document.querySelector('#prerender-seo')`,'Comparison hydrates');
    await delay(100);
    const row=await evaluate(`(()=>{const main=document.querySelector('main'),notes=[...document.querySelectorAll('[data-publisher-notes]')];return {text:main.textContent.replace(/\\s+/g,' ').trim().toLowerCase(),mainPath:main.getAttribute('data-publisher-notes'),notes:notes.map(e=>e.tagName),links:[...main.querySelectorAll('a')].map(a=>a.href),overflow:document.documentElement.scrollWidth>innerWidth+1};})()`);
    assert.deepEqual(row.notes,['MAIN'],'Exactly one comparison article in main '+path+' at '+width);
    assert.equal(row.mainPath,path,'Comparison article identifies current route');
    for(const section of page.sections)for(const text of [...(section.p||[]),...(section.list||[])].filter(Boolean)) {
      const paragraph=normalize(text);assert.ok(row.text.includes(paragraph),'Preserve '+section.h+' '+path);
      assert.equal(row.text.split(paragraph).length-1,1,'Do not repeat '+section.h+' '+path);
    }
    for(const link of page.links)assert.ok(row.links.includes(new URL(link.href,origin).href),'Retain reference/destination '+link.href);
    assert.ok(row.text.includes('published by tradehq')&&row.text.includes('anuga weerasinghe')&&row.text.includes('no independent professional review is claimed'),'Retain publisher scope');
    assert.ok(row.text.includes('quotes may be delayed, cached, unavailable or fixed simulator values')&&row.text.includes('practice results do not predict investment outcomes'),'Retain data/simulation scope');
    assert.equal(row.overflow,false,'Comparison stays within viewport '+path+' at '+width);
  }
  // React navigation must remove stale notes and restore the normal hub article on return.
  await send('Page.navigate',{url:origin+'/compare'});
  await waitUntil(`!!document.querySelector('main a[href="/compare/bitcoin-vs-ethereum"]')&&!document.querySelector('#prerender-seo')`,'Comparison hub hydrates');
  await evaluate(`document.querySelector('main a[href="/compare/bitcoin-vs-ethereum"]').click();true`);
  await waitUntil(`location.pathname==='/compare/bitcoin-vs-ethereum'&&document.querySelector('main[data-publisher-notes="/compare/bitcoin-vs-ethereum"]')`,'Client navigation to comparison');
  assert.equal(await evaluate(`document.querySelectorAll('[data-publisher-notes]').length`),1,'No stale hub article after client navigation');
  await evaluate(`document.querySelector('main a[href="/compare"]').click();true`);
  await waitUntil(`location.pathname==='/compare'&&document.querySelector('article[data-publisher-notes="/compare"]')`,'Hub notes restored after client navigation');
  assert.equal(await evaluate(`document.querySelectorAll('[data-publisher-notes]').length`),1,'One hub article after return');
  console.log('PASS40comparison-width states: one article, unchanged substantive paragraphs/references and safe client navigation');
}
