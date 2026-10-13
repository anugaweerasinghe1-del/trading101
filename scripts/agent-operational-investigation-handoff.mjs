/**
 * READ-ONLY operational handoff. Re-collects trusted monitor evidence before
 * emitting a human-investigation packet; never requests GitHub write permissions.
 * A verified incident makes the evidence job FAIL visibly, without repairing.
 * This is NOT owner approval, a validated root cause, or a repair PR.
 */
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { appendFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { collectOfflineRepairReview } from "./agent-repair-pipeline-offline.mjs";
import { collectIncidentFeedback, recommendForVerifiedFinding } from "./agent-incident-feedback.mjs";
import { trainIncidentOutcomeModel, predictReportedOutcome } from "./agent-incident-learning.mjs";

export function investigationLearning(packet, history, now=Date.now()) {
  summarizeInvestigation(packet);
  assert.ok(history?.schema === 'tradehq-incident-feedback-v1'
    && history.confirmedRepairOutcomes === 0, 'Unverified feedback must not acquire repair authority');
  const clock=new Date(now).toISOString();
  const model=trainIncidentOutcomeModel({memoryJson:JSON.stringify(history.memory),now:clock});
  const estimates=[];
  if(model.status === 'SHADOW_MODEL_TRAINED') {
    for(const item of packet.cases) {
      const advice=recommendForVerifiedFinding({runId:packet.producer.runId,sha:packet.producer.monitorSha,
        symptom:item.symptom,path:item.path},history.memory,now);
      for(const suggestion of advice.recommendations) estimates.push({candidateId:item.candidateId,
        ...predictReportedOutcome({model,incident:advice.incident,action:suggestion.action,now:clock})});
    }
  }
  // Fixed-rule suppressions remain authoritative for advice. Training never
  // restores a suppressed action, changes risk or influences release decisions.
  return {schema:'tradehq-operational-shadow-learning-v1',status:model.status,
    records:model.records,distinctRuns:model.distinctRuns,dataDigest:model.dataDigest,
    modelDigest:model.modelDigest || null,evaluation:model.evaluation || null,
    outcomeTrust:model.dataTrust,estimates,confirmedRepairOutcomes:0,authorization:model.authorization};
}

// Recompute advice from fixed fields in the re-collected packet. History only
// suppresses investigations; it cannot alter findings or grant repair authority.
export function investigationAdvice(packet, history, now=Date.now()) {
  summarizeInvestigation(packet);
  assert.ok(history?.schema === 'tradehq-incident-feedback-v1'
    && history.confirmedRepairOutcomes === 0, 'No imported success may confirm a repair');
  return {schema:'tradehq-incident-investigation-advice-v1',
    observationTrust:'RECOLLECTED_AUTHENTICATED_MONITOR_EVIDENCE',
    outcomeTrust:'OWNER_REPORTED_UNVERIFIED',confirmedRepairOutcomes:0,
    items:packet.cases.map(item=>({candidateId:item.candidateId,
      ...recommendForVerifiedFinding({runId:packet.producer.runId,sha:packet.producer.monitorSha,
        symptom:item.symptom,path:item.path},history.memory,now)})),
    authorization:{codeWrites:false,modelCalls:false,ownerApproval:false,draftPrCreation:false,merge:false,productionRelease:false}};
}

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

/**
 * Present ONLY summary fields admitted by summarizeInvestigation. The GitHub
 * job summary is local runner output, not a GitHub API/production write.
 * Deliberately fail an incident-bearing job so a real verified incident can
 * never appear as a healthy green evidence run.
 */
export function investigationOutcome(packet) {
  const summary=summarizeInvestigation(packet);
  const attention=summary.ownerReviewRequired;
  const lines=[
    "## TradeHQ trusted monitoring — "+(attention?"Owner investigation required":"No verified incident"),
    "",
    "- Producer: [GitHub Actions run #"+summary.monitorRunId+
      "](https://github.com/anugaweerasinghe1-del/trading101/actions/runs/"+summary.monitorRunId+")",
    "- Monitored commit: `"+summary.monitorSha+"`",
    "- Verified main commit: `"+summary.targetSha+"`",
    "- Verified findings: **"+summary.cases.length+"**",
    "- Automatic code changes, model calls, merging and releases: **not authorized**",
    ""
  ];
  if(attention) {
    lines.push("| Public route | Symptom | Evidence ID |",
      "| --- | --- | --- |");
    for(const item of summary.cases)
      lines.push("| `"+item.path+"` | `"+item.symptom+"` | `"+item.candidateId+"` |");
    lines.push("","**Action:** Investigate and independently reproduce the observed symptom. "+
      "The root cause remains unverified; no repair PR or release has been authorized.");
  } else {
    lines.push("Both required monitor reports were independently verified; no incident diagnosis was requested.");
  }
  lines.push("","Evidence fingerprint: `"+summary.sha256+"`");
  const jobSummary=lines.join("\n")+"\n";
  assert.ok(jobSummary.length<16000,"Bounded GitHub job summary required");
  return {summary,jobSummary,failJob:attention};
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
    const {summary,jobSummary,failJob}=investigationOutcome(packet);
    // Missing or malformed referenced history stops the cycle visibly. A missing
    // owner journal is an explicit empty-history bootstrap, never invented data.
    const history=await collectIncidentFeedback({mainSha:MAIN_SHA});
    const advice=investigationAdvice(packet,history);
    const learning=investigationLearning(packet,history);
    console.log("TRADEHQ_READONLY_INCIDENT_HANDOFF_V1 "+JSON.stringify(summary));
    console.log("TRADEHQ_INCIDENT_INVESTIGATION_ADVICE_V1 "+JSON.stringify(advice));
    console.log("TRADEHQ_INCIDENT_SHADOW_LEARNING_V1 "+JSON.stringify(learning));
    if(process.env.GITHUB_STEP_SUMMARY)
      appendFileSync(process.env.GITHUB_STEP_SUMMARY,jobSummary+
        '\n### Investigation history\n\n'+
        'History: `'+history.status+'`. Reported feedback is unverified; confirmed repair outcomes: **0**.\n\n'+
        advice.items.map(item=>'Route `'+(item.incident?.route || 'outside fixed memory schema')+'`: `'+item.status+'`. '+
          'Suggestions: '+item.recommendations.map(r=>'`'+r.action+'`').join(', ')+'. '+
          'Suppressed: '+item.suppressed.map(r=>'`'+r.action+'` ('+r.reason+')').join(', ')+'.').join('\n\n')+'\n',"utf8");
    if(failJob) {
      console.error("Verified public monitoring incident requires owner investigation. No repair or release permitted.");
      process.exitCode=1;
    }
  } catch {
    console.error("Read-only incident handoff rejected: verification, source identity or freshness missing.");
    process.exitCode=1;
  }
}
