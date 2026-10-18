/** Read-only evidence export; runs on a compiled build and never publishes. */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { uniqueRoutes } from "./routes";
import { buildContentMap } from "./content";
import { GLOSSARY_WORKSHEETS } from "../src/lib/glossaryWorksheets";
const content = await buildContentMap();
const inventory = uniqueRoutes().map(route => {
  const file = route.path === "/" ? "dist/index.html" : existsSync(`dist${route.path}.html`) ? `dist${route.path}.html` : `dist${route.path}/index.html`;
  const html = readFileSync(file, "utf8");
  const page = content.get(route.path);
  const embedded = html.match(/<script id="publisher-notes-data" type="application\/json">([\s\S]*?)<\/script>/)?.[1];
  return { ...route, sections: page?.sections || [], links: page?.links || [], publisher: embedded ? JSON.parse(embedded) : null,
    worksheet: route.path.startsWith("/wiki/") ? GLOSSARY_WORKSHEETS[route.path.slice(6)] : undefined,
    initialH1Count: (html.match(/<h1(?:\s|>)/g) || []).length,
    canonical: html.match(/rel="canonical" href="([^"]+)"/)?.[1],
    robots: html.match(/name="robots" content="([^"]+)"/)?.[1] };
});
writeFileSync(process.argv[2] || "/tmp/tradehq-readiness-inventory.json", JSON.stringify(inventory, null, 2));
console.log(`Exported ${inventory.length} route observations; this is not a claim of manual financial review.`);
