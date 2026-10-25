import assert from 'node:assert/strict';

const luminance=color=>{
  const channels=color.match(/[\d.]+/g).slice(0,3).map(Number).map(c=>{
    c/=255;return c<=0.04045?c/12.92:((c+0.055)/1.055)**2.4;
  });
  return channels[0]*0.2126+channels[1]*0.7152+channels[2]*0.0722;
};
export function contrastRatio(a,b){const x=luminance(a),y=luminance(b);return(Math.max(x,y)+0.05)/(Math.min(x,y)+0.05);}

/** Read actual computed default/hover colors; never activate the external share. */
export async function verifyWikiShareContrast({send,evaluate,waitUntil,origin,delay}) {
  await send('DOM.enable');await send('CSS.enable');let checked=0;
  for(const slug of ['backtesting','bear-trap','bollinger-band-squeeze','bull-trap'])
  for(const [width,height]of [[360,800],[390,844],[768,1024],[1280,800],[1920,1080]]) {
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<500});
    await send('Page.navigate',{url:origin+'/wiki/'+slug});
    await waitUntil(`document.querySelector('main[data-publisher-notes="/wiki/${slug}"]')&&!document.querySelector('#prerender-seo')`,'Glossary main hydrates');
    await delay(100);
    assert.equal(await evaluate(`document.querySelectorAll('main button').length`),1,'One glossary share control');
    const {root}=await send('DOM.getDocument');const {nodeId}=await send('DOM.querySelector',{nodeId:root.nodeId,selector:'main button'});
    for(const mode of ['light','dark']) {
      await evaluate(`(()=>{if(document.documentElement.classList.contains('light')!==${mode==='light'})[...document.querySelectorAll('button[aria-label*=theme]')].find(b=>b.getClientRects().length).click();return true;})()`);
      await waitUntil(`document.documentElement.classList.contains('light')===${mode==='light'}`,'Glossary theme settles');
      for(const hover of [false,true]) {
        await send('CSS.forcePseudoState',{nodeId,forcedPseudoClasses:hover?['hover']:[]});await delay(200);
        const row=await evaluate(`(()=>{const b=document.querySelector('main button'),s=getComputedStyle(b);return{text:b.textContent.trim(),color:s.color,background:s.backgroundColor,fontSize:s.fontSize,fontWeight:s.fontWeight,opacity:s.opacity,overflow:document.documentElement.scrollWidth>innerWidth+1};})()`);
        assert.equal(row.text,'Share to WhatsApp');assert.equal(row.opacity,'1');
        assert.ok(contrastRatio(row.color,row.background)>=4.5,`Share text contrast ${slug}/${width}/${mode}/${hover?'hover':'default'}: ${contrastRatio(row.color,row.background).toFixed(2)}`);
        assert.equal(row.overflow,false);checked++;
      }
    }
    await send('CSS.forcePseudoState',{nodeId,forcedPseudoClasses:[]});
  }
  console.log('PASS glossary share contrast: '+checked+' actual route/width/theme/default-hover states; no external share activation');
}
