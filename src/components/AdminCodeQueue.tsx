import {useCallback,useEffect,useRef,useState} from 'react';
import {Link} from 'react-router-dom';
import {supabase} from '@/integrations/supabase/client';
import {SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY} from '@/integrations/supabase/config';
type Row={id:string;prompt:string;status:string;created_at:string;updated_at:string;run_id:number|null;head_sha:string|null;pr_number:number|null;result_code:string|null};
type Learning={state:string;outcomes:number;files:{path:string;samples:number;passes:number;failures:number;paused:boolean}[]};
type Review={request_id:string;view_id:string;decision:string|null;close_state:string|null;close_code:string|null;close_run_id:number|null};
type Publication={request_id:string;state:string;head_sha:string;merge_sha:string|null;run_id:number|null;release_run_id?:number|null;result_code:string|null};
type Diff={id:string;headSha:string;files:{path:string;patch:string;additions:number;deletions:number}[];receipt:Review};
type WorkerRun={run_id:number;status:string;first_seen_at:string;updated_at:string};
type PrLifecycle={state:'open'|'closed'|'merged';headSha:string;checkedAt:number};
type Decision={request_id:string;context:Learning};
type Event={id:number;request_id:string;at:string;event:string;run_id:number|null};
const messages:Record<string,string>={OWNER_SESSION_REQUIRED:'Sign in with the registered owner account to use the coding queue.',ADMIN_KEY_REQUIRED:'The administrator key could not be verified.',
 DAILY_CODE_LIMIT:'The coding queue has used its request allowance for the last 24 hours.',REQUEST_ALREADY_ACTIVE:'A code request is already waiting or running. Review it before submitting another.',
 INVALID_REQUEST:'Use 20–2500 characters without credentials, contact details or private records.',REQUEST_NOT_QUEUED:'This request has already started and cannot be canceled here.',PUBLICATION_ALREADY_APPROVED:'Publication is already approved. Refresh activity to see its outcome.',REVIEW_EXPIRED:'Reload the code diff before deciding on this exact proposal.',REVIEW_NOT_READY:'Independent validation must finish before this proposal can be reviewed.',REVIEW_DIFF_UNAVAILABLE:'The full code diff could not be verified. Open the GitHub proposal to review it.',PROPOSAL_NOT_VERIFIED:'The proposal changed or is no longer an open draft. Refresh coding activity.'};
export default function AdminCodeQueue({adminKey,initialPrompt=''}:{adminKey:string;initialPrompt?:string}){
 const [prompt,setPrompt]=useState(initialPrompt),[rows,setRows]=useState<Row[]>([]),[events,setEvents]=useState<Event[]>([]);
 const [learning,setLearning]=useState<Learning|null>(null),[decisions,setDecisions]=useState<Decision[]>([]);
 const [workerRuns,setWorkerRuns]=useState<WorkerRun[]>([]);
 const [prStates,setPrStates]=useState<Record<number,PrLifecycle>>({});
 const prCache=useRef<Record<number,PrLifecycle>>({});
 const [publications,setPublications]=useState<Publication[]>([]);
 const [reviews,setReviews]=useState<Review[]>([]),[diff,setDiff]=useState<Diff|null>(null);
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[checked,setChecked]=useState<Date|null>(null);
 const active=useRef(true),pending=useRef(false),requestKey=useRef(crypto.randomUUID());
 const call=useCallback(async(action:string,payload:Record<string,unknown>={})=>{
  const {data,error}=await supabase.auth.getSession();
  if(error||!data.session?.access_token)throw Error(messages.OWNER_SESSION_REQUIRED);
  const response=await fetch(SUPABASE_URL+'/functions/v1/admin-code-queue',{method:'POST',redirect:'error',signal:AbortSignal.timeout(20000),
   headers:{'Content-Type':'application/json',apikey:SUPABASE_PUBLISHABLE_KEY,authorization:'Bearer '+data.session.access_token,'x-admin-key':adminKey},body:JSON.stringify({action,...payload})});
  const value=await response.json();if(!response.ok)throw Error(messages[value.code]??'The coding queue could not confirm this action. Refresh activity before submitting again.');return value.data;
 },[adminKey]);
 const load=useCallback(async()=>{
  const data=await call('list');if(!Array.isArray(data?.requests)||!Array.isArray(data?.events))throw Error('Coding history is unavailable.');
  if(active.current){setRows(data.requests);setPublications(data.publications??[]);setEvents(data.events);setReviews(data.reviews??[]);setWorkerRuns(data.workerRuns??[]);setLearning(data.learning??null);setDecisions(data.learningDecisions??[]);setChecked(new Date());}
 },[call]);
 useEffect(()=>{active.current=true;void load().catch(e=>{if(active.current)setMessage(e.message);});
  const timer=window.setInterval(()=>{if(!pending.current&&document.visibilityState!=='hidden')void load().catch(e=>{if(active.current)setMessage(e.message);});},60000);
  return()=>{active.current=false;window.clearInterval(timer);};
 },[load]);
 // Display-only GitHub observation: an owner may have merged or closed a draft
 // outside admin. Never turn this public response into a publication receipt.
 useEffect(()=>{
  const candidates=rows.filter(row=>row.pr_number&&row.head_sha&&['verified','validation_failed'].includes(row.status)).slice(0,3);
  if(!candidates.length)return;
  let canceled=false;
  void (async()=>{
   for(const row of candidates){
    const number=row.pr_number!;
    const cached=prCache.current[number];
    if(cached&&cached.headSha===row.head_sha&&(cached.state!=='open'||Date.now()-cached.checkedAt<15*60_000))continue;
    try{
     const response=await fetch('https://api.github.com/repos/anugaweerasinghe1-del/trading101/pulls/'+number,
      {headers:{Accept:'application/vnd.github+json'},signal:AbortSignal.timeout(10000)});
     if(!response.ok)continue;
     const pr=await response.json() as {number?:number;state?:string;merged_at?:string|null;head?:{sha?:string}};
     if(pr.number!==number||pr.head?.sha!==row.head_sha||!['open','closed'].includes(pr.state??''))continue;
     const state:PrLifecycle['state']=pr.state==='open'?'open':pr.merged_at?'merged':'closed';
     prCache.current[number]={state,headSha:row.head_sha!,checkedAt:Date.now()};
     if(!canceled)setPrStates({...prCache.current});
    }catch{/* If GitHub cannot be reached, keep the status unknown; the server remains authoritative. */}
   }
  })();
  return()=>{canceled=true;};
 },[rows]);
 const externallyClosed=(row:Row)=>{
  if(!row.pr_number||!row.head_sha)return null;
  const match=prStates[row.pr_number];
  return match&&match.headSha===row.head_sha&&match.state!=='open'?match.state:null;
 };
 const run=async(work:()=>Promise<void>)=>{if(pending.current)return;pending.current=true;setBusy(true);setMessage('');
  try{await work();}catch(e){if(active.current)setMessage(e instanceof Error?e.message:'Action unavailable.');}
  finally{pending.current=false;if(active.current)setBusy(false);}
 };
 return <section aria-label="Website coding queue" className="rounded-2xl border border-border bg-card/60 p-5 sm:p-6 space-y-4">
  <div><h2 className="text-xl font-semibold">Request a website code change</h2><p className="text-sm text-muted-foreground mt-2">Submit here to save a request for the coding agent. It checks the queue about every 15 minutes, prepares eligible frontend changes on a separate branch, and records the proposal and independent tests below.</p></div>
  <form className="space-y-3" onSubmit={e=>{e.preventDefault();void run(async()=>{
   await call('submit',{requestKey:requestKey.current,prompt:prompt.trim()});if(!active.current)return;setMessage('Request saved. The worker will pick it up on its next available run.');await load();
  });}}>
   <label className="block text-sm">What should change?<textarea value={prompt} maxLength={2500} rows={4} onChange={e=>{setPrompt(e.target.value);requestKey.current=crypto.randomUUID();}} className="block mt-2 w-full rounded-xl border border-border bg-background p-3" placeholder="Describe a specific layout, wording or accessibility change. Do not include credentials or private records." /></label>
   <p className="text-xs text-muted-foreground">{prompt.trim().length}/2500 · One queued request at a time and one request per 24 hours. The proposal diff will be public on GitHub. Financial logic, account access and backend changes require direct engineering work.</p>
   <div className="flex flex-wrap gap-3"><button disabled={busy||prompt.trim().length<20} className="rounded-xl bg-primary text-primary-foreground px-4 py-2 text-sm disabled:opacity-40">{busy?'Working…':'Submit to coding agent'}</button>
    <button type="button" disabled={busy} onClick={()=>void run(load)} className="rounded-xl border border-border px-4 py-2 text-sm disabled:opacity-40">Refresh coding activity</button><Link to="/auth" className="text-sm text-primary self-center">Owner sign-in</Link></div>
  </form>
  {message&&<p role="status" className="text-sm text-amber-400">{message}</p>}
  {checked&&<p className="text-xs text-muted-foreground">Last checked {checked.toLocaleString()}. Requests and events are stored on the server. Proposed code requires review before publication.</p>}
  {checked&&<details aria-label="Code worker check-ins" className="rounded-xl border border-border p-4 space-y-2">
   <summary className="text-sm font-semibold cursor-pointer">Code worker check-ins{workerRuns[0]?' · '+new Date(workerRuns[0].first_seen_at).toLocaleString():''}</summary>
   <p className="text-xs text-muted-foreground">Each successful queue connection is recorded here, including idle runs. A missing final result is checked against the original GitHub run on the next connection. This recovery does not repeat the code request.</p>
   {workerRuns.length===0?<p className="text-xs text-muted-foreground">No worker check-in has been recorded yet.</p>:<ol className="space-y-1 text-xs">{workerRuns.slice(0,20).map(worker=><li key={worker.run_id}><a className="text-primary" target="_blank" rel="noopener noreferrer" href={'https://github.com/anugaweerasinghe1-del/trading101/actions/runs/'+worker.run_id}>Run {worker.run_id} ↗</a> · {worker.status.replace(/_/g,' ')} · {new Date(worker.updated_at).toLocaleString()}</li>)}</ol>}
   <p className="text-xs text-muted-foreground">Failures before the queue connection appear in the native workflow logs.</p>
  </details>}
  {learning&&<aside aria-label="Code agent learning" className="rounded-xl border border-border p-4 space-y-2">
   <h3 className="text-sm font-semibold">Learning from independent tests</h3>
   <p className="text-xs text-muted-foreground">{learning.outcomes} completed validation outcomes in the last 30 days. {learning.outcomes===0?'Collecting results; no learned file restrictions yet.':'The agent uses recent file results when selecting changes. Three consecutive failed validations pause a file until a later pass or expiry.'} These results measure test outcomes; they do not establish that a requested change is correct or that a production issue was repaired.</p>
   {learning.files.map(file=><p key={file.path} className="text-xs break-all">{file.path} · {file.passes} passed / {file.failures} failed{file.paused?' · Paused for automatic selection':''}</p>)}
  </aside>}
  <div className="space-y-3">{rows.map(row=><article key={row.id} className="rounded-xl border border-border p-4 space-y-2">
   <p className="text-sm font-medium">{row.prompt}</p><p className="text-xs text-muted-foreground">{row.status.replace(/_/g,' ')} · {new Date(row.updated_at).toLocaleString()}{row.result_code?' · '+row.result_code.replace(/_/g,' '):''}</p>
   <div className="flex gap-4 text-sm">{row.pr_number&&<a target="_blank" rel="noopener noreferrer" className="text-primary" href={'https://github.com/anugaweerasinghe1-del/trading101/pull/'+row.pr_number}>Review code proposal #{row.pr_number} ↗</a>}{row.run_id&&<a target="_blank" rel="noopener noreferrer" className="text-primary" href={'https://github.com/anugaweerasinghe1-del/trading101/actions/runs/'+row.run_id}>Worker and tests ↗</a>}
    {row.status==='queued'&&<button disabled={busy} onClick={()=>void run(async()=>{await call('cancel',{id:row.id});await load();})}>Cancel queued request</button>}</div>
   {decisions.filter(d=>d.request_id===row.id).map(d=><p key={d.request_id} className="text-xs text-muted-foreground">Recorded learning decision: {d.context.outcomes} prior native outcomes; {d.context.files.filter(f=>f.paused).length} files paused.</p>)}
   {externallyClosed(row)&&<p role="status" className="text-xs text-amber-400">GitHub confirms this exact proposal was {externallyClosed(row)==='merged'?'merged manually':'closed'} outside the admin publication workflow. No admin publication receipt has been recorded; this does not count as automated production confirmation.</p>}
   {row.head_sha&&['verified','validation_failed'].includes(row.status)&&!externallyClosed(row)&&!reviews.find(r=>r.request_id===row.id)?.decision&&!publications.some(p=>p.request_id===row.id)&&<button type="button" disabled={busy} className="text-sm text-primary" onClick={()=>void run(async()=>{const result=await call('review',{id:row.id,headSha:row.head_sha});if(active.current)setDiff(result);})}>Review proposal in admin</button>}
   {publications.filter(p=>p.request_id===row.id).map(p=><p key={p.request_id} className="text-xs text-muted-foreground">Publication approved · {p.state==='published'?'Production confirmed on both providers':p.state==='merged'?'Merged; production verification pending':p.state==='blocked'?'Blocked; inspect the proposal and worker before requesting a new change':p.state==='merging'?'Merge authorized; awaiting independent confirmation':p.state==='claimed'?'Worker is validating the exact proposal and previews':'Waiting for the worker'}.{p.result_code?' '+p.result_code.replace(/_/g,' ')+'.':''} {p.run_id&&<a className="text-primary" target="_blank" rel="noopener noreferrer" href={'https://github.com/anugaweerasinghe1-del/trading101/actions/runs/'+p.run_id}>Publication worker ↗</a>} {p.release_run_id&&<a className="text-primary" target="_blank" rel="noopener noreferrer" href={'https://github.com/anugaweerasinghe1-del/trading101/actions/runs/'+p.release_run_id}>Release checks worker ↗</a>}</p>)}
   {reviews.filter(r=>r.request_id===row.id&&r.decision).map(review=><p key={review.request_id} className="text-xs text-muted-foreground">You declined this proposal · {review.close_state==='closed'?'GitHub draft closure confirmed':review.close_state==='blocked'?'Closure could not be confirmed; inspect the GitHub proposal':review.close_state==='claimed'?'Worker is checking the GitHub draft':'Waiting for the worker to close the GitHub draft'}. {review.close_run_id&&<a className="text-primary" target="_blank" rel="noopener noreferrer" href={'https://github.com/anugaweerasinghe1-del/trading101/actions/runs/'+review.close_run_id}>Closure worker ↗</a>}</p>)}
   {diff?.id===row.id&&<section aria-label="Proposal code review" className="rounded-xl border border-border p-4 space-y-3">
    <h3 className="text-sm font-semibold">Review this code proposal</h3><p className="text-xs text-muted-foreground break-all">Commit {diff.headSha}. Review every changed line. This proposal has not been published.</p>
    {diff.files.map(file=><details key={file.path} open className="space-y-2"><summary className="text-xs cursor-pointer break-all">{file.path} · +{file.additions} / −{file.deletions}</summary><pre className="max-h-80 overflow-auto whitespace-pre text-xs rounded-lg bg-background p-3" tabIndex={0}>{file.patch}</pre></details>)}
    <p className="text-xs text-muted-foreground">Approving authorizes publication of this exact commit after native tests, both previews and protected merge checks. A changed base or head blocks it. Production is confirmed separately after merging. Declining records your decision and asks the worker to close this exact draft. Your website stays on the current release.</p>
    <div className="flex flex-wrap gap-3">{row.status==='verified'&&<button type="button" disabled={busy||!!diff.receipt.decision} className="rounded-xl bg-primary text-primary-foreground px-3 py-2 text-sm disabled:opacity-40" onClick={()=>void run(async()=>{await call('approve',{id:row.id,headSha:diff.headSha,viewId:diff.receipt.view_id});if(active.current){setDiff(null);setMessage('Approval saved for this exact commit. Publication waits for native tests, both previews and protected merge checks.');}await load();})}>Approve and publish this exact code</button>}<button type="button" disabled={busy||!!diff.receipt.decision} className="rounded-xl border border-destructive/50 px-3 py-2 text-sm text-destructive disabled:opacity-40" onClick={()=>void run(async()=>{await call('reject',{id:row.id,headSha:diff.headSha,viewId:diff.receipt.view_id});if(active.current){setDiff(null);setMessage('Decline recorded. GitHub closure will be confirmed in activity.');}await load();})}>Decline this code proposal</button><button type="button" onClick={()=>setDiff(null)} className="text-sm">Close review</button></div>
   </section>}
   <ol className="text-xs text-muted-foreground space-y-1" aria-label="Recorded code activity">{events.filter(e=>e.request_id===row.id).slice(0,12).map(e=><li key={e.id}>{new Date(e.at).toLocaleString()} · {e.event.replace(/_/g,' ')}</li>)}</ol>
  </article>)}</div>
  {checked&&!rows.length&&<p className="text-sm text-muted-foreground">No website coding requests have been saved yet.</p>}
 </section>;
}
