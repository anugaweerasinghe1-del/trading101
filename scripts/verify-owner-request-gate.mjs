import assert from "node:assert/strict";
import {validateOwnerCodeRequest,assertUnchangedOwnerIssue,collectOwnerIssueHistory}
  from "./agent-owner-request-gate.mjs";
const now=Date.parse("2026-10-12T02:00:00.000Z");
const codeTitle="[TradeHQ Code Request]",ownerId=297117529;
const user={id:ownerId,login:"anugaweerasinghe1-del"};
const live={id:987654321,number:303,title:codeTitle,body:"Please change only the safe About page heading spacing; do not change logic.",
  created_at:"2026-10-12T01:58:00.000Z",updated_at:"2026-10-12T01:58:00.000Z",user,state:"open"};
const repo={id:1130435580,full_name:"anugaweerasinghe1-del/trading101",
  owner:user,default_branch:"main"};
const env={GITHUB_REPOSITORY:repo.full_name,GITHUB_REPOSITORY_ID:String(repo.id),
  GITHUB_ACTOR:user.login,GITHUB_ACTOR_ID:String(ownerId),GITHUB_EVENT_NAME:"issues",
  GITHUB_REF:"refs/heads/main",GITHUB_RUN_ATTEMPT:"1",GITHUB_RUN_ID:"38159990011",
  GITHUB_SHA:"a".repeat(40),TRADEHQ_ISSUE_NUMBER:"303"};
const event={action:"opened",repository:repo,issue:structuredClone(live),sender:user};
const fixture=()=>({event:structuredClone(event),liveIssue:structuredClone(live),
  repository:structuredClone(repo),env:{...env},
  issueHistory:[structuredClone(live)],now});
const verified=validateOwnerCodeRequest(fixture());
assert.equal(verified.issueId,live.id);
assert.equal(verified.baseSha,env.GITHUB_SHA);
assert.equal(verified.body,live.body);
assert.ok(Object.values(verified.authorization).every(x=>x===false));
assert.equal(assertUnchangedOwnerIssue(verified,live,env.GITHUB_SHA),true);

const bad=[
  x=>x.event.action="edited",
  x=>x.event.sender.id=1,
  x=>x.event.sender.login="other",
  x=>x.event.repository.id=1,
  x=>x.event.repository.owner.id=1,
  x=>x.event.issue.user.id=1,
  x=>x.event.issue.title="Another subject",
  x=>x.repository.id=1,
  x=>x.repository.owner.id=1,
  x=>x.repository.default_branch="develop",
  x=>x.env.GITHUB_REPOSITORY_ID="1",
  x=>x.env.GITHUB_ACTOR_ID="1",
  x=>x.env.GITHUB_ACTOR="evil",
  x=>x.env.GITHUB_EVENT_NAME="workflow_dispatch",
  x=>x.env.GITHUB_REF="refs/heads/feature",
  x=>x.env.GITHUB_RUN_ATTEMPT="2",
  x=>x.env.GITHUB_SHA="main",
  x=>x.env.TRADEHQ_ISSUE_NUMBER="200",
  x=>x.liveIssue.user.id=1,
  x=>x.liveIssue.state="closed",
  x=>x.liveIssue.title="[TradeHQ Bug Report]",
  x=>x.liveIssue.body+="Unreviewed edit",
  x=>x.liveIssue.created_at="2026-10-11T01:00:00Z",
  x=>x.liveIssue.number=500,
  x=>x.liveIssue.id=3,
  x=>x.liveIssue.pull_request={url:"https://github.com/untrusted"},
  x=>x.issueHistory[0].id=2,
  x=>x.issueHistory.push(structuredClone(live)),
  x=>x.issueHistory.push({...live,id:55,number:200}),
  x=>x.issueHistory=[],
  x=>x.now=Date.parse("2026-10-13T05:00:00Z"),
];
for(const tamper of bad){const x=fixture();tamper(x);assert.throws(()=>validateOwnerCodeRequest(x));}
const altered={...live,body:live.body+" modified"};
assert.throws(()=>assertUnchangedOwnerIssue(verified,altered,env.GITHUB_SHA));
assert.throws(()=>assertUnchangedOwnerIssue(verified,{...live,state:"closed"},env.GITHUB_SHA));
assert.throws(()=>assertUnchangedOwnerIssue(verified,live,"b".repeat(40)));
assert.throws(()=>assertUnchangedOwnerIssue(verified,live,"feature"));
const read=[];
assert.equal((await collectOwnerIssueHistory(async path=>{read.push(path);return [live]},now)).length,1);
assert.equal(read.length,1);
await assert.rejects(collectOwnerIssueHistory(async()=>({}),now));
await assert.rejects(collectOwnerIssueHistory(async()=>[live,live],now));
const bulk=Array.from({length:100},(_,i)=>({...live,id:i+1,
  created_at:"2026-10-12T01:58:00.000Z"}));
await assert.rejects(collectOwnerIssueHistory(async path=>bulk.map(x=>({...x,
  id:x.id+100*Number(path.match(/page=(\d+)$/)[1])})),now),
  /Too many recent issues/);
let pages=0;
const older=await collectOwnerIssueHistory(async()=>{pages++;return pages===1?
  bulk.map((x,i)=>({...x,created_at:i===99?"2026-10-09T01:00:00Z":x.created_at})):[]},now);
assert.equal(older.length,100);assert.equal(pages,1);
console.log("OWNER_REQUEST_PROVENANCE_PASS: authenticated owner-id/event/repo/main/issue binding, changed request rejection, 24-hour bounded issue budget, attempts/replays, pagination and downstream no-write recheck.");
