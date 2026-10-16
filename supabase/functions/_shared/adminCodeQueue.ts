type User = {id?: string; aud?: string; is_anonymous?: boolean; email_confirmed_at?: string};
type Job = {runId: number; mainSha: string; jobName: string};
type Options = {
 getKey: () => string | undefined; getOwner: () => Promise<string>;
 getUser: (token: string) => Promise<User | null>;
 verifyWorker: (token: string) => Promise<Job>;
 rpc: (action: string, owner: string | null, data: Record<string, unknown>) => Promise<unknown>;
 readGitHub: (path: string) => Promise<Record<string, any>>;
 allow: (subject: string,bucket: string,seconds: number,max: number) => Promise<boolean>;
};
const uuid=/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i,sha=/^[a-f0-9]{40}$/;
const privateText=/-----BEGIN|\bgh[pousr]_|github_pat_|sb_secret_|AIza[\w-]{15,}|\beyJ[\w-]+\.[\w-]+\.[\w-]+|\b(?:password|api[_ -]?key|secret|token)\s*[:=]|[\w.+-]+@[\w.-]+\.[a-z]{2,}|https?:\/\//i;
function sameKey(a: string|undefined,b: string|null) {
 if(!a||!b||a.length>4096||a.length!==b.length)return false;
 let d=0;for(let i=0;i<a.length;i++)d|=a.charCodeAt(i)^b.charCodeAt(i);return d===0;
}
async function body(req: Request) {
 const reader=req.body?.getReader();if(!reader)throw Error('INVALID_REQUEST');
 let timer: ReturnType<typeof setTimeout>;
 try {
  return await Promise.race([(async()=>{let size=0;const parts=[];
   for(;;){const p=await reader.read();if(p.done)break;size+=p.value.length;if(size>8192)throw Error('INVALID_REQUEST');parts.push(p.value);}
   const bytes=new Uint8Array(size);let n=0;for(const p of parts){bytes.set(p,n);n+=p.length;}
   const v=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
   if(!v||Array.isArray(v)||typeof v!=='object'||typeof v.action!=='string')throw Error('INVALID_REQUEST');return v;
  })(),new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(Error('INVALID_REQUEST')),5000);})]);
 }finally{clearTimeout(timer!);void reader.cancel().catch(()=>{});}
}
function fields(value: Record<string,unknown>,allowed: string[]) {
 if(Object.keys(value).sort().join('|')!==allowed.sort().join('|'))throw Error('INVALID_REQUEST');
}
export function createAdminCodeQueue(options: Options) {
 const headers={'Content-Type':'application/json','Cache-Control':'no-store','Access-Control-Allow-Origin':'https://www.thetradehq.com',
  'Access-Control-Allow-Headers':'authorization,apikey,content-type,x-admin-key,x-client-info,x-github-oidc','Access-Control-Allow-Methods':'POST, OPTIONS'};
 const reply=(value: unknown,status=200)=>new Response(JSON.stringify(value),{status,headers});
 return async(req: Request)=>{
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
  if(req.method!=='POST')return reply({code:'METHOD'},405);
  try{
   if(!await options.allow('admin-code-auth','admin-code-auth',300,40))return reply({code:'RATE_LIMIT'},429);
   const input=await body(req);
   if(input.action.startsWith('worker-')){
    let job: Job;
    try{job=await options.verifyWorker(req.headers.get('x-github-oidc')??'');}catch{return reply({code:'WORKER_IDENTITY_REQUIRED'},401);}
    if(input.action==='worker-claim'){
     fields(input,['action']);if(job.jobName!=='Admin code queue worker')throw Error('INVALID_REQUEST');
     return reply({data:await options.rpc('claim',null,{runId:job.runId,baseSha:job.mainSha})});
    }
    if(input.action==='worker-finish'){
     fields(input,['action','id','status','headSha','prNumber','resultCode']);
     if(job.jobName!=='Admin code queue worker'||!uuid.test(input.id)||!['proposed','no_change','failed'].includes(input.status))throw Error('INVALID_REQUEST');
     if(input.status==='proposed'){
      if(!sha.test(input.headSha)||!Number.isSafeInteger(input.prNumber)||input.prNumber<1)throw Error('INVALID_REQUEST');
      const pr=await options.readGitHub('/pulls/'+input.prNumber);
      if(pr.user?.login!=='github-actions[bot]'||pr.user?.id!==41898282||pr.state!=='open'||pr.draft!==true||pr.base?.ref!=='main'
       ||pr.head?.ref!=='ai/admin-'+input.id||pr.head?.sha!==input.headSha||pr.head?.repo?.id!==1130435580)throw Error('PROPOSAL_NOT_VERIFIED');
     }else if(input.headSha!==null||input.prNumber!==null)throw Error('INVALID_REQUEST');
     return reply({data:await options.rpc('finish',null,{...input,runId:job.runId,baseSha:job.mainSha})});
    }
    if(input.action==='worker-validation'){
     fields(input,['action','id','headSha']);
     if(job.jobName!=='Admin code queue result'||!uuid.test(input.id)||!sha.test(input.headSha))throw Error('INVALID_REQUEST');
     const jobs=await options.readGitHub('/actions/runs/'+job.runId+'/attempts/1/jobs?per_page=20');
     if(!Number.isInteger(jobs.total_count)||jobs.total_count>20||jobs.jobs?.length!==jobs.total_count)throw Error('VALIDATION_UNAVAILABLE');
     const checks=jobs.jobs.filter((j: any)=>j.name==='Admin code independent validation');
     if(checks.length!==1||checks[0].status!=='completed'||!['success','failure','canceled','skipped','timed_out'].includes(checks[0].conclusion))throw Error('VALIDATION_UNAVAILABLE');
     return reply({data:await options.rpc('validation',null,{id:input.id,runId:job.runId,baseSha:job.mainSha,headSha:input.headSha,
      status:checks[0].conclusion==='success'?'verified':'validation_failed'})});
    }
    throw Error('INVALID_REQUEST');
   }
   if(!sameKey(options.getKey(),req.headers.get('x-admin-key')))return reply({code:'ADMIN_KEY_REQUIRED'},401);
   const auth=req.headers.get('authorization');if(!auth?.startsWith('Bearer '))return reply({code:'OWNER_SESSION_REQUIRED'},401);
   const [owner,user]=await Promise.all([options.getOwner(),options.getUser(auth.slice(7))]);
   if(!user||user.id!==owner||user.aud!=='authenticated'||user.is_anonymous===true||!user.email_confirmed_at)return reply({code:'OWNER_SESSION_REQUIRED'},403);
   if(input.action==='list'){fields(input,['action']);return reply({data:await options.rpc('list',owner,{})});}
   if(input.action==='submit'){
    fields(input,['action','requestKey','prompt']);
    if(!uuid.test(input.requestKey)||typeof input.prompt!=='string'||input.prompt.trim().length<20||input.prompt.length>2500
     ||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(input.prompt)||privateText.test(input.prompt))throw Error('INVALID_REQUEST');
    return reply({data:await options.rpc('submit',owner,{requestKey:input.requestKey,prompt:input.prompt.trim()})});
   }
   if(input.action==='cancel'){fields(input,['action','id']);if(!uuid.test(input.id))throw Error('INVALID_REQUEST');return reply({data:await options.rpc('cancel',owner,{id:input.id})});}
   throw Error('INVALID_REQUEST');
  }catch(error){
   const known=['INVALID_REQUEST','REQUEST_KEY_CONFLICT','REQUEST_ALREADY_ACTIVE','DAILY_CODE_LIMIT','REQUEST_NOT_QUEUED','INVALID_TRANSITION','WORKER_BINDING','PROPOSAL_NOT_VERIFIED','VALIDATION_UNAVAILABLE'];
   const code=error instanceof Error&&known.includes(error.message)?error.message:'QUEUE_UNAVAILABLE';
   return reply({code},code==='INVALID_REQUEST'?400:409);
  }
 };
}
