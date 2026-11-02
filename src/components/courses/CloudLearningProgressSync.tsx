import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { COURSE_PROGRESS_EVENT, COURSE_PROGRESS_KEY, loadProgress, parseCourseProgress, replaceCourseProgressSnapshot } from "@/lib/courseProgress";
import { JOURNEY_EVENT, JOURNEY_KEY, readJourney, parseJourneyProgress, replaceJourneySnapshot } from "@/lib/beginnerJourney";
import { mergeCourseRecords, mergeJourneyRecords } from "@/lib/learningCloudMerge";
import { convergeLearningProgress, learningStable } from "@/lib/learningCloudConvergence";

const OWNER_KEY = "tradehq:learning-progress-owner:v1";
const STORAGE_PREFIX = "tradehq:learning-profile-cache:v1:";
const SCHEDULE_MS = 1800;
const POLL_MS = 75_000;

/** Isolate learning histories on a shared browser. Never import one signed-in
 * account's local lesson records into a different account.
 * Preserve the original guest record for subsequent signed-out sessions.
 */
const GUEST_IMPORT_CLAIMED = "tradehq:guest-learning-claimed:v1";
function activateLearningOwner(uid: string | null) {
  try {
    const previous = localStorage.getItem(OWNER_KEY);
    if (previous === uid) return;
    // Archive the current account before switching identities.
    if (previous) {
      localStorage.setItem(STORAGE_PREFIX + previous, JSON.stringify({
        courses: loadProgress(), journey: readJourney(),
      }));
    } else if (!localStorage.getItem(STORAGE_PREFIX + "guest")) {
      localStorage.setItem(STORAGE_PREFIX + "guest", JSON.stringify({
        courses: loadProgress(), journey: readJourney(),
      }));
    }
    let saved: { courses?: unknown; journey?: unknown } | null = null;
    try { saved = JSON.parse(localStorage.getItem(STORAGE_PREFIX + (uid ?? "guest")) ?? "null"); }
    catch { saved = null; }

    // A guest may migrate its learning history once, to its first signed-in
    // account. Later sign-ins on a shared browser must never inherit that
    // previous guest's work or another account's record.
    const firstGuestImport = !!uid && !previous &&
      !localStorage.getItem(GUEST_IMPORT_CLAIMED) && !saved;
    if (firstGuestImport) {
      saved = {
        courses: loadProgress(), journey: readJourney(),
      };
      localStorage.setItem(GUEST_IMPORT_CLAIMED, "1");
    }
    replaceCourseProgressSnapshot(parseCourseProgress(saved?.courses ? JSON.stringify(saved.courses) : null));
    replaceJourneySnapshot(parseJourneyProgress(saved?.journey ?? null));

    if (uid) localStorage.setItem(OWNER_KEY, uid);
    else localStorage.removeItem(OWNER_KEY);
  } catch { /* Disabled storage must not block lessons. */ }
}

/** Authenticated educational progress only; does not touch verified trades,
 * public profiles, badges or leaderboard values.
 */
export function CloudLearningProgressSync() {
  const { user, loading } = useAuth();
  useEffect(() => {
    if (loading) return;
    const uid = user?.id ?? null;
    let active = true;
    let ready = false;
    let busy = false;
    let queued = false;
    let suppressLocal = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    activateLearningOwner(uid);
    if (!uid) return () => { active = false; };

    const sync = async () => {
      if (!active || !navigator.onLine) return;
      if (busy) { queued = true; return; }
      busy = true;
      try {
        const authorize = async () => {
          const { data: { session }, error } = await supabase.auth.getSession();
          if (error || !active || session?.user.id !== uid)
            throw new Error("Learning account changed during synchronization.");
        };
        const merged = await convergeLearningProgress(
          () => ({ courses: loadProgress(), journey: readJourney() }),
          {
            read: async () => {
              const { data, error } = await supabase.from("user_learning_progress")
                .select("courses,journey,updated_at").eq("user_id",uid).maybeSingle();
              if (error) throw error;
              return data;
            },
            insert: async state => {
              await authorize();
              const result = await supabase.from("user_learning_progress").insert({
                user_id: uid,
                courses: JSON.parse(JSON.stringify(state.courses)),
                journey: JSON.parse(JSON.stringify(state.journey)),
              });
              if (result.error?.code === "23505") return false; // Other device inserted first.
              if (result.error) throw result.error;
              return true;
            },
            updateIfUnchanged: async (state, expectedUpdatedAt) => {
              await authorize();
              const result = await supabase.from("user_learning_progress")
                .update({
                  courses: JSON.parse(JSON.stringify(state.courses)),
                  journey: JSON.parse(JSON.stringify(state.journey)),
                }).eq("user_id",uid).eq("updated_at",expectedUpdatedAt).select("updated_at");
              if (result.error) throw result.error;
              return (result.data?.length ?? 0) === 1; // No rows = concurrent update.
            },
          },
          () => active,
        );
        if (!active) return;
        // A lesson may have changed locally during the final network write.
        // Merge once more instead of restoring an outdated in-flight snapshot.
        const latestCourses = loadProgress(), latestJourney = readJourney();
        const courses = mergeCourseRecords(latestCourses, merged.courses);
        const journey = mergeJourneyRecords(latestJourney, merged.journey);
        suppressLocal = true;
        try {
          if (learningStable(latestCourses) !== learningStable(courses)) replaceCourseProgressSnapshot(courses);
          if (learningStable(latestJourney) !== learningStable(journey)) replaceJourneySnapshot(journey);
        } finally { suppressLocal = false; }
        if (learningStable(courses) !== learningStable(merged.courses)
          || learningStable(journey) !== learningStable(merged.journey)) queued = true;
      } catch {
        // Keep local lessons intact during outages; retry on reconnect/focus.
      } finally {
        busy = false; ready = true;
        if (queued && active) { queued = false; schedule(); }
      }
    };
    function schedule(delay = SCHEDULE_MS) {
      if (!active) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => { timer=undefined; void sync(); },delay);
    }
    const onLocal = () => { if (suppressLocal) return; if (busy) queued = true; else if (ready) schedule(); };
    const onStorage = (event: StorageEvent) => {
      if (!event.key || event.key===COURSE_PROGRESS_KEY || event.key===JOURNEY_KEY) onLocal();
    };
    const onResume = () => { if (!document.hidden) schedule(50); };
    window.addEventListener(COURSE_PROGRESS_EVENT,onLocal);
    window.addEventListener(JOURNEY_EVENT,onLocal);
    window.addEventListener("storage",onStorage);
    window.addEventListener("focus",onResume);
    window.addEventListener("online",onResume);
    document.addEventListener("visibilitychange",onResume);
    const interval=window.setInterval(onResume,POLL_MS);
    const channel=supabase.channel("tradehq-learning-"+uid)
      .on("postgres_changes",{event:"*",schema:"public",table:"user_learning_progress",filter:"user_id=eq."+uid},()=>schedule(500))
      .subscribe();
    void sync();

    return () => {
      active=false;
      if (timer) clearTimeout(timer);
      clearInterval(interval);
      window.removeEventListener(COURSE_PROGRESS_EVENT,onLocal);
      window.removeEventListener(JOURNEY_EVENT,onLocal);
      window.removeEventListener("storage",onStorage);
      window.removeEventListener("focus",onResume);
      window.removeEventListener("online",onResume);
      document.removeEventListener("visibilitychange",onResume);
      void supabase.removeChannel(channel);
    };
  }, [user?.id,loading]);
  return null;
}
