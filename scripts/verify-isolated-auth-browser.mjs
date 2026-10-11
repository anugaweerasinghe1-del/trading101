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
      if(x.exceptionDetails)throw Error("Browser JavaScript assertion failed");
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
  let server,browser,devtools;let attempts=0,approved=0,rejected=0,dataWrites=0,portfolioInitialized=0,logouts=0,refreshRejected=0,dailyReads=0;
  try{
    server=createServer((req,res)=>{
      const parsed=new URL(req.url||"/","http://localhost");
      const route=parsed.pathname;
      const json=(status,body)=>{
        res.writeHead(status,{"Content-Type":"application/json","Cache-Control":"no-store"});
        res.end(JSON.stringify(body));
      };
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
        dailyReads++;return json(200,null); // real authored fallback, never an AI call
      }
      if(route.startsWith("/rest/v1/")){
        if(!["GET","HEAD"].includes(req.method||"")){dataWrites++;return json(403,{error:"fixture_never_mutates"})}
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
      res.writeHead(200,{"Content-Type":MIME[extname(file)]||"application/octet-stream"});
      res.end(readFileSync(file));
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
    const port=await wait(()=>{
      const file=join(profile,"DevToolsActivePort");
      return existsSync(file)?readFileSync(file,"utf8").split("\n")[0]:null;
    },"Chrome debugging port");
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
    await devtools.send("Page.navigate",{url:origin+"/auth"});
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
    await submit(EMAIL,PASSWORD);
    await wait(()=>approved===1,"positive Supabase fixture login");
    await wait(()=>devtools.evaluate("location.pathname==='/trader/me'"),"authenticated profile redirect");
    await wait(()=>portfolioInitialized>=1,"isolated account portfolio initialization");
    // Reload verifies a real persisted SDK session, with no second login grant.
    await devtools.send("Page.reload",{ignoreCache:true});
    await wait(()=>devtools.evaluate("!!document.querySelector('[aria-label=\"Account menu\"]')"),"session restored after reload");
    assert.equal(approved,1,"Reload must restore the session without another password grant");
    // Exercise the real account menu and Supabase local sign-out request.
    await devtools.evaluate("(()=>{const e=document.querySelector('[aria-label=\"Account menu\"]');e.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0,ctrlKey:false}));return true;})()");
    await wait(()=>devtools.evaluate("[...document.querySelectorAll('[role=menuitem]')].some(e=>e.textContent.trim()==='Sign out')"),"account sign-out menu");
    await devtools.evaluate("[...document.querySelectorAll('[role=menuitem]')].find(e=>e.textContent.trim()==='Sign out').click()");
    await wait(()=>logouts===1,"fixture backend sign-out");
    await wait(()=>devtools.evaluate("!document.querySelector('[aria-label=\"Account menu\"]')"),"signed-out UI");
    await devtools.send("Page.reload",{ignoreCache:true});
    await wait(()=>devtools.evaluate("!!document.querySelector('a[href=\"/auth\"]') && !document.querySelector('[aria-label=\"Account menu\"]')"),"no session resurrection after reload");
    // Find the actual configured SDK key; seed an expired test session and
    // prove its rejected refresh returns to the signed-out interface.
    await devtools.send("Page.navigate",{url:origin+"/auth"});
    await wait(()=>devtools.evaluate("!!document.querySelector('input[type=email]')"),"auth form for refresh test");
    await submit(EMAIL,PASSWORD);
    await wait(()=>approved===2,"second independent fixture login");
    await wait(()=>devtools.evaluate("location.pathname==='/trader/me'"),"second profile navigation");
    const authKey=await devtools.evaluate("Object.keys(localStorage).find(k=>k.startsWith('sb-')&&k.endsWith('-auth-token'))");
    assert.ok(authKey,"SDK persisted auth storage key missing");
    await devtools.evaluate("(()=>{const k="+JSON.stringify(authKey)+";const s=JSON.parse(localStorage.getItem(k));s.expires_at=1;localStorage.setItem(k,JSON.stringify(s));})()");
    await devtools.send("Page.reload",{ignoreCache:true});
    await wait(()=>refreshRejected>=1,"rejected expired refresh token");
    await wait(()=>devtools.evaluate("!document.querySelector('[aria-label=\"Account menu\"]') && !!document.querySelector('a[href=\"/auth\"]')"),"expired session signed out");
    assert.equal(await devtools.evaluate("localStorage.getItem("+JSON.stringify(authKey)+")"),null,"Rejected refresh must clear persisted credentials");

    // Daily Practice: actual built UI writes an answer snapshot, resumes after
    // reload, completes ten questions and preserves one calendar-day streak.
    await devtools.send("Page.navigate",{url:origin+"/daily"});
    const dailyReady=()=>devtools.evaluate("!!document.querySelector('#deeper-practice') && [...document.querySelectorAll('#deeper-practice button')].some(e=>e.textContent.includes('Start case study'))");
    await wait(dailyReady,"Daily case study");
    await wait(()=>dailyReads>=1,"read-only Daily bank request");
    const dailyClick=async text=>{
      const expression="(()=>{const e=[...document.querySelectorAll('#deeper-practice button')].find(e=>e.textContent.trim()==="+JSON.stringify(text)+"&&!e.disabled);if(!e)throw Error('Daily button missing');e.click();return true;})()";
      return devtools.evaluate(expression);
    };
    const stored=()=>devtools.evaluate("JSON.parse(localStorage.getItem('tradehq:deeper-practice:v1')||'[]')[0]");
    await dailyClick("Start case study");
    for(let i=0;i<10;i++){
      await wait(()=>devtools.evaluate("document.querySelector('#case-study-content fieldset legend') && document.querySelector('#case-study-content').textContent.includes('Question "+(i+1)+" of 10')"),"Daily question "+(i+1));
      await devtools.evaluate("document.querySelector('#case-study-content input[type=radio]').click()");
      await wait(()=>devtools.evaluate("[...document.querySelectorAll('#deeper-practice button')].some(e=>e.textContent.trim()==='Check answer'&&!e.disabled)"),"answer selection");
      await dailyClick("Check answer");
      await wait(async()=>((await stored())?.answers.length===i+1),"persisted Daily answer "+(i+1));
      if(i===0){
        const before=await stored();
        await devtools.send("Page.reload",{ignoreCache:true});
        await wait(()=>devtools.evaluate("[...document.querySelectorAll('#deeper-practice button')].some(e=>e.textContent.includes('Continue case study'))"),"saved Daily resume control");
        assert.deepEqual(await stored(),before,"Reload must preserve the exact exercise and original answer");
        await dailyClick("Continue case study"); // UI selects the first unanswered question
      }else if(i<9){await dailyClick("Next question");}
    }
    await wait(()=>devtools.evaluate("document.querySelector('#deeper-practice').textContent.includes('Case complete')"),"completed case score");
    const complete=await stored();assert.equal(complete.answers.length,10);assert.ok(complete.answers.every(a=>a===0));
    const streakKey=await devtools.evaluate("Object.keys(localStorage).find(k=>{try{const v=JSON.parse(localStorage.getItem(k));return v && v.totalCompleted===1 && Array.isArray(v.history)}catch{return false}})");
    assert.ok(streakKey,"Daily completion must persist one streak entry");
    await devtools.send("Page.reload",{ignoreCache:true});
    await wait(()=>devtools.evaluate("[...document.querySelectorAll('#deeper-practice button')].some(e=>e.textContent.includes('Review case study'))"),"completed case restored");
    assert.deepEqual(await stored(),complete,"Completed answers cannot be rewritten by reload");
    await dailyClick("Review case study");
    assert.equal(await devtools.evaluate("document.querySelector('#case-study-content fieldset').disabled"),true,"Reviewed answers must be locked");
    await devtools.evaluate("document.querySelector('article button:not([disabled])').click()");
    await wait(()=>devtools.evaluate("document.querySelector('article').textContent.includes('Decision Review')"),"quick scenario completion");
    assert.equal(await devtools.evaluate("JSON.parse(localStorage.getItem("+JSON.stringify(streakKey)+")).totalCompleted"),1,"Quick and deeper completion must not double-count the day");
    assert.equal(attempts,3,"Both negative and positive real UI attempts required");
    assert.equal(dataWrites,0,"No profile/trade/portfolio writes permitted, even to fixture");
    console.log("ISOLATED_AUTH_BROWSER_PASS: reload persistence; real UI sign-out; no resurrected session; expired refresh rejected; ten Daily answers persisted/resumed/locked; one streak per day; actual built TradeHQ login in real Chromium; negative password refused; fake Supabase grant accepted; authenticated profile navigation observed; isolated account initialization executed; zero non-allowlisted backend writes; zero real provider calls.");
  }finally{
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
