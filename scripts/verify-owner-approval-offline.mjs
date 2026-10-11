import assert from "node:assert/strict";
import { generateKeyPairSync,sign } from "node:crypto";
import { ownerReceiptBytes,verifyOfflineOwnerReceipt } from "./agent-owner-approval-offline.mjs";
export function offlineOwnerFixture(binding,now=Date.now()){
  const {publicKey,privateKey}=generateKeyPairSync("ed25519");
  const receipt={schema:"tradehq-owner-approval-v1",decision:"approve",...binding,
    issuedAt:new Date(now).toISOString(),expiresAt:new Date(now+300000).toISOString()};
  const signature=sign(null,ownerReceiptBytes(receipt),privateKey).toString("hex");
  const check=(r=receipt,s=signature,k=publicKey,e=binding,t=now)=>
    verifyOfflineOwnerReceipt({receipt:r,signature:s,publicKey:k,expected:e,now:t});
  const valid=check();
  assert.equal(valid.authorization.codeWrites,false);
  assert.equal(valid.authorization.productionRelease,false);
  assert.match(valid.approvalDigest,/^[a-f0-9]{64}$/);
  assert.throws(()=>check(receipt,signature,generateKeyPairSync("ed25519").publicKey),/signature/);
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
console.log("Ed25519 offline owner receipt: exact binding, signer, issue time, expiry and tampering rejected; no write authority.");