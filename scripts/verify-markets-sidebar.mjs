import assert from 'node:assert/strict';

/** The Markets rail must stay with its dashboard and never cover later text. */
export async function verifyMarketsSidebar({send,evaluate,waitUntil,origin,delay}) {
  for (const [width,height] of [[360,800],[390,844],[768,1024],[1280,800],[1920,1080]]) {
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<500});
    await send('Page.navigate',{url:'about:blank'});
    await waitUntil(`location.href==='about:blank'&&document.readyState==='complete'`,'Fresh Markets context');
    await send('Page.navigate',{url:origin+'/markets'});
    await waitUntil(`!!document.querySelector('[data-publisher-notes="/markets"]')&&!document.querySelector('#prerender-seo')&&!!document.querySelector('aside')`,'Markets and notes hydrate');
    await evaluate(`window.__marketsFontsReady=false;document.fonts.ready.then(()=>window.__marketsFontsReady=true);true`);
    await waitUntil(`window.__marketsFontsReady===true`,'Markets fonts settle');
    await delay(600);
    await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Reject analytics')?.click();true`);
    for (const area of ['main','footer','[data-publisher-notes="/markets"]']) {
      await evaluate(`document.querySelector(${JSON.stringify(area)}).scrollIntoView({block:'start'});true`);
      await delay(50);
      const state=await evaluate(`(()=>{const root=document.querySelector(${JSON.stringify(area)}),rail=document.querySelector('aside').getBoundingClientRect(),visible=[...root.querySelectorAll('h1,h2,p,a')].map(e=>e.getBoundingClientRect()).filter(r=>r.width>0&&r.height>0&&r.top>=0&&r.bottom<innerHeight-80);return {visible:visible.length,covered:visible.some(r=>r.left<rail.right&&r.top<rail.bottom&&r.bottom>rail.top),overflow:document.documentElement.scrollWidth>innerWidth+1};})()`);
      assert.ok(state.visible>0,'Visible content sampled in '+area+' at '+width);
      assert.equal(state.covered,false,'Markets sidebar must not cover '+area+' text at '+width);
      assert.equal(state.overflow,false,'Markets remains within viewport at '+width);
    }
    await evaluate('scrollTo(0,300);true');
    const rail=await evaluate(`(()=>{const a=document.querySelector('aside'),r=a.getBoundingClientRect();return {top:r.top,left:r.left,width:r.width,links:[...a.querySelectorAll('nav a')].map(e=>e.getAttribute('href'))};})()`);
    assert.ok(Math.abs(rail.top)<=1&&rail.left===0&&rail.width===64,'Dashboard navigation remains visible while browsing');
    assert.deepEqual(rail.links,['/','/trade','/markets','/portfolio','/learn'],'Preserve sidebar destinations');
  }
  console.log('PASS Markets sidebar keeps dashboard navigation visible and clears footer/reference text at five widths');
}
