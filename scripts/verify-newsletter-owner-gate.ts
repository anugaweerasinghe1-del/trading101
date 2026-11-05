import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { verifyNewsletterDispatchOwner } from "../supabase/functions/_shared/newsletterDispatchAuth.ts";

// Isolated tests: no production owner, provider, subscriber registry or Resend.
const owner = "12345678-1234-1234-1234-123456789012";
const jwt = "fixture-jwt-longer-than-twenty-characters";
const req = (token: string | null) => new Request("https://example.test", {
  headers: token ? { authorization: "Bearer " + token } : {},
});
let authenticated = 0;
const getUser = async (token: string) => {
  authenticated++;
  return token === jwt ? owner : null;
};
assert.equal(await verifyNewsletterDispatchOwner(req(null), async () => owner, getUser), false);
assert.equal(await verifyNewsletterDispatchOwner(req("wrong-session-id-fixture"), async () => owner, getUser), false);
assert.equal(await verifyNewsletterDispatchOwner(req(jwt), async () => null, getUser), false);
assert.equal(await verifyNewsletterDispatchOwner(req(jwt), async () => "not-owner", getUser), false);
assert.equal(await verifyNewsletterDispatchOwner(req(jwt), async () => owner, async () => "foreign-user"), false);
assert.equal(await verifyNewsletterDispatchOwner(req(jwt), async () => owner, getUser), true);
assert.equal(await verifyNewsletterDispatchOwner(req(jwt), async () => { throw Error("db down"); }, getUser), false);
assert.equal(await verifyNewsletterDispatchOwner(req(jwt), async () => owner,
  async () => { throw Error("Auth service down"); }), false);
assert.ok(authenticated >= 1, "Supabase Auth must be consulted for owner matching");

const dispatch = readFileSync("supabase/functions/newsletter-dispatch/index.ts", "utf8");
const ui = readFileSync("src/pages/AdminNewsletter.tsx", "utf8");
const masterGate = dispatch.indexOf('validKey(Deno.env.get("ADMIN_MASTER_KEY")');
const readiness = dispatch.indexOf('if(input?.action==="publish-readiness")');
const publishIntent = dispatch.indexOf('if(input?.action!=="publish"||input?.confirmed!==true)');
const verifiedSend = dispatch.indexOf("if(!await authorizedOwner(req))", publishIntent);
const firstEditionRead = dispatch.indexOf('db.from("newsletter_editions")');
const firstDeliveryRead = dispatch.indexOf('db.from("newsletter_deliveries")', publishIntent);
assert.ok(masterGate >= 0 && readiness > masterGate && publishIntent > readiness);
assert.ok(verifiedSend > publishIntent && verifiedSend < firstEditionRead);
assert.ok(verifiedSend < firstDeliveryRead, "No delivery ledger accessed without owner authorization");
assert.match(dispatch, /getUser\(jwt\)/);
assert.match(dispatch, /tradehq_repair_registered_owner/);
assert.match(dispatch, /providerAttemptMade:false/);
assert.match(dispatch, /emailsSent:0/);
assert.match(ui, /supabase\.auth\.getSession\(\)/);
assert.match(ui, /distributionCall\("publish-readiness", \{\}, token\)/);
assert.match(ui, /distributionCall\("publish", \{[\s\S]*?\}, token\)/);
assert.match(ui, /editor\.current\.dirty/);
assert.match(ui, /Verify owner access \(no email\)/);
assert.match(ui, /Sending cannot be undone/);
assert.match(dispatch, /Idempotency-Key/);
assert.match(dispatch, /List-Unsubscribe-Post/);
console.log("PASS no-send newsletter owner readiness, authenticated send ordering, and fail-closed owner checks");
