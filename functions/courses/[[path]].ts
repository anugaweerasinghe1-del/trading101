/**
 * Cloudflare Pages counterpart of Vercel api/course.ts.
 * Reads ONLY the anonymous published-courses view; no privileged DB keys.
 */
import { renderApprovedCourse } from "../../src/lib/courseHtml.js";
import type { CourseDocument } from "../../supabase/functions/_shared/courseDocument.js";

const SUPABASE_URL = "https://cbdktpjgczhthflspqjb.supabase.co";
const PUBLIC_KEY = "sb_publishable_lmCNfCn4tsB1tD604M49Xw_n4zum_Nr";
type PagesContext = {
  request: Request;
  env: { ASSETS: { fetch(input: Request): Promise<Response> } };
};
function result(message: string, status: number) {
  return new Response(message, {
    status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      ...(status === 503 ? { "Retry-After": "60" } : { "X-Robots-Tag": "noindex" }),
    },
  });
}
function servedStaticHtml(html: string, response: Response, hostname: string) {
  const headers = new Headers(response.headers);
  // Pages Functions do not automatically inherit _headers; protect all pages.dev mirrors.
  if (hostname.endsWith(".pages.dev")) headers.set("X-Robots-Tag", "noindex");
  return new Response(html, { status: 200, headers });
}
export async function onRequestGet({ request, env }: PagesContext): Promise<Response> {
  const url = new URL(request.url);
  if (url.pathname.endsWith("/")) {
    url.pathname = url.pathname.replace(/\/+$/, "");
    return Response.redirect(url.href, 308);
  }
  const parts = url.pathname.split("/").filter(Boolean);
  const valid = (v: string | undefined) => !!v && v.length <= 80 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v);
  // Cloudflare's optional /courses/[[path]] catch-all also matches /courses itself.
  // Serve its prerendered listing directly rather than treating it as a missing course slug.
  if (parts.length === 1 && parts[0] === "courses") {
    const staticResponse = await env.ASSETS.fetch(new Request(new URL("/courses", url)));
    if (staticResponse.ok && staticResponse.headers.get("content-type")?.includes("text/html")) {
      const html = await staticResponse.text();
      if (html.includes('<link rel="canonical" href="https://www.thetradehq.com/courses"')) {
        return servedStaticHtml(html, staticResponse, url.hostname);
      }
    }
    return result("Courses are temporarily unavailable. Please retry.", 503);
  }
  if (parts.length < 2 || parts.length > 3 || parts[0] !== "courses"
    || !valid(parts[1]) || (parts.length === 3 && !valid(parts[2]))) {
    return result("Course not found", 404);
  }
  const path = "/" + parts.join("/");
  // Preserve existing authored courses' exact prerendered HTML and metadata.
  const staticResponse = await env.ASSETS.fetch(new Request(new URL(path, url)));
  if (staticResponse.ok && staticResponse.headers.get("content-type")?.includes("text/html")) {
    const html = await staticResponse.text();
    if (html.includes('<link rel="canonical" href="https://www.thetradehq.com' + path + '"')) {
      return servedStaticHtml(html, staticResponse, url.hostname);
    }
  }
  try {
    const response = await fetch(SUPABASE_URL + "/rest/v1/published_courses?select=document&slug=eq."
      + encodeURIComponent(parts[1]) + "&limit=1", {
      headers: { apikey: PUBLIC_KEY },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error("Published course store unavailable");
    const rows = await response.json() as { document: CourseDocument }[];
    if (!Array.isArray(rows) || rows.length === 0) return result("Course not found", 404);

    const shellResponse = await env.ASSETS.fetch(new Request(new URL("/app-shell", url)));
    if (!shellResponse.ok) throw new Error("Missing application shell");
    const html = renderApprovedCourse(await shellResponse.text(), rows[0].document, parts[2]);
    if (!html) return result("Lesson not found", 404);
    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=0, s-maxage=60",
        ...(url.hostname.endsWith(".pages.dev") ? { "X-Robots-Tag": "noindex" } : {}),
      },
    });
  } catch {
    return result("Courses are temporarily unavailable. Please retry.", 503);
  }
}
