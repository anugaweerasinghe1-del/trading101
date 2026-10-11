// Disposable fixture: no production URL, secrets, source writes or model requests.
import assert from "node:assert/strict";
import {PGlite} from "@electric-sql/pglite";
import {readFileSync} from "node:fs";
import {generateKeyPairSync,sign} from "node:crypto";
import {createServerRepairApproval} from "./agent-repair-approval-server.mjs";
import {ownerReceiptBytes} from "./agent-owner-approval-offline.mjs";
const db=new PGlite();
const now=Date.now(),id="repair-v1-"+"a".repeat(24),
  base="a".repeat(40),head="b".repeat(40),digest="c".repeat(64);
const ownerId="c1700000-1111-4111-8111-000000000001";
const token="fixture-valid-supabase-token",adminSecret="fixture-private-admin-key-32-chars";
const {publicKey,privateKey}=generateKeyPairSync("ed25519");
let authCalls=0,evidenceCalls=0,txCalls=0,stopGeneration;
try{
  await db.exec("CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;");
  await db.exec("SET tradehq.offline_control_prototype='explicit-local-test'");
  await db.exec(readFileSync("docs/proposals/repair-control-prototype.sql","utf8"));
  const candidate=async()=>(await db.query(
    "SELECT tradehq_repair_control.claim($1,$2,$3,$4,$5,$6,$7) AS r",
    [id,"browser","LAYOUT_OVERFLOW",base,digest,new Date(now).toISOString(),"LOW"])).rows[0].r;
  assert.equal((await candidate()).reason,"STOPPED");
  await db.exec("SELECT tradehq_repair_control.set_stop(false)");
  assert.equal((await candidate()).reason,"CLAIMED");
  assert.equal((await candidate()).reason,"DUPLICATE");
  const state=(await db.query("SELECT generation FROM tradehq_repair_control.policy")).rows[0];
  stopGeneration=Number(state.generation);
  await db.exec("CREATE TABLE tradehq_repair_control.owner_receipt_registry ("+
    "approval_id text PRIMARY KEY, owner_id text NOT NULL, candidate_id text NOT NULL UNIQUE,"+
    "receipt_digest text NOT NULL UNIQUE, recorded_at timestamptz NOT NULL DEFAULT clock_timestamp())");
  const sessionClient={auth:{async getUser(bearer){
    authCalls++;return bearer===token?{data:{user:{id:ownerId,aud:"authenticated",is_anonymous:false}},error:null}
      :bearer==="other-user-token-12345"?{data:{user:{id:"d1700000-1111-4111-8111-000000000001",aud:"authenticated",is_anonymous:false}},error:null}
      :{data:{user:null},error:{message:"invalid token"}};
  }}};
  const independentIncident=async candidateId=>{
    evidenceCalls++;return {schema:"tradehq-server-incident-v1",verified:true,
      rootCauseReproduced:true,sourceScope:"LOW",candidateId,baseSha:base,
      headSha:head,evidenceDigest:digest,generation:stopGeneration,observedAt:now};
  };
  const durableTx=async x=>{
    txCalls++; await db.exec("BEGIN");
    try{
      const policy=(await db.query("SELECT generation,stopped FROM tradehq_repair_control.policy")).rows[0];
      assert.equal(policy.stopped,false);assert.equal(Number(policy.generation),x.generation);
      await db.query("INSERT INTO tradehq_repair_control.owner_receipt_registry(approval_id,owner_id,candidate_id,receipt_digest) VALUES($1,$2,$3,$4)",
        [x.approvalId,x.ownerId,x.candidateId,x.receiptDigest]);
      const review=async(action)=>(await db.query(
        "SELECT tradehq_repair_control.review($1,$2,$3,$4,$5,$6,$7) AS r",
        [action,id,head,base,digest,x.expiresAt,x.receiptDigest])).rows[0].r;
      assert.equal((await review("validate")).reason,"VALIDATED");
      assert.equal((await review("approve")).reason,"APPROVED");
      assert.equal((await review("check")).reviewValid,true);
      await db.exec("COMMIT");
      return {committed:true,replayProtected:true,stopRechecked:true,auditRecorded:true};
    }catch(error){await db.exec("ROLLBACK");throw error}
  };
  assert.throws(()=>createServerRepairApproval({
    supabase:sessionClient,registeredOwnerId:ownerId,adminMasterKey:adminSecret,
    ownerPublicKey:publicKey,collectFreshTrustedIncident:independentIncident,
    commitApprovalTransaction:durableTx}),/disabled/);
  const baseOptions={supabase:sessionClient,registeredOwnerId:ownerId,adminMasterKey:adminSecret,
    ownerPublicKey:publicKey,collectFreshTrustedIncident:independentIncident,
    commitApprovalTransaction:durableTx,clock:()=>now,activationMode:"disposable-fixture"};
  const approve=createServerRepairApproval(baseOptions);
  const binding={candidateId:id,ownerId,approvalId:"approval-v1-"+"f".repeat(24),
    baseSha:base,headSha:head,evidenceDigest:digest,generation:stopGeneration};
  const receipt={schema:"tradehq-owner-approval-v1",decision:"approve",...binding,
    issuedAt:new Date(now).toISOString(),expiresAt:new Date(now+120000).toISOString()};
  const signature=sign(null,ownerReceiptBytes(receipt),privateKey).toString("hex");
  const valid={accessToken:token,adminCredential:adminSecret,candidateId:id,receipt,signature};
  const before=txCalls;
  for(const altered of [
    {...valid,accessToken:"bad-bearer-token-123"},
    {...valid,accessToken:"other-user-token-12345"},
    {...valid,adminCredential:"incorrect-admin-key-123456789"},
    {...valid,adminCredential:""},
    {...valid,receipt:{...receipt,ownerId:"d1700000-1111-4111-8111-000000000001"}},
    {...valid,receipt:{...receipt,headSha:"d".repeat(40)}},
    {...valid,receipt:{...receipt,evidenceDigest:"d".repeat(64)}},
    {...valid,receipt:{...receipt,generation:stopGeneration+1}},
    {...valid,receipt:{...receipt,approvalId:"approval-v1-"+"a".repeat(24)}},
    {...valid,signature:"0".repeat(128)},
    {...valid,receipt:{...receipt,expiresAt:new Date(now-1).toISOString()}},
  ])await assert.rejects(approve(altered));
  assert.equal(txCalls,before,"Auth and receipt failures must never call DB write adapter");
  const stale=createServerRepairApproval({...baseOptions,
    collectFreshTrustedIncident:async()=>({...(await independentIncident(id)),verified:false})});
  await assert.rejects(stale(valid));
  const changed=createServerRepairApproval({...baseOptions,
    collectFreshTrustedIncident:async()=>({...(await independentIncident(id)),evidenceDigest:"d".repeat(64)})});
  await assert.rejects(changed(valid));
  const late=createServerRepairApproval({...baseOptions,clock:()=>now+1800001});
  await assert.rejects(late(valid));
  const positive=await approve(valid);
  assert.equal(positive.status,"OFFLINE_RECEIPT_RECORDED_NOT_REPAIR_AUTHORIZED");
  assert.ok(Object.values(positive.authorization).every(x=>x===false));
  const rows=(await db.query("SELECT * FROM tradehq_repair_control.owner_receipt_registry")).rows;
  assert.equal(rows.length,1);assert.equal(rows[0].owner_id,ownerId);
  await assert.rejects(approve(valid),"Replay must fail by durable unique registry / candidate state");
  assert.equal((await db.query("SELECT count(*)::int AS n FROM tradehq_repair_control.owner_receipt_registry")).rows[0].n,1);
  await db.exec("SELECT tradehq_repair_control.set_stop(true)");
  await assert.rejects(approve(valid));
  assert.equal((await db.query("SELECT count(*)::int AS n FROM tradehq_repair_control.owner_receipt_registry")).rows[0].n,1);
  console.log("Repair owner server: independently verified mock Supabase getUser + existing admin key, exact signed approval, fresh evidence and PGlite atomic receipt/audit; forged/non-owner/stale/replay/stop denied. Production disabled.");
} finally {await db.close()}
