import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, RotateCcw, X } from "lucide-react";
import { getLastVisit } from "@/lib/lastVisit";
import { loadProgress } from "@/lib/courseProgress";
import { getTrack } from "@/lib/coursesData";

const DISMISS_KEY = "tradehq_continue_dismissed_at";

function labelForRoute(path: string): string {
  if (path.startsWith("/trade/")) return `your last trade — ${path.split("/").pop()?.toUpperCase()}`;
  if (path.startsWith("/wiki/")) return "the wiki entry you were reading";
  if (path.startsWith("/learn")) return "your Learn lesson";
  if (path === "/portfolio") return "your portfolio";
  if (path === "/leaderboard") return "the leaderboard";
  if (path === "/markets") return "the markets page";
  return "where you left off";
}

/** Shown on the homepage only when the user is returning (day 2+). */
export function ContinueBanner() {
  const [show, setShow] = useState(false);
  const [route, setRoute] = useState<string>("");
  const [label, setLabel] = useState<string>("");

  useEffect(() => {
    // Prefer resuming an in-progress course lesson
    const prog = loadProgress();
    if (prog.lastLesson) {
      const t = getTrack(prog.lastLesson.track);
      const l = t?.lessons.find((x) => x.slug === prog.lastLesson!.lesson);
      if (t && l) {
        const dismissedAt = localStorage.getItem(DISMISS_KEY);
        if (dismissedAt) {
          const hrs = (Date.now() - new Date(dismissedAt).getTime()) / 36e5;
          if (hrs < 24) return;
        }
        setRoute(`/courses/${t.slug}/${l.slug}`);
        setLabel(`your lesson — ${l.title}`);
        setShow(true);
        return;
      }
    }
    const v = getLastVisit();
    if (!v.route || v.route === "/" || v.daysAgo === null || v.daysAgo < 1) return;
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const hrs = (Date.now() - new Date(dismissedAt).getTime()) / 36e5;
      if (hrs < 24) return;
    }
    setRoute(v.route);
    setLabel(labelForRoute(v.route));
    setShow(true);
  }, []);

  if (!show || !route) return null;

  return (
    <div className="container mx-auto px-4 sm:px-6 max-w-7xl pt-6">
      <div className="relative flex flex-col items-stretch gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex min-w-0 items-start gap-3 sm:items-center">
          <RotateCcw className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400 sm:mt-0" />
          <p className="min-w-0 break-words text-sm leading-relaxed text-foreground/90">
            Welcome back — jump straight to <span className="font-semibold">{label}</span>.
          </p>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-emerald-500/10 pt-2 pl-7 sm:shrink-0 sm:justify-end sm:border-0 sm:p-0">
          <Link
            to={route}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
          >
            Continue <ArrowRight className="h-4 w-4" />
          </Link>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => {
              localStorage.setItem(DISMISS_KEY, new Date().toISOString());
              setShow(false);
            }}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg hover:bg-white/[0.05] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
          >
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
}