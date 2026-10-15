/** Bounded statistical training over reported investigation outcomes.
 * Estimates reported failure likelihood, not root cause or repair effectiveness.
 * Shadow-only: no recommendations, authorization, provider calls or persistence.
 */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { parseIncidentMemory, recommendIncidentInvestigation } from './agent-incident-memory.mjs';

export const LEARNING_LIMITS = Object.freeze({records:100,minimumRuns:10,minimumTrainingRuns:8,
  epochs:250,step:0.4,regularization:0.01,retentionDays:30,
  classificationThreshold:0.5,maximumFalsePositiveRate:0.1,maximumFeatureShift:0.25});
const DAY=86_400_000;
const models=new WeakMap();
const deny=()=>Object.freeze({codeWrites:false,modelCalls:false,ownerApproval:false,merge:false,productionRelease:false});
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const sigmoid=x=>1/(1+Math.exp(-Math.max(-35,Math.min(35,x))));
function validateClock(now) {
  assert.ok(typeof now==='string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(now)
    && Number.isFinite(Date.parse(now)) && new Date(Date.parse(now)).toISOString()===now,'Invalid training clock');
  return Date.parse(now);
}
function featureNames(record) {
  return ['bias','category:'+record.category,'route:'+record.route,'action:'+record.action,
    'category-action:'+record.category+':'+record.action];
}
function checkedMemory(json,now) {
  const memory=parseIncidentMemory(json);
  // Reuse the fixed schema, future-time and conflict checks. No JSON trust claims.
  recommendIncidentInvestigation({incident:{runId:'1',sha:'0'.repeat(40),category:'UNKNOWN',route:'/'},memory,now});
  const seen=new Map();
  for (const r of memory.records) seen.set(r.runId+':'+r.action,r);
  return [...seen.values()].filter(r=>Date.parse(now)-Date.parse(r.observedAt)<=LEARNING_LIMITS.retentionDays*DAY)
    .sort((a,b)=>a.observedAt.localeCompare(b.observedAt)||a.runId.localeCompare(b.runId)||a.action.localeCompare(b.action));
}
function splitRuns(records) {
  const groups=new Map();
  for (const r of records) {
    if (!groups.has(r.runId)) groups.set(r.runId,[]);
    groups.get(r.runId).push(r);
  }
  // A run is held out as a whole, including any late outcome for that run.
  // Split at the earliest held-out timestamp; purge training groups that cross
  // it. Future labels must never leak into training through another action.
  const ordered=[...groups.entries()].sort((a,b)=>a[1][0].observedAt.localeCompare(b[1][0].observedAt)||a[0].localeCompare(b[0]));
  const cut=Math.floor(ordered.length*0.8), evaluation=ordered.slice(cut).flatMap(x=>x[1]);
  const cutoff=evaluation[0]?.observedAt;
  const eligible=ordered.slice(0,cut).filter(([,rows])=>rows.every(r=>r.observedAt<cutoff));
  return {train:eligible.flatMap(x=>x[1]),test:evaluation,purgedRuns:cut-eligible.length,cutoff};
}
function label(r) { return r.outcome==='reported_success'?0:1; }
function fit(records) {
  const dictionary=[...new Set(records.flatMap(featureNames))].sort();
  const indices=new Map(dictionary.map((name,index)=>[name,index]));
  const rows=records.map(r=>({indices:featureNames(r).map(name=>indices.get(name)),label:label(r)}));
  const weights=Array(dictionary.length).fill(0);
  for (let epoch=0;epoch<LEARNING_LIMITS.epochs;epoch++) {
    const gradient=weights.map((weight,i)=>dictionary[i]==='bias'?0:LEARNING_LIMITS.regularization*weight);
    for (const row of rows) {
      const predicted=sigmoid(row.indices.reduce((sum,i)=>sum+weights[i],0));
      for (const i of row.indices) gradient[i]+=(predicted-row.label)/rows.length;
    }
    for (let i=0;i<weights.length;i++) weights[i]-=LEARNING_LIMITS.step*gradient[i];
  }
  return {dictionary,weights,indices};
}
function probability(model,record) {
  return sigmoid(featureNames(record).reduce((sum,name)=>sum+(model.weights[model.indices.get(name)]||0),0));
}
function loss(rows,predict) {
  return rows.reduce((sum,row)=>{
    const p=Math.max(1e-9,Math.min(1-1e-9,predict(row)));
    return sum-(label(row)*Math.log(p)+(1-label(row))*Math.log(1-p));
  },0)/rows.length;
}
function heldOutQuality(rows,predict) {
  let truePositive=0,falsePositive=0,trueNegative=0,falseNegative=0,brierScore=0;
  const bins=Array.from({length:5},()=>({count:0,predicted:0,observed:0}));
  for(const row of rows) {
    const p=predict(row),actual=label(row),positive=p>=LEARNING_LIMITS.classificationThreshold;
    if(positive){if(actual)truePositive++;else falsePositive++;}
    else if(actual)falseNegative++;else trueNegative++;
    brierScore+=(p-actual)**2;
    const bin=bins[Math.min(4,Math.floor(p*5))];bin.count++;bin.predicted+=p;bin.observed+=actual;
  }
  const positives=truePositive+falseNegative,negatives=trueNegative+falsePositive;
  return {target:'REPORTED_UNSUCCESSFUL_OUTCOME',threshold:LEARNING_LIMITS.classificationThreshold,
    truePositive,falsePositive,trueNegative,falseNegative,positives,negatives,
    falsePositiveRate:negatives?falsePositive/negatives:null,
    falseNegativeRate:positives?falseNegative/positives:null,
    brierScore:brierScore/rows.length,
    expectedCalibrationError:bins.reduce((sum,b)=>sum+(b.count?Math.abs(b.predicted-b.observed):0),0)/rows.length,
    calibrationBins:5,calibrationEstablished:false};
}
function featureDrift(train,test) {
  const dimensions={};
  for(const field of ['category','route','action']) {
    const counts=rows=>{const map=new Map();for(const r of rows)map.set(r[field],(map.get(r[field])||0)+1);return map;};
    const a=counts(train),b=counts(test),values=new Set([...a.keys(),...b.keys()]);
    const totalVariation=[...values].reduce((n,v)=>n+Math.abs((a.get(v)||0)/train.length-(b.get(v)||0)/test.length),0)/2;
    const unseenFraction=[...b].filter(([v])=>!a.has(v)).reduce((n,[,count])=>n+count,0)/test.length;
    dimensions[field]={totalVariation,unseenFraction};
  }
  return {method:'CATEGORICAL_TOTAL_VARIATION',maximumShift:LEARNING_LIMITS.maximumFeatureShift,dimensions,
    detected:Object.values(dimensions).some(d=>d.unseenFraction>0||d.totalVariation>LEARNING_LIMITS.maximumFeatureShift)};
}
function freezeDeep(value) {
  if (value && typeof value==='object') {for (const child of Object.values(value)) freezeDeep(child); Object.freeze(value);}
  return value;
}
export function trainIncidentOutcomeModel({memoryJson,now}) {
  validateClock(now);
  const records=checkedMemory(memoryJson,now);
  const runCount=new Set(records.map(r=>r.runId)).size;
  const common={schema:'tradehq-incident-outcome-learning-v1',mode:'SHADOW_ONLY',
    algorithm:'REGULARIZED_LOGISTIC_REGRESSION',target:'REPORTED_UNSUCCESSFUL_OUTCOME',
    dataTrust:'OWNER_REPORTED_UNVERIFIED',records:records.length,distinctRuns:runCount,
    dataDigest:hash(records),rootCauseVerified:false,confirmedRepairOutcomes:0,authorization:deny()};
  if (runCount<LEARNING_LIMITS.minimumRuns) return freezeDeep({...common,status:'ABSTAIN_INSUFFICIENT_HISTORY'});
  const {train,test,purgedRuns,cutoff}=splitRuns(records);
  if (new Set(train.map(r=>r.runId)).size<LEARNING_LIMITS.minimumTrainingRuns || test.length<2)
    return freezeDeep({...common,status:'ABSTAIN_INSUFFICIENT_TEMPORAL_SPLIT'});
  if (new Set(train.map(label)).size<2 || new Set(test.map(label)).size<2)
    return freezeDeep({...common,status:'ABSTAIN_SINGLE_CLASS_DATA'});
  const evaluationModel=fit(train);
  // Compare held-out loss with a smoothed intercept-only training baseline.
  const base=(train.reduce((n,r)=>n+label(r),0)+1)/(train.length+2);
  const baselineLogLoss=loss(test,()=>base),modelLogLoss=loss(test,r=>probability(evaluationModel,r));
  const evaluation={split:'PURGED_CHRONOLOGICAL_DISTINCT_RUNS',cutoff,purgedRuns,
    trainingRecords:train.length,heldOutRecords:test.length,trainingRuns:new Set(train.map(r=>r.runId)).size,
    heldOutRuns:new Set(test.map(r=>r.runId)).size,baselineLogLoss,modelLogLoss,
    improvement:baselineLogLoss-modelLogLoss,productionAccuracyEstablished:false,
    classification:heldOutQuality(test,r=>probability(evaluationModel,r)),featureDrift:featureDrift(train,test)};
  if(evaluation.featureDrift.detected)
    return freezeDeep({...common,status:'ABSTAIN_FEATURE_DRIFT',evaluation});
  if (!(Number.isFinite(modelLogLoss) && modelLogLoss<baselineLogLoss-0.01))
    return freezeDeep({...common,status:'ABSTAIN_NO_HELD_OUT_BENEFIT',evaluation});
  // Better average loss can conceal bad false-positive behavior in a minority
  // class. This gate describes reported outcomes, never verified repair success.
  if(evaluation.classification.falsePositiveRate>LEARNING_LIMITS.maximumFalsePositiveRate)
    return freezeDeep({...common,status:'ABSTAIN_FALSE_POSITIVE_RATE',evaluation});
  const fitted=fit(records);
  const learned={features:fitted.dictionary,weights:fitted.weights};
  const result=freezeDeep({...common,status:'SHADOW_MODEL_TRAINED',evaluation,
    learned,modelDigest:hash({schema:common.schema,dataDigest:common.dataDigest,learned}),
    limitations:['Labels report investigations; they do not verify fixes.',
      'Held-out benefit is on this dataset only; repair authority and live accuracy remain unproven.',
      'Scores are uncalibrated; small non-random reported-outcome samples do not establish population error rates.']});
  models.set(result,{...fitted,records,trainedAt:Date.parse(now)});
  return result;
}
export function predictReportedOutcome({model,incident,action,now}) {
  const at=validateClock(now);
  assert.ok(models.has(model),'Only an in-process trained model is accepted; imported weights are untrusted');
  const fitted=models.get(model);
  assert.ok(at>=fitted.trainedAt && at-fitted.trainedAt<DAY,'Model expired or clock moved backwards');
  const allowed=recommendIncidentInvestigation({incident,memory:{version:1,records:[]},now});
  assert.ok(allowed.recommendations.some(r=>r.action===action),'Unknown investigation action');
  const support=fitted.records.filter(r=>r.category===incident.category && r.route===incident.route && r.action===action);
  const unseen=support.length<3;
  return freezeDeep({schema:'tradehq-shadow-outcome-prediction-v1',
    status:unseen?'ABSTAIN_UNSEEN_CONTEXT':'UNVERIFIED_SHADOW_ESTIMATE',
    action,reportedFailureProbability:unseen?null:probability(fitted,{...incident,action}),
    supportingReports:support.length,dataTrust:'OWNER_REPORTED_UNVERIFIED',
    confidence:{calibrationEstablished:false,supportingDistinctRuns:new Set(support.map(r=>r.runId)).size,
      heldOutRuns:model.evaluation.heldOutRuns,heldOutNegativeReports:model.evaluation.classification.negatives,
      heldOutFalsePositiveRate:model.evaluation.classification.falsePositiveRate},
    rootCauseVerified:false,confirmedRepairOutcomes:0,authorization:deny()});
}
