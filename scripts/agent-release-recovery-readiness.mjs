/**
 * Read-only release/recovery readiness. Operates after a protected main merge.
 * Checks exact main SHA and GitHub-reported deploy/check identities, identifies
 * previous known-good commit, and samples public routes.
 *
 * Does not establish Cloudflare rollback eligibility, deployment environment,
 * authenticated login, or Vercel scope ownership. Never rolls back anything.
 */
import assert from "node:assert/strict";
import { collectCloudflareAccountEvidence } from './cloudflare-account-evidence.mjs';
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { setTimeout as sleep } from "node:timers/promises";
import { collectVercelProductionEvidence, assertVercelProductionEvidence } from './vercel-production-evidence.mjs';
const REPO="anugaweerasinghe1-del/trading101";
const SHA=/^[a-f0-9]{40}$/;
const UUID=/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/;
const REQUIRED=[
  "TradeHQ Phase 3 tests",
  "TradeHQ Cloudflare compatibility / Cloudflare build and SEO",
  "TradeHQ Required validation"
];
const CLOUDFLARE_PREFIX="/01087d56e4cb7b728a7a9ddbcb12b9bb/pages/view/tradehq-preview/";

function one(list, predicate, why) {
  const matches=list.filter(predicate);
  assert.equal(matches.length,1,why+" must be unambiguous");
  return matches[0];
}
export function verifyReleaseWitness({head,commit,checks,statuses,previousChecks,previousStatuses,vercelProvider}){
  assert.ok(head && SHA.test(head.commit?.sha||"") && head.protected===true,
    "Exact protected main identity required");
  const sha=head.commit.sha;
  assert.ok(commit?.sha===sha && Array.isArray(commit.parents) && commit.parents.length===1,
    "Release commit must have exactly one immutable parent");
  const prior=commit.parents[0]?.sha;
  assert.ok(SHA.test(prior||"") && prior!==sha,"Previous main release SHA unavailable");
  assert.ok(Array.isArray(checks)&&Array.isArray(statuses)&&Array.isArray(previousChecks)&&Array.isArray(previousStatuses),
    "Complete current and recovery candidate evidence required");
  for(const name of REQUIRED){
    const c=one(checks,x=>x.name===name,"Required CI check "+name);
    assert.ok(c.head_sha===sha && c.status==="completed"&&c.conclusion==="success"
      &&c.app?.id===15368&&c.app?.slug==="github-actions", "Missing trusted successful CI check");
  }
  const pages=one(checks,x=>x.name==="Cloudflare Pages","Cloudflare Pages");
  const previousPages=one(previousChecks,x=>x.name==="Cloudflare Pages","Previous Cloudflare Pages");
  for(const [check,target] of [[pages,sha],[previousPages,prior]]){
    assert.ok(check.head_sha===target && check.app?.id===85455
      && check.app?.slug==="cloudflare-workers-and-pages"
      && check.status==="completed" && check.conclusion==="success"
      && UUID.test(check.external_id||""), "Untrusted or failed Cloudflare Pages deployment");
    const url=new URL(check.details_url||"https://invalid.invalid");
    assert.equal(url.origin,"https://dash.cloudflare.com","Unexpected Pages provider");
    assert.equal(url.searchParams.get("to")||url.pathname,CLOUDFLARE_PREFIX+check.external_id,
      "Pages project or deployment binding incorrect");
  }
  function findVercel(items) {
    const v=one(items,x=>x.context==="Vercel","Vercel commit status");
    const url=new URL(v.target_url||"https://invalid.invalid");
    assert.ok(v.state==="success" && url.origin==="https://vercel.com"
      && /^\/venomog\/trading101\/[A-Za-z0-9_-]+$/.test(url.pathname)
      && !url.search && !url.hash, "Vercel commit signal is not successful on known project");
    return {statusId:v.id,targetUrl:url.toString()};
  }
  let currentVercel;
  if(vercelProvider){
    assertVercelProductionEvidence(vercelProvider,sha);
    const signals=statuses.filter(x=>x.context==='Vercel');
    assert.ok(signals.length===0 || (signals.length===1 && signals[0].state==='pending'),
      'Provider evidence cannot override failed, duplicate or contradictory GitHub Vercel statuses');
    if(signals.length){
      const target=new URL(signals[0].target_url||'https://invalid.invalid');
      assert.ok(target.origin==='https://vercel.com'
        && /^\/venomog\/trading101\/[A-Za-z0-9_-]+$/.test(target.pathname)
        && !target.search && !target.hash,'Untrusted pending Vercel status');
    }
    currentVercel={statusId:null,source:'authenticated_vercel_api',deploymentId:vercelProvider.deploymentId};
  }else currentVercel={...findVercel(statuses),source:'github_commit_status'};
  const priorVercel=findVercel(previousStatuses);
  const report={
    schema:"tradehq-release-recovery-readiness-v1",currentSha:sha,
    priorSha:prior,
    cloudflare:{project:"tradehq-preview",currentCheckId:pages.id,
      currentDeploymentId:pages.external_id,previousCheckId:previousPages.id,
      previousDeploymentId:previousPages.external_id},
    vercel:{currentStatusId:currentVercel.statusId,previousStatusId:priorVercel.statusId,
      currentEvidenceSource:currentVercel.source,currentDeploymentId:currentVercel.deploymentId||null},
    requiredCheckCount:REQUIRED.length,
    candidateStatus:"PREVIOUS_SUCCESSFUL_COMMIT_ONLY",
    providerRollbackEligible:false,rollbackPerformed:false,ownerApproval:false,
    productionReleaseAuthorized:false,
    limitations:["GitHub App checks do not verify Cloudflare dashboard production environment or rollback eligibility.",
      currentVercel.source==='authenticated_vercel_api'
        ? "Direct Vercel evidence confirms the active production alias; it does not authorize a release or rollback."
        : "Vercel status is GitHub-reported; direct Vercel account access is not established.",
      "Code rollback cannot reverse Supabase migrations or provider settings."]
  };
  return {...report,sha256:createHash("sha256").update(JSON.stringify(report)).digest("hex")};
}
async function github(path,token){
  const url="https://api.github.com/repos/"+REPO+path;
  const resp=await fetch(url,{redirect:"error",signal:AbortSignal.timeout(15000),
    headers:{Authorization:"Bearer "+token,Accept:"application/vnd.github+json",
      "X-GitHub-Api-Version":"2022-11-28"}});
  assert.equal(resp.status,200,"Required GitHub metadata unavailable");
  const data=await resp.text();
  assert.ok(Buffer.byteLength(data,"utf8")<1500000,"Oversized GitHub evidence");
  return JSON.parse(data);
}
async function collect(sha,token){
  const checks=await github("/commits/"+sha+"/check-runs?per_page=100",token);
  assert.ok(checks.total_count<=100&&Array.isArray(checks.check_runs),"Incomplete provider check pagination");
  const statuses=await github("/commits/"+sha+"/status",token);
  assert.ok(Array.isArray(statuses.statuses)&&statuses.statuses.length<=100,"Incomplete status history");
  return {checks:checks.check_runs,statuses:statuses.statuses};
}
export async function checkPublicRoute(path,fetcher=fetch){
  assert.ok(/^\/[a-z-]*$/.test(path),"Only reviewed public routes are allowed");
  const origin="https://www.thetradehq.com";
  let target=new URL(origin+path);
  for(let redirects=0;redirects<3;redirects++){
    const response=await fetcher(target.toString(),{
      redirect:"manual",signal:AbortSignal.timeout(14000),
      headers:{"User-Agent":"TradeHQ-release-sampler/1.0"}});
    if([301,302,307,308].includes(response.status)){
      const next=new URL(response.headers.get("location")||"",target);
      assert.ok(next.origin===origin && !next.search && !next.hash
        && (next.pathname===path || next.pathname===path+"/"),
        "Public route redirected outside its approved same-origin canonical path: "+path);
      target=next;
      continue;
    }
    assert.equal(response.status,200,"Public route unavailable: "+path);
    const contentType=response.headers.get("content-type")||"";
    assert.ok(contentType.includes("text/html"),"Public route returned non-HTML: "+path);
    const body=await response.text();
    assert.ok(body.includes("<title")&&body.includes("TradeHQ")&&body.length>2000,
      "Public route did not return authored TradeHQ HTML: "+path);
    return;
  }
  throw Error("Too many public route redirects: "+path);
}
export async function waitForReleaseWitness(readWitness, {
  attempts=25, pauseMs=30000, pause=sleep, now=Date.now, readVercel,
}={}){
  assert.ok(typeof readWitness==='function' && Number.isSafeInteger(attempts)
    && attempts>=1 && attempts<=25 && Number.isSafeInteger(pauseMs)
    && pauseMs>=0 && pauseMs<=30000, 'Invalid bounded release wait');
  const deadline=now()+12*60_000;
  for(let attempt=0;attempt<attempts;attempt++){
    assert.ok(now()<=deadline,'Release evidence time budget exhausted');
    // Network/authentication failures are not retried. Only a successfully read
    // but incomplete witness can wait; the complete trust gate runs every time.
    const witness=await readWitness();
    assert.ok(now()<=deadline,'Release evidence time budget exhausted');
    try { return verifyReleaseWitness(witness); }
    catch(error){
      const signals=witness.statuses?.filter(x=>x.context==='Vercel');
      let delayed=signals?.length===0
        && /^Vercel commit status must be unambiguous(?:\n|$)/.test(error.message);
      if(signals?.length===1 && signals[0].state==='pending'
        && error.message==='Vercel commit signal is not successful on known project'){
        const url=new URL(signals[0].target_url||'https://invalid.invalid');
        delayed=url.origin==='https://vercel.com'
          && /^\/venomog\/trading101\/[A-Za-z0-9_-]+$/.test(url.pathname)
          && !url.search && !url.hash;
      }
      if(!delayed) throw error;
      if(readVercel){
        const vercelProvider=await readVercel();
        return verifyReleaseWitness({...witness,vercelProvider});
      }
      if(attempt===attempts-1 || now()+pauseMs>deadline) throw error;
      await pause(pauseMs);
    }
  }
}
async function run(){
  assert.equal(process.env.GITHUB_REPOSITORY,REPO,"Unexpected repository");
  const sha=process.env.GITHUB_SHA,token=process.env.GITHUB_TOKEN;
  assert.ok(SHA.test(sha||"") && typeof token==="string" && token.length>=20,"Immutable SHA/read-only GitHub token required");
  const head=await github("/branches/main",token);
  assert.equal(head.commit?.sha,sha,"New main commit detected; stale release check rejected");
  const commit=await github("/commits/"+sha,token);
  assert.ok(Array.isArray(commit.parents)&&commit.parents.length===1,"Unrecognized parent history");
  const previous=commit.parents[0].sha;
  const previousProof=await collect(previous,token);
  const report=await waitForReleaseWitness(async()=>{
    const currentHead=await github('/branches/main',token);
    assert.equal(currentHead.commit?.sha,sha,'Main changed while waiting; stale release rejected');
    const current=await collect(sha,token);
    return {head:currentHead,commit,checks:current.checks,
        statuses:current.statuses,previousChecks:previousProof.checks,
        previousStatuses:previousProof.statuses};
  },{readVercel:process.env.TRADEHQ_VERCEL_VERIFY_TOKEN
    ? ()=>collectVercelProductionEvidence({sha,token:process.env.TRADEHQ_VERCEL_VERIFY_TOKEN}) : undefined});
  for(const path of ["/","/trade","/courses","/auth","/daily"]){
    await checkPublicRoute(path);
  }
  assert.equal((await github("/branches/main",token)).commit?.sha,sha,
    "Main changed during release witness; no valid readiness claim");
  console.log("TRADEHQ_RELEASE_RECOVERY_READINESS_V1 "+JSON.stringify(report));
  console.log("PUBLIC_RELEASE_ROUTES_PASS 5");
  if(process.env.CLOUDFLARE_API_TOKEN){
    const cloudflare=await collectCloudflareAccountEvidence({sha,token:process.env.CLOUDFLARE_API_TOKEN});
    assert.equal((await github('/branches/main',token)).commit?.sha,sha,'Main changed during Cloudflare account verification');
    console.log('TRADEHQ_CLOUDFLARE_ACCOUNT_OBSERVATION_V1 '+JSON.stringify(cloudflare));
  }else console.log('CLOUDFLARE_ACCOUNT_OBSERVATION_NOT_CONFIGURED');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  run().catch(error=>{const reason=String(error?.message||"Unknown check failure").replace(/\s+/g," ").slice(0,170);
    console.error("Release/recovery NOT VERIFIED: "+reason+". Do not release or rollback based on this report.");process.exitCode=1;});
}
