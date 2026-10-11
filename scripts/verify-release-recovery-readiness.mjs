import assert from "node:assert/strict";
import { verifyReleaseWitness, checkPublicRoute } from "./agent-release-recovery-readiness.mjs";
const MAIN="a".repeat(40), PRIOR="b".repeat(40);
const UUID="6830d3c4-5e05-4bea-a46d-4941dc0d11ab";
const OLD="21ea7e49-4ee5-44b7-85d0-1dd4f3bd9077";
const required=["TradeHQ Phase 3 tests","TradeHQ Cloudflare compatibility / Cloudflare build and SEO","TradeHQ Required validation"];
const cf=(sha,id)=>({id:112,name:"Cloudflare Pages",head_sha:sha,status:"completed",conclusion:"success",external_id:id,
  app:{id:85455,slug:"cloudflare-workers-and-pages"},
  details_url:"https://dash.cloudflare.com/?to=/01087d56e4cb7b728a7a9ddbcb12b9bb/pages/view/tradehq-preview/"+id});
const vercel=()=>({id:999,context:"Vercel",state:"success",
  target_url:"https://vercel.com/venomog/trading101/ReadOnlyFixture91"});
const sample=()=>({
  head:{name:"main",protected:true,commit:{sha:MAIN}},commit:{sha:MAIN,parents:[{sha:PRIOR}]},
  checks:[...required.map((name,i)=>({id:i+1,name,head_sha:MAIN,status:"completed",conclusion:"success",
    app:{id:15368,slug:"github-actions"}})),cf(MAIN,UUID)],
  statuses:[vercel()],previousChecks:[cf(PRIOR,OLD)],previousStatuses:[vercel()]
});
const proof=verifyReleaseWitness(sample());
assert.equal(proof.currentSha,MAIN);
assert.equal(proof.priorSha,PRIOR);
assert.equal(proof.cloudflare.previousDeploymentId,OLD);
assert.equal(proof.providerRollbackEligible,false);
assert.equal(proof.rollbackPerformed,false);
assert.equal(proof.productionReleaseAuthorized,false);
assert.ok(/^[a-f0-9]{64}$/.test(proof.sha256));
const bad=[
  x=>x.head.protected=false,
  x=>x.head.commit.sha="c".repeat(40),
  x=>x.commit.parents=[],
  x=>x.commit.parents.push({sha:"c".repeat(40)}),
  x=>x.checks[0].app.id=42,
  x=>x.checks[1].conclusion="failure",
  x=>x.checks[2].head_sha=PRIOR,
  x=>x.checks.push({...x.checks[0]}),
  x=>x.checks=x.checks.filter(c=>c.name!=="TradeHQ Required validation"),
  x=>x.checks.at(-1).external_id="preview",
  x=>x.checks.at(-1).app.slug="untrusted",
  x=>x.checks.at(-1).details_url="https://evil.example/pages/"+UUID,
  x=>x.checks.at(-1).details_url="https://dash.cloudflare.com/?to=/untrusted/other/"+UUID,
  x=>x.previousChecks[0].head_sha=MAIN,
  x=>x.previousChecks[0].conclusion="failure",
  x=>x.statuses[0].state="pending",
  x=>x.statuses[0].target_url="https://vercel.com/other/trading101/ReadOnlyFixture91",
  x=>x.statuses[0].target_url="https://vercel.com/venomog/trading101/ReadOnlyFixture91?skip=true",
  x=>x.statuses.push(vercel()),
  x=>x.previousStatuses[0].state="failure",
  x=>x.previousStatuses=[]
];
for(const edit of bad){
  const input=sample();edit(input);assert.throws(()=>verifyReleaseWitness(input));
}
assert.throws(()=>verifyReleaseWitness({}));
// Pages may canonicalize /daily to /daily/. Permit ONLY this same-origin
// redirect; reject external host, unrelated path, unbounded hops and non-HTML.
const html="<html><head><title>TradeHQ Daily</title></head><body>"+
  "Safe authored TradeHQ site content. ".repeat(100)+"</body></html>";
const redirect=(location)=>({status:308,headers:{get:()=>location}});
const page=(status=200,type="text/html; charset=utf-8")=>({
  status,headers:{get:()=>type},text:async()=>html
});
const seen=[];
await checkPublicRoute("/daily",async url=>{
  seen.push(url);
  return seen.length===1?redirect("/daily/"):page();
});
assert.deepEqual(seen,["https://www.thetradehq.com/daily","https://www.thetradehq.com/daily/"]);
for(const badLocation of ["https://attacker.example/daily/","/trade","/daily/?skip=1","/admin"]){
  await assert.rejects(checkPublicRoute("/daily",async()=>redirect(badLocation)),/redirected outside/);
}
await assert.rejects(checkPublicRoute("/daily",async()=>redirect("/daily/")),/Too many/);
await assert.rejects(checkPublicRoute("/daily",async()=>page(500)),/unavailable/);
await assert.rejects(checkPublicRoute("/daily",async()=>page(200,"application/json")),/non-HTML/);
await assert.rejects(checkPublicRoute("/api",async()=>page(200,"text/html")),/authored TradeHQ HTML/);

console.log("Release/recovery readiness offline regression passed: exact provider/app/deploy SHA bindings, prior known-good candidate, missing/failing/duplicate/stale evidence denied, rollback/approval never authorized.");
