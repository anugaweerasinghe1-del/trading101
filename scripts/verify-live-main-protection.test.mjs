import assert from "node:assert/strict";
import { verifyLiveMainProtection, REQUIRED_MAIN_CONTEXTS } from "./verify-live-main-protection.mjs";
const sha="a".repeat(40);
const checks=REQUIRED_MAIN_CONTEXTS.map(context=>({context,app_id:15368}));
const branch=()=>({name:"main",commit:{sha},protected:true,
  protection:{enabled:true,required_status_checks:{
    enforcement_level:"everyone",contexts:[...REQUIRED_MAIN_CONTEXTS],
    checks:checks.map(c=>({...c}))}}});
const good=verifyLiveMainProtection(branch());
assert.equal(good.mainSha,sha);
assert.equal(good.verifiedChecksEnforcedForEveryone,true);
assert.equal(good.ownerApprovalEnforced,false,"Cannot invent enforced owner approvals");
assert.equal(good.productionReleaseAuthorized,false);
for(const mutation of [
  o=>{o.name="development";},
  o=>{o.commit.sha="main";},
  o=>{o.protected=false;},
  o=>{o.protection.enabled=false;},
  o=>{delete o.protection;},
  o=>{o.protection.required_status_checks.enforcement_level="non_admins";},
  o=>{o.protection.required_status_checks.enforcement_level="";},
  o=>{o.protection.required_status_checks.contexts.pop();},
  o=>{o.protection.required_status_checks.contexts[0]="build";},
  o=>{o.protection.required_status_checks.contexts.push("unknown");},
  o=>{o.protection.required_status_checks.checks.pop();},
  o=>{o.protection.required_status_checks.checks[1].app_id=null;},
  o=>{o.protection.required_status_checks.checks[1].app_id=85455;},
  o=>{o.protection.required_status_checks.checks[1].context=o.protection.required_status_checks.checks[0].context;},
  o=>{delete o.protection.required_status_checks;},
]){
  const copy=branch();mutation(copy);
  assert.throws(()=>verifyLiveMainProtection(copy));
}
assert.throws(()=>verifyLiveMainProtection(null));
console.log("Live main-protection contract: exact trusted check identities, everyone enforcement and fail-closed negative cases passed. Manual owner approval remains a separate limitation.");
