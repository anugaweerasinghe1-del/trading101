import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { collectIncidentFeedback, FEEDBACK_PREFIX, FEEDBACK_TITLE, FEEDBACK_HISTORY_LIMITS, recommendForVerifiedFinding } from './agent-incident-feedback.mjs';
import { trainIncidentOutcomeModel, LEARNING_LIMITS } from './agent-incident-learning.mjs';
import { createGithubEvidenceReader, EVIDENCE_REPOSITORY, EVIDENCE_REPOSITORY_ID } from './github-evidence-reader.mjs';

const now=Date.parse('2026-10-13T10:00:00.000Z'), sha='a'.repeat(40), mainSha='b'.repeat(40);
const root='https://api.github.com/repos/'+EVIDENCE_REPOSITORY;
const owner={id:297117529,login:'anugaweerasinghe1-del',type:'User'};
const deny={codeWrites:false,modelCalls:false,ownerApproval:false,draftPrCreation:false,merge:false,productionRelease:false};
function fixture(symptom='BLANK_ROOT') {
  const repo={id:EVIDENCE_REPOSITORY_ID,full_name:EVIDENCE_REPOSITORY,private:false,owner:structuredClone(owner)};
  const finding={candidateId:'repair-v1-'+'c'.repeat(24),path:'/',symptom,evidenceDigest:'d'.repeat(64),status:'OWNER_INVESTIGATION_REQUIRED'};
  const body={schema:'tradehq-operational-investigation-handoff-v1',monitorRunId:10,monitorSha:sha,targetSha:sha,
    status:'OWNER_INVESTIGATION_REQUIRED',cases:[finding],ownerReviewRequired:true,draftPrCreated:false,authorization:deny};
  const record={...body,sha256:createHash('sha256').update(JSON.stringify(body)).digest('hex')};
  const run={id:20,workflow_id:381133473,path:'.github/workflows/tradehq-verified-evidence.yml',event:'workflow_run',
    repository:structuredClone(repo),head_repository:structuredClone(repo),head_branch:'main',head_sha:sha,run_attempt:1,status:'completed',conclusion:'failure',
    run_started_at:'2026-10-12T09:00:00Z',updated_at:'2026-10-12T09:02:00Z'};
  const job={id:30,name:'collect',run_id:20,head_sha:sha,status:'completed',conclusion:'failure',
    started_at:'2026-10-12T09:00:00Z',completed_at:'2026-10-12T09:01:00Z',
    steps:[{name:'Record bounded read-only incident or no-incident handoff',status:'completed',conclusion:'failure'}]};
  const target={runId:99,sha:mainSha,path:'/',symptom};
  const baseline=recommendForVerifiedFinding(target,{version:1,records:[]},now);
  const feedback={evidenceRunId:20,jobId:30,monitorRunId:10,candidateId:finding.candidateId,
    evidenceDigest:finding.evidenceDigest,action:baseline.recommendations[0].action,outcome:'reported_failed'};
  const comment={id:40,user:owner,created_at:'2026-10-12T09:03:00Z',updated_at:'2026-10-12T09:03:00Z',body:FEEDBACK_PREFIX+JSON.stringify(feedback)};
  return {repo,main:{protected:true,commit:{sha:mainSha}},issue:{id:50,number:60,title:FEEDBACK_TITLE,user:owner},
    comments:[comment],run,job,record,feedback,target,calls:[],mutate:null,
    logs:'2026-10-12T09:00:30.1234567Z TRADEHQ_READONLY_INCIDENT_HANDOFF_V1 '+JSON.stringify(record)+'\nPRIVATE_LOG_SENTINEL'};
}
function readerFor(f) {
  const seen=new Map();
  return createGithubEvidenceReader({token:'PRIVATE_TOKEN_SENTINEL',now:()=>now,fetchImpl:async(url,options)=>{
    assert.equal(options.method,'GET'); assert.equal(options.redirect,'manual');
    assert.ok(url.startsWith(root) && !url.includes('PRIVATE_TOKEN_SENTINEL'));
    f.calls.push(url);
    const path=new URL(url).pathname.slice(new URL(root).pathname.length);
    const visit=(seen.get(path)||0)+1; seen.set(path,visit);
    let data;
    if(path==='') data=f.repo;
    else if(path==='/branches/main') data=f.main;
    else if(path==='/issues') data=f.issue ? [f.issue] : [];
    else if(path==='/issues/60') data=f.issue;
    else if(path==='/issues/60/comments') data=f.comments;
    else if(path==='/actions/runs/20') data=f.run;
    else if(path==='/compare/'+sha+'...'+mainSha) data={status:'ahead',base_commit:{sha},merge_base_commit:{sha}};
    else if(path==='/actions/runs/20/attempts/1/jobs') data={total_count:1,jobs:[f.job]};
    else if(path==='/actions/jobs/30/logs') return new Response(f.logs);
    else throw Error('Unexpected fixture request: '+path);
    data=structuredClone(data);
    if(f.mutate) data=f.mutate(path,visit,data);
    return new Response(JSON.stringify(data));
  }});
}
const read=f=>collectIncidentFeedback({mainSha,reader:readerFor(f),now});
let repeats=0;
for(const symptom of ['HTTP_429','REQUEST_OR_RENDER_FAILED','BLANK_ROOT','BUNDLE_UNAVAILABLE']) {
  const f=fixture(symptom), result=await read(f);
  assert.equal(result.sources[0].observationTrust,'AUTHENTICATED_WORKFLOW_HANDOFF');
  assert.equal(result.sources[0].outcomeTrust,'OWNER_REPORTED_UNVERIFIED');
  assert.equal(result.confirmedRepairOutcomes,0);
  const advice=recommendForVerifiedFinding(f.target,result.memory,now);
  repeats+=Number(advice.recommendations.some(r=>r.action===f.feedback.action));
  assert.equal(advice.recommendations.length,1);
  assert.equal(advice.rootCauseVerified,false);
  assert.ok(Object.values(advice.authorization).every(x=>x===false));
  assert.ok(!JSON.stringify(result).includes('PRIVATE_'));
}
assert.equal(repeats,0);
const changeFeedback=(f,patch)=>{f.comments[0].body=FEEDBACK_PREFIX+JSON.stringify({...f.feedback,...patch});};
let f=fixture(); f.issue=null;
assert.equal((await read(f)).status,'NO_FEEDBACK_JOURNAL');
f=fixture(); f.comments[0].user={...owner,id:999};
assert.equal((await read(f)).memory.records.length,0,'Another author cannot introduce feedback');
f=fixture(); changeFeedback(f,{outcome:'reported_success'});
assert.equal((await read(f)).confirmedRepairOutcomes,0,'Reported success is not a verified repair');
f=fixture(); f.comments.push({...f.comments[0],id:41});
assert.equal((await read(f)).memory.records.length,1,'Identical reports do not amplify outcomes');
const rejectionCases=[
  f=>{f.main.protected=false;},
  f=>{f.repo.owner.id=1;},
  f=>{f.issue.user={...owner,id:1};},
  f=>{f.comments[0].updated_at='2026-10-12T09:04:00Z';},
  f=>{f.comments[0].created_at=f.comments[0].updated_at='2026-10-14T09:03:00Z';},
  f=>{changeFeedback(f,{verified:true});},
  f=>{changeFeedback(f,{action:'MERGE'});},
  f=>{changeFeedback(f,{outcome:'verified_success'});},
  f=>{changeFeedback(f,{candidateId:'repair-v1-'+'e'.repeat(24)});},
  f=>{changeFeedback(f,{evidenceDigest:'e'.repeat(64)});},
  f=>{changeFeedback(f,{jobId:999});},
  f=>{changeFeedback(f,{monitorRunId:999});},
  f=>{f.comments[0].created_at=f.comments[0].updated_at='2026-10-12T09:00:00Z';},
  f=>{f.comments[0].body+='\nfree text';},
  f=>{f.run.head_repository.id=999;},
  f=>{f.run.workflow_id++;},
  f=>{f.run.event='pull_request';},
  f=>{f.run.head_branch='feature';},
  f=>{f.run.status='in_progress';},
  f=>{f.run.conclusion='cancelled';},
  f=>{f.job.run_id=999;},
  f=>{f.job.steps=[];},
  f=>{f.job.steps[0].conclusion='success';},
  f=>{f.logs=f.logs.replace(/"sha256":"[a-f0-9]+"/,'"sha256":"'+'0'.repeat(64)+'"');},
  f=>{f.logs+='\n'+f.logs;},
  f=>{f.logs=f.logs.replace(/^\S+ /,'echo ');},
  f=>{f.logs=f.logs.replace('09:00:30','10:00:30');},
  f=>{f.comments.push({...f.comments[0],id:41,body:FEEDBACK_PREFIX+JSON.stringify({...f.feedback,outcome:'reported_success'})});},
  f=>{f.comments=Array.from({length:101},(_,i)=>({...f.comments[0],id:100+i}));},
  f=>{f.mutate=(path,visit,data)=>path==='/branches/main'&&visit===2?{...data,commit:{sha}}:data;},
  f=>{f.mutate=(path,visit,data)=>path==='/issues/60/comments'&&visit===2?[]:data;},
  f=>{f.mutate=(path,visit,data)=>path==='/actions/runs/20'&&visit===2?{...data,run_attempt:2}:data;},
  f=>{f.mutate=(path,visit,data)=>path.startsWith('/compare/')?{...data,status:'behind'}:data;},
];
for(const [i,mutate] of rejectionCases.entries()) {const f=fixture(); mutate(f); await assert.rejects(()=>read(f),undefined,'Rejected forged/stale/conflicting case '+i);}
const dynamic=recommendForVerifiedFinding({runId:99,sha:mainSha,symptom:'BLANK_ROOT',path:'/courses/slug'},{version:1,records:[]},now);
assert.equal(dynamic.status,'ABSTAIN_ROUTE_OUTSIDE_MEMORY_SCHEMA');
assert.deepEqual(dynamic.recommendations,[]);
// Integration capacity: authenticating complete native histories must admit
// enough distinct monitor runs to reach the trainer's unchanged minimum.
assert.ok(FEEDBACK_HISTORY_LIMITS.runs>=LEARNING_LIMITS.minimumRuns);
for (const maxRequests of [0,-1,97,NaN,Infinity]) assert.throws(()=>createGithubEvidenceReader({maxRequests}));
const seed=fixture(),historyRuns=new Map(),historyJobs=new Map(),nativeComments=[];
for(let i=0;i<LEARNING_LIMITS.minimumRuns;i++) {
  const run=structuredClone(seed.run),job=structuredClone(seed.job),record=structuredClone(seed.record);
  run.id=20+i;job.id=30+i;job.run_id=run.id;record.monitorRunId=10+i;
  const {sha256,...body}=record;
  record.sha256=createHash('sha256').update(JSON.stringify(body)).digest('hex');
  const logs='2026-10-12T09:00:30.000Z TRADEHQ_READONLY_INCIDENT_HANDOFF_V1 '+JSON.stringify(record);
  historyRuns.set(run.id,{run,job,logs});historyJobs.set(job.id,logs);
  for (const [j,action] of ['INSPECT_BROWSER_RENDER_EVIDENCE','INSPECT_PUBLIC_ASSET_EVIDENCE'].entries()) {
    const at=new Date(Date.parse('2026-10-12T09:03:00.000Z')+i*3600_000).toISOString();
    nativeComments.push({...seed.comments[0],id:40+i*2+j,created_at:at,updated_at:at,
      body:FEEDBACK_PREFIX+JSON.stringify({...seed.feedback,evidenceRunId:run.id,jobId:job.id,
        monitorRunId:record.monitorRunId,action,outcome:j?'reported_success':'reported_failed'})});
  }
}
const capacityReader=createGithubEvidenceReader({token:'PRIVATE_TOKEN_SENTINEL',now:()=>now,
  maxRequests:FEEDBACK_HISTORY_LIMITS.requests,fetchImpl:async(url,request)=>{
    assert.equal(request.method,'GET');assert.equal(request.redirect,'manual');assert.ok(url.startsWith(root));
    const path=new URL(url).pathname.slice(new URL(root).pathname.length);
    let data;
    if(path==='')data=seed.repo;
    else if(path==='/branches/main')data=seed.main;
    else if(path==='/issues')data=[seed.issue];
    else if(path==='/issues/60')data=seed.issue;
    else if(path==='/issues/60/comments')data=nativeComments;
    else if(path.startsWith('/compare/'))data={status:'ahead',base_commit:{sha},merge_base_commit:{sha}};
    else if(/^\/actions\/runs\/\d+$/.test(path))data=historyRuns.get(Number(path.split('/').at(-1)))?.run;
    else if(/^\/actions\/runs\/\d+\/attempts\/1\/jobs$/.test(path))data={total_count:1,jobs:[historyRuns.get(Number(path.split('/')[3]))?.job]};
    else if(/^\/actions\/jobs\/\d+\/logs$/.test(path))return new Response(historyJobs.get(Number(path.split('/')[3])));
    else throw Error('Unexpected capacity fixture request');
    return new Response(JSON.stringify(data));
  }});
const collected=await collectIncidentFeedback({mainSha,reader:capacityReader,now});
const learned=trainIncidentOutcomeModel({memoryJson:JSON.stringify(collected.memory),now:new Date(now).toISOString()});
assert.equal(learned.status,'SHADOW_MODEL_TRAINED','Real reader limits must allow the minimum training dataset');
assert.equal(learned.distinctRuns,10);
assert.ok(capacityReader.requestCount()>50 && capacityReader.requestCount()<=FEEDBACK_HISTORY_LIMITS.requests);
assert.equal(learned.confirmedRepairOutcomes,0);
assert.ok(Object.values(learned.authorization).every(v=>v===false));
console.log(JSON.stringify({dataset:'SYNTHETIC_AUTHENTICATED_HISTORY_TO_TRAINER',nativeRuns:10,
  readRequests:capacityReader.requestCount(),trainingStatus:learned.status,productionAccuracyEstablished:false}));
console.log(JSON.stringify({dataset:'ISOLATED_SYNTHETIC_GITHUB_REPLAYS',scenarios:4,repeatedFailedRecommendations:repeats,adversarialCases:rejectionCases.length,confirmedRepairOutcomes:0,modelCalls:0,productionWrites:0}));
console.log('Authenticated history, owner-reported feedback, immutable bindings, replay suppression and no-authority boundaries passed.');
