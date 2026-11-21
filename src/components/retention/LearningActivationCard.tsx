import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpenCheck, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCourseCatalog } from "@/hooks/useCourseCatalog";
import { useMasteryNextAction } from "@/hooks/useMasteryNextAction";
import { COURSE_PROGRESS_EVENT, COURSE_PROGRESS_KEY, loadProgress } from "@/lib/courseProgress";
import { JOURNEY_EVENT, JOURNEY_KEY, readJourney } from "@/lib/beginnerJourney";
import { chooseLearningActivation } from "@/lib/learningActivation";
import { getLastVisit } from "@/lib/lastVisit";
import { chooseReturnDestination } from "@/lib/learnerResume";

/** One contextual next step. No popups, emails, new analytics or extra stored data. */
export function LearningActivationCard({ placement = "home" }: { placement?: "home" | "profile" }) {
  const { user } = useAuth();
  const { tracks } = useCourseCatalog();
  const mastery = useMasteryNextAction();
  const [snapshot, setSnapshot] = useState(() => ({ course: loadProgress(), journey: readJourney() }));
  const [previousRoute] = useState(() => {
    const visit = getLastVisit();
    return visit.daysAgo !== null && visit.daysAgo >= 1 ? visit.route : null;
  });

  useEffect(() => {
    const refresh = () => setSnapshot({ course: loadProgress(), journey: readJourney() });
    const onStorage = (event: StorageEvent) => {
      if (!event.key || event.key === COURSE_PROGRESS_KEY || event.key === JOURNEY_KEY) refresh();
    };
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
  }, [user?.id]);

  const action = chooseLearningActivation(tracks, snapshot.course, snapshot.journey, mastery, { hasPracticeTrade: mastery.tradeCount !== null && mastery.tradeCount > 0 });
  const optionalResume = previousRoute ? chooseReturnDestination(tracks, snapshot.course, snapshot.journey, previousRoute) : null;
  const id = "learning-activation-" + placement;

  return (
    <section aria-labelledby={id} data-testid="learning-activation-card" data-activation-state={action.state}
      className={placement === "home" ? "container mx-auto max-w-7xl px-4 pt-7 sm:px-6 sm:pt-9" : "mb-8"}>
      <div className="flex flex-col gap-5 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/[0.09] via-card to-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-7">
        <div className="flex min-w-0 max-w-2xl items-start gap-3">
          <span className="shrink-0 rounded-xl bg-primary/10 p-2.5 text-primary" aria-hidden="true">
            <BookOpenCheck className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.13em] text-primary">
              {action.state === "lesson" ? "Continue learning" : action.state === "mastery" ? "Keep improving" : "Your next step"}
            </p>
            <h2 id={id} className="mt-1 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              {action.heading}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{action.description}</p>
            {optionalResume && optionalResume.href !== action.href && (
              <p className="mt-3 text-xs text-muted-foreground">
                Prefer where you left off? <Link to={optionalResume.href} className="underline underline-offset-4 hover:text-foreground">Resume {optionalResume.label}</Link>
              </p>
            )}
            <p className="mt-3 flex items-start gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {user ? "Your saved learning progress can sync privately when online." : "Free to explore without signing up. Guest progress stays in this browser."}
            </p>
          </div>
        </div>
        <Link to={action.href}
          className="inline-flex min-h-12 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:w-auto"
          aria-label={action.buttonLabel + ": " + action.heading}>
          {action.buttonLabel} <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
