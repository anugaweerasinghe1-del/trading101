import assert from "node:assert/strict";
import { generateKeyPairSync,sign,randomBytes } from "node:crypto";
import { ownerReceiptBytes,verifyOfflineOwnerReceipt } from "./agent-owner-approval-offline.mjs";
export function offlineOwnerFixture(binding,now=Date.now()){
  const {publicKey,privateKey}=generateKeyPairSync("ed25519");
  const enriched={ownerId:"fixture-owner-identity",approvalId:"approval-v1-"+randomBytes(12).toString("hex"),...binding};
  const receipt={schema:"tradehq-owner-approval-v1",decision:"approve",...enriched,
    issuedAt:new Date(now).toISOString(),expiresAt:new Date(now+300000).toISOString()};
  const signature=sign(null,ownerReceiptBytes(receipt),privateKey).toString("hex");
  const check=(r=receipt,s=signature,k=publicKey,e=enriched,t=now)=>
    verifyOfflineOwnerReceipt({receipt:r,signature:s,publicKey:k,expected:e,now:t});
  const valid=check();
  assert.equal(valid.authorization.codeWrites,false);
  assert.equal(valid.authorization.productionRelease,false);
  assert.match(valid.approvalDigest,/^[a-f0-9]{64}$/);
  assert.throws(()=>check(receipt,signature,generateKeyPairSync("ed25519").publicKey),/signature/);
  assert.throws(()=>check({...receipt,ownerId:"other-user-id"}),/binding/);
  assert.throws(()=>check({...receipt,approvalId:"approval-v1-"+"f".repeat(24)}),/binding/);
  assert.throws(()=>check({...receipt,headSha:"d".repeat(40)}),/binding/);
  assert.throws(()=>check({...receipt,evidenceDigest:"d".repeat(64)}),/binding/);
  assert.throws(()=>check({...receipt,generation:binding.generation+1}),/binding/);
  assert.throws(()=>check({...receipt,expiresAt:new Date(now+3600000).toISOString()}),/lease/);
  assert.throws(()=>check({...receipt,extra:true}),/fields/);
  assert.throws(()=>check(receipt,signature,publicKey,binding,now+300001),/freshness|expired/);
  assert.throws(()=>check(receipt,"0".repeat(128)),/signature/);
  assert.throws(()=>check({...receipt,decision:"release"}),/receipt type/);
  return valid;
}
offlineOwnerFixture({candidateId:"repair-v1-"+"a".repeat(24),baseSha:"a".repeat(40),
  headSha:"b".repeat(40),evidenceDigest:"c".repeat(64),generation:1});

// Test the future identity/database adapter seam without any real owner credentials,
// provider, SQL installation or operational write permission.
const { verifyOfflineOwnerAdapter } = await import("./agent-repair-pipeline-offline.mjs");
const { publicKey, privateKey }=generateKeyPairSync("ed25519");
const clock=Date.now();
const binding={candidateId:"repair-v1-"+"e".repeat(24),ownerId:"registered-fixture-owner",approvalId:"approval-v1-"+"f".repeat(24),baseSha:"a".repeat(40),
  headSha:"b".repeat(40),evidenceDigest:"c".repeat(64),generation:9};
const receipt={schema:"tradehq-owner-approval-v1",decision:"approve",...binding,
  issuedAt:new Date(clock).toISOString(),expiresAt:new Date(clock+300000).toISOString()};
const signature=sign(null,ownerReceiptBytes(receipt),privateKey).toString("hex");
let authCalls=0,stateCalls=0;
const ownerFixture={
  authenticateOwner:async token=>{authCalls++;return token==="private-fixture-token"
    ?{id:"registered-fixture-owner",authenticated:true,testOnly:true}:null;},
  readControlState:async()=>{stateCalls++;return{stopped:false,generation:9,leaseUntil:clock+600000};},
  identityToken:"private-fixture-token",registeredOwnerId:"registered-fixture-owner",
  publicKey,receipt,signature,expected:binding,now:clock,
};
const adapter=await verifyOfflineOwnerAdapter(ownerFixture);
assert.equal(adapter.receiptDigest.length,64);
assert.ok(Object.values(adapter.authorization).every(x=>x===false));
assert.equal(adapter.status,"PENDING_OWNER_ONLY_DURABLE_RECORD");
assert.equal(authCalls,1);assert.equal(stateCalls,1);
for(const changed of [
  {identityToken:"forged"}, {registeredOwnerId:"impostor"},
  {authenticateOwner:undefined}, {readControlState:undefined},
  {readControlState:async()=>({stopped:true,generation:9,leaseUntil:clock+600000})},
  {readControlState:async()=>({stopped:false,generation:10,leaseUntil:clock+600000})},
  {readControlState:async()=>({stopped:false,generation:9,leaseUntil:clock-1})},
  {receipt:{...receipt,ownerId:"other-user-id"}}, {receipt:{...receipt,approvalId:"approval-v1-"+"e".repeat(24)}},
  {receipt:{...receipt,headSha:"d".repeat(40)}}, {receipt:{...receipt,evidenceDigest:"d".repeat(64)}},
  {signature:"0".repeat(128)},{expected:{...binding,generation:10}},
  {now:clock+300001}
])await assert.rejects(verifyOfflineOwnerAdapter({...ownerFixture,...changed}));
console.log("Offline owner adapter: missing/forged identity, stopped/changed generation, expired lease, changed commits/evidence and forged signatures denied; no database or source writes.");

console.log("Ed25519 offline owner receipt: exact binding, signer, issue time, expiry and tampering rejected; no write authority.");