/**
 * Post-build SEO verifier — asserts that raw (pre-JS) HTML of key
 * routes contains a unique title, description, self-referencing
 * canonical, non-empty <h1>, and no leaked legacy currency literals.
 *
 * Prints a per-route Markdown checklist and exits non-zero on failure.
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const DIST = resolve(process.cwd(), "dist");
const DOMAIN = "https://www.thetradehq.com";

// M19: unknown/utility URLs must never inherit the indexable homepage fallback.
{
  const shell = readFileSync(resolve(DIST, "app-shell.html"), "utf8");
  const hosting = JSON.parse(readFileSync(resolve(process.cwd(), "vercel.json"), "utf8"));
  if (!/<meta[^>]+name="robots"[^>]+content="noindex, follow"/.test(shell)
      || /<link[^>]+rel="canonical"/.test(shell)
      || shell.includes("prerender-seo")
      || shell.includes("application/ld+json")
      || hosting.rewrites.at(-1).destination !== "/app-shell.html") {
    console.error("✗ Non-manifest fallback must be a noindex shell without homepage content/canonical/schema");
    process.exit(1);
  }
}

// C03/C04 guard: internal QA/audit artifacts must never ship publicly.
{
  const { readdirSync } = await import("fs");
  const INTERNAL = [/turbo/i, /_report\.(md|json|csv)$/i, /^list_of_urls/i, /og_image_status/i, /rich_results/i, /audit[-_].*\.(md|csv|json)$/i, /owner[-_]approval/i];
  const leaked = existsSync(DIST) ? readdirSync(DIST).filter((f) => INTERNAL.some((r) => r.test(f))) : [];
  if (leaked.length) {
    console.error("✗ Internal QA artifacts found in public build:", leaked.join(", "));
    process.exit(1);
  }
}

const routes = [
  "/",
  "/markets",
  "/wiki/macd",
  "/wiki/bollinger-band-squeeze",
  "/learn-trading-guide",
  "/privacy",
  "/terms",
  "/about",
  "/newsletter",
  "/practice",
];

function pick(html, re) {
  const m = html.match(re);
  return m ? m[1].trim() : null;
}

const seenTitles = new Set();
const seenDescs = new Set();
const rows = [];
let fail = false;

for (const route of routes) {
  const filePath = route === "/" ? `${DIST}/index.html` : `${DIST}${route}/index.html`;
  if (!existsSync(filePath)) {
    rows.push({ route, title: "❌ MISSING FILE", desc: "-", canonical: "-", h1: "-", noBadCurrency: "-", ok: false });
    fail = true;
    continue;
  }

  const html = readFileSync(filePath, "utf-8");
  const title = pick(html, /<title>([\s\S]*?)<\/title>/i);
  const desc = pick(html, /<meta\s[^>]*name=["']description["']\s+content=["']([^"']+)["']/i);
  const canonical = pick(html, /<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
  const h1 = pick(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i);

  const expectedCanonical = `${DOMAIN}${route === "/" ? "/" : route}`;
  const canonicalOk = canonical === expectedCanonical;
  const titleUnique = title && !seenTitles.has(title);
  const descUnique = desc && !seenDescs.has(desc);
  const h1Ok = !!(h1 && h1.replace(/<[^>]+>/g, "").trim().length > 0);
  const noBad = !html.includes("$10K") && !html.includes("$10,000 virtual") && !html.includes("$10,000 in virtual");

  if (title) seenTitles.add(title);
  if (desc) seenDescs.add(desc);

  const ok = titleUnique && descUnique && canonicalOk && h1Ok && noBad;
  if (!ok) fail = true;

  rows.push({
    route,
    title: titleUnique ? "✅ unique" : "❌ duplicate/missing",
    desc: descUnique ? "✅ unique" : "❌ duplicate/missing",
    canonical: canonicalOk ? "✅ self" : `❌ ${canonical ?? "missing"}`,
    h1: h1Ok ? "✅" : "❌",
    noBadCurrency: noBad ? "✅" : "❌ found $10K",
    ok,
  });
}

console.log("\n| Route | Title | Description | Canonical | H1 | No $10K |");
console.log("|-------|-------|-------------|-----------|----|---------|");
for (const r of rows) {
  console.log(`| \`${r.route}\` | ${r.title} | ${r.desc} | ${r.canonical} | ${r.h1} | ${r.noBadCurrency} |`);
}

// Sitemap presence check
const sitemap = existsSync(`${DIST}/sitemap.xml`) ? readFileSync(`${DIST}/sitemap.xml`, "utf-8") : "";
console.log("\n**Sitemap presence:**");
for (const r of routes) {
  const url = `${DOMAIN}${r === "/" ? "/" : r}`;
  const present = sitemap.includes(`<loc>${url}</loc>`);
  console.log(`- \`${r}\` → ${present ? "✅ in sitemap" : "❌ MISSING"}`);
  if (!present) fail = true;
}

// Stale-domain guard: no legacy host may survive anywhere in the build output.
const STALE_HOSTS = ["tradinghq.vercel.app", "lovable.app"];
const staleHits = [];
for (const route of routes) {
  const filePath = route === "/" ? `${DIST}/index.html` : `${DIST}${route}/index.html`;
  if (!existsSync(filePath)) continue;
  const html = readFileSync(filePath, "utf-8");
  for (const host of STALE_HOSTS) {
    if (html.includes(host)) staleHits.push(`${route} → ${host}`);
  }
}
for (const host of STALE_HOSTS) {
  if (sitemap.includes(host)) staleHits.push(`sitemap.xml → ${host}`);
}
console.log("\n**Stale domain guard:**");
if (staleHits.length) {
  for (const hit of staleHits) console.log(`- ❌ ${hit}`);
  fail = true;
} else {
  console.log(`- ✅ no legacy hosts (${STALE_HOSTS.join(", ")}) in build output`);
}

if (fail) {
  console.error("\n🔴 SEO verification failed");
  process.exit(1);
}
console.log("\n🟢 SEO verification passed");
