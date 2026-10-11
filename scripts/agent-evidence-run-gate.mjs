// Fail-closed and read-only preflight for an existing completed monitoring run.
import assert from 'node:assert/strict';
import { appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
export function classify(jobs,event){
 assert.ok(Array.isArray(jobs)&&jobs.length<=100&&['push','schedule','workflow_dispatch'].includes(event));
 const results=['scan','browser'].map(n=>{const m=jobs.filter(j=>j.name===n);assert.equal(m.length,1,'Ambiguous monitoring job');assert.equal(m[0].status,'completed');return m[0].conclusion});
 if(results.every(x=>x==='skipped')&&event==='schedule')return {ready:false,purpose:'none'};
 assert.ok(results.every(x=>x==='success'||x==='failure'),'Monitoring evidence missing or incomplete');
 return {ready:true,purpose:results.includes('failure')?'diagnosis':'healthy'};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{
  const env=process.env;assert.equal(env.GITHUB_REPOSITORY,'anugaweerasinghe1-del/trading101');
  assert.ok(/^[1-9][0-9]*$/.test(env.MONITOR_RUN_ID||'')&&env.GITHUB_TOKEN&&env.GITHUB_OUTPUT);
  const url='https://api.github.com/repos/anugaweerasinghe1-del/trading101/actions/runs/'+env.MONITOR_RUN_ID+'/jobs?per_page=100';
  const response=await fetch(url,{method:'GET',redirect:'manual',signal:AbortSignal.timeout(12000),headers:{Authorization:'Bearer '+env.GITHUB_TOKEN,Accept:'application/vnd.github+json'}});
  assert.equal(response.status,200,'Read-only monitor job list unavailable');
  const raw=await response.text();assert.ok(Buffer.byteLength(raw)<250000);
  const data=JSON.parse(raw);assert.ok(data.total_count===data.jobs?.length,'Incomplete job collection');
  const result=classify(data.jobs,env.MONITOR_EVENT);
  appendFileSync(env.GITHUB_OUTPUT,'ready='+String(result.ready)+'\npurpose='+result.purpose+'\n');
  console.log(result.ready?'Complete producer jobs; independent trusted verification required.':'Scheduled idea-only run; no monitor evidence claimed.');
 }catch{console.error('Monitoring preflight blocked: incomplete or untrusted run.');process.exitCode=1;}
}
