/** Disposable PostgreSQL 17 fixture only. Never accepts Supabase or arbitrary database URLs. */
import assert from 'node:assert/strict';
import postgres from 'postgres';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { offlineOwnerFixture } from './verify-owner-approval-offline.mjs';
import { createRepairApprovalTransaction } from './agent-repair-approval-transaction.mjs';
import { createDisposableWorkerFixture } from './repair-worker-crash-fixture.mjs';
export function disposableControlUrl(env) {
  assert.equal(env.TRADEHQ_DISPOSABLE_CONTROL_TEST,'explicit-ci-fixture','Disposable fixture opt-in required.');
  const url=new URL(env.TRADEHQ_CONTROL_TEST_URL || '');
  assert.ok(url.protocol==='postgres:' && url.hostname==='127.0.0.1' && url.port==='5432'
    && url.username==='tradehq_test' && url.password==='tradehq_ci_only' && url.pathname==='/tradehq_control_test'
    && !url.search && !url.hash,'Only the fixed disposable loopback fixture is accepted.');
  return url.href;
}
export async function verifyPostgresControls(env=process.env) {
  const url=disposableControlUrl(env);
  const options={max:1,prepare:false,connect_timeout:5,idle_timeout:0,onnotice:()=>{}};
  let a=postgres(url,options),b=postgres(url,options),observer=postgres(url,options);
  const clients=()=>[a,b,observer];
  const id='repair-v1-'+'a'.repeat(24),other='repair-v1-'+'b'.repeat(24),head='b'.repeat(40),digest='c'.repeat(64);
  const workerFixture=createDisposableWorkerFixture({env,candidateId:id,evidenceDigest:digest});
  const base=workerFixture.baseSha;
  let approvalDigest=null,approvalExpiry=new Date(Date.now()+60000).toISOString();
  const claim=async(client,candidate=id,source='browser',symptom='HEADING_READABILITY')=>(await client.unsafe(
    'SELECT tradehq_repair_control.claim($1,$2,$3,$4,$5,clock_timestamp(),$6) AS r',[candidate,source,symptom,base,digest,'LOW']))[0].r;
  const review=async(client,action,sha=head,receiptHash=approvalDigest)=>(await client.unsafe(
    "SELECT tradehq_repair_control.review($1,$2,$3,$4,$5,$6,$7) AS r",[action,id,sha,base,digest,approvalExpiry,receiptHash]))[0].r;
  const stop=async(client,value)=>(await client.unsafe('SELECT tradehq_repair_control.set_stop($1) AS r',[value]))[0].r;
  const locked=async(pid)=>{
    const deadline=Date.now()+4000;
    while(Date.now()<deadline){
      const row=(await observer.unsafe('SELECT wait_event_type FROM pg_stat_activity WHERE pid=$1',[pid]))[0];
      if(row?.wait_event_type==='Lock')return;
      await new Promise(r=>setTimeout(r,25));
    }
    throw Error('Independent session did not wait for the policy row lock.');
  };
  try {
    const identity=(await a.unsafe("SELECT current_database() AS db,current_user AS owner,current_setting('server_version_num')::int AS version"))[0];
    assert.ok(identity.db==='tradehq_control_test' && identity.owner==='tradehq_test' && identity.version>=170000 && identity.version<180000,'Wrong disposable server identity.');
    const objects=(await a.unsafe("SELECT count(*)::int AS count FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname NOT IN ('pg_catalog','information_schema') AND n.nspname NOT LIKE 'pg_toast%' AND c.relkind IN ('r','v','m','f')"))[0];
    assert.equal(objects.count,0,'Database is not an empty disposable fixture; no mutations allowed.');
    assert.equal((await a.unsafe("SELECT count(*)::int AS count FROM pg_roles WHERE rolname IN ('anon','authenticated','service_role')"))[0].count,0,'Existing application roles found; fixture refused.');
    for(const client of clients())await client.unsafe("SET statement_timeout='10s'; SET lock_timeout='8s';");
    await a.unsafe('CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;');
    const sql=readFileSync('docs/proposals/repair-control-prototype.sql','utf8');
    await assert.rejects(a.unsafe(sql),/explicit local test context/);await a.unsafe('ROLLBACK');
    await a.unsafe("SET tradehq.offline_control_prototype='explicit-local-test';");await a.unsafe(sql);
    await a.unsafe(readFileSync('docs/proposals/repair-approval-receipts.sql','utf8'));
    assert.equal((await claim(a)).reason,'STOPPED');await stop(a,false);
    // Kill a real runner process while its SQL claim is still uncommitted.
    // Neither an attempt nor its accepted-transition audit may survive.
    const interrupted=workerFixture.start('uncommitted');
    await interrupted.waitFor('SESSION');await interrupted.waitFor('CLAIM_UNCOMMITTED');
    assert.equal((await observer.unsafe('SELECT count(*)::int AS n FROM tradehq_repair_control.candidates'))[0].n,0);
    await interrupted.kill();
    // Waiting for the policy lock also proves the dead connection released it.
    await a.unsafe('BEGIN');await a.unsafe('SELECT id FROM tradehq_repair_control.policy FOR UPDATE');await a.unsafe('COMMIT');
    assert.equal((await observer.unsafe('SELECT count(*)::int AS n FROM tradehq_repair_control.candidates'))[0].n,0);
    assert.equal((await observer.unsafe('SELECT count(*)::int AS n FROM tradehq_repair_control.transition_log'))[0].n,0);
    assert.equal((await observer.unsafe("SELECT count(*)::int AS n FROM tradehq_repair_control.audit WHERE code='CLAIMED'"))[0].n,0);
    // The same candidate can now make its first committed claim. Kill the actual
    // runner after it creates/re-reads a real isolated Git commit, before checks
    // or publication. Its attempt must remain consumed across process restart.
    const committed=workerFixture.start('committed');
    await committed.waitFor('SESSION');const ready=await committed.waitFor('ISOLATED_COMMIT_READY');
    workerFixture.verifyCommit(ready.headSha);await committed.kill();workerFixture.assertUnpublished();
    const reconnect=workerFixture.start('reconnect');
    await reconnect.waitFor('RECONNECT_DENIED');await reconnect.kill();workerFixture.assertUnpublished();
    assert.deepEqual((await observer.unsafe('SELECT status,attempts FROM tradehq_repair_control.candidates WHERE id=$1',[id]))[0],
      {status:'claimed',attempts:1},'Committed attempt survives actual process death and replay denial');
    console.log('WORKER_CRASH_POSTGRES_PASS: actual SIGKILL before SQL commit leaves no candidate/audit; SIGKILL after committed claim and isolated Git commit retains one attempt; a fresh runner process denies replay with zero draft publication attempts. Incident/reproduction/GitHub evidence is synthetic; production worker remains disabled.');
    const bPid=(await b.unsafe('SELECT pg_backend_pid() AS pid'))[0].pid;
    const aPid=(await a.unsafe('SELECT pg_backend_pid() AS pid'))[0].pid;assert.notEqual(aPid,bPid);
    // The observer proves the second session really waits, rather than one client queue.
    await a.unsafe('BEGIN');await a.unsafe('SELECT id FROM tradehq_repair_control.policy FOR UPDATE');
    const waiting=claim(b,other,'manual','LAYOUT_OVERFLOW');await locked(bPid);await a.unsafe('COMMIT');
    assert.equal((await waiting).reason,'ACTIVE_CANDIDATE');
    const receiptGeneration=Number((await a.unsafe('SELECT generation FROM tradehq_repair_control.policy'))[0].generation);
    const signed=offlineOwnerFixture({candidateId:id,baseSha:base,headSha:head,evidenceDigest:digest,generation:receiptGeneration});
    approvalDigest=signed.approvalDigest;approvalExpiry=signed.expiresAt;
    assert.equal((await a.unsafe("SELECT count(*)::int AS count FROM tradehq_repair_control.candidates WHERE status IN ('claimed','validated','approved')"))[0].count,1);
    assert.equal((await review(a,'validate')).reason,'VALIDATED');
    assert.equal((await review(a,'approve',head,null)).reason,'APPROVAL_REJECTED');
    assert.equal((await review(a,'approve')).reason,'APPROVED');
    assert.equal((await review(b,'check',head,'d'.repeat(64))).reason,'REVIEW_CHECK_BLOCKED');
    assert.equal((await a.unsafe("SELECT approval_digest FROM tradehq_repair_control.transition_log WHERE code='APPROVED'"))[0].approval_digest,approvalDigest);
    assert.equal((await review(b,'check')).reviewValid,true);
    // Stop takes the same lock; once committed, independent review cannot revive consent.
    await a.unsafe('BEGIN');assert.equal((await stop(a,true)).reason,'OWNER_STOP');
    const stoppedReview=review(b,'check');await locked(bPid);await a.unsafe('COMMIT');assert.equal((await stoppedReview).reason,'STOPPED');
    const stoppedReconnect=workerFixture.start('reconnect');
    await stoppedReconnect.waitFor('RECONNECT_DENIED');await stoppedReconnect.kill();workerFixture.assertUnpublished();
    await stop(a,false);assert.equal((await review(b,'check')).reason,'INVALID_EVIDENCE');
    assert.equal((await claim(b)).reason,'DUPLICATE');assert.equal((await claim(b,other,'manual','LAYOUT_OVERFLOW')).reason,'RATE_LIMIT');
    await a.end();a=postgres(url,options);assert.equal((await claim(a)).reason,'DUPLICATE','Attempt history survives independent client restart.');
    // Transaction rollback must undo an uncommitted owner transition.
    await a.unsafe('BEGIN');await stop(a,true);await a.unsafe('ROLLBACK');
    assert.equal((await observer.unsafe('SELECT stopped FROM tradehq_repair_control.policy'))[0].stopped,false);
    assert.deepEqual((await observer.unsafe('SELECT generation,stopped FROM tradehq_repair_control.policy_log ORDER BY seq')).map(r=>[Number(r.generation),r.stopped]),
      [[0,true],[1,false],[2,true],[3,false]],'Stop/resume transitions are durable, ordered and rollback-atomic across sessions');
    // Real PostgreSQL recovery after an interrupted lease remains owner-only and replay-safe.
    await a.unsafe("UPDATE tradehq_repair_control.candidates SET claimed_at=claimed_at-interval '25 hours',lease_until=lease_until-interval '25 hours'");
    assert.equal((await claim(a,other,'manual','LAYOUT_OVERFLOW')).reason,'CLAIMED');
    const generation=(await a.unsafe("SELECT generation FROM tradehq_repair_control.policy WHERE id=true"))[0].generation;
    const recover=async (client,proof=digest,gen=generation)=>(await client.unsafe(
      'SELECT tradehq_repair_control.recover_expired($1,$2,$3,$4) AS r',[other,base,proof,gen]))[0].r;
    assert.equal((await recover(a)).reason,'LEASE_NOT_EXPIRED');
    assert.equal((await recover(b,'d'.repeat(64))).reason,'INVALID_EVIDENCE');
    assert.equal((await recover(b,digest,Number(generation)+1)).reason,'INVALID_EVIDENCE');
    await a.unsafe("UPDATE tradehq_repair_control.candidates SET claimed_at=claimed_at-interval '31 minutes',lease_until=lease_until-interval '31 minutes' WHERE id=$1",[other]);
    assert.equal((await recover(b)).reason,'LEASE_EXPIRED');
    assert.equal((await recover(a)).reason,'LEASE_NOT_EXPIRED');
    assert.equal((await claim(a,other,'manual','LAYOUT_OVERFLOW')).reason,'DUPLICATE');
    assert.equal((await a.unsafe("SELECT status FROM tradehq_repair_control.candidates WHERE id=$1",[other]))[0].status,'stopped');
    assert.deepEqual((await a.unsafe('SELECT code FROM tradehq_repair_control.transition_log ORDER BY seq')).map(r=>r.code),
      ['CLAIMED','VALIDATED','APPROVED','CLAIMED','LEASE_EXPIRED'],'Durable audit must be identical across sessions');
    for(const role of ['anon','authenticated','service_role']){
      await b.unsafe('SET ROLE '+role);
      await assert.rejects(b.unsafe('SELECT tradehq_repair_control.set_stop(false)'),/permission denied/);
      await assert.rejects(b.unsafe('SELECT * FROM tradehq_repair_control.candidates'),/permission denied/);
      await assert.rejects(b.unsafe('SELECT * FROM tradehq_repair_control.policy_log'),/permission denied/);
      await assert.rejects(b.unsafe('SELECT * FROM tradehq_repair_control.transition_log'),/permission denied/);
      await assert.rejects(b.unsafe('SELECT * FROM tradehq_repair_control.approval_receipts'),/permission denied/);
      await b.unsafe('RESET ROLE');
    }
    // Exercise the new transaction adapter over a real independent connection.
    const transactionDb={transaction:callback=>b.begin(tx=>callback({query:async(query,params)=>({rows:await tx.unsafe(query,params)})}))};
    const commit=createRepairApprovalTransaction({database:transactionDb,activationMode:'disposable-fixture'});
    const blockedId='repair-v1-'+'d'.repeat(24);
    await a.unsafe("UPDATE tradehq_repair_control.candidates SET claimed_at=claimed_at-interval '25 hours',lease_until=lease_until-interval '25 hours'");
    assert.equal((await claim(a,blockedId,'browser','LAYOUT_OVERFLOW')).reason,'CLAIMED');
    const makeBinding=async(candidate)=>{
      const generation=Number((await a.unsafe('SELECT generation FROM tradehq_repair_control.policy'))[0].generation);
      const signed=offlineOwnerFixture({candidateId:candidate,ownerId:'c1700000-1111-4111-8111-000000000001',
        baseSha:base,headSha:head,evidenceDigest:digest,generation});
      return {candidateId:candidate,ownerId:signed.ownerId,approvalId:signed.approvalId,
        baseSha:base,headSha:head,evidenceDigest:digest,generation,
        receiptDigest:signed.approvalDigest,expiresAt:signed.expiresAt};
    };
    const blockedBinding=await makeBinding(blockedId);
    await a.unsafe('BEGIN');await stop(a,true);
    // Attach a rejection observer before releasing the lock to avoid an
    // unhandled promise rejection masking the actual serialization result.
    const waitingApproval=commit(blockedBinding).then(()=>({accepted:true}),()=>({accepted:false}));
    await locked(bPid);await a.unsafe('COMMIT');assert.equal((await waitingApproval).accepted,false);
    assert.equal((await observer.unsafe('SELECT count(*)::int AS n FROM tradehq_repair_control.approval_receipts'))[0].n,0);
    await stop(a,false);
    await a.unsafe("UPDATE tradehq_repair_control.candidates SET claimed_at=claimed_at-interval '25 hours',lease_until=lease_until-interval '25 hours'");
    const acceptedId='repair-v1-'+'e'.repeat(24);
    assert.equal((await claim(a,acceptedId,'manual','HEADING_READABILITY')).reason,'CLAIMED');
    const binding=await makeBinding(acceptedId);
    const ack=await commit(binding);
    assert.equal(ack.committed,true);assert.ok(Object.values(ack.authorization).every(x=>x===false));
    await assert.rejects(()=>commit(binding),'The real database rejects receipt replay');
    assert.equal((await observer.unsafe('SELECT count(*)::int AS n FROM tradehq_repair_control.approval_receipts'))[0].n,1);
    console.log('PASS disposable PostgreSQL 17: distinct-session row-lock waiting, one active candidate, stop/review serialization, replay/frequency persistence, transaction rollback and denied app roles. No production connection or release authority.');
    console.log('PASS signed approval transaction adapter: actual policy-lock wait, stop-winning race, rollback/no receipt, accepted atomic approval and durable replay rejection.');
  } finally {
    await workerFixture.close();
    await Promise.allSettled(clients().map(async client=>{await client.unsafe('ROLLBACK');}));
    await Promise.allSettled(clients().map(client=>client.end({timeout:1})));
  }
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href){
  try{await verifyPostgresControls();}catch{console.error('Disposable PostgreSQL controls blocked: fixture identity, connection or safety invariant failed. No production URL accepted.');process.exitCode=1;}
}
