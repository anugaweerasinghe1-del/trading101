/** Read-only recovery plan. No provider write client, consent or rollback API. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const SHA=/^[a-f0-9]{40}$/,UUID=/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/;
const ACCOUNT='01087d56e4cb7b728a7a9ddbcb12b9bb';
const TEAM='team_fjZ5ggg0P43MsYFSIHbeHAAO',PROJECT='prj_PjOhFr0eppPg8hZQhdeBwTniZWOy';
function pages(snapshot,id,sha){
  assert.ok(snapshot?.accountId===ACCOUNT && snapshot.project==='tradehq-preview'
    && snapshot.id===id && UUID.test(id) && snapshot.environment==='production'
    && snapshot.status==='success' && snapshot.commitSha===sha,
    'Provider-confirmed production Pages identity required');
  assert.ok(/^[a-f0-9]{64}$/.test(snapshot.configDigest||''),
    'Configuration fingerprint required');
}
function vercel(snapshot,id,sha){
  assert.ok(snapshot?.teamId===TEAM && snapshot.projectId===PROJECT
    && snapshot.id===id && /^dpl_[A-Za-z0-9]+$/.test(id)
    && snapshot.target==='production' && snapshot.state==='READY' && snapshot.commitSha===sha,
    'Provider-confirmed production Vercel identity required');
  assert.match(snapshot.configDigest||'',/^[a-f0-9]{64}$/);
}
export async function collectRecoveryPreflight({currentSha,priorSha,currentPagesId,priorPagesId,
  currentVercelId,priorVercelId,reader,now=Date.now()}){
  assert.ok(SHA.test(currentSha||'')&&SHA.test(priorSha||'')&&currentSha!==priorSha
    && currentPagesId!==priorPagesId&&currentVercelId!==priorVercelId&&Number.isFinite(now),
    'Distinct immutable current/prior releases required');
  assert.ok(reader&&['main','pagesProject','pagesDeployment','vercelDeployment','activeVercelDeployment'].every(k=>typeof reader[k]==='function'),
    'Independent read-only provider adapters required; imported JSON cannot authorize recovery');
  assert.equal(await reader.main(),currentSha,'Main moved before recovery collection');
  const [project,currentPages,priorPages,currentVercel,priorVercel]=await Promise.all([
    reader.pagesProject(),reader.pagesDeployment(currentPagesId),reader.pagesDeployment(priorPagesId),
    reader.vercelDeployment(currentVercelId),reader.vercelDeployment(priorVercelId),
  ]);
  assert.ok(project?.accountId===ACCOUNT&&project.name==='tradehq-preview'
    && project.productionDeploymentId===currentPagesId&&project.productionBranch==='main'
    && project.domains?.includes('www.thetradehq.com'),'Current production domain mapping required');
  pages(currentPages,currentPagesId,currentSha);pages(priorPages,priorPagesId,priorSha);
  vercel(currentVercel,currentVercelId,currentSha);vercel(priorVercel,priorVercelId,priorSha);
  assert.equal(await reader.activeVercelDeployment(),currentVercelId,'Current Vercel production alias differs');
  assert.equal(priorPages.rollbackEligible,true,'Cloudflare rollback eligibility unverified');
  assert.equal(priorVercel.rollbackEligible,true,'Vercel rollback eligibility unverified');
  assert.ok(currentPages.configDigest===priorPages.configDigest
    && currentVercel.configDigest===priorVercel.configDigest,'Provider configuration changed; manual engineering review required');
  // Re-read production mapping and main to detect races during provider calls.
  const endProject=await reader.pagesProject();
  assert.deepEqual(endProject,project,'Cloudflare production mapping changed while collecting');
  assert.equal(await reader.activeVercelDeployment(),currentVercelId,'Vercel production alias changed while collecting');
  assert.equal(await reader.main(),currentSha,'Main moved during recovery collection');
  const report={schema:'tradehq-readonly-recovery-preflight-v1',checkedAt:new Date(now).toISOString(),
    expiresAt:new Date(now+15*60_000).toISOString(),currentSha,priorSha,
    current:{pagesId:currentPagesId,vercelId:currentVercelId},
    candidate:{pagesId:priorPagesId,vercelId:priorVercelId},
    configuration:{pages:currentPages.configDigest,vercel:currentVercel.configDigest},
    status:'ELIGIBLE_CANDIDATE_REQUIRES_SEPARATE_OWNER_APPROVAL',
    eligibilityScope:'Provider snapshots only; adapter authentication must be independently established',
    authorization:{ownerApproval:false,providerWrites:false,rollback:false,productionRelease:false},
    rollbackPerformed:false,
    limitations:['This module has no live Cloudflare adapter or production activation.',
      'It cannot undo database, secrets, DNS, cron or provider configuration changes.',
      'A real rollback/restore drill and fresh provider verification are still required.']};
  return {...report,sha256:createHash('sha256').update(JSON.stringify(report)).digest('hex')};
}

/** Re-collect BOTH providers after an owner-operated rollback or restoration.
 * Snapshot verification is read-only and never authorizes a subsequent release.
 */
export async function collectRecoveryOutcome({plan,mode,reader,now=Date.now()}){
  assert.ok(['rollback','restore'].includes(mode)&&Number.isFinite(now),'Unknown recovery observation');
  const {sha256,...body}=plan||{};
  assert.equal(createHash('sha256').update(JSON.stringify(body)).digest('hex'),sha256,'Recovery plan changed');
  assert.ok(plan.schema==='tradehq-readonly-recovery-preflight-v1'
    && Object.values(plan.authorization||{}).length===4
    && Object.values(plan.authorization).every(v=>v===false)
    && Date.parse(plan.checkedAt)<=now && now<=Date.parse(plan.expiresAt),
    'Only a fresh read-only bound plan is accepted');
  const target=mode==='rollback'?plan.candidate:plan.current;
  const sha=mode==='rollback'?plan.priorSha:plan.currentSha;
  assert.equal(await reader.main(),plan.currentSha,'Git main changed during recovery');
  const project=await reader.pagesProject();
  assert.ok(project?.accountId===ACCOUNT&&project.name==='tradehq-preview'
    && project.productionBranch==='main'&&project.productionDeploymentId===target.pagesId
    && project.domains?.includes('www.thetradehq.com'),'Cloudflare active production target differs');
  const [cf,vc,activeVercel]=await Promise.all([
    reader.pagesDeployment(target.pagesId),reader.vercelDeployment(target.vercelId),reader.activeVercelDeployment(),
  ]);
  pages(cf,target.pagesId,sha);vercel(vc,target.vercelId,sha);
  assert.equal(cf.configDigest,plan.configuration?.pages,'Cloudflare configuration changed after preflight');
  assert.equal(vc.configDigest,plan.configuration?.vercel,'Vercel configuration changed after preflight');
  assert.equal(activeVercel,target.vercelId,'Vercel production alias still points to another deployment');
  for(const path of ['/','/trade','/courses','/daily','/auth']){
    const route=await reader.publicRoute(path);
    assert.ok(route?.status===200&&route.contentType?.includes('text/html')
      && typeof route.body==='string'&&route.body.includes('<title')
      &&route.body.includes('TradeHQ')&&route.body.length>2000,'Recovered public route unavailable');
  }
  assert.deepEqual(await reader.pagesProject(),project,'Cloudflare production target changed while verifying');
  assert.equal(await reader.activeVercelDeployment(),target.vercelId,'Vercel production target changed while verifying');
  assert.equal(await reader.main(),plan.currentSha,'Git main changed while verifying recovery');
  return {schema:'tradehq-readonly-recovery-outcome-v1',mode,observedSha:sha,
    pagesId:target.pagesId,vercelId:target.vercelId,planDigest:sha256,
    status:'PROVIDER_SNAPSHOTS_AND_PUBLIC_ROUTES_VERIFIED',
    authorization:{ownerApproval:false,providerWrites:false,productionRelease:false},
    limitations:['Snapshot checks are not authenticated end-to-end tests or proof of a live drill.',
      'No live Cloudflare adapter is installed; current acceptance is offline only.']};
}
