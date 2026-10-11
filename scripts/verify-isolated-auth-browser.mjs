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
  let server,browser,devtools;let attempts=0,approved=0,rejected=0,dataWrites=0;
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
      if(route==="/auth/v1/user")
        return req.headers.authorization==="Bearer "+JWT?json(200,USER):json(401,{error:"invalid_token"});
      if(route.startsWith("/auth/v1/"))return json(403,{error:"blocked_fixture_auth"});
      if(route==="/rest/v1/rpc/initialize_practice_portfolio" && req.method==="POST")
        return json(200,{trades:[],cash:100000,ranked:false,cycle_id:"fixture",
          updated_at:new Date().toISOString(),positions:[]});
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
      "--user-data-dir="+profile,"about:blank"],{stdio:"ignore"});
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
    assert.equal(attempts,2,"Both negative and positive real UI attempts required");
    assert.equal(dataWrites,0,"No profile/trade/portfolio writes permitted, even to fixture");
    console.log("ISOLATED_AUTH_BROWSER_PASS: actual built TradeHQ login in real Chromium; negative password refused; fake Supabase grant accepted; authenticated profile navigation observed; zero non-allowlisted backend writes; zero real provider calls.");
  }finally{
    devtools?.close();browser?.kill("SIGKILL");
    if(server)await new Promise(resolve=>server.close(resolve));
    rmSync(temp,{recursive:true,force:true,maxRetries:2});
  }
}
main().catch(e=>{console.error("Isolated auth-browser regression FAILED: "+String(e.message||e).slice(0,700));process.exitCode=1;});
