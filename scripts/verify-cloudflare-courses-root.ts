import assert from "node:assert/strict";
import { onRequestGet } from "../functions/courses/[[path]].ts";

const canonical = (path: string) =>
  '<html><head><title>TradeHQ Courses</title><link rel="canonical" href="https://www.thetradehq.com' +
  path + '" /></head><body><div id="root"><main>Educational courses and practice</main></div></body></html>';
function makeContext(url: string, missingListing = false) {
  const requested: string[] = [];
  const env = { ASSETS: { fetch: async (input: Request) => {
    const p = new URL(input.url).pathname;
    requested.push(p);
    if (missingListing) return new Response("Missing static course listing", { status: 404 });
    if (p === "/courses") return new Response(canonical("/courses"), {
      status: 200, headers: { "content-type": "text/html; charset=utf-8" },
    });
    if (p === "/courses/example-course") return new Response(canonical("/courses/example-course"), {
      status: 200, headers: { "content-type": "text/html; charset=utf-8" },
    });
    return new Response("Not found", { status: 404 });
  } } };
  return { context: { request: new Request(url), env }, requested };
}
async function get(url: string, missingListing = false) {
  const { context, requested } = makeContext(url, missingListing);
  const response = await onRequestGet(context);
  return { response, requested, body: await response.text() };
}
for (const path of ["/courses"]) {
  const p = await get("https://www.thetradehq.com" + path);
  assert.equal(p.response.status, 200, "Course listing must not be handled as invalid slug");
  assert.deepEqual(p.requested, ["/courses"]);
  assert.match(p.body, /rel="canonical" href="https:\/\/www.thetradehq.com\/courses"/);
  assert.match(p.body, /id="root"/);
  assert.ok(!p.response.headers.has("X-Robots-Tag"), "Production authored listing should retain indexability");
}
const previewRoot = await get("https://preview.tradehq-preview.pages.dev/courses");
assert.equal(previewRoot.response.status, 200);
assert.match(previewRoot.response.headers.get("X-Robots-Tag") || "", /noindex/i);
const previewCourse = await get("https://preview.tradehq-preview.pages.dev/courses/example-course");
assert.equal(previewCourse.response.status, 200);
assert.match(previewCourse.body, /courses\/example-course/);
assert.match(previewCourse.response.headers.get("X-Robots-Tag") || "", /noindex/i);
const missing = await get("https://www.thetradehq.com/courses", true);
assert.equal(missing.response.status, 503, "Missing listing should never become a fake valid page");
assert.equal(missing.response.headers.get("Cache-Control"), "no-store");
const invalid = await get("https://www.thetradehq.com/courses/NOT-A-SLUG");
assert.equal(invalid.response.status, 404, "Invalid dynamic slugs still reject");
assert.deepEqual(invalid.requested, [], "Invalid slugs must not touch backing assets or database");
console.log("Cloudflare Pages course root, authored slug, preview noindex, missing assets and invalid slug tests passed.");

const slash = await get("https://www.thetradehq.com/courses/?ref=test");
assert.equal(slash.response.status, 308);
assert.equal(slash.response.headers.get("Location"), "https://www.thetradehq.com/courses?ref=test");
