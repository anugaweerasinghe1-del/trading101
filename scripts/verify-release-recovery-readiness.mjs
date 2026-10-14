import assert from "node:assert/strict";
import { readFileSync } from 'node:fs';
import { verifyReleaseWitness, checkPublicRoute, waitForReleaseWitness } from "./agent-release-recovery-readiness.mjs";
import { collectCloudflareAccountEvidence } from './cloudflare-account-evidence.mjs';
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
let reads=0, pauses=0;
const delayed=await waitForReleaseWitness(async()=>{
  reads++; const input=sample(); if(reads<3)input.statuses=[]; return input;
},{pause:async ms=>{assert.equal(ms,30000);pauses++;}});
assert.equal(delayed.currentSha,MAIN);assert.equal(reads,3);assert.equal(pauses,2);
reads=0;
await assert.rejects(waitForReleaseWitness(async()=>{reads++;const x=sample();x.statuses=[];return x;},
  {attempts:3,pause:async()=>{}}),/unambiguous/);
assert.equal(reads,3);
for(const edit of bad){
  const edited=sample();edit(edited);
  if(edited.statuses[0]?.state==='pending')continue;
  reads=0;
  await assert.rejects(waitForReleaseWitness(async()=>{reads++;const x=sample();edit(x);return x;},
    {pause:async()=>{throw Error('Invalid evidence must not wait');}}));
  assert.equal(reads,1,'Failed/forged/ambiguous evidence must stop immediately');
}
reads=0;
await assert.rejects(waitForReleaseWitness(async()=>{reads++;throw Error('HTTP 403');},
  {pause:async()=>{throw Error('Network errors must not retry');}}),/HTTP 403/);
assert.equal(reads,1);
for(const attempts of [0,26,1.5])await assert.rejects(waitForReleaseWitness(async()=>sample(),{attempts}));
let clock=0;
await assert.rejects(waitForReleaseWitness(async()=>{clock=12*60_000+1;return sample();},
  {now:()=>clock,pause:async()=>{}}),/time budget/);
reads=0;
await waitForReleaseWitness(async()=>{reads++;const x=sample();if(reads===1)x.statuses[0].state='pending';return x;},
  {pause:async()=>{}});
assert.equal(reads,2);
const {collectVercelProductionEvidence}=await import('./vercel-production-evidence.mjs');
const providerData={id:'dpl_ProviderFixture91',name:'trading101',projectId:'prj_PjOhFr0eppPg8hZQhdeBwTniZWOy',
  target:'production',readyState:'READY',source:'git',alias:['thetradehq.com'],createdAt:Date.now()-1000,
  meta:{githubCommitRef:'main',githubCommitSha:MAIN,githubOrg:'anugaweerasinghe1-del',githubRepo:'trading101'}};
const provider=()=>collectVercelProductionEvidence({sha:MAIN,token:'PRIVATE_TOKEN_SENTINEL',
  fetchImpl:async()=>new Response(JSON.stringify(providerData))});
const noStatus=sample();noStatus.statuses=[];
const direct=await waitForReleaseWitness(async()=>noStatus,{readVercel:provider,pause:async()=>{throw Error('API proof should resolve delay');}});
assert.equal(direct.vercel.currentEvidenceSource,'authenticated_vercel_api');
assert.equal(direct.vercel.currentStatusId,null);
assert.equal(direct.vercel.currentDeploymentId,providerData.id);
assert.equal(direct.productionReleaseAuthorized,false);
for(const edit of [x=>x.statuses[0].state='failure',x=>x.checks[0].conclusion='failure',x=>x.statuses.push(vercel())]){
  const x=sample();edit(x);let apiCalls=0;
  await assert.rejects(waitForReleaseWitness(async()=>x,{readVercel:async()=>{apiCalls++;return provider();}}));
  assert.equal(apiCalls,0,'Provider fallback must not override failing/ambiguous evidence');
}
await assert.rejects(waitForReleaseWitness(async()=>noStatus,{readVercel:async()=>({schema:'forged',commitSha:MAIN})}),/imported JSON/);
await import('./verify-vercel-production-evidence.mjs');
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
await assert.rejects(checkPublicRoute("/daily",async()=>({status:200,headers:{get:()=>"text/html"},text:async()=>"<html><title>Unknown</title></html>"})),/authored TradeHQ HTML/);

console.log("Release/recovery readiness offline regression passed: exact provider/app/deploy SHA bindings, prior known-good candidate, missing/failing/duplicate/stale evidence denied, rollback/approval never authorized.");

await import('./verify-recovery-preflight.mjs');

const cloudToken='cloudflare-disposable-read-fixture-42';
const leak='private-cloudflare-fixture-not-for-output';
const cloudDeployment=(sha,id)=>({id,project_name:'tradehq-preview',project_id:'fixture-project',environment:'production',
  created_on:'2026-10-14T13:00:00Z',deployment_trigger:{metadata:{commit_hash:sha,branch:'main'}},latest_stage:{status:'success'},
  env_vars:{PRIVATE:{value:leak}}});
const cloudProject={success:true,result:{id:'fixture-project',name:'tradehq-preview',production_branch:'main',
  production_script_name:'fixture-production-script',canonical_deployment:cloudDeployment(MAIN,UUID),
  latest_deployment:cloudDeployment(PRIOR,OLD),env_vars:{value:leak}}};
let cloudRequests=[];
const cloudFetch=(modify=()=>{})=>async (url,init)=>{
  cloudRequests.push(url);assert.equal(init.headers.Authorization,'Bearer '+cloudToken);assert.equal(init.redirect,'error');
  assert.ok(url.startsWith('https://api.cloudflare.com/client/v4/'));
  let body;
  if(url.endsWith('/tokens/verify'))body={success:true,result:{status:'active',id:leak}};
  else if(url.endsWith('/pages/projects/tradehq-preview'))body=structuredClone(cloudProject);
  else if(url.includes('/deployments?'))body={success:true,result:[cloudDeployment(MAIN,UUID),cloudDeployment(PRIOR,OLD)]};
  else if(url.endsWith('/subscriptions'))body={success:true,result:[{price:0,frequency:'monthly',rate_plan:{id:'workers_free'},payment_source:{email:leak}}]};
  else {assert.ok(url.endsWith('/graphql'));assert.equal(init.method,'POST');const q=JSON.parse(init.body).query;assert.ok(q.startsWith('query '));assert.ok(!q.includes('mutation'));
    body={data:{viewer:{accounts:[{accountTag:'01087d56e4cb7b728a7a9ddbcb12b9bb',pages:[{dimensions:{scriptName:'fixture-production-script'},sum:{requests:31,errors:0}}]}]}}};}
  if(!url.endsWith('/graphql'))assert.equal(init.method,'GET');
  modify(body,url);return new Response(JSON.stringify(body));
};
const cloud=await collectCloudflareAccountEvidence({sha:MAIN,token:cloudToken,fetchImpl:cloudFetch(),now:()=>Date.parse('2026-10-14T14:00:00Z')});
assert.equal(cloudRequests.length,5);assert.equal(cloud.activeProduction.sha,MAIN);assert.equal(cloud.previousSuccessfulProduction.sha,PRIOR);
assert.equal(cloudRequests[0],'https://api.cloudflare.com/client/v4/accounts/01087d56e4cb7b728a7a9ddbcb12b9bb/tokens/verify','Account-owned tokens must use their account verification endpoint');
assert.equal(cloud.usage.projectRequests,31);assert.equal(cloud.quotaHeadroomVerified,false);assert.equal(cloud.rollbackPerformed,false);
assert.ok(Object.values(cloud.authorization).every(v=>v===false));
for(const value of [cloudToken,leak,'payment_source','env_vars'])assert.ok(!JSON.stringify(cloud).includes(value));
for(const modify of [
 (b,u)=>{if(u.endsWith('/tokens/verify'))b.result.status='disabled';},
 (b,u)=>{if(u.endsWith('/pages/projects/tradehq-preview'))b.result.canonical_deployment.deployment_trigger.metadata.commit_hash=PRIOR;},
 (b,u)=>{if(u.endsWith('/pages/projects/tradehq-preview'))b.result.canonical_deployment.environment='preview';},
 (b,u)=>{if(u.endsWith('/pages/projects/tradehq-preview'))b.result.canonical_deployment.project_id='wrong';},
 (b,u)=>{if(u.endsWith('/subscriptions'))b.result=null;},
 (b,u)=>{if(u.endsWith('/graphql'))b.data.viewer.accounts[0].accountTag='wrong';},
 (b,u)=>{if(u.endsWith('/graphql'))b.data.viewer.accounts[0].pages=Array(100).fill(b.data.viewer.accounts[0].pages[0]);},
 (b,u)=>{if(u.endsWith('/graphql'))b.data.viewer.accounts[0].pages[0].sum.requests=-1;},
])await assert.rejects(collectCloudflareAccountEvidence({sha:MAIN,token:cloudToken,fetchImpl:cloudFetch(modify)}));
cloudRequests=[];
await assert.rejects(collectCloudflareAccountEvidence({sha:MAIN,token:cloudToken,fetchImpl:async()=>{cloudRequests.push(1);return new Response(JSON.stringify({errors:[{code:10000,message:leak}]}),{status:403});}}),error=>/HTTP 403; code 10000/.test(error.message)&&!error.message.includes(leak));
assert.equal(cloudRequests.length,1,'Unauthorized credentials must not retry');
await assert.rejects(collectCloudflareAccountEvidence({sha:MAIN,token:cloudToken,fetchImpl:async()=>{throw Error(cloudToken);}}),error=>!error.message.includes(cloudToken));
await assert.rejects(collectCloudflareAccountEvidence({sha:MAIN,token:cloudToken,fetchImpl:async()=>new Response(new Uint8Array(2097153))}),/exceeded bounds/);
console.log('CLOUDFLARE_READONLY_ACCOUNT_FIXTURE_PASS: exact production identity, bounded history/usage, token and private fields omitted, denied/redirect/oversized/truncated evidence cannot authorize quota or rollback.');
const workflow=readFileSync('.github/workflows/phase3-high-check.yml','utf8');
const secretBinding='CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}';
assert.equal(workflow.split(secretBinding).length-1,1,'Account secret must have exactly one main-only binding');
const accountJob=workflow.slice(workflow.indexOf('  release-readiness:'));
assert.ok(accountJob.includes(secretBinding) && accountJob.includes("github.event_name == 'push' && github.ref == 'refs/heads/main' && needs.validation.result == 'success'"), 'Provider secret is restricted to successfully validated protected main, never PR execution');
