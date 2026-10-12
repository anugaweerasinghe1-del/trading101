/**
 * Observe a native GitHub PR approval by the actual repository owner.
 * Runs only on GitHub's pull_request_review event. Exact currently open bot
 * proposal and review commit are independently read over GitHub's API.
 *
 * This evidence IS NOT a durable repair approval, owner Ed25519 signature,
 * deploy authorization, provider access, or merge permission.
 */
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import {pathToFileURL} from "node:url";
const REPO="anugaweerasinghe1-del/trading101";
const REPO_ID=1130435580;
const OWNER={id:297117529,login:"anugaweerasinghe1-del"};
const BOT={id:41898282,login:"github-actions[bot]"};
const SHA=/^[a-f0-9]{40}$/;
const MAX_REVIEWS=99;
const clockTime=x=>{
  const date=Date.parse(x);
  assert.ok(typeof x==="string"&&Number.isFinite(date),"GitHub review time missing");
  return date;
};

export function verifyOwnerPrReview({event,repository,pullRequest,reviews,env,now=Date.now()}) {
  assert.ok(event && repository && pullRequest && env && Array.isArray(reviews)
    && Number.isFinite(now),"Independent complete GitHub review evidence required");
  assert.ok(env.GITHUB_EVENT_NAME==="pull_request_review"
    && env.GITHUB_REPOSITORY===REPO
    && env.GITHUB_REPOSITORY_ID===String(REPO_ID)
    && env.GITHUB_ACTOR===OWNER.login
    && env.GITHUB_ACTOR_ID===String(OWNER.id)
    && /^[1-9][0-9]{4,18}$/.test(env.GITHUB_RUN_ID||"")
    && env.GITHUB_RUN_ATTEMPT==="1",
    "Only a new GitHub-authenticated owner review is valid");
  assert.ok(repository.id===REPO_ID&&repository.full_name===REPO
    && repository.owner?.id===OWNER.id && repository.owner?.login===OWNER.login
    && repository.default_branch==="main"
    && event.repository?.id===REPO_ID
    && event.repository.owner?.id===OWNER.id
    && event.sender?.id===OWNER.id && event.sender?.login===OWNER.login,
    "Owner/repository identity mismatch");
  assert.ok(event.action==="submitted" && event.review?.state==="approved"
    && event.review.user?.id===OWNER.id && event.review.user?.login===OWNER.login,
    "Only GitHub native owner-approved PR reviews count");
  const pr=pullRequest,initial=event.pull_request,approval=event.review;
  assert.ok(Number.isSafeInteger(pr.number) && pr.number>0
    && event.number===pr.number && initial?.number===pr.number
    && initial.id===pr.id && pr.id>0
    && pr.state==="open" && pr.merged_at===null
    && pr.draft===false
    && pr.user?.id===BOT.id && pr.user?.login===BOT.login,
    "Review must belong to a currently open, ready-for-review bot PR");
  assert.ok(pr.base?.ref==="main" && pr.base.repo?.id===REPO_ID
    && pr.head?.repo?.id===REPO_ID
    && /^ai\/issue-[1-9][0-9]{0,9}$/.test(pr.head?.ref||"")
    && SHA.test(pr.head?.sha||"") && initial.head?.sha===pr.head.sha
    && initial.head.ref===pr.head.ref,
    "Bot proposal branch, immutable head and target changed");
  assert.ok(approval.commit_id===pr.head.sha
    && Number.isSafeInteger(approval.id) && approval.id>0,
    "Owner approval must bind the exact current proposal commit");
  const issued=clockTime(approval.submitted_at);
  assert.ok(issued<=now+30000 && issued>=now-24*60*60_000,
    "Owner review event too old or future-dated to trust");
  assert.ok(reviews.length>0&&reviews.length<=MAX_REVIEWS,
    "Incomplete review history; refuse consent evidence");
  const matches=reviews.filter(x=>x.id===approval.id);
  assert.equal(matches.length,1,"Approved review not found uniquely via GitHub API");
  const live=matches[0];
  assert.ok(live.user?.id===OWNER.id && live.user?.login===OWNER.login
    && live.state==="APPROVED" && live.commit_id===pr.head.sha
    && live.submitted_at===approval.submitted_at,
    "Owner approval was dismissed, changed or is no longer current");
  const seen=new Set();
  for (const item of reviews) {
    assert.ok(Number.isSafeInteger(item?.id) && item.id>0 && !seen.has(item.id),
      "Duplicate or malformed GitHub review history");
    seen.add(item.id);
    // A later submitted owner review invalidates this event even when GitHub
    // retains the earlier record as APPROVED. Review comments and pending
    // drafts do not grant authority; reject ambiguous owner history too.
    if (item.user?.id===OWNER.id || item.user?.login===OWNER.login) {
      assert.ok(item.user.id===OWNER.id && item.user.login===OWNER.login,
        "Conflicting owner identity in review history");
      if (item.state==="PENDING") continue;
      const submitted=clockTime(item.submitted_at);
      assert.ok(submitted<=now+30000,
        "Future-dated owner review history");
      assert.ok(item.id===live.id || (submitted<=issued && item.id<live.id),
        "Owner approval was superseded by a later review");
    }
  }
  const witness={
    schema:"tradehq-native-owner-pr-review-v1",
    repositoryId:REPO_ID,prNumber:pr.number,reviewId:approval.id,
    ownerId:OWNER.id,approvedHeadSha:pr.head.sha,submittedAt:approval.submitted_at,
    status:"OWNER_REVIEW_OBSERVED_NO_RELEASE_AUTHORITY",
    authorization:{codeWrites:false,modelCalls:false,merge:false,
      productionRelease:false,repairAuthorization:false},
    limitations:["GitHub-native approval is for this exact bot PR only, not a durable repair receipt.",
      "Independent CI, branch protections, owner merge decision and deployment gates remain mandatory.",
      "Review can be dismissed or commit changed after this witness; recheck before any future release."]
  };
  return {...witness,sha256:createHash("sha256").update(JSON.stringify(witness)).digest("hex")};
}

async function github(endpoint,token) {
  const res=await fetch("https://api.github.com/repos/"+REPO+endpoint,{
    redirect:"error",signal:AbortSignal.timeout(12000),
    headers:{Authorization:"Bearer "+token,Accept:"application/vnd.github+json",
      "X-GitHub-Api-Version":"2022-11-28"}});
  assert.equal(res.status,200,"Independent owner approval GitHub evidence is unavailable");
  const raw=await res.text();
  assert.ok(Buffer.byteLength(raw)<600000,"Owner review evidence unexpectedly large");
  return JSON.parse(raw);
}
export async function collectOwnerPrReview({event,env,read,now=Date.now()}) {
  assert.equal(typeof read,"function","Independent bounded GitHub reader required");
  assert.ok(Number.isSafeInteger(event.number)&&event.number>0,"GitHub PR review number required");
  const [repository,pullRequest,reviews]=await Promise.all([
    read(""),
    read("/pulls/"+event.number),
    read("/pulls/"+event.number+"/reviews?per_page=100"),
  ]);
  const proof=verifyOwnerPrReview({event,repository,pullRequest,reviews,env,now});
  // Re-read after history collection. A changed head, dismissal or new review
  // during the first reads must not produce a successful witness.
  const [currentPr,currentReviews]=await Promise.all([
    read("/pulls/"+event.number),
    read("/pulls/"+event.number+"/reviews?per_page=100"),
  ]);
  const currentProof=verifyOwnerPrReview({event,repository,
    pullRequest:currentPr,reviews:currentReviews,env,now});
  assert.equal(currentProof.sha256,proof.sha256,"Approval binding changed during verification");
  return currentProof;
}
async function main(){
  const env=process.env;
  assert.ok(typeof env.GITHUB_EVENT_PATH==="string"&&env.GITHUB_EVENT_PATH.length>0
    && typeof env.GITHUB_TOKEN==="string"&&env.GITHUB_TOKEN.length>=20,
    "GitHub Actions event and read-only token required");
  const event=JSON.parse(await readFile(env.GITHUB_EVENT_PATH,"utf8"));
  const proof=await collectOwnerPrReview({event,env,
    read:endpoint=>github(endpoint,env.GITHUB_TOKEN)});
  console.log("TRADEHQ_OWNER_PR_REVIEW_EVIDENCE_V1 "+JSON.stringify(proof));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  main().catch(()=>{console.error("Owner PR review evidence rejected. No repair, merge or release authority granted.");process.exitCode=1;});
}
