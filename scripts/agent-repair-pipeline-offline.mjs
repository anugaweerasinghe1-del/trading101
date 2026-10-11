/**
 * Offline, READ-ONLY handoff from the real trusted collector to the existing
 * deterministic diagnosis and mechanical source-risk classifier.
 *
 * This module DOES NOT accept an imported "verified" JSON snapshot. It invokes
 * the collector for every case; test readers are dependency-injected only to
 * exercise the actual collector's attestation/CI/Pages checks.
 *
 * No production or GitHub writes, claims, approvals, API/model calls,
 * release credentials or schedulers are added by this module.
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { collectTrustedEvidence } from "./agent-trusted-evidence.mjs";
import { classifyRepairScope } from "./agent-repair-review.mjs";
import { verifyOfflineOwnerReceipt } from "./agent-owner-approval-offline.mjs";

const noAuthority=()=>({codeWrites:false,modelCalls:false,ownerApproval:false,merge:false,productionRelease:false});
const sha=/^[a-f0-9]{40}$/;
const digest=/^[a-f0-9]{64}$/;

export async function collectOfflineRepairReview({runId,monitorSha,mainSha,reader,now=Date.now(),changes=[]}) {
  assert.ok(Number.isFinite(now) && (!reader || typeof reader.get==="function"),"Bounded trusted reader required");
  // Do not take a serialized trusted packet from the caller; verify actual producer records.
  const packet=await collectTrustedEvidence({
    runId,monitorSha,mainSha,purpose:"diagnosis",now,...(reader?{reader}:{}),
  });
  assert.equal(packet.schema,"tradehq-trusted-evidence-v1");
  assert.equal(packet.purpose,"diagnosis");
  assert.equal(packet.targetSha,mainSha);
  assert.ok(packet.monitoring && Array.isArray(packet.monitoring.findings));
  assert.ok(packet.diagnosis && Array.isArray(packet.diagnosis.items));
  assert.ok(Object.values(packet.authorization).every(v=>v===false),"Trusted evidence must not grant write authority");
  assert.ok(Object.values(packet.diagnosis.authorization).every(v=>v===false),"Diagnosis must not grant write authority");
  assert.ok(Array.isArray(changes) && changes.length<=1,"Only one exact-source scope preview permitted");
  const f=packet.monitoring.findings,d=packet.diagnosis.items;
  assert.equal(f.length,d.length,"Complete verified finding/diagnosis correspondence is required");
  const observed=new Set();
  const cases=f.map((finding,i)=>{
    const diagnosis=d[i];
    assert.ok(finding.id===diagnosis.id && finding.path===diagnosis.path
      && finding.symptom===diagnosis.symptom && finding.source===diagnosis.source
      && !observed.has(finding.id),"Duplicate or changed findings after trusted collection");
    observed.add(finding.id);
    // This digest is a binding identifier, NOT an independently signed approval.
    const fingerprint=createHash("sha256").update(JSON.stringify({
      schema:packet.schema, repositoryId:packet.repositoryId,monitorSha:packet.monitoring.headSha,
      monitorRun:packet.monitoring.runId, attempt:packet.monitoring.attempt,
      mainSha:packet.mainSha, reports:packet.monitoring.reports,
      ci:packet.githubActions,cloudflarePages:packet.cloudflare.pages,finding
    })).digest("hex");
    assert.ok(digest.test(fingerprint));
    const sourceScope=classifyRepairScope(changes);
    // Finding a LOW-looking diff is NEVER equivalent to reproducing the observed root cause.
    // The existing diagnosis intentionally marks all current monitor symptoms HIGH.
    return {candidateId:finding.id,source:finding.source,path:finding.path,symptom:finding.symptom,
      evidenceDigest:fingerprint,baseSha:packet.mainSha,scopeRisk:sourceScope.risk,
      repairRisk:"HIGH",category:diagnosis.category,rootCauseVerified:false,
      status:"OWNER_INVESTIGATION_REQUIRED",nextCheck:diagnosis.nextCheck,
      draftManifest:{kind:"human-investigation-only",draftPrCreated:false,exactProposalSha:null},
      authorization:noAuthority()};
  });
  return {schema:"tradehq-offline-repair-review-v1",
    producer:{runId:packet.monitoring.runId,attempt:packet.monitoring.attempt,monitorSha:packet.monitoring.headSha,
      targetSha:packet.targetSha,checkedAt:packet.collectedAt},
    status:cases.length?"OWNER_INVESTIGATION_REQUIRED":"NO_VERIFIED_INCIDENT",
    cases,authorization:noAuthority(),cost:{modelCalls:0,sourceWrites:0,productionWrites:0},
    limitations:["A verified symptom is not a verified root cause or an approved repair.",
      "No candidate was inserted into a durable store, and no draft GitHub PR was created.",
      "Imported serialized evidence is never accepted as proof; independent re-collection is mandatory."]};
}

/**
 * TEST-ONLY adapter seam. A real owner authentication provider / registered
 * owner key / database role does not exist yet. Never consider its result a
 * production authorization. The durable SQL owner boundary stays uninstalled.
 */
export async function verifyOfflineOwnerAdapter({authenticateOwner,readControlState,
  identityToken,registeredOwnerId,publicKey,receipt,signature,expected,now=Date.now()}) {
  assert.ok(typeof authenticateOwner==="function" && typeof readControlState==="function"
    && typeof registeredOwnerId==="string" && registeredOwnerId.length>0
    && identityToken!==undefined,"Missing independently configured offline authentication boundary");
  assert.ok(expected && sha.test(expected.baseSha||"") && sha.test(expected.headSha||"")
    && digest.test(expected.evidenceDigest||""),"Invalid immutable expected binding");
  const principal=await authenticateOwner(identityToken);
  assert.ok(principal && principal.authenticated===true && principal.id===registeredOwnerId
    && principal.testOnly===true,"Unverified or unauthorized owner identity");
  const state=await readControlState();
  assert.ok(state && state.stopped===false && Number.isSafeInteger(state.generation)
    && state.generation===expected.generation && state.leaseUntil>now
    && state.leaseUntil<=now+30*60_000,"Stopped, stale, missing or changed durable control state");
  const accepted=verifyOfflineOwnerReceipt({receipt,signature,publicKey,expected,now});
  assert.ok(Date.parse(accepted.expiresAt)<=state.leaseUntil,"Approval exceeds repair lease");
  return {schema:"tradehq-offline-owner-adapter-v1",candidateId:accepted.candidateId,
    evidenceDigest:accepted.evidenceDigest,receiptDigest:accepted.approvalDigest,
    status:"PENDING_OWNER_ONLY_DURABLE_RECORD",authorization:noAuthority(),
    limitations:["Test identity callback only; no production IdP, key registration or approved database role.",
      "No SQL transition performed and no repair/release permission issued."]};
}