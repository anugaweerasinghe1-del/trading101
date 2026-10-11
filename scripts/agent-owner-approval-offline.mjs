/** Offline signature verification only: no I/O, private keys, AI, source writes or release. */
import assert from "node:assert/strict";
import { createHash, createPublicKey, verify } from "node:crypto";
const FIELDS=["schema","decision","candidateId","baseSha","headSha","evidenceDigest","generation","issuedAt","expiresAt"];
function timestamp(s) {
  assert.ok(typeof s==="string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(s),"Exact UTC ISO time required");
  const n=Date.parse(s);
  assert.ok(Number.isFinite(n) && new Date(n).toISOString()===s,"Invalid time");
  return n;
}
export function ownerReceiptBytes(p) {
  assert.ok(p && typeof p==="object" && !Array.isArray(p),"Receipt object required");
  assert.deepEqual(Object.keys(p).sort(),[...FIELDS].sort(),"Receipt missing or extra fields");
  assert.ok(p.schema==="tradehq-owner-approval-v1" && p.decision==="approve","Unexpected receipt type");
  assert.ok(/^repair-v1-[a-f0-9]{24}$/.test(p.candidateId) && /^[a-f0-9]{40}$/.test(p.baseSha)
    && /^[a-f0-9]{40}$/.test(p.headSha) && p.baseSha!==p.headSha
    && /^[a-f0-9]{64}$/.test(p.evidenceDigest),"Invalid immutable identities");
  assert.ok(Number.isSafeInteger(p.generation) && p.generation>=0,"Invalid stop generation");
  timestamp(p.issuedAt);timestamp(p.expiresAt);
  return Buffer.from(JSON.stringify(Object.fromEntries(FIELDS.map(k=>[k,p[k]]))));
}
export function verifyOfflineOwnerReceipt({receipt,signature,publicKey,expected,now=Date.now()}) {
  const message=ownerReceiptBytes(receipt);
  assert.ok(Number.isFinite(now) && expected && typeof expected==="object","Expected independent binding required");
  const issued=timestamp(receipt.issuedAt),expires=timestamp(receipt.expiresAt);
  assert.ok(issued<=now+30000 && issued>=now-300000,"Receipt outside issuance freshness");
  assert.ok(expires>now && expires>issued && expires<=issued+1800000,"Receipt expired or beyond lease");
  for(const field of ["candidateId","baseSha","headSha","evidenceDigest","generation"])
    assert.ok(Object.hasOwn(expected,field) && receipt[field]===expected[field],"Receipt binding mismatch");
  assert.ok(typeof signature==="string" && /^[a-f0-9]{128}$/.test(signature),"Malformed signature");
  const key=publicKey?.type==="public" ? publicKey : createPublicKey(publicKey);
  assert.equal(key.asymmetricKeyType,"ed25519","Ed25519 public key required");
  const bytes=Buffer.from(signature,"hex");
  assert.ok(verify(null,message,key,bytes),"Invalid owner signature");
  return {schema:"tradehq-owner-receipt-verified-v1",
    approvalDigest:createHash("sha256").update(message).update(bytes).digest("hex"),
    expiresAt:receipt.expiresAt, candidateId:receipt.candidateId, baseSha:receipt.baseSha,
    headSha:receipt.headSha, evidenceDigest:receipt.evidenceDigest, generation:receipt.generation,
    authorization:{codeWrites:false,modelCalls:false,merge:false,productionRelease:false}};
}