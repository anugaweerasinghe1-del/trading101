import { validateBatch, validateExercises } from "./dailyPractice.ts";
import { validateCourseDocument } from "./courseDocument.ts";

export interface CourseAdminStore {
  daily?: (action: string, body: Record<string, unknown>) => Promise<unknown>;
  list: (summary?: boolean) => Promise<unknown[]>;
  save: (id: string | null, revision: number | null, document: unknown) => Promise<unknown>;
  publish: (id: string, revision: number, reviewer: string) => Promise<unknown>;
  reject: (id: string, revision: number) => Promise<unknown>;
  settings: () => Promise<unknown>;
  configure: (settings: unknown) => Promise<unknown>;
  run: () => Promise<unknown>;
}
export function createCourseAdminHandler(options: {
  getKey: () => string | undefined; rateLimit: (req: Request) => Promise<boolean>; store: CourseAdminStore;
}) {
  const headers = { "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-key",
    "Access-Control-Allow-Methods": "POST, OPTIONS", "Content-Type": "application/json", "Cache-Control": "no-store" };
  const response = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers });
  return async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") return new Response(null, { headers });
    if (req.method !== "POST") return response({ error: "Method not allowed" }, 405);
    try {
      // Failed keys share a server-side IP budget. Keys never appear in URLs, logs or browser storage.
      if (!await options.rateLimit(req)) return response({ error: "Too many attempts. Please wait a few minutes." }, 429);
      const expected = options.getKey(), supplied = req.headers.get("x-admin-key");
      if (!expected || !supplied || supplied.length !== expected.length) return response({ error: "Incorrect master key." }, 401);
      let mismatch = 0;
      for (let i = 0; i < expected.length; i++) mismatch |= expected.charCodeAt(i) ^ supplied.charCodeAt(i);
      if (mismatch) return response({ error: "Incorrect master key." }, 401);
      const raw = await req.text();
      if (raw.length > 760000) return response({ error: "Document is too large." }, 413);
      let body: Record<string, unknown>;
      try { body = JSON.parse(raw); if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error(); }
      catch { return response({ error: "Invalid request." }, 400); }
      if (typeof body.action === "string" && body.action.startsWith("daily-") && options.store.daily) {
        if (!["daily-list", "daily-status", "daily-configure", "daily-generate", "daily-save", "daily-publish", "daily-reject"].includes(body.action)) return response({ error: "Unknown action." }, 400);
        if (body.action === "daily-configure" && typeof body.enabled !== "boolean") return response({ error: "Invalid settings." }, 400);
        if (["daily-save", "daily-publish", "daily-reject"].includes(body.action)) {
          if (typeof body.id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.id) || !Number.isInteger(body.revision) || Number(body.revision) < 1) return response({ error: "Invalid daily revision." }, 400);
          if (body.action === "daily-save" && (!validateBatch(body.document) || validateExercises(body.document.exercises, 50, 10).length > 0)) return response({ error: "Complete all 50 exercises before saving." }, 400);
          if (body.action === "daily-publish" && (body.reviewed !== true || typeof body.reviewer !== "string" || body.reviewer.trim().length < 2 || body.reviewer.length > 80)) return response({ error: "Confirm your review and enter your name." }, 400);
        }
        return response({ data: await options.store.daily(body.action, body) });
      }
      if (body.action === "list") return response({ data: await options.store.list(body.summary === true) });
      if (body.action === "settings") return response({ data: await options.store.settings() });
      if (body.action === "configure") return response({ data: await options.store.configure(body.settings) });
      if (body.action === "generate") return response({ data: await options.store.run() });
      const id = typeof body.id === "string" && /^[0-9a-f-]{36}$/i.test(body.id) ? body.id : null;
      const revision = Number.isInteger(body.revision) && Number(body.revision) > 0 ? Number(body.revision) : null;
      if (body.action === "save") {
        if (body.id && (!id || !revision)) return response({ error: "Invalid course revision." }, 400);
        const errors = validateCourseDocument(body.document);
        if (errors.length) return response({ error: errors.join(" ") }, 400);
        return response({ data: await options.store.save(id, revision, body.document) });
      }
      if (!id || !revision) return response({ error: "Invalid course revision." }, 400);
      if (body.action === "publish") {
        if (body.reviewed !== true || typeof body.reviewer !== "string" || body.reviewer.trim().length < 2 || body.reviewer.length > 80) {
          return response({ error: "Confirm your review and enter the reviewer's name." }, 400);
        }
        return response({ data: await options.store.publish(id, revision, body.reviewer.trim()) });
      }
      if (body.action === "reject") return response({ data: await options.store.reject(id, revision) });
      return response({ error: "Unknown action." }, 400);
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      const known = ["Course changed", "Course URL", "Published lesson", "Course is incomplete", "Course not found", "Daily bank"];
      return response({ error: known.some(s => message.startsWith(s)) ? message : "Could not save the course. Please retry." }, 409);
    }
  };
}
