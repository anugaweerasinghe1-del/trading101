import { isClientFallbackRoute } from "../src/lib/clientFallbackRoutes";

/**
 * Cloudflare Pages dynamic SPA fallback for explicitly listed client routes.
 * Prerendered routes take priority; unknown routes stay 404 + noindex.
 */
type PagesContext = {
  request: Request;
  env: { ASSETS: { fetch(input: Request): Promise<Response> } };
};
export async function onRequestGet({ request, env }: PagesContext): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname.replace(/\/+$/, "") || "/";
  const staticResponse = await env.ASSETS.fetch(new Request(new URL(pathname + "/", url)));
  if (staticResponse.ok && staticResponse.headers.get("content-type")?.includes("text/html")) {
    const html = await staticResponse.text();
    const canonical = '<link rel="canonical" href="https://www.thetradehq.com' + pathname + '"';
    if (html.includes(canonical)) return new Response(html, staticResponse);
  }
  const shellResponse = await env.ASSETS.fetch(new Request(new URL("/app-shell", url)));
  if (!shellResponse.ok) {
    return new Response("Site temporarily unavailable", {
      status: 503, headers: { "Cache-Control": "no-store" },
    });
  }
  return new Response(await shellResponse.text(), {
    status: isClientFallbackRoute(pathname) ? 200 : 404,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, follow",
    },
  });
}
