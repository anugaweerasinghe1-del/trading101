import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { createGitHubWorkloadVerifier,assertCurrentGitHubJob,githubIdentityRejectionDiagnostic } from './agent-github-workload-identity.mjs';
const crypto=globalThis.crypto||webcrypto,now=Date.parse('2026-10-13T13:44:00Z'),at=now/1000;
const repo='anugaweerasinghe1-del/trading101',path='.github/workflows/tradehq-verified-evidence.yml',sha='a'.repeat(40);
const pair=await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
const publicKey={...await crypto.subtle.exportKey('jwk',pair.publicKey),kid:'fixture-key-1',alg:'RS256',use:'sig'};
const claims={iss:'https://token.actions.githubusercontent.com',aud:'tradehq-repair-identity-v1',sub:'repo:'+repo+':ref:refs/heads/main',
  repository:repo,repository_id:'1130435580',repository_owner:'anugaweerasinghe1-del',repository_owner_id:'297117529',repository_visibility:'public',
  ref:'refs/heads/main',ref_type:'branch',event_name:'workflow_run',runner_environment:'github-hosted',
  workflow_ref:repo+'/'+path+'@refs/heads/main',workflow_sha:sha,sha,run_id:'38404898111',run_attempt:'1',check_run_id:'115321838458',
  jti:'disposable-token-id-0123456789',iat:at,nbf:at,exp:at+300};
const encode=value=>Buffer.from(JSON.stringify(value)).toString('base64url');
async function signed(payload=claims,header={alg:'RS256',typ:'JWT',kid:'fixture-key-1'}) {
  const text=encode(header)+'.'+encode(payload);
  return text+'.'+Buffer.from(await crypto.subtle.sign('RSASSA-PKCS1-v1_5',pair.privateKey,new TextEncoder().encode(text))).toString('base64url');
}
function fixture({keys={keys:[publicKey]},mutate=()=>{},clock=()=>now,fetchStatus=200,admin=false}={}) {
  const reads=[],calls=[];
  const main={name:'main',protected:true,commit:{sha}};
  const run={id:38404898111,run_attempt:1,workflow_id:381133473,path,head_sha:sha,head_branch:'main',event:'workflow_run',status:'in_progress',
    repository:{id:1130435580,owner:{id:297117529}},head_repository:{id:1130435580}};
  const jobs={total_count:1,jobs:[{name:'collect',run_id:38404898111,head_sha:sha,status:'in_progress',started_at:new Date(now-30000).toISOString(),
    check_run_url:'https://api.github.com/repos/'+repo+'/check-runs/115321838458'}]};
  mutate({main,run,jobs});
  const verify=createGitHubWorkloadVerifier({activationMode:admin?'live-admin-code-queue':'identity-only-fixture',clock,
    fetcher:async(url,options)=>{calls.push(url);assert.equal(url,'https://token.actions.githubusercontent.com/.well-known/jwks');assert.equal(options.redirect,'error');assert.ok(options.signal);return new Response(JSON.stringify(keys),{status:fetchStatus});},
    readGitHub:async(url,options)=>{reads.push(url);assert.ok(options.signal);if(url==='/branches/main')return structuredClone(main);
      if(url==='/actions/runs/38404898111')return structuredClone(run);
      if(url==='/actions/runs/38404898111/attempts/1/jobs?per_page=20')return structuredClone(jobs);
      throw Error('Unexpected credential-free fixture path');},
  });
  return {verify,reads,calls};
}
assert.throws(()=>createGitHubWorkloadVerifier());
const good=fixture(),token=await signed(),principal=await good.verify(token);
assert.ok(Object.isFrozen(principal) && Object.isFrozen(principal.authorization));assert.ok(Object.values(principal.authorization).every(value=>value===false));
assert.equal(good.reads.length,4);assert.equal(good.calls.length,1);assert.ok(!JSON.stringify(principal).includes(token));
assert.equal(principal.expiresAt,now+60000);assert.equal(assertCurrentGitHubJob(principal,{mainSha:sha,clock:()=>now}),principal);
assert.throws(()=>assertCurrentGitHubJob(JSON.parse(JSON.stringify(principal)),{mainSha:sha,clock:()=>now}));
assert.throws(()=>assertCurrentGitHubJob(principal,{mainSha:'b'.repeat(40),clock:()=>now}));
assert.throws(()=>assertCurrentGitHubJob(principal,{mainSha:sha,clock:()=>now+60001}));
const immutable=await fixture().verify(await signed({...claims,sub:'repo:anugaweerasinghe1-del@297117529/trading101@1130435580:ref:refs/heads/main'}));
assert.equal(immutable.repositoryId,1130435580,'Both documented subject formats retain immutable ID enforcement');
for(const fields of [{job_workflow_ref:repo+'/'+path+'@refs/heads/main'},
  {job_workflow_ref:repo+'/'+path+'@refs/heads/main',job_workflow_sha:sha}]) {
  const self=await fixture().verify(await signed({...claims,...fields}));
  assert.equal(self.mainSha,sha);assert.ok(Object.values(self.authorization).every(x=>x===false));
}
// Published GitHub example: iat1632493567, nbf1632492967, exp1632493867.
// These are public protocol example offsets, not a captured production token.
const documentedTime=await fixture().verify(await signed({...claims,nbf:at-600}));
assert.equal(documentedTime.expiresAt,now+60000,'Earlier not-before never extends the local issued-at freshness limit');
assert.throws(()=>assertCurrentGitHubJob(documentedTime,{mainSha:sha,clock:()=>now+60000}));
let rejected=0;
async function deny(token,f=fixture()) {
  await assert.rejects(()=>f.verify(token),error=>{
    assert.equal(error.message,'Workload identity rejected; no repair or release authority granted');
    const diagnostic=githubIdentityRejectionDiagnostic(error);
    assert.ok(Object.isFrozen(diagnostic)&&Object.isFrozen(diagnostic.failedChecks));
    assert.match(diagnostic.stage,/^[A-Z_]+$/);
    assert.ok(!JSON.stringify(diagnostic).includes(token));return true;
  });rejected++;return f;
}
assert.equal(githubIdentityRejectionDiagnostic(Object.assign(Error('private-sentinel'),{stage:'TOKEN_FORMAT'})),null,
  'Only this verifier can brand a safe diagnostic');
const privateScopeToken=await signed({...claims,sub:'private-subject-sentinel',repository_owner:'private-owner-sentinel'});
await assert.rejects(()=>fixture().verify(privateScopeToken),error=>{
  assert.deepEqual(githubIdentityRejectionDiagnostic(error),{stage:'CLAIM_SCOPE',failedChecks:['subject','owner']});
  assert.ok(!JSON.stringify(githubIdentityRejectionDiagnostic(error)).includes('sentinel'));return true;
});
const earlyNotBefore=await signed({...claims,nbf:at-601});
await assert.rejects(()=>fixture().verify(earlyNotBefore),error=>{
  assert.deepEqual(githubIdentityRejectionDiagnostic(error),{stage:'TOKEN_TIME',failedChecks:['notBeforeSkew']});return true;
});
for(const change of [{iss:'https://attacker.invalid'},{aud:['tradehq-repair-identity-v1']},{sub:'repo:'+repo+':pull_request'},
  {repository:'attacker/trading101'},{repository_id:'1'},{repository_owner_id:'1'},{repository_owner:'attacker'},{repository_visibility:'private'},
  {ref:'refs/heads/feature'},{ref_type:'tag'},{event_name:'pull_request_target'},{event_name:'pull_request'},{runner_environment:'self-hosted'},
  {workflow_ref:repo+'/.github/workflows/other.yml@refs/heads/main'},{workflow_sha:'b'.repeat(40)},
  {job_workflow_ref:repo+'/.github/workflows/foreign.yml@refs/heads/main'},
  {job_workflow_ref:'attacker/trading101/'+path+'@refs/heads/main'},
  {job_workflow_ref:repo+'/'+path+'@refs/heads/foreign'},
  {job_workflow_sha:sha},{job_workflow_ref:repo+'/'+path+'@refs/heads/main',job_workflow_sha:'b'.repeat(40)},
  {job_workflow_ref:repo+'/'+path+'@refs/heads/main',job_workflow_sha:null},{job_workflow_ref:null},
  {iat:at-60},{iat:at-61},{iat:at+1},{nbf:at+1},{nbf:at-601},
  {nbf:at-600.5},{nbf:String(at-600)},{iat:at-60,nbf:at-600},{exp:at},{exp:at+901},
  {jti:'tiny'},{run_attempt:'0'},{run_id:'9007199254740992'},{check_run_id:'0'}]) {
  const f=await deny(await signed({...claims,...change}));assert.equal(f.reads.length,0,'Out-of-scope signed claim cannot query repo metadata');
}
for(const header of [{alg:'none',typ:'JWT',kid:'fixture-key-1'},{alg:'HS256',typ:'JWT',kid:'fixture-key-1'},
  {alg:'RS256',typ:'JWT',kid:'fixture-key-1',jku:'https://attacker.invalid/keys'},
  {alg:'RS256',typ:'JWT',kid:'fixture-key-1',jwk:publicKey},{alg:'RS256',typ:'JWT',kid:'fixture-key-1',crit:['other']}]) {
  const f=await deny(await signed(claims,header));assert.equal(f.calls.length,0);
}
for(const options of [{keys:{keys:[publicKey,publicKey]}},{keys:{keys:[]}},{keys:{keys:[{...publicKey,kty:'oct'}]}},
  {keys:{keys:[{...publicKey,d:'private-sentinel'}]}},{keys:{keys:[{...publicKey,n:'AQAB'}]}},{fetchStatus:302},{fetchStatus:503}])await deny(token,fixture(options));
const pieces=token.split('.');pieces[1]=encode({...claims,sha:'b'.repeat(40)});const forged=await deny(pieces.join('.'));assert.equal(forged.reads.length,0);
await deny(token+'=');await deny('x'.repeat(22001));await deny('bad.token');
for(const mutate of [({main})=>{main.protected=false;},({main})=>{main.commit.sha='b'.repeat(40);},
  ({run})=>{run.run_attempt=2;},({run})=>{run.workflow_id=1;},({run})=>{run.path='.github/workflows/other.yml';},
  ({run})=>{run.status='completed';},({run})=>{run.repository.owner.id=1;},({run})=>{run.head_repository.id=1;},
  ({jobs})=>{jobs.total_count=21;},({jobs})=>{jobs.jobs.push({...jobs.jobs[0]});jobs.total_count=2;},
  ({jobs})=>{jobs.jobs[0].name='untrusted';},({jobs})=>{jobs.jobs[0].status='completed';},
  ({jobs})=>{jobs.jobs[0].check_run_url='https://attacker.invalid/check-runs/115321838458';}])await deny(token,fixture({mutate}));
let mainReads=0;
const changed=createGitHubWorkloadVerifier({activationMode:'identity-only-fixture',clock:()=>now,
  fetcher:async()=>new Response(JSON.stringify({keys:[publicKey]})),
  readGitHub:async path=>{
    if(path==='/branches/main')return {name:'main',protected:true,commit:{sha:++mainReads===1?sha:'b'.repeat(40)}};
    if(path==='/actions/runs/38404898111')return {id:38404898111,run_attempt:1,workflow_id:381133473,path:'.github/workflows/tradehq-verified-evidence.yml',head_sha:sha,head_branch:'main',event:'workflow_run',status:'in_progress',repository:{id:1130435580,owner:{id:297117529}},head_repository:{id:1130435580}};
    return {total_count:1,jobs:[{name:'collect',run_id:38404898111,head_sha:sha,status:'in_progress',started_at:new Date(now-30000).toISOString(),check_run_url:'https://api.github.com/repos/'+repo+'/check-runs/115321838458'}]};
  }});
await assert.rejects(()=>changed(token));rejected++;
console.log('GITHUB_WORKLOAD_IDENTITY_PASS: actual disposable RSA signatures, fixed GitHub key origin, current immutable repo/workflow/job/main bindings, time/algorithm/key/claim/metadata rejection ('+rejected+' cases), private token omission and unimportable short-lived principal. Default disabled; no real OIDC token, credential, endpoint or write authority.');

// Separate, explicit authority boundary for the owner-submitted admin queue.
const queuePath='.github/workflows/tradehq-code-agent.yml';
const queueClaims={...claims,aud:'tradehq-admin-code-queue-v1',event_name:'schedule',workflow_ref:repo+'/'+queuePath+'@refs/heads/main'};
function queueFixture(change=()=>{}) {
 return fixture({admin:true,mutate:s=>{s.run.workflow_id=380190833;s.run.path=queuePath;s.run.event='schedule';s.jobs.jobs[0].name='Admin code queue worker';change(s);}});
}
const queued=await queueFixture().verify(await signed(queueClaims));
assert.equal(queued.jobName,'Admin code queue worker');assert.equal(queued.workflowId,380190833);
await assert.rejects(fixture().verify(await signed(queueClaims)));
await assert.rejects(queueFixture().verify(await signed(claims)));
await assert.rejects(queueFixture().verify(await signed({...queueClaims,event_name:'pull_request'})));
await assert.rejects(queueFixture().verify(await signed({...queueClaims,run_attempt:'2'})));
await assert.rejects(queueFixture(s=>{s.jobs.jobs[0].name='untrusted-job';}).verify(await signed(queueClaims)));
await assert.rejects(queueFixture(s=>{s.main.protected=false;}).verify(await signed(queueClaims)));
await assert.rejects(queueFixture().verify(await signed({...queueClaims,job_workflow_ref:repo+'/other.yml@refs/heads/main'})));
const reported=await queueFixture(s=>{s.jobs.jobs[0].name='Admin code queue result';}).verify(await signed(queueClaims));
assert.equal(reported.jobName,'Admin code queue result');
console.log('ADMIN_QUEUE_IDENTITY_PASS: signed audience/workflow/job separation, protected current main, first-attempt-only, hostile/reusable workflow and PR rejection; no persistent worker credential.');
