/** SERVER ONLY, disabled identity verifier. No HTTP endpoint, DB grant, token mint or release. */
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { Buffer } from 'node:buffer';
const crypto=globalThis.crypto||webcrypto;
const REPO='anugaweerasinghe1-del/trading101',OWNER_ID=297117529,REPO_ID=1130435580;
const WORKFLOW='.github/workflows/tradehq-verified-evidence.yml',WORKFLOW_ID=381133473;
const ISSUER='https://token.actions.githubusercontent.com';
const JWKS=ISSUER+'/.well-known/jwks',AUDIENCE='tradehq-repair-identity-v1';
const SHA=/^[a-f0-9]{40}$/,verified=new WeakSet();
const deny=Object.freeze({codeWrites:false,ownerApproval:false,merge:false,productionRelease:false});
const subjects=new Set([
  `repo:${REPO}:ref:refs/heads/main`,
  'repo:anugaweerasinghe1-del@297117529/trading101@1130435580:ref:refs/heads/main',
]);
function bytes(part,cap) {
  assert.ok(typeof part==='string' && /^[A-Za-z0-9_-]+$/.test(part) && part.length<=Math.ceil(cap*4/3));
  const value=Buffer.from(part,'base64url');
  assert.ok(value.length<=cap && value.toString('base64url')===part,'Non-canonical token encoding');
  return value;
}
function object(part,cap) {
  const value=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes(part,cap)));
  assert.ok(value && typeof value==='object' && !Array.isArray(value));return value;
}
const id=value=>{
  assert.ok(typeof value==='string' && /^[1-9][0-9]{0,15}$/.test(value));
  const parsed=Number(value);assert.ok(Number.isSafeInteger(parsed));return parsed;
};
function validTime(claims,now) {
  const at=Math.floor(now/1000);
  assert.ok(Number.isFinite(now) && ['iat','nbf','exp'].every(name=>Number.isSafeInteger(claims[name]))
    && claims.iat<=at && claims.iat>at-60 && claims.nbf<=at && claims.nbf>=claims.iat-30
    && claims.exp>at && claims.exp>claims.iat && claims.exp<=claims.iat+900,'Stale or invalid job token');
}
async function boundedJson(fetcher,url,signal) {
  const response=await fetcher(url,{method:'GET',redirect:'error',signal});
  assert.equal(response.status,200,'Signing keys unavailable');
  const reader=response.body?.getReader();assert.ok(reader);
  const chunks=[];let size=0;
  try {
    for(;;) {const part=await reader.read();if(part.done)break;size+=part.value.byteLength;
      assert.ok(size<=65536,'Oversized signing key response');chunks.push(part.value);}
    const data=Buffer.concat(chunks);return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(data));
  } finally {void reader.cancel().catch(()=>{});}
}
async function bounded(action) {
  const controller=new AbortController();let timer;
  try {return await Promise.race([action(controller.signal),new Promise((_,reject)=>{
    timer=setTimeout(()=>{controller.abort();reject(Error('Identity verification deadline'));},10000);
  })]);} finally {clearTimeout(timer);}
}
export function createGitHubWorkloadVerifier({readGitHub,fetcher=fetch,clock=Date.now,activationMode='disabled'}={}) {
  assert.equal(activationMode,'identity-only-fixture','Live workload trust has not been activated');
  assert.ok(typeof readGitHub==='function' && typeof fetcher==='function' && typeof clock==='function');
  return async function verifyJob(token) {
    try {
      assert.ok(typeof token==='string' && token.length<=22000);
      const pieces=token.split('.');assert.equal(pieces.length,3);
      const header=object(pieces[0],1024),claims=object(pieces[1],15360),signature=bytes(pieces[2],512);
      assert.ok(header.alg==='RS256' && header.typ==='JWT' && typeof header.kid==='string'
        && /^[A-Za-z0-9_-]{1,128}$/.test(header.kid)
        && Object.keys(header).every(name=>['alg','typ','kid','x5t'].includes(name)),'Unsupported JOSE header');
      // Only the fixed GitHub issuer is queried. Token key URLs/JWKs/algorithms cannot select a provider.
      const keys=await bounded(signal=>boundedJson(fetcher,JWKS,signal));
      assert.ok(Array.isArray(keys.keys) && keys.keys.length>=1 && keys.keys.length<=16);
      const selected=keys.keys.filter(key=>key.kid===header.kid);assert.equal(selected.length,1,'Ambiguous signing key');
      const jwk=selected[0];assert.ok(jwk.kty==='RSA' && jwk.alg==='RS256' && jwk.use==='sig'
        && bytes(jwk.n,512).length>=256 && jwk.e==='AQAB' && !jwk.d,'Invalid public signing key');
      const key=await crypto.subtle.importKey('jwk',{kty:'RSA',n:jwk.n,e:jwk.e,alg:'RS256',ext:true},
        {name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
      assert.equal(await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,signature,
        new TextEncoder().encode(pieces[0]+'.'+pieces[1])),true,'Invalid job signature');
      validTime(claims,clock());
      assert.ok(claims.iss===ISSUER && claims.aud===AUDIENCE && subjects.has(claims.sub)
        && claims.repository===REPO && claims.repository_id===String(REPO_ID)
        && claims.repository_owner==='anugaweerasinghe1-del' && claims.repository_owner_id===String(OWNER_ID)
        && claims.repository_visibility==='public' && claims.ref==='refs/heads/main' && claims.ref_type==='branch'
        && claims.event_name==='workflow_run' && claims.runner_environment==='github-hosted'
        && claims.workflow_ref===REPO+'/'+WORKFLOW+'@refs/heads/main'
        && SHA.test(claims.sha||'') && claims.workflow_sha===claims.sha
        && !('job_workflow_ref' in claims) && !('job_workflow_sha' in claims)
        && typeof claims.jti==='string' && /^[A-Za-z0-9_-]{16,128}$/.test(claims.jti),'Job scope is not the trusted main collector');
      const runId=id(claims.run_id),attempt=id(claims.run_attempt),checkId=id(claims.check_run_id);
      assert.ok(attempt<=100);
      const read=path=>bounded(signal=>readGitHub(path,{signal}));
      const [main,run,jobs]=await Promise.all([
        read('/branches/main'),read('/actions/runs/'+runId),
        read('/actions/runs/'+runId+'/attempts/'+attempt+'/jobs?per_page=20'),
      ]);
      assert.ok(main.name==='main' && main.protected===true && main.commit?.sha===claims.sha);
      assert.ok(run.id===runId && run.run_attempt===attempt && run.workflow_id===WORKFLOW_ID
        && run.path===WORKFLOW && run.head_sha===claims.sha && run.head_branch==='main'
        && run.event==='workflow_run' && run.status==='in_progress'
        && run.repository?.id===REPO_ID && run.repository.owner?.id===OWNER_ID
        && run.head_repository?.id===REPO_ID,'Independent current workflow identity differs');
      assert.ok(Number.isSafeInteger(jobs.total_count) && jobs.total_count>=1 && jobs.total_count<=20
        && Array.isArray(jobs.jobs) && jobs.jobs.length===jobs.total_count,'Incomplete current attempt jobs');
      const match=jobs.jobs.filter(job=>job.check_run_url===`https://api.github.com/repos/${REPO}/check-runs/${checkId}`);
      assert.equal(match.length,1);
      const job=match[0];assert.ok(job.name==='collect' && job.run_id===runId && job.head_sha===claims.sha
        && job.status==='in_progress' && Number.isFinite(Date.parse(job.started_at))
        && Date.parse(job.started_at)<=claims.iat*1000,'Actual collector job is not running');
      const latest=await read('/branches/main');assert.ok(latest.protected===true && latest.commit?.sha===claims.sha,'Main changed during identity verification');
      validTime(claims,clock());
      const tokenDigest=Buffer.from(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(ISSUER+'\n'+claims.jti))).toString('hex');
      const principal=Object.freeze({schema:'tradehq-github-job-principal-v1',repositoryId:REPO_ID,
        workflowId:WORKFLOW_ID,runId,attempt,checkId,mainSha:claims.sha,expiresAt:Math.min(claims.exp,claims.iat+60)*1000,
        tokenDigest,authorization:deny});verified.add(principal);return principal;
    } catch {throw Error('Workload identity rejected; no repair or release authority granted');}
  };
}
export function assertCurrentGitHubJob(principal,{mainSha,clock=Date.now}={}) {
  const now=clock();
  assert.ok(verified.has(principal) && SHA.test(mainSha||'') && principal.mainSha===mainSha
    && Number.isFinite(now) && principal.expiresAt>now,'Current in-process authenticated job required');
  return principal;
}
