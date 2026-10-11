/** Offline provider fixtures only; never touches live deployments. */
import assert from 'node:assert/strict';
import {collectRecoveryPreflight,collectRecoveryOutcome} from './agent-recovery-preflight.mjs';
const currentSha='a'.repeat(40),priorSha='b'.repeat(40);
const currentPagesId='6830d3c4-5e05-4bea-a46d-4941dc0d11ab',priorPagesId='21ea7e49-4ee5-44b7-85d0-1dd4f3bd9077';
const currentVercelId='dpl_CurrentFixture',priorVercelId='dpl_PreviousFixture';
const digest='c'.repeat(64),accountId='01087d56e4cb7b728a7a9ddbcb12b9bb';
function fixture(){
  const project={accountId,name:'tradehq-preview',productionDeploymentId:currentPagesId,productionBranch:'main',domains:['www.thetradehq.com']};
  const cf=(id,commitSha)=>({accountId,project:'tradehq-preview',id,commitSha,environment:'production',status:'success',configDigest:digest,rollbackEligible:true});
  const vc=(id,commitSha)=>({teamId:'team_fjZ5ggg0P43MsYFSIHbeHAAO',projectId:'prj_PjOhFr0eppPg8hZQhdeBwTniZWOy',id,commitSha,target:'production',state:'READY',configDigest:digest,rollbackEligible:true});
  const snapshots={project,currentPages:cf(currentPagesId,currentSha),priorPages:cf(priorPagesId,priorSha),currentVercel:vc(currentVercelId,currentSha),priorVercel:vc(priorVercelId,priorSha)};
  let reads=0;
  const reader={main:async()=>currentSha,pagesProject:async()=>structuredClone(snapshots.project),
    activeVercelDeployment:async()=>currentVercelId,
    pagesDeployment:async id=>{reads++;return id===currentPagesId?snapshots.currentPages:snapshots.priorPages},
    vercelDeployment:async id=>{reads++;return id===currentVercelId?snapshots.currentVercel:snapshots.priorVercel}};
  return {snapshots,reader,readCount:()=>reads};
}
const input={currentSha,priorSha,currentPagesId,priorPagesId,currentVercelId,priorVercelId};
const good=fixture();const report=await collectRecoveryPreflight({...input,reader:good.reader});
assert.equal(good.readCount(),4);assert.equal(report.rollbackPerformed,false);
assert.ok(Object.values(report.authorization).every(v=>v===false));
assert.match(report.sha256,/^[a-f0-9]{64}$/);
for(const alter of [
  f=>f.snapshots.priorPages.environment='preview',f=>f.snapshots.priorPages.rollbackEligible=false,
  f=>delete f.snapshots.priorPages.rollbackEligible,f=>f.snapshots.priorVercel.rollbackEligible=false,
  f=>f.snapshots.priorPages.commitSha=currentSha,f=>f.snapshots.priorPages.project='other',
  f=>f.snapshots.currentPages.accountId='other',f=>f.snapshots.priorVercel.teamId='other',
  f=>f.snapshots.priorVercel.state='ERROR',f=>f.snapshots.priorVercel.target='preview',
  f=>f.snapshots.priorVercel.configDigest='d'.repeat(64),
  f=>f.snapshots.project.productionDeploymentId=priorPagesId,
  f=>f.snapshots.project.domains=[],f=>f.reader.main=async()=>priorSha,
  f=>f.reader.activeVercelDeployment=async()=>priorVercelId,
  f=>{let n=0;f.reader.activeVercelDeployment=async()=>++n===1?currentVercelId:priorVercelId},
  f=>{let n=0;f.reader.main=async()=>++n===1?currentSha:priorSha},
  f=>{let n=0;f.reader.pagesProject=async()=>({...f.snapshots.project,productionBranch:++n===1?'main':'other'})},
]){const f=fixture();alter(f);await assert.rejects(collectRecoveryPreflight({...input,reader:f.reader}));}
await assert.rejects(collectRecoveryPreflight({...input,reader:{},ownerApproval:true,rollbackEligible:true}));
console.log('OFFLINE_RECOVERY_PREFLIGHT_PASS: exact provider/account/project/production/SHA bindings; eligible prior snapshots; matching configuration; race checks; all mutations and approval false. No live eligibility claim or rollback performed.');

// A complete offline rollback -> verification -> restore -> verification rehearsal.
// These provider snapshots are synthetic; no provider action is called.
const drill=fixture(),plan=await collectRecoveryPreflight({...input,reader:drill.reader});
let activeVercel=currentVercelId;
drill.reader.activeVercelDeployment=async()=>activeVercel;
drill.reader.publicRoute=async()=>({status:200,contentType:'text/html',body:'<title>TradeHQ fixture</title>'+('TradeHQ fixture route. '.repeat(150))});
drill.snapshots.project.productionDeploymentId=priorPagesId;
activeVercel=priorVercelId;
const rolledBack=await collectRecoveryOutcome({plan,mode:'rollback',reader:drill.reader});
assert.equal(rolledBack.observedSha,priorSha);
assert.ok(Object.values(rolledBack.authorization).every(v=>v===false));
activeVercel=currentVercelId;
await assert.rejects(collectRecoveryOutcome({plan,mode:'rollback',reader:drill.reader}),/Vercel production alias/);
drill.snapshots.project.productionDeploymentId=currentPagesId;
const restored=await collectRecoveryOutcome({plan,mode:'restore',reader:drill.reader});
assert.equal(restored.observedSha,currentSha);
drill.snapshots.currentPages.configDigest='d'.repeat(64);
await assert.rejects(collectRecoveryOutcome({plan,mode:'restore',reader:drill.reader}),/configuration changed/);
drill.snapshots.currentPages.configDigest=digest;
drill.snapshots.currentVercel.configDigest='d'.repeat(64);
await assert.rejects(collectRecoveryOutcome({plan,mode:'restore',reader:drill.reader}),/configuration changed/);
drill.snapshots.currentVercel.configDigest=digest;
await assert.rejects(collectRecoveryOutcome({plan:{...plan,priorSha:currentSha},mode:'restore',reader:drill.reader}),/plan changed/);
await assert.rejects(collectRecoveryOutcome({plan,mode:'restore',reader:drill.reader,now:Date.parse(plan.expiresAt)+1}),/fresh/);
drill.reader.publicRoute=async()=>({status:500});
await assert.rejects(collectRecoveryOutcome({plan,mode:'restore',reader:drill.reader}),/route unavailable/);
console.log('OFFLINE_ROLLBACK_RESTORE_REHEARSAL_PASS: eligible synthetic targets, separate two-provider rollback/restore observations, route probes, stale/tampered plans and partial provider recovery rejected. No live drill or authorization.');
