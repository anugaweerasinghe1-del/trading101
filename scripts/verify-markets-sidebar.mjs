import assert from 'node:assert/strict';

/** Markets must share the regular site header at desktop, tablet and mobile widths. */
export async function verifyMarketsSidebar({send,evaluate,waitUntil,origin,delay}) {
  for (const [width,height] of [[360,800],[390,844],[768,1024],[1280,800],[1920,1080]]) {
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<500});
    await send('Page.navigate',{url:'about:blank'});
    await waitUntil(`location.href==='about:blank'&&document.readyState==='complete'`,'Fresh Markets context');
    await send('Page.navigate',{url:origin+'/markets'});
    await waitUntil(`!!document.querySelector('[data-publisher-notes="/markets"]')&&!document.querySelector('#prerender-seo')&&!!document.querySelector('nav.fixed')`,'Markets and horizontal header hydrate');
    await evaluate(`window.__marketsFontsReady=false;document.fonts.ready.then(()=>window.__marketsFontsReady=true);true`);
    await waitUntil(`window.__marketsFontsReady===true`,'Markets fonts settle');
    // Let the longest site-header transition finish before measuring its geometry.
    // The assertion still requires a full-width, viewport-anchored navigation.
    await delay(750);
    await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Reject analytics')?.click();true`);
    const state=await evaluate(`(()=>{
      const nav=document.querySelector('nav.fixed'),r=nav.getBoundingClientRect();
      const heading=document.querySelector('main h1')?.getBoundingClientRect();
      return {top:r.top,left:r.left,right:r.right,width:r.width,height:r.height,
        viewport:innerWidth,documentWidth:document.documentElement.clientWidth,
        bodyWidth:document.body.getBoundingClientRect().width,
        computedPosition:getComputedStyle(nav).position,
        computedTransform:getComputedStyle(nav).transform,
        computedTop:getComputedStyle(nav).top,
        ancestors:(()=>{const rows=[];let a=nav.parentElement;while(a&&rows.length<8){const v=getComputedStyle(a);rows.push({tag:a.tagName,cls:String(a.className).slice(0,130),transform:v.transform,filter:v.filter,perspective:v.perspective,position:v.position});a=a.parentElement;}return rows;})(),
        hasRail:!!document.querySelector('aside.sticky'),
        headingTop:heading?.top ?? -1,
        links:[...nav.querySelectorAll('a[href]')].map(a=>a.getAttribute('href')),
        overflow:document.documentElement.scrollWidth>innerWidth+1};
    })()`);
    assert.equal(state.hasRail,false,'Legacy Markets vertical sidebar removed at '+width);
    // Desktop emulation may reserve 15px for a vertical scrollbar:
    // innerWidth includes it while position:fixed left/right spans the
    // document's clientWidth. Test both visible edges, not the scrollbar.
    assert.ok(
      Math.abs(state.top)<=1 && Math.abs(state.left)<=1 &&
      Math.abs(state.right-state.documentWidth)<=1 &&
      Math.abs(state.width-state.documentWidth)<=1,
      'Shared navbar spans available document width at '+width+': '+JSON.stringify(state)
    );
    assert.ok(state.headingTop>=state.height-1,'Markets heading clears fixed site header at '+width);
    assert.equal(state.overflow,false,'Markets content does not overflow viewport at '+width);
    for (const path of ['/','/learn','/trade','/portfolio','/newsletter']) {
      assert.ok(state.links.includes(path), 'Main navigation contains '+path+' at '+width);
    }
    for (const area of ['main','footer','[data-publisher-notes="/markets"]']) {
      await evaluate(`document.querySelector(${JSON.stringify(area)}).scrollIntoView({block:'start'});true`);
      await delay(60);
      const sample=await evaluate(`(()=>{
        const root=document.querySelector(${JSON.stringify(area)});
        return {visible:[...root.querySelectorAll('h1,h2,p,a')].some(e=>{
          const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&r.bottom>75&&r.top<innerHeight-70;
        }),overflow:document.documentElement.scrollWidth>innerWidth+1};
      })()`);
      assert.ok(sample.visible,'Content visible in '+area+' at '+width);
      assert.equal(sample.overflow,false,'No horizontal overflow in '+area+' at '+width);
    }
  }
  console.log('PASS Markets horizontal navbar, viewport fit and reading areas at five screen widths');
}
