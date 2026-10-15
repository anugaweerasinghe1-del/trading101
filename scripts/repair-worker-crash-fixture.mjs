/** Disposable process/SQL/Git integration fixture. No live incident or GitHub adapter. */
import assert from 'node:assert/strict';
import postgres from 'postgres';
import { fork, execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { createConstrainedRepairRunner } from './agent-constrained-repair-runner.mjs';

const FILE='src/pages/About.tsx';
const BEFORE='export default function About(){return <main className="p-4 text-base">Synthetic crash fixture</main>;}\n';
const AFTER=BEFORE.replace('p-4','p-6');
const hash=value=>createHash('sha256').update(value).digest('hex');
const git=(directory,...args)=>execFileSync('git',args,{cwd:directory,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
const hold=()=>new Promise(()=>{});

export function createDisposableWorkerFixture({env,candidateId,evidenceDigest}) {
  assert.equal(env.TRADEHQ_DISPOSABLE_CONTROL_TEST,'explicit-ci-fixture');
  const directory=mkdtempSync(join(tmpdir(),'tradehq-worker-crash-'));
  git(directory,'init','-q');git(directory,'config','user.name','Disposable Worker Fixture');
  git(directory,'config','user.email','fixture@example.test');
  mkdirSync(join(directory,'src/pages'),{recursive:true});writeFileSync(join(directory,FILE),BEFORE);
  git(directory,'add',FILE);git(directory,'commit','-qm','synthetic isolated base');
  const baseSha=git(directory,'rev-parse','HEAD'),children=new Set();
  const marker=join(directory,'publication-attempt');
  function start(mode) {
    assert.ok(['uncommitted','committed','reconnect'].includes(mode));
    const child=fork(fileURLToPath(import.meta.url),['--child',mode,directory,candidateId,evidenceDigest],{
      cwd:process.cwd(),execArgv:[],stdio:['ignore','ignore','pipe','ipc'],
      // Never copy provider credentials or the caller's general environment.
      env:{PATH:process.env.PATH,TRADEHQ_DISPOSABLE_CONTROL_TEST:env.TRADEHQ_DISPOSABLE_CONTROL_TEST,
        TRADEHQ_CONTROL_TEST_URL:env.TRADEHQ_CONTROL_TEST_URL},
    });
    children.add(child);
    const messages=[],waiters=[];let exited=false,stderr='';
    child.stderr.on('data',chunk=>{stderr=(stderr+chunk).slice(0,4096);});
    function fail(error){for(const waiter of waiters.splice(0))waiter.reject(error);}
    child.on('error',()=>fail(Error('Disposable worker could not start')));
    child.on('exit',(code,signal)=>{exited=true;children.delete(child);
      fail(Error('Disposable worker exited before its checkpoint: '+code+'/'+signal+' '+stderr));});
    child.on('message',message=>{
      if(!message || !['SESSION','CLAIM_UNCOMMITTED','ISOLATED_COMMIT_READY','RECONNECT_DENIED'].includes(message.type)
        || messages.length>=4){fail(Error('Invalid disposable worker checkpoint'));return;}
      messages.push(message);
      for(const waiter of [...waiters])if(waiter.type===message.type){waiters.splice(waiters.indexOf(waiter),1);waiter.resolve(message);}
    });
    return {
      async waitFor(type){
        const existing=messages.find(m=>m.type===type);if(existing)return existing;
        assert.equal(exited,false,'Worker already exited');
        let timer,entry;
        try{return await new Promise((resolve,reject)=>{entry={type,resolve,reject};waiters.push(entry);
          timer=setTimeout(()=>reject(Error('Disposable worker checkpoint deadline')),8000);});}
        finally{clearTimeout(timer);const i=waiters.indexOf(entry);if(i>=0)waiters.splice(i,1);}
      },
      async kill(){
        assert.equal(exited,false,'Crash demonstration requires a running process');
        const result=new Promise((resolve,reject)=>{
          const timer=setTimeout(()=>reject(Error('Disposable worker did not exit after SIGKILL')),4000);
          child.once('exit',(code,signal)=>{clearTimeout(timer);resolve({code,signal});});
        });
        assert.equal(child.kill('SIGKILL'),true);const resultValue=await result;
        assert.equal(resultValue.signal,'SIGKILL');
      },
    };
  }
  return {baseSha,start,
    assertUnpublished(){assert.equal(existsSync(marker),false,'No crash/reconnect path may attempt draft publication');},
    verifyCommit(headSha){assert.match(headSha,/^[a-f0-9]{40}$/);assert.notEqual(headSha,baseSha);
      assert.equal(git(directory,'rev-parse','HEAD'),headSha);
      assert.equal(git(directory,'show',baseSha+':'+FILE)+'\n',BEFORE);
      assert.equal(readFileSync(join(directory,FILE),'utf8'),AFTER);},
    async close(){
      await Promise.all([...children].map(child=>new Promise(resolve=>{child.once('exit',resolve);child.kill('SIGKILL');})));
      rmSync(directory,{recursive:true,force:true});
    },
  };
}

async function childMain() {
  assert.equal(process.argv.length,7);assert.ok(process.send,'Fixture requires private parent IPC');
  const [, , , mode,directory,candidateId,evidenceDigest]=process.argv;
  assert.ok(['uncommitted','committed','reconnect'].includes(mode));
  assert.match(candidateId,/^repair-v1-[a-f0-9]{24}$/);assert.match(evidenceDigest,/^[a-f0-9]{64}$/);
  assert.ok(directory.startsWith(join(tmpdir(),'tradehq-worker-crash-')));
  assert.equal(git(directory,'config','user.email'),'fixture@example.test');
  const baseSha=git(directory,'rev-list','--max-parents=0','HEAD');assert.match(baseSha,/^[a-f0-9]{40}$/);
  assert.equal(git(directory,'show',baseSha+':'+FILE)+'\n',BEFORE);
  // Reuse the existing strict URL guard; no arbitrary database URL is accepted.
  const {disposableControlUrl}=await import('./verify-repair-control-postgres.mjs');
  const db=postgres(disposableControlUrl(process.env),{max:1,prepare:false,connect_timeout:5,idle_timeout:0,onnotice:()=>{}});
  const deadline=setTimeout(()=>process.exit(2),20000);
  try {
    const identity=(await db.unsafe("SELECT current_database() AS db,current_user AS owner,current_setting('server_version_num')::int AS version,pg_backend_pid() AS pid"))[0];
    assert.ok(identity.db==='tradehq_control_test' && identity.owner==='tradehq_test'
      && identity.version>=170000 && identity.version<180000);
    await db.unsafe("SET statement_timeout='10s'; SET lock_timeout='8s';");
    process.send({type:'SESSION',pid:identity.pid});
    const runner=createConstrainedRepairRunner({activationMode:'low-risk-draft-only',adapters:{
      readMainSha:async()=>baseSha,
      collectFreshIncident:async()=>({schema:'tradehq-server-incident-v1',verified:true,rootCauseReproduced:true,
        sourceScope:'LOW',candidateId,baseSha,path:'/about',source:'browser',symptom:'HEADING_READABILITY',
        evidenceDigest,observedAt:Date.now()}), // Explicit synthetic evidence, never production ground truth.
      readBaseSource:async()=>git(directory,'show',baseSha+':'+FILE)+'\n',planChange:async()=>AFTER,
      reproduceIndependently:async()=>({candidateId,baseSha,evidenceDigest,beforeFailed:true,afterPassed:true,
        beforeDigest:hash(BEFORE),afterDigest:hash(AFTER)}), // Fixture reproduction adapter, not a browser claim.
      claimCandidate:async()=>{
        const result=await db.begin(async tx=>{
          const r=(await tx.unsafe('SELECT tradehq_repair_control.claim($1,$2,$3,$4,$5,clock_timestamp(),$6) AS r',
            [candidateId,'browser','HEADING_READABILITY',baseSha,evidenceDigest,'LOW']))[0].r;
          if(mode==='uncommitted'){assert.equal(r.reason,'CLAIMED');process.send({type:'CLAIM_UNCOMMITTED'});await hold();}
          const generation=Number((await tx.unsafe('SELECT generation FROM tradehq_repair_control.policy'))[0].generation);
          return {...r,generation};
        });
        return result; // Acknowledgement follows the actual PostgreSQL commit.
      },
      readClaim:async()=>{
        const row=(await db.unsafe('SELECT p.stopped,p.generation,c.id,c.base_sha,c.evidence_digest,c.status,c.lease_until FROM tradehq_repair_control.policy p CROSS JOIN tradehq_repair_control.candidates c WHERE p.id AND c.id=$1',[candidateId]))[0];
        return row&&{stopped:row.stopped,generation:Number(row.generation),candidateId:row.id,baseSha:row.base_sha,
          evidenceDigest:row.evidence_digest,status:row.status,leaseUntil:Date.parse(row.lease_until)};
      },
      prepareIsolatedCommit:async()=>{writeFileSync(join(directory,FILE),AFTER);git(directory,'diff','--check');
        git(directory,'add',FILE);git(directory,'commit','-qm','synthetic crash proposal');return {headSha:git(directory,'rev-parse','HEAD')};},
      readIsolatedChange:async()=>[{path:FILE,status:'modified',before:BEFORE,after:readFileSync(join(directory,FILE),'utf8')}],
      validateIndependently:async({headSha})=>{process.send({type:'ISOLATED_COMMIT_READY',headSha});await hold();},
      publishDraft:async()=>{writeFileSync(join(directory,'publication-attempt'),'fixture failure');throw Error('Publication forbidden in crash fixture');},
      readDraft:async()=>{throw Error('No draft exists');},closeDraft:async()=>{throw Error('No draft exists');},
    }});
    if(mode==='reconnect'){
      await assert.rejects(()=>runner(candidateId),/Durable claim refused/);
      assert.equal(existsSync(join(directory,'publication-attempt')),false);
      process.send({type:'RECONNECT_DENIED'});await hold();
    } else await runner(candidateId);
  } finally {clearTimeout(deadline);await db.end({timeout:1});}
}
if(process.argv[1]===fileURLToPath(import.meta.url) && process.argv[2]==='--child'){
  childMain().catch(()=>{console.error('Disposable worker invariant failed');process.exit(1);});
}
