import { uniqueRoutes } from "./routes.ts";
import { emitMonitorAttestation } from "./monitor-attestation.mjs";
const origin="https://www.thetradehq.com";
const repository=process.env.GITHUB_REPOSITORY||"anugaweerasinghe1-del/trading101";
const token=process.env.GITHUB_TOKEN;
const paths=["/","/trade","/markets","/portfolio","/courses","/daily","/leaderboard","/reviews","/auth","/contact","/learn","/wiki","/admin","/admin/ai","/robots.txt","/ads.txt"];
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function page(url){
 const controller=new AbortController(), timer=setTimeout(()=>controller.abort(),12000);
 try{return await fetch(url,{signal:controller.signal,redirect:"follow",headers:{"user-agent":"TradeHQ-public-monitor/1.0"}});}
 finally{clearTimeout(timer);}
}
async function api(method,path,body){
 if(!token)throw Error("GITHUB_TOKEN missing");
 const r=await fetch("https://api.github.com/repos/"+repository+path,{method,headers:{authorization:"Bearer "+token,accept:"application/vnd.github+json","x-github-api-version":"2022-11-28","content-type":"application/json"},body:body?JSON.stringify(body):undefined});
 if(!r.ok)throw Error("GitHub issue report failed: "+r.status);
 return r.json();
}
async function check(url){
 for(let trial=0;trial<2;trial++){
  try{const r=await page(url);if(r.ok){const kind=r.headers.get("content-type")||"";if(kind.includes("text/html")&&!/<title[\s>]/i.test(await r.text()))return {url,issue:"No HTML title"};return null;}
   if(trial===1)return {url,issue:"HTTP "+r.status};
  }catch{if(trial===1)return {url,issue:"Request timed out or failed"};}
  await sleep(1500);
 }
}
async function main(){
 const started=new Date().toISOString();
 const sitemap=await page(origin+"/sitemap.xml");
 if(!sitemap.ok)throw Error("Sitemap HTTP "+sitemap.status);
 const xml=await sitemap.text();
 const extra=[...xml.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/g)].map(m=>m[1].replaceAll("&amp;","&"));
 if(extra.length<10)throw Error("No meaningful sitemap entries");
 const urls=[...new Set([...paths.map(p=>origin+p),...uniqueRoutes().map(r=>origin+r.path),...extra])].filter(u=>{try{const x=new URL(u);return x.protocol==="https:"&&["www.thetradehq.com","thetradehq.com"].includes(x.hostname)}catch{return false}}).slice(0,400);
 let next=0;const failures=[];
 await Promise.all(Array.from({length:5},async()=>{while(next<urls.length){const u=urls[next++],failure=await check(u);if(failure)failures.push(failure);}}));
 console.log("Scanned "+urls.length+" public URLs; issues: "+failures.length);
 // Check the actual public JavaScript bundle so healthy SPA fallback responses aren't enough.
 try {
  const html=await (await page(origin+"/")).text();
  const scripts=[...html.matchAll(/<script[^>]*\bsrc=["']([^"']+)["']/gi)].map(x=>x[1]).filter(x=>x.startsWith("/assets/")).slice(0,2);
  for(const src of scripts){const failing=await check(origin+src);if(failing)failures.push({...failing,issue:"Production JS bundle: "+failing.issue});}
 } catch { failures.push({url:origin+"/",issue:"Could not inspect public JS bundle."}); }
 const title="[TradeHQ Agent] Website route failures";
 const issues=await api("GET","/issues?state=open&per_page=100");
 const existing=issues.find(item=>!item.pull_request&&item.title===title);
 if(failures.length){
  const lines=failures.slice(0,30).map(f=>"- "+new URL(f.url).pathname+": "+f.issue).join("\n");
  const body="Public route monitoring at "+new Date().toISOString()+". Checked "+urls.length+" URLs; "+failures.length+" failed after retry.\n\n"+lines+"\n\nRead-only checks only. Confirm manually; open a reviewed PR for fixes. No credentials or private data were accessed.";
  if(existing)await api("PATCH","/issues/"+existing.number,{body});
  else await api("POST","/issues",{title,body});
  process.exitCode=1;
 }else if(existing)await api("PATCH","/issues/"+existing.number,{state:"closed",state_reason:"completed"});
 const reportTitle="[TradeHQ Agent] Daily route report";
 const report=[
   "## Public route and asset monitoring",
   "**Checked at (UTC):** "+started, "**GitHub run ID:** "+(process.env.GITHUB_RUN_ID||"unavailable"), "**URLs checked:** "+urls.length,
   "**Failed URLs:** "+failures.length, "**JavaScript bundle:** checked when exposed by the page HTML",
   "Coverage: public route HTTP status and HTML title, sitemap, robots.txt, ads.txt and production bundle HTTP status.",
   "Does NOT prove private login, price API quality or browser interactions.",
   failures.length?"### Failed checks\n"+failures.slice(0,30).map(f=>"- "+new URL(f.url).pathname+": "+f.issue).join("\n"):"All sampled HTTP routes returned healthy statuses; this does not prove application behavior.",
   "No production edits, secrets or personal data."
 ].join("\n\n");
 const previous=issues.find(item=>!item.pull_request&&item.title===reportTitle);
 const persisted=previous?await api("PATCH","/issues/"+previous.number,{body:report}):
   await api("POST","/issues",{title:reportTitle,body:report});
 emitMonitorAttestation("route",report,persisted);
}
main().catch(e=>{console.error(e.message);process.exitCode=1});
