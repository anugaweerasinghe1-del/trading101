/** Server-only SQL adapter for the existing signed approval boundary.
 * Disabled by default; tested against disposable databases only. No connection,
 * identity lookup, role grant, public RPC, patch, merge or deployment is created.
 */
import assert from 'node:assert/strict';
const SHA=/^[a-f0-9]{40}$/,DIGEST=/^[a-f0-9]{64}$/;
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const FIELDS=['candidateId','approvalId','ownerId','baseSha','headSha','evidenceDigest','generation','receiptDigest','expiresAt'];
function validate(value) {
  assert.ok(value && Object.getPrototypeOf(value)===Object.prototype
    && Object.getOwnPropertyNames(value).sort().join('|')===[...FIELDS].sort().join('|')
    && Object.getOwnPropertySymbols(value).length===0
    && Object.values(Object.getOwnPropertyDescriptors(value)).every(d=>Object.hasOwn(d,'value')), 'Exact signed binding required');
  assert.ok(typeof value.candidateId==='string' && /^repair-v1-[a-f0-9]{24}$/.test(value.candidateId)
    && typeof value.approvalId==='string' && /^approval-v1-[a-f0-9]{24}$/.test(value.approvalId)
    && typeof value.ownerId==='string' && UUID.test(value.ownerId)
    && typeof value.baseSha==='string' && SHA.test(value.baseSha)
    && typeof value.headSha==='string' && SHA.test(value.headSha) && value.headSha!==value.baseSha
    && typeof value.evidenceDigest==='string' && DIGEST.test(value.evidenceDigest)
    && typeof value.receiptDigest==='string' && DIGEST.test(value.receiptDigest)
    && Number.isSafeInteger(value.generation) && value.generation>=0
    && typeof value.expiresAt==='string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value.expiresAt)
    && Number.isFinite(Date.parse(value.expiresAt)) && new Date(Date.parse(value.expiresAt)).toISOString()===value.expiresAt,
    'Invalid signed binding');
}
async function one(tx,sql,args=[]) {
  const result=await tx.query(sql,args);
  assert.ok(Array.isArray(result?.rows) && result.rows.length===1,'Missing or ambiguous durable state');
  return result.rows[0];
}
export function createRepairApprovalTransaction({database,activationMode='disabled'}) {
  assert.equal(activationMode,'disposable-fixture','Approval transaction is disabled until a private production adapter is approved');
  assert.ok(database && typeof database.transaction==='function','Atomic transaction provider required');
  return async function commitApprovalTransaction(input) {
    validate(input);
    // Copy the verified scalar binding before awaiting anything. A caller cannot
    // mutate its object while the database lock is being acquired.
    const x=Object.fromEntries(FIELDS.map(key=>[key,input[key]]));
    return database.transaction(async tx=>{
      assert.ok(tx && typeof tx.query==='function','Transaction-scoped SQL session required');
      const policy=await one(tx,'SELECT stopped,generation FROM tradehq_repair_control.policy WHERE id=true FOR UPDATE');
      const generation=Number(policy.generation);
      assert.ok(policy.stopped===false && Number.isSafeInteger(generation) && generation===x.generation,
        'Stopped, missing or changed control generation');
      const row=await one(tx,'SELECT base_sha,head_sha,evidence_digest,generation,status,lease_until FROM tradehq_repair_control.candidates WHERE id=$1 FOR UPDATE',[x.candidateId]);
      // Read the clock only AFTER both locks are held. A waiting SELECT must not
      // accidentally use the timestamp from before a blocked lock acquisition.
      const stamp=Date.parse((await one(tx,'SELECT clock_timestamp() AS checked_at')).checked_at);
      const expires=Date.parse(x.expiresAt),lease=Date.parse(row.lease_until);
      assert.ok(row.base_sha===x.baseSha && row.evidence_digest===x.evidenceDigest
        && Number(row.generation)===generation && ['claimed','validated'].includes(row.status)
        && (row.status==='claimed' ? row.head_sha===null : row.head_sha===x.headSha)
        && Number.isFinite(stamp) && Number.isFinite(lease) && lease>stamp && expires>stamp
        && expires<=lease && expires<=stamp+30*60_000,'Candidate, immutable head or server-controlled lease changed');
      const args=[x.candidateId,x.headSha,x.baseSha,x.evidenceDigest,x.expiresAt,x.receiptDigest];
      if (row.status==='claimed') {
        const value=await one(tx,"SELECT tradehq_repair_control.review('validate',$1,$2,$3,$4,$5,$6) AS r",args);
        assert.equal(value.r?.reason,'VALIDATED','Validation transition refused');
      }
      // Unique approval ID, candidate and receipt digest survive reconnect/replay.
      // Any later failure rolls back both registry and every review transition.
      await tx.query('INSERT INTO tradehq_repair_control.approval_receipts (approval_id,owner_id,candidate_id,receipt_digest,base_sha,head_sha,evidence_digest,generation,expires_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)',
        [x.approvalId,x.ownerId,x.candidateId,x.receiptDigest,x.baseSha,x.headSha,x.evidenceDigest,x.generation,x.expiresAt]);
      const approved=await one(tx,"SELECT tradehq_repair_control.review('approve',$1,$2,$3,$4,$5,$6) AS r",args);
      assert.equal(approved.r?.reason,'APPROVED','Approval transition refused');
      const checked=await one(tx,"SELECT tradehq_repair_control.review('check',$1,$2,$3,$4,$5,$6) AS r",args);
      assert.ok(checked.r?.reviewValid===true && checked.r.codeWrites===false && checked.r.productionRelease===false,
        'Approval validity or authority boundary changed');
      const audit=await one(tx,"SELECT count(*)::integer AS n FROM tradehq_repair_control.transition_log WHERE code='APPROVED' AND candidate_id=$1 AND base_sha=$2 AND head_sha=$3 AND evidence_digest=$4 AND generation=$5 AND approval_digest=$6",
        [x.candidateId,x.baseSha,x.headSha,x.evidenceDigest,x.generation,x.receiptDigest]);
      assert.equal(audit.n,1,'Missing or duplicated exact-bound audit transition');
      return Object.freeze({committed:true,replayProtected:true,stopRechecked:true,auditRecorded:true,
        authorization:Object.freeze({codeWrites:false,modelCalls:false,merge:false,productionRelease:false})});
    });
  };
}
