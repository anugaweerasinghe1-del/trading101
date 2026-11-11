import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, RotateCcw, X } from "lucide-react";
import { getLastVisit } from "@/lib/lastVisit";
import { COURSE_PROGRESS_EVENT, loadProgress } from "@/lib/courseProgress";
import { JOURNEY_EVENT, readJourney } from "@/lib/beginnerJourney";
import { courseTracks } from "@/lib/coursesData";
import { useCourseCatalog } from "@/hooks/useCourseCatalog";
import { chooseReturnDestination, type ReturnDestination } from "@/lib/learnerResume";

const DISMISS_KEY = "tradehq_continue_dismissed_at";

/** Returning visitors resume a current, approved lesson, not an already-passed quiz. */
export function ContinueBanner() {
  const { data: publishedCourses } = useCourseCatalog();
  const [destination, setDestination] = useState<ReturnDestination | null>(null);

  useEffect(() => {
    const refresh = () => {
      const last = getLastVisit();
      if (last.daysAgo === null || last.daysAgo < 1) { setDestination(null); return; }
      try {
        const dismissedAt = localStorage.getItem(DISMISS_KEY);
        if (dismissedAt && Date.now() - new Date(dismissedAt).getTime() < 24 * 60 * 60 * 1000) {
          setDestination(null);
          return;
        }
      } catch { /* Storage blocked: still show a safe internal link. */ }
      setDestination(chooseReturnDestination(
        [...courseTracks, ...(publishedCourses ?? [])],
        loadProgress(), readJourney(), last.route,
      ));
    };
    const onStorage = () => refresh();
    refresh();
    window.addEventListener(COURSE_PROGRESS_EVENT, refresh);
    window.addEventListener(JOURNEY_EVENT, refresh);
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener(COURSE_PROGRESS_EVENT, refresh);
      window.removeEventListener(JOURNEY_EVENT, refresh);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", refresh);
    };
  }, [publishedCourses]);

  if (!destination) return null;

  return (
    <div className="container mx-auto max-w-7xl px-4 pt-5 sm:px-6 sm:pt-6">
      <div data-testid="continue-banner" className="relative flex flex-col gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.07] px-4 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:pr-14">
        <div className="flex min-w-0 items-start gap-3 pr-9 sm:items-center sm:pr-0">
          <RotateCcw aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400 sm:mt-0" />
          <p className="min-w-0 break-words text-sm leading-relaxed text-foreground sm:text-[15px]">
            Welcome back — jump straight to <span className="font-semibold">{destination.label}</span>.
          </p>
        </div>
        <Link to={destination.href} className="ml-8 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-400 transition-colors hover:bg-emerald-500/20 hover:text-emerald-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 sm:ml-0 sm:shrink-0">
          Continue <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
        <button
          type="button" aria-label="Dismiss"
          onClick={() => {
            try { localStorage.setItem(DISMISS_KEY, new Date().toISOString()); } catch { /* Optional UI preference. */ }
            setDestination(null);
          }}
          className="absolute right-2 top-2 inline-flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 sm:right-1.5 sm:top-1/2 sm:-translate-y-1/2"
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
