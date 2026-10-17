import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { BookOpen, X } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "@/integrations/supabase/config";
import { readCoursePublicationHistory } from "@/lib/coursePublicationHistory";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

type PublishedCourse = { slug: string; published_at: string; title: string | null };
const STORAGE_KEY = "tradehq-seen-course-publications-v1";
const RECENT_DAYS = 7;
// Published courses arrive only a few times per month; avoid polling every 45 seconds.
const RECHECK_MS = 5 * 60 * 1000;
export function CoursePublicationNotices() {
  const navigate = useNavigate();
  const checking = useRef(false);
  const sessionSeen = useRef(new Set<string>());
  useEffect(() => {
    let active = true;
    const check = async () => {
      if (checking.current || document.visibilityState === "hidden") return;
      checking.current = true;
      try {
        const cutoff = new Date(Date.now() - RECENT_DAYS * 86400000).toISOString();
        const { data, error } = await supabase.from("published_courses")
          .select("slug,published_at,title:document->>title")
          .gte("published_at", cutoff).order("published_at", { ascending: true }).limit(20);
        if (!active || error || !Array.isArray(data)) return;
        let seen: Record<string, boolean> = {};
        try { seen = readCoursePublicationHistory(localStorage.getItem(STORAGE_KEY)); }
        catch { seen = {}; }
        for (const course of data as PublishedCourse[]) {
          const marker = course.slug + ":" + course.published_at;
          if (!course.slug || !course.published_at || seen[marker] === true || sessionSeen.current.has(marker)) continue;
          sessionSeen.current.add(marker);
          seen[marker] = true;
          const title = typeof course.title === "string" ? course.title.trim() : "A new course";
          toast.custom(id => <div role="status" className="flex items-start gap-3 w-[min(360px,calc(100vw-24px))] rounded-2xl border border-border bg-card p-4 text-foreground shadow-xl">
            <button type="button" className="flex flex-1 items-start gap-3 text-left min-w-0" onClick={() => { toast.dismiss(id); navigate("/courses/" + encodeURIComponent(course.slug)); }} aria-label={"Open new course: " + title}>
              <BookOpen className="w-5 h-5 mt-0.5 shrink-0 text-primary"/>
              <span className="min-w-0"><strong className="block text-sm">New course on TradeHQ</strong><span className="block mt-1 text-sm text-muted-foreground break-words">{title} is now available. Open course →</span></span>
            </button>
            <button type="button" className="shrink-0 rounded p-1 hover:bg-muted" aria-label="Dismiss course announcement" onClick={() => toast.dismiss(id)}><X className="w-4 h-4"/></button>
          </div>, { duration: 10000, position: "top-right" });
        }
        // Limit storage growth without replaying recent notices.
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(Object.entries(seen).slice(-150)))); } catch { /* Private-browsing mode: session deduplication still works. */ }
      } finally { checking.current = false; }
    };
    void check();
    const timer = window.setInterval(() => void check(), RECHECK_MS);
    const onFocus = () => void check();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => { active = false; window.clearInterval(timer); window.removeEventListener("focus", onFocus); document.removeEventListener("visibilitychange", onFocus); };
  }, [navigate]);
  return null;
}
