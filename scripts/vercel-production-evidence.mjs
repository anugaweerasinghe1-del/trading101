/** Fixed-origin authenticated GETs only. Never exports raw provider responses. */
import assert from 'node:assert/strict';
const TEAM='team_fjZ5ggg0P43MsYFSIHbeHAAO';
const PROJECT='prj_PjOhFr0eppPg8hZQhdeBwTniZWOy';
const endpoint='https://api.vercel.com/v13/deployments/thetradehq.com?teamId='+TEAM+'&withGitRepoInfo=true';
const minted=new WeakSet();
function select(data,sha,now){
  assert.ok(data && /^dpl_[A-Za-z0-9]{10,80}$/.test(data.id||'')
    && (data.projectId===PROJECT || data.project?.id===PROJECT)
    && (!data.projectId || data.projectId===PROJECT)
    && (!data.project || data.project.id===PROJECT)
    && (!data.ownerId || data.ownerId===TEAM)
    && data.name==='trading101' && data.target==='production'
    && data.readyState==='READY' && (!data.state || data.state==='READY')
    && data.source==='git' && data.aliasError==null
    && Array.isArray(data.alias) && data.alias.includes('thetradehq.com')
    && data.meta?.githubCommitRef==='main' && data.meta.githubCommitSha===sha
    && data.meta.githubRepo==='trading101' && data.meta.githubOrg==='anugaweerasinghe1-del'
    && Number.isSafeInteger(data.createdAt) && data.createdAt>0 && data.createdAt<=now+60000,
    'Exact READY production Vercel alias/project/commit evidence required');
  if(data.gitSource?.sha)assert.ok(data.gitSource.sha===sha,'Conflicting Vercel source SHA');
  if(data.gitSource?.repoId)assert.ok(Number(data.gitSource.repoId)===1130435580,'Conflicting Vercel repository');
  return {deploymentId:data.id,teamId:TEAM,projectId:PROJECT,commitSha:sha,
    target:'production',state:'READY',activeAlias:'thetradehq.com',createdAt:data.createdAt};
}
export async function collectVercelProductionEvidence({sha,token,fetchImpl=fetch,now=Date.now}){
  assert.ok(/^[a-f0-9]{40}$/.test(sha||'') && typeof token==='string'
    && token.length>=20 && token.length<=4096 && !/[\r\n]/.test(token),
    'Configured Vercel verification credential and immutable SHA required');
  const deadline=now()+35000;
  async function read(){
    assert.ok(now()<=deadline,'Vercel evidence time budget exhausted');
    const response=await fetchImpl(endpoint,{method:'GET',redirect:'manual',
      headers:{Authorization:'Bearer '+token,Accept:'application/json'},signal:AbortSignal.timeout(15000)});
    assert.equal(response.status,200,'Vercel evidence unavailable; no auth/redirect retries');
    const advertised=response.headers.get('content-length');
    assert.ok(!advertised || (/^[0-9]+$/.test(advertised)&&Number(advertised)<=2000000), 'Oversized Vercel evidence');
    assert.ok(response.body,'Missing Vercel evidence body');
    const reader=response.body.getReader(),chunks=[];let bytes=0;
    try{while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;
      assert.ok(bytes<=2000000,'Oversized Vercel evidence');chunks.push(Buffer.from(value));}}
    finally{await reader.cancel();}
    let data;try{data=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw Error('Malformed Vercel evidence');}
    assert.ok(now()<=deadline,'Vercel evidence time budget exhausted');
    return select(data,sha,now());
  }
  const first=await read(),second=await read();
  assert.deepEqual(second,first,'Vercel production alias changed during collection');
  const proof=Object.freeze({schema:'tradehq-vercel-production-evidence-v1',...second,
    observedAt:now(),requests:2,authorization:Object.freeze({merge:false,productionRelease:false})});
  minted.add(proof);return proof;
}
export function assertVercelProductionEvidence(proof,sha,now=Date.now()){
  assert.ok(minted.has(proof) && proof.commitSha===sha && proof.observedAt<=now+1000
    && proof.observedAt>=now-120000,'Fresh in-process authenticated Vercel evidence required; imported JSON is not proof');
}
