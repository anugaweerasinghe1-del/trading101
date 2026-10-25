import assert from 'node:assert/strict';
import {contrastRatio} from './verify-wiki-share-contrast.mjs';

const channels=color=>color.match(/[\d.]+/g).map(Number);
const composite=backgrounds=>{
  let result=[255,255,255];
  for(const color of backgrounds.toReversed()) {
    const values=channels(color),alpha=values[3]??1;
    result=values.slice(0,3).map((value,index)=>value*alpha+result[index]*(1-alpha));
  }
  return `rgb(${result.join(',')})`;
};

/** Verify each difficulty palette in both themes, including its noninteractive hover state. */
export async function verifyWikiDifficultyContrast({send,evaluate,waitUntil,origin,delay}) {
  await send('DOM.enable');await send('CSS.enable');let count=0;
  for(const [slug,difficulty]of [['bear-trap','Novice'],['backtesting','Intermediate'],['liquidation-cascade','Pro']])
  for(const [width,height]of [[360,800],[390,844],[768,1024],[1280,800],[1920,1080]]) {
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<500});
    await send('Page.navigate',{url:origin+'/wiki/'+slug});
    await waitUntil(`document.readyState==='complete'&&!!document.querySelector('main[data-publisher-notes="/wiki/${slug}"]')&&!document.querySelector('#prerender-seo')&&Array.from(document.querySelectorAll('link[rel="stylesheet"]')).every(link=>!!link.sheet)`,'Glossary main and styles hydrate');
    await delay(100);
    for(const theme of ['light','dark']) {
      await evaluate(`(()=>{if(document.documentElement.classList.contains('light')!==${theme==='light'})[...document.querySelectorAll('button[aria-label*=theme]')].find(b=>b.getClientRects().length).click();return true;})()`);
      await waitUntil(`document.documentElement.classList.contains('light')===${theme==='light'}`,'Difficulty theme settles');
      for(const hover of [false,true]) {
        if(hover) {
          const {root}=await send('DOM.getDocument');const {nodeId}=await send('DOM.querySelector',{nodeId:root.nodeId,selector:'main [data-wiki-difficulty]'});
          await send('CSS.forcePseudoState',{nodeId,forcedPseudoClasses:['hover']});
        }
        await delay(250);
        await waitUntil(`(()=>{const badge=[...document.querySelectorAll('main div')].find(e=>e.textContent.trim()===${JSON.stringify(difficulty)});getComputedStyle(badge).color;return badge.getAnimations().every(animation=>animation.playState!=='running'&&!animation.pending);})()`,'Difficulty color transition settles');
        const row=await evaluate(`(()=>{const badge=[...document.querySelectorAll('main div')].find(e=>e.textContent.trim()===${JSON.stringify(difficulty)}),style=getComputedStyle(badge),backgrounds=[];for(let e=badge;e;e=e.parentElement)backgrounds.push(getComputedStyle(e).backgroundColor);return {path:location.pathname,difficulty:badge.textContent.trim(),color:style.color,backgrounds,fontSize:style.fontSize,fontWeight:style.fontWeight,opacity:style.opacity,overflow:document.documentElement.scrollWidth>innerWidth+1};})()`);
        assert.equal(row.difficulty,difficulty);assert.equal(row.opacity,'1');
        assert.ok(contrastRatio(row.color,composite(row.backgrounds))>=4.5,`Difficulty contrast ${slug}/${width}/${theme}/${hover?'hover':'default'}: ${contrastRatio(row.color,composite(row.backgrounds)).toFixed(2)}`);
        assert.equal(row.overflow,false);count++;
        if(hover){const {root}=await send('DOM.getDocument');const {nodeId}=await send('DOM.querySelector',{nodeId:root.nodeId,selector:'main [data-wiki-difficulty]'});await send('CSS.forcePseudoState',{nodeId,forcedPseudoClasses:[]});}
      }
    }
  }
  console.log('PASS glossary difficulty contrast: '+count+' actual route/width/theme/default-hover states');
}
