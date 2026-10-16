/** Close an exact owner-declined draft. No model, merge or source-write path. */
import assert from 'node:assert/strict';
export async function processRejectedProposal({queue,github,mainSha}) {
 const claim=await queue('worker-review-claim');
 if(!claim)return {status:'idle'};
 assert.match(claim.request_id,/^[a-f0-9-]{36}$/);assert.match(claim.head_sha,/^[a-f0-9]{40}$/);
 assert.ok(Number.isSafeInteger(claim.pr_number)&&claim.pr_number>0);
 const path='/pulls/'+claim.pr_number;
 const pr=await github(path);
 const matches=pr.user?.login==='github-actions[bot]'&&pr.user?.id===41898282&&pr.draft===true
  &&pr.base?.ref==='main'&&pr.head?.ref==='ai/admin-'+claim.request_id&&pr.head?.sha===claim.head_sha&&pr.head?.repo?.id===1130435580;
 if(matches&&pr.state==='open'){
  const current=await github('/branches/main');
  assert.ok(current.protected&&current.commit?.sha===mainSha,'Main changed before draft closure');
  try{await github(path,'PATCH',{state:'closed'});}catch{/* Server independently reports whether closure actually happened. */}
 }
 const result=await queue('worker-review-result',{id:claim.request_id,headSha:claim.head_sha,prNumber:claim.pr_number});
 assert.ok(['closed','blocked'].includes(result?.close_state));
 return {status:result.close_state};
}
