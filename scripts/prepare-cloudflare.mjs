/**
 * Prepares Cloudflare Pages preview AFTER Vite's normal prerender build.
 * The real static route HTML remains intact; only selected dynamic URLs
 * invoke Pages Functions. Never rewrite unknown URLs to the SEO homepage.
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";

const dir = resolve(process.cwd(), "dist");
const shellFile = resolve(dir, "app-shell.html");
if (!existsSync(shellFile)) throw new Error("Missing dist/app-shell.html; run npm run build first.");
const shell = readFileSync(shellFile, "utf8");
if (!/name=["']robots["'][^>]*content=["']noindex, follow["']/.test(shell)
  || /<link[^>]+rel=["']canonical["']/.test(shell)) {
  throw new Error("Fallback must be noindex with no canonical.");
}
writeFileSync(resolve(dir, "404.html"), shell, "utf8");

// Pages serves folder/index.html at /folder/ but file.html at /file.
// Our sitemap, React routes and canonical tags all use extensionless URLs
// without a trailing slash. Flatten route indexes AFTER the ordinary build
// checks; keep publisher-notes JSON and the Vercel build layout untouched.
// https://developers.cloudflare.com/pages/configuration/serving-pages/
function flattenRoutes(folder) {
  for (const entry of readdirSync(folder, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name === "publisher-notes") continue;
    const child = resolve(folder, entry.name);
    flattenRoutes(child);
    const index = resolve(child, "index.html");
    if (existsSync(index)) {
      writeFileSync(child + ".html", readFileSync(index));
      unlinkSync(index);
    }
  }
}
flattenRoutes(dir);

// A staging pages.dev *production* deployment is not necessarily a preview URL.
// Make every staging static page explicitly noindex by default. Removing this
// protection requires a deliberate environment flag at owner-approved cutover.
const productionApproved = process.env.TRADEHQ_CLOUDFLARE_LIVE === "1";
// Cloudflare _headers supports host-qualified URL patterns. Keep BOTH the
// main and per-deployment pages.dev mirrors noindex after custom-domain launch.
// Pages Functions do not inherit these rules and must set their own headers.
const pagesDevNoindex =
  "https://:project.pages.dev/*\n  X-Robots-Tag: noindex\n" +
  "https://:version.:project.pages.dev/*\n  X-Robots-Tag: noindex\n";
writeFileSync(resolve(dir, "_headers"), productionApproved
  ? pagesDevNoindex
  : "/*\n  X-Robots-Tag: noindex\n" + pagesDevNoindex, "utf8");
const include = [
  "/auth", "/reset-password", "/admin", "/admin/*",
  "/trader/*", "/trade/*", "/challenge", "/challenge/*",
  "/courses/*", "/course-sitemap.xml", "/learn/article/*"
];
if (include.length > 100 || include.some((x) => x.length > 100)) {
  throw new Error("Cloudflare Pages Functions routing limit exceeded.");
}
writeFileSync(resolve(dir, "_routes.json"),
  JSON.stringify({ version: 1, include, exclude: [] }, null, 2) + "\n");

for (const required of ["index.html", "sitemap.xml", "robots.txt", "ads.txt", "404.html", "app-shell.html"]) {
  if (!existsSync(resolve(dir, required))) throw new Error("Missing Cloudflare output: " + required);
}
console.log("Cloudflare preview prepared: prerendered static routes retained; narrow Functions routing.");
