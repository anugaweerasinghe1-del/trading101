import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { GraduationCap, ArrowRight, Sparkles } from "lucide-react";
import { courseTracks } from "@/lib/coursesData";
import { loadProgress } from "@/lib/courseProgress";

/**
 * Guided Learning Pathway — recommends the single next lesson the
 * learner should tackle, based on what they've completed and where
 * they left off. Pure client-side, zero auth.
 */
export function GuidedNextLesson() {
  const suggestion = useMemo(() => {
    const progress = loadProgress();

    // 1. If there's an in-progress lesson, prioritise resuming it.
    if (progress.lastLesson) {
      const t = courseTracks.find((x) => x.slug === progress.lastLesson!.track);
      const l = t?.lessons.find((x) => x.slug === progress.lastLesson!.lesson);
      const done = t && l && progress.tracks[t.slug]?.lessons[l.slug]?.status === "completed";
      if (t && l && !done) {
        return { track: t, lesson: l, reason: "Resume where you left off", cta: "Continue lesson" };
      }
    }

    // 2. Find first partially-started track and next uncompleted lesson.
    for (const t of courseTracks) {
      const tp = progress.tracks[t.slug];
      if (!tp) continue;
      const nextLesson = t.lessons.find(
        (l) => tp.lessons[l.slug]?.status !== "completed"
      );
      if (nextLesson) {
        return {
          track: t,
          lesson: nextLesson,
          reason: `Next in ${t.title}`,
          cta: "Take next lesson",
        };
      }
    }

    // 3. Brand-new learner — recommend a sensible starting lesson.
    const t = courseTracks.find((x) => x.slug === "trading-psychology-mastery") ?? courseTracks[0];
    return {
      track: t,
      lesson: t.lessons[0],
      reason: "Recommended starting point for new learners",
      cta: "Start your first lesson",
    };
  }, []);

  if (!suggestion) return null;

  return (
    <Card className="relative overflow-hidden p-6 md:p-7 bg-gradient-to-br from-emerald-500/10 via-white/[0.02] to-fuchsia-500/10 border border-emerald-500/25">
      <div
        aria-hidden
        className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-emerald-500/10 blur-3xl"
      />
      <div className="relative flex flex-col sm:flex-row items-start justify-between gap-4">
        <div className="min-w-0 flex-1 w-full sm:w-auto">
          <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-emerald-400 mb-2">
            <Sparkles className="w-3 h-3" /> Guided pathway · Picked for you
          </div>
          <p className="text-xs text-muted-foreground mb-1">{suggestion.reason}</p>
          <h3 className="text-lg md:text-xl font-semibold text-foreground break-words">
            {suggestion.lesson.title}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            <GraduationCap className="w-3 h-3 inline mr-1" />
            {suggestion.track.title} · {suggestion.lesson.readingMinutes} min
          </p>
        </div>
        <Link
          to={`/courses/${suggestion.track.slug}/${suggestion.lesson.slug}`}
          className="inline-flex shrink-0 max-w-full items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-black font-semibold hover:bg-emerald-400 transition whitespace-normal"
        >
          {suggestion.cta} <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </Card>
  );
}
