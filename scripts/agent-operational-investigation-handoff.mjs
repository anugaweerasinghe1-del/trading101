/**
 * READ-ONLY operational handoff. Re-collects trusted monitor evidence before
 * emitting a human-investigation packet; never requests write permissions.
 * This is NOT owner approval, a validated root cause, or a repair PR.
 */
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import { collectOfflineRepairReview } from "./agent-repair-pipeline-offline.mjs";

export function summarizeInvestigation(packet) {
  const denyKeys=["codeWrites","modelCalls","ownerApproval","merge","productionRelease"];
  const denied=value=>value && Object.keys(value).length===denyKeys.length
    && denyKeys.every(key=>value[key]===false);
  assert.ok(packet?.schema === "tradehq-offline-repair-review-v1"
    && Array.isArray(packet.cases) && packet.cases.length<=42
    && denied(packet.authorization)
    && Number.isSafeInteger(packet.producer?.runId) && packet.producer.runId>0
    && /^[a-f0-9]{40}$/.test(packet.producer.monitorSha||"")
    && /^[a-f0-9]{40}$/.test(packet.producer.targetSha||"")
    && packet.status===(packet.cases.length?"OWNER_INVESTIGATION_REQUIRED":"NO_VERIFIED_INCIDENT"),
    "Verified read-only investigation packet required");
  const seen=new Set();
  const cases = packet.cases.map(item => {
    assert.ok(item.status === "OWNER_INVESTIGATION_REQUIRED"
      && item.rootCauseVerified === false && item.repairRisk === "HIGH"
      && item.draftManifest?.draftPrCreated === false
      && denied(item.authorization)
      && /^repair-v1-[a-f0-9]{24}$/.test(item.candidateId||"")
      && !seen.has(item.candidateId)
      && /^\/(?:[A-Za-z0-9._-]+\/?)*$/.test(item.path||"")
      && !item.path.startsWith("//")
      && !item.path.split("/").some(part=>part==="."||part==="..")
      && item.path.length<=180
      && /^[A-Z][A-Z0-9_]{0,63}$/.test(item.symptom||"")
      && /^[a-f0-9]{64}$/.test(item.evidenceDigest||""),
      "No diagnosis may grant repair or PR authority");
    seen.add(item.candidateId);
    return {candidateId:item.candidateId, path:item.path, symptom:item.symptom,
      evidenceDigest:item.evidenceDigest, status:item.status};
  });
  const summary = {schema:"tradehq-operational-investigation-handoff-v1",
    monitorRunId:packet.producer.runId, monitorSha:packet.producer.monitorSha,
    targetSha:packet.producer.targetSha, status:packet.status, cases,
    ownerReviewRequired:cases.length>0, draftPrCreated:false,
    authorization:{codeWrites:false, modelCalls:false, ownerApproval:false,
      draftPrCreation:false, merge:false, productionRelease:false}};
  return {...summary, sha256:createHash("sha256").update(JSON.stringify(summary)).digest("hex")};
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    assert.equal(process.argv.length, 2, "No CLI arguments accepted");
    const {MONITOR_RUN_ID,MONITOR_SHA,MAIN_SHA}=process.env;
    assert.ok(/^[1-9][0-9]*$/.test(MONITOR_RUN_ID||"")
      && /^[a-f0-9]{40}$/.test(MONITOR_SHA||"")
      && /^[a-f0-9]{40}$/.test(MAIN_SHA||""),"Missing trusted producer coordinates");
    const packet=await collectOfflineRepairReview({
      runId:Number(MONITOR_RUN_ID),monitorSha:MONITOR_SHA,mainSha:MAIN_SHA
    });
    const summary=summarizeInvestigation(packet);
    console.log("TRADEHQ_READONLY_INCIDENT_HANDOFF_V1 "+JSON.stringify(summary));
  } catch {
    console.error("Read-only incident handoff rejected: verification, source identity or freshness missing.");
    process.exitCode=1;
  }
}
