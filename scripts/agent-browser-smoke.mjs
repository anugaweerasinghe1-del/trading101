/**
 * Read-only Chrome smoke tests: renders important PUBLIC TradeHQ routes in a real browser.
 * Does not log in, submit forms, place trades, or touch private data.
 * Chrome is preinstalled on GitHub hosted Ubuntu runners. No new npm deps.
 * This is not a replacement for authenticated regression tests.
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { emitMonitorAttestation } from "./monitor-attestation.mjs";
const origin = process.env.TRADEHQ_SCAN_ORIGIN || "https://www.thetradehq.com";
const repo = process.env.GITHUB_REPOSITORY || "anugaweerasinghe1-del/trading101";
const token = process.env.GITHUB_TOKEN;
const routes = ["/", "/trade", "/markets", "/courses", "/daily", "/leaderboard", "/reviews", "/auth", "/contact", "/admin", "/admin/ai", "/learn"];
const title = "[TradeHQ Agent] Browser smoke report";
const failuresTitle = "[TradeHQ Agent] Browser smoke failures";
export function assessBrowserHtml(path, html) {
  if(!html || !/<html[\s>]/i.test(html)) return "Chrome did not return HTML.";
  // Pages contain prerendered content: a real Chrome pass must still locate the hydrated root.
  const root = html.match(/<div[^>]*\bid=["']root["'][^>]*>([\s\S]*?)<\/body>/i);
  if(!root) return "React root element was not found.";
  const text = root[1].replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi," ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi," ")
    .replace(/<[^>]+>/g," ").replace(/&[a-z]+;/g," ").replace(/\s+/g," ").trim();
  if(text.length<60) return "Rendered root has very little visible content ("+text.length+" chars); possible blank screen.";
  if(/Unexpected Application Error|Application error: a client-side exception|API returned 429/i.test(text)) return "An application/API error is visibly displayed.";
  if(path==="/admin"&&!/admin|administrator/i.test(text)) return "Admin landing did not render expected content.";
  if(path==="/admin/ai"&&!/AI development desk|AI workspace/i.test(text)) return "AI admin desk did not render expected content.";
  if(path==="/daily"&&!/daily/i.test(text)) return "Daily practice page did not render expected content.";
  return null;
}
function commandExists(command) {
  const result = spawnSync("which", [command], {encoding:"utf8", timeout:2500});
  return result.status===0;
}
async function github(method, endpoint, body){
  if(!token) throw Error("GITHUB_TOKEN is missing.");
  const r=await fetch("https://api.github.com/repos/"+repo+endpoint,{
    method,headers:{authorization:"Bearer "+token,accept:"application/vnd.github+json","x-github-api-version":"2022-11-28","content-type":"application/json"},
    body:body===undefined?undefined:JSON.stringify(body),
  });
  if(!r.ok) throw Error("GitHub issue reporting failed HTTP "+r.status);
  return r.json();
}
async function upsert(issues, heading, body){
  const found=issues.find(x=>!x.pull_request&&x.title===heading);
  if(found) return github("PATCH","/issues/"+found.number,{body});
  return github("POST","/issues",{title:heading,body});
}
export async function main() {
  const chrome=["google-chrome","google-chrome-stable","chromium","chromium-browser"].find(commandExists);
  if(!chrome) throw Error("Chrome is not available on this runner. Browser smoke coverage could not be verified.");
  const failures=[];
  const started=new Date().toISOString();
  for(const route of routes){
    const dir=mkdtempSync(join(tmpdir(),"tradehq-browser-"));
    try {
      const url=new URL(route,origin).toString();
      const result=spawnSync(chrome,[
        "--headless=new","--no-sandbox","--disable-gpu","--disable-dev-shm-usage",
        "--disable-background-networking","--disable-extensions","--no-first-run",
        "--hide-scrollbars","--virtual-time-budget=6500",
        "--window-size=1280,900","--user-data-dir="+dir,"--dump-dom",url,
      ],{encoding:"utf8",timeout:30000,maxBuffer:8*1024*1024});
      const failure=result.error?.message || (result.status!==0?"Chrome exit "+result.status:assessBrowserHtml(route,result.stdout));
      if(failure) failures.push({route,reason:failure.slice(0,150)});
    }finally { if(existsSync(dir)) rmSync(dir,{recursive:true,force:true}); }
  }
  const issues=await github("GET","/issues?state=open&per_page=100");
  const body=[
    "## Public browser-smoke checks", "**Checked at (UTC):** "+started, "**GitHub run ID:** "+(process.env.GITHUB_RUN_ID||"unavailable"),
    "**Checked routes:** "+routes.length, "**Potential failures:** "+failures.length,
    "**Browser:** "+chrome,
    "Checks real browser rendering for public pages, visible error banners, and locked admin landing pages.",
    "Does NOT authenticate, submit forms, test trading, or prove every feature works.",
    failures.length?"### Flagged routes\n"+failures.map(x=>"- \`"+x.route+"\`: "+x.reason).join("\n"):"No potential rendering failures on these sampled public routes.",
    "\nRead-only; nothing changed on production. Public report; no personal data or credentials.",
  ].join("\n\n");
  const persisted = await upsert(issues,title,body);
  const old=issues.find(x=>!x.pull_request&&x.title===failuresTitle);
  if(failures.length){
    await upsert(issues,failuresTitle,body);
    console.error(failures.length+" public browser smoke check(s) need review.");
    process.exitCode=1;
  }else if(old){
    await github("PATCH","/issues/"+old.number,{state:"closed",state_reason:"completed"});
  }
  console.log("Chrome public pages checked: "+routes.length+"; findings: "+failures.length);
  emitMonitorAttestation("browser",body,persisted);
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1])){
  main().catch(e=>{console.error(e.message);process.exitCode=1;});
}
