/** Bounded current-state observations after a trusted public blank-root finding.
 * No sign-in, forms, user text, models, repairs or feedback writes. A healthy
 * follow-up never clears the original incident or confirms its cause/a repair.
 */
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';
import { waitForChromePort } from './isolated-chrome-startup.mjs';

export const BROWSER_FOLLOWUP_LIMITS = Object.freeze({ routes: 6, routeMs: 20000, totalMs: 150000 });
const PRODUCTION = 'https://www.thetradehq.com';
const ROUTES = new Set(['/', '/about', '/trade', '/markets', '/courses', '/daily', '/leaderboard', '/reviews', '/auth', '/contact', '/admin', '/admin/ai', '/learn', '/portfolio']);
const denied = () => ({codeWrites:false,modelCalls:false,ownerApproval:false,draftPrCreation:false,merge:false,productionRelease:false});

function connect(ws) {
  let sequence=0;
  const pending=new Map();
  ws.addEventListener('close',()=>{for(const task of pending.values()){clearTimeout(task.timer);task.reject(Error('Browser closed'));}pending.clear();});
  ws.addEventListener('message',event=>{
    let message;try{message=JSON.parse(event.data);}catch{return;}
    const task=pending.get(message.id);if(!task)return;
    pending.delete(message.id);clearTimeout(task.timer);
    message.error?task.reject(Error('Browser command failed')):task.resolve(message.result);
  });
  return {
    send(method,params={}) {
      return new Promise((resolve,reject)=>{
        const id=++sequence;
        const timer=setTimeout(()=>{pending.delete(id);reject(Error('Browser command deadline'));},5000);
        pending.set(id,{resolve,reject,timer});ws.send(JSON.stringify({id,method,params}));
      });
    },
    close() {ws.close();for(const task of pending.values()){clearTimeout(task.timer);task.reject(Error('Browser closed'));}pending.clear();}
  };
}

async function observeRoute(route,{origin,routeMs,chrome}) {
  const profile=mkdtempSync(join(tmpdir(),'tradehq-public-followup-'));
  const result={route,status:'OBSERVATION_UNAVAILABLE',rootCharacters:0,loading:false,prerender:false,visibleError:false,
    javascriptExceptions:0,scriptFailures:0,documentStatus:null,elapsedMs:0};
  let browser,cdp,ws;
  const started=Date.now(),failedScripts=new Set(),ownScripts=new Set();
  let timedOut=false,mainFrameId=null;
  const deadline=started+routeMs;
  const timer=setTimeout(()=>{
    timedOut=true;ws?.close();
    if(browser?.pid)try{process.kill(-browser.pid,'SIGKILL');}catch{}
  },routeMs);
  try {
    const args=['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
      '--disable-background-networking','--disable-extensions','--no-first-run',
      '--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'];
    if(process.env.HTTPS_PROXY)args.splice(-1,0,'--proxy-server='+process.env.HTTPS_PROXY);
    browser=spawn(chrome,args,{stdio:'ignore',detached:true});
    let launchError=null;browser.once('error',error=>{launchError=error;});
    const port=await waitForChromePort({readPort:()=>{
      const file=join(profile,'DevToolsActivePort');
      return existsSync(file)?readFileSync(file,'utf8').split('\n')[0]:null;
    },processState:()=>({exitCode:browser.exitCode,signalCode:browser.signalCode}),launchError:()=>launchError,delay,timeoutMs:Math.min(10000,routeMs)});
    const tabs=await (await fetch('http://127.0.0.1:'+port+'/json/list',{signal:AbortSignal.timeout(5000)})).json();
    const target=tabs.find(tab=>tab.type==='page');assert.ok(target?.webSocketDebuggerUrl);
    ws=new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>reject(Error('Browser connection deadline')),5000);
      ws.addEventListener('open',()=>{clearTimeout(timer);resolve();},{once:true});
      ws.addEventListener('error',()=>{clearTimeout(timer);reject(Error('Browser unavailable'));},{once:true});
      ws.addEventListener('close',()=>{clearTimeout(timer);reject(Error('Browser closed'));},{once:true});
    });
    cdp=connect(ws);
    ws.addEventListener('message',event=>{
      let message;try{message=JSON.parse(event.data);}catch{return;}
      const p=message.params;
      if(message.method==='Runtime.exceptionThrown')result.javascriptExceptions++;
      if(message.method==='Network.requestWillBeSent' && p.type==='Script') {
        try {const url=new URL(p.request.url);if(url.origin===origin && /^\/assets\/[A-Za-z0-9._-]+\.js$/.test(url.pathname))ownScripts.add(p.requestId);}catch{}
      }
      if(message.method==='Network.responseReceived') {
        if(p.type==='Document' && p.frameId===mainFrameId)result.documentStatus=p.response.status;
        if(ownScripts.has(p.requestId) && p.response.status>=400)failedScripts.add(p.requestId);
      }
      if(message.method==='Network.loadingFailed' && ownScripts.has(p.requestId))failedScripts.add(p.requestId);
    });
    await cdp.send('Page.enable');await cdp.send('Runtime.enable');await cdp.send('Network.enable');
    mainFrameId=(await cdp.send('Page.getFrameTree')).frameTree.frame.id;
    await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
    const navigation=await cdp.send('Page.navigate',{url:origin+route});
    assert.ok(!navigation.errorText);
    do {
      const snapshot=await cdp.send('Runtime.evaluate',{returnByValue:true,expression:
        "({path:location.pathname,rootCharacters:(document.getElementById('root')?.innerText||'').trim().length,loading:!!document.querySelector('[data-route-loading]'),prerender:!!document.getElementById('prerender-seo'),visibleError:/Unexpected Application Error|Application error: a client-side exception|API returned 429/i.test(document.getElementById('root')?.innerText||'')})"});
      const state=snapshot?.result?.value;
      if(state && state.path.replace(/\/$/,'')===route.replace(/\/$/,'')) {
        result.rootCharacters=state.rootCharacters;result.loading=state.loading;result.prerender=state.prerender;result.visibleError=state.visibleError;
        if(state.rootCharacters>=60 && !state.loading && !state.prerender && result.documentStatus===200) {
          result.status=result.visibleError || result.javascriptExceptions || failedScripts.size?'RENDERED_WITH_ERRORS':'RENDERED_AT_FOLLOWUP';break;
        }
        result.status='NOT_RENDERED_AT_FOLLOWUP';
      }
      if(Date.now()>=deadline)break;
      await delay(Math.min(200,Math.max(0,deadline-Date.now())));
    } while(Date.now()<=deadline);
  } catch { if(!timedOut || result.status==='OBSERVATION_UNAVAILABLE')result.status='OBSERVATION_UNAVAILABLE'; }
  finally {
    clearTimeout(timer);
    result.scriptFailures=failedScripts.size;result.elapsedMs=Date.now()-started;
    cdp?.close();if(!cdp)ws?.close();
    if(browser?.pid) {
      const exited=browser.exitCode===null && browser.signalCode===null?once(browser,'exit').catch(()=>{}):Promise.resolve();
      try{process.kill(-browser.pid,'SIGKILL');}catch(error){if(error.code!=='ESRCH')throw error;}
      await Promise.race([exited,delay(2500)]);
    }
    rmSync(profile,{recursive:true,force:true,maxRetries:3,retryDelay:100});
  }
  return result;
}

export async function observePublicIncidentRoutes(paths,{origin=PRODUCTION,routeMs=BROWSER_FOLLOWUP_LIMITS.routeMs}={}) {
  assert.ok(origin===PRODUCTION || /^http:\/\/127\.0\.0\.1:\d{1,5}$/.test(origin),'Canonical public origin or loopback fixture required');
  assert.ok(Array.isArray(paths) && paths.length<=42 && paths.every(path=>ROUTES.has(path)),'Known bounded public routes required');
  assert.ok(Number.isInteger(routeMs) && routeMs>0 && routeMs<=BROWSER_FOLLOWUP_LIMITS.routeMs);
  const routes=[...new Set(paths)],observations=[];
  const chrome=routes.length && ['google-chrome','google-chrome-stable','chromium','chromium-browser']
    .find(command=>spawnSync('which',[command],{encoding:'utf8',timeout:2500}).status===0);
  const started=Date.now();
  if(chrome && typeof WebSocket==='function') {
    for(const route of routes.slice(0,BROWSER_FOLLOWUP_LIMITS.routes)) {
      if(Date.now()-started>=BROWSER_FOLLOWUP_LIMITS.totalMs)break;
      try {observations.push(await observeRoute(route,{origin,routeMs,chrome}));}
      catch {observations.push({route,status:'OBSERVATION_UNAVAILABLE'});}
    }
  }
  return {schema:'tradehq-readonly-browser-followup-v1',status:!routes.length?'NOT_NEEDED':observations.length?'OBSERVED':'BROWSER_UNAVAILABLE',
    environment:origin===PRODUCTION?'PUBLIC_PRODUCTION':'LOOPBACK_FIXTURE',
    observationTrust:'CURRENT_PUBLIC_BROWSER_OBSERVATION',observedAt:new Date().toISOString(),
    observations,omittedRoutes:routes.length-observations.length,limits:BROWSER_FOLLOWUP_LIMITS,
    originalIncidentCleared:false,rootCauseVerified:false,confirmedRepairOutcomes:0,authorization:denied()};
}
