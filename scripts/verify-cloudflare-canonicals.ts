import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { uniqueRoutes, DOMAIN } from "./routes";
import { onRequestGet } from "../functions/[[path]]";

const routes = uniqueRoutes();
for (const route of routes.filter(route => route.path !== "/")) {
  assert.ok(existsSync(`dist${route.path}.html`), route.path + ": missing flat HTML");
  assert.ok(!existsSync(`dist${route.path}/index.html`), route.path + ": folder index would force wrong slash redirect");
  const html = readFileSync(`dist${route.path}.html`, "utf8");
  assert.ok(html.includes(`rel="canonical" href="${DOMAIN}${route.path}"`), route.path);
  if (!route.noindex) assert.ok(existsSync(`dist/publisher-notes${route.path}/index.json`), "Do not flatten navigation payloads");
}
assert.ok(existsSync("dist/index.html") && existsSync("dist/404.html"));
const env = { ASSETS: { async fetch(request: Request) {
  const path = new URL(request.url).pathname;
  const file = path === "/" ? "dist/index.html" : `dist${path}.html`;
  return existsSync(file) ? new Response(readFileSync(file), { headers: { "Content-Type": "text/html" } }) : new Response("Missing", { status: 404 });
} } };
for (const route of routes.filter(route => route.path !== "/")) {
  const response = await onRequestGet({ request: new Request(DOMAIN + route.path), env });
  assert.equal(response.status, 200, route.path + ": static content preserved");
  const slash = await onRequestGet({ request: new Request(DOMAIN + route.path + "/?ref=inspection"), env });
  assert.equal(slash.status, 308);
  assert.equal(slash.headers.get("Location"), DOMAIN + route.path + "?ref=inspection");
}
const preview = await onRequestGet({ request: new Request("https://preview.tradehq-preview.pages.dev/trade/btc"), env });
assert.equal(preview.headers.get("X-Robots-Tag"), "noindex", "Functions must protect preview mirrors too");
const missing = await onRequestGet({ request: new Request(DOMAIN + "/missing-for-inspection"), env });
assert.equal(missing.status, 404); assert.match(missing.headers.get("X-Robots-Tag") || "", /noindex/);
assert.equal(JSON.parse(readFileSync("vercel.json", "utf8")).trailingSlash, false);
console.log(`PASS Cloudflare flat output, ${routes.length - 1} served route fixtures, slash redirects with query preservation, preview noindex, 404 and Vercel slash setting. Real Pages preview still required.`);
