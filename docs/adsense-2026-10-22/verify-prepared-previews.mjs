// Read-only, fresh browser targets. No production settings or record changes.
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {openAuditPage,pause} from './browser-session.mjs';
const root='docs/adsense-2026-10-22/evidence';
const out={checkedAt:new Date().toISOString(),scope:'Actual public Cloudflare candidate previews; provider identities recorded separately',rows:[]};
const p=await openAuditPage();
try {
 for(const [path,expected] of [['/contact','structured tracks, with quizzes'],['/trader/570008','prices. Fetched']]) {
  await p.send('Page.navigate',{url:'https://67f34211.tradehq-preview.pages.dev'+path});
  await p.wait(`document.querySelector('main')?.innerText.includes(${JSON.stringify(expected)})`);
  await p.evaluate('document.fonts.ready.then(()=>true)',true);
  await p.evaluate(`(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Reject analytics');b?.click();return true})()`);
  const main=await p.evaluate(`document.querySelector('main').innerText`);
  assert.ok(!main.includes(path==='/contact'?'the four structured tracks':'prices.Fetched'));
  for(const [width,height] of [[360,800],[390,844],[768,1024],[1280,800],[1920,1080]]) {
   await p.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<500});
   assert.equal(await p.evaluate('document.documentElement.scrollWidth>innerWidth+1'),false);
   out.rows.push({pr:214,path,width,expectedVisible:true,noDocumentOverflow:true});
  }
 }
 await p.send('Page.navigate',{url:'https://d7688a9d.tradehq-preview.pages.dev/courses'});
 await p.wait(`document.querySelector('main header h1')?.textContent.includes('Learn to Trade') && !!document.querySelector('button[aria-label*="theme"]')`);
 await p.evaluate('document.fonts.ready.then(()=>true)',true);
 await pause(2000);
 await p.evaluate(`(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Reject analytics');b?.click();return true})()`);
 for(const [width,height] of [[360,800],[390,844],[768,1024],[1280,800],[1920,1080]]) {
  await p.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<500});
  for(const theme of ['light','dark']) {
   await p.evaluate(`(()=>{if(document.documentElement.classList.contains('light')!==${theme==='light'})[...document.querySelectorAll('button[aria-label*="theme"]')].find(b=>b.getClientRects().length).click();return true})()`);
   await p.wait(`document.documentElement.classList.contains('light')===${theme==='light'}`);await pause(700);
   const r=await p.evaluate(`(()=>{const rgb=s=>s.match(/rgba?\\(([^)]+)\\)/)?.[1].split(',').slice(0,3).map(Number);const lum=cs=>cs.map(c=>c/255).map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4).reduce((s,c,i)=>s+c*[.2126,.7152,.0722][i],0);const bg=lum(rgb(getComputedStyle(document.body).backgroundColor));const ratio=cs=>{const v=lum(cs);return(Math.max(v,bg)+.05)/(Math.min(v,bg)+.05)};const t=document.querySelector('main header h1');return {gradient:getComputedStyle(t).backgroundImage,title:[...getComputedStyle(t).backgroundImage.matchAll(/rgba?\\([^)]+\\)/g)].map(m=>ratio(rgb(m[0]))),accent:ratio(rgb(getComputedStyle(document.querySelector('main header p span')).color)),overflow:document.documentElement.scrollWidth>innerWidth+1}})()`);
   assert.ok(r.title.length>=2&&r.title.every(c=>c>=3));assert.ok(r.accent>=4.5);assert.equal(r.overflow,false);
   out.rows.push({pr:215,path:'/courses',width,theme,...r});
   if(theme==='light'&&(width===360||width===1280)){await p.evaluate('scrollTo(0,0)');await p.screenshot(root+'/course-contrast-preview-'+width+'.png');}
  }
 }
 console.log('PASS preview copy at5widths and catalog contrast at5widths in both themes');
}finally{writeFileSync(root+'/PREPARED-PREVIEWS-BROWSER.json',JSON.stringify(out,null,2));await p.close();}
