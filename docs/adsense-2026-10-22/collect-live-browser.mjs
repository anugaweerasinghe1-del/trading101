// Read-only production evidence collector. No accounts, orders, form submissions,
// ad clicks, policy changes or provider mutations. Assessments remain human work.
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
const root=resolve('docs/adsense-2026-10-22');
const inventory=JSON.parse(readFileSync(join(root,'URL-INVENTORY.json'),'utf8')).urls;
const selected=process.argv.slice(2).filter(x=>x.startsWith('/'));
const publicRows=inventory.filter(x=>x.path!=='/admin'&&!x.path.startsWith('/admin/'));
const queue=selected.length?publicRows.filter(x=>selected.includes(x.path)):publicRows;
const out=join(root,'evidence','live-browser');mkdirSync(out,{recursive:true});
writeFileSync('/tmp/tradehq-live-collector.pid',String(process.pid));
let stopping=false;process.on('SIGTERM',()=>{stopping=true;});
const pages=await(await fetch('http://127.0.0.1:9223/json/list')).json();
const ws=new WebSocket(pages.find(x=>x.type==='page').webSocketDebuggerUrl);
await new Promise(r=>ws.addEventListener('open',r,{once:true}));
let sequence=0,current=null;const pending=new Map(),requests=new Map();
ws.addEventListener('message',event=>{
 const m=JSON.parse(event.data);
 if(m.id){const p=pending.get(m.id);if(p){clearTimeout(p.timer);pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}return;}
 if(m.method==='Network.requestWillBeSent')requests.set(m.params.requestId,m.params.request.url);
 if(!current)return;
 if(m.method==='Runtime.exceptionThrown')current.runtimeErrors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);
 if(m.method==='Network.loadingFailed')current.networkFailures.push({url:requests.get(m.params.requestId)||null,error:m.params.errorText,canceled:m.params.canceled||false});
 if(m.method==='Network.responseReceived'&&m.params.response.status>=400)current.errorResponses.push({url:m.params.response.url,status:m.params.response.status,type:m.params.type});
});
const send=(method,params={})=>new Promise((resolveTask,reject)=>{const id=++sequence;const timer=setTimeout(()=>{pending.delete(id);reject(Error('CDP timeout: '+method));},20000);pending.set(id,{resolve:resolveTask,reject,timer});ws.send(JSON.stringify({id,method,params}));});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const evaluate=async(expression,awaitPromise=false)=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result?.value;};
async function wait(expression,ms=20000){const until=Date.now()+ms;while(Date.now()<until){if(await evaluate(expression))return true;await sleep(150);}return false;}
await send('Page.enable');await send('Runtime.enable');await send('Network.enable');
await send('Emulation.setScriptExecutionDisabled',{value:false});
const viewports=[[360,800],[390,844],[768,1024],[1280,800],[1920,1080]];
try{
 for(const row of queue){
  if(stopping)break;
  const key=createHash('sha256').update(row.url).digest('hex').slice(0,16),file=join(out,key+'.json');
  if(existsSync(file)&&!selected.length&&JSON.parse(readFileSync(file,'utf8')).status==='COLLECTED_NOT_YET_REVIEWED')continue;
  current={url:row.url,path:row.path,checkedAt:new Date().toISOString(),status:'IN_PROGRESS',runtimeErrors:[],networkFailures:[],errorResponses:[],viewports:[],substantiveAssessment:null,visualAssessment:null,limitations:['Automated observations and screenshots do not establish substantive or human visual review.']};
  try{
   await send('Emulation.setDeviceMetricsOverride',{width:360,height:800,deviceScaleFactor:1,mobile:true});
   const nav=await send('Page.navigate',{url:row.url});
   if(nav.errorText)throw Error('Navigation: '+nav.errorText);
   current.hydrated=await wait(`document.readyState==='complete'&&!document.querySelector('#prerender-seo')&&!!document.querySelector('main')&&!!document.querySelector('button[aria-label*="theme"]')`);
   if(!current.hydrated)throw Error('Settled hydration readiness not reached');
   await evaluate(`Promise.race([document.fonts.ready,new Promise(r=>setTimeout(r,5000))]).then(()=>true)`,true);
   await sleep(/^\/(trade|portfolio)/.test(row.path)?1500:500);
   // Decline optional analytics in this disposable audit browser only. This is
   // a normal visitor choice, never a change to site consent implementation.
   current.analyticsChoice=await evaluate(`(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()==='Reject analytics');if(!b)return 'No choice needed';b.click();return 'Rejected optional analytics in disposable audit profile';})()`);
   // Reveal scroll-triggered sections before interpreting blank screenshots.
   const height=await evaluate('document.documentElement.scrollHeight');
   for(let y=0;y<height;y+=700){await evaluate(`scrollTo(0,${y})`);await sleep(65);}
   await sleep(450);await evaluate('scrollTo(0,0)');await sleep(150);
   current.content=await evaluate(`({url:location.href,title:document.title,h1:[...document.querySelectorAll('h1')].map(x=>x.innerText),headings:[...document.querySelectorAll('main h1,main h2,main h3')].map(x=>x.innerText),main:document.querySelector('main')?.innerText,body:document.body.innerText,canonical:[...document.querySelectorAll('link[rel="canonical"]')].map(x=>x.href),robots:document.querySelector('meta[name="robots"]')?.content,links:[...document.querySelectorAll('main a[href]')].map(x=>({text:x.innerText,href:x.href})),controls:[...document.querySelectorAll('main button,main input,main select')].map(x=>({tag:x.tagName,type:x.getAttribute('type'),text:x.innerText,label:x.getAttribute('aria-label'),placeholder:x.getAttribute('placeholder')}))})`);
   for(const [width,height] of viewports){
    await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<500});
    await evaluate('scrollTo(0,0)');await sleep(250);
    const observation=await evaluate(`(()=>{const visible=e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden';return {width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,fonts:document.fonts.status,fontFaces:[...document.fonts].map(f=>({family:f.family,status:f.status,weight:f.weight})),h1Count:document.querySelectorAll('h1').length,mainCount:document.querySelectorAll('main').length,brokenImages:[...document.images].filter(x=>visible(x)&&x.complete&&!x.naturalWidth).map(x=>x.currentSrc),visibleControlsOutsideViewport:[...document.querySelectorAll('button,a[href],input,select')].filter(visible).filter(x=>{const r=x.getBoundingClientRect();return r.left< -1||r.right>innerWidth+1}).map(x=>({text:x.textContent.trim().slice(0,100),label:x.getAttribute('aria-label'),rect:x.getBoundingClientRect().toJSON()}))}})()`);
    const png=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});const name=key+'-'+width+'.png';writeFileSync(join(out,name),Buffer.from(png.data,'base64'));observation.screenshot='evidence/live-browser/'+name;
    current.viewports.push(observation);
   }
   // Activate one safe internal navigation link and exercise browser Back.
   // No buttons, forms, authentication links or private/admin actions qualify.
   const originalURL=current.content.url;
   const destination=await evaluate(`(()=>{const a=[...document.querySelectorAll('main a[href]')].find(a=>{const u=new URL(a.href);return u.origin===location.origin&&u.pathname!==location.pathname&&!u.hash&&!u.search&&!['/admin','/auth','/reset-password'].some(p=>u.pathname===p||u.pathname.startsWith(p+'/'))&&!a.hasAttribute('download')});if(!a)return null;const href=a.href;a.click();return href;})()`);
   if(destination){
    const expectedPath=new URL(destination).pathname;
    const reached=await wait(`location.pathname===${JSON.stringify(expectedPath)}&&!!document.querySelector('main')&&!document.querySelector('#prerender-seo')`,12000);
    current.internalNavigation={destination,reached,observedURL:await evaluate('location.href')};
    await evaluate('history.back()');
    current.internalNavigation.backReturned=await wait(`location.href===${JSON.stringify(originalURL)}&&!!document.querySelector('main')`,12000);
   }else current.internalNavigation={status:'No qualifying nonmutating main link; not tested'};
   current.status='COLLECTED_NOT_YET_REVIEWED';
  }catch(error){current.status='COLLECTION_FAILED';current.error=error.message;if(/CDP timeout|WebSocket|ECONNREFUSED/.test(error.message)){current.status='COLLECTION_INTERRUPTED';stopping=true;}}
  writeFileSync(file,JSON.stringify(current,null,2)+'\n');console.log(JSON.stringify({url:row.url,status:current.status,viewportCount:current.viewports.length,overflow:current.viewports.filter(x=>x.scrollWidth>x.width+1).map(x=>x.width),runtimeErrors:current.runtimeErrors.length,networkFailures:current.networkFailures.length,error:current.error}));
  current=null;
 }
}finally{ws.close();for(const p of pending.values())clearTimeout(p.timer);}
