import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.1";
import { createReviewAdminHandler } from "../_shared/reviewAdmin.ts";
import { allow, clientIp } from "../_shared/rateLimit.ts";

Deno.serve(createReviewAdminHandler({
  getKey: () => Deno.env.get("ADMIN_MASTER_KEY"),
  rateLimit: async req => await allow("review-admin-global", "review-admin-global", 60, 120)
    && await allow("review-admin:" + clientIp(req), "review-admin-ip", 60, 30),
  getStore: () => {
    const client = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    return {
      async list() {
        const { data, error } = await client.from("reviews")
          .select("id,name,content,rating,is_visible,is_featured,created_at,owner_reply,owner_reply_updated_at,deleted_at")
          .order("created_at", { ascending: false }).limit(1000);
        if (error) throw error;
        return data ?? [];
      },
      async update(id, patch, state) {
        let query = client.from("reviews").update(patch).eq("id", id);
        query = state === "deleted" ? query.not("deleted_at", "is", null) : query.is("deleted_at", null);
        const { data, error } = await query.select("id").maybeSingle();
        if (error) throw error;
        return !!data;
      },
    };
  },
}));
