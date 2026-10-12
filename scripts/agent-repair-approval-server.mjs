/**
 * TradeHQ owner approval boundary. SERVER-SIDE ONLY, NO ROUTE/DEPLOYMENT.
 *
 * This library remains unusable by default. The only currently permitted
 * activationMode is disposable-fixture, for independently tested local SQL.
 * A real endpoint/owner ID/key/DB role needs a separate owner-approved change.
 */
import assert from "node:assert/strict";
import { timingSafeEqual } from "node:crypto";
import { verifyOfflineOwnerReceipt } from "./agent-owner-approval-offline.mjs";
const sha=/^[a-f0-9]{40}$/;
const digest=/^[a-f0-9]{64}$/;
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const deny=()=>({codeWrites:false,modelCalls:false,merge:false,productionRelease:false});
function equalSecret(actual,secret) {
  if(typeof actual!=="string" || typeof secret!=="string")return false;
  const left=Buffer.from(actual),right=Buffer.from(secret);
  return left.length===right.length && left.length>=24 && timingSafeEqual(left,right);
}
export function createServerRepairApproval({
  supabase,registeredOwnerId,adminMasterKey,ownerPublicKey,
  collectFreshTrustedIncident,commitApprovalTransaction,clock=Date.now,
  activationMode="disabled",
}) {
  assert.equal(activationMode,"disposable-fixture",
    "Repair approvals are disabled: production authorization has not been approved");
  assert.ok(supabase?.auth?.getUser && typeof supabase.auth.getUser==="function"
    && uuid.test(registeredOwnerId||"") && typeof adminMasterKey==="string"
    && adminMasterKey.length>=24 && ownerPublicKey
    && typeof collectFreshTrustedIncident==="function"
    && typeof commitApprovalTransaction==="function" && typeof clock==="function",
    "Configured backend owner, independent auth/evidence, signer and durable transaction required");
  return async function submitOwnerApproval(input) {
    assert.ok(input && typeof input==="object" && !Array.isArray(input),"Invalid review request");
    const {accessToken,adminCredential,receipt,signature,candidateId}=input;
    assert.ok(typeof accessToken==="string" && accessToken.length>=16 && accessToken.length<=8192
      && typeof candidateId==="string" && /^repair-v1-[a-f0-9]{24}$/.test(candidateId),
      "Missing verified session/candidate");
    // Supabase JS auth.getUser(accessToken) performs server-side verification;
    // getSession(), client-side decoded JWTs, emails and browser flags do not.
    const session=await supabase.auth.getUser(accessToken);
    const principal=session?.data?.user;
    assert.ok(!session?.error && principal?.id===registeredOwnerId
      && principal?.aud==="authenticated" && principal?.is_anonymous!==true,
      "User is not the independently configured owner");
    assert.ok(equalSecret(adminCredential,adminMasterKey),
      "Existing administrator credential was not independently verified");
    const at=clock();
    assert.ok(Number.isFinite(at),"Invalid trusted server clock");
    // Always re-collect server-side; never accept input.isVerified/incident JSON.
    const incident=await collectFreshTrustedIncident(candidateId);
    assert.ok(incident?.schema==="tradehq-server-incident-v1" && incident.verified===true
      && incident.rootCauseReproduced===true && incident.sourceScope==="LOW"
      && incident.candidateId===candidateId && sha.test(incident.baseSha||"")
      && digest.test(incident.evidenceDigest||"")
      && Number.isFinite(incident.observedAt)
      && incident.observedAt<=at+30000 && incident.observedAt>=at-30*60_000,
      "Fresh independent incident and exact low-risk scope required");
    const expected={
      candidateId,ownerId:registeredOwnerId,approvalId:receipt?.approvalId,
      baseSha:incident.baseSha,headSha:incident.headSha,
      evidenceDigest:incident.evidenceDigest,generation:incident.generation,
    };
    assert.ok(sha.test(expected.headSha||"") && expected.headSha!==expected.baseSha
      && Number.isSafeInteger(expected.generation) && expected.generation>=0,
      "Invalid proposed head/generation");
    const signed=verifyOfflineOwnerReceipt({
      receipt,signature,publicKey:ownerPublicKey,expected,now:at,
    });
    // The trusted DB callback MUST hold locks, revalidate stop/generation/lease,
    // atomically insert unique approvalId and receiptDigest with owner audit,
    // validate + approve the exact candidate and commit or rollback as a unit.
    // Reject any error/duplicate/interruption; do not confer write permission.
    const result=await commitApprovalTransaction({
      candidateId,approvalId:signed.approvalId,ownerId:registeredOwnerId,
      baseSha:signed.baseSha,headSha:signed.headSha,
      evidenceDigest:signed.evidenceDigest,generation:signed.generation,
      receiptDigest:signed.approvalDigest,expiresAt:signed.expiresAt,
    });
    assert.ok(result && result.committed===true && result.replayProtected===true
      && result.stopRechecked===true && result.auditRecorded===true,
      "Durable atomic owner-approval acknowledgment missing");
    return Object.freeze({
      status:"OFFLINE_RECEIPT_RECORDED_NOT_REPAIR_AUTHORIZED",
      candidateId,approvalId:signed.approvalId,ownerId:registeredOwnerId,
      receiptDigest:signed.approvalDigest,authorization:deny(),
    });
  };
}