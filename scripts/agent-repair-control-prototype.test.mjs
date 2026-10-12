// Existing PGlite, local disposable directory only. Never uses a remote URL or credentials.
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { offlineOwnerFixture } from "./verify-owner-approval-offline.mjs";
const sql = readFileSync("docs/proposals/repair-control-prototype.sql", "utf8");
assert.doesNotMatch(sql.replace(/--[^\n]*/g, ""), /SECURITY DEFINER|CREATE ROLE|CREATE EXTENSION|GRANT\s/i);
const dir = mkdtempSync(join(tmpdir(), "tradehq-control-store-"));
let db = new PGlite(dir);
const id = "repair-v1-" + "a".repeat(24), other = "repair-v1-" + "b".repeat(24);
const base = "a".repeat(40), head = "b".repeat(40), digest = "c".repeat(64);
let approvalDigest=null,approvalExpiry=new Date(Date.now()+60000).toISOString();
async function claim(candidate = id, source = "browser", symptom = "HEADING_READABILITY", risk = "LOW", observed = new Date().toISOString()) {
  return (await db.query("SELECT tradehq_repair_control.claim($1,$2,$3,$4,$5,$6,$7) AS r",
    [candidate,source,symptom,base,digest,observed,risk])).rows[0].r;
}
async function review(action, sha = head, baseline = base, proof = digest, expires = approvalExpiry, receiptHash = approvalDigest) {
  return (await db.query("SELECT tradehq_repair_control.review($1,$2,$3,$4,$5,$6,$7) AS r",
    [action,id,sha,baseline,proof,expires,receiptHash])).rows[0].r;
}
try {
  await db.exec("CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;");
  await assert.rejects(db.exec(sql), /explicit local test context/);
  await db.exec("ROLLBACK");
  assert.equal((await db.query("SELECT to_regnamespace('tradehq_repair_control') AS s")).rows[0].s, null);
  await db.exec("SET tradehq.offline_control_prototype='explicit-local-test';");
  await db.exec(sql);
  assert.equal((await claim()).reason, "STOPPED");
  await db.exec("DELETE FROM tradehq_repair_control.policy");
  assert.equal((await claim()).reason, "MISSING_STATE");
  await db.exec("INSERT INTO tradehq_repair_control.policy(id) VALUES(true)");
  await db.exec("SELECT tradehq_repair_control.set_stop(false)");
  for (const risk of ["MEDIUM","HIGH","unknown",null]) assert.equal((await claim(id,"browser","HEADING_READABILITY",risk)).reason, "INVALID_SCOPE");
  assert.equal((await claim(id,"route")).reason, "INVALID_SCOPE");
  assert.equal((await claim(id,"browser","FINANCIAL_ERROR")).reason, "INVALID_SCOPE");
  assert.equal((await claim(id,"browser","HEADING_READABILITY","LOW","2000-01-01T00:00:00Z")).reason, "INVALID_EVIDENCE");
  assert.equal((await claim(id,"browser","HEADING_READABILITY","LOW","2099-01-01T00:00:00Z")).reason, "INVALID_EVIDENCE");
  const claims = await Promise.all([claim(), claim(other,"manual","LAYOUT_OVERFLOW")]);
  assert.equal(claims.filter(x => x.claimed).length, 1);
  assert.equal(claims[1].reason, "ACTIVE_CANDIDATE");
  const generation=Number((await db.query("SELECT generation FROM tradehq_repair_control.policy")).rows[0].generation);
  const signed=offlineOwnerFixture({candidateId:id,baseSha:base,headSha:head,evidenceDigest:digest,generation});
  approvalDigest=signed.approvalDigest;approvalExpiry=signed.expiresAt;
  await assert.rejects(db.query(`INSERT INTO tradehq_repair_control.candidates
    (id,fingerprint,source,symptom,base_sha,evidence_digest,generation,status,claimed_at,lease_until)
    SELECT $1,$2,'manual','LAYOUT_OVERFLOW',base_sha,evidence_digest,generation,status,claimed_at,lease_until
    FROM tradehq_repair_control.candidates WHERE id=$3`, [other,"d".repeat(64),id]),
    /one_active_candidate/, "The unique index must reject a second active candidate even outside claim().");
  assert.equal((await review("approve")).reason, "APPROVAL_REJECTED");
  assert.equal((await review("validate",head,"d".repeat(40))).reason, "INVALID_EVIDENCE");
  assert.equal((await review("validate",head,base,"d".repeat(64))).reason, "INVALID_EVIDENCE");
  assert.equal((await review("validate")).reason, "VALIDATED");
  assert.equal((await review("validate","d".repeat(40))).reason, "APPROVAL_REJECTED");
  assert.equal((await review("approve","d".repeat(40))).reason, "APPROVAL_REJECTED");
  assert.equal((await review("approve",head,base,digest,"2099-01-01T00:00:00Z")).reason, "APPROVAL_REJECTED");
  assert.equal((await review("approve",head,base,digest,approvalExpiry,null)).reason,"APPROVAL_REJECTED");
  assert.equal((await review("approve",head,base,digest,approvalExpiry,"invalid")).reason,"APPROVAL_REJECTED");
  assert.equal((await review("approve")).reason, "APPROVED");
  assert.equal((await review("approve")).reason,"APPROVAL_REJECTED","Replayed approval must never re-authorize an attempt");
  assert.equal((await review("check",head,base,digest,approvalExpiry,"d".repeat(64))).reason,"REVIEW_CHECK_BLOCKED");
  assert.equal((await db.query("SELECT approval_digest FROM tradehq_repair_control.transition_log WHERE code=$1",["APPROVED"])).rows[0].approval_digest,approvalDigest);
  assert.equal((await review("check")).reviewValid, true);
  assert.equal((await review("check")).productionRelease, false);
  assert.equal((await review("check","d".repeat(40))).reason, "REVIEW_CHECK_BLOCKED");
  assert.equal((await db.query("SELECT approval_digest FROM tradehq_repair_control.candidates WHERE id=$1",[id])).rows[0].approval_digest,approvalDigest);
  await db.close(); db = new PGlite(dir);
  assert.equal((await review("check")).reviewValid, true, "Exact approval survives a local store restart.");
  assert.equal((await claim()).reason, "DUPLICATE", "Attempt history survives restart.");
  await db.exec("UPDATE tradehq_repair_control.candidates SET approval_expires=clock_timestamp()-interval '1 second'");
  assert.equal((await review("check")).reason, "REVIEW_CHECK_BLOCKED");
  await db.exec("SELECT tradehq_repair_control.set_stop(true)");
  assert.equal((await review("check")).reason, "STOPPED");
  await db.exec("SELECT tradehq_repair_control.set_stop(false)");
  assert.equal((await review("check")).reason, "INVALID_EVIDENCE", "Resume cannot resurrect an old approval.");
  assert.equal((await claim(other,"browser")).reason, "DUPLICATE", "Renaming a recurring symptom cannot bypass the attempt limit.");
  assert.equal((await claim(other,"manual","LAYOUT_OVERFLOW")).reason, "RATE_LIMIT", "Stop/resume cannot reset rolling frequency.");
  // Offline clock fixture: move the completed/stopped historical claim beyond the window.
  await db.exec("UPDATE tradehq_repair_control.candidates SET claimed_at=claimed_at-interval '25 hours',lease_until=lease_until-interval '25 hours'");
  assert.equal((await claim(other,"manual","LAYOUT_OVERFLOW")).reason, "CLAIMED");
  // Owner-operated recovery must not clear an unexpired, mismatched or stopped claim.
  const gen=(await db.query("SELECT generation FROM tradehq_repair_control.policy WHERE id=true")).rows[0].generation;
  const recover=async(candidate=other,baseline=base,proof=digest,generation=gen)=>
    (await db.query("SELECT tradehq_repair_control.recover_expired($1,$2,$3,$4) AS r",
      [candidate,baseline,proof,generation])).rows[0].r;
  assert.equal((await recover()).reason,"LEASE_NOT_EXPIRED");
  assert.equal((await recover(other,base,"d".repeat(64))).reason,"INVALID_EVIDENCE");
  assert.equal((await recover(other,base,digest,Number(gen)+1)).reason,"INVALID_EVIDENCE");
  assert.equal((await recover(id)).reason,"INVALID_EVIDENCE","Stopped old-generation claims cannot be revived");
  await db.query("UPDATE tradehq_repair_control.candidates SET claimed_at=claimed_at-interval '31 minutes', lease_until=lease_until-interval '31 minutes' WHERE id=$1",[other]);
  assert.equal((await recover()).reason,"LEASE_EXPIRED");
  assert.equal((await recover()).reason,"LEASE_NOT_EXPIRED");
  assert.equal((await db.query("SELECT status FROM tradehq_repair_control.candidates WHERE id=$1",[other])).rows[0].status,"stopped");
  assert.equal((await db.query("SELECT count(*)::int AS n FROM tradehq_repair_control.candidates")).rows[0].n,2,"Recovery retains durable attempt history");
  assert.equal((await claim(other,"manual","LAYOUT_OVERFLOW")).reason,"DUPLICATE","Recovery cannot reset fingerprint history");
  await db.exec("SELECT tradehq_repair_control.set_stop(true)");
  assert.equal((await recover()).reason,"STOPPED");
  await db.exec("SELECT tradehq_repair_control.set_stop(false)");
  assert.deepEqual((await db.query("SELECT generation,stopped FROM tradehq_repair_control.policy_log ORDER BY seq")).rows.map(r=>[Number(r.generation),r.stopped]),
    [[0,true],[1,false],[2,true],[3,false],[4,true],[5,false]],"Stop/resume generation history must persist across restarts and recovery");
  assert.deepEqual((await db.query("SELECT code FROM tradehq_repair_control.transition_log ORDER BY seq")).rows.map(r=>r.code),
    ["CLAIMED","VALIDATED","APPROVED","CLAIMED","LEASE_EXPIRED"],"Only accepted transitions may be recorded");
  await db.exec("UPDATE tradehq_repair_control.audit SET count=10000 WHERE code='DUPLICATE'");
  await claim();
  assert.equal((await db.query("SELECT count,truncated FROM tradehq_repair_control.audit WHERE code='DUPLICATE'")).rows[0].truncated, true);
  assert.equal((await db.query("SELECT bool_and(relrowsecurity) AS enabled FROM pg_class WHERE relnamespace='tradehq_repair_control'::regnamespace AND relkind='r'")).rows[0].enabled, true);
  for (const role of ["anon","authenticated","service_role"]) {
    await db.exec("SET ROLE " + role);
    await assert.rejects(db.query("SELECT * FROM tradehq_repair_control.policy"), /permission denied/);
    await assert.rejects(db.query("SELECT * FROM tradehq_repair_control.policy_log"), /permission denied/);
    await assert.rejects(db.query("SELECT * FROM tradehq_repair_control.transition_log"), /permission denied/);
    await assert.rejects(db.query("SELECT tradehq_repair_control.set_stop(false)"), /permission denied/);
    await db.exec("RESET ROLE");
  }
  console.log("Repair control prototype: explicit offline guard, default/missing stop, one active claim, persistent attempt/frequency history, immutable validation/review binding, expiry, emergency generation invalidation, bounded audit and denied app roles passed. No production integration.");
} finally { await db.close(); rmSync(dir, { recursive: true, force: true }); }
