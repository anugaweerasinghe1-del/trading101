import assert from 'node:assert/strict';
import {collectCloudflareReleaseEvidence,assertCloudflareReleaseEvidence} from './cloudflare-release-evidence.mjs';
import {verifyReleaseWitness} from './agent-release-recovery-readiness.mjs';
const sha='a'.repeat(40),priorSha='b'.repeat(40),id='6830d3c4-5e05-4bea-a46d-4941dc0d11ab',old='21ea7e49-4ee5-44b7-85d0-1dd4f3bd9077';
const token='PRIVATE_CLOUDFLARE_READ_SENTINEL',secret='DO_NOT_EMIT_NATIVE_ENV';
const d=(commit,uuid,date)=>({id:uuid,project_id:'native-project',project_name:'tradehq-preview',environment:'production',latest_stage:{status:'success'},created_on:date,deployment_trigger:{metadata:{branch:'main',commit_hash:commit}},url:'https://'+uuid.slice(0,8)+'.tradehq-preview.pages.dev',env_vars:{PRIVATE:{value:secret}}});
const current=()=>d(sha,id,'2026-11-23T12:00:00Z'),previous=()=>d(priorSha,old,'2026-11-23T11:00:00Z');
const project=()=>({id:'native-project',name:'tradehq-preview',production_branch:'main',domains:['www.thetradehq.com'],canonical_deployment:current(),env_vars:{SECRET:secret}});
const html='<html><script type="module" src="/assets/index-reviewed.js"></script><link rel="stylesheet" href="/assets/index-reviewed.css"></html>';
const root='https://api.cloudflare.com/client/v4/accounts/01087d56e4cb7b728a7a9ddbcb12b9bb/pages/projects/tradehq-preview';
let requests=[];
const fetcher=(edit=()=>{})=>async(url,init)=>{
 requests.push(url);assert.equal(init.method,'GET');assert.equal(init.redirect,'error');
 let body,type;
 if(url.startsWith(root)){assert.equal(init.headers.Authorization,'Bearer '+token);body={success:true,result:url.includes('/deployments?')?[current(),previous()]:project()};type='application/json';}
 else{assert(['https://6830d3c4.tradehq-preview.pages.dev/','https://www.thetradehq.com/'].includes(url));assert(!init.headers.Authorization);body=html;type='text/html';}
 const changed=edit(body,url,requests.length);if(changed!==undefined)body=changed;
 return new Response(typeof body==='string'?body:JSON.stringify(body),{headers:{'Content-Type':type}});
};
const make=async(edit=()=>{})=>{requests=[];return collectCloudflareReleaseEvidence({sha,priorSha,token,fetchImpl:fetcher(edit)});};
const proof=await make();assert.equal(requests.length,5);assert.equal(proof.currentDeploymentId,id);assert.equal(proof.priorDeploymentId,old);assert.equal(proof.domain,'www.thetradehq.com');assert.equal(proof.rollbackPerformed,false);
assertCloudflareReleaseEvidence(proof,sha,priorSha,id,old);
assert.throws(()=>assertCloudflareReleaseEvidence(JSON.parse(JSON.stringify(proof)),sha,priorSha,id,old),/imported JSON/);
assert.throws(()=>assertCloudflareReleaseEvidence(proof,sha,priorSha,id,old,proof.observedAt+120001),/stale/);
assert.throws(()=>assertCloudflareReleaseEvidence(proof,sha,priorSha,old,id),/binding differs/);
for(const value of [token,secret,'env_vars'])assert(!JSON.stringify(proof).includes(value));
const edits=[
 (b,u)=>{if(u===root)b.result.domains=[];},
 (b,u)=>{if(u===root)b.result.production_branch='preview';},
 (b,u)=>{if(u===root)b.result.canonical_deployment.environment='preview';},
 (b,u)=>{if(u===root)b.result.canonical_deployment.project_id='other';},
 (b,u)=>{if(u===root)b.result.canonical_deployment.latest_stage.status='failure';},
 (b,u)=>{if(u===root)b.result.canonical_deployment.deployment_trigger.metadata.commit_hash=priorSha;},
 (b,u)=>{if(u===root)b.result.canonical_deployment.url='https://attacker.example/';},
 (b,u)=>{if(u.includes('/deployments?'))b.result=[current()];},
 (b,u)=>{if(u.includes('/deployments?'))b.result[1].latest_stage.status='failure';},
 (b,u)=>{if(u.includes('/deployments?'))b.result[1].deployment_trigger.metadata.commit_hash='c'.repeat(40);},
 (b,u)=>{if(u.includes('/deployments?'))b.result[1].created_on='invalid';},
 (b,u)=>{if(u==='https://www.thetradehq.com/')return html.replace('index-reviewed.js','index-stale.js');},
 (b,u)=>{if(u.startsWith('https://6830d3c4.'))return '<html>TradeHQ loading</html>';},
 (b,u,n)=>{if(n===5)b.result.canonical_deployment.id=old;},
 (b,u,n)=>{if(n===5)b.result.domains=[];},
];
for(const edit of edits)await assert.rejects(make(edit));
await assert.rejects(collectCloudflareReleaseEvidence({sha,priorSha,token,fetchImpl:async()=>new Response('{}',{status:403})}),/unavailable/);
await assert.rejects(collectCloudflareReleaseEvidence({sha,priorSha,token,fetchImpl:async()=>{throw Error(token)}}),e=>!e.message.includes(token));
await assert.rejects(collectCloudflareReleaseEvidence({sha,priorSha,token,fetchImpl:async()=>new Response('x'.repeat(1500001))}),/size bound/);
await assert.rejects(collectCloudflareReleaseEvidence({sha,priorSha,token:'short',fetchImpl:()=>{throw Error('must not fetch')}}));
const names=['TradeHQ Phase 3 tests','TradeHQ Cloudflare compatibility / Cloudflare build and SEO','TradeHQ Required validation'];
const cf=(commit,uuid)=>({id:90,name:'Cloudflare Pages',head_sha:commit,status:'completed',conclusion:'success',external_id:uuid,app:{id:85455,slug:'cloudflare-workers-and-pages'},details_url:'https://dash.cloudflare.com/?to=/01087d56e4cb7b728a7a9ddbcb12b9bb/pages/view/tradehq-preview/'+uuid});
const witness=()=>({head:{protected:true,commit:{sha}},commit:{sha,parents:[{sha:priorSha}]},checks:[...names.map((name,i)=>({id:i+1,name,head_sha:sha,status:'completed',conclusion:'success',app:{id:15368,slug:'github-actions'}})),cf(sha,id)],previousChecks:[cf(priorSha,old)],statuses:[],previousStatuses:[],cloudflareProvider:proof});
const report=verifyReleaseWitness(witness());assert.equal(report.productionHost,'cloudflare');assert.equal(report.schema,'tradehq-release-recovery-readiness-v2');assert.equal(report.productionReleaseAuthorized,false);assert.equal(report.ownerApproval,false);assert.equal(report.providerRollbackEligible,false);
for(const change of [x=>x.head.protected=false,x=>x.checks[0].conclusion='failure',x=>x.checks[0].head_sha=priorSha,x=>x.previousChecks[0].external_id=id,x=>x.cloudflareProvider=JSON.parse(JSON.stringify(proof))]){const x=witness();change(x);assert.throws(()=>verifyReleaseWitness(x));}
const retired=witness();retired.statuses=[{context:'Vercel',state:'failure'}];assert.equal(verifyReleaseWitness(retired).productionHost,'cloudflare','Retired provider status cannot stand in for authoritative native proof');
console.log('PASS native Cloudflare current/prior/domain/main/CI bindings, immutable/public compiled entry matching, races, secret/size/time bounds and forged proof rejection; no rollback or publication authorized. Fixtures only.');
