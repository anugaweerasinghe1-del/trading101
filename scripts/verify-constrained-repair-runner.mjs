import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync,writeFileSync,readFileSync,mkdirSync,rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createConstrainedRepairRunner } from './agent-constrained-repair-runner.mjs';
const candidateId='repair-v1-'+'a'.repeat(24),digest='b'.repeat(64),file='src/pages/About.tsx';
const before='export default function About(){return <main className="p-4 text-base">Synthetic isolated fixture</main>;}\n';
const after=before.replace('p-4','p-6'),hash=x=>createHash('sha256').update(x).digest('hex');
function fixture() {
  const directory=mkdtempSync(join(tmpdir(),'tradehq-repair-runner-'));
  const git=(...args)=>execFileSync('git',args,{cwd:directory,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
  git('init','-q');git('config','user.name','Isolated Repair Fixture');git('config','user.email','fixture@example.test');
  mkdirSync(join(directory,'src/pages'),{recursive:true});writeFileSync(join(directory,file),before);
  git('add',file);git('commit','-qm','isolated before');const baseSha=git('rev-parse','HEAD');
  const now=Date.now();
  const f={directory,git,baseSha,now,headSha:null,stopped:false,generation:1,claimed:false,claimCalls:0,
    prepareCalls:0,publishCalls:0,closed:[],clock:()=>now,change:after,failTests:false,stopDuringPublish:false};
  f.adapters={
    readMainSha:async()=>f.baseSha,
    collectFreshIncident:async()=>({schema:'tradehq-server-incident-v1',verified:true,rootCauseReproduced:true,
      sourceScope:'LOW',candidateId,baseSha,path:'/about',source:'browser',symptom:'LAYOUT_OVERFLOW',evidenceDigest:digest,observedAt:now}),
    readBaseSource:async()=>before,
    planChange:async()=>f.change,
    reproduceIndependently:async()=>({candidateId,baseSha,evidenceDigest:digest,beforeFailed:true,
      afterPassed:true,beforeDigest:hash(before),afterDigest:hash(f.change)}),
    claimCandidate:async()=>{f.claimCalls++;if(f.claimed||f.stopped)return{claimed:false};f.claimed=true;return{claimed:true,generation:1};},
    readClaim:async()=>({candidateId,baseSha,evidenceDigest:digest,stopped:f.stopped,generation:f.generation,
      status:'claimed',leaseUntil:now+120000}),
    prepareIsolatedCommit:async()=>{f.prepareCalls++;writeFileSync(join(directory,file),f.change);
      git('diff','--check');git('add',file);git('commit','-qm','isolated proposal');f.headSha=git('rev-parse','HEAD');return{headSha:f.headSha};},
    readIsolatedChange:async()=>[{path:file,status:'modified',before:git('show',baseSha+':'+file)+'\n',after:readFileSync(join(directory,file),'utf8')}],
    validateIndependently:async()=>({baseSha,headSha:f.headSha,passed:!f.failTests,independent:true}),
    publishDraft:async()=>{f.publishCalls++;if(f.stopDuringPublish)f.stopped=true;return{number:123};},
    readDraft:async()=>({state:'open',draft:true,baseSha,headSha:f.headSha,changedPaths:[file]}),
    closeDraft:async number=>{f.closed.push(number);},
  };
  f.run=createConstrainedRepairRunner({adapters:f.adapters,activationMode:'low-risk-draft-only',clock:()=>f.clock()});
  return f;
}
assert.throws(()=>createConstrainedRepairRunner({adapters:{}}),/disabled/);
let f=fixture();
try {
  const draft=await f.run(candidateId);
  assert.equal(draft.status,'DRAFT_REQUIRES_REVIEW');assert.equal(f.publishCalls,1);
  assert.ok(Object.values(draft.authorization).every(v=>v===false));
  await assert.rejects(()=>f.run(candidateId),'Consumed claim prevents publication replay');
  assert.equal(f.publishCalls,1);
} finally {rmSync(f.directory,{recursive:true,force:true});}
const rejected=[
  f=>{f.change=before.replace('fixture','changed copy');},
  f=>{f.change=before.replace('p-4','hidden');},
  f=>{f.stopped=true;},
  f=>{f.generation=2;},
  f=>{f.clock=()=>f.now+120001;},
  f=>{f.failTests=true;},
  f=>{f.adapters.validateIndependently=async()=>({baseSha:f.baseSha,headSha:'e'.repeat(40),passed:true,independent:true});},
  f=>{f.adapters.readIsolatedChange=async()=>[{path:'src/pages/Auth.tsx',status:'modified',before,after}];},
  f=>{f.adapters.collectFreshIncident=async()=>({schema:'tradehq-server-incident-v1',verified:true,rootCauseReproduced:false});},
  f=>{const prepare=f.adapters.prepareIsolatedCommit;f.adapters.prepareIsolatedCommit=async x=>{const value=await prepare(x);f.stopped=true;return value;};},
];
for (const mutate of rejected) {
  f=fixture(); try {mutate(f);await assert.rejects(()=>f.run(candidateId));assert.equal(f.publishCalls,0);}
  finally {rmSync(f.directory,{recursive:true,force:true});}
}
f=fixture();
try {f.stopDuringPublish=true;await assert.rejects(()=>f.run(candidateId),/closed/);
  assert.deepEqual(f.closed,[123]);assert.equal(f.claimed,true);assert.equal(f.publishCalls,1);}
finally {rmSync(f.directory,{recursive:true,force:true});}
f=fixture();
try {f.stopDuringPublish=true;f.adapters.closeDraft=async()=>{throw Error('isolated cleanup fault');};
  await assert.rejects(()=>f.run(candidateId),/owner cleanup/);assert.equal(f.publishCalls,1);}
finally {rmSync(f.directory,{recursive:true,force:true});}
f=fixture();
try {f.adapters.publishDraft=async()=>{f.publishCalls++;throw Error('isolated timeout after submission');};
  await assert.rejects(()=>f.run(candidateId),/inconclusive.*no retry/);
  assert.equal(f.publishCalls,1);assert.equal(f.claimed,true);assert.deepEqual(f.closed,[]);}
finally {rmSync(f.directory,{recursive:true,force:true});}
console.log('Constrained runner: real isolated Git diff/head, independent scope/check bindings, durable-adapter admission, stop/expiry/replay rejection and publication-race cleanup passed. GitHub/SQL adapters are synthetic; no production activation claimed.');
