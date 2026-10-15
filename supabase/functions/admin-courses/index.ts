import { createClient } from "npm:@supabase/supabase-js@2.75.1";
import { createCourseAdminHandler } from "../_shared/courseAdmin.ts";
import { validateBatch } from "../_shared/dailyPractice.ts";
import { validateCourseDocument } from "../_shared/courseDocument.ts";
import { clientIp, allow } from "../_shared/rateLimit.ts";

const client = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
async function rpc(name: string, args: Record<string, unknown>) {
  const { data, error } = await client.rpc(name, args);
  if (error) throw new Error(error.message);
  return data;
}
Deno.serve(createCourseAdminHandler({
  getKey: () => Deno.env.get("ADMIN_MASTER_KEY"),
  rateLimit: async req => await allow("course-admin-global", "course-admin-global", 300, 60)
    && await allow("course-admin:" + clientIp(req), "course-admin", 300, 30),
  store: {
    async daily(action, body) {
      if (action === "daily-list") {
        const fields = body.summary === true ? "id,effective_from,revision,status,updated_at" : "id,effective_from,revision,status,document,research,updated_at";
        const { data, error } = await client.from("daily_practice_drafts").select(fields).order("effective_from", { ascending: false }).limit(24);
        if (error) throw error; return data ?? [];
      }
      if (action === "daily-status") return rpc("daily_practice_status", {});
      if (action === "daily-configure") return rpc("configure_daily_practice", { p_enabled: body.enabled });
      if (action === "daily-generate") return rpc("request_daily_practice", { p_manual: true });
      if (action === "daily-save") return rpc("save_daily_practice", { p_id: body.id, p_revision: body.revision, p_document: body.document });
      if (action === "daily-publish") {
        const { data, error } = await client.from("daily_practice_drafts").select("document").eq("id", body.id).single();
        if (error) throw error;
        if (!validateBatch(data.document)) throw new Error("Daily bank is incomplete");
        return rpc("publish_daily_practice", { p_id: body.id, p_revision: body.revision, p_reviewer: body.reviewer });
      }
      return rpc("reject_daily_practice", { p_id: body.id, p_revision: body.revision });
    },
    settings: () => rpc("course_generation_status", {}),
    configure: settings => rpc("configure_course_generation", { p_settings: settings }),
    run: () => rpc("request_course_generation", { p_force: true }),
    async list(summary = false) {
      const fields = summary ? "id,status,revision,published_revision,created_at,updated_at,reviewed_at" : "id,status,revision,published_revision,document,research,created_at,updated_at,reviewed_at";
      const { data, error } = await client.from("course_drafts")
        .select(fields)
        .order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      return data ?? [];
    },
    save: (id, revision, document) => rpc("save_course_draft", { p_id: id, p_revision: revision, p_document: document }),
    async publish(id, revision, reviewer) {
      const { data, error } = await client.from("course_drafts").select("document").eq("id", id).single();
      if (error) throw error;
      const errors = validateCourseDocument(data.document, true);
      if (errors.length) throw new Error("Course is incomplete: " + errors.join(" "));
      return rpc("publish_course_draft", { p_id: id, p_revision: revision, p_reviewer: reviewer });
    },
    reject: (id, revision) => rpc("reject_course_draft", { p_id: id, p_revision: revision }),
  },
}));
