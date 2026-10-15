import assert from 'node:assert/strict';
import { trainIncidentOutcomeModel, predictReportedOutcome, LEARNING_LIMITS } from './agent-incident-learning.mjs';
const now='2026-10-13T12:00:00.000Z',sha='a'.repeat(40);
const target={runId:'999',sha,category:'BLANK_ROOT',route:'/'};
const actions=['INSPECT_BROWSER_RENDER_EVIDENCE','INSPECT_PUBLIC_ASSET_EVIDENCE'];
// Independent held-out run groups, deliberately synthetic labels. This is a
// measurement of the trainer, not evidence of TradeHQ production accuracy.
const records=Array.from({length:40},(_,i)=>actions.map((action,j)=>({...target,runId:String(100+i),action,
  observedAt:new Date(Date.parse('2026-10-10T00:00:00.000Z')+i*3600_000).toISOString(),
  outcome:j?'reported_success':'reported_failed'}))).flat();
const train=(rows=records,clock=now)=>trainIncidentOutcomeModel({memoryJson:JSON.stringify({version:1,records:rows}),now:clock});
const model=train();
assert.equal(model.status,'SHADOW_MODEL_TRAINED');
assert.ok(model.evaluation.modelLogLoss<model.evaluation.baselineLogLoss-0.4);
assert.equal(model.evaluation.trainingRuns,32); assert.equal(model.evaluation.heldOutRuns,8);
assert.equal(model.evaluation.productionAccuracyEstablished,false);
assert.equal(model.evaluation.classification.falsePositiveRate,0);
assert.equal(model.evaluation.classification.negatives,8);
assert.ok(model.evaluation.classification.brierScore<0.01);
assert.equal(model.evaluation.classification.calibrationEstablished,false);
assert.equal(model.evaluation.featureDrift.detected,false);
assert.equal(model.confirmedRepairOutcomes,0);
assert.ok(Object.values(model.authorization).every(v=>v===false));
const first=predictReportedOutcome({model,incident:target,action:actions[0],now});
const second=predictReportedOutcome({model,incident:target,action:actions[1],now});
assert.ok(first.reportedFailureProbability>0.8 && second.reportedFailureProbability<0.2);
assert.ok(Object.values(first.authorization).every(v=>v===false));
assert.equal(first.rootCauseVerified,false);
assert.equal(first.confidence.calibrationEstablished,false);
assert.equal(first.confidence.supportingDistinctRuns,32);
assert.equal(model.evaluation.fittedOn,'TRAINING_PARTITION_ONLY');
assert.equal(predictReportedOutcome({model,incident:{...target,route:'/about'},action:actions[0],now}).status,'ABSTAIN_UNSEEN_CONTEXT');
assert.deepEqual(train(),model,'Identical retained data trains deterministically');
assert.deepEqual(train([...records,records[0]]),model,'Duplicate rows cannot increase evidence weight');
const inverted=train(records.map(r=>({...r,outcome:r.outcome==='reported_success'?'reported_failed':'reported_success'})));
assert.notEqual(inverted.modelDigest,model.modelDigest,'Model parameters change when labels change');
assert.ok(predictReportedOutcome({model:inverted,incident:target,action:actions[0],now}).reportedFailureProbability<0.2);
assert.equal(train([]).status,'ABSTAIN_INSUFFICIENT_HISTORY');
assert.equal(train(records.slice(0,10)).status,'ABSTAIN_INSUFFICIENT_HISTORY');
assert.equal(train(records.map(r=>({...r,outcome:'reported_failed'}))).status,'ABSTAIN_SINGLE_CLASS_DATA');
const balanced=records.map((r,i)=>({...r,outcome:Math.floor(i/2)%2?'reported_success':'reported_failed'}));
assert.equal(train(balanced).status,'ABSTAIN_NO_HELD_OUT_BENEFIT');
// Genuine computations over explicitly synthetic labels: average log loss
// improves while 3 of 11 reported-success holdouts become false positives.
const excessiveFalsePositives=records.map(r=>({...r,outcome:r.action===actions[0]&&Number(r.runId)>=132&&Number(r.runId)<135?'reported_success':r.outcome}));
const unsafe=train(excessiveFalsePositives);
assert.ok(unsafe.evaluation.modelLogLoss<unsafe.evaluation.baselineLogLoss-0.01);
assert.equal(unsafe.evaluation.classification.falsePositiveRate,3/11);
assert.deepEqual([unsafe.evaluation.classification.truePositive,unsafe.evaluation.classification.falsePositive,
  unsafe.evaluation.classification.trueNegative,unsafe.evaluation.classification.falseNegative],[5,3,8,0]);
assert.equal(unsafe.status,'ABSTAIN_FALSE_POSITIVE_RATE');
assert.equal(unsafe.modelDigest,undefined);assert.equal(unsafe.learned,undefined);
assert.ok(Object.values(unsafe.authorization).every(v=>v===false));
assert.throws(()=>predictReportedOutcome({model:unsafe,incident:target,action:actions[0],now}));
// An unseen held-out route is drift even when it carries both outcome classes.
const shifted=train(records.map(r=>({...r,route:Number(r.runId)>=132?'/about':r.route})));
assert.equal(shifted.status,'ABSTAIN_FEATURE_DRIFT');
assert.equal(shifted.evaluation.featureDrift.dimensions.route.unseenFraction,1);
assert.equal(shifted.modelDigest,undefined);assert.equal(shifted.learned,undefined);
const changedMix=train(records.map(r=>({...r,route:Number(r.runId)>=116?'/about':'/'})));
assert.equal(changedMix.status,'ABSTAIN_FEATURE_DRIFT');
assert.equal(changedMix.evaluation.featureDrift.dimensions.route.unseenFraction,0);
assert.equal(changedMix.evaluation.featureDrift.dimensions.route.totalVariation,0.5);
// If a held-out label changes but still passes the quality gates, it may change
// evaluation/data provenance, never the evaluated model's training weights.
const fifty=Array.from({length:50},(_,i)=>actions.map((action,j)=>({...target,runId:String(100+i),action,
  observedAt:new Date(Date.parse('2026-10-10T00:00:00.000Z')+i*3600_000).toISOString(),
  outcome:j?'reported_success':'reported_failed'}))).flat();
const heldOutA=train(fifty),heldOutB=train(fifty.map(r=>({...r,
  outcome:r.runId==='140'&&r.action===actions[0]?'reported_success':r.outcome})));
assert.equal(heldOutA.status,'SHADOW_MODEL_TRAINED');assert.equal(heldOutB.status,'SHADOW_MODEL_TRAINED');
assert.equal(heldOutB.evaluation.classification.falsePositiveRate,1/11);
assert.deepEqual(heldOutA.learned,heldOutB.learned,'Held-out labels cannot enter the emitted weights');
assert.notEqual(heldOutA.dataDigest,heldOutB.dataDigest);
const leaking=records.map(r=>({...r,observedAt:Number(r.runId)<132 && r.action===actions[1] ? '2026-10-12T11:00:00.000Z':r.observedAt}));
assert.equal(train(leaking).status,'ABSTAIN_INSUFFICIENT_TEMPORAL_SPLIT','Late labels on training runs must be purged');
const later=[...records,{...records[0],runId:'1',observedAt:'2026-08-01T00:00:00.000Z'}];
assert.deepEqual(train(later),model,'Expired labels cannot affect learned weights');
for(const patch of [{verified:true},{outcome:'verified_success'},{route:'/auth?token=private-sentinel'},
  {action:'DEPLOY'},{observedAt:'2026-10-14T00:00:00.000Z'}]) assert.throws(()=>train([{...records[0],...patch}]));
assert.throws(()=>train([...records,{...records[0],outcome:'reported_success'}]));
assert.throws(()=>train(Array.from({length:LEARNING_LIMITS.records+1},()=>records[0])));
assert.throws(()=>train([], '2026-02-30T00:00:00.000Z'));
assert.throws(()=>predictReportedOutcome({model:JSON.parse(JSON.stringify(model)),incident:target,action:actions[0],now}));
assert.throws(()=>predictReportedOutcome({model,incident:target,action:'MERGE',now}));
assert.throws(()=>predictReportedOutcome({model,incident:target,action:actions[0],now:'2026-10-14T12:00:00.000Z'}));
assert.throws(()=>{model.learned.weights[0]=999;},TypeError);
console.log(JSON.stringify({dataset:'SYNTHETIC_REPORTED_OUTCOMES_ONLY',trainingRuns:32,heldOutRuns:8,
  baselineLogLoss:model.evaluation.baselineLogLoss,modelLogLoss:model.evaluation.modelLogLoss,
  productionAccuracyEstablished:false,modelCalls:0,productionWrites:0}));
console.log(JSON.stringify({dataset:'SYNTHETIC_QUALITY_GATE_ONLY',
  betterLogLossButFalsePositiveRate:unsafe.evaluation.classification.falsePositiveRate,
  rejection:unsafe.status,knownRouteDistributionShift:changedMix.evaluation.featureDrift.dimensions.route.totalVariation,
  driftRejection:changedMix.status,productionAccuracyEstablished:false}));
console.log('Statistical training, learned weights, chronological held-out evaluation, abstention and authority separation passed.');
