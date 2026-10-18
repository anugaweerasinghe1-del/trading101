import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { onRequestGet } from "../functions/[[path]]";
import { ASSETS } from "../src/lib/assets";
import { uniqueRoutes } from "./routes";
const config = JSON.parse(readFileSync("vercel.json", "utf8"));
assert.ok(!config.rewrites.some(rule => rule.source === "/(.*)"), "Unknown Vercel URLs must not receive a successful app-shell rewrite");
const manifest = new Set(uniqueRoutes().map(route => route.path));
const env = { ASSETS: { async fetch(request: Request) {
  const pathname = new URL(request.url).pathname.replace(/\/$/, "");
  const file = pathname === "/app-shell" ? "dist/app-shell.html" : (existsSync(`dist${pathname}.html`) ? `dist${pathname}.html` : `dist${pathname}/index.html`);
  return existsSync(file) ? new Response(readFileSync(file, "utf8"), { headers: { "content-type": "text/html" } }) : new Response("Missing", { status: 404 });
} } };
for (const asset of ASSETS) {
  const path = "/trade/" + asset.id;
  const response = await onRequestGet({ request: new Request("https://example.test" + path), env });
  assert.equal(response.status, 200, `Preserve catalog asset ${path}`);
  if (!manifest.has(path)) assert.ok(config.rewrites.some(rule => rule.source === path && rule.destination === "/app-shell.html"));
}
for (const path of ["/auth", "/reset-password", "/admin", "/admin/ai", "/trader/me", "/challenge/example"]) {
  assert.equal((await onRequestGet({ request: new Request("https://example.test" + path), env })).status, 200, path);
}
for (const path of ["/trade/not-a-real-asset", "/learn/article/not-a-real-article", "/admin/not-a-route", "/audit-missing-preview-route"]) {
  const response = await onRequestGet({ request: new Request("https://example.test" + path), env });
  assert.equal(response.status, 404, path);
  assert.match(response.headers.get("x-robots-tag")!, /noindex/);
}
for (const redirect of config.redirects) assert.ok(manifest.has(redirect.destination), redirect.destination);
console.log("PASS real 404 fallbacks, preserved 170 catalog assets/client states and valid legacy redirects");
