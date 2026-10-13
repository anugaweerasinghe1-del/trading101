import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { generateKeyPairSync,sign } from 'node:crypto';
import { createServerRepairApproval } from './agent-repair-approval-server.mjs';
import { createRepairApprovalTransaction } from './agent-repair-approval-transaction.mjs';
import { ownerReceiptBytes } from './agent-owner-approval-offline.mjs';
const ownerId='c1700000-1111-4111-8111-000000000001',secret='isolated-test-master-key-32-characters';
const id='repair-v1-'+'a'.repeat(24),base='a'.repeat(40),head='b'.repeat(40),digest='c'.repeat(64);
async function fixture() {
  const db=new PGlite();
  await db.exec('CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;');
  await db.exec("SET tradehq.offline_control_prototype='explicit-local-test'");
  await db.exec(readFileSync('docs/proposals/repair-control-prototype.sql','utf8'));
  await db.exec(readFileSync('docs/proposals/repair-approval-receipts.sql','utf8'));
  await db.exec('SELECT tradehq_repair_control.set_stop(false)');
  const now=Date.now();
  const claim=(await db.query('SELECT tradehq_repair_control.claim($1,$2,$3,$4,$5,$6,$7) AS r',
    [id,'browser','LAYOUT_OVERFLOW',base,digest,new Date(now).toISOString(),'LOW'])).rows[0].r;
  assert.equal(claim.reason,'CLAIMED');
  const generation=Number((await db.query('SELECT generation FROM tradehq_repair_control.policy')).rows[0].generation);
  const {publicKey,privateKey}=generateKeyPairSync('ed25519');
  const receipt={schema:'tradehq-owner-approval-v1',decision:'approve',candidateId:id,ownerId,
    approvalId:'approval-v1-'+'e'.repeat(24),baseSha:base,headSha:head,evidenceDigest:digest,generation,
    issuedAt:new Date(now).toISOString(),expiresAt:new Date(now+120000).toISOString()};
  const input={accessToken:'isolated-fixture-owner-session',adminCredential:secret,candidateId:id,receipt,
    signature:sign(null,ownerReceiptBytes(receipt),privateKey).toString('hex')};
  const commit=createRepairApprovalTransaction({database:db,activationMode:'disposable-fixture'});
  const approve=createServerRepairApproval({activationMode:'disposable-fixture',
    supabase:{auth:{getUser:async()=>({data:{user:{id:ownerId,aud:'authenticated',is_anonymous:false}},error:null})}},
    registeredOwnerId:ownerId,adminMasterKey:secret,ownerPublicKey:publicKey,clock:()=>now,
    collectFreshTrustedIncident:async()=>({schema:'tradehq-server-incident-v1',verified:true,rootCauseReproduced:true,
      sourceScope:'LOW',candidateId:id,baseSha:base,headSha:head,evidenceDigest:digest,generation,observedAt:now}),
    commitApprovalTransaction:commit});
  return {db,approve,input,commit,now,generation};
}
assert.throws(()=>createRepairApprovalTransaction({database:{transaction(){}}}),/disabled/);
let f=await fixture();
try {
  const result=await f.approve(f.input);
  assert.ok(Object.values(result.authorization).every(v=>v===false));
  assert.equal((await f.db.query('SELECT count(*)::int AS n FROM tradehq_repair_control.approval_receipts')).rows[0].n,1);
  await assert.rejects(()=>f.approve(f.input),'Replay must not commit another receipt');
  assert.equal((await f.db.query('SELECT status FROM tradehq_repair_control.candidates WHERE id=$1',[id])).rows[0].status,'approved');
  for (const role of ['anon','authenticated','service_role']) {
    await f.db.exec('SET ROLE '+role);
    await assert.rejects(()=>f.db.query('SELECT * FROM tradehq_repair_control.approval_receipts'),/permission denied/);
    await f.db.exec('RESET ROLE');
  }
} finally {await f.db.close();}
for (const mutate of [
  db=>db.exec('SELECT tradehq_repair_control.set_stop(true)'),
  db=>db.exec("UPDATE tradehq_repair_control.candidates SET evidence_digest='"+'d'.repeat(64)+"'"),
  db=>db.exec("UPDATE tradehq_repair_control.candidates SET claimed_at=claimed_at-interval '31 minutes',lease_until=lease_until-interval '31 minutes'"),
  db=>db.exec('DELETE FROM tradehq_repair_control.policy'),
  db=>db.exec("CREATE FUNCTION tradehq_repair_control.fixture_reject_receipt() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'isolated receipt fault'; END $$; CREATE TRIGGER reject_receipt BEFORE INSERT ON tradehq_repair_control.approval_receipts FOR EACH ROW EXECUTE FUNCTION tradehq_repair_control.fixture_reject_receipt()"),
]) {
  f=await fixture();
  try {
    // A real trigger fault after validation proves transaction rollback.
    await mutate(f.db); await assert.rejects(()=>f.approve(f.input));
    assert.equal((await f.db.query('SELECT count(*)::int AS n FROM tradehq_repair_control.approval_receipts')).rows[0].n,0);
    const status=(await f.db.query('SELECT status FROM tradehq_repair_control.candidates WHERE id=$1',[id])).rows[0].status;
    assert.ok(['claimed','stopped'].includes(status),'Failure cannot leave a partial validated/approved candidate');
    assert.equal((await f.db.query("SELECT count(*)::int AS n FROM tradehq_repair_control.transition_log WHERE code IN ('VALIDATED','APPROVED')")).rows[0].n,0);
  } finally {await f.db.close();}
}
console.log('Real disposable SQL adapter: signed two-factor fixture approval, exact bindings, replay, stop/expiry/missing state, app-role denial and rollback after validation passed. Production remains disabled.');
