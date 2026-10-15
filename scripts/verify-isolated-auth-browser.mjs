/**
 * Credential-free, isolated real Chrome regression for the COMPILED /auth UI.
 * Runs against a loopback-only Supabase mock; never contacts production.
 * No installed browser packages or real Supabase accounts required.
 */
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, existsSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, extname, sep } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { once } from "node:events";
import {waitForChromePort} from "./isolated-chrome-startup.mjs";

const USER_ID="bd1ca419-139b-4170-ac64-a99e0076f123";
const EMAIL="tradehq-browser-fixture@example.invalid";
const PASSWORD="disposable-test-credential-31";
const epoch=Math.floor(Date.now()/1000);
const b64=v=>Buffer.from(JSON.stringify(v)).toString("base64url");
const JWT=b64({alg:"HS256",typ:"JWT"})+"."+b64({sub:USER_ID,aud:"authenticated",role:"authenticated",exp:epoch+3600})+".fixture-only";
const USER={id:USER_ID,aud:"authenticated",role:"authenticated",email:EMAIL,
  app_metadata:{provider:"email",providers:["email"]},user_metadata:{username:"isolated"},
  created_at:new Date().toISOString()};
const MIME={".html":"text/html; charset=utf-8",".js":"application/javascript; charset=utf-8",
  ".css":"text/css; charset=utf-8",".svg":"image/svg+xml",".json":"application/json",
  ".png":"image/png",".woff2":"font/woff2",".ico":"image/x-icon"};
// Use the actual authored bank, parsed as JSON rather than executing TS.
// Its visible reviewer proves the bank response reached the compiled UI.
const bankSource=readFileSync("src/lib/dailyPracticeBank.ts","utf8");
const bankMatch=bankSource.match(/export const starterPracticeBank: DailyBatch = (\{[\s\S]*\});\s*$/);
assert.ok(bankMatch,"Authored Daily bank JSON fixture unavailable");
const fixtureBank={...JSON.parse(bankMatch[1]),reviewer:"Isolated browser fixture"};
const wait=async(check,label,ms=14000)=>{
  const start=Date.now();
  while(Date.now()-start<ms){try{const x=await check();if(x)return x;}catch{}await sleep(150);}
  throw Error("Timed out waiting for "+label);
};
function cdpConnection(ws){
  const pending=new Map();let sequence=0;
  ws.addEventListener("message",event=>{
    let reply;try{reply=JSON.parse(event.data)}catch{return}
    const task=pending.get(reply.id);if(!task)return;
    pending.delete(reply.id);clearTimeout(task.timeout);
    if(reply.error)task.reject(Error("Chrome: "+reply.error.message));
    else task.resolve(reply.result||{});
  });
  return {
    send(method,params={}){
      return new Promise((resolve,reject)=>{
        const id=++sequence;
        const timeout=setTimeout(()=>{pending.delete(id);reject(Error("Chrome CDP timeout "+method));},10000);
        pending.set(id,{resolve,reject,timeout});
        ws.send(JSON.stringify({id,method,params}));
      });
    },
    async evaluate(expression){
      const x=await this.send("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});
      if(x.exceptionDetails){
        const reason=String(x.exceptionDetails.exception?.description||x.exceptionDetails.text||'Unknown browser exception').split('\n')[0].slice(0,180);
        throw Error("Browser JavaScript assertion failed: "+reason);
      }
      return x.result?.value;
    },
    close(){ws.close();for(const t of pending.values())clearTimeout(t.timeout);pending.clear();}
  };
}
async function main(){
  assert.ok(Number(process.versions.node.split(".")[0])>=22 && typeof WebSocket==="function",
    "Node 22 with native WebSocket required");
  const chrome=["google-chrome","google-chrome-stable","chromium","chromium-browser"]
    .find(name=>spawnSync("which",[name],{encoding:"utf8"}).status===0);
  assert.ok(chrome,"Real Chromium unavailable: do not claim this browser test passed");
  const temp=mkdtempSync(join(tmpdir(),"tradehq-isolated-auth-"));
  const dist=join(temp,"dist"),profile=join(temp,"chrome");
  let server,browser,devtools;let attempts=0,approved=0,rejected=0,dataWrites=0,portfolioInitialized=0,logouts=0,refreshRejected=0,dailyReads=0,adminChatRequests=0;
  let showPublications=false,publicationReads=0;
  let holdLearnModule=true;
  const releaseLearnModules=[];
  const rejectedWrites=[];
  const publications=[{slug:'isolated-publication',published_at:new Date().toISOString(),title:'Isolated course announcement'}];
  const ADMIN_FIXTURE_KEY='isolated-admin-fixture-only';
  const repairRequests={status:0,stop:0};
  const chatDraft='Improve About page mobile spacing while preserving every existing sentence and link.';
  try{
    server=createServer((req,res)=>{
      const parsed=new URL(req.url||"/","http://localhost");
      const route=parsed.pathname;
      const json=(status,body)=>{
        res.writeHead(status,{"Content-Type":"application/json","Cache-Control":"no-store"});
        res.end(JSON.stringify(body));
      };
      if(route==='/functions/v1/admin-courses' && req.method==='POST'){
        return req.headers['x-admin-key']===ADMIN_FIXTURE_KEY?json(200,{data:{}}):json(401,{error:'fixture_admin_denied'});
      }
      if(route==='/functions/v1/admin-agent-chat' && req.method==='POST'){
        if(req.headers['x-admin-key']!==ADMIN_FIXTURE_KEY)return json(401,{error:'fixture_admin_denied'});
        adminChatRequests++;
        if(adminChatRequests===1)return json(503,{code:'PILOT_PAUSED',error:'Fixture pilot paused'});
        const output={reply:'<img src=x onerror="window.__modelHtmlExecuted=true">',draftRequest:chatDraft,mode:'READ_ONLY_PILOT',claim:'UNVERIFIED_SUGGESTION',rootCauseVerified:false,historyAvailable:false,authorization:{codeWrites:false,modelTools:false,merge:false,productionRelease:false}};
        if(adminChatRequests===3)output.authorization.merge=true;
        if(adminChatRequests===4){setTimeout(()=>json(200,output),500);return;}
        return json(200,output);
      }
      if(route==='/functions/v1/repair-owner-control' && req.method==='POST'){
        if(req.headers['x-admin-key']!==ADMIN_FIXTURE_KEY || req.headers.authorization!=='Bearer '+JWT)return json(401,{code:'OWNER_REQUIRED'});
        let content='';req.on('data',chunk=>{content+=chunk;});
        req.on('end',()=>{
          let input;try{input=JSON.parse(content);}catch{return json(400,{code:'INVALID_ACTION'});}
          if(!['status','stop'].includes(input.action)||Object.keys(input).length!==1)return json(400,{code:'INVALID_ACTION'});
          const action=input.action;repairRequests[action]++;
          const value={code:action==='stop'?'DURABLE_STOP_CONFIRMED':'CONTROL_STATUS',mode:'OWNER_STOP_ONLY',
            stopped:action==='stop',generation:action==='stop'?3:2,activeCandidates:action==='stop'?0:1,
            authorization:{codeWrites:false,modelCalls:false,merge:false,productionRelease:false}};
          if(action==='status'&&repairRequests.status===1)return json(503,{code:'CONTROL_PAUSED'});
          if(action==='status'&&repairRequests.status===2)value.authorization.merge=true;
          if(action==='status'&&repairRequests.status===4)return json(403,{code:'OWNER_ACCOUNT_REQUIRED'});
          if(action==='status'&&repairRequests.status===5)return json(401,{code:'ADMIN_KEY_REQUIRED'});
          if((action==='status'&&repairRequests.status===3)||(action==='stop'&&repairRequests.stop===3)){setTimeout(()=>json(200,value),500);return;}
          return json(200,value);
        });return;
      }
      if(route==="/auth/v1/token" && req.method==="POST" &&
        parsed.searchParams.get("grant_type")==="password"){
        attempts++;let content="";
        req.on("data",x=>{content+=x;if(content.length>8000)req.destroy();});
        req.on("end",()=>{
          let body;try{body=JSON.parse(content)}catch{return json(400,{error:"invalid_request"})}
          if(body.email!==EMAIL||body.password!==PASSWORD){
            rejected++;return json(400,{error:"invalid_grant",error_description:"Invalid login credentials"});
          }
          approved++;
          return json(200,{access_token:JWT,token_type:"bearer",expires_in:3600,
            expires_at:epoch+3600,refresh_token:"fixture-refresh-token",user:USER});
        });return;
      }
      if(route==="/auth/v1/token" && req.method==="POST" && parsed.searchParams.get("grant_type")==="refresh_token"){
        refreshRejected++;return json(400,{error:"invalid_grant",error_description:"Refresh token expired"});
      }
      if(route==="/auth/v1/logout" && req.method==="POST"){
        if(req.headers.authorization!=="Bearer "+JWT)return json(401,{error:"invalid_token"});
        logouts++;res.writeHead(204);res.end();return;
      }
      if(route==="/auth/v1/user")
        return req.headers.authorization==="Bearer "+JWT?json(200,USER):json(401,{error:"invalid_token"});
      if(route.startsWith("/auth/v1/"))return json(403,{error:"blocked_fixture_auth"});
      if(route==="/rest/v1/rpc/initialize_practice_portfolio" && req.method==="POST"){
        if(req.headers.authorization!=="Bearer "+JWT)return json(401,{error:"invalid_token"});
        portfolioInitialized++;
        return json(200,{trades:[],cash:100000,ranked:false,cycle_id:"fixture",
          updated_at:new Date().toISOString(),positions:[]});
      }
      if(route==="/rest/v1/rpc/get_daily_practice_bank" && req.method==="POST"){
        dailyReads++;
        // Request arrival is not query hydration. Exercise a deliberately late
        // real-bank response; selection must wait for its visible UI state.
        setTimeout(()=>json(200,fixtureBank),200);return;
      }
      if(route==='/rest/v1/rpc/get_published_course_catalog' && req.method==='POST')return json(200,[]);
      if(route.startsWith("/rest/v1/")){
        if(!["GET","HEAD"].includes(req.method||"")){dataWrites++;rejectedWrites.push(route);return json(403,{error:"fixture_never_mutates"})}
        if(route==='/rest/v1/published_courses' && parsed.searchParams.get('select')?.includes('published_at')){
          publicationReads++;return json(200,showPublications?publications:[]);
        }
        if(route==="/rest/v1/profiles")
          return json(200,[{id:USER_ID,username:"isolated",country:null,bio:null,is_public:false}]);
        return json(200,[]);
      }
      if(!["GET","HEAD"].includes(req.method||""))return json(405,{error:"not_allowed"});
      const pathname=decodeURIComponent(route);
      let file=join(dist,pathname);
      if(pathname.endsWith("/"))file=join(file,"index.html");
      if(!file.startsWith(dist+sep)&&file!==dist)return json(403,{error:"path_denied"});
      if(!existsSync(file)||!statSync(file).isFile()){
        if(pathname.startsWith("/assets/")){res.writeHead(404);res.end();return;}
        file=join(dist,"index.html");
      }
      const serve=()=>{
        res.writeHead(200,{"Content-Type":MIME[extname(file)]||"application/octet-stream"});
        res.end(readFileSync(file));
      };
      if(holdLearnModule && /^\/assets\/Learn-[^.]+\.js$/.test(pathname)){
        releaseLearnModules.push(serve);return;
      }
      serve();
    });
    await new Promise((resolve,reject)=>{
      server.once("error",reject);server.listen(0,"127.0.0.1",resolve);
    });
    const origin="http://127.0.0.1:"+server.address().port;
    const built=spawnSync(process.execPath,["node_modules/vite/bin/vite.js","build","--outDir",dist],{
      cwd:resolve("."),encoding:"utf8",timeout:180000,maxBuffer:3*1024*1024,
      env:{...process.env,VITE_SUPABASE_URL:origin,
        VITE_SUPABASE_PUBLISHABLE_KEY:"sb_publishable_isolated_test_only"}});
    assert.equal(built.status,0,"Isolated build failed: "+String(built.stderr||"").slice(-1200));
    assert.ok(existsSync(join(dist,"index.html")),"Real frontend bundle missing");
    browser=spawn(chrome,["--headless=new","--no-sandbox","--disable-gpu",
      "--disable-dev-shm-usage","--disable-background-networking","--disable-extensions",
      "--no-first-run","--remote-allow-origins=*","--remote-debugging-port=0",
      "--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE localhost, EXCLUDE 127.0.0.1",
      "--user-data-dir="+profile,"about:blank"],{stdio:"ignore",detached:true});
    let launchError=null;
    browser.once("error",error=>{launchError=error;});
    const port=await waitForChromePort({readPort:()=>{
      const file=join(profile,"DevToolsActivePort");
      return existsSync(file)?readFileSync(file,"utf8").split("\n")[0]:null;
    },processState:()=>({exitCode:browser.exitCode,signalCode:browser.signalCode}),
      launchError:()=>launchError,delay:sleep});
    const tabs=await (await fetch("http://127.0.0.1:"+port+"/json/list")).json();
    const tab=tabs.find(x=>x.type==="page");
    assert.ok(tab?.webSocketDebuggerUrl,"Chromium debugging tab unavailable");
    const ws=new WebSocket(tab.webSocketDebuggerUrl);
    await new Promise((resolve,reject)=>{
      ws.addEventListener("open",resolve,{once:true});
      ws.addEventListener("error",reject,{once:true});
    });
    devtools=cdpConnection(ws);
    await devtools.send("Page.enable");await devtools.send("Runtime.enable");
    await devtools.send("Network.enable");
    await devtools.send("Network.setBlockedURLs",{urls:["https://*","wss://*"]});
    await devtools.send("Emulation.setDeviceMetricsOverride",{width:1440,height:900,deviceScaleFactor:1,mobile:false});
    // CDP navigation commands acknowledge the request before the old document
    // disappears. Never let an assertion against that old DOM satisfy a wait.
    let navigation=0;
    const loadDocument=async(url)=>{
      const marker=String(++navigation);
      await devtools.evaluate("globalThis.__tradehqFixtureDocument="+JSON.stringify(marker));
      if(url)await devtools.send("Page.navigate",{url});
      else await devtools.send("Page.reload",{ignoreCache:true});
      await wait(()=>devtools.evaluate("globalThis.__tradehqFixtureDocument!=="+JSON.stringify(marker)+
        " && document.readyState==='complete'"),"new document after "+(url?new URL(url).pathname:"reload"));
    };
    // Hold only the compiled lazy route module. A slow connection must leave
    // a visible, accessible loading screen and then resolve to actual Learn.
    await devtools.send("Page.navigate",{url:origin+"/learn"});
    await wait(()=>releaseLearnModules.length===1,"held lazy Learn module");
    await wait(()=>devtools.evaluate("document.querySelector('[role=status]')?.textContent.includes('Loading your page')"),"visible route loading status",3000);
    assert.ok(await devtools.evaluate("document.querySelector('#root')?.innerText.length>60"),"Pending route must not leave a blank root");
    holdLearnModule=false;releaseLearnModules.splice(0).forEach(release=>release());
    await wait(()=>devtools.evaluate("[...document.querySelectorAll('h1')].some(e=>e.textContent.includes('Learn Trading')) && !document.querySelector('[data-route-loading]')"),"Learn after delayed module release");
    console.log("ISOLATED_ROUTE_LOADING_PASS: actual compiled Learn module held; visible accessible loading; actual Learn rendered after release.");
    await loadDocument(origin+"/auth");
    await wait(()=>devtools.evaluate("!!(document.querySelector('input[type=email]')&&document.querySelector('input[type=password]'))"),"real TradeHQ login form");
    const submit=(mail,pass)=>{
      const values=[mail,pass];
      const expression="(()=>{const inputs=[document.querySelector('input[type=email]'),document.querySelector('input[type=password]')];"+
        "const values="+JSON.stringify(values)+";"+
        "inputs.forEach((el,i)=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,values[i]);"+
        "el.dispatchEvent(new Event('input',{bubbles:true}));});"+
        "document.querySelector('button[type=submit]').click();return true;})()";
      return devtools.evaluate(expression);
    };
    await submit(EMAIL,"invalid-fixture-password");
    await wait(()=>rejected===1,"negative Supabase login verification");
    assert.equal(await devtools.evaluate("location.pathname"),"/auth",
      "Invalid password must never enter an authenticated route");
    await wait(()=>devtools.evaluate("!!document.querySelector('button[type=submit]') && !document.querySelector('button[type=submit]').disabled"),"login UI ready for submission");
    await submit(EMAIL,PASSWORD);
    await wait(()=>approved===1,"positive Supabase fixture login");
    await wait(()=>devtools.evaluate("location.pathname==='/trader/me'"),"authenticated profile redirect");
    await wait(()=>portfolioInitialized>=1,"isolated account portfolio initialization");
    // Reload verifies a real persisted SDK session, with no second login grant.
    await loadDocument();
    await wait(()=>devtools.evaluate("!!document.querySelector('[aria-label=\"Account menu\"]')"),"session restored after reload");
    assert.equal(approved,1,"Reload must restore the session without another password grant");
    // Exercise the real account menu and Supabase local sign-out request.
    await devtools.evaluate("(()=>{const e=document.querySelector('[aria-label=\"Account menu\"]');if(!e)throw Error('Restored account menu missing');e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0,ctrlKey:false}));return true;})()");
    await wait(()=>devtools.evaluate("[...document.querySelectorAll('[role=menuitem]')].some(e=>e.textContent.trim()==='Sign out')"),"account sign-out menu");
    await devtools.evaluate("[...document.querySelectorAll('[role=menuitem]')].find(e=>e.textContent.trim()==='Sign out').click()");
    await wait(()=>logouts===1,"fixture backend sign-out");
    await wait(()=>devtools.evaluate("!document.querySelector('[aria-label=\"Account menu\"]')"),"signed-out UI");
    await loadDocument();
    await wait(()=>devtools.evaluate("!!document.querySelector('a[href=\"/auth\"]') && !document.querySelector('[aria-label=\"Account menu\"]')"),"no session resurrection after reload");
    // Find the actual configured SDK key; seed an expired test session and
    // prove its rejected refresh returns to the signed-out interface.
    await loadDocument(origin+"/auth");
    await wait(()=>devtools.evaluate("!!document.querySelector('input[type=email]')"),"auth form for refresh test");
    await wait(()=>devtools.evaluate("!!document.querySelector('button[type=submit]') && !document.querySelector('button[type=submit]').disabled"),"login UI ready for submission");
    await submit(EMAIL,PASSWORD);
    await wait(()=>approved===2,"second independent fixture login");
    await wait(()=>devtools.evaluate("location.pathname==='/trader/me'"),"second profile navigation");
    const authKey=await devtools.evaluate("Object.keys(localStorage).find(k=>k.startsWith('sb-')&&k.endsWith('-auth-token'))");
    assert.ok(authKey,"SDK persisted auth storage key missing");
    await devtools.evaluate("(()=>{const k="+JSON.stringify(authKey)+";const s=JSON.parse(localStorage.getItem(k));s.expires_at=1;localStorage.setItem(k,JSON.stringify(s));})()");
    await loadDocument();
    await wait(()=>refreshRejected>=1,"rejected expired refresh token");
    await wait(()=>devtools.evaluate("!document.querySelector('[aria-label=\"Account menu\"]') && !!document.querySelector('a[href=\"/auth\"]')"),"expired session signed out");
    assert.equal(await devtools.evaluate("localStorage.getItem("+JSON.stringify(authKey)+")"),null,"Rejected refresh must clear persisted credentials");

    // Daily Practice: actual built UI writes an answer snapshot, resumes after
    // reload, completes ten questions and preserves one calendar-day streak.
    await loadDocument(origin+"/daily");
    const dailyReady=()=>devtools.evaluate("!!document.querySelector('#deeper-practice') && [...document.querySelectorAll('#deeper-practice button')].some(e=>e.textContent.includes('Start case study'))");
    const dailyBankReady=async()=>{
      await wait(()=>devtools.evaluate("document.querySelector('#deeper-practice')?.textContent.includes('Bank reviewed by Isolated browser fixture.')"),"authored Daily bank rendered");
      // Allow passive bank-change effects to finish before a user selection.
      await devtools.evaluate("new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve(true))))");
    };
    await wait(dailyReady,"Daily case study");
    await wait(()=>dailyReads>=1,"read-only Daily bank request");
    await dailyBankReady();
    const dailyClick=async text=>{
      const expression="(()=>{const e=[...document.querySelectorAll('#deeper-practice button')].find(e=>e.textContent.trim()==="+JSON.stringify(text)+"&&!e.disabled);if(!e)throw Error('Daily button missing');e.click();return true;})()";
      return devtools.evaluate(expression);
    };
    const stored=()=>devtools.evaluate("JSON.parse(localStorage.getItem('tradehq:deeper-practice:v1')||'[]').find(p=>typeof p.date==='string'&&Array.isArray(p.answers))");
    await dailyClick("Start case study");
    // Represent another tab's committed first answer before its storage event
    // reaches this tab. This tab's rendered state still has no answers.
    await devtools.evaluate("(()=>{const bank="+JSON.stringify(fixtureBank)+";const now=new Date();const date=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0');const n=Math.floor((Date.parse(date)-Date.parse(bank.effectiveFrom))/86400000);const exercise=bank.exercises[((n%bank.exercises.length)+bank.exercises.length)%bank.exercises.length];localStorage.setItem('tradehq:deeper-practice:v1',JSON.stringify([{date,bankId:bank.id,exercise,answers:[1],reflection:''}]));return true;})()");
    for(let i=0;i<10;i++){
      await wait(()=>devtools.evaluate("document.querySelector('#case-study-content fieldset legend') && document.querySelector('#case-study-content').textContent.includes('Question "+(i+1)+" of 10')"),"Daily question "+(i+1));
      await devtools.evaluate("document.querySelector('#case-study-content input[type=radio]').click()");
      await wait(()=>devtools.evaluate("[...document.querySelectorAll('#deeper-practice button')].some(e=>e.textContent.trim()==='Check answer'&&!e.disabled)"),"answer selection");
      await dailyClick("Check answer");
      await wait(async()=>((await stored())?.answers.length===i+1),"persisted Daily answer "+(i+1));
      if(i===0){
        const before=await stored();
        assert.deepEqual(before.answers,[1],"Stale rendered tab must not replace another tab's original answer with its own zero pick");
        await devtools.evaluate("(()=>{const key='tradehq:deeper-practice:v1';const rows=JSON.parse(localStorage.getItem(key));localStorage.setItem(key,JSON.stringify([{date:{toString:'invalid'}},...rows]));return true;})()");
        await loadDocument();
        await dailyBankReady();
        await wait(()=>devtools.evaluate("[...document.querySelectorAll('#deeper-practice button')].some(e=>e.textContent.includes('Continue case study'))"),"saved Daily resume control");
        assert.deepEqual(await stored(),before,"Reload must preserve the exact exercise and original answer");
        await dailyClick("Continue case study"); // UI selects the first unanswered question
      }else if(i<9){await dailyClick("Next question");}
    }
    await wait(()=>devtools.evaluate("document.querySelector('#deeper-practice').textContent.includes('Case complete')"),"completed case score");
    const complete=await stored();assert.equal(complete.answers.length,10);assert.equal(complete.answers[0],1);assert.ok(complete.answers.slice(1).every(a=>a===0));
    const streakKey=await devtools.evaluate("Object.keys(localStorage).find(k=>{try{const v=JSON.parse(localStorage.getItem(k));return v && v.totalCompleted===1 && Array.isArray(v.history)}catch{return false}})");
    assert.ok(streakKey,"Daily completion must persist one streak entry");
    await loadDocument();
    await dailyBankReady();
    await wait(()=>devtools.evaluate("[...document.querySelectorAll('#deeper-practice button')].some(e=>e.textContent.includes('Review case study'))"),"completed case restored");
    assert.deepEqual(await stored(),complete,"Completed answers cannot be rewritten by reload");
    await dailyClick("Review case study");
    await wait(()=>devtools.evaluate("!!document.querySelector('#case-study-content fieldset') && document.querySelector('#case-study-content fieldset').disabled"),"completed review opened with locked answers");
    await devtools.evaluate("document.querySelector('article button:not([disabled])').click()");
    await wait(()=>devtools.evaluate("document.querySelector('article').textContent.includes('Decision Review')"),"quick scenario completion");
    assert.equal(await devtools.evaluate("JSON.parse(localStorage.getItem("+JSON.stringify(streakKey)+")).totalCompleted"),1,"Quick and deeper completion must not double-count the day");
    assert.equal(attempts,3,"Both negative and positive real UI attempts required");
    assert.equal(dataWrites,0,"No profile/trade/portfolio writes permitted, even to fixture");
    // Actual compiled admin chat: paused mode, escaped suggestions, explicit draft
    // transfer, forged authority rejection, and late response after lock.
    await loadDocument(origin+'/admin/ai');
    const adminClick=async text=>devtools.evaluate("(()=>{const e=[...document.querySelectorAll('button')].find(e=>e.textContent.trim()==="+JSON.stringify(text)+"&&!e.disabled);if(!e)throw Error('Admin button missing');e.click();return true})()");
    const adminInput=async(selector,value)=>devtools.evaluate("(()=>{const e=document.querySelector("+JSON.stringify(selector)+");if(!e)throw Error('Admin input missing');const proto=e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(e,"+JSON.stringify(value)+");e.dispatchEvent(new Event('input',{bubbles:true}));return true})()");
    const openChat=async()=>{await adminClick('Assistant pilot');await wait(()=>devtools.evaluate("document.body.textContent.includes('Admin assistant · pilot')"),'admin pilot tab');};
    const askChat=async()=>{await adminInput('textarea','Help me draft a mobile spacing improvement for the About page.');await wait(()=>devtools.evaluate("[...document.querySelectorAll('button')].some(e=>e.textContent.trim()==='Ask assistant'&&!e.disabled)"),'chat input accepted');await adminClick('Ask assistant');};
    await wait(()=>devtools.evaluate("!!document.querySelector('input[aria-label=\"Admin master key\"]')"),'admin key input');
    await adminInput('input[aria-label="Admin master key"]',ADMIN_FIXTURE_KEY);await adminClick('Unlock AI workspace');
    await wait(()=>devtools.evaluate("document.body.textContent.includes('Assistant pilot')"),'admin workspace unlocked');
    await adminClick('Stop repairs');
    await wait(()=>devtools.evaluate("document.body.textContent.includes('Sign in with the registered owner account')"),'signed-out repair control denial');
    assert.deepEqual(repairRequests,{status:0,stop:0},'No repair API call without a bearer session');
    await loadDocument(origin+'/auth');
    await wait(()=>devtools.evaluate("!!document.querySelector('button[type=submit]')&&!document.querySelector('button[type=submit]').disabled"),'owner fixture sign-in ready');
    await submit(EMAIL,PASSWORD);await wait(()=>approved===3,'owner fixture sign-in');
    await wait(()=>devtools.evaluate("location.pathname==='/trader/me'"),'owner fixture navigation');
    await loadDocument(origin+'/admin/ai');
    await wait(()=>devtools.evaluate("!!document.querySelector('input[aria-label=\"Admin master key\"]')"),'owner controls admin input');
    await adminInput('input[aria-label="Admin master key"]',ADMIN_FIXTURE_KEY);await adminClick('Unlock AI workspace');
    await wait(()=>devtools.evaluate("document.body.textContent.includes('Repair controls')"),'owner control panel');
    await adminClick('Check repair status');
    await wait(()=>devtools.evaluate("document.body.textContent.includes('A stop has not been confirmed')"),'paused controls not advertised as stopped');
    await adminClick('Stop repairs');
    await wait(()=>devtools.evaluate("document.body.textContent.includes('Stop confirmed by the server.')"),'durable stop acknowledgement');
    await adminClick('Check repair status');
    await wait(()=>devtools.evaluate("document.body.textContent.includes('A stop has not been confirmed')"),'forged repair authority rejected');
    await adminClick('Check repair status');await wait(()=>repairRequests.status===3,'delayed status request');
    await adminClick('Stop repairs');
    await wait(()=>devtools.evaluate("document.body.textContent.includes('Stop confirmed by the server.')"),'stop interrupts pending status');
    await sleep(650);
    assert.equal(await devtools.evaluate("document.body.textContent.includes('Repairs are stopped.')"),true,'Late stale status cannot overwrite a confirmed stop');
    await adminClick('Stop repairs');await wait(()=>repairRequests.stop===3,'pending owner stop');await adminClick('Lock');
    await wait(()=>devtools.evaluate("document.body.textContent.includes('Private admin access')"),'owner stop workspace locked');await sleep(650);
    assert.equal(await devtools.evaluate("document.body.textContent.includes('Stop confirmed by the server.')"),false,'Late stop cannot revive locked workspace');
    await adminInput('input[aria-label="Admin master key"]',ADMIN_FIXTURE_KEY);await adminClick('Unlock AI workspace');
    await wait(()=>devtools.evaluate("document.body.textContent.includes('Assistant pilot')"),'admin workspace reopened for chat');
    await adminClick('Check repair status');
    await wait(()=>devtools.evaluate("document.body.textContent.includes('Sign in with the registered owner account')"),'actual owner-session denial is actionable');
    await adminClick('Check repair status');
    await wait(()=>devtools.evaluate("document.body.textContent.includes('The administrator key could not be verified')"),'actual key denial is distinct from paused controls');
    console.log('ISOLATED_REPAIR_OWNER_BROWSER_PASS: signed-out denial, paused/unverified status, explicit durable stop, forged authority rejection, stop interrupts pending status and late-response lock isolation. Fixture only.');
    await openChat();await askChat();
    await wait(()=>devtools.evaluate("document.body.textContent.includes('Chat is unavailable, paused')"),'paused chat is visible');
    await askChat();await wait(()=>devtools.evaluate("document.body.textContent.includes('Unverified suggestion')"),'unverified reply rendered');
    assert.equal(await devtools.evaluate("window.__modelHtmlExecuted===true"),false,'Model HTML cannot execute');
    assert.equal(await devtools.evaluate("document.querySelectorAll('img[src=x]').length"),0,'Model reply must remain plain text');
    await adminClick('Use as request draft');
    await wait(()=>devtools.evaluate("document.querySelector('textarea')?.value==="+JSON.stringify(chatDraft)),'draft transferred only after owner click');
    await openChat();await askChat();
    await wait(()=>devtools.evaluate("document.body.textContent.includes('assistant response could not be validated')"),'forged merge authority rejected');
    await askChat();await wait(()=>adminChatRequests===4,'pending chat request');await adminClick('Lock');
    await wait(()=>devtools.evaluate("document.body.textContent.includes('Private admin access')"),'workspace locked');
    await sleep(650);
    assert.equal(await devtools.evaluate("document.body.textContent.includes('Unverified suggestion')"),false,'Late reply cannot revive locked workspace');
    assert.equal(await devtools.evaluate("Object.values(localStorage).some(x=>x.includes("+JSON.stringify(ADMIN_FIXTURE_KEY)+"))"),false,'Admin key cannot be persisted');
    assert.equal(adminChatRequests,4);assert.equal(dataWrites,0);
    console.log('ISOLATED_ADMIN_CHAT_BROWSER_PASS: paused pilot, literal model text, owner-click draft transfer, forged authority denial and late-response lock isolation; fixture only; no real provider calls.');
    // Actual compiled announcements must recover from valid JSON of the wrong
    // shape, retain revision markers across reload and avoid replay on focus.
    showPublications=true;
    const noticeKey='tradehq-seen-course-publications-v1';
    const noticeCount=()=>devtools.evaluate("document.querySelectorAll('button[aria-label^=\"Open new course: \"]').length");
    await devtools.evaluate('localStorage.setItem('+JSON.stringify(noticeKey)+',\'null\')');
    await loadDocument(origin+'/courses');
    await wait(async()=>await noticeCount()===1,'announcement recovered from null history');
    const seen=await devtools.evaluate('JSON.parse(localStorage.getItem('+JSON.stringify(noticeKey)+'))');
    assert.equal(seen[publications[0].slug+':'+publications[0].published_at],true);
    const beforeReload=publicationReads;await loadDocument();
    await wait(()=>publicationReads>beforeReload,'announcement publication read after reload');
    await sleep(250);assert.equal(await noticeCount(),0,'Seen publication cannot replay after reload');
    const beforeFocus=publicationReads;await devtools.evaluate("window.dispatchEvent(new Event('focus'))");
    await wait(()=>publicationReads>beforeFocus,'announcement recheck on focus');
    await sleep(250);assert.equal(await noticeCount(),0,'Seen publication cannot replay on focus');
    await devtools.evaluate('localStorage.setItem('+JSON.stringify(noticeKey)+',\'[]\')');
    await loadDocument();await wait(async()=>await noticeCount()===1,'announcement recovered from array history');
    assert.equal(dataWrites,0,'Unexpected fixture writes: '+rejectedWrites.join(', '));
    console.log('ISOLATED_COURSE_NOTICES_BROWSER_PASS: malformed null/array history recovered, seen revision persisted, reload/focus deduplicated; fixture only.');
    const progressKey='tradehq_course_progress_v1';
    const coursePath='/courses/options-trading-fundamentals';
    const savedLesson={status:'completed',score:4,completedAt:'2026-10-09T15:45:01Z'};
    const retainedTrack={lessons:{retained:savedLesson},badgeEarnedAt:'2026-10-09T15:46:01Z'};
    for(const tracks of [null,{'options-trading-fundamentals':{lessons:null},retained:retainedTrack},{'options-trading-fundamentals':{lessons:{invalid:null}},retained:retainedTrack}]){
      await devtools.evaluate('localStorage.setItem('+JSON.stringify(progressKey)+','+JSON.stringify(JSON.stringify({v:1,tracks,updatedAt:'2026-10-09T15:45:01Z'}))+')');
      await loadDocument(origin+coursePath);
      await wait(()=>devtools.evaluate("[...document.querySelectorAll('h1')].some(x=>x.textContent.includes('Options Trading Fundamentals'))"),'course renders despite malformed progress');
      const link=await devtools.evaluate("[...document.querySelectorAll('main a')].find(x=>x.getAttribute('href')?.startsWith('/courses/options-trading-fundamentals/'))?.getAttribute('href')");
      assert.ok(link,'Actual course lesson link missing');await loadDocument(origin+link);
      await wait(()=>devtools.evaluate("[...document.querySelectorAll('button')].some(x=>x.textContent.includes('Submit & complete lesson'))"),'lesson mounts and saves recovered progress');
      const after=await devtools.evaluate('JSON.parse(localStorage.getItem('+JSON.stringify(progressKey)+'))');
      assert.ok(Object.values(after.tracks['options-trading-fundamentals'].lessons).some(x=>x.status==='in-progress'));
      if(tracks)assert.deepEqual(after.tracks.retained,retainedTrack,'Valid unrelated completed lesson and badge must survive recovery save');
      await loadDocument();
      await wait(()=>devtools.evaluate("[...document.querySelectorAll('button')].some(x=>x.textContent.includes('Submit & complete lesson'))"),'recovered lesson survives reload');
    }
    assert.equal(dataWrites,0);
    console.log('ISOLATED_COURSE_PROGRESS_BROWSER_PASS: null tracks, null lessons and invalid lesson rows recovered; valid unrelated completion/badge retained after real lesson save and reload; fixture only.');
    console.log("ISOLATED_AUTH_BROWSER_PASS: reload persistence; real UI sign-out; no resurrected session; expired refresh rejected; ten Daily answers persisted/resumed/locked; one streak per day; actual built TradeHQ login in real Chromium; negative password refused; fake Supabase grant accepted; authenticated profile navigation observed; isolated account initialization executed; zero non-allowlisted backend writes; zero real provider calls.");
  }finally{
    holdLearnModule=false;releaseLearnModules.splice(0).forEach(release=>release());
    // Wait for Chrome to exit before deleting its still-active profile files.
    // Otherwise a successful browser assertion can randomly fail on ENOTEMPTY.
    devtools?.close();
    if(browser?.pid){
      // Chrome launches child renderers. Kill this dedicated process group,
      // not only the launcher, so no profile writers survive fixture teardown.
      const exited=browser.exitCode===null && browser.signalCode===null
        ? once(browser,"exit").catch(()=>undefined) : Promise.resolve();
      try{process.kill(-browser.pid,"SIGKILL");}
      catch(error){if(error.code!=="ESRCH")throw error;}
      await Promise.race([exited,sleep(2500)]);
    }
    if(server)await new Promise(resolve=>server.close(resolve));
    // Cleanup must finish, but transient Chrome profile locks may need retries.
    let cleaned=false;
    for(let attempt=0;attempt<12;attempt++){
      try{rmSync(temp,{recursive:true,force:true,maxRetries:2,retryDelay:150});cleaned=true;break;}
      catch(error){if(!["ENOTEMPTY","EBUSY","EPERM"].includes(error.code))throw error;await sleep(250);}
    }
    if(!cleaned)throw Error("Isolated Chrome profile cleanup did not finish");
  }
}
main().catch(e=>{console.error("Isolated auth-browser regression FAILED: "+String(e.message||e).slice(0,700));process.exitCode=1;});
