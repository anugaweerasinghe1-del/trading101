/** Disabled, disposable-only adapter. No connection, route, role, worker,
 * model, draft publication or release. Authentication alone grants no action.
 * The operator owns every adapter and independently reproduces evidence before
 * this boundary; never install caller/model-supplied adapters in a server.
 */
import assert from 'node:assert/strict';
import { assertCurrentGitHubJob } from './agent-github-workload-identity.mjs';
const SHA=/^[a-f0-9]{40}$/,DIGEST=/^[a-f0-9]{64}$/;
const FIELDS=['candidateId','baseSha','evidenceDigest','source','symptom','observedAt','generation'];
async function one(tx,query,args=[]) {
  const result=await tx.query(query,args);
  assert.ok(Array.isArray(result?.rows)&&result.rows.length===1,'Unambiguous durable state required');
  return result.rows[0];
}
function binding(input) {
  assert.ok(input&&Object.getPrototypeOf(input)===Object.prototype
    &&Object.getOwnPropertyNames(input).sort().join('|')===[...FIELDS].sort().join('|')
    &&Object.getOwnPropertySymbols(input).length===0
    &&Object.values(Object.getOwnPropertyDescriptors(input)).every(d=>Object.hasOwn(d,'value')),
    'Exact server-collected claim binding required');
  const x=Object.fromEntries(FIELDS.map(k=>[k,input[k]]));
  assert.ok(typeof x.candidateId==='string'&&/^repair-v1-[a-f0-9]{24}$/.test(x.candidateId)
    &&typeof x.baseSha==='string'&&SHA.test(x.baseSha)
    &&typeof x.evidenceDigest==='string'&&DIGEST.test(x.evidenceDigest)
    &&['browser','manual'].includes(x.source)&&['HEADING_READABILITY','LAYOUT_OVERFLOW'].includes(x.symptom)
    &&Number.isSafeInteger(x.generation)&&x.generation>=0
    &&typeof x.observedAt==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(x.observedAt)
    &&Number.isFinite(Date.parse(x.observedAt))&&new Date(x.observedAt).toISOString()===x.observedAt,
    'Invalid server-collected claim binding');
  return x;
}
export function createWorkloadClaimTransaction({database,readMainSha,activationMode='disabled',clock=Date.now}={}) {
  assert.equal(activationMode,'disposable-fixture','Workload claims are disabled; production activation needs separate approval');
  assert.ok(database&&typeof database.transaction==='function'&&typeof readMainSha==='function'&&typeof clock==='function');
  return async function claimOnce(principal,input) {
    const x=binding(input);
    assertCurrentGitHubJob(principal,{mainSha:x.baseSha,clock});
    assert.equal(await readMainSha(),x.baseSha,'Main changed before claim');
    return database.transaction(async tx=>{
      const policy=await one(tx,'SELECT stopped,generation FROM tradehq_repair_control.policy WHERE id=true FOR UPDATE');
      assert.ok(policy.stopped===false&&Number(policy.generation)===x.generation,'Stopped, missing or changed generation');
      assert.equal(await readMainSha(),x.baseSha,'Main changed while waiting for claim');
      // The database clock AFTER the lock/network wait controls admission.
      const checked=Date.parse((await one(tx,'SELECT clock_timestamp() AS checked_at')).checked_at);
      assertCurrentGitHubJob(principal,{mainSha:x.baseSha,clock:()=>checked});
      const observed=Date.parse(x.observedAt);
      assert.ok(observed<=checked&&observed>=checked-30*60_000,'Fresh independently reproduced incident required');
      const count=await one(tx,'SELECT count(*)::integer AS n FROM tradehq_repair_control.workload_receipts');
      assert.ok(Number.isSafeInteger(count.n)&&count.n<100,'Receipt capacity requires owner review; no automatic reset');
      const claimed=await one(tx,'SELECT tradehq_repair_control.claim($1,$2,$3,$4,$5,$6,$7) AS r',
        [x.candidateId,x.source,x.symptom,x.baseSha,x.evidenceDigest,x.observedAt,'LOW']);
      assert.ok(claimed.r?.claimed===true&&claimed.r.reason==='CLAIMED'
        &&claimed.r.codeWrites===false&&claimed.r.productionRelease===false,'Durable claim denied; no retry or reset');
      await tx.query('INSERT INTO tradehq_repair_control.workload_receipts (token_digest,candidate_id,base_sha,evidence_digest,run_id,run_attempt,check_id,generation,expires_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)',
        [principal.tokenDigest,x.candidateId,x.baseSha,x.evidenceDigest,principal.runId,principal.attempt,principal.checkId,x.generation,new Date(principal.expiresAt).toISOString()]);
      const candidate=await one(tx,'SELECT base_sha,evidence_digest,generation,status,attempts,lease_until FROM tradehq_repair_control.candidates WHERE id=$1',[x.candidateId]);
      const finalAt=Date.parse((await one(tx,'SELECT clock_timestamp() AS checked_at')).checked_at);
      assertCurrentGitHubJob(principal,{mainSha:x.baseSha,clock:()=>finalAt});
      assert.ok(candidate.base_sha===x.baseSha&&candidate.evidence_digest===x.evidenceDigest
        &&Number(candidate.generation)===x.generation&&candidate.status==='claimed'&&candidate.attempts===1
        &&Date.parse(candidate.lease_until)>finalAt,'Claim binding or lease changed');
      return Object.freeze({claimed:true,generation:x.generation,replayProtected:true,stopRechecked:true,
        authorization:Object.freeze({codeWrites:false,ownerApproval:false,modelCalls:false,merge:false,productionRelease:false})});
    });
  };
}
