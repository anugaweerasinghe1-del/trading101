// Own fresh guest profile on9224; completion writes only local browser progress.
// Source reviewed: CourseLesson -> courseProgress.save -> localStorage only.
import {readFileSync,readdirSync,mkdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve,join} from 'node:path';
import assert from 'node:assert/strict';
import {openAuditPage,pause} from './browser-session.mjs';
const root=resolve('docs/adsense-2026-10-22'),out=join(root,'evidence/live-quiz');mkdirSync(out,{recursive:true});
const lessons=readdirSync(join(root,'evidence/live-browser')).filter(f=>f.endsWith('.json')).map(f=>JSON.parse(readFileSync(join(root,'evidence/live-browser',f)))).filter(d=>/^\/courses\/[^/]+\/[^/]+$/.test(d.path)).sort((a,b)=>a.path.localeCompare(b.path));
const page=await openAuditPage('about:blank',9224),blocked=[],runtimeErrors=[],interceptionErrors=[],rows=[];
const unsubscribe=page.onEvent(message=>{
 if(message.method==='Runtime.exceptionThrown')runtimeErrors.push(message.params.exceptionDetails.exception?.description||message.params.exceptionDetails.text);
 if(message.method!=='Fetch.requestPaused')return;
 const {requestId,request}=message.params,url=new URL(request.url);
 const allowed=['GET','HEAD','OPTIONS'].includes(request.method)||(request.method==='POST'&&url.pathname==='/rest/v1/rpc/get_published_course_catalog');
 if(!allowed)blocked.push({method:request.method,origin:url.origin,path:url.pathname});
 page.send(allowed?'Fetch.continueRequest':'Fetch.failRequest',allowed?{requestId}:{requestId,errorReason:'Aborted'}).catch(e=>interceptionErrors.push(e.message));
});
await page.send('Network.enable');await page.send('Runtime.enable');await page.send('Fetch.enable',{patterns:[{urlPattern:'https://*.supabase.co/*',requestStage:'Request'}]});
async function progress(){return page.evaluate(`(()=>{const s=JSON.parse(localStorage.getItem('tradehq_course_progress_v1')||'{}');return {tracks:Object.entries(s.tracks||{}).map(([slug,t])=>({slug,badgeEarned:!!t.badgeEarnedAt,completedLessons:Object.values(t.lessons||{}).filter(l=>l.status==='completed').length}))}})()`);}
async function profileSnapshot(label){
 await page.send('Page.navigate',{url:'https://www.thetradehq.com/trader/me'});await page.wait(`location.pathname==='/trader/me'&&document.querySelector('main')?.innerText.includes('Course badges earned')`);await pause(500);
 const state=await progress(),main=await page.evaluate(`document.querySelector('main').innerText`);await page.send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await page.evaluate(`(()=>{const h=[...document.querySelectorAll('main h2')].find(h=>h.innerText.includes('Course badges'));h?.scrollIntoView({block:'center'});return true})()`);await pause(250);await page.screenshot(join(out,'own-profile-'+label+'-390.png'));
 writeFileSync(join(out,'own-profile-'+label+'.json'),JSON.stringify({checkedAt:new Date().toISOString(),label,scope:'Own fresh disposable guest browser only; no account or public profile changed',state,renderedMain:main},null,2));
}
try{for(const [index,d]of lessons.entries()){
 const key=createHash('sha256').update(d.url).digest('hex').slice(0,16),result={url:d.url,path:d.path,checkedAt:new Date().toISOString(),status:'IN_PROGRESS',limitations:['Own disposable guest local progress only; factual feedback reading and image inspection separately staged.']};
 try{
  await page.send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await page.send('Page.navigate',{url:d.url});await page.wait(`location.pathname===${JSON.stringify(d.path)}&&!!document.querySelector('main h1')&&!document.querySelector('#prerender-seo')&&[...document.querySelectorAll('main button')].some(b=>b.innerText.trim()==='Submit & complete lesson')`);
  await page.evaluate('document.fonts.ready.then(()=>true)',true);await page.evaluate(`(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Reject analytics');if(b)b.click();return true})()`);
  const initial=await page.evaluate(`(()=>{const h=[...document.querySelectorAll('main h2')].find(h=>h.innerText==='Check Your Understanding'),box=h.parentElement,list=box.querySelector('.space-y-5'),submit=[...box.querySelectorAll('button')].find(b=>b.innerText.trim()==='Submit & complete lesson');list.setAttribute('data-audit-quiz','true');return {questions:list.children.length,initialSubmitDisabled:submit.disabled}})()`);assert.ok(initial.questions>=4);assert.equal(initial.initialSubmitDisabled,true);result.initial=initial;
  for(let q=0;q<initial.questions;q++){await page.evaluate(`(()=>{const b=document.querySelector('[data-audit-quiz]').children[${q}].querySelector('button');b.scrollIntoView({block:'center'});b.click();return true})()`);await pause(100);if(q===0)assert.equal(await page.evaluate(`[...document.querySelectorAll('main button')].find(b=>b.innerText.trim()==='Submit & complete lesson').disabled`),true);}
  await page.wait(`![...document.querySelectorAll('main button')].find(b=>b.innerText.trim()==='Submit & complete lesson').disabled`);await page.evaluate(`(()=>{const b=[...document.querySelectorAll('main button')].find(b=>b.innerText.trim()==='Submit & complete lesson');b.scrollIntoView({block:'center'});b.click();return true})()`);await page.wait(`document.querySelector('main')?.innerText.includes('Progress saved to your browser.')`);
  const feedback=await page.evaluate(`(()=>{const list=document.querySelector('[data-audit-quiz]');return {questions:[...list.children].map(card=>({text:card.innerText,options:[...card.querySelectorAll('button')].map((b,i)=>({text:b.innerText,selectedForAudit:i===0,correct:b.classList.contains('text-emerald-100'),disabled:b.disabled}))})),completion:[...document.querySelectorAll('main div')].map(d=>d.innerText).filter(t=>/^Lesson complete — \\d+\\/\\d+$/.test(t))[0]}})()`);assert.equal(feedback.questions.length,initial.questions);assert.ok(feedback.questions.every(q=>q.options.every(o=>o.disabled)&&q.options.filter(o=>o.correct).length===1));const expected=feedback.questions.filter(q=>q.options[0].correct).length;assert.equal(feedback.completion,'Lesson complete — '+expected+'/'+initial.questions);result.feedback=feedback;
  for(const [width,height]of[[390,844],[1280,800]]){await page.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<500});await page.evaluate(`document.querySelector('[data-audit-quiz]').scrollIntoView({block:'start'})`);await pause(300);await page.screenshot(join(out,key+'-'+width+'.png'));}
  result.status='LOCAL_GUEST_QUIZ_INTERACTIONS_PASS_NOT_YET_REVIEWED';result.progress=await progress();
 }catch(error){result.status='QUIZ_AUDIT_INCOMPLETE';result.error=error.message;}
 writeFileSync(join(out,key+'.json'),JSON.stringify(result,null,2));rows.push({path:d.path,status:result.status,error:result.error});console.log(JSON.stringify(rows.at(-1)));if(result.error)break;
 if(index===5)await profileSnapshot('after-two-published-tracks');
}
await profileSnapshot('final');writeFileSync(join(out,'SUMMARY.json'),JSON.stringify({checkedAt:new Date().toISOString(),rows,blockedSupabaseWrites:blocked,runtimeErrors,interceptionErrors,scope:'Actual public quiz UI in fresh disposable browser. All completion/badge writes restricted to own localStorage; Supabase mutation attempts blocked. No real account, order, contact or public profile mutation.'},null,2));
}finally{unsubscribe();await page.send('Fetch.disable').catch(()=>{});await page.close();}
