/** Protected-main read-only identity probe. No DB, proposal, model, permission update or release. */
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { createGitHubWorkloadVerifier,assertCurrentGitHubJob } from './agent-github-workload-identity.mjs';
const REPO='anugaweerasinghe1-del/trading101',AUDIENCE='tradehq-repair-identity-v1';
const AUTHORITY=Object.freeze({codeWrites:false,ownerApproval:false,merge:false,productionRelease:false});
async function getJson(fetcher,url,headers,cap,signal) {
  const response=await fetcher(url,{method:'GET',headers,redirect:'error',signal});
  assert.equal(response.status,200,'Identity source unavailable');
  const reader=response.body?.getReader();assert.ok(reader);let size=0;const chunks=[];
  try {
    for(;;){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;
      assert.ok(size<=cap,'Identity source oversized');chunks.push(part.value);}
    return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Buffer.concat(chunks)));
  } finally {void reader.cancel().catch(()=>{});}
}
export async function probeGitHubWorkload({env,fetcher=fetch,clock=Date.now}) {
  let requiredClaims=null;
  try {
    assert.ok(env.GITHUB_REPOSITORY===REPO && env.GITHUB_REF==='refs/heads/main'
      && env.GITHUB_EVENT_NAME==='workflow_run' && /^[a-f0-9]{40}$/.test(env.GITHUB_SHA||'')
      && typeof env.GITHUB_TOKEN==='string' && env.GITHUB_TOKEN.length>=20 && env.GITHUB_TOKEN.length<=4096
      && typeof env.ACTIONS_ID_TOKEN_REQUEST_TOKEN==='string' && env.ACTIONS_ID_TOKEN_REQUEST_TOKEN.length>=20
      && env.ACTIONS_ID_TOKEN_REQUEST_TOKEN.length<=8192);
    const url=new URL(env.ACTIONS_ID_TOKEN_REQUEST_URL||'');
    assert.ok(url.protocol==='https:' && url.hostname.endsWith('.actions.githubusercontent.com')
      && !url.username && !url.password && !url.port && !url.hash && url.href.length<=4096,
      'Only the runner-provided GitHub token service is allowed');
    url.searchParams.set('audience',AUDIENCE);
    const minted=await getJson(fetcher,url.toString(),{Authorization:'Bearer '+env.ACTIONS_ID_TOKEN_REQUEST_TOKEN},
      32768,AbortSignal.timeout(10000));
    assert.ok(typeof minted.value==='string' && minted.value.length<=22000);
    // Presence-only diagnostics never establish trust or output actual claims/tokens.
    try {
      const part=minted.value.split('.')[1];assert.ok(part?.length<=20480);
      const untrusted=JSON.parse(Buffer.from(part,'base64url').toString('utf8'));
      requiredClaims=Object.fromEntries(['check_run_id','run_id','run_attempt','workflow_sha','sha'].map(name=>[name,typeof untrusted?.[name]]));
    } catch {requiredClaims=null;}
    const verifier=createGitHubWorkloadVerifier({activationMode:'live-read-only-identity',fetcher,clock,
      readGitHub:async(path,{signal})=>{
        assert.ok(path==='/branches/main' || /^\/actions\/runs\/[1-9][0-9]*(?:\/attempts\/[1-9][0-9]*\/jobs\?per_page=20)?$/.test(path));
        return getJson(fetcher,'https://api.github.com/repos/'+REPO+path,
          {Authorization:'Bearer '+env.GITHUB_TOKEN,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'},524288,signal);
      },
    });
    const principal=await verifier(minted.value);
    assertCurrentGitHubJob(principal,{mainSha:env.GITHUB_SHA,clock});
    return Object.freeze({schema:'tradehq-github-identity-probe-v1',status:'VERIFIED',mode:'READ_ONLY',
      runId:principal.runId,attempt:principal.attempt,checkId:principal.checkId,mainSha:principal.mainSha,
      expiresAt:principal.expiresAt,requiredClaimTypes:requiredClaims,authorization:AUTHORITY});
  } catch {
    return Object.freeze({schema:'tradehq-github-identity-probe-v1',status:'BLOCKED',mode:'READ_ONLY',
      requiredClaimTypes:requiredClaims,authorization:AUTHORITY});
  }
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  const result=await probeGitHubWorkload({env:process.env});
  console.log('TRADEHQ_GITHUB_IDENTITY_PROBE_V1 '+JSON.stringify(result));
  if(result.status!=='VERIFIED')process.exitCode=1;
}
