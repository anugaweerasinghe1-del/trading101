import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import YAML from 'yaml';
import {collectVercelProductionEvidence,assertVercelProductionEvidence} from './vercel-production-evidence.mjs';
const sha='a'.repeat(40),token='PRIVATE_VERIFY_TOKEN_SENTINEL';
const snapshot=()=>({id:'dpl_4pkHJhZ68mJrjb6sSg8dCp8jSpkX',name:'trading101',
  project:{id:'prj_PjOhFr0eppPg8hZQhdeBwTniZWOy'},target:'production',readyState:'READY',
  source:'git',createdAt:Date.now()-1000,alias:['thetradehq.com'],aliasError:null,
  meta:{githubCommitRef:'main',githubCommitSha:sha,githubOrg:'anugaweerasinghe1-del',githubRepo:'trading101'},
  env:{PRIVATE_PROVIDER_RESPONSE_SENTINEL:'not for output'}});
let requests=0;
const fetcher=data=>async(url,options)=>{
  requests++;assert.equal(url,'https://api.vercel.com/v13/deployments/thetradehq.com?teamId=team_fjZ5ggg0P43MsYFSIHbeHAAO&withGitRepoInfo=true');
  assert.equal(options.method,'GET');assert.equal(options.redirect,'manual');
  assert.equal(options.headers.Authorization,'Bearer '+token);
  assert.ok(!url.includes(token));return new Response(JSON.stringify(data));
};
let data=snapshot();
const proof=await collectVercelProductionEvidence({sha,token,fetchImpl:fetcher(data)});
assert.equal(requests,2);assertVercelProductionEvidence(proof,sha);
assert.deepEqual(proof.authorization,{merge:false,productionRelease:false});
assert.doesNotMatch(JSON.stringify(proof),/PRIVATE_|not for output/);
assert.throws(()=>assertVercelProductionEvidence(JSON.parse(JSON.stringify(proof)),sha),/imported JSON/);
assert.throws(()=>assertVercelProductionEvidence(proof,'b'.repeat(40)));
assert.throws(()=>assertVercelProductionEvidence(proof,sha,proof.observedAt+120001));
assert.throws(()=>{proof.commitSha='b'.repeat(40);});
for(const edit of [
  x=>x.id='invalid',x=>x.project.id='other',x=>x.projectId='other',x=>x.ownerId='other',
  x=>x.name='other',x=>x.target=null,x=>x.readyState='BUILDING',x=>x.state='ERROR',
  x=>x.source='cli',x=>x.alias=[],x=>x.aliasError={code:'failed'},x=>x.meta.githubCommitRef='feature',
  x=>x.meta.githubCommitSha='b'.repeat(40),x=>x.meta.githubOrg='other',x=>x.meta.githubRepo='other',
  x=>x.createdAt=Date.now()+61000,x=>x.createdAt=-1,x=>x.gitSource={sha:'wrong'},
  x=>x.gitSource={repoId:7},
]){data=snapshot();edit(data);requests=0;
  await assert.rejects(collectVercelProductionEvidence({sha,token,fetchImpl:fetcher(data)}));
  assert.equal(requests,1);
}
requests=0;data=snapshot();
await assert.rejects(collectVercelProductionEvidence({sha,token,fetchImpl:async(url,options)=>{
  const response=await fetcher(data)(url,options);if(requests===1)data={...data,id:'dpl_AnotherValidDeploymentId'};return response;
}}),/alias changed/);
for(const status of [302,401,403,429,500]){requests=0;
  await assert.rejects(collectVercelProductionEvidence({sha,token,fetchImpl:async()=>{requests++;return new Response(null,{status,headers:{location:'https://attacker.invalid'}});}}));
  assert.equal(requests,1,'No redirects, token refresh or authentication retries');
}
await assert.rejects(collectVercelProductionEvidence({sha,token:'short',fetchImpl:()=>{throw Error('Must not fetch');}}));
await assert.rejects(collectVercelProductionEvidence({sha,token,fetchImpl:async()=>new Response('not json')}),/Malformed/);
await assert.rejects(collectVercelProductionEvidence({sha,token,fetchImpl:async()=>new Response('x'.repeat(2000001))}),/Oversized/);
let clock=Date.now();
await assert.rejects(collectVercelProductionEvidence({sha,token,now:()=>clock,fetchImpl:async()=>{
  clock+=35001;return new Response(JSON.stringify(snapshot()));
}}),/time budget/);
const workflow=YAML.parse(readFileSync('.github/workflows/phase3-high-check.yml','utf8'));
const job=workflow.jobs['release-readiness'];
assert.ok(job.if.includes("github.event_name == 'push'") && job.if.includes("github.ref == 'refs/heads/main'"));
assert.deepEqual(job.permissions,{contents:'read',checks:'read',statuses:'read'});
assert.equal(job['timeout-minutes'],15);
assert.equal(job.steps.filter(s=>s.env?.TRADEHQ_VERCEL_VERIFY_TOKEN).length,1);
for(const [name,other] of Object.entries(workflow.jobs))if(!['release-readiness','release-signals'].includes(name))
  assert.ok(!(other.steps||[]).some(s=>s.env?.TRADEHQ_VERCEL_VERIFY_TOKEN));
console.log('Vercel production observer: fixed-origin GETs, exact active alias/project/SHA, READY production, races, imported/stale proof, size/time limits, secret omission and main-only credential scope passed. No live credential or provider call used.');

const signals=workflow.jobs['release-signals'];
assert.equal(signals.if, "${{ (github.event_name == 'push' || github.event_name == 'workflow_dispatch') && github.ref == 'refs/heads/main' && needs.validation.result == 'success' }}");
assert.deepEqual(signals.permissions,{contents:'read',checks:'read',statuses:'read'});
assert.equal(signals.steps[0].with.ref,'${{ github.sha }}');
const presence=signals.steps.filter(s=>s.env?.TRADEHQ_VERCEL_VERIFY_TOKEN);
assert.equal(presence.length,1);
assert.equal(presence[0].id,'native');
assert.ok(!presence[0].run.includes('fetch(') && !presence[0].run.includes('exec('));
assert.ok(presence[0].run.includes('NOT CONFIGURED'));
assert.ok(job.needs.includes('release-signals'));
assert.ok(job.if.includes("needs.release-signals.outputs.native_configured == 'true'"));
assert.ok(job.steps.some(s=>s.run?.includes('Native provider verification credentials required')));
assert.notEqual(signals.name,job.name,'Limited status evidence must not satisfy the deployed publication check name');
