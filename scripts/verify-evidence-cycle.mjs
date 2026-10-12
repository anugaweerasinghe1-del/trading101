import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import YAML from 'yaml';
import { summarizeInvestigation, investigationOutcome } from './agent-operational-investigation-handoff.mjs';
import { classify } from './agent-evidence-run-gate.mjs';
const j=(name,conclusion)=>({name,status:'completed',conclusion});
assert.deepEqual(classify([j('scan','success'),j('browser','success')],'push'),{ready:true,purpose:'healthy'});
assert.deepEqual(classify([j('scan','failure'),j('browser','success')],'push'),{ready:true,purpose:'diagnosis'});
assert.deepEqual(classify([j('scan','skipped'),j('browser','skipped')],'schedule'),{ready:false,purpose:'none'});
for(const arr of [[j('scan','success')],[j('scan','success'),j('browser','skipped')],[j('scan','success'),j('scan','success'),j('browser','success')]])assert.throws(()=>classify(arr,'push'));
assert.throws(()=>classify([j('scan','skipped'),j('browser','skipped')],'push'));
const raw=readFileSync('.github/workflows/tradehq-verified-evidence.yml','utf8');const y=YAML.parse(raw);
assert.deepEqual(y.permissions,{contents:'read',actions:'read',checks:'read',issues:'read'});
assert.deepEqual(y.on.workflow_run,{workflows:['TradeHQ Agents'],types:['completed'],branches:['main']});
assert.equal(y.jobs.collect.steps[0].with.ref,'${{ github.sha }}');
assert.equal(y.jobs.collect.steps[0].with['persist-credentials'],false);
assert.ok(y.jobs.collect.if.includes('head_repository.full_name == github.repository'));
assert.ok(y.jobs.collect.steps.some(s=>String(s.run).includes('agent-evidence-run-gate.mjs')));
assert.ok(y.jobs.collect.steps.some(s=>String(s.run).includes('agent-trusted-evidence.mjs')));
assert.equal(y.jobs.collect['timeout-minutes'],8);
const handoff=y.jobs.collect.steps.find(s=>String(s.run).includes('agent-operational-investigation-handoff.mjs'));
assert.equal(handoff.if,"${{ steps.gate.outputs.ready == 'true' }}");
const deny={codeWrites:false,modelCalls:false,ownerApproval:false,merge:false,productionRelease:false};
const fake={schema:'tradehq-offline-repair-review-v1',status:'OWNER_INVESTIGATION_REQUIRED',
  producer:{runId:123,monitorSha:'a'.repeat(40),targetSha:'b'.repeat(40)},
  authorization:deny,cases:[{candidateId:'repair-v1-'+'c'.repeat(24),path:'/about',
    symptom:'LAYOUT_OVERFLOW',evidenceDigest:'d'.repeat(64),
    status:'OWNER_INVESTIGATION_REQUIRED',rootCauseVerified:false,repairRisk:'HIGH',
    draftManifest:{draftPrCreated:false},authorization:deny}]};
const summary=summarizeInvestigation(fake);
const incident=investigationOutcome(fake);
assert.equal(incident.failJob,true,"A verified incident must be surfaced as a failing evidence run");
assert.equal(incident.summary.sha256,summary.sha256);
assert.match(incident.jobSummary,/Owner investigation required/);
assert.match(incident.jobSummary,/\\/about/);
assert.match(incident.jobSummary,/No repair PR or release has been authorized/);
assert.doesNotMatch(incident.jobSummary,/PRIVATE_|authoriz(?:e|ed) release/i);
assert.equal(summary.draftPrCreated,false);
assert.equal(summary.ownerReviewRequired,true);
assert.ok(Object.values(summary.authorization).every(v=>v===false));
assert.throws(()=>summarizeInvestigation({...fake,cases:[{...fake.cases[0],rootCauseVerified:true}]}));
assert.throws(()=>summarizeInvestigation({...fake,authorization:{...deny,codeWrites:true}}));
const healthyPacket={...fake,cases:[],status:'NO_VERIFIED_INCIDENT'};
const healthy=summarizeInvestigation(healthyPacket);
const healthyOutcome=investigationOutcome(healthyPacket);
assert.equal(healthyOutcome.failJob,false,"A verified healthy cycle must remain green");
assert.match(healthyOutcome.jobSummary,/No verified incident/);
assert.doesNotMatch(healthyOutcome.jobSummary,/\| Public route \| Symptom/);
assert.equal(healthy.ownerReviewRequired,false);
assert.equal(healthy.status,'NO_VERIFIED_INCIDENT');
assert.deepEqual(healthy.cases,[]);
assert.ok(Object.values(healthy.authorization).every(v=>v===false));
for(const mutate of [
  x=>x.authorization={},
  x=>delete x.authorization.merge,
  x=>x.authorization.unexpected=false,
  x=>x.producer.runId='123',
  x=>x.producer.monitorSha='not-a-sha',
  x=>x.producer.targetSha='not-a-sha',
  x=>x.status='NO_VERIFIED_INCIDENT',
  x=>x.cases[0].authorization={},
  x=>x.cases[0].path='/../auth',
  x=>x.cases[0].path='//untrusted.example',
  x=>x.cases[0].candidateId='forged',
  x=>x.cases[0].evidenceDigest='missing',
  x=>x.cases[0].symptom='<script>',
  x=>x.cases.push(structuredClone(x.cases[0])),
]){
  const input=structuredClone(fake);mutate(input);
  assert.throws(()=>summarizeInvestigation(input));
  assert.throws(()=>investigationOutcome(input));
}
assert.throws(()=>summarizeInvestigation({...fake,cases:[]}));
assert.throws(()=>investigationOutcome({...fake,cases:[]}));

assert.ok(!/pull_request_target|issues: write|contents: write|GEMINI_API_KEY/.test(raw));
console.log('Read-only monitoring workflow: complete producer, idea-only skip, least privilege and no autonomous writes passed.');

await import('./verify-evidence-ci-wait.mjs');
