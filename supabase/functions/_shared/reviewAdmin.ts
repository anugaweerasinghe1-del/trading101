export interface ReviewAdminStore {
  list: () => Promise<unknown[]>;
  update: (id: string, patch: Record<string, unknown>, state: "active" | "deleted") => Promise<boolean>;
}
export function createReviewAdminHandler(options: {
  getKey: () => string | undefined;
  rateLimit: (req: Request) => Promise<boolean>;
  getStore: () => ReviewAdminStore;
}) {
  const headers = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-key", "Access-Control-Allow-Methods": "POST, OPTIONS", "Content-Type": "application/json" };
  const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });
  return async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") return new Response(null, { headers });
    if (req.method !== "POST") return response({ error: "Method not allowed" }, 405);
    // Shared server-side and IP-scoped budgets protect the key even when the
    // request's forwarded IP is forged. Any limiter outage fails closed.
    try {
      if (!await options.rateLimit(req)) return response({ error: "Too many attempts" }, 429);
    } catch { return response({ error: "Administrator verification is temporarily unavailable" }, 503); }
    const master = options.getKey(), supplied = req.headers.get("x-admin-key");
    if (!master || !supplied || master.length !== supplied.length) return response({ error: "Unauthorized" }, 401);
    let mismatch = 0;
    for (let i = 0; i < master.length; i++) mismatch |= master.charCodeAt(i) ^ supplied.charCodeAt(i);
    if (mismatch !== 0) return response({ error: "Unauthorized" }, 401);
    let body: Record<string, unknown>;
    try {
      const raw = await req.text();
      if (raw.length > 12000) return response({ error: "Request too large" }, 413);
      body = JSON.parse(raw);
      if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error();
    } catch { return response({ error: "Invalid request" }, 400); }
    try {
      if (body.action === "list") return response({ data: await options.getStore().list() });
      if (!["update", "reply", "delete", "restore"].includes(String(body.action))) return response({ error: "Unknown action" }, 400);
      if (typeof body.id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.id)) return response({ error: "Invalid review ID" }, 400);
      const now = new Date().toISOString();
      const patch: Record<string, unknown> = { updated_at: now };
      if (body.action === "reply") {
        if (typeof body.reply !== "string" || body.reply.trim().length > 2000) return response({ error: "Reply must be at most 2,000 characters" }, 400);
        patch.owner_reply = body.reply.trim() || null;
        patch.owner_reply_updated_at = patch.owner_reply ? now : null;
      } else if (body.action === "delete") patch.deleted_at = now;
      else if (body.action === "restore") patch.deleted_at = null;
      else {
        const source = body.patch as Record<string, unknown> | undefined;
        if (!source || typeof source !== "object" || Array.isArray(source)) return response({ error: "Invalid changes" }, 400);
        if (source.content !== undefined) {
          if (typeof source.content !== "string" || source.content.trim().length < 5 || source.content.trim().length > 1000) return response({ error: "Review must be 5–1000 characters" }, 400);
          patch.content = source.content.trim();
        }
        if (source.name !== undefined) {
          if (typeof source.name !== "string" || source.name.trim().length > 60) return response({ error: "Name must be at most 60 characters" }, 400);
          patch.name = source.name.trim() || null;
        }
        if (source.rating !== undefined) {
          if (typeof source.rating !== "number" || !Number.isInteger(source.rating) || source.rating < 1 || source.rating > 5) return response({ error: "Rating must be 1–5" }, 400);
          patch.rating = source.rating;
        }
        for (const field of ["is_visible", "is_featured"]) if (typeof source[field] === "boolean") patch[field] = source[field];
      }
      const found = await options.getStore().update(body.id, patch, body.action === "restore" ? "deleted" : "active");
      return found ? response({ ok: true }) : response({ error: "Review is unavailable" }, 404);
    } catch { return response({ error: "Could not update reviews. Please try again." }, 500); }
  };
}
