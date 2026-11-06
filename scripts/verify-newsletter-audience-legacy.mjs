import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";

// Exercise the deployed Deno handler with isolated, synthetic data. The source
// is transpiled in memory; Supabase, auth, quotas and subscribers are all mocks.
const code = readFileSync("supabase/functions/newsletter-audience-admin/index.ts", "utf8");
assert.match(code, /confirmedSubscribers:0/);
assert.match(code, /unsubscribesTracked:false/);
assert.doesNotMatch(code, /resend\.com|RESEND_API_KEY|sendMail|sendEmail/);
const compiled = ts.transpileModule(
  code.replace(/^import .+\r?\n/gm, ""),
  { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } },
).outputText;

let handle, reads = 0, accepted = true, failure = false;
const legacy = [{ email: "legacy-fixture@example.invalid", source: "old-form", subscribed_at: "2026-10-01T12:00:00Z" }];
const db = { from(table) {
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
  Deno: {
    env: { get: key => key === "ADMIN_MASTER_KEY" ? "test-secret-only" : "test-placeholder" },
    serve: fn => { handle = fn; },
  },
  Request, Response, console,
};
runInNewContext(compiled, mocked, { timeout: 1000 });
assert.equal(typeof handle, "function");
const req = (action = "summary", key = "test-secret-only", method = "POST") =>
  new Request("https://example.invalid/functions/v1/newsletter-audience-admin", {
    method, headers: { "x-admin-key": key, "Content-Type": "application/json" },
    ...(method === "POST" ? { body: JSON.stringify({ action }) } : {}),
  });

const options = await handle(req("summary", "test-secret-only", "OPTIONS"));
assert.equal(options.status, 204, "CORS preflight must return a valid bodyless 204");
assert.equal(await options.text(), "");
assert.match(options.headers.get("access-control-allow-headers") ?? "", /x-admin-key/);
assert.equal((await handle(req("summary", "test-secret-only", "GET"))).status, 405);
assert.equal((await handle(req("summary", "wrong-key"))).status, 401);
assert.equal(reads, 0, "Bad admin keys cannot query subscriber rows");
assert.equal((await handle(req("publish"))).status, 400, "Legacy overview must never publish");
assert.equal(reads, 0);
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
console.log("PASS legacy newsletter audience: valid 204 preflight, owner-key gate, no sends, bounded unconfirmed records, backend failure and rate-limit recovery.");
