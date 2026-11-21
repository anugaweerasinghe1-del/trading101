import assert from "node:assert/strict";
import { assertActiveCloudflareProject, verifyCloudflareProduction } from "./verify-cloudflare-production-main.mjs";
const MAIN="a".repeat(40), OLD="b".repeat(40);
const ID="6830d3c4-5e05-4bea-a46d-4941dc0d11ab";
const active=()=>({name:"tradehq-preview",id:"expected-project",production_branch:"main",domains:["www.thetradehq.com"],
  canonical_deployment:{id:ID,project_name:"tradehq-preview",project_id:"expected-project",
    environment:"production",latest_stage:{status:"success"},
    deployment_trigger:{metadata:{branch:"main",commit_hash:MAIN}}}});
const verified=assertActiveCloudflareProject(active(),MAIN);
assert.equal(verified.sha,MAIN);
assert.equal(verified.customDomainBound,true);
for(const mutate of [
  p=>p.production_branch="preview",
  p=>p.id="bad-project",
  p=>p.canonical_deployment.id="not-uuid",
  p=>p.canonical_deployment.project_id="wrong",
  p=>p.canonical_deployment.project_name="wrong",
  p=>p.canonical_deployment.environment="preview",
  p=>p.canonical_deployment.deployment_trigger.metadata.branch="feature",
  p=>p.canonical_deployment.deployment_trigger.metadata.commit_hash=OLD,
  p=>p.canonical_deployment.latest_stage.status="failure",
]){const p=active();mutate(p);assert.throws(()=>assertActiveCloudflareProject(p,MAIN));}
let routeCalls=0,headCalls=0;
const good=await verifyCloudflareProduction({sha:MAIN,githubToken:"github-read-only-token-fixture",
  cloudflareToken:"cloudflare-read-only-fixture",
  getHead:async()=>{headCalls++;},getProject:async()=>active(),
  checkRoute:async()=>{routeCalls++;},sleep:async()=>{throw Error("Unexpected wait");}});
assert.equal(good.status,"CLOUDFLARE_PRODUCTION_VERIFIED");
assert.equal(headCalls,2);
assert.equal(routeCalls,5);
let polls=0,pauses=0;
const caughtUp=await verifyCloudflareProduction({sha:MAIN,githubToken:"github-read-only-token-fixture",
  cloudflareToken:"cloudflare-read-only-fixture",getHead:async()=>{},tries:3,
  getProject:async()=>{polls++;const p=active();if(polls===1)p.canonical_deployment.deployment_trigger.metadata.commit_hash=OLD;return p;},
  checkRoute:async()=>{},sleep:async(ms)=>{assert.equal(ms,15000);pauses++;}});
assert.equal(caughtUp.sha,MAIN);assert.equal(polls,2);assert.equal(pauses,1);
let checked=0;
await assert.rejects(verifyCloudflareProduction({sha:MAIN,githubToken:"github-read-only-token-fixture",
  cloudflareToken:"cloudflare-read-only-fixture",getHead:async()=>{},getProject:async()=>{const p=active();p.canonical_deployment.environment="preview";return p;},
  checkRoute:async()=>{checked++;},sleep:async()=>{throw Error("Must not retry untrusted identity");}}),/identity not trusted/);
assert.equal(checked,0);
await assert.rejects(verifyCloudflareProduction({sha:MAIN,githubToken:"github-read-only-token-fixture",
  cloudflareToken:"cloudflare-read-only-fixture",getHead:async()=>{},
  getProject:async()=>active(),checkRoute:async()=>{throw Error("Route unavailable");}}),/Route unavailable/);
await assert.rejects(verifyCloudflareProduction({sha:MAIN,githubToken:"github-read-only-token-fixture",
  cloudflareToken:"cloudflare-read-only-fixture",getHead:async()=>{throw Error("Main changed");},
  getProject:async()=>active(),checkRoute:async()=>{}}),/Main changed/);
console.log("PASS exact active Cloudflare SHA, production identity, protected-main witness, bounded deployment catch-up, public route and negative controls.");
