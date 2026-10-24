import assert from 'node:assert/strict';

/** Compiled UI regression: one persistent mobile landmark, no duplicate footer bars. */
export async function verifyMobileNavigation({send,evaluate,waitUntil,origin,delay}) {
  const routes=['/about','/contact','/privacy','/terms','/sectors/ai-tech','/','/portfolio','/auth','/trade/btc','/learn/article/what-is-paper-trading'];
  for (const [width,height] of [[360,800],[390,844],[768,1024],[1280,800],[1920,1080]]) {
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<500});
    for (const path of routes) {
      await send('Page.navigate',{url:'about:blank'});
      await waitUntil(`location.href==='about:blank'&&document.readyState==='complete'`,'Fresh navigation context');
      await send('Page.navigate',{url:origin+path});
      await waitUntil(`!!document.querySelector('main h1')&&!document.querySelector('#prerender-seo')&&document.querySelectorAll('nav[aria-label="Mobile navigation"]').length>0&&!document.querySelector('[data-route-loading]')&&!document.querySelector('main h1').textContent.includes('Loading')`,'Route and mobile navigation mount');
      await evaluate(`window.__navigationFontsReady=false;document.fonts.ready.then(()=>window.__navigationFontsReady=true);true`);
      await waitUntil(`window.__navigationFontsReady===true`,'Navigation font layout settles');
      await delay(600);
      await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Reject analytics')?.click();true`);
      const count=await evaluate(`document.querySelectorAll('nav[aria-label="Mobile navigation"]').length`);
      assert.equal(count,1,'Exactly one mobile navigation landmark on '+path);
      await evaluate('scrollTo(0,0);true');
      if(['/contact','/privacy','/terms'].includes(path)) {
        assert.equal(await evaluate(`(()=>{const n=[...document.querySelectorAll('nav')].find(e=>getComputedStyle(e).position==='fixed'&&e.querySelector('a[aria-label="TradeHQ home"]')),icon=document.querySelector('main > :first-child > div');return icon.getBoundingClientRect().top>=n.getBoundingClientRect().bottom+1;})()`),true,'Trust header icon clears navigation on '+path+' at '+width);
      }
      if(width>=768) {
        assert.equal(await evaluate(`getComputedStyle(document.querySelector('nav[aria-label="Mobile navigation"]')).display`),'none','Mobile bar hidden at '+width);
        continue;
      }
      for (const point of ['top','middle','bottom']) {
        await evaluate(point==='top'?'scrollTo(0,0);true':point==='middle'?'scrollTo(0,document.documentElement.scrollHeight/2);true':'scrollTo(0,document.documentElement.scrollHeight);true');
        await delay(50);
        const state=await evaluate(`(()=>{const n=document.querySelector('nav[aria-label="Mobile navigation"]'),r=n.getBoundingClientRect();return {position:getComputedStyle(n).position,top:r.top,bottom:r.bottom,left:r.left,right:r.right,height:r.height,viewportHeight:innerHeight,links:[...n.querySelectorAll('a')].map(a=>{const r=a.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {label:a.textContent.trim(),href:a.getAttribute('href'),width:r.width,height:r.height,hit:hit?.closest('a')===a};}),lastContentBottom:n.previousElementSibling?.previousElementSibling?.getBoundingClientRect().bottom};})()`);
        assert.equal(state.position,'fixed','Bar remains anchored on '+path+' at '+point);
        assert.ok(Math.abs(state.bottom-state.viewportHeight)<=1&&state.top>=0&&state.left>=-1&&state.right<=width+1,'Navigation stays in viewport');
        assert.deepEqual(state.links.map(x=>x.href),['/','/trade','/markets','/portfolio','/learn'],'Existing destinations retained');
        assert.ok(state.links.every(x=>x.width>=44&&x.height>=48&&x.hit),'All five mobile links are reachable touch targets');
        if(point==='bottom')assert.ok(state.lastContentBottom<=state.top+1,'Document end remains scrollable above the fixed bar');
      }
    }
  }
  console.log('PASS unique persistent mobile navigation, reachable destinations and unobscured document end across five widths');
}
