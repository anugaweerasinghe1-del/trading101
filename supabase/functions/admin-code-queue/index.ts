import {createClient} from 'npm:@supabase/supabase-js@2';
import {createAdminCodeQueue} from '../_shared/adminCodeQueue.ts';
import {allow} from '../_shared/rateLimit.ts';
import {createGitHubWorkloadVerifier} from '../../../scripts/agent-github-workload-identity.mjs';
const server=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
async function readGitHub(path: string) {
 if(!/^\/(?:branches\/main|actions\/runs\/\d+(?:\/attempts\/\d+\/jobs\?per_page=20)?|pulls\/\d+(?:\/files\?per_page=3)?)$/.test(path))throw Error('GITHUB_SCOPE');
 const r=await fetch('https://api.github.com/repos/anugaweerasinghe1-del/trading101'+path,{redirect:'error',signal:AbortSignal.timeout(10000),headers:{Accept:'application/vnd.github+json','User-Agent':'TradeHQ-admin-code-queue'}});
 if(r.status!==200)throw Error('GITHUB_UNAVAILABLE');
 const text=await r.text();if(text.length>524288)throw Error('GITHUB_RESPONSE');return JSON.parse(text);
}
const verifyWorker=createGitHubWorkloadVerifier({readGitHub,activationMode:'live-admin-code-queue'});
Deno.serve(createAdminCodeQueue({
 getKey:()=>Deno.env.get('ADMIN_MASTER_KEY'),
 getOwner:async()=>{const {data,error}=await server.rpc('tradehq_repair_registered_owner');if(error||typeof data!=='string')throw Error('OWNER_BINDING');return data;},
 getUser:async token=>{const {data,error}=await server.auth.getUser(token);return error?null:data.user;},
 verifyWorker,readGitHub,allow,
 rpc:async(action,owner,payload)=>{const {data,error}=await server.rpc('tradehq_admin_code_queue',{p_action:action,p_owner:owner,p_data:payload});
  if(error){const code=['REQUEST_KEY_CONFLICT','REQUEST_ALREADY_ACTIVE','DAILY_CODE_LIMIT','REQUEST_NOT_QUEUED','INVALID_TRANSITION','WORKER_BINDING','REVIEW_NOT_READY','REVIEW_EXPIRED','PROPOSAL_NOT_VERIFIED'].find(c=>error.message===c);throw Error(code??'QUEUE_DATABASE');}return data;},
}));
