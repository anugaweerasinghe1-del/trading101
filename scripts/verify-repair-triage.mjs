import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { readFailures, collectIssuePages, previousState, nextState, severity } from "./agent-repair-triage.mjs";
const cases = [
  { number: 75, title: "[TradeHQ Agent] Daily route report", state: "open", user: { login: "github-actions[bot]" }, body: "**GitHub run ID:** 100\n**Failed URLs:** 1\n\n### Failed checks\n- /auth: HTTP 500" },
  { number: 74, title: "[TradeHQ Agent] Browser smoke report", state: "open", user: { login: "github-actions[bot]" }, body: "**GitHub run ID:** 100\n**Potential failures:** 1\n\n### Flagged routes\n- `/learn`: Rendered root has very little visible content (0 chars)" },
  { number: 71, title: "[TradeHQ Agent] Website route failures", state: "open", user: { login: "github-actions[bot]" }, body: "Public route monitoring at 2026-10-10.\n\n- /auth: HTTP 500" },
  { number: 70, title: "[TradeHQ Agent] Browser smoke failures", state: "open", user: { login: "github-actions[bot]" }, body: "### Flagged routes\n- \`/learn\`: Rendered root has very little visible content (0 chars)" },
];
const { records, routeCount, browserCount } = readFailures(cases, "100");
assert.equal(records.length, 2);
assert.equal(routeCount, 1);
assert.equal(browserCount, 1);
assert.ok(records[0].key.startsWith("route:/auth:") && records[1].key.startsWith("browser:/learn:"));
assert.equal(severity(records[0]), "HIGH");
assert.equal(severity(records[1]), "HIGH");
const first = nextState({runId:"",streaks:{}}, records, "100");
assert.equal(first.streaks[records[0].key], 1);
const rerun = nextState(first, records, "100");
assert.deepEqual(rerun, first, "Rerun must not count as independent evidence");
const next = nextState(first, records, "101");
assert.equal(next.streaks[records[0].key], 2);
assert.throws(()=>nextState(next,records,'100'),/Older monitoring run/);
assert.throws(()=>nextState(next,[],'100'),/Older monitoring run/);
assert.throws(()=>nextState(next,records,'invalid'),/run identity/);
assert.deepEqual(nextState(next, [], "102").streaks, {});
assert.deepEqual(previousState("No past metadata."), {runId:"",streaks:{}});
assert.deepEqual(previousState("<!-- tradehq-triage-state-v1 "+JSON.stringify(next)+" -->"), next);
assert.throws(()=>readFailures(cases,"101"),/Fresh reports/);
assert.throws(()=>readFailures(cases.filter(x=>x.number!==74),"100"),/Fresh reports/);
assert.throws(()=>readFailures([{...cases[0],user:{login:"untrusted-reporter"}},...cases.slice(1)],"100"),/Fresh reports/);
assert.equal(readFailures(cases.filter(x=>x.number!==71),"100").records.length,2,"Primary exact-run findings do not depend on stale secondary issues");
assert.throws(()=>readFailures([{...cases[0],body:cases[0].body.replace('HTTP 500','')},...cases.slice(1)],'100'),/Incomplete/);
assert.throws(()=>readFailures([cases[0],...cases],'100'),/unambiguous/);
assert.throws(()=>readFailures([{...cases[0],body:cases[0].body+'\n**Failed URLs:** 0'},...cases.slice(1)],'100'),/totals missing/);
assert.throws(()=>readFailures([{...cases[0],body:cases[0].body+'\n**GitHub run ID:** 100'},...cases.slice(1)],'100'),/Fresh reports/);
const changed=readFailures([{...cases[0],body:cases[0].body.replace('HTTP 500','HTTP 429')},...cases.slice(1)],'100');
assert.equal(nextState(first,changed.records,'101').streaks[changed.records[0].key],1,"Changed symptom must not inherit recurrence");
assert.throws(()=>readFailures([{...cases[0],body:cases[0].body.replace('Failed URLs:** 1','Failed URLs:** 31')},...cases.slice(1)],'100'),/truncated/);
const page=Array.from({length:100},(_,i)=>({id:i+1}));let calls=0;
assert.equal((await collectIssuePages('all',async()=>++calls===1?page:[{id:101}])).length,101);
assert.equal(calls,2);
await assert.rejects(collectIssuePages('all',async()=>page),/pagination/);
await assert.rejects(collectIssuePages('all',async()=>({})),/Invalid issue page/);
await assert.rejects(collectIssuePages('all',async path=>page.map(x=>({id:x.id+Number(path.match(/page=(\d+)$/)[1])*100}))),/Incomplete issue history/);
const empty = cases.slice(0,2).map(x=>({...x,body:x.body.split("\n\n")[0].replace(/:\*\* 1$/,":** 0")}));
assert.equal(readFailures(empty,"100").records.length,0);
const script = readFileSync("scripts/agent-repair-triage.mjs","utf8");
const workflow = readFileSync(".github/workflows/tradehq-agents.yml","utf8");
for(const p of ["scripts/agent-monitor.mjs","scripts/agent-browser-smoke.mjs"]){
  assert.match(readFileSync(p,"utf8"),/GitHub run ID:/);
}
assert.match(workflow,/needs: \[scan, browser\]/);
assert.match(workflow,/agent-repair-triage\.mjs/);
assert.match(workflow,/always\(\)/);
assert.match(script,/No AI patch, branch, PR, automatic merge/);
assert.doesNotMatch(script,/\/git\/refs|\/pulls|\/contents\/|GEMINI_API_KEY|SUPABASE_SERVICE_ROLE/);
assert.doesNotMatch(workflow,/gh pr merge|pull_request_target/);
console.log("Public failure recurrence, fresh-run evidence, restricted categories, human review and issue-only controls passed.");

// Offline Stage 2 review tests run in the existing credential-free CI check.
await import("./verify-repair-review.mjs");
await import("./agent-repair-control-prototype.test.mjs");

await import("./verify-repair-control-postgres-guard.test.mjs");
