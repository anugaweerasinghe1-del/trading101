// Safe read/expand-only follow-up. Uses a new target; never submits forms/orders.
import {readFileSync,readdirSync,mkdirSync,writeFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve,join} from 'node:path';
import {openAuditPage,pause} from './browser-session.mjs';
const root=resolve('docs/adsense-2026-10-22'),output=join(root,'evidence/live-faq-v2');mkdirSync(output,{recursive:true});
const selected=process.argv.slice(2);
const records=readdirSync(join(root,'evidence/live-browser')).filter(f=>f.endsWith('.json')).map(f=>JSON.parse(readFileSync(join(root,'evidence/live-browser',f)))).filter(d=>d.content&&/Frequently|\bFAQ\b/.test(d.content.main)&&(!selected.length||selected.includes(d.path))).sort((a,b)=>a.path.localeCompare(b.path));
let page=await openAuditPage(),batchCount=0;await page.send('Emulation.setDeviceMetricsOverride',{width:360,height:800,deviceScaleFactor:1,mobile:true});
try{for(const d of records){
 const key=createHash('sha256').update(d.url).digest('hex').slice(0,16),file=join(output,key+'.json'),old=join(root,'evidence/live-faq',key+'.json');
 if(existsSync(file)&&!selected.length&&JSON.parse(readFileSync(file)).status==='COLLECTED_NOT_YET_READ')continue;if(existsSync(old)&&JSON.parse(readFileSync(old)).answers?.length&&!selected.length)continue;
 if(batchCount>=20){await page.close();page=await openAuditPage();await page.send('Emulation.setDeviceMetricsOverride',{width:360,height:800,deviceScaleFactor:1,mobile:true});batchCount=0;}
 batchCount++;
 try{
  await page.send('Page.navigate',{url:d.url});await page.wait(`location.pathname===${JSON.stringify(new URL(d.content.url).pathname)}&&!!document.querySelector('button[aria-label*="theme"]')&&!document.querySelector('#prerender-seo')`);
  await page.evaluate('document.fonts.ready.then(()=>true)',true);
  await page.evaluate(`(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Reject analytics');if(b)b.click();return true})()`);
  if(d.path.startsWith('/trade/'))await page.wait(`!!document.querySelector('main section[aria-label="Frequently Asked Questions"] button')`);
  else await pause(600);
  const setup=await page.evaluate(`(()=>{const sections=[...document.querySelectorAll('main section')].filter(s=>/FAQ|Frequently/i.test((s.getAttribute('aria-label')||'')+' '+(s.querySelector('h2,h3')?.innerText||'')));const controls=[...new Set([...document.querySelectorAll('main details summary'),...sections.flatMap(s=>[...s.querySelectorAll('button')])])];controls.forEach((c,i)=>c.setAttribute('data-audit-faq',String(i)));return {count:controls.length,visibleSectionText:sections.map(s=>s.innerText)}})()`);
  const answers=[];for(let i=0;i<setup.count;i++){
   const question=await page.evaluate(`document.querySelector('[data-audit-faq="${i}"]').innerText`);
   await page.evaluate(`(()=>{const c=document.querySelector('[data-audit-faq="${i}"]');c.scrollIntoView({block:'center'});if(c.tagName==='SUMMARY'){if(!c.parentElement.open)c.click();}else if(c.getAttribute('aria-expanded')!=='true')c.click();return true})()`);await pause(350);
   answers.push(await page.evaluate(`(()=>{const c=document.querySelector('[data-audit-faq="${i}"]'),panel=c.getAttribute('aria-controls')?document.getElementById(c.getAttribute('aria-controls')):c.tagName==='SUMMARY'?c.parentElement:c;return {question:${JSON.stringify(question)},expanded:c.tagName==='SUMMARY'?c.parentElement.open:c.getAttribute('aria-expanded'),renderedAnswer:panel?.innerText||'',overflow:document.documentElement.scrollWidth>innerWidth+1}})()`));
  }
  writeFileSync(file,JSON.stringify({url:d.url,path:d.path,checkedAt:new Date().toISOString(),status:'COLLECTED_NOT_YET_READ',width:360,answers,alreadyVisibleText:answers.length?null:setup.visibleSectionText,limitation:'Collection and safe expansion do not establish substantive review. No production form/account/order/quiz submission.'},null,2));console.log(JSON.stringify({path:d.path,answers:answers.length,visibleSections:setup.visibleSectionText.length}));
 }catch(error){writeFileSync(file,JSON.stringify({url:d.url,path:d.path,status:'FOLLOWUP_INCOMPLETE',error:error.message},null,2));console.log(JSON.stringify({path:d.path,error:error.message}));if(/CDP timeout|WebSocket/.test(error.message))throw error;}
}}finally{await page.close();}
