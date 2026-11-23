/** Native current/prior production proof. Fixed-origin GETs only; never rolls back. */
import assert from 'node:assert/strict';
const PROJECT='tradehq-preview',DOMAIN='www.thetradehq.com';
const ROOT='https://api.cloudflare.com/client/v4/accounts/01087d56e4cb7b728a7a9ddbcb12b9bb/pages/projects/'+PROJECT;
const SHA=/^[a-f0-9]{40}$/,UUID=/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/;
const issued=new WeakSet();
function deployment(d,projectId,sha){
 assert.ok(d&&UUID.test(d.id||'')&&d.project_id===projectId&&d.project_name===PROJECT&&d.environment==='production'&&d.latest_stage?.status==='success','Native successful production identity required');
 assert.ok(d.deployment_trigger?.metadata?.branch==='main'&&d.deployment_trigger.metadata.commit_hash===sha,'Native immutable main SHA mismatch');
 return d;
}
async function read(url,token,fetchImpl,json=true){
 let response;
 try{response=await fetchImpl(url,{method:'GET',redirect:'error',signal:AbortSignal.timeout(15000),headers:token?{Authorization:'Bearer '+token,Accept:'application/json'}:{Accept:'text/html'}});}catch{throw Error('Cloudflare release evidence network read failed');}
 assert.equal(response.status,200,json?'Native Cloudflare read unavailable':'Public release witness unavailable');
 const reader=response.body.getReader();let bytes=0;const chunks=[];
 try{while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>1_500_000){await reader.cancel();throw Error('Release evidence exceeds size bound');}chunks.push(Buffer.from(value));}}finally{reader.releaseLock();}
 const text=Buffer.concat(chunks).toString('utf8');if(!json){assert.match(response.headers.get('content-type')||'',/text\/html/);return text;}
 let body;try{body=JSON.parse(text);}catch{throw Error('Malformed native Cloudflare JSON');}
 assert.ok(body.success===true&&body.result,'Native Cloudflare envelope invalid');return body.result;
}
function bundles(html){
 const paths=[...html.matchAll(/(?:src|href)=["'](\/assets\/[^"'<>\s]+\.(?:js|css))["']/g)].map(m=>m[1]);
 const result=[...new Set(paths)].sort();
 assert.ok(result.some(x=>x.endsWith('.js'))&&result.some(x=>x.endsWith('.css'))&&result.length<=30,'Compiled entry script and stylesheet witness required');
 return result;
}
export async function collectCloudflareReleaseEvidence({sha,priorSha,token,fetchImpl=fetch,now=Date.now}={}){
 assert.ok(SHA.test(sha||'')&&SHA.test(priorSha||'')&&sha!==priorSha&&typeof token==='string'&&token.length>=20,'Exact current/prior SHA and native Cloudflare read credential required');
 const started=now();
 const project=await read(ROOT,token,fetchImpl);
 assert.ok(project.name===PROJECT&&project.production_branch==='main'&&typeof project.id==='string'&&project.id.length>0,'Unexpected native project/main binding');
 assert.ok(Array.isArray(project.domains)&&project.domains.includes(DOMAIN),'Native public custom-domain binding required');
 const active=deployment(project.canonical_deployment,project.id,sha);
 assert.ok(Number.isFinite(Date.parse(active.created_on))&&Date.parse(active.created_on)<=now()+60000,'Active native timestamp invalid');
 const immutable=new URL(active.url||'https://invalid.invalid');
 assert.ok(immutable.protocol==='https:'&&immutable.hostname===active.id.slice(0,8)+'.'+PROJECT+'.pages.dev'&&!immutable.port&&immutable.pathname==='/'&&!immutable.search&&!immutable.hash&&!immutable.username&&!immutable.password,'Immutable deployment origin invalid');
 const history=await read(ROOT+'/deployments?env=production&per_page=25',token,fetchImpl);
 assert.ok(Array.isArray(history)&&history.length>0&&history.length<=25,'Bounded native production history required');
 const successful=history.filter(d=>d?.environment==='production'&&d.latest_stage?.status==='success'&&d.deployment_trigger?.metadata?.branch==='main');
 assert.ok(successful.every(d=>Number.isFinite(Date.parse(d.created_on))),'Native history timestamp invalid');
 successful.sort((a,b)=>Date.parse(b.created_on)-Date.parse(a.created_on));
 const prior=successful.find(d=>d.deployment_trigger.metadata.commit_hash!==sha);
 deployment(prior,project.id,priorSha);
 assert.ok(Date.parse(prior.created_on)<=Date.parse(active.created_on),'Recovery candidate is newer than active production');
 assert.notEqual(prior.id,active.id,'Recovery deployment must differ');
 const nativeBundles=bundles(await read(immutable.origin+'/',null,fetchImpl,false));
 const publicBundles=bundles(await read('https://'+DOMAIN+'/',null,fetchImpl,false));
 assert.deepEqual(publicBundles,nativeBundles,'Public compiled release differs from native immutable production');
 const finalProject=await read(ROOT,token,fetchImpl);
 assert.equal(finalProject.id,project.id,'Native project changed during inspection');
 assert.ok(finalProject.name===PROJECT&&finalProject.production_branch==='main'&&finalProject.domains?.includes(DOMAIN),'Native domain/main binding changed during inspection');
 assert.equal(deployment(finalProject.canonical_deployment,project.id,sha).id,active.id,'Active deployment changed during inspection');
 assert.ok(now()>=started&&now()-started<=90000,'Native release evidence time budget exhausted');
 const proof=Object.freeze({source:'authenticated_cloudflare_pages_api',project:PROJECT,domain:DOMAIN,environment:'production',branch:'main',currentSha:sha,priorSha,currentDeploymentId:active.id,priorDeploymentId:prior.id,publicBundles:Object.freeze(publicBundles),observedAt:now(),historyLimit:25,providerRollbackEligible:false,rollbackPerformed:false,productionReleaseAuthorized:false});
 issued.add(proof);return proof;
}
export function assertCloudflareReleaseEvidence(proof,sha,priorSha,currentId,priorId,now=Date.now()){
 assert.ok(proof&&issued.has(proof),'Native Cloudflare proof must be collected in-process; imported JSON is not trusted');
 assert.ok(now>=proof.observedAt&&now-proof.observedAt<=120000,'Native Cloudflare proof stale');
 assert.ok(proof.currentSha===sha&&proof.priorSha===priorSha&&proof.currentDeploymentId===currentId&&proof.priorDeploymentId===priorId,'Native Cloudflare/GitHub deployment binding differs');
}
