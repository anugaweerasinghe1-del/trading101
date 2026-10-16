import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import {processRejectedProposal} from './agent-code-review.mjs';
import {createAdminCodeQueue} from '../supabase/functions/_shared/adminCodeQueue.ts';
const owner='a1700000-1111-4111-8111-000000000001',other='b1700000-1111-4111-8111-000000000001';
const key='fixture-admin-only',sha='a'.repeat(40),head='b'.repeat(40),runId=388900001;
const db=new PGlite();
await db.exec(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE ROLE service_role;CREATE SCHEMA auth;
 CREATE TABLE auth.users(id uuid PRIMARY KEY);INSERT INTO auth.users VALUES('${owner}');
 CREATE FUNCTION public.tradehq_repair_registered_owner() RETURNS uuid LANGUAGE sql AS $$SELECT '${owner}'::uuid$$;`);
await db.exec(readFileSync('supabase/migrations/20261016092040_admin_code_queue.sql','utf8'));
await db.exec(readFileSync('supabase/migrations/20261016100921_native_code_learning.sql','utf8'));
await db.exec(readFileSync('supabase/migrations/20261016102258_code_worker_recovery.sql','utf8'));
await db.exec(readFileSync('supabase/migrations/20261016110754_admin_proposal_review.sql','utf8'));
let userId=owner,jobName='Admin code queue worker',worker=true,rpcs=0;
let proposalState='open',proposalHead=head,missingPatch=false;
let validation='success',workerRunId=runId,nativeBase=sha,nativeStatus='completed';
const rpc=async(action:string,who:string|null,data:Record<string,unknown>)=>{
 rpcs++;const r=await db.query<{data:unknown}>('SELECT public.tradehq_admin_code_queue($1,$2,$3::jsonb) AS data',[action,who,JSON.stringify(data)]);return r.rows[0].data;
};
const handler=createAdminCodeQueue({getKey:()=>key,getOwner:async()=>owner,
 getUser:async token=>token==='fixture-owner-session'?{id:userId,aud:'authenticated',email_confirmed_at:'2026-10-01'}:null,
 verifyWorker:async token=>{if(!worker||token!=='signed-fixture')throw Error();return {runId:workerRunId,mainSha:sha,jobName};},rpc,allow:async()=>true,
 readGitHub:async path=>/^\/actions\/runs\/\d+$/.test(path)?{id:Number(path.split('/').at(-1)),workflow_id:380190833,path:'.github/workflows/tradehq-code-agent.yml',head_sha:nativeBase,head_branch:'main',status:nativeStatus,repository:{id:1130435580},head_repository:{id:1130435580}}:path.includes('/files?')?[{filename:'src/pages/About.tsx',status:'modified',patch:missingPatch?undefined:'@@ -1 +1 @@\n-<h1>About</h1>\n+<h1 className="text-3xl">About</h1>',additions:1,deletions:1}]:path.startsWith('/pulls/')?{changed_files:1,user:{login:'github-actions[bot]',id:41898282},state:proposalState,merged:false,draft:true,base:{ref:'main'},head:{ref:'ai/admin-'+request.id,sha:proposalHead,repo:{id:1130435580}}}
 :{total_count:1,jobs:[{name:'Admin code independent validation',status:'completed',conclusion:validation}]},
});
async function call(data:unknown,{admin=key,token='fixture-owner-session',oidc=''}={}){
 const r=await handler(new Request('https://fixture.invalid',{method:'POST',headers:{'content-type':'application/json','x-admin-key':admin,authorization:'Bearer '+token,'x-github-oidc':oidc},body:JSON.stringify(data)}));
 return {status:r.status,body:await r.json()};
}
assert.equal((await call({action:'list'},{admin:'wrong'})).status,401);assert.equal(rpcs,0);
userId=other;assert.equal((await call({action:'list'})).status,403);assert.equal(rpcs,0);userId=owner;
assert.equal((await call({action:'submit',requestKey:crypto.randomUUID(),prompt:'Here is my api_key=privatefixturevalue'})).status,400);
const requestKey=crypto.randomUUID(),payload={action:'submit',requestKey,prompt:'Improve the About heading spacing on narrow screens while preserving all content.'};
const submitted=await call(payload);assert.equal(submitted.status,200);const request=submitted.body.data;assert.equal(request.status,'queued');
assert.equal((await call(payload)).body.data.id,request.id,'Lost-response retry is idempotent');
assert.equal((await call({...payload,requestKey:crypto.randomUUID()})).body.code,'REQUEST_ALREADY_ACTIVE');
assert.equal((await call({action:'worker-claim'},{oidc:'wrong'})).status,401);
const race=await Promise.all([call({action:'worker-claim'},{oidc:'signed-fixture'}),call({action:'worker-claim'},{oidc:'signed-fixture'})]);
assert.equal(race.filter(x=>x.body.data!==null).length,1,'One durable claim per run');
assert.equal((await call({action:'cancel',id:request.id})).body.code,'REQUEST_NOT_QUEUED');
const completion={action:'worker-finish',id:request.id,status:'proposed',headSha:head,prNumber:165,resultCode:'PROPOSAL_CREATED'};
assert.equal((await call(completion,{oidc:'signed-fixture'})).body.data.status,'proposed');
assert.equal((await call(completion,{oidc:'signed-fixture'})).body.code,'INVALID_TRANSITION');
jobName='Admin code queue result';
assert.equal((await call({action:'worker-claim'},{oidc:'signed-fixture'})).status,400);
assert.equal((await call({action:'worker-validation',id:request.id,headSha:'c'.repeat(40)},{oidc:'signed-fixture'})).body.code,'INVALID_TRANSITION');
assert.equal((await call({action:'worker-validation',id:request.id,headSha:head},{oidc:'signed-fixture'})).body.data.status,'verified');
assert.equal((await call({...payload,requestKey:crypto.randomUUID()})).body.code,'DAILY_CODE_LIMIT');
const listed=(await call({action:'list'})).body.data;
assert.deepEqual(listed.events.map((x:{event:string})=>x.event).reverse(),['OWNER_REQUEST_QUEUED','WORKER_CLAIMED','LEARNING_CONTEXT_APPLIED','PROPOSAL_CREATED','INDEPENDENT_CHECKS_PASSED']);
assert.equal(listed.learning.outcomes,1);assert.equal(listed.learning.files[0].passes,1);assert.equal(listed.learningDecisions[0].context.outcomes,0);
assert.ok(!JSON.stringify(listed).includes('fixture-owner-session'));assert.ok(!JSON.stringify(listed).includes(key));
// Real owner review receipt and native worker closure, with isolated GitHub transport.
assert.equal((await call({action:'reject',id:request.id,headSha:head,viewId:crypto.randomUUID()})).body.code,'REVIEW_EXPIRED');
missingPatch=true;assert.equal((await call({action:'review',id:request.id,headSha:head})).body.code,'REVIEW_DIFF_UNAVAILABLE');missingPatch=false;
let viewed=(await call({action:'review',id:request.id,headSha:head})).body.data;
assert.equal(viewed.files[0].path,'src/pages/About.tsx');assert.equal(viewed.receipt.patch_digest.length,64);
await db.exec("UPDATE tradehq_automation.code_reviews SET viewed_at=now()-interval '11 minutes'");
assert.equal((await call({action:'reject',id:request.id,headSha:head,viewId:viewed.receipt.view_id})).body.code,'REVIEW_EXPIRED');
viewed=(await call({action:'review',id:request.id,headSha:head})).body.data;
proposalHead='c'.repeat(40);assert.equal((await call({action:'reject',id:request.id,headSha:head,viewId:viewed.receipt.view_id})).body.code,'PROPOSAL_NOT_VERIFIED');proposalHead=head;
const decline={action:'reject',id:request.id,headSha:head,viewId:viewed.receipt.view_id};
assert.equal((await call(decline)).body.data.close_state,'pending');assert.equal((await call(decline)).body.data.close_state,'pending');
jobName='Admin code queue worker';workerRunId=runId+50;let closeWrites=0;
const nativeQueue=async(action:string,payload={})=>{const r=await call({action,...payload},{oidc:'signed-fixture'});assert.equal(r.status,200,JSON.stringify(r.body));return r.body.data;};
const nativeGitHub=async(path:string,method='GET',payload?:unknown)=>{
 if(path==='/branches/main')return {protected:true,commit:{sha}};
 if(method==='PATCH'){assert.equal(path,'/pulls/165');assert.deepEqual(payload,{state:'closed'});closeWrites++;proposalState='closed';throw Error('Fixture lost response after successful closure');}
 return {user:{login:'github-actions[bot]',id:41898282},draft:true,state:proposalState,base:{ref:'main'},head:{ref:'ai/admin-'+request.id,sha:head,repo:{id:1130435580}}};
};
assert.equal((await processRejectedProposal({queue:nativeQueue,github:nativeGitHub,mainSha:sha})).status,'closed');
assert.equal(closeWrites,1);assert.equal((await processRejectedProposal({queue:nativeQueue,github:nativeGitHub,mainSha:sha})).status,'idle');
const reviewHistory=(await call({action:'list'})).body.data;
assert.equal(reviewHistory.reviews[0].close_state,'closed');
assert.equal(reviewHistory.events.filter((e: any)=>e.event==='OWNER_PROPOSAL_REJECTED').length,1);
assert.equal(reviewHistory.events.filter((e: any)=>e.event==='GITHUB_CLOSED_CONFIRMED').length,1);
assert.equal(reviewHistory.learning.outcomes,1,'Owner decline must preserve the real validation label');
for(const scenario of ['stale','already-closed','main-changed']){
 let writes=0;const payloads: any[]=[];
 const result=processRejectedProposal({mainSha:sha,queue:async(action:string,payload:unknown)=>{
  if(action==='worker-review-claim')return {request_id:request.id,head_sha:head,pr_number:165};
  payloads.push(payload);return {close_state:scenario==='stale'?'blocked':'closed'};
 },github:async(path:string,method='GET')=>{
  if(method!=='GET'){writes++;throw Error('Unexpected write');}
  if(path==='/branches/main')return {protected:true,commit:{sha:'c'.repeat(40)}};
  return {user:{login:'github-actions[bot]',id:41898282},draft:true,state:scenario==='already-closed'?'closed':'open',base:{ref:'main'},head:{ref:'ai/admin-'+request.id,sha:scenario==='stale'?'c'.repeat(40):head,repo:{id:1130435580}}};
 }});
 if(scenario==='main-changed')await assert.rejects(result,/Main changed/);else assert.equal((await result).status,scenario==='stale'?'blocked':'closed');
 assert.equal(writes,0);assert.equal(payloads.length,scenario==='main-changed'?0:1);
}
console.log('ADMIN_PROPOSAL_REVIEW_PASS: exact diff receipt, expiry/stale-head denial, idempotent owner decline, real worker helper closes only the bound draft, lost-response recovery and independently confirmed closure. Disposable SQL/GitHub fixtures; zero real model or GitHub writes.');
for(const role of ['anon','authenticated','service_role']){
 await db.exec('SET ROLE '+role);
 await assert.rejects(db.query('SELECT * FROM tradehq_automation.code_requests'));
 await db.exec('RESET ROLE');
}
await db.exec('SET ROLE anon');await assert.rejects(db.query("SELECT public.tradehq_admin_code_queue('list',NULL,'{}')"));await db.exec('RESET ROLE');
// Independent fixture outcomes exercise adaptation, reset and expiry without provider calls.
for(let i=0;i<3;i++){
 const id=crypto.randomUUID();
 await db.query(`INSERT INTO tradehq_automation.code_requests(id,owner_id,request_key,prompt,status,run_id,base_sha,head_sha,pr_number)
 VALUES($1,$2,$3,'Disposable validation failure fixture','validation_failed',$4,$5,$6,166)`,[id,owner,crypto.randomUUID(),runId+i+1,sha,head]);
 await db.query(`INSERT INTO tradehq_automation.code_validation_memory(request_id,files,conclusion,observed_at) VALUES($1,'["src/pages/About.tsx"]','failure',clock_timestamp())`,[id]);
}
let memory=(await call({action:'list'})).body.data.learning;
assert.equal(memory.outcomes,4);assert.deepEqual(memory.pausedPaths,['src/pages/About.tsx']);
assert.equal(memory.files[0].smoothedFailureRate,0.6667);
await db.query("UPDATE tradehq_automation.code_validation_memory SET observed_at=clock_timestamp()+interval '1 second' WHERE request_id=$1",[request.id]);
assert.deepEqual((await call({action:'list'})).body.data.learning.pausedPaths,[],'A later passing result clears the consecutive-failure pause');
// Canceled checks cannot become a negative training label.
await db.exec("UPDATE tradehq_automation.code_validation_memory SET conclusion='canceled' WHERE conclusion='failure'");
memory=(await call({action:'list'})).body.data.learning;assert.equal(memory.outcomes,1);assert.deepEqual(memory.pausedPaths,[]);
await db.exec("UPDATE tradehq_automation.code_validation_memory SET observed_at=now()-interval '31 days'");
assert.equal((await call({action:'list'})).body.data.learning.outcomes,0);
const orphanId=crypto.randomUUID(),orphanRun=runId+100;
await db.query(`INSERT INTO tradehq_automation.code_requests(id,owner_id,request_key,prompt,status,run_id,base_sha,head_sha,pr_number)
 VALUES($1,$2,$3,'Disposable interrupted result callback fixture','proposed',$4,$5,$6,166)`,[orphanId,owner,crypto.randomUUID(),orphanRun,sha,head]);
await db.query(`INSERT INTO tradehq_automation.code_validation_memory(request_id,files) VALUES($1,'["src/pages/About.tsx"]')`,[orphanId]);
await db.query(`INSERT INTO tradehq_automation.code_worker_runs(run_id,base_sha,request_id,status) VALUES($1,$2,$3,'proposed')`,[orphanRun,sha,orphanId]);
jobName='Admin code queue worker';workerRunId=orphanRun+1;nativeBase='c'.repeat(40);
assert.equal((await call({action:'worker-claim'},{oidc:'signed-fixture'})).body.code,'VALIDATION_UNAVAILABLE','Foreign original head cannot unblock a proposal');
nativeBase=sha;nativeStatus='in_progress';
assert.equal((await call({action:'worker-claim'},{oidc:'signed-fixture'})).body.data,null);
assert.equal((await call({action:'list'})).body.data.requests.find((r: any)=>r.id===orphanId).status,'proposed','Active validation is not guessed');
nativeStatus='completed';workerRunId++;
assert.equal((await call({action:'worker-claim'},{oidc:'signed-fixture'})).body.data,null);
let recovered=(await call({action:'list'})).body.data;
assert.equal(recovered.requests.find((r: any)=>r.id===orphanId).status,'verified');
assert.equal(recovered.workerRuns.find((r: any)=>r.run_id===orphanRun).status,'verified');
assert.equal(recovered.workerRuns.find((r: any)=>r.run_id===workerRunId).status,'idle');
assert.equal(recovered.learning.outcomes,1,'Only the independently recovered outcome enters current memory');
assert.equal(recovered.events.filter((e: any)=>e.request_id===orphanId&&e.event==='NATIVE_RESULT_RECONCILED').length,1);
workerRunId++;await call({action:'worker-claim'},{oidc:'signed-fixture'});
recovered=(await call({action:'list'})).body.data;
assert.equal(recovered.events.filter((e: any)=>e.request_id===orphanId&&e.event==='NATIVE_RESULT_RECONCILED').length,1,'Recovery is idempotent; the request is never re-executed');
const canceledId=crypto.randomUUID(),canceledRun=orphanRun+20;
await db.query(`INSERT INTO tradehq_automation.code_requests(id,owner_id,request_key,prompt,status,run_id,base_sha,head_sha,pr_number)
 VALUES($1,$2,$3,'Disposable cancelled native validation fixture','proposed',$4,$5,$6,167)`,[canceledId,owner,crypto.randomUUID(),canceledRun,sha,head]);
await db.query(`INSERT INTO tradehq_automation.code_validation_memory(request_id,files) VALUES($1,'["src/pages/About.tsx"]')`,[canceledId]);
validation='cancelled';workerRunId++;
assert.equal((await call({action:'worker-claim'},{oidc:'signed-fixture'})).status,200,'GitHub double-l cancelled conclusion is understood');
recovered=(await call({action:'list'})).body.data;
assert.equal(recovered.requests.find((r: any)=>r.id===canceledId).status,'validation_failed');
assert.equal(recovered.learning.outcomes,1,'Canceled validations unblock the queue but are not learning failures');
await db.close();
console.log('ADMIN_CODE_RECOVERY_PASS: interrupted callback reconciled from the original native run, wrong-head and unfinished runs denied, one recovered label/event, idle check-ins and no request replay. Isolated SQL/native transport fixtures only.');
console.log('ADMIN_CODE_QUEUE_PASS: real SQL lifecycle, duplicate/lost-response idempotency, concurrent claim replay denial, owner/session denial, independent native-result binding and durable event history. Provider/job identities are fixtures; no live model or GitHub write.');
