import {useCallback,useEffect,useRef,useState} from 'react';
import {Link} from 'react-router-dom';
import {supabase} from '@/integrations/supabase/client';
import {SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY} from '@/integrations/supabase/config';
type Row={id:string;prompt:string;status:string;created_at:string;updated_at:string;run_id:number|null;head_sha:string|null;pr_number:number|null;result_code:string|null};
type Event={id:number;request_id:string;at:string;event:string;run_id:number|null};
const messages:Record<string,string>={OWNER_SESSION_REQUIRED:'Sign in with the registered owner account to use the coding queue.',ADMIN_KEY_REQUIRED:'The administrator key could not be verified.',
 DAILY_CODE_LIMIT:'The coding queue has used its request allowance for the last 24 hours.',REQUEST_ALREADY_ACTIVE:'A code request is already waiting or running. Review it before submitting another.',
 INVALID_REQUEST:'Use 20–2500 characters without credentials, contact details or private records.',REQUEST_NOT_QUEUED:'This request has already started and cannot be canceled here.'};
export default function AdminCodeQueue({adminKey,initialPrompt=''}:{adminKey:string;initialPrompt?:string}){
 const [prompt,setPrompt]=useState(initialPrompt),[rows,setRows]=useState<Row[]>([]),[events,setEvents]=useState<Event[]>([]);
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
  if(active.current){setRows(data.requests);setEvents(data.events);setChecked(new Date());}
 },[call]);
 useEffect(()=>{active.current=true;void load().catch(e=>{if(active.current)setMessage(e.message);});
  const timer=window.setInterval(()=>{if(!pending.current&&document.visibilityState!=='hidden')void load().catch(e=>{if(active.current)setMessage(e.message);});},60000);
  return()=>{active.current=false;window.clearInterval(timer);};
 },[load]);
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
  <div className="space-y-3">{rows.map(row=><article key={row.id} className="rounded-xl border border-border p-4 space-y-2">
   <p className="text-sm font-medium">{row.prompt}</p><p className="text-xs text-muted-foreground">{row.status.replace(/_/g,' ')} · {new Date(row.updated_at).toLocaleString()}{row.result_code?' · '+row.result_code.replace(/_/g,' '):''}</p>
   <div className="flex gap-4 text-sm">{row.pr_number&&<a target="_blank" rel="noopener noreferrer" className="text-primary" href={'https://github.com/anugaweerasinghe1-del/trading101/pull/'+row.pr_number}>Review code proposal #{row.pr_number} ↗</a>}{row.run_id&&<a target="_blank" rel="noopener noreferrer" className="text-primary" href={'https://github.com/anugaweerasinghe1-del/trading101/actions/runs/'+row.run_id}>Worker and tests ↗</a>}
    {row.status==='queued'&&<button disabled={busy} onClick={()=>void run(async()=>{await call('cancel',{id:row.id});await load();})}>Cancel queued request</button>}</div>
   <ol className="text-xs text-muted-foreground space-y-1" aria-label="Recorded code activity">{events.filter(e=>e.request_id===row.id).slice(0,12).map(e=><li key={e.id}>{new Date(e.at).toLocaleString()} · {e.event.replace(/_/g,' ')}</li>)}</ol>
  </article>)}</div>
  {checked&&!rows.length&&<p className="text-sm text-muted-foreground">No website coding requests have been saved yet.</p>}
 </section>;
}
