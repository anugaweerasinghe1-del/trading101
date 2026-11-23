import { RETIRED_MEDIA_PATHS } from "../../scripts/retired-media.mjs";

type Context = {
  request: Request;
  env: { ASSETS: { fetch(request: Request): Promise<Response> } };
};

// Pages can retain old fingerprinted files even after a build stops emitting
// them. Explicit retirement prevents these replaced designs being served.
export async function onRequest({ request, env }: Context): Promise<Response> {
  if (RETIRED_MEDIA_PATHS.includes(new URL(request.url).pathname)) {
    return new Response(request.method === "HEAD" ? null : "This media asset has been retired.", {
      status: 410,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex, nofollow",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }
  return env.ASSETS.fetch(request);
}
