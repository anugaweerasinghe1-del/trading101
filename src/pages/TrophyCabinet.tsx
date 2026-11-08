import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowRight, Award, BookOpenCheck, CheckCircle2, Circle, GraduationCap, LockKeyhole, ShieldCheck, Trophy } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { MegaFooter } from "@/components/MegaFooter";
import { Card } from "@/components/ui/card";
import { COURSE_PROGRESS_EVENT, COURSE_PROGRESS_KEY, loadProgress } from "@/lib/courseProgress";
import { buildPersonalTrophyCabinet } from "@/lib/learningAchievements";
import { useCourseCatalog } from "@/hooks/useCourseCatalog";
import { FoundationsProgrammePanel } from "@/components/achievements/FoundationsProgrammePanel";
import { FirstRecordedTradeMilestone } from "@/components/achievements/FirstRecordedTradeMilestone";
import { VerifiedTrophyChallenges } from "@/components/achievements/VerifiedTrophyChallenges";

export default function TrophyCabinet() {
  const [progress, setProgress] = useState(loadProgress);
  const { tracks, isError: catalogError } = useCourseCatalog();

  useEffect(() => {
    const refresh = () => setProgress(loadProgress());
    const storage = (event: StorageEvent) => {
      if (!event.key || event.key === COURSE_PROGRESS_KEY) refresh();
    };
    window.addEventListener(COURSE_PROGRESS_EVENT, refresh);
    window.addEventListener("storage", storage);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener(COURSE_PROGRESS_EVENT, refresh);
      window.removeEventListener("storage", storage);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  const cabinet = useMemo(() => buildPersonalTrophyCabinet(tracks, progress), [tracks, progress]);
  const percent = cabinet.availableLessons
    ? Math.round(cabinet.completedLessons * 100 / cabinet.availableLessons) : 0;

  return (
    <>
      <Helmet>
        <title>My Trophy Cabinet — Personal Learning Milestones | TradeHQ</title>
        <meta name="description" content="Review your private TradeHQ course progress, personal milestones and course-completion badges. These are not independently verified awards." />
        <meta name="robots" content="noindex, follow" />
        <link rel="canonical" href="https://www.thetradehq.com/achievements" />
      </Helmet>
      <div className="min-h-screen bg-background flex flex-col">
        <Navigation />
        <main className="flex-1 container mx-auto max-w-6xl px-4 sm:px-6 pt-28 pb-20">
          <nav className="mb-8 text-sm text-muted-foreground" aria-label="Breadcrumb">
            <Link to="/learn" className="hover:text-foreground">Learn</Link>
            <span aria-hidden="true" className="mx-2">/</span>
            <span aria-current="page">My Trophy Cabinet</span>
          </nav>
          <header className="mb-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              <Trophy aria-hidden="true" className="h-4 w-4" /> Your learning journey
            </div>
            <h1 className="mt-4 text-3xl sm:text-5xl font-bold tracking-tight">My Trophy Cabinet</h1>
            <p className="mt-3 max-w-2xl text-muted-foreground leading-relaxed">
              Celebrate understanding, not simulated profits. These milestones are a personal reflection of your saved
              course lessons. Keep learning at your own pace.
            </p>
          </header>

          <div className="mb-8 flex gap-3 rounded-2xl border border-border bg-card/70 p-4 sm:p-5" role="note">
            <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
            <div>
              <p className="font-semibold text-sm">Private personal progress — not a verified public award</p>
              <p className="mt-1 text-sm text-muted-foreground">
                This cabinet reads the learning progress saved on your device (and optionally synced to your account).
                It does not publish trophies to your public trader profile, alter rankings, certify trading skill,
                or reveal your learning activity to other members. Browser progress can be edited and is not independent proof.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10" aria-label="Personal learning summary">
            {[
              ["Lessons completed", String(cabinet.completedLessons)],
              ["Courses completed", String(cabinet.completedCourses)],
              ["Personal milestones", cabinet.milestonesEarned + " / " + cabinet.milestones.length],
              ["Lesson progress", percent + "%"],
            ].map(([label, value]) => (
              <Card key={label} className="p-4 sm:p-5 bg-card/70">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="mt-2 text-2xl sm:text-3xl font-bold tabular-nums">{value}</p>
              </Card>
            ))}
          </div>

          <FoundationsProgrammePanel />

          <FirstRecordedTradeMilestone />

          <VerifiedTrophyChallenges />

          <section aria-labelledby="milestone-heading" className="mb-12">
            <div className="flex items-start justify-between gap-3 flex-wrap mb-5">
              <div>
                <h2 id="milestone-heading" className="text-2xl font-bold tracking-tight flex items-center gap-2">
                  <Award className="h-6 w-6 text-primary" aria-hidden="true" /> Learning milestones
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">Earned here means completed in your saved personal progress only.</p>
              </div>
              <Link to="/courses" className="inline-flex items-center gap-2 text-sm font-semibold text-primary underline underline-offset-4">
                Keep learning <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cabinet.milestones.map(m => {
                const pct = Math.round(m.current / m.target * 100);
                return (
                  <Card key={m.id} className="p-5 bg-card/70 flex flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div className={"rounded-2xl p-3 " + (m.earned ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
                        {m.earned ? <Trophy className="w-6 h-6" aria-hidden="true" /> : <Circle className="w-6 h-6" aria-hidden="true" />}
                      </div>
                      <span className={"rounded-full border px-2.5 py-1 text-xs font-medium " +
                        (m.earned ? "border-primary/30 text-primary" : "border-border text-muted-foreground")}>
                        {m.earned ? "Personal milestone" : "In progress"}
                      </span>
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">{m.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground flex-1">{m.description}</p>
                    <div className="mt-5">
                      <div className="flex justify-between text-xs text-muted-foreground mb-2">
                        <span>{m.earned ? "Recorded as complete" : "Keep going"}</span>
                        <span className="tabular-nums">{m.current} / {m.target}</span>
                      </div>
                      <div role="progressbar" aria-label={m.title + " progress"} aria-valuemin={0} aria-valuemax={m.target} aria-valuenow={m.current}
                        className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: pct + "%" }} />
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>

          <section aria-labelledby="course-badges-heading" className="mb-10">
            <h2 id="course-badges-heading" className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-primary" aria-hidden="true" /> Course badges
            </h2>
            <p className="mt-2 mb-5 text-sm text-muted-foreground">
              Previously saved badges are preserved. A badge timestamp by itself never counts as verified completion.
            </p>
            {catalogError && (
              <p role="status" className="mb-4 rounded-xl border border-border p-3 text-sm text-muted-foreground">
                The latest course catalog could not be loaded. Showing available courses only; other saved badges are retained.
              </p>
            )}
            <div className="grid md:grid-cols-2 gap-4">
              {cabinet.badges.map(b => (
                <Card key={b.slug} className="p-5 bg-card/70 flex flex-col">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                      {b.complete ? <CheckCircle2 className="w-5 h-5" aria-hidden="true" /> : <BookOpenCheck className="w-5 h-5" aria-hidden="true" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{b.name}</p>
                      <p className="text-sm text-muted-foreground">{b.title}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground">
                    {b.complete ? "Personal course completion recorded" :
                      b.previouslyRecorded ? "Earlier badge saved · lesson completion needs rechecking" :
                      "Continue the course to unlock this personal badge"}
                  </p>
                  <div className="mt-3 flex justify-between text-xs text-muted-foreground">
                    <span>Lesson completion</span><span className="tabular-nums">{b.done} / {b.total}</span>
                  </div>
                  <div role="progressbar" aria-label={b.title + " lessons completed"} aria-valuemin={0} aria-valuemax={b.total} aria-valuenow={b.done}
                    className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: Math.round(b.done * 100 / b.total) + "%" }} />
                  </div>
                  <Link to={"/courses/" + encodeURIComponent(b.slug)}
                    className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary underline underline-offset-4">
                    {b.complete ? "Review course" : "Continue course"} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </Card>
              ))}
            </div>
            {cabinet.archivedBadgeCount > 0 && (
              <p className="mt-4 rounded-xl border border-border bg-card/50 p-4 text-sm text-muted-foreground">
                {cabinet.archivedBadgeCount} earlier personal badge record(s) belong to courses not in the currently
                available catalog. The underlying saved records remain unchanged.
              </p>
            )}
          </section>

          <p className="flex items-start gap-2 rounded-xl border border-border bg-card/60 p-4 text-xs text-muted-foreground leading-relaxed">
            <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
            Only awards backed by server-verified evidence can be shared, and only after explicit separate opt-in.
            Device-saved lesson badges remain personal. No award indicates investment performance or professional certification.
          </p>
        </main>
        <MegaFooter />
      </div>
    </>
  );
}
