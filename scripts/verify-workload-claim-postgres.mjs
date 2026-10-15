/** Called only inside the fixed, already verified disposable PostgreSQL fixture.
 * RSA signatures are real; tokens, GitHub metadata and incidents are synthetic.
 * This module has no URL, network, production connection or live activation.
 */
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createGitHubWorkloadVerifier } from './agent-github-workload-identity.mjs';
import { createWorkloadClaimTransaction } from './agent-workload-claim-transaction.mjs';
export async function verifyWorkloadClaimPostgres({a,b,observer,connect,base}) {
  let c=connect(),main=base,sequence=0;
  const identity=(await a.unsafe('SELECT current_database() AS db,current_user AS owner'))[0];
  assert.deepEqual(identity,{db:'tradehq_control_test',owner:'tradehq_test'});
  const pair=await webcrypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,
    publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
  const key={...await webcrypto.subtle.exportKey('jwk',pair.publicKey),kid:'disposable-workload-key',alg:'RS256',use:'sig'};
  const repo='anugaweerasinghe1-del/trading101',path='.github/workflows/tradehq-verified-evidence.yml';
  const runId=123456789,checkId=987654321,digest='c'.repeat(64),candidate='repair-v1-'+'a'.repeat(24);
  const verify=createGitHubWorkloadVerifier({activationMode:'identity-only-fixture',
    fetcher:async()=>new Response(JSON.stringify({keys:[key]})),
    readGitHub:async url=>{
      if(url==='/branches/main')return {name:'main',protected:true,commit:{sha:main}};
      if(url==='/actions/runs/'+runId)return {id:runId,run_attempt:1,workflow_id:381133473,path,head_sha:base,
        head_branch:'main',event:'workflow_run',status:'in_progress',repository:{id:1130435580,owner:{id:297117529}},head_repository:{id:1130435580}};
      assert.equal(url,'/actions/runs/'+runId+'/attempts/1/jobs?per_page=20');
      return {total_count:1,jobs:[{name:'collect',run_id:runId,head_sha:base,status:'in_progress',
        started_at:new Date(Date.now()-3600_000).toISOString(),check_run_url:'https://api.github.com/repos/'+repo+'/check-runs/'+checkId}]};
    }});
  async function issue(age=0) {
    const at=Math.floor(Date.now()/1000)-age;
    const claims={iss:'https://token.actions.githubusercontent.com',aud:'tradehq-repair-identity-v1',sub:'repo:'+repo+':ref:refs/heads/main',
      repository:repo,repository_id:'1130435580',repository_owner:'anugaweerasinghe1-del',repository_owner_id:'297117529',repository_visibility:'public',
      ref:'refs/heads/main',ref_type:'branch',event_name:'workflow_run',runner_environment:'github-hosted',
      workflow_ref:repo+'/'+path+'@refs/heads/main',workflow_sha:base,sha:base,run_id:String(runId),run_attempt:'1',check_run_id:String(checkId),
      jti:'disposable-workload-token-'+String(++sequence),iat:at,nbf:at-600,exp:at+300};
    const b64=x=>Buffer.from(JSON.stringify(x)).toString('base64url');
    const message=b64({alg:'RS256',typ:'JWT',kid:key.kid})+'.'+b64(claims);
    const token=message+'.'+Buffer.from(await webcrypto.subtle.sign('RSASSA-PKCS1-v1_5',pair.privateKey,new TextEncoder().encode(message))).toString('base64url');
    return {token,principal:await verify(token)};
  }
  const db=client=>({transaction:callback=>client.begin(tx=>callback({query:async(q,p)=>({rows:await tx.unsafe(q,p)})}))});
  const make=client=>createWorkloadClaimTransaction({database:db(client),readMainSha:async()=>main,activationMode:'disposable-fixture'});
  const input=()=>({candidateId:candidate,baseSha:base,evidenceDigest:digest,source:'browser',symptom:'HEADING_READABILITY',
    observedAt:new Date(Date.now()-1000).toISOString(),generation:0});
  const count=async table=>(await observer.unsafe('SELECT count(*)::int AS n FROM tradehq_repair_control.'+table))[0].n;
  const empty=async()=>{for(const table of ['candidates','workload_receipts','transition_log','audit'])assert.equal(await count(table),0,table+' must roll back atomically');};
  async function reset() {
    main=base;
    await a.unsafe('TRUNCATE tradehq_repair_control.workload_receipts,tradehq_repair_control.approval_receipts,tradehq_repair_control.candidates,tradehq_repair_control.transition_log,tradehq_repair_control.audit,tradehq_repair_control.policy_log RESTART IDENTITY');
    await a.unsafe('UPDATE tradehq_repair_control.policy SET stopped=false,generation=0 WHERE id');
    await a.unsafe('INSERT INTO tradehq_repair_control.policy_log(generation,stopped) VALUES(0,false)');
  }
  const settle=promise=>promise.then(value=>({ok:true,value}),()=>({ok:false}));
  async function locked(pid) {
    const until=Date.now()+4000;
    while(Date.now()<until){
      if((await observer.unsafe('SELECT wait_event_type FROM pg_stat_activity WHERE pid=$1',[pid]))[0]?.wait_event_type==='Lock')return;
      await new Promise(r=>setTimeout(r,20));
    }
    throw Error('Workload transaction did not wait on the actual policy lock');
  }
  try {
    // Earlier reconnect tests replace this session, so its explicit disposable
    // context must be restored after the independently checked fixture identity.
    await a.unsafe("SET tradehq.offline_control_prototype='explicit-local-test'");
    await a.unsafe(readFileSync('docs/proposals/repair-workload-receipts.sql','utf8'));
    for(const client of [c])await client.unsafe("SET statement_timeout='10s'; SET lock_timeout='8s'");
    const bPid=(await b.unsafe('SELECT pg_backend_pid() AS pid'))[0].pid;
    const cPid=(await c.unsafe('SELECT pg_backend_pid() AS pid'))[0].pid;
    assert.notEqual(bPid,cPid);
    assert.throws(()=>createWorkloadClaimTransaction());
    await reset();const first=await issue();
    await assert.rejects(()=>make(b)(JSON.parse(JSON.stringify(first.principal)),input()));await empty();
    // A committed owner stop must defeat an already authenticated waiting job.
    await a.unsafe('BEGIN');await a.unsafe('SELECT tradehq_repair_control.set_stop(true)');
    const stopped=settle(make(b)(first.principal,input()));await locked(bPid);await a.unsafe('COMMIT');
    assert.equal((await stopped).ok,false);assert.equal(await count('candidates'),0);assert.equal(await count('workload_receipts'),0);
    await reset();const next=await issue();
    await a.unsafe('BEGIN');await a.unsafe('SELECT tradehq_repair_control.set_stop(true); SELECT tradehq_repair_control.set_stop(false)');
    const changed=settle(make(b)(next.principal,input()));await locked(bPid);await a.unsafe('COMMIT');assert.equal((await changed).ok,false);
    assert.equal(await count('candidates'),0);assert.equal(await count('workload_receipts'),0);
    // Real wall-clock expiry while waiting; no mock clock can keep it alive.
    await reset();const expiring=await issue(57);
    await a.unsafe('BEGIN');await a.unsafe('SELECT id FROM tradehq_repair_control.policy FOR UPDATE');
    const expired=settle(make(b)(expiring.principal,input()));await locked(bPid);
    while(Date.now()<=expiring.principal.expiresAt+20)await new Promise(r=>setTimeout(r,20));
    await a.unsafe('COMMIT');assert.equal((await expired).ok,false);await empty();
    await reset();const moving=await issue();
    await a.unsafe('BEGIN');await a.unsafe('SELECT id FROM tradehq_repair_control.policy FOR UPDATE');
    const moved=settle(make(b)(moving.principal,input()));await locked(bPid);main='f'.repeat(40);
    await a.unsafe('COMMIT');assert.equal((await moved).ok,false);await empty();
    // Both independent sessions actually queue; exactly one consumes the token.
    await reset();const racing=await issue();
    await a.unsafe('BEGIN');await a.unsafe('SELECT id FROM tradehq_repair_control.policy FOR UPDATE');
    const left=settle(make(b)(racing.principal,input())),right=settle(make(c)(racing.principal,input()));
    await locked(bPid);await locked(cPid);await a.unsafe('COMMIT');
    const outcomes=await Promise.all([left,right]);assert.equal(outcomes.filter(x=>x.ok).length,1);
    assert.ok(Object.values(outcomes.find(x=>x.ok).value.authorization).every(x=>x===false));
    assert.equal(await count('candidates'),1);assert.equal(await count('workload_receipts'),1);assert.equal(await count('transition_log'),1);
    const stored=(await observer.unsafe('SELECT token_digest,base_sha,evidence_digest,run_id,run_attempt,check_id,generation FROM tradehq_repair_control.workload_receipts'))[0];
    assert.equal(stored.token_digest,racing.principal.tokenDigest);assert.equal(stored.base_sha,base);assert.equal(stored.evidence_digest,digest);
    assert.deepEqual([Number(stored.run_id),stored.run_attempt,Number(stored.check_id),Number(stored.generation)],[runId,1,checkId,0]);
    assert.ok(!JSON.stringify(stored).includes(racing.token));
    // Advance ONLY disposable fixture history to isolate receipt replay from
    // the existing one-candidate/daily budget. Never do this in production.
    await a.unsafe('SELECT tradehq_repair_control.set_stop(true); SELECT tradehq_repair_control.set_stop(false)');
    await a.unsafe("UPDATE tradehq_repair_control.candidates SET claimed_at=claimed_at-interval '25 hours',lease_until=lease_until-interval '25 hours'");
    await c.end();c=connect();const reverified=await verify(racing.token);
    await assert.rejects(()=>make(c)(reverified,{...input(),candidateId:'repair-v1-'+'b'.repeat(24),source:'manual',symptom:'LAYOUT_OVERFLOW',generation:2}));
    assert.equal(await count('candidates'),1);assert.equal(await count('workload_receipts'),1);assert.equal(await count('transition_log'),1,
      'Unique token receipt rolls back a new candidate and its audit after reconnect');
    await reset();const rollback=await issue();
    const failing={transaction:callback=>b.begin(async tx=>{await callback({query:async(q,p)=>({rows:await tx.unsafe(q,p)})});throw Error('Isolated fixture commit failure');})};
    await assert.rejects(()=>createWorkloadClaimTransaction({database:failing,readMainSha:async()=>main,activationMode:'disposable-fixture'})(rollback.principal,input()));await empty();
    // Strict private capacity, populated with explicitly synthetic fixture rows.
    await a.unsafe("INSERT INTO tradehq_repair_control.candidates (id,fingerprint,source,symptom,base_sha,evidence_digest,generation,status,claimed_at,lease_until) SELECT 'repair-v1-'||lpad(n::text,24,'0'),encode(sha256(convert_to('fixture-'||n,'UTF8')),'hex'),'browser','HEADING_READABILITY',$1,$2,0,'stopped',statement_timestamp()-interval '25 hours',statement_timestamp()-interval '24 hours 30 minutes' FROM generate_series(1,100) n",[base,digest]);
    await a.unsafe("INSERT INTO tradehq_repair_control.workload_receipts (token_digest,candidate_id,base_sha,evidence_digest,run_id,run_attempt,check_id,generation,expires_at,consumed_at) SELECT encode(sha256(convert_to('receipt-'||n,'UTF8')),'hex'),'repair-v1-'||lpad(n::text,24,'0'),$1,$2,1,1,1,0,clock_timestamp()-interval '24 hours',clock_timestamp()-interval '24 hours 30 seconds' FROM generate_series(1,100) n",[base,digest]);
    const full=await issue();await assert.rejects(()=>make(b)(full.principal,input()));assert.equal(await count('workload_receipts'),100);assert.equal(await count('candidates'),100);
    for(const role of ['anon','authenticated','service_role']){
      await b.unsafe('SET ROLE '+role);await assert.rejects(b.unsafe('SELECT * FROM tradehq_repair_control.workload_receipts'),/permission denied/);await b.unsafe('RESET ROLE');
    }
    await reset();const copied=await issue();let release,entered;
    const wait=new Promise(r=>{release=r;}),started=new Promise(r=>{entered=r;});let reads=0;
    const gated=createWorkloadClaimTransaction({database:db(b),readMainSha:async()=>{if(++reads===1){entered();await wait;}return main;},activationMode:'disposable-fixture'});
    const mutable=input(),original=mutable.candidateId,pending=gated(copied.principal,mutable);await started;
    mutable.candidateId='repair-v1-'+'d'.repeat(24);mutable.baseSha='f'.repeat(40);release();assert.equal((await pending).claimed,true);
    assert.equal((await observer.unsafe('SELECT id FROM tradehq_repair_control.candidates'))[0].id,original);
    console.log('WORKLOAD_CLAIM_POSTGRES_PASS: actual RSA fixture identity, private-brand denial, distinct-session stop/generation/main races, real-time expiry after lock wait, one committed claim/receipt/audit, durable token replay rejection after reconnect with atomic rollback, receipt capacity, denied app roles and input snapshot. Synthetic metadata/incidents only; no production worker, grants, request or authority.');
  } finally {
    await Promise.allSettled([a,b,c].map(client=>client.unsafe('ROLLBACK')));
    await c.end({timeout:1});
  }
}
