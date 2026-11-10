import { useEffect, useRef } from "react";
import { Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { readCoursePublicationHistory } from "@/lib/coursePublicationHistory";
import { SITE_DOMAIN } from "@/lib/constants";
import { readPublicCoursePublications } from "@/lib/publicCoursePublications";
import { APPROVED_RELEASES, publishedCourseRelease, RELEASE_NOTICES_PREFERENCE, releaseNoticesDisabled, type ReleaseNote } from "@/lib/releaseNotes";

const HISTORY_KEY = "tradehq-seen-course-publications-v1";
const RECENT_MS = 7 * 86400000;
const RECHECK_MS = 45000;

function canAnnounceOnHost() {
  const { hostname, protocol, origin } = window.location;
  return origin === SITE_DOMAIN || origin === "https://thetradehq.com" ||
    (protocol === "http:" && (hostname === "localhost" || hostname === "127.0.0.1"));
}

export function ReleaseNotices() {
  const sessionSeen = useRef(new Set<string>());
  useEffect(() => {
    if (!canAnnounceOnHost()) return;
    const abort = new AbortController();
    let checking = false;
    let visibleToast: string | number | undefined;
    const clearToast = () => {
      if (visibleToast === undefined) return;
      toast.dismiss(visibleToast);
      visibleToast = undefined;
    };
    const check = async () => {
      if (checking || visibleToast !== undefined || document.hidden || releaseNoticesDisabled()) return;
      checking = true;
      try {
        const now = Date.now();
        const cutoff = now - RECENT_MS;
        let seen: Record<string, boolean> = {};
        try { seen = readCoursePublicationHistory(localStorage.getItem(HISTORY_KEY), now); }
        catch { /* Session deduplication still applies. */ }
        const eligible = ({ release, marker }: { release: ReleaseNote; marker: string }) => {
          const date = Date.parse(release.date);
          return date >= cutoff && date <= now && seen[marker] !== true && !sessionSeen.current.has(marker);
        };
        let next: { release: ReleaseNote; marker: string } | undefined = APPROVED_RELEASES.filter(release => release.announce === true)
          .map(release => ({ release, marker: `${release.id}:${release.date}` })).find(eligible);
        if (!next) {
          const { data, error } = await readPublicCoursePublications({
            since: new Date(cutoff).toISOString(), signal: abort.signal,
          });
          if (abort.signal.aborted || document.hidden || releaseNoticesDisabled() || error || !Array.isArray(data)) return;
          // Another tab may have shown the notice while the feed was loading.
          try { seen = readCoursePublicationHistory(localStorage.getItem(HISTORY_KEY), now); }
          catch { /* Session deduplication still applies. */ }
          next = data.map(publishedCourseRelease).flatMap(release => release ? [{
            release,
            // Preserve markers written by the existing course notices.
            marker: `${release.id.slice("course-".length)}:${release.date}`,
          }] : []).find(eligible);
        }
        if (!next) return;
        sessionSeen.current.add(next.marker);
        seen[next.marker] = true;
        try {
          localStorage.setItem(HISTORY_KEY, JSON.stringify(Object.fromEntries(Object.entries(seen).slice(-150))));
        } catch { /* Session deduplication still applies. */ }
        const title = next.release.title;
        const finished = ({ id }: { id: string | number }) => {
          if (visibleToast === id) visibleToast = undefined;
        };
        visibleToast = toast.custom(() => (
          <div data-release-notice className="flex w-[min(340px,calc(100vw-32px))] items-start gap-3 rounded-2xl border border-border bg-card p-4 text-foreground shadow-xl">
            <Sparkles aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <p role="status" className="break-words text-sm font-semibold">{title}</p>
              <a href="/whats-new" onClick={clearToast} className="inline-flex min-h-11 items-center text-sm text-primary underline underline-offset-4">See What’s New</a>
            </div>
            <button type="button" className="grid h-11 w-11 shrink-0 place-items-center rounded hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring" aria-label="Dismiss release announcement" onClick={clearToast}>
              <X aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
        ), { duration: 10000, position: "top-center", closeButton: false, onDismiss: finished, onAutoClose: finished });
      } finally { checking = false; }
    };
    const onPreference = () => { if (releaseNoticesDisabled()) clearToast(); else void check(); };
    const onStorage = (event: StorageEvent) => {
      if (event.key === RELEASE_NOTICES_PREFERENCE || event.key === null) onPreference();
    };
    void check();
    const timer = window.setInterval(check, RECHECK_MS);
    document.addEventListener("visibilitychange", check);
    window.addEventListener("focus", check);
    window.addEventListener("storage", onStorage);
    return () => {
      abort.abort();
      clearToast();
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", check);
      window.removeEventListener("focus", check);
      window.removeEventListener("storage", onStorage);
    };
  }, []);
  return null;
}
