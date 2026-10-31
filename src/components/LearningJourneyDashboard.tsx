import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpenCheck, Compass, RotateCcw, ShieldCheck } from "lucide-react";
import { COURSE_PROGRESS_EVENT, COURSE_PROGRESS_KEY, loadProgress } from "@/lib/courseProgress";
import { JOURNEY_EVENT, JOURNEY_KEY, readJourney } from "@/lib/beginnerJourney";
import { buildLearningOverview, type LearningTrack } from "@/lib/learningOverview";

/** One read-only dashboard for previously saved journey and structured-course progress. */
export function LearningJourneyDashboard({ tracks }: { tracks: LearningTrack[] }) {
  const [snapshot, setSnapshot] = useState(() => ({ course: loadProgress(), journey: readJourney() }));
  useEffect(() => {
    const refresh = () => setSnapshot({ course: loadProgress(), journey: readJourney() });
    const onStorage = (event: StorageEvent) => {
      if (!event.key || event.key === COURSE_PROGRESS_KEY || event.key === JOURNEY_KEY) refresh();
    };
    window.addEventListener(COURSE_PROGRESS_EVENT, refresh);
    window.addEventListener(JOURNEY_EVENT, refresh);
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(COURSE_PROGRESS_EVENT, refresh);
      window.removeEventListener(JOURNEY_EVENT, refresh);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const overview = buildLearningOverview(tracks, snapshot.course, snapshot.journey);
  const journeyPercent = overview.journeyDone * 20;
  const coursePercent = overview.lessonsTotal ? Math.round(overview.lessonsDone * 100 / overview.lessonsTotal) : 0;
  const hasCourseHistory = overview.lessonsDone > 0 || overview.lessonsInProgress > 0;

  return (
    <section aria-label="Continue Learning dashboard" className="mb-9 rounded-3xl border border-border bg-card/80 p-5 sm:p-7">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">Your learning, connected</p>
          <h2 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight">Continue Learning</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Pick up your five-step first-trade journey and any unfinished course. Your progress is based on this browser's saved learning records.
          </p>
        </div>
        <Link to="/courses" className="inline-flex items-center gap-2 text-sm font-semibold text-primary underline underline-offset-4">
          All courses <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border bg-background/70 p-5 flex flex-col">
          <div className="flex items-center justify-between gap-3"><h3 className="font-semibold flex gap-2 items-center"><Compass className="w-5 h-5 text-primary" /> First virtual trade</h3><span className="text-sm tabular-nums text-muted-foreground">{overview.journeyDone}/5</span></div>
          <div role="progressbar" aria-label="Five-step beginner journey" aria-valuemin={0} aria-valuemax={100} aria-valuenow={journeyPercent} className="mt-4 h-2 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: journeyPercent + "%" }} /></div>
          <p className="mt-3 mb-5 text-sm text-muted-foreground flex-1">
            {overview.journeyFinished ? "Journey complete. Review your portfolio or continue learning about risk." : overview.journeyDone ? "Continue from step " + (overview.journeyStage + 1) + " without repeating earlier steps." : "Understand an order, place an optional virtual trade, inspect your portfolio and reflect."}
          </p>
          <Link to="/start" className="inline-flex items-center gap-2 font-semibold text-sm text-primary underline underline-offset-4">
            {overview.journeyFinished ? "Review my five-step journey" : overview.journeyDone ? "Resume my journey" : "Begin my five-step journey"} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="rounded-2xl border border-border bg-background/70 p-5 flex flex-col">
          <div className="flex items-center justify-between gap-3"><h3 className="font-semibold flex gap-2 items-center"><BookOpenCheck className="w-5 h-5 text-primary" /> Structured courses</h3><span className="text-sm tabular-nums text-muted-foreground">{overview.lessonsDone}/{overview.lessonsTotal}</span></div>
          <div role="progressbar" aria-label="Structured course lessons completed" aria-valuemin={0} aria-valuemax={100} aria-valuenow={coursePercent} className="mt-4 h-2 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary rounded-full" style={{ width: coursePercent + "%" }} /></div>
          <p className="mt-3 text-sm text-muted-foreground">{overview.lessonsInProgress} unfinished lesson(s), {overview.lessonsDone} completed. Quizzes and reading positions resume on this browser.</p>
          {overview.next ? (
            <div className="mt-4 flex-1">
              <p className="text-xs text-muted-foreground">{overview.next.reason}</p>
              <p className="mt-1 font-semibold leading-snug">{overview.next.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{overview.next.trackTitle}</p>
            </div>
          ) : (
            <p className="mt-4 flex-1 text-sm text-muted-foreground">{hasCourseHistory ? "All available course lessons completed." : "Explore an introductory course when you're ready."}</p>
          )}
          <Link to={overview.next?.href ?? "/courses"} className="mt-4 inline-flex items-center gap-2 font-semibold text-sm text-primary underline underline-offset-4">
            {overview.next ? (overview.next.inProgress ? "Resume saved lesson" : "Open next lesson") : "Browse courses"} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <p className="mt-4 flex gap-2 items-start text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
        Browser-only learning records are separate from verified account trades and portfolio JSON backups. Clearing site data may erase them; this dashboard does not award public rankings or certify investment ability.
      </p>
    </section>
  );
}
