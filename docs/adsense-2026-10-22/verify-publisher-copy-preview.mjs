// Actual candidate public preview; own guest browser, no production/account writes.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {openAuditPage,pause} from './browser-session.mjs';
const root=new URL('./',import.meta.url),sha='36c8e3ae9c7c5f29b0a4df63c2e3439beebd540d',signals=JSON.parse(readFileSync(new URL('evidence/PR214-FINAL-PREVIEW-SIGNALS.json',root),'utf8'));
assert.equal(signals.candidateSHA,sha);assert.equal(signals.cloudflareGitHubNativeSignal.headSHA,sha);assert.equal(signals.cloudflareGitHubNativeSignal.appId,85455);assert.equal(signals.cloudflareGitHubNativeSignal.conclusion,'success');
const origin=signals.cloudflareGitHubNativeSignal.url,p=await openAuditPage(),rows=[],blocked=[],errors=[];
const prior=new URL('evidence/PR214-FINAL-PREVIEW-BROWSER.json',root);if(existsSync(prior)){const j=JSON.parse(readFileSync(prior,'utf8'));assert.equal(j.candidateSHA,sha);assert.equal(j.origin,origin);for(const row of j.rows){assert.equal(row.copyCorrectionVisible,true);assert.equal(row.overflow,false);rows.push(row);}}
p.onEvent(m=>{
 if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);
 if(m.method==='Fetch.requestPaused'){const {requestId,request}=m.params,u=new URL(request.url),read=['GET','HEAD','OPTIONS'].includes(request.method)||(request.method==='POST'&&['/rest/v1/rpc/get_published_course_catalog','/rest/v1/rpc/get_public_practice_members'].includes(u.pathname));if(!read)blocked.push({method:request.method,path:u.pathname});p.send(read?'Fetch.continueRequest':'Fetch.failRequest',read?{requestId}:{requestId,errorReason:'Aborted'}).catch(e=>errors.push(e.message));}
});
await p.send('Runtime.enable');await p.send('Fetch.enable',{patterns:[{urlPattern:'https://*.supabase.co/*',requestStage:'Request'}]});
const paths=['/contact','/trader/570008',...['btc','eth','nvda','sol','spy','tsla'].map(s=>'/how-to-trade/'+s),...['sui','abbv','agg','eurjpy','wheat'].map(s=>'/trade/'+s)];
try{
 for(const path of paths){
  for(const [width,height] of [[360,800],[390,844],[768,1024],[1280,800],[1920,1080]]){
   if(rows.some(r=>r.path===path&&r.width===width))continue;
   await p.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<500});await p.send('Page.navigate',{url:origin+path});await p.wait(`location.pathname===${JSON.stringify(path)} && document.readyState==='complete' && document.querySelector('main h1') && document.querySelector('main h1').textContent.trim()!=='Loading your page' && !document.querySelector('#prerender-seo')`);await p.evaluate('document.fonts.ready.then(()=>true)',true);await pause(500);
   await p.evaluate("[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Reject analytics')?.click();true");
   if(path==='/contact')await p.wait("!!document.querySelector('#contact-quick-links')");
   if(path.startsWith('/trader/'))await p.wait("document.querySelector('main')?.innerText.includes('Fetched')");
   if(path.startsWith('/trade/')){await p.wait("[...document.querySelectorAll('main button')].some(b=>b.textContent.includes('Can I lose real money trading'))");await p.evaluate("(()=>{const b=[...document.querySelectorAll('main button')].find(b=>b.textContent.includes('Can I lose real money trading'));b.scrollIntoView({block:'center'});if(b.getAttribute('aria-expanded')!=='true')b.click();return true})()");await p.wait("[...document.querySelectorAll('main [role=region]')].some(e=>e.innerText.includes('No. Every'))");await pause(250);}
   const row=await p.evaluate(`(()=>{const text=document.querySelector('main').innerText;return {path:location.pathname,width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth+1,copyCorrectionVisible:${path==='/contact'?"text.includes('structured tracks, with quizzes')&&!text.includes('four structured tracks')":path.startsWith('/trader/')?"/prices\\.\\s+Fetched/.test(text)":path.startsWith('/how-to-trade/')?"text.includes('Practise the full flow free')&&!text.includes('.. Practise')":"text.includes('virtual currency only')&&!text.includes('your portfolio is stored in your browser')"},answer:${path.startsWith('/trade/')?"[...document.querySelectorAll('main [role=region]')].find(e=>e.innerText.includes('No. Every'))?.innerText":"null"}}})()`);
   assert.equal(row.copyCorrectionVisible,true,path+' correction visible at '+width);assert.equal(row.overflow,false,path+' fits at '+width);
   if(path.startsWith('/trade/')){assert.equal(await p.evaluate(`/(cryptocurrencys|commoditys)/.test(document.querySelector('main').innerText)`),false,'Correct generated category plurals');const qa=await p.evaluate(`Array.from(document.querySelectorAll('script[type="application/ld+json"]')).flatMap(s=>{try{const j=JSON.parse(s.textContent);return Array.isArray(j)?j:[j]}catch{return[]}}).find(x=>x['@type']==='FAQPage')?.mainEntity`);assert.ok(Array.isArray(qa));assert.equal(/cryptocurrencys|commoditys/.test(JSON.stringify(qa)),false,'Correct FAQ schema plurals');const money=qa.find(q=>q.name.includes('Can I lose real money trading'));assert.ok(money?.acceptedAnswer.text.includes('virtual currency only'));assert.equal(money.acceptedAnswer.text.includes('your portfolio is stored in your browser'),false);row.faqStructuredAnswer=money.acceptedAnswer.text;}
   rows.push(row);
   if(path==='/trade/sui'&&[360,1280].includes(width))await p.screenshot(new URL('evidence/pr214-final-faq-storage-'+width+'.png',root).pathname);
   console.log('PASS '+path+' '+width);
  }
 }
 assert.deepEqual(errors,[]);assert.deepEqual(blocked,[]);
}finally{writeFileSync(new URL('evidence/PR214-FINAL-PREVIEW-BROWSER.json',root),JSON.stringify({checkedAt:new Date().toISOString(),candidateSHA:sha,origin,outcome:rows.length===65?'PASS':'INCOMPLETE',scope:'Actual13affected/representativepages at5sizes; source-derived152FAQroutes not falsely claimed152freshbrowserchecks. Safe public reading/FAQexpansion only.',rows,blockedMutationAttempts:blocked,runtimeErrors:errors},null,2)+'\n');await p.close();}
