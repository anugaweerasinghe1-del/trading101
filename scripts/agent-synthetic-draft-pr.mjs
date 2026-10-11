/**
 * Owner-triggered GitHub fixture draft. No production repair, models or merges.
 * Unset flags/emergency state keep this DISABLED by default.
 */
import assert from "node:assert/strict";
import {fileURLToPath} from "node:url";
import {resolve} from "node:path";
const REPO="anugaweerasinghe1-del/trading101";
const FILE="docs/repair-fixtures/synthetic-style-review.md";
const TITLE="[Fixture] Synthetic styling review — NOT a production repair";
const SHA=/^[a-f0-9]{40}$/;
export function syntheticGate(input) {
  assert.equal(input.repo,REPO,"Unexpected repository");
  assert.equal(input.actor,"anugaweerasinghe1-del","Repository owner only");
  assert.equal(input.event,"workflow_dispatch","Issue/scheduled invocations denied");
  assert.equal(input.ref,"refs/heads/main","Protected main required");
  assert.equal(input.confirm,"SYNTHETIC_DRAFT_ONLY","Explicit operator confirmation required");
  assert.equal(input.enabled,"true","Test gate disabled");
  assert.equal(input.stop,"explicitly-resumed-for-fixture","Test stop active/unverified");
  assert.ok(/^[1-9][0-9]{4,18}$/.test(String(input.run||"")) && input.attempt==="1",
    "Missing unique first-attempt run");
  assert.ok(SHA.test(input.sha||""),"Immutable main commit required");
  return {branch:"test/synthetic-repair-review-"+input.run,baseSha:input.sha,path:FILE,title:TITLE};
}
export function fixtureBody(input) {
  syntheticGate(input);
  return [
    "# Synthetic layout review fixture","",
    "This Markdown file is a harmless non-executable test fixture.",
    "It is not imported, linked or used by the live application.","",
    "- Bounded sample: mock heading spacing changes from mb-4 to mb-6.",
    "- Real source code, authentication, trading logic, workflows and DNS: unchanged.",
    "- Origin: explicit repository-owner workflow dispatch.",
    "- Draft PR review only; no automatic merge or production release.",""
  ].join("\n");
}
export async function createSyntheticDraft(input,{request,now=Date.now()}={}) {
  const gate=syntheticGate(input);
  assert.ok(typeof request==="function","Bounded request adapter required");
  const api=(method,path,body)=>request(method,path,body);
  const live=await api("GET","/git/ref/heads/main");
  assert.equal(live?.object?.sha,gate.baseSha,"Main changed since dispatch");
  const prior=await api("GET","/pulls?state=all&per_page=100");
  assert.ok(Array.isArray(prior)&&prior.length<100,"PR budget cannot be verified");
  assert.ok(!prior.some(x=>x?.title===TITLE && Date.parse(x.created_at)>now-24*60*60*1000),
    "One synthetic PR per 24 hours limit");
  assert.ok(!prior.some(x=>x?.head?.ref===gate.branch),"Run replay rejected");
  const parent=await api("GET","/git/commits/"+gate.baseSha);
  assert.ok(SHA.test(parent?.tree?.sha||""),"No trusted base tree");
  const blob=await api("POST","/git/blobs",{content:fixtureBody(input),encoding:"utf-8"});
  assert.ok(SHA.test(blob?.sha||""),"Invalid fixture blob");
  const tree=await api("POST","/git/trees",{base_tree:parent.tree.sha,
    tree:[{path:FILE,mode:"100644",type:"blob",sha:blob.sha}]});
  assert.ok(SHA.test(tree?.sha||""),"Invalid one-file tree");
  const commit=await api("POST","/git/commits",{message:"docs: isolated synthetic layout review",
    tree:tree.sha,parents:[gate.baseSha]});
  assert.ok(SHA.test(commit?.sha||""),"Invalid fixture commit");
  await api("POST","/git/refs",{ref:"refs/heads/"+gate.branch,sha:commit.sha});
  const pr=await api("POST","/pulls",{title:TITLE,head:gate.branch,base:"main",draft:true,
    body:"SYNTHETIC DOC FIXTURE ONLY. No application repair or deployment. "+
    "Allowed path: "+FILE+". Base: "+gate.baseSha+". Exact head: "+commit.sha+
    ". Separate human review required; never auto-merge."});
  assert.ok(pr?.draft===true && pr?.head?.sha===commit.sha
    && pr?.base?.ref==="main" && Number.isSafeInteger(pr?.number),
    "Draft PR commit mismatch");
  const files=await api("GET","/pulls/"+pr.number+"/files?per_page=100");
  assert.ok(Array.isArray(files) && files.length===1 && files[0]?.filename===FILE
    && files[0]?.status==="added","Unexpected PR source file");
  return {number:pr.number,headSha:commit.sha,path:FILE,draft:true,
    productionRelease:false,automaticMerge:false};
}
async function live(){
  if(process.argv.length>2)throw Error("Unknown argument");
  const input={repo:process.env.GITHUB_REPOSITORY,actor:process.env.GITHUB_ACTOR,
    event:process.env.GITHUB_EVENT_NAME,ref:process.env.GITHUB_REF,
    confirm:process.env.TRADEHQ_SYNTHETIC_CONFIRM,enabled:process.env.TRADEHQ_SYNTHETIC_ENABLED,
    stop:process.env.TRADEHQ_SYNTHETIC_STOP,run:process.env.GITHUB_RUN_ID,
    attempt:process.env.GITHUB_RUN_ATTEMPT,sha:process.env.GITHUB_SHA};
  syntheticGate(input);
  assert.ok(typeof process.env.GITHUB_TOKEN==="string" && process.env.GITHUB_TOKEN.length>=20,
    "Least privilege GitHub token missing");
  const request=async(method,path,body)=>{
    assert.ok(/^\/(?:git\/(?:ref\/heads\/main|commits\/[a-f0-9]{40}|blobs|trees|refs)|pulls(?:\?state=all&per_page=100|\/[0-9]+\/files\?per_page=100)?)$/.test(path),
      "Forbidden GitHub endpoint");
    const res=await fetch("https://api.github.com/repos/"+REPO+path,{
      method,headers:{Accept:"application/vnd.github+json",
        Authorization:"Bearer "+process.env.GITHUB_TOKEN,
        "X-GitHub-Api-Version":"2022-11-28",
        ...(method==="POST"?{"Content-Type":"application/json"}:{})},
      ...(method==="POST"?{body:JSON.stringify(body)}:{})});
    assert.ok(res.ok,"GitHub synthetic request "+method+" "+path+" HTTP "+res.status);
    return res.json();
  };
  const result=await createSyntheticDraft(input,{request});
  console.log("Synthetic GitHub draft PR #"+result.number+" for "+result.headSha+
    ". No real repair, merge or production release.");
}
if(process.argv[1] && fileURLToPath(import.meta.url)===resolve(process.argv[1])){
  live().catch(error=>{console.error("Synthetic draft blocked: "+String(error.message||error).slice(0,180));process.exitCode=1});
}