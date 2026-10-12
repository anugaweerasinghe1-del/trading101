import assert from 'node:assert/strict';
import {requiredCiReady,validationRunReady,waitForRequiredCi} from './agent-evidence-ci-wait.mjs';
const sha='a'.repeat(40),names=['TradeHQ Phase 3 tests','TradeHQ Cloudflare compatibility / Cloudflare build and SEO','TradeHQ Required validation'];
const checks=names.map(name=>({name,head_sha:sha,app:{id:15368,slug:'github-actions'},status:'completed',conclusion:'success'}));
assert.equal(requiredCiReady(checks,sha),true);assert.equal(requiredCiReady([],sha),false);
assert.equal(requiredCiReady(checks.map(c=>({...c,status:'in_progress',conclusion:null})),sha),false);
for(const change of [c=>c.conclusion='failure',c=>c.conclusion='skipped',c=>c.head_sha='b'.repeat(40),c=>c.app.id=1,c=>c.status='unknown']){
  const bad=structuredClone(checks);change(bad[0]);assert.throws(()=>requiredCiReady(bad,sha));
}
assert.throws(()=>requiredCiReady([...checks,checks[0]],sha));
let polls=0,waits=0;
const run={id:100,workflow_id:368399831,path:'.github/workflows/phase3-high-check.yml',head_sha:sha,head_branch:'main',event:'push',repository:{id:1130435580},head_repository:{id:1130435580},status:'completed',conclusion:'success'};
assert.equal(validationRunReady([run],sha),true);
assert.equal(validationRunReady([{...run,status:'in_progress',conclusion:null}],sha),false);
assert.equal(validationRunReady([],sha),false);
for(const change of [r=>r.conclusion='failure',r=>r.workflow_id=1,r=>r.head_sha='b'.repeat(40),r=>r.event='pull_request',r=>r.head_repository.id=1]){
  const bad=structuredClone(run);change(bad);assert.throws(()=>validationRunReady([bad],sha));
}
await waitForRequiredCi({sha,read:async path=>path==='/branches/main'?{commit:{sha}}:path.startsWith('/actions/runs?')?{total_count:1,workflow_runs:[run]}:{total_count:3,check_runs:++polls===1?checks.map(c=>({...c,status:'queued',conclusion:null})):checks},wait:async()=>{waits++}});
assert.equal(polls,2);assert.equal(waits,1);
polls=0;waits=0;
await waitForRequiredCi({sha,read:async path=>path==='/branches/main'?{commit:{sha}}:path.startsWith('/actions/runs?')?{total_count:1,workflow_runs:[++polls===1?{...run,status:'in_progress',conclusion:null}:run]}:{total_count:3,check_runs:checks},wait:async()=>{waits++}});
assert.equal(waits,1,'Successful required gates must still wait for release verification and complete upstream run');
await assert.rejects(waitForRequiredCi({sha,read:async()=>({commit:{sha:'b'.repeat(40)}}),wait:async()=>{throw Error('Should not wait')}}),/Main changed/);
polls=0;await assert.rejects(waitForRequiredCi({sha,read:async path=>path==='/branches/main'?{commit:{sha}}:{total_count:0,check_runs:[]},wait:async()=>{polls++}}),/bounded wait/);assert.equal(polls,17);
console.log('Read-only CI wait: pending may finish; explicit failure/skipped/wrong app/SHA/duplicate/race and bounded exhaustion deny');
