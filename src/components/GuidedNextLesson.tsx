import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { GraduationCap, ArrowRight, Sparkles } from "lucide-react";
import { useCourseCatalog } from "@/hooks/useCourseCatalog";
import { COURSE_PROGRESS_EVENT, COURSE_PROGRESS_KEY, loadProgress } from "@/lib/courseProgress";
import { buildLearningOverview } from "@/lib/learningOverview";
import { readJourney } from "@/lib/beginnerJourney";

/** Always choose from the *published* catalog, never the generated-draft queue.
 * Recompute on new lessons and preserved progress, including partial quizzes.
 */
export function GuidedNextLesson() {
  const { tracks, isPending } = useCourseCatalog();
  const [progress, setProgress] = useState(loadProgress);
  useEffect(() => {
    const refresh = () => setProgress(loadProgress());
    const onStorage = (event: StorageEvent) => {
      if (!event.key || event.key === COURSE_PROGRESS_KEY) refresh();
    };
    window.addEventListener(COURSE_PROGRESS_EVENT, refresh);
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(COURSE_PROGRESS_EVENT, refresh);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const next = buildLearningOverview(tracks, progress, readJourney()).next;
  const hasCourseActivity = Object.values(progress.tracks).some(track =>
    Object.values(track.lessons).some(lesson => lesson.status === "completed" || lesson.status === "in-progress"));
  const action = next?.reason === "Resume your unfinished lesson" ? "Continue lesson"
    : hasCourseActivity ? "Take next lesson" : "Start your first lesson";
  if (!next) {
    return isPending ? null : (
      <Card className="p-5 border border-border">
        <p className="text-sm text-muted-foreground">You've finished the currently available lessons. Keep building your skills through a new daily scenario, practice trading or reflecting on your portfolio. New approved courses will appear automatically.</p>
        <Link to="/daily" className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Continue with Daily Practice <ArrowRight className="w-4 h-4" /></Link>
        <details className="mt-3 text-sm text-muted-foreground">
          <summary className="cursor-pointer py-2">Other ways to practise</summary>
          <nav aria-label="Other mastery activities" className="mt-2 flex flex-wrap gap-4">
            <Link to="/portfolio" className="underline">Review portfolio</Link>
            <Link to="/practice" className="underline">Practice Arena</Link>
          </nav>
        </details>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden p-6 md:p-7 bg-gradient-to-br from-primary/10 via-card to-accent/10 border border-primary/25">
      <div aria-hidden className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative flex flex-col sm:flex-row items-start justify-between gap-4">
        <div className="min-w-0 flex-1 w-full sm:w-auto">
          <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-primary mb-2">
            <Sparkles className="w-3 h-3" /> Guided pathway · From approved courses
          </div>
          <p className="text-xs text-muted-foreground mb-1">{next.reason}</p>
          <h3 className="text-lg md:text-xl font-semibold text-foreground break-words">{next.title}</h3>
          <p className="text-xs text-muted-foreground mt-1">
            <GraduationCap className="w-3 h-3 inline mr-1" /> {next.trackTitle}
          </p>
        </div>
        <Link to={next.href}
          className="inline-flex shrink-0 max-w-full items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition whitespace-normal">
          {action} <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </Card>
  );
}
