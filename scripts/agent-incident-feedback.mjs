/** GET-only feedback reader. Native owner reports can suppress advice, never
 * confirm a repair. Historical findings must match an authenticated handoff log.
 * No model, issue write, database, approval, merge or release operation exists.
 */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createGithubEvidenceReader, EVIDENCE_REPOSITORY, EVIDENCE_REPOSITORY_ID } from './github-evidence-reader.mjs';
import { parseIncidentMemory, recommendIncidentInvestigation } from './agent-incident-memory.mjs';

export const FEEDBACK_TITLE = '[TradeHQ Agent] Investigation feedback';
export const FEEDBACK_PREFIX = 'TRADEHQ_INVESTIGATION_FEEDBACK_V1 ';
const HANDOFF_PREFIX = 'TRADEHQ_READONLY_INCIDENT_HANDOFF_V1 ';
const DAY = 86_400_000;
const ID = value => Number.isSafeInteger(value) && value > 0;
const SHA = value => typeof value === 'string' && /^[a-f0-9]{40}$/.test(value);
const DIGEST = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const candidate = value => typeof value === 'string' && /^repair-v1-[a-f0-9]{24}$/.test(value);
function timestamp(value) {
  assert.ok(typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(value), 'Invalid evidence time');
  const n = Date.parse(value);
  assert.ok(Number.isFinite(n) && new Date(n).toISOString().slice(0,19) === value.slice(0,19), 'Invalid evidence time');
  return n;
}
function keys(value, expected) {
  assert.ok(value && Object.getPrototypeOf(value) === Object.prototype
    && Object.getOwnPropertyNames(value).sort().join('|') === [...expected].sort().join('|')
    && Object.getOwnPropertySymbols(value).length === 0
    && Object.values(Object.getOwnPropertyDescriptors(value)).every(d => Object.hasOwn(d, 'value')), 'Unexpected feedback fields');
}
export function incidentForFinding({runId,sha,symptom,path}) {
  const category = ['HTTP_429','REQUEST_OR_RENDER_FAILED','BLANK_ROOT','BUNDLE_UNAVAILABLE'].includes(symptom) ? symptom : 'UNKNOWN';
  // Public dynamic paths are not put into the fixed privacy schema. Abstain.
  const allowed = ['/', '/about', '/learn', '/markets', '/trade', '/portfolio', '/courses', '/daily', '/leaderboard', '/reviews', '/auth', '/admin', '/admin/ai'];
  return allowed.includes(path) ? {runId:String(runId),sha,category,route:path} : null;
}
export function recommendForVerifiedFinding(finding, memory, now) {
  const incident = incidentForFinding(finding);
  if (!incident) return {status:'ABSTAIN_ROUTE_OUTSIDE_MEMORY_SCHEMA', recommendations:[], suppressed:[], rootCauseVerified:false};
  return recommendIncidentInvestigation({incident,memory,now:new Date(now).toISOString()});
}
function feedback(comment, owner, now) {
  // Other comments are not interpreted. A matching malformed owner record stops
  // the entire reader rather than silently forgetting a failed recommendation.
  if (!comment || comment.user?.id !== owner.id || comment.user?.login !== owner.login
    || comment.user?.type !== 'User' || !String(comment.body || '').includes(FEEDBACK_PREFIX)) return null;
  assert.ok(ID(comment.id) && comment.created_at === comment.updated_at, 'Edited or unidentified feedback');
  const at = timestamp(comment.created_at);
  assert.ok(at <= now, 'Future feedback');
  if (now - at > 30*DAY) return null;
  assert.ok(typeof comment.body === 'string' && Buffer.byteLength(comment.body) <= 2048
    && comment.body.startsWith(FEEDBACK_PREFIX) && !comment.body.includes('\n'), 'Invalid feedback envelope');
  let value;
  try { value=JSON.parse(comment.body.slice(FEEDBACK_PREFIX.length)); } catch { throw Error('Malformed feedback'); }
  keys(value,['evidenceRunId','jobId','monitorRunId','candidateId','evidenceDigest','action','outcome']);
  assert.ok(ID(value.evidenceRunId) && ID(value.jobId) && ID(value.monitorRunId)
    && candidate(value.candidateId) && DIGEST(value.evidenceDigest)
    && typeof value.action === 'string'
    && ['reported_failed','reported_rejected','reported_success'].includes(value.outcome), 'Invalid feedback binding');
  return {...value,commentId:comment.id,observedAt:new Date(at).toISOString()};
}
function handoffFromLogs(logs, job) {
  assert.ok(typeof logs === 'string' && Buffer.byteLength(logs) <= 4_000_000, 'Oversized history logs');
  const records=[];
  for (const line of logs.split('\n')) {
    const at=line.indexOf(HANDOFF_PREFIX);
    if (at < 0) continue;
    const prefix=line.slice(0,at);
    assert.ok(/^\uFEFF?\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z\s+$/.test(prefix), 'Handoff is not a console record');
    const logged=Date.parse(prefix.trim());
    assert.ok(logged >= timestamp(job.started_at) && logged <= timestamp(job.completed_at)+1000, 'Handoff time mismatch');
    records.push(JSON.parse(line.slice(at+HANDOFF_PREFIX.length)));
  }
  assert.equal(records.length,1,'Missing or ambiguous historical handoff');
  const record=records[0];
  keys(record,['schema','monitorRunId','monitorSha','targetSha','status','cases','ownerReviewRequired','draftPrCreated','authorization','sha256']);
  const {sha256,...body}=record;
  assert.ok(DIGEST(sha256) && createHash('sha256').update(JSON.stringify(body)).digest('hex') === sha256, 'Changed handoff digest');
  keys(record.authorization,['codeWrites','modelCalls','ownerApproval','draftPrCreation','merge','productionRelease']);
  assert.ok(record.schema === 'tradehq-operational-investigation-handoff-v1'
    && ID(record.monitorRunId) && SHA(record.monitorSha) && SHA(record.targetSha)
    && Array.isArray(record.cases) && record.cases.length <= 42
    && Object.values(record.authorization).every(v=>v===false)
    && record.draftPrCreated === false
    && record.ownerReviewRequired === (record.cases.length>0)
    && record.status === (record.cases.length ? 'OWNER_INVESTIGATION_REQUIRED' : 'NO_VERIFIED_INCIDENT'), 'Invalid historical handoff');
  const seen=new Set();
  for (const item of record.cases) {
    keys(item,['candidateId','path','symptom','evidenceDigest','status']);
    assert.ok(candidate(item.candidateId) && !seen.has(item.candidateId) && DIGEST(item.evidenceDigest)
      && item.status === 'OWNER_INVESTIGATION_REQUIRED'
      && typeof item.path === 'string' && item.path.length <= 180
      && /^\/(?:[A-Za-z0-9._-]+\/?)*$/.test(item.path) && !item.path.startsWith('//')
      && !item.path.split('/').some(x=>x==='.'||x==='..')
      && typeof item.symptom === 'string' && /^[A-Z][A-Z0-9_]{0,63}$/.test(item.symptom), 'Invalid historical finding');
    seen.add(item.candidateId);
  }
  return record;
}

export async function collectIncidentFeedback({mainSha, reader=createGithubEvidenceReader(), now=Date.now()}) {
  assert.ok(SHA(mainSha) && Number.isFinite(now) && now >= 0, 'Invalid history coordinates');
  const repo=await reader.get('');
  assert.ok(repo.id === EVIDENCE_REPOSITORY_ID && repo.full_name === EVIDENCE_REPOSITORY && repo.private === false
    && repo.owner?.id === 297117529 && repo.owner?.login === 'anugaweerasinghe1-del', 'Changed repository/owner identity');
  const main=await reader.get('/branches/main');
  assert.ok(main.commit?.sha === mainSha && main.protected === true, 'History requires protected current main');
  const issues=await reader.list('/issues?state=all',null);
  const matches=issues.filter(x=>!x.pull_request && x.title === FEEDBACK_TITLE);
  assert.ok(matches.length <= 1, 'Ambiguous feedback journal');
  if (!matches.length) return {schema:'tradehq-incident-feedback-v1',status:'NO_FEEDBACK_JOURNAL',memory:{version:1,records:[]},sources:[],confirmedRepairOutcomes:0};
  const issue=matches[0];
  assert.ok(ID(issue.id) && ID(issue.number) && issue.user?.id === repo.owner.id && issue.user?.login === repo.owner.login
    && issue.user?.type === 'User', 'Feedback journal is not owner-authored');
  const comments=await reader.list('/issues/'+issue.number+'/comments',null);
  assert.ok(comments.length <= 100, 'Feedback journal exceeds retention bounds');
  const entries=comments.map(c=>feedback(c,repo.owner,now)).filter(Boolean);
  assert.ok(new Set(entries.map(x=>x.evidenceRunId)).size <= 6, 'History verification exceeds bounded run budget');
  const histories=new Map(), sources=[], records=[], reread=[];
  for (const entry of entries) {
    if (!histories.has(entry.evidenceRunId)) {
      const runPath='/actions/runs/'+entry.evidenceRunId;
      const run=await reader.get(runPath);
      assert.ok(run.id === entry.evidenceRunId && run.workflow_id === 381133473
        && run.path === '.github/workflows/tradehq-verified-evidence.yml' && run.event === 'workflow_run'
        && run.repository?.id === repo.id && run.head_repository?.id === repo.id
        && run.head_branch === 'main' && SHA(run.head_sha) && ID(run.run_attempt)
        && run.status === 'completed' && ['success','failure'].includes(run.conclusion), 'Untrusted historical evidence run');
      const start=timestamp(run.run_started_at), end=timestamp(run.updated_at);
      assert.ok(start <= end && start >= now-30*DAY && end <= now, 'Stale or future historical run');
      const ancestry=await reader.get('/compare/'+run.head_sha+'...'+mainSha);
      assert.ok(['identical','ahead'].includes(ancestry.status) && ancestry.base_commit?.sha === run.head_sha
        && ancestry.merge_base_commit?.sha === run.head_sha, 'History is outside protected main ancestry');
      const jobsPath=runPath+'/attempts/'+run.run_attempt+'/jobs';
      const jobs=await reader.list(jobsPath,'jobs');
      const collect=jobs.filter(j=>j.name === 'collect');
      assert.equal(collect.length,1,'Ambiguous historical collector job');
      const job=collect[0];
      assert.ok(ID(job.id) && job.run_id === run.id && job.head_sha === run.head_sha
        && job.status === 'completed' && ['success','failure'].includes(job.conclusion)
        && timestamp(job.started_at) >= start && timestamp(job.completed_at) <= end+1000, 'Historical job binding mismatch');
      const steps=job.steps?.filter(s=>s.name === 'Record bounded read-only incident or no-incident handoff');
      assert.ok(steps?.length === 1 && steps[0].status === 'completed'
        && ['success','failure'].includes(steps[0].conclusion), 'Historical handoff never executed');
      const handoff=handoffFromLogs(await reader.logs(job.id),job);
      assert.equal(handoff.targetSha,run.head_sha,'Handoff/main binding changed');
      assert.equal(steps[0].conclusion,handoff.cases.length ? 'failure':'success','Handoff step outcome conflicts');
      histories.set(run.id,{run,job,handoff});
      reread.push({path:runPath,value:run},{path:jobsPath,value:jobs,key:'jobs'});
    }
    const {run,job,handoff}=histories.get(entry.evidenceRunId);
    assert.ok(job.id === entry.jobId && handoff.monitorRunId === entry.monitorRunId
      && timestamp(entry.observedAt) >= timestamp(run.updated_at), 'Feedback precedes or changes its evidence');
    const items=handoff.cases.filter(c=>c.candidateId === entry.candidateId && c.evidenceDigest === entry.evidenceDigest);
    assert.equal(items.length,1,'Feedback is not bound to a verified historical finding');
    const item=items[0];
    const incident=incidentForFinding({runId:handoff.monitorRunId,sha:handoff.monitorSha,symptom:item.symptom,path:item.path});
    assert.ok(incident,'Feedback route is outside privacy schema');
    const record={...incident,action:entry.action,outcome:entry.outcome,observedAt:entry.observedAt};
    // Reuse the strict fixed-action schema. Owner feedback cannot add instructions.
    parseIncidentMemory(JSON.stringify({version:1,records:[record]}));
    const prior=records.find(x=>x.runId === record.runId && x.action === record.action);
    if (prior) assert.deepEqual(record,prior,'Conflicting feedback must not replace negative history');
    else records.push(record);
    sources.push({commentId:entry.commentId,evidenceRunId:run.id,jobId:job.id,candidateId:item.candidateId,
      evidenceDigest:item.evidenceDigest,observationTrust:'AUTHENTICATED_WORKFLOW_HANDOFF',outcomeTrust:'OWNER_REPORTED_UNVERIFIED'});
  }
  // A public mutable issue is transport, never a trust assertion. Re-read native
  // records and attempts to catch edits/reruns/branch movement during collection.
  assert.deepEqual(await reader.get('/branches/main'),main,'Main moved during history collection');
  assert.deepEqual(await reader.get('/issues/'+issue.number),issue,'Feedback journal changed during collection');
  assert.deepEqual(await reader.list('/issues/'+issue.number+'/comments',null),comments,'Feedback changed during collection');
  for (const {path,value,key} of reread) assert.deepEqual(key ? await reader.list(path,key) : await reader.get(path),value,'Historical run/attempt changed');
  const memory=parseIncidentMemory(JSON.stringify({version:1,records}));
  return {schema:'tradehq-incident-feedback-v1',status:'AUTHENTICATED_FEEDBACK_READ',memory,sources,confirmedRepairOutcomes:0};
}
