/**
 * TradeHQ recurrence tracker: read-only analysis of two finished monitor reports.
 * Writes ONE bounded GitHub review issue, NEVER repository code or AI requests.
 * Reports must come from this exact GitHub Actions run; stale reports fail closed.
 */
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { createHash } from "node:crypto";

const TITLE = "[TradeHQ Repair Candidate] Repeated public check failures";
const MARKER = "tradehq-triage-state-v1";
const routeTitle = "[TradeHQ Agent] Daily route report";
const browserTitle = "[TradeHQ Agent] Browser smoke report";
const repo = process.env.GITHUB_REPOSITORY || "anugaweerasinghe1-del/trading101";
const token = process.env.GITHUB_TOKEN;
const runId = String(process.env.GITHUB_RUN_ID || "");

function extractRunId(body) {
  const lines=String(body||"").split("\n").filter(x=>x.startsWith("**GitHub run ID:**"));
  return lines.length===1 ? lines[0].match(/^\*\*GitHub run ID:\*\* ([1-9][0-9]*)$/)?.[1]||"" : "";
}
function count(body, label) {
  const lines = String(body || "").split("\n").filter(x => x.startsWith("**" + label + ":**"));
  if (lines.length!==1 || !/^(0|[1-9][0-9]*)$/.test(lines[0].split(":** ")[1]||"")) return null;
  const line=lines[0];
  const n = Number(line.split(":** ")[1]);
  return Number.isSafeInteger(n) && n >= 0 ? n : null;
}
export function readFailures(issues, currentRun) {
  if (!/^[1-9][0-9]*$/.test(currentRun) || !Array.isArray(issues)) throw Error("Missing GitHub Actions run ID or complete issues.");
  const find = title => {
    const matches=issues.filter(x => !x.pull_request && x.title===title && x.state==="open" && x.user?.login==="github-actions[bot]");
    if(matches.length!==1)throw Error("Fresh reports from BOTH independent monitors must be unambiguous.");
    return matches[0];
  };
  const routes=find(routeTitle),browser=find(browserTitle);
  if(extractRunId(routes.body)!==currentRun||extractRunId(browser.body)!==currentRun)
    throw Error("Fresh reports from BOTH independent monitors are missing.");
  const routeCount=count(routes.body,"Failed URLs"),browserCount=count(browser.body,"Potential failures");
  if(routeCount===null||browserCount===null)throw Error("Monitor totals missing; no candidate issued.");
  // Use findings inside the exact-run primary reports. An older failure issue
  // is no longer accepted as a substitute for current observations.
  const records=[];
  for(const [source,report,total,pattern,limit] of [
    ["route",routes,routeCount,/^- (\/[^\s:]*): ([^\r\n]+)$/gm,30],
    ["browser",browser,browserCount,/^- `([^`\s]+)`: ([^\r\n]+)$/gm,12],
  ]){
    const findings=[...String(report.body||"").matchAll(pattern)];
    if(total>limit||findings.length!==total)throw Error("Incomplete or truncated exact-run failure evidence; owner investigation required.");
    const seen=new Set();
    for(const match of findings){
      const path=match[1],reason=match[2];
      if(!path.startsWith("/")||path.length>250||/[<>\x00-\x1f]/.test(path+reason)||reason.length>300||seen.has(path))
        throw Error("Duplicate or malformed exact-run findings.");
      seen.add(path);
      // Changing symptom on the same path resets recurrence; reruns never add it.
      const fingerprint=createHash("sha256").update(JSON.stringify([source,path,reason])).digest("hex").slice(0,16);
      records.push({key:source+":"+path+":"+fingerprint,path,reason,source});
    }
  }
  return {records,routeCount,browserCount};
}
export async function collectIssuePages(state,read){
  if(!["open","all"].includes(state)||typeof read!=="function")throw Error("Invalid bounded issue reader");
  const rows=[],seen=new Set();
  for(let page=1;page<=4;page++){
    const items=await read("/issues?state="+state+"&per_page=100&page="+page);
    if(!Array.isArray(items)||items.length>100)throw Error("Invalid issue page");
    for(const item of items){
      if(!Number.isSafeInteger(item.id)||seen.has(item.id))throw Error("Ambiguous or changing issue pagination");
      seen.add(item.id);rows.push(item);
    }
    if(items.length<100)return rows;
  }
  throw Error("Incomplete issue history; bounded triage stopped without writes");
}
export function severity(item) {
  // A high priority for owner inspection never authorizes edits to financial/auth paths.
  if (/^\/(auth|reset-password|admin|trade|portfolio|markets)(\/|$)/.test(item.path) ||
      /HTTP 5\d\d|Production JS bundle|blank screen|very little visible content/i.test(item.reason)) return "HIGH";
  if (/No HTML title|HTTP 4\d\d/.test(item.reason)) return "MEDIUM";
  return "REVIEW";
}
export function previousState(body) {
  const match = String(body || "").match(/<!-- tradehq-triage-state-v1 ([^\n]+) -->/);
  if (!match) return { runId: "", streaks: {} };
  try {
    const obj = JSON.parse(match[1]);
    if (!obj || typeof obj.runId !== "string" || !obj.streaks || typeof obj.streaks !== "object") throw Error("bad shape");
    return { runId: obj.runId, streaks: obj.streaks };
  } catch { return { runId: "", streaks: {} }; }
}
export function nextState(prior, findings, currentRun) {
  if(!/^[1-9][0-9]*$/.test(currentRun)||!Number.isSafeInteger(Number(currentRun))
    ||(prior.runId&&(!/^[1-9][0-9]*$/.test(prior.runId)||!Number.isSafeInteger(Number(prior.runId)))))
    throw Error("Invalid recurrence run identity");
  // A historical rerun must not increment a newer run's stored streak or clear
  // its candidate. Ordered GitHub run IDs keep this bounded state fail-closed.
  if(prior.runId&&Number(currentRun)<Number(prior.runId))
    throw Error("Older monitoring run cannot replay recurrence");
  if (prior.runId === currentRun) return prior; // rerunning a job is NOT another independent observation
  const streaks = {};
  for (const item of findings) {
    const prev = Number(prior.streaks[item.key] || 0);
    streaks[item.key] = Math.min(Number.isInteger(prev) && prev >= 0 ? prev + 1 : 1, 99);
  }
  return { runId: currentRun, streaks };
}
async function github(method, endpoint, body) {
  if (!token) throw Error("GITHUB_TOKEN not configured.");
  const r = await fetch("https://api.github.com/repos/" + repo + endpoint, {
    method, headers: { Authorization: "Bearer " + token, Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28", "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!r.ok) throw Error("GitHub issue reporting HTTP " + r.status + " on " + method + " " + endpoint);
  return r.json();
}
async function main() {
  const open = await collectIssuePages("open",path=>github("GET",path));
  const { records, routeCount, browserCount } = readFailures(open, runId);
  const all = await collectIssuePages("all",path=>github("GET",path));
  const existing = all.find(x => !x.pull_request && x.title === TITLE && x.user?.login === "github-actions[bot]");
  const state = nextState(previousState(existing?.body), records, runId);
  console.log("TRADEHQ_RECURRENCE_WITNESS_V1 "+JSON.stringify({runId,
    reportDigests:open.filter(x=>[routeTitle,browserTitle].includes(x.title)).map(x=>({id:x.id,sha256:createHash("sha256").update(x.body).digest("hex")})),
    findings:records.length,repeated:records.filter(x=>state.streaks[x.key]>=2).length,
    stateDigest:createHash("sha256").update(JSON.stringify(state)).digest("hex"),
    authorization:{sourceWrites:false,modelCalls:false,merge:false,productionRelease:false}}));
  if (!records.length) {
    if (existing?.state === "open") {
      await github("PATCH", "/issues/" + existing.number, {
        body: "No current route/browser findings in run " + runId + ". Prior candidate cleared; no code was changed.\n\n<!-- " +
          MARKER + " " + JSON.stringify({ runId, streaks: {} }) + " -->",
        state: "closed", state_reason: "completed",
      });
    }
    console.log("No current public failures; no new repair candidate.");
    return;
  }
  const max = 12;
  const lines = records.slice(0, max).map(item => {
    const consecutive = state.streaks[item.key] || 1;
    const label = consecutive >= 2 ? "REPRODUCED ACROSS RUNS" : "First observation";
    return "- **" + severity(item) + " · " + label + " (" + consecutive +
      ")** " + item.source + " " + item.path + ": " + item.reason.replace(/[<>\r]/g, "") ;
  });
  const body = [
    "## Public monitor recurrence tracker (review only)",
    "**Run ID:** " + runId,
    "**Route failures:** " + routeCount + " · **Browser failures:** " + browserCount,
    "**Reproduced candidates:** " + records.filter(x => state.streaks[x.key] >= 2).length,
    "This issue is based only on public HTTP/browser samples. A repeated symptom does NOT establish root cause.",
    "### Observations", lines.join("\n"),
    records.length > max ? "Additional entries omitted; review source monitor issues." : "",
    "Evidence: #" + open.find(x => x.title === routeTitle).number + " (route report), #" +
      open.find(x => x.title === browserTitle).number + " (browser report).",
    "### Guardrails",
    "No AI patch, branch, PR, automatic merge, trade, private-data access, authentication, backend or DNS edits were performed.",
    "A human must reproduce, establish cause and create a NEW owner-authored [TradeHQ Code Request] for allowed low-risk TSX edits.",
    "Sensitive/auth/portfolio/market-data repairs require separate manual engineering approval. Avoid retrying unclear problems.",
    "<!-- " + MARKER + " " + JSON.stringify(state) + " -->",
  ].filter(Boolean).join("\n\n").slice(0, 12000);
  if (existing) {
    await github("PATCH", "/issues/" + existing.number, { body, state: "open" });
    console.log("Updated existing recurrence issue #" + existing.number + "; no code changed.");
  } else {
    await github("POST", "/issues", { title: TITLE, body });
    console.log("Opened one owner-review recurrence issue; no code changed.");
  }
}
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().catch(e => { console.error("Repair triage stopped safely:", e.message); process.exitCode = 1; });
}
