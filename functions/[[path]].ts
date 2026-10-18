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
  if (url.pathname !== pathname) {
    url.pathname = pathname;
    return Response.redirect(url.href, 308);
  }
  const staticResponse = await env.ASSETS.fetch(new Request(new URL(pathname, url)));
  if (staticResponse.ok && staticResponse.headers.get("content-type")?.includes("text/html")) {
    const html = await staticResponse.text();
    const canonical = '<link rel="canonical" href="https://www.thetradehq.com' + pathname + '"';
    if (html.includes(canonical)) {
      const headers = new Headers(staticResponse.headers);
      if (url.hostname.endsWith(".pages.dev")) headers.set("X-Robots-Tag", "noindex");
      return new Response(html, { status: 200, headers });
    }
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
