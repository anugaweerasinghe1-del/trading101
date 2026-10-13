/** Private orchestration for one mechanically LOW About-page draft.
 * No HTTP route, database connection, model, token, merge or deployment method.
 * Disabled by default. Operator-provided adapters must independently verify
 * evidence, reproduce the symptom and enforce durable claims; never accept
 * these callbacks or incident packets from an HTTP request/model response.
 */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { classifyRepairScope } from './agent-repair-review.mjs';
const SHA=/^[a-f0-9]{40}$/,DIGEST=/^[a-f0-9]{64}$/;
const FILE='src/pages/About.tsx';
const hash=value=>createHash('sha256').update(value).digest('hex');
const required=['collectFreshIncident','readMainSha','readBaseSource','planChange','reproduceIndependently',
  'claimCandidate','readClaim','prepareIsolatedCommit','readIsolatedChange','validateIndependently',
  'publishDraft','readDraft','closeDraft'];
export function createConstrainedRepairRunner({adapters,activationMode='disabled',clock=Date.now}) {
  assert.equal(activationMode,'low-risk-draft-only','Repair runner is disabled');
  assert.ok(adapters && required.every(name=>typeof adapters[name]==='function') && typeof clock==='function',
    'Private evidence, durable control, isolation, validation and draft adapters required');
  return async function prepareRepair(candidateId) {
    assert.ok(typeof candidateId==='string' && /^repair-v1-[a-f0-9]{24}$/.test(candidateId),'Invalid candidate');
    // The caller selects only an identity; every fact is collected internally.
    const baseSha=await adapters.readMainSha(); assert.ok(SHA.test(baseSha),'Missing immutable main');
    const incident=await adapters.collectFreshIncident(candidateId);
    const stamp=clock();
    assert.ok(Number.isFinite(stamp) && incident?.schema==='tradehq-server-incident-v1'
      && incident.verified===true && incident.rootCauseReproduced===true && incident.sourceScope==='LOW'
      && incident.candidateId===candidateId && incident.baseSha===baseSha
      && incident.path==='/about' && ['browser','manual'].includes(incident.source)
      && ['LAYOUT_OVERFLOW','HEADING_READABILITY'].includes(incident.symptom)
      && DIGEST.test(incident.evidenceDigest||'') && Number.isFinite(incident.observedAt)
      && incident.observedAt<=stamp && incident.observedAt>=stamp-30*60_000,
      'Independently reproduced fresh narrow incident required');
    const evidenceDigest=incident.evidenceDigest;
    const before=await adapters.readBaseSource({baseSha,path:FILE});
    assert.ok(typeof before==='string' && before.length>0 && before.length<=64_000,'Bounded exact-base source required');
    const after=await adapters.planChange({candidateId,baseSha,path:FILE,before,evidenceDigest});
    const change={path:FILE,status:'modified',before,after};
    assert.equal(classifyRepairScope([change]).risk,'LOW','Change exceeds the independent mechanical allowlist');
    const reproduction=await adapters.reproduceIndependently({candidateId,baseSha,evidenceDigest,change});
    assert.ok(reproduction?.candidateId===candidateId && reproduction.baseSha===baseSha
      && reproduction.evidenceDigest===evidenceDigest && reproduction.beforeFailed===true
      && reproduction.afterPassed===true && reproduction.beforeDigest===hash(before)
      && reproduction.afterDigest===hash(after),'Before/after reproduction does not bind the exact source');
    const claimed=await adapters.claimCandidate({candidateId,baseSha,evidenceDigest,
      source:incident.source,symptom:incident.symptom,observedAt:incident.observedAt,risk:'LOW'});
    assert.ok(claimed?.claimed===true && Number.isSafeInteger(claimed.generation)
      && claimed.generation>=0,'Durable claim refused; do not retry or reset history');
    const generation=claimed.generation;
    async function guard() {
      assert.equal(await adapters.readMainSha(),baseSha,'Main changed during repair preparation');
      const state=await adapters.readClaim(candidateId),now=clock();
      assert.ok(Number.isFinite(now) && state?.stopped===false && state.candidateId===candidateId
        && state.baseSha===baseSha && state.evidenceDigest===evidenceDigest
        && state.generation===generation && state.status==='claimed'
        && Number.isFinite(state.leaseUntil) && state.leaseUntil>now
        && state.leaseUntil<=now+30*60_000,'Stopped, expired, missing or changed durable claim');
    }
    await guard();
    const proposal=await adapters.prepareIsolatedCommit({candidateId,baseSha,evidenceDigest,change});
    assert.ok(SHA.test(proposal?.headSha||'') && proposal.headSha!==baseSha,'No immutable isolated proposal');
    const headSha=proposal.headSha;
    const observed=await adapters.readIsolatedChange({baseSha,headSha});
    assert.ok(Array.isArray(observed) && observed.length===1 && observed[0]?.path===FILE
      && observed[0].status==='modified' && observed[0].before===before && observed[0].after===after,
      'Isolated commit changed unexpected bytes or paths');
    assert.equal(classifyRepairScope(observed).risk,'LOW','Final source scope changed');
    await guard();
    const checked=await adapters.validateIndependently({candidateId,baseSha,headSha,evidenceDigest});
    assert.ok(checked?.baseSha===baseSha && checked.headSha===headSha && checked.passed===true
      && checked.independent===true,'Independent exact-head checks failed');
    await guard();
    // A database lock cannot atomically cover an external GitHub request. If stop
    // wins during publication, close the draft and retain the consumed attempt.
    // Cleanup failure is surfaced; this runner never retries publication.
    let published;
    try {
      published=await adapters.publishDraft({candidateId,baseSha,headSha,evidenceDigest,
        path:FILE,risk:'LOW',draft:true,generation});
      assert.ok(Number.isSafeInteger(published?.number) && published.number>0);
    } catch {
      throw Error('Draft publication is inconclusive; owner inspection required, consumed attempt retained and no retry allowed');
    }
    const number=published.number;
    try {
      const draft=await adapters.readDraft(number);
      assert.ok(draft?.state==='open' && draft.draft===true && draft.baseSha===baseSha
        && draft.headSha===headSha && draft.changedPaths?.length===1 && draft.changedPaths[0]===FILE,
        'Published draft does not match independently checked proposal');
      await guard();
    } catch {
      try { await adapters.closeDraft(number); }
      catch { throw Error('Draft #'+number+' needs owner cleanup after a failed guard; no retry, merge or release allowed'); }
      throw Error('Draft #'+number+' closed after a failed guard; attempt history retained');
    }
    return Object.freeze({schema:'tradehq-constrained-repair-draft-v1',status:'DRAFT_REQUIRES_REVIEW',
      candidateId,baseSha,headSha,evidenceDigest,generation,number,risk:'LOW',
      authorization:Object.freeze({modelCalls:false,merge:false,productionRelease:false}),
      limitations:Object.freeze(['Server adapters and live control installation need separate verification.',
        'A draft is not owner approval or a release; fresh exact-head CI and both previews remain required.'])});
  };
}
