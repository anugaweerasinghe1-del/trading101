import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
const engineUrl=new URL('./agent-code-request.mjs',import.meta.url);
const directory=mkdtempSync(join(tmpdir(),'tradehq-code-engine-')),originalCwd=process.cwd();
const before='export default function About(){ return (\n<main className="px-4">\n<h1 className="text-3xl">About TradeHQ</h1>\n<p>Learn with virtual funds and preserve this explanation.</p>\n</main>\n); }\n';
const after=before.replace('text-3xl','text-2xl sm:text-3xl');
const base='a'.repeat(40),head='b'.repeat(40),branch='ai/admin-a1700000-1111-4111-8111-000000000001';
const originalFetch=globalThis.fetch;
try{
 mkdirSync(join(directory,'src/pages'),{recursive:true});mkdirSync(join(directory,'src/components'),{recursive:true});
 writeFileSync(join(directory,'src/pages/About.tsx'),before);process.chdir(directory);
 process.env.GITHUB_TOKEN='fixture-github-only';process.env.GEMINI_API_KEY='fixture-provider-only';
 let modelCalls=0,writes=[],changedBase=false,unsafe=false;
 globalThis.fetch=async(url,options={})=>{
  if(String(url).startsWith('https://generativelanguage.googleapis.com/')){
   modelCalls++;const value=modelCalls%2===1?{paths:['src/pages/About.tsx']}:{summary:'Responsive heading spacing',changes:[{path:'src/pages/About.tsx',content:unsafe?after.replace('className="px-4"','onClick={steal} className="px-4"'):after}]};
   return new Response(JSON.stringify({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(value)}]}}]}));
  }
  const path=String(url).replace('https://api.github.com/repos/anugaweerasinghe1-del/trading101','');
  if(options.method==='POST'||options.method==='PUT')writes.push({path,body:JSON.parse(options.body)});
  const data=path==='/git/ref/heads/main'?{object:{sha:changedBase?'c'.repeat(40):base}}
   :path==='/git/ref/heads/'+branch?{object:{sha:head}}
   :path.startsWith('/contents/')?(options.method==='PUT'?{commit:{sha:head}}:{sha:'fixture-original-blob'})
   :path==='/pulls'?{number:166,html_url:'https://github.com/anugaweerasinghe1-del/trading101/pull/166'}:{};
  return new Response(JSON.stringify(data));
 };
 const {buildFrontendProposal}=await import(engineUrl);
 let rechecks=0;
 const args={request:'Improve the About heading on small screens while keeping every sentence.',branch,expectedBase:base,recheck:async()=>{rechecks++;},report:async()=>{}};
 const result=await buildFrontendProposal(args);assert.equal(result.status,'proposed');assert.equal(result.prNumber,166);assert.equal(rechecks,1);
 assert.deepEqual(writes.map(x=>x.path),['/git/refs','/contents/src/pages/About.tsx','/pulls']);
 assert.equal(Buffer.from(writes[1].body.content,'base64').toString(),after);assert.equal(writes[2].body.draft,true);
 assert.ok(!JSON.stringify(writes).includes('fixture-provider-only'));assert.ok(!JSON.stringify(writes).includes('NaN'));
 writes=[];changedBase=true;await assert.rejects(buildFrontendProposal(args),/Main branch changed/);assert.equal(writes.length,0);
 changedBase=false;const paused=await buildFrontendProposal({...args,learning:{version:'native-ci-memory-v1',files:[],pausedPaths:['src/pages/About.tsx']}});assert.equal(paused.status,'no_change');assert.equal(writes.length,0,'Learned file pause prevents writes despite model selection');modelCalls=0;unsafe=true;await assert.rejects(buildFrontendProposal(args),/event handlers|logic/);assert.equal(writes.length,0);
 console.log('ADMIN_CODE_ENGINE_PASS: actual shared model-to-isolated-proposal engine with disposable source and mocked transport; exact bytes/head, immutable-main race and unsafe change rejection before writes. No live provider or GitHub action.');
}finally{globalThis.fetch=originalFetch;process.chdir(originalCwd);rmSync(directory,{recursive:true,force:true});}
