/**
 * Exact owner-provenance and conservative GitHub issue-history budget.
 *
 * This is a pre-model admission check, not an owner signature, live quota check,
 * repair approval, or production release permission. No writes or AI calls.
 * Uses issues:read implicitly included in the existing issues:write permission.
 */
import assert from "node:assert/strict";
const REPO="anugaweerasinghe1-del/trading101";
const REPO_ID=1130435580;
const OWNER="anugaweerasinghe1-del";
const OWNER_ID=297117529;
const CODE_TITLE="[TradeHQ Code Request]";
const SHA=/^[a-f0-9]{40}$/;
const DAY=24*60*60*1000;
const MAX_ISSUES=400;

function isOwnerIssue(issue) {
  return issue && !issue.pull_request && issue.user?.id===OWNER_ID
    && issue.user?.login===OWNER && issue.title===CODE_TITLE;
}
function timestamp(value) {
  const date=Date.parse(value);
  assert.ok(typeof value==="string" && Number.isFinite(date),
    "Missing or malformed immutable issue creation time");
  return date;
}

/** Pure pre-model check; no model, source writes or tokens. */
export function validateOwnerCodeRequest({event,liveIssue,repository,env,issueHistory,now=Date.now()}) {
  assert.ok(Number.isFinite(now) && event && env && repository && liveIssue,
    "Complete owner request provenance required");
  assert.ok(env.GITHUB_REPOSITORY===REPO && env.GITHUB_REPOSITORY_ID===String(REPO_ID)
    && env.GITHUB_ACTOR===OWNER && env.GITHUB_ACTOR_ID===String(OWNER_ID)
    && env.GITHUB_EVENT_NAME==="issues" && env.GITHUB_REF==="refs/heads/main"
    && env.GITHUB_RUN_ATTEMPT==="1"
    && /^[1-9][0-9]{4,18}$/.test(env.GITHUB_RUN_ID||"")
    && SHA.test(env.GITHUB_SHA||""),
    "Trusted owner-only GitHub Actions first-attempt context required");
  assert.ok(repository.id===REPO_ID && repository.full_name===REPO
    && repository.owner?.id===OWNER_ID && repository.owner?.login===OWNER
    && repository.default_branch==="main",
    "Actual repository identity/ownership changed");
  assert.ok(event.action==="opened" && event.repository?.id===REPO_ID
    && event.repository?.full_name===REPO
    && event.repository.owner?.id===OWNER_ID
    && event.sender?.id===OWNER_ID && event.sender?.login===OWNER
    && isOwnerIssue(event.issue) && isOwnerIssue(liveIssue)
    && liveIssue.state==="open",
    "Only the original GitHub-authenticated owner can open a code request");
  const issueNumber=Number(env.TRADEHQ_ISSUE_NUMBER);
  assert.ok(Number.isSafeInteger(issueNumber) && issueNumber>0
    && event.issue.number===issueNumber && liveIssue.number===issueNumber
    && event.issue.id===liveIssue.id && Number.isSafeInteger(liveIssue.id)
    && liveIssue.id>0
    && event.issue.created_at===liveIssue.created_at
    && event.issue.title===liveIssue.title
    && event.issue.body===liveIssue.body
    && typeof liveIssue.body==="string",
    "Owner request changed since the original signed GitHub webhook snapshot");
  const opened=timestamp(liveIssue.created_at);
  assert.ok(opened<=now+30_000 && opened>=now-DAY,
    "Only a fresh owner-opened request can authorize a model call");
  assert.ok(Array.isArray(issueHistory) && issueHistory.length>0
    && issueHistory.length<=MAX_ISSUES,"Complete bounded issue history required");
  const seen=new Set();
  const relevant=[];
  for(const entry of issueHistory) {
    assert.ok(Number.isSafeInteger(entry?.id) && entry.id>0 && !seen.has(entry.id),
      "Duplicate or malformed GitHub issue history");
    seen.add(entry.id);
    const created=timestamp(entry.created_at);
    assert.ok(created<=now+30000,"Future-dated GitHub issue history");
    if(isOwnerIssue(entry) && created>=now-DAY) relevant.push(entry);
  }
  assert.ok(seen.has(liveIssue.id),"Current owner issue must exist in independently read history");
  assert.equal(relevant.length,1,
    "At most one owner code request per 24 hours; no extra Gemini requests or writes");
  assert.equal(relevant[0].id,liveIssue.id,
    "A previous owner request already consumed the rolling 24-hour budget");
  return Object.freeze({
    issueNumber,issueId:liveIssue.id,body:liveIssue.body,
    baseSha:env.GITHUB_SHA,ownerId:OWNER_ID,actor:OWNER,
    authorization:Object.freeze({modelCall:false,branchWrite:false,merge:false,release:false}),
    limitations:Object.freeze(["Issue history is bounded and editable by repository administrators.",
      "GitHub owner identity is not a cryptographic repair-approval receipt.",
      "A successful admission does not verify Gemini free-tier quota headroom."])
  });
}

/** Call before any branch/blob write, after model output is mechanically checked. */
export function assertUnchangedOwnerIssue(initial,live,repoSha) {
  assert.ok(initial && live && SHA.test(repoSha||"") && initial.baseSha===repoSha
    && initial.issueNumber===live.number && initial.issueId===live.id
    && isOwnerIssue(live) && live.state==="open" && initial.body===live.body,
    "Owner request edited, closed, moved or source base changed; abort proposal");
  return true;
}

export async function collectOwnerIssueHistory(read,now=Date.now()) {
  assert.ok(typeof read==="function" && Number.isFinite(now),"Read-only issue collector required");
  const collected=[],seen=new Set();
  for(let page=1;page<=4;page++) {
    const result=await read("/issues?state=all&per_page=100&page="+page);
    assert.ok(Array.isArray(result) && result.length<=100,"GitHub issue history cannot be verified");
    for(const x of result) {
      assert.ok(Number.isSafeInteger(x?.id) && x.id>0 && !seen.has(x.id),
        "Ambiguous GitHub pagination");
      seen.add(x.id);collected.push(x);
    }
    if(result.length<100)return collected;
    const oldest=timestamp(result.at(-1)?.created_at);
    assert.ok(oldest<=now+30000,"Invalid issue ordering");
    if(oldest<now-DAY)return collected;
  }
  throw Error("Too many recent issues for reliable free-tier request budgeting");
}
