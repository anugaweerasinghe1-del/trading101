/**
 * Immutable OFFLINE PR-equivalent review packet for an isolated fixture only.
 * No checkout, filesystem, shell, GitHub, Gemini, database, credentials or writes.
 * External inputs are NOT live trust: call only inside the independently verified
 * offline demonstration, after real collector + isolation + role/approval tests.
 */
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {classifyRepairScope} from "./agent-repair-review.mjs";
const sha=/^[a-f0-9]{40}$/,digest=/^[a-f0-9]{64}$/;
const flags=()=>({sourceWrites:false,modelCalls:false,merge:false,productionRelease:false});
const hash=s=>createHash("sha256").update(s).digest("hex");
export function buildOfflineReviewArtifact({verifiedCase,change,reproduction,isolatedGit,
  ownerReceipt,sqlApproval,independentTests}) {
  assert.ok(verifiedCase && verifiedCase.path==="/about" && verifiedCase.source==="browser"
    && verifiedCase.symptom==="LAYOUT_OVERFLOW" && verifiedCase.repairRisk==="HIGH"
    && verifiedCase.rootCauseVerified===false && verifiedCase.status==="OWNER_INVESTIGATION_REQUIRED"
    && digest.test(verifiedCase.evidenceDigest||""),"No independently collected, bounded fixture symptom");
  assert.ok(change && change.path==="src/pages/About.tsx" && change.status==="modified",
    "Protected/unknown path is not eligible");
  const scope=classifyRepairScope([change]);
  assert.equal(scope.risk,"LOW","Only mechanical narrow presentation changes allowed");
  assert.ok(reproduction && reproduction.isolatedFixture===true && reproduction.beforeFailed===true
    && reproduction.afterPassed===true && reproduction.rootCause==="fixture-vertical-spacing",
    "Simulated root cause was not independently reproduced");
  assert.ok(isolatedGit && sha.test(isolatedGit.baseSha||"")
    && sha.test(isolatedGit.headSha||"") && isolatedGit.baseSha!==isolatedGit.headSha
    && isolatedGit.changedPaths?.length===1
    && isolatedGit.changedPaths[0]===change.path && isolatedGit.diffCheckPassed===true,
    "Immutable isolated Git source and diff checks are required");
  assert.ok(ownerReceipt && ownerReceipt.status==="PENDING_OWNER_ONLY_DURABLE_RECORD"
    && digest.test(ownerReceipt.receiptDigest||"")
    && ownerReceipt.candidateId===verifiedCase.candidateId
    && ownerReceipt.evidenceDigest===verifiedCase.evidenceDigest
    && Object.values(ownerReceipt.authorization).every(v=>v===false),
    "Signed fixture approval is not bound to the candidate");
  assert.ok(sqlApproval?.reviewValid===true && sqlApproval.productionRelease===false
    && sqlApproval.codeWrites===false && independentTests?.passed===true
    && independentTests?.exactHeadSha===isolatedGit.headSha,
    "Independent SQL/CI-style fixture validation failed");
  const manifest={
    schema:"tradehq-immutable-offline-pr-v1",origin:"ISOLATED_SIMULATION_NOT_PRODUCTION",
    draftPrCreated:false,requiresOwnerReview:true,
    candidateId:verifiedCase.candidateId,evidenceDigest:verifiedCase.evidenceDigest,
    productionMainSha:verifiedCase.baseSha,
    isolatedBaseSha:isolatedGit.baseSha,isolatedProposalHeadSha:isolatedGit.headSha,
    changedPaths:[change.path],changeBeforeSha256:hash(change.before),
    changeAfterSha256:hash(change.after),reproduction:"fixture-vertical-spacing",
    scopeRisk:"LOW",unsignedEvidenceIsNotAuthorization:true,
    signatureReceiptDigest:ownerReceipt.receiptDigest,
    validation:{exactIsolatedHead:isolatedGit.headSha,offlineTestsPassed:true,
      disposableSqlApprovalChecked:true,productionCI:false,cloudflarePreview:false},
    authorization:flags(),
  };
  return {...manifest,manifestSha256:hash(JSON.stringify(manifest))};
}