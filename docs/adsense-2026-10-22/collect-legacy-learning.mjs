// Disposable guest; lesson/quiz controls only. No account/order/contact writes.
import {mkdirSync,writeFileSync} from 'node:fs';
import {openAuditPage,pause} from './browser-session.mjs';
const root='docs/adsense-2026-10-22/evidence/legacy-learning-20261023';mkdirSync(root,{recursive:true});
const page=await openAuditPage(),blocked=[],errors=[],results=[];
page.onEvent(m=>{
 if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);
 if(m.method==='Fetch.requestPaused'){
  const {request,requestId}=m.params,u=new URL(request.url);
  const read=['GET','HEAD','OPTIONS'].includes(request.method)||(request.method==='POST'&&u.pathname==='/rest/v1/rpc/get_published_course_catalog');
  if(!read)blocked.push({method:request.method,path:u.pathname});
  page.send(read?'Fetch.continueRequest':'Fetch.failRequest',read?{requestId}:{requestId,errorReason:'Aborted'}).catch(e=>errors.push(e.message));
 }
});
await page.send('Runtime.enable');await page.send('Fetch.enable',{patterns:[{urlPattern:'https://*.supabase.co/*',requestStage:'Request'}]});
const text=()=>page.evaluate(`document.querySelector('main').innerText`);
async function click(label){await page.evaluate(`(()=>{const b=[...document.querySelectorAll('main button')].find(b=>b.textContent.trim()===${JSON.stringify(label)});if(!b||b.disabled)throw Error('Control unavailable');b.click();return true})()`);await pause(180);}
try{
 for(let lesson=1;lesson<=6;lesson++){
  const row={path:'/learn/'+lesson,checkedAt:new Date().toISOString(),status:'COLLECTING',subtopics:[],questions:[]};
  await page.send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  await page.send('Page.navigate',{url:'https://www.thetradehq.com'+row.path});
  await page.wait(`document.querySelector('main')?.innerText.includes('Subtopic 1 of 4')&&!document.querySelector('#prerender-seo')`);
  await page.evaluate('document.fonts.ready.then(()=>true)',true);await pause(1000);
  await page.evaluate("[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Reject analytics')?.click();true");
  for(let subtopic=1;subtopic<=4;subtopic++){
   await page.wait(`document.querySelector('main')?.innerText.includes('Subtopic ${subtopic} of 4')`);
   row.subtopics.push({subtopic,main:await text()});
   await click(subtopic===4?'Take Quiz':'Continue');
  }
  await page.wait(`document.querySelector('main')?.innerText.includes('Quiz Time!')`);
  for(let question=1;question<=30;question++){
   const q=await page.evaluate(`({main:document.querySelector('main').innerText,submitDisabled:[...document.querySelectorAll('main button')].find(b=>b.textContent.trim()==='Submit Answer')?.disabled})`);
   if(!q.submitDisabled)throw Error('Quiz should require an initial selection');
   await page.evaluate(`document.querySelector('main .space-y-3 button').click();true`);await pause(100);await click('Submit Answer');
   const feedback=await text();row.questions.push({question,before:q.main,feedback});
   if(feedback.includes('Quiz Complete!')){
    row.finalQuestionFeedbackVisible=feedback.includes('Correct!')||feedback.includes('Incorrect');row.summary=feedback;
    for(const [width,height]of[[390,844],[1280,800]]){await page.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<500});await page.evaluate('scrollTo(0,0)');await pause(300);await page.screenshot(`${root}/lesson-${lesson}-summary-${width}.png`);}
    break;
   }
   await click('Next Question');await page.wait(`document.querySelector('main')?.innerText.includes('Question ${question+1} of')`);
  }
  row.status='ACTUAL_STATES_COLLECTED_NOT_YET_FACTUALLY_REVIEWED';writeFileSync(`${root}/lesson-${lesson}.json`,JSON.stringify(row,null,2));results.push({path:row.path,subtopics:row.subtopics.length,questions:row.questions.length,finalQuestionFeedbackVisible:row.finalQuestionFeedbackVisible});console.log(JSON.stringify(results.at(-1)));
 }
}finally{writeFileSync(`${root}/SUMMARY.json`,JSON.stringify({checkedAt:new Date().toISOString(),scope:'Own disposable guest, React lesson state only. No real account or server record changed.',results,blockedSupabaseMutations:blocked,runtimeErrors:errors},null,2));await page.send('Fetch.disable').catch(()=>{});await page.close();}
