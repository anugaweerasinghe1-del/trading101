import assert from "node:assert/strict";
import {verifyOwnerPrReview,collectOwnerPrReview} from "./agent-owner-pr-review.mjs";
const owner={id:297117529,login:"anugaweerasinghe1-del"};
const bot={id:41898282,login:"github-actions[bot]"};
const repo={id:1130435580,full_name:"anugaweerasinghe1-del/trading101",
  owner,default_branch:"main"};
const sha="a".repeat(40);
const pr={id:909090,number:95,state:"open",merged_at:null,draft:false,user:bot,
  base:{ref:"main",repo},head:{ref:"ai/issue-94",sha,repo}};
const review={id:777777,commit_id:sha,state:"approved",user:owner,
  submitted_at:"2026-10-12T01:58:00Z"};
const env={GITHUB_EVENT_NAME:"pull_request_review",GITHUB_REPOSITORY:repo.full_name,
  GITHUB_REPOSITORY_ID:String(repo.id),GITHUB_ACTOR:owner.login,GITHUB_ACTOR_ID:String(owner.id),
  GITHUB_RUN_ID:"38159990011",GITHUB_RUN_ATTEMPT:"1"};
// Match GitHub/Octokit's submitted review schema: there is no top-level number.
const event={action:"submitted",review,pull_request:pr,
  repository:repo,sender:owner};
const fixture=()=>({event:structuredClone(event),repository:structuredClone(repo),
  pullRequest:structuredClone(pr),reviews:[{...structuredClone(review),state:"APPROVED"}],
  env:{...env},now:Date.parse("2026-10-12T02:00:00Z")});
const approved=verifyOwnerPrReview(fixture());
assert.equal(approved.approvedHeadSha,sha);
assert.equal(approved.status,"OWNER_REVIEW_OBSERVED_NO_RELEASE_AUTHORITY");
assert.ok(Object.values(approved.authorization).every(x=>x===false));
assert.match(approved.sha256,/^[a-f0-9]{64}$/);
for(const mutate of [
  x=>x.event.action="edited",
  x=>x.event.review.state="commented",
  x=>x.event.review.user.id=2,
  x=>x.event.sender.id=2,
  x=>x.event.repository.owner.id=2,
  x=>x.repository.owner.id=2,
  x=>x.repository.id=5,
  x=>x.repository.default_branch="develop",
  x=>x.env.GITHUB_ACTOR_ID="0",
  x=>x.env.GITHUB_REPOSITORY_ID="0",
  x=>x.env.GITHUB_RUN_ATTEMPT="2",
  x=>x.env.GITHUB_RUN_ID="invalid",
  x=>x.event.review.commit_id="b".repeat(40),
  x=>x.event.review.id=88,
  x=>x.event.review.submitted_at="2026-10-08T00:00:00Z",
  x=>x.pullRequest.head.sha="b".repeat(40),
  x=>x.pullRequest.head.ref="ai/issue-95",
  x=>x.pullRequest.head.ref="feat/normal",
  x=>x.pullRequest.head.repo.id=7,
  x=>x.pullRequest.base.repo.id=7,
  x=>x.pullRequest.base.ref="develop",
  x=>x.pullRequest.state="closed",
  x=>x.pullRequest.merged_at="2026-10-12T01:59:00Z",
  x=>x.pullRequest.draft=true,
  x=>x.pullRequest.user.id=owner.id,
  x=>x.pullRequest.number=19,
  x=>x.pullRequest.id=1010,
  x=>x.event.number=19,
  x=>delete x.event.pull_request.number,
  x=>x.event.pull_request.number="95",
  x=>x.reviews[0].state="DISMISSED",
  x=>x.reviews[0].user.id=0,
  x=>x.reviews[0].commit_id="b".repeat(40),
  x=>x.reviews[0].submitted_at="2026-10-12T01:59:00Z",
  x=>x.reviews.push({...x.reviews[0]}),
  x=>x.reviews=[],
]){
  const input=fixture();mutate(input);
  assert.throws(()=>verifyOwnerPrReview(input));
}
const tamper=fixture();tamper.event.pull_request.head.sha="c".repeat(40);
assert.throws(()=>verifyOwnerPrReview(tamper));
for (const state of ["CHANGES_REQUESTED","COMMENTED","APPROVED","DISMISSED"]) {
  const input=fixture();
  input.reviews.push({...input.reviews[0],id:777778,state,
    submitted_at:"2026-10-12T01:59:00Z"});
  assert.throws(()=>verifyOwnerPrReview(input),/superseded/);
  // API order is not proof of review order.
  input.reviews.reverse();
  assert.throws(()=>verifyOwnerPrReview(input),/superseded/);
}
for (const mutate of [
  x=>x.reviews.push({...x.reviews[0],id:777778,state:"CHANGES_REQUESTED"}),
  x=>x.reviews.push({...x.reviews[0],id:777776,submitted_at:"2026-10-12T01:59:00Z"}),
  x=>x.reviews.push({...x.reviews[0],id:777778,submitted_at:null}),
  x=>x.reviews.push({...x.reviews[0],id:777778,user:{...owner,id:0}}),
  x=>x.reviews.push({...x.reviews[0],id:777778,user:{...owner,login:"forged"}}),
  x=>x.reviews=Array.from({length:100},(_,i)=>({...x.reviews[0],id:777777+i})),
  x=>x.pullRequest.user.login="forged-bot",
  x=>x.event.review.user.login="forged-owner",
]) {
  const input=fixture(); mutate(input);
  assert.throws(()=>verifyOwnerPrReview(input));
}
const priorReview=fixture();
priorReview.reviews.unshift({...priorReview.reviews[0],id:777776,
  state:"CHANGES_REQUESTED",submitted_at:"2026-10-12T01:57:00Z"});
assert.equal(verifyOwnerPrReview(priorReview).sha256,approved.sha256);
async function collectWithRace(mutate) {
  const x=fixture(),counts=new Map();
  return collectOwnerPrReview({event:x.event,env:x.env,now:x.now,
    read:async endpoint=>{
      const count=(counts.get(endpoint)||0)+1;counts.set(endpoint,count);
      if(count===2 && mutate) mutate(x,endpoint);
      if(endpoint==="") return structuredClone(x.repository);
      if(endpoint.endsWith("/reviews?per_page=100")) return structuredClone(x.reviews);
      assert.equal(endpoint,"/pulls/95");
      return structuredClone(x.pullRequest);
    }});
}
assert.equal((await collectWithRace()).sha256,approved.sha256);
for (const mutate of [
  (x,e)=>{if(e==="/pulls/95")x.pullRequest.head.sha="b".repeat(40);},
  (x,e)=>{if(e==="/pulls/95")x.pullRequest.state="closed";},
  (x,e)=>{if(e.includes("reviews"))x.reviews[0].state="DISMISSED";},
  (x,e)=>{if(e.includes("reviews"))x.reviews.push({...x.reviews[0],id:777778,
    state:"CHANGES_REQUESTED",submitted_at:"2026-10-12T01:59:00Z"});},
  ()=>{throw Error("Independent GitHub evidence unavailable");},
]) await assert.rejects(()=>collectWithRace(mutate));
console.log("NATIVE_OWNER_PR_REVIEW_PASS: numeric GitHub owner/reviewer/bot identity, exact current PR/approved commit, dismissed/stale/forged reviews, immutable repo/head and zero authority verified.");
