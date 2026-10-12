/** GET-only wait for upstream CI. Never retries an explicit failed validation. */
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {setTimeout as sleep} from 'node:timers/promises';
const REPO='anugaweerasinghe1-del/trading101';
const REQUIRED=['TradeHQ Phase 3 tests','TradeHQ Cloudflare compatibility / Cloudflare build and SEO','TradeHQ Required validation'];
export function requiredCiReady(checks,sha){
  assert.match(sha,/^[a-f0-9]{40}$/);assert.ok(Array.isArray(checks));
  let ready=true;
  for(const name of REQUIRED){
    const found=checks.filter(c=>c.name===name);assert.ok(found.length<=1,'Ambiguous required CI identity');
    if(!found.length){ready=false;continue}
    const c=found[0];assert.ok(c.head_sha===sha&&c.app?.id===15368&&c.app?.slug==='github-actions','Untrusted CI identity');
    if(c.status==='completed')assert.equal(c.conclusion,'success','Upstream CI explicitly failed or skipped');
    else{assert.ok(['queued','in_progress','pending','waiting','requested'].includes(c.status),'Unknown CI status');ready=false;}
  }
  return ready;
}
export function validationRunReady(runs,sha){
  assert.ok(Array.isArray(runs));assert.match(sha,/^[a-f0-9]{40}$/);
  const run=runs.filter(r=>r.path==='.github/workflows/phase3-high-check.yml').sort((a,b)=>b.id-a.id)[0];
  if(!run)return false;
  assert.ok(Number.isSafeInteger(run.id)&&run.id>0&&run.workflow_id===368399831
    &&run.head_sha===sha&&run.head_branch==='main'&&run.event==='push'
    &&run.repository?.id===1130435580&&run.head_repository?.id===1130435580,'Untrusted upstream validation run');
  if(run.status==='completed'){assert.equal(run.conclusion,'success','Upstream validation run failed or skipped');return true}
  assert.ok(['queued','in_progress','pending','waiting','requested'].includes(run.status),'Unknown validation run status');
  return false;
}
export async function waitForRequiredCi({sha,read,wait=sleep}){
  for(let attempt=0;attempt<18;attempt++){
    const main=await read('/branches/main');assert.equal(main.commit?.sha,sha,'Main changed; wait rejected');
    const response=await read('/commits/'+sha+'/check-runs?filter=latest&per_page=100');
    assert.ok(response.total_count<=100&&Array.isArray(response.check_runs),'Incomplete check pagination');
    if(requiredCiReady(response.check_runs,sha)){
      // The final required gate finishes before the read-only release job.
      // The independent collector requires the whole current CI attempt to
      // finish, so gate success alone must not release this wait.
      const runs=await read('/actions/runs?head_sha='+sha+'&per_page=100');
      assert.ok(runs.total_count<=100&&Array.isArray(runs.workflow_runs),'Incomplete validation run pagination');
      if(validationRunReady(runs.workflow_runs,sha))return;
    }
    if(attempt<17)await wait(8000);
  }
  throw Error('Required upstream CI did not complete within the bounded wait');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  try{
    const sha=process.env.MAIN_SHA,token=process.env.GITHUB_TOKEN;
    assert.equal(process.env.GITHUB_REPOSITORY,REPO);assert.match(sha||'',/^[a-f0-9]{40}$/);
    assert.ok(typeof token==='string'&&token.length>=20);
    await waitForRequiredCi({sha,read:async path=>{
      const r=await fetch('https://api.github.com/repos/'+REPO+path,{redirect:'error',signal:AbortSignal.timeout(12000),
        headers:{Authorization:'Bearer '+token,Accept:'application/vnd.github+json'}});
      assert.equal(r.status,200,'Upstream CI evidence unavailable');
      const body=await r.text();assert.ok(Buffer.byteLength(body)<1500000,'Oversized CI metadata');return JSON.parse(body);
    }});
    console.log('Required exact-main CI completed successfully; independent collector must still verify all evidence');
  }catch{console.error('Trusted cycle blocked: failed, changed, ambiguous or incomplete upstream CI');process.exitCode=1}
}
