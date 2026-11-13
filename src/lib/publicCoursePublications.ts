import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "@/integrations/supabase/config";

const reader = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export function readPublicCoursePublications({ since, signal }: { since?: string; signal?: AbortSignal } = {}) {
  let query = reader.from("published_courses").select("slug,published_at,title:document->>title");
  if (since) query = query.gte("published_at", since);
  const ordered = query.order("published_at", { ascending: false })
    .order("slug").limit(since ? 20 : 40);
  return signal ? ordered.abortSignal(signal) : ordered;
}
