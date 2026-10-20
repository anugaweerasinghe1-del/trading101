/**
 * Read-only production sitemap / page audit.
 * No account sessions, mutations, AdSense calls, browser automation, or paid APIs.
 * HTTP observations are not proof of subjective originality or hydrated UX.
 *
 * Usage: node scripts/audit-live-sitemap.mjs [--report-only]
 */
import { writeFileSync } from "node:fs";

const ORIGIN = "https://www.thetradehq.com";
const reportOnly = process.argv.includes("--report-only");
const now = new Date().toISOString();
const maxConcurrency = 4;

function attr(tag, name) {
  const m = tag.match(new RegExp("(?:^|\\s)" + name + "\\s*=\\s*(?:\"([^\"]*)\"|'([^']*)'|([^\\s>]+))", "i"));
  return m ? (m[1] ?? m[2] ?? m[3] ?? "") : "";
}
function findTag(html, tagName, attrName, attrValue) {
  return [...html.matchAll(new RegExp("<" + tagName + "\\b[^>]*>", "gi"))]
    .map(m => m[0]).find(t => attr(t, attrName).toLowerCase() === attrValue) ?? "";
}
function cleanText(html) {
  return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, " ")
    .replace(/<[^>]+>/g, " ").replace(/&(?:nbsp|amp|lt|gt|quot|#\d+);/gi, " ")
    .replace(/\s+/g, " ").trim();
}
async function get(url) {
  let last;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": "TradeHQ-ReadOnly-Publisher-Audit/1.0", "Accept": "text/html,application/xml;q=0.9,*/*;q=0.5", "Cache-Control": "no-cache" },
        signal: AbortSignal.timeout(18000),
        redirect: "follow",
      });
      if ((response.status === 429 || response.status >= 500) && attempt < 3) {
        last = Error("Retryable HTTP " + response.status);
        await new Promise(r => setTimeout(r, 1000 * attempt));
        continue;
      }
      return { response, text: await response.text() };
    } catch (error) {
      last = error;
      if (attempt < 3) await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }
  throw last;
}
function sameCanonical(expected, actual) {
  try {
    const a = new URL(expected), b = new URL(actual);
    return a.origin === b.origin &&
      a.pathname.replace(/\/+$/, "") === b.pathname.replace(/\/+$/, "") &&
      !b.search && !b.hash;
  } catch { return false; }
}
const result = { checkedAt: now, sitemap: ORIGIN + "/sitemap.xml", count: 0, pages: [], problems: [], warnings: [], limits: [
  "HTML, metadata, and content observations only; not hydrated browser interaction",
  "Word counts are heuristics, not a Google minimum or proof of quality",
  "No claim to know Google's private review outcome",
] };

try {
  const { response: sitemapResponse, text: xml } = await get(result.sitemap);
  if (!sitemapResponse.ok || !xml.includes("<urlset")) throw Error("Sitemap unavailable or invalid: " + sitemapResponse.status);
  const urls = [...xml.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/gi)]
    .map(m => m[1].replace(/&amp;/g, "&").trim());
  if (!urls.length) throw Error("Sitemap contains no URL locations");
  if (urls.length !== new Set(urls).size) result.problems.push({ type: "duplicate-sitemap-url", count: urls.length - new Set(urls).size });
  for (const url of urls) {
    const parsed = new URL(url);
    if (parsed.origin !== ORIGIN || parsed.search || parsed.hash)
      result.problems.push({ type: "invalid-sitemap-location", url });
  }
  result.count = urls.length;
  console.log("LIVE_SITEMAP_URL_COUNT " + urls.length);
  let cursor = 0;
  async function worker() {
    while (cursor < urls.length) {
      const index = cursor++, url = urls[index];
      const page = { index: index + 1, url, status: null, words: 0, errors: [], warnings: [], title: "", canonical: "", h1Count: 0 };
      try {
        const { response, text: html } = await get(url);
        page.status = response.status;
        page.finalUrl = response.url;
        const contentType = response.headers.get("content-type") ?? "";
        if (response.status !== 200) page.errors.push("unexpected-http-status:" + response.status);
        if (!contentType.toLowerCase().includes("text/html")) page.errors.push("non-html-response:" + contentType);
        if (new URL(response.url).origin !== ORIGIN) page.errors.push("cross-origin-redirect");
        const titleMatch = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
        page.title = cleanText(titleMatch?.[1] ?? "");
        if (page.title.length < 8) page.errors.push("missing-or-uninformative-title");
        if (/loading the interactive experience|page not found|temporarily unavailable/i.test(page.title))
          page.errors.push("placeholder-title");
        const canonicalTag = findTag(html, "link", "rel", "canonical");
        page.canonical = attr(canonicalTag, "href");
        if (!sameCanonical(url, page.canonical)) page.errors.push("canonical-mismatch:" + page.canonical);
        const robotsTag = findTag(html, "meta", "name", "robots");
        const robots = attr(robotsTag, "content");
        if (/noindex/i.test(robots)) page.errors.push("sitemap-page-noindex");
        const description = attr(findTag(html, "meta", "name", "description"), "content");
        if (description.length < 35) page.warnings.push("short-or-missing-meta-description");
        page.h1Count = [...html.matchAll(/<h1\b/gi)].length;
        if (page.h1Count !== 1) page.errors.push("unexpected-h1-count:" + page.h1Count);
        const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
        if (!main) page.errors.push("no-main-landmark");
        page.words = cleanText(main?.[1] ?? "").split(/\s+/).filter(Boolean).length;
        if (page.words < 160) page.warnings.push("limited-initial-main-content:" + page.words);
        if (/error loading|cannot load content|lorem ipsum|under construction/i.test(cleanText(main?.[1] ?? "").slice(0, 1800)))
          page.warnings.push("possible-visible-error-or-placeholder-copy");
      } catch (error) { page.errors.push("fetch-error:" + String(error?.message ?? error).slice(0, 250)); }
      result.pages[index] = page;
      for (const error of page.errors) result.problems.push({ url, type: error });
      for (const warning of page.warnings) result.warnings.push({ url, type: warning });
      console.log(JSON.stringify({ page: page.index, url: new URL(url).pathname, status: page.status, words: page.words, issues: page.errors, warnings: page.warnings }));
    }
  }
  await Promise.all(Array.from({ length: Math.min(maxConcurrency, urls.length) }, () => worker()));
  const byTitle = new Map();
  for (const page of result.pages) {
    if (!page.title) continue;
    const key = page.title.toLowerCase();
    byTitle.set(key, [...(byTitle.get(key) ?? []), page.url]);
  }
  for (const [title, matches] of byTitle) if (matches.length > 1)
    result.warnings.push({ type: "duplicate-page-titles", title, urls: matches });
} catch (error) {
  result.problems.push({ type: "sitemap-audit-blocked", detail: String(error?.message ?? error) });
}

writeFileSync("adsense-live-sitemap-audit.json", JSON.stringify(result, null, 2) + "\n");
console.log("AUDIT_SUMMARY " + JSON.stringify({
  sitemapCount: result.count, checked: result.pages.filter(Boolean).length,
  failures: result.problems.length, warnings: result.warnings.length,
  byProblem: Object.entries(result.problems.reduce((a, p) => { const k = String(p.type).split(":")[0]; a[k] = (a[k] ?? 0) + 1; return a; }, {})),
  report: "adsense-live-sitemap-audit.json"
}));
if (!reportOnly && result.problems.length) process.exitCode = 1;
