import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";

// Exercise the deployed Deno handler with isolated, synthetic data. The source
// is transpiled in memory; Supabase, auth, quotas and subscribers are all mocks.
const code = readFileSync("supabase/functions/newsletter-audience-admin/index.ts", "utf8");
assert.match(code, /confirmedSubscribers:0/);
assert.match(code, /unsubscribesTracked:false/);
assert.match(code, /verifyNewsletterDispatchOwner\(req,/);
assert.match(code, /tradehq_repair_registered_owner/);
assert.match(code, /db\.auth\.getUser\(jwt\)/);
assert.doesNotMatch(code, /resend\.com|RESEND_API_KEY|sendMail|sendEmail/);
const compiled = ts.transpileModule(
  code.replace(/^import .+\r?\n/gm, ""),
  { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } },
).outputText;

let handle, reads = 0, accepted = true, failure = false;
let registeredOwner = "owner-fixture", registeredLookups = 0, authLookups = 0;
let authDown = false, registeredDown = false;
const legacy = [{ email: "legacy-fixture@example.invalid", source: "old-form", subscribed_at: "2026-10-01T12:00:00Z" }];
const db = {
  rpc: async name => { assert.equal(name, "tradehq_repair_registered_owner"); registeredLookups++;
    return { data: registeredOwner, error: registeredDown ? { code: "fixture" } : null }; },
  auth: { getUser: async jwt => { authLookups++; return {
    data: { user: jwt === "valid-owner-jwt" ? { id: "owner-fixture" } : { id: "other-fixture" } },
    error: authDown ? { code: "fixture" } : null,
  }; } },
  from(table) {
  assert.equal(table, "subscribers");
  return { select(fields, options) {
    reads++;
    if (options?.head) return Promise.resolve({ count: 4, error: failure ? { code: "fixture" } : null });
    assert.equal(fields, "email,subscribed_at,source");
    return { order(field, sorting) {
      assert.equal(field, "subscribed_at");
      assert.equal(sorting.ascending, false);
      return { limit(max) {
        assert.equal(max, 250, "Legacy overview must be bounded");
        return Promise.resolve({ data: legacy, error: failure ? { code: "fixture" } : null });
      } };
    } };
  } };
} };
const mocked = {
  createClient: () => db,
  allow: async () => accepted,
  clientIp: () => "test-ip",
  // The real helper is separately verified by the newsletter owner-gate tests.
  // Exercise this endpoint\u0027s wiring: missing session, wrong identity or upstream
  // failure cannot reach the historical-email query.
  verifyNewsletterDispatchOwner: async (request, findOwner, getUser) => {
    const owner = await findOwner();
    const bearer = request.headers.get("authorization");
    if (!owner || !bearer?.startsWith("Bearer ")) return false;
    const user = await getUser(bearer.slice(7));
    return Boolean(user && user === owner);
  },
  Deno: {
    env: { get: key => key === "ADMIN_MASTER_KEY" ? "test-secret-only" : "test-placeholder" },
    serve: fn => { handle = fn; },
  },
  Request, Response, console,
};
runInNewContext(compiled, mocked, { timeout: 1000 });
assert.equal(typeof handle, "function");
const req = (action = "summary", key = "test-secret-only", method = "POST", jwt = "valid-owner-jwt") =>
  new Request("https://example.invalid/functions/v1/newsletter-audience-admin", {
    method, headers: { "x-admin-key": key, "Content-Type": "application/json",
      ...(jwt ? { authorization: "Bearer " + jwt } : {}) },
    ...(method === "POST" ? { body: JSON.stringify({ action }) } : {}),
  });

const options = await handle(req("summary", "test-secret-only", "OPTIONS"));
assert.equal(options.status, 204, "CORS preflight must return a valid bodyless 204");
assert.equal(await options.text(), "");
assert.match(options.headers.get("access-control-allow-headers") ?? "", /x-admin-key/);
assert.equal((await handle(req("summary", "test-secret-only", "GET"))).status, 405);
assert.equal((await handle(req("summary", "wrong-key"))).status, 401);
assert.equal(reads, 0, "Bad admin keys cannot query subscriber rows");
assert.equal(registeredLookups, 0, "Invalid master keys must not reach owner service");
assert.equal((await handle(req("publish"))).status, 400, "Legacy overview must never publish");
assert.equal(reads, 0);
assert.equal((await handle(req("summary", "test-secret-only", "POST", null))).status, 403,
  "Admin master key alone must not disclose legacy subscriber emails");
assert.equal(reads, 0);
registeredOwner = "other-owner-fixture";
assert.equal((await handle(req())).status, 403, "Only registered owner is authorized");
registeredOwner = "owner-fixture";
assert.equal((await handle(req("summary", "test-secret-only", "POST", "other-jwt"))).status, 403);
registeredDown = true;
assert.equal((await handle(req())).status, 403, "Owner registry outage must fail closed");
registeredDown = false;
authDown = true;
assert.equal((await handle(req())).status, 403, "Auth outage must fail closed");
authDown = false;
assert.equal(reads, 0, "Denied identity attempts must never query subscriber rows");
assert.ok(registeredLookups > 0 && authLookups > 0, "Both owner and auth paths must run");
const good = await handle(req());
assert.equal(good.status, 200);
assert.equal(good.headers.get("cache-control"), "no-store");
const result = await good.json();
assert.equal(result.data.legacyRecordsTotal, 4);
assert.equal(result.data.confirmedSubscribers, 0, "No invented opt-in evidence");
assert.equal(result.data.unsubscribesTracked, false);
assert.deepEqual(result.data.records, legacy);
assert.match(result.data.notice, /not an authorized recipient list/i);

failure = true;
assert.equal((await handle(req())).status, 503, "Backend read errors fail closed");
failure = false;
accepted = false;
const beforeThrottle = reads;
assert.equal((await handle(req())).status, 429);
assert.equal(reads, beforeThrottle, "Rate-limited requests must not access data");
console.log("PASS legacy newsletter audience: valid 204 preflight, master-key + registered owner JWT, no reads before authorization, bounded unconfirmed records, backend failure and rate-limit recovery.");
