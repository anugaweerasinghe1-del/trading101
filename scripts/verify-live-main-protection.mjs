/**
 * Live GitHub-main protection evidence, GET-only.
 *
 * This does NOT establish cryptographic owner approval, administrator bypass
 * settings or production rollback eligibility. Those are separate gates.
 * It ensures required CI may not silently disappear from protected main.
 */
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";

export const REQUIRED_MAIN_CONTEXTS=Object.freeze([
  "TradeHQ Phase 3 tests",
  "TradeHQ Cloudflare compatibility / Cloudflare build and SEO",
  "TradeHQ Required validation"
]);
const REPO="anugaweerasinghe1-del/trading101";
const SHA=/^[a-f0-9]{40}$/;

export function verifyLiveMainProtection(branch){
  assert.ok(branch && branch.name==="main" && SHA.test(branch.commit?.sha||""),
    "Branch identity and immutable main SHA required");
  assert.ok(branch.protected===true && branch.protection?.enabled===true,
    "Main branch is not protected");
  const policy=branch.protection.required_status_checks;
  assert.ok(policy && policy.enforcement_level==="everyone",
    "Required validation is not enforced for every actor");
  const actual=policy.contexts;
  assert.ok(Array.isArray(actual) && actual.length===REQUIRED_MAIN_CONTEXTS.length,
    "Required CI contexts missing or unexpectedly changed");
  assert.deepEqual([...actual].sort(),[...REQUIRED_MAIN_CONTEXTS].sort(),
    "Required CI identity differs from reviewed configuration");
  const checks=policy.checks;
  assert.ok(Array.isArray(checks) && checks.length===REQUIRED_MAIN_CONTEXTS.length,
    "Required GitHub App identity bindings missing");
  const seen=new Set();
  for(const c of checks){
    assert.ok(c && REQUIRED_MAIN_CONTEXTS.includes(c.context) && !seen.has(c.context)
      && c.app_id===15368,"Duplicate, unrecognized or untrusted required check");
    seen.add(c.context);
  }
  return Object.freeze({
    schema:"tradehq-main-protection-evidence-v1",
    mainSha:branch.commit.sha,requiredCheckCount:REQUIRED_MAIN_CONTEXTS.length,
    githubActionsAppId:15368,verifiedMainProtected:true,verifiedChecksEnforcedForEveryone:true,
    ownerApprovalEnforced:false,productionReleaseAuthorized:false
  });
}

async function main(){
  assert.equal(process.env.GITHUB_REPOSITORY,REPO,"Wrong GitHub repository");
  const token=process.env.GITHUB_TOKEN;
  assert.ok(typeof token==="string" && token.length>=20,"Read-only GitHub token required");
  const url="https://api.github.com/repos/"+REPO+"/branches/main";
  const res=await fetch(url,{
    redirect:"error",signal:AbortSignal.timeout(10000),
    headers:{Accept:"application/vnd.github+json",
      Authorization:"Bearer "+token,"X-GitHub-Api-Version":"2022-11-28"}
  });
  assert.ok(res.status===200,"Protected-main verification failed closed: GitHub returned "+res.status);
  assert.ok(Number(res.headers.get("content-length")||"0")<1024*1024,"Unexpected large GitHub response");
  const raw=await res.text();
  assert.ok(raw.length<1024*1024,"GitHub branch payload too large");
  const evidence=verifyLiveMainProtection(JSON.parse(raw));
  console.log("TRADEHQ_MAIN_PROTECTION_VERIFIED "+JSON.stringify(evidence));
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href){
  main().catch(()=>{console.error("GitHub main protection could not be independently confirmed. No release authority granted.");process.exitCode=1;});
}
