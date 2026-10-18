/**
 * Post-build SSG prerender.
 *
 * Reads dist/index.html (Vite's compiled shell) and writes one static
 * HTML file per route under dist/<route>/index.html, with per-route:
 *   - <title>, <meta name="description">, canonical, og:*, twitter:*
 *   - <meta name="robots"> (noindex for low-value programmatic routes)
 *   - a full, route-specific article inside #root — real headings,
 *     paragraphs, lists and internal links — for visitors with or without JavaScript. The same component
 *     remains visible below the interactive application after React starts.
 *
 * Hosting serves the file on the filesystem first, so /wiki/macd resolves
 * to dist/wiki/macd/index.html — no server, no runtime SSR.
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { uniqueRoutes, DOMAIN, type RouteMeta } from "./routes";
import { buildContentMap, type PageContent } from "./content";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PublisherNotes, type PublisherPage } from "../src/components/PublisherNotes";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(__dirname, "..", "dist");

// Word counts are diagnostics, not a reason to add filler to an authored page.

function esc(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const NAV = [
  { href: "/", label: "Home" },
  { href: "/markets", label: "Markets" },
  { href: "/trade", label: "Practice desk" },
  { href: "/courses", label: "Courses" },
  { href: "/learn", label: "Learn" },
  { href: "/wiki", label: "Glossary" },
  { href: "/how-to-trade", label: "Asset guides" },
  { href: "/strategy", label: "Strategies" },
  { href: "/compare", label: "Comparisons" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

const FOOTER = [
  { href: "/about", label: "About TradeHQ" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy", label: "Privacy policy" },
  { href: "/terms", label: "Terms of service" },
  { href: "/roadmap", label: "Roadmap" },
  { href: "/learn/country", label: "Country guides" },
];

function linkList(links: { href: string; label: string }[]): string {
  return links
    .map((l) => `<li><a href="${esc(l.href)}" style="color:#00E396;">${esc(l.label)}</a></li>`)
    .join("");
}

function renderBody(r: RouteMeta, content: PageContent | undefined): string {
  const page = publisherPage(r, content);
  const notes = page ? renderToStaticMarkup(React.createElement(PublisherNotes, { page })) : "";
  return `<div id="prerender-seo" style="background:#0A0A0F;color:#e6e7ea;font-family:Inter,system-ui,sans-serif;padding:24px;">
    <nav aria-label="Main"><ul style="display:flex;flex-wrap:wrap;gap:14px;list-style:none;padding:0;">${linkList(NAV)}</ul></nav>
    <main><h1>${esc(r.h1)}</h1>${notes || `<p>${esc(r.summary)}</p>`}</main>
    <footer><ul style="display:flex;flex-wrap:wrap;gap:14px;list-style:none;padding:0;">${linkList(FOOTER)}</ul></footer>
  </div>`;
}

function publisherPage(r: RouteMeta, content: PageContent | undefined): PublisherPage | null {
  if (r.noindex || !content) return null;
  return { path: r.path, heading: r.h1, summary: r.summary, ...content };
}

function wordCount(html: string): number {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean).length;
}

function renderHead(r: RouteMeta, template: string, body: string, page: PublisherPage | null): string {
  const url = `${DOMAIN}${r.path === "/" ? "/" : r.path}`;
  const title = esc(r.title);
  const desc = esc(r.description);
  const robots = r.noindex
    ? "noindex, follow"
    : "index, follow, max-image-preview:large, max-snippet:-1";

  let html = template;

  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${title}</title>`);

  html = html.replace(
    /<meta\s[^>]*name=["']description["'][^>]*>/i,
    `<meta data-static-head name="description" content="${desc}" />`
  );

  // robots — replace existing, else inject
  if (/<meta\s[^>]*name=["']robots["'][^>]*>/i.test(html)) {
    html = html.replace(
      /<meta\s[^>]*name=["']robots["'][^>]*>/i,
      `<meta data-static-head name="robots" content="${robots}" />`
    );
  } else {
    html = html.replace(/<\/head>/i, `  <meta data-static-head name="robots" content="${robots}" />\n  </head>`);
  }

  html = html.replace(/<link\s+rel=["']canonical["'][^>]*>\s*/gi, "");
  html = html.replace(/<\/head>/i, `  <link rel="canonical" href="${url}" data-static-head />\n  </head>`);

  html = html.replace(
    /<meta\s[^>]*property=["']og:url["'][^>]*>/i,
    `<meta data-static-head property="og:url" content="${url}" />`
  );
  html = html.replace(
    /<meta\s[^>]*property=["']og:title["'][^>]*>/i,
    `<meta data-static-head property="og:title" content="${title}" />`
  );
  html = html.replace(
    /<meta\s[^>]*property=["']og:description["'][^>]*>/i,
    `<meta data-static-head property="og:description" content="${desc}" />`
  );
  html = html.replace(
    /<meta\s[^>]*name=["']twitter:title["'][^>]*>/i,
    `<meta data-static-head name="twitter:title" content="${title}" />`
  );
  html = html.replace(
    /<meta\s[^>]*name=["']twitter:description["'][^>]*>/i,
    `<meta data-static-head name="twitter:description" content="${desc}" />`
  );

  html = html.replace(/<div\s+id=["']root["']><\/div>/i, `<div id="root">${body}</div>`);

  if (page) {
    const json = JSON.stringify(page).replace(/</g, "\\u003c");
    html = html.replace(/<\/body>/i, `<script id="publisher-notes-data" type="application/json">${json}</script></body>`);
  }
  return html;
}

async function main() {
  const shellPath = path.join(DIST, "index.html");
  if (!fs.existsSync(shellPath)) {
    console.error(`✖ dist/index.html not found — did \`vite build\` run?`);
    process.exit(1);
  }
  const shell = fs.readFileSync(shellPath, "utf-8");
  const contentMap = await buildContentMap();

  const routes = uniqueRoutes();
  const canonicals = new Map<string, string>();
  const bodyHashes = new Map<string, string>();

  const missing: string[] = [];
  // Non-manifest routes must not inherit the indexable homepage fallback.
  // This shell also supports account/profile routes without indexing private UI.
  const fallback = shell
    .replace(/<title>[\s\S]*?<\/title>/i, '<title>TradeHQ requested page</title>')
    .replace(/<meta\s[^>]*name=["']robots["'][^>]*>/gi, '')
    .replace(/<link\s[^>]*rel=["']canonical["'][^>]*>/gi, '')
    .replace(/<script\s[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<\/head>/i, '<meta data-static-head name="robots" content="noindex, follow" /></head>');
  fs.writeFileSync(path.join(DIST, "app-shell.html"), fallback, "utf-8");

  let written = 0;

  for (const r of routes) {
    const content = contentMap.get(r.path);
    if (!content && !r.noindex) missing.push(r.path);

    const body = renderBody(r, content);
    const page = publisherPage(r, content);
    if (page) {
      const jsonDir = path.join(DIST, "publisher-notes", r.path.slice(1));
      fs.mkdirSync(jsonDir, { recursive: true });
      fs.writeFileSync(path.join(jsonDir, "index.json"), JSON.stringify(page));
    }
    const words = wordCount(body);


    const html = renderHead(r, shell, body, page);

    const outDir = r.path === "/" ? DIST : path.join(DIST, r.path);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, "index.html"), html, "utf-8");
    written++;

    const canonical = `${DOMAIN}${r.path === "/" ? "/" : r.path}`;
    if (canonicals.has(canonical)) {
      console.error(`✖ Duplicate canonical: ${canonical} from ${canonicals.get(canonical)} and ${r.path}`);
      process.exit(1);
    }
    canonicals.set(canonical, r.path);

    if (!r.noindex) {
      const key = body.replace(/\s+/g, " ").trim();
      if (bodyHashes.has(key)) {
        console.error(`✖ Duplicate static body: ${r.path} is identical to ${bodyHashes.get(key)}`);
        process.exit(1);
      }
      bodyHashes.set(key, r.path);
    }
  }

  // Guard: forbidden legacy currency literals in prerendered output.
  // Legacy starting-balance wording only — "$10,000" as a generic position size is fine.
  const forbidden = ["$10K", "$10,000 virtual", "$10,000 in virtual", "$10,000 practice"];
  for (const r of routes) {
    const filePath = r.path === "/" ? path.join(DIST, "index.html") : path.join(DIST, r.path, "index.html");
    const body = fs.readFileSync(filePath, "utf-8");
    for (const bad of forbidden) {
      if (body.includes(bad)) {
        console.error(`✖ Forbidden legacy currency literal "${bad}" found in prerendered ${r.path}`);
        process.exit(1);
      }
    }
  }

  const indexable = routes.filter((r) => !r.noindex).length;
  console.log(`✅ Prerendered ${written} routes (${indexable} indexable, ${written - indexable} noindex)`);
  console.log(`✅ Canonical uniqueness confirmed (${canonicals.size} unique URLs)`);

  if (missing.length) {
    console.error(`✖ ${missing.length} indexable routes have no static content: ${missing.slice(0, 12).join(", ")}`);
    process.exit(1);
  }
  console.log("✅ Every indexable route has authored content; no arbitrary minimum word count");
}

main();
