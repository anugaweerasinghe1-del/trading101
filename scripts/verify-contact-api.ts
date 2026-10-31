import assert from "node:assert/strict";
import { onRequestGet, onRequestPost } from "../functions/api/contact";

const url = "https://www.thetradehq.com/api/contact";
const configured = {
  RESEND_API_KEY: "test-only",
  CONTACT_FROM_EMAIL: "contact@example.com",
  CONTACT_TO_EMAIL: "owner@example.com",
  CONTACT_TURNSTILE_SITE_KEY: "public-test",
  CONTACT_TURNSTILE_SECRET: "private-test",
};
const form = {
  name: "Example Learner",
  email: "visitor@example.com",
  subject: "Site feedback",
  message: "I found a confusing sentence in the simulator lesson.",
  website: "",
  turnstileToken: "challenge-token",
};
const req = (origin: string, data: Record<string, unknown> = form) => new Request(url, {
  method: "POST",
  headers: { Origin: origin, "Content-Type": "application/json" },
  body: JSON.stringify(data),
});

const unconfigured = await onRequestGet({ request: new Request(url), env: {} });
assert.deepEqual(await unconfigured.json(), { enabled: false, siteKey: null });
const config = await onRequestGet({ request: new Request(url), env: configured });
assert.deepEqual(await config.json(), { enabled: true, siteKey: "public-test" });
assert.equal((await onRequestPost({ request: req("https://www.thetradehq.com"), env: {} })).status, 503);
assert.equal((await onRequestPost({ request: req("https://evil.example"), env: configured })).status, 403);
assert.equal((await onRequestPost({ request: req("https://www.thetradehq.com", { ...form, message: "hi" }), env: configured })).status, 400);
assert.equal((await onRequestPost({ request: req("https://www.thetradehq.com", { ...form, website: "spam" }), env: configured })).status, 400);

const actualFetch = globalThis.fetch;
try {
  const called: string[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL, options?: RequestInit) => {
    const target = String(input);
    called.push(target);
    if (target.includes("siteverify")) return new Response(JSON.stringify({ success: false }), { status: 200 });
    throw new Error("Email request MUST NOT happen after failed CAPTCHA");
  }) as typeof fetch;
  const failed = await onRequestPost({ request: req("https://www.thetradehq.com"), env: configured });
  assert.equal(failed.status, 403);
  assert.equal(called.length, 1);

  called.length = 0;
  globalThis.fetch = (async (input: RequestInfo | URL, options?: RequestInit) => {
    const target = String(input);
    called.push(target);
    if (target.includes("siteverify")) return new Response(JSON.stringify({
      success: true, hostname: "www.thetradehq.com", action: "contact",
    }), { status: 200 });
    if (target === "https://api.resend.com/emails") {
      const sent = JSON.parse(String(options?.body));
      assert.deepEqual(sent.to, ["owner@example.com"]);
      assert.deepEqual(sent.reply_to, ["visitor@example.com"]);
      assert.ok(sent.text.includes("Site feedback"));
      return new Response(JSON.stringify({ id: "test-receipt" }), { status: 200 });
    }
    throw new Error("Unexpected request " + target);
  }) as typeof fetch;
  const accepted = await onRequestPost({ request: req("https://www.thetradehq.com"), env: configured });
  assert.equal(accepted.status, 200);
  assert.equal((await accepted.json() as { sent: boolean }).sent, true);
  assert.equal(called.length, 2);

  globalThis.fetch = (async (input: RequestInfo | URL) => {
    if (String(input).includes("siteverify"))
      return new Response(JSON.stringify({ success: true, hostname: "www.thetradehq.com", action: "contact" }), { status: 200 });
    return new Response("Service rejected sender", { status: 403 });
  }) as typeof fetch;
  const rejected = await onRequestPost({ request: req("https://www.thetradehq.com"), env: configured });
  assert.equal(rejected.status, 502);
  assert.equal((await rejected.json() as { sent: boolean }).sent, false);
} finally {
  globalThis.fetch = actualFetch;
}
console.log("PASS contact delivery stays disabled without secrets, rejects abuse, and only confirms provider-accepted mail");
