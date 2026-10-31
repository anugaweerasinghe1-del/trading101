import NotFound from "./NotFound";
import { useEffect, useState, useMemo } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Navigation } from "@/components/Navigation";
import { MegaFooter } from "@/components/MegaFooter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Award, ArrowLeft, ArrowRight, CheckCircle2, XCircle, ExternalLink, Sparkles, Bot } from "lucide-react";
import type { CourseTrack as Track, CourseLesson as Lesson } from "@/lib/coursesData";
import { useCourseDocument } from "@/hooks/useCourseCatalog";
import { markLessonStarted, markLessonCompleted, awardBadge, getTrackProgress, readLessonDraft, saveLessonDraft, saveLessonPosition } from "@/lib/courseProgress";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { EducationalDisclaimer } from "@/components/EducationalDisclaimer";
import { AIAnswerBlock } from "@/components/seo/AIAnswerBlock";
import { hasIntegratedCourseLesson } from "@/lib/courseLessonPresentation";
import { toast } from "sonner";

const DOMAIN = "https://www.thetradehq.com";
const AUTHOR = "Anuga Weerasinghe";

export default function CourseLesson() {
  const { trackSlug, lessonSlug } = useParams<{ trackSlug: string; lessonSlug: string }>();
  const { track, isPending, isError, refetch } = useCourseDocument(trackSlug);
  const index = track?.lessons.findIndex(l => l.slug === lessonSlug) ?? -1;
  if (!track && isPending) return <main className="container pt-28 pb-16" aria-live="polite">Loading lesson…</main>;
  if (!track && isError) return <main className="container pt-28 pb-16"><p>Could not load lessons.</p><button onClick={() => void refetch()}>Retry</button></main>;
  if (!track || index < 0) return <NotFound />;
  return <CourseLessonContent key={track.slug + "/" + lessonSlug} track={track} lesson={track.lessons[index]} index={index} />;
}

function CourseLessonContent({ track, lesson, index }: { track: Track; lesson: Lesson; index: number }) {

  const [answers, setAnswers] = useState<Record<number, number>>(() => readLessonDraft(track.slug, lesson.slug).answers);
  const [resumePct] = useState(() => readLessonDraft(track.slug, lesson.slug).scrolledPct);
  const [submitted, setSubmitted] = useState(false);
  const score = useMemo(
    () => lesson.quiz.reduce((s, q, i) => (answers[i] === q.correctAnswer ? s + 1 : s), 0),
    [answers, lesson.quiz],
  );

  useEffect(() => {
    markLessonStarted(track.slug, lesson.slug);
    setAnswers(readLessonDraft(track.slug, lesson.slug).answers);
    setSubmitted(false);
    let timer: ReturnType<typeof setTimeout> | undefined;
    const storePosition = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      if (total > 0) saveLessonPosition(track.slug, lesson.slug, (window.scrollY / total) * 100);
    };
    const onScroll = () => { if (timer) clearTimeout(timer); timer = setTimeout(storePosition, 700); };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (timer) clearTimeout(timer);
      storePosition();
    };
  }, [track.slug, lesson.slug]);

  const path = `/courses/${track.slug}/${lesson.slug}`;
  const integratedLesson = hasIntegratedCourseLesson(path);
  const url = `${DOMAIN}${path}`;
  const title = `${lesson.title} — ${track.title} | TradeHQ`;
  const description = lesson.summary.slice(0, 155);

  const prev = index > 0 ? track.lessons[index - 1] : null;
  const next = index < track.lessons.length - 1 ? track.lessons[index + 1] : null;

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: lesson.title,
    description: lesson.summary,
    learningResourceType: "Lesson",
    educationalLevel: track.level,
    inLanguage: "en",
    url,
    author: track.editorial ? { "@type": "Organization", name: "TradeHQ" } : { "@type": "Person", name: AUTHOR },
    ...(track.editorial ? { dateModified: track.editorial.reviewedAt, reviewedBy: { "@type": "Person", name: track.editorial.reviewer } } : {}),
    publisher: { "@type": "Organization", name: "TradeHQ", url: DOMAIN },
    isPartOf: {
      "@type": "Course",
      name: track.title,
      url: `${DOMAIN}/courses/${track.slug}`,
    },
    image: track.hero,
    timeRequired: `PT${lesson.readingMinutes}M`,
  };
  const handleSubmit = () => {
    setSubmitted(true);
    markLessonCompleted(track.slug, lesson.slug, score);
    // Check if all lessons of this track completed → award badge
    const progress = getTrackProgress(track.slug);
    const doneCount = track.lessons.filter(
      (l) => l.slug === lesson.slug || progress.lessons[l.slug]?.status === "completed",
    ).length;
    if (doneCount === track.lessons.length) {
      awardBadge(track.slug);
      toast.success(`🏆 Badge earned: ${track.badge.name}`, {
        description: "Great work — every lesson complete.",
      });
    } else {
      toast.success(`Lesson complete — ${score}/${lesson.quiz.length} correct`);
    }
  };

  const renderBody = () => {
    return lesson.body.map((para, i) => {
      if (para.startsWith("## ")) {
        return (
          <h2 key={i} className="text-2xl font-bold mt-8 mb-3 text-foreground">
            {para.slice(3)}
          </h2>
        );
      }
      if (para.startsWith("> ")) {
        return (
          <blockquote
            key={i}
            className="border-l-4 border-emerald-500/60 bg-emerald-500/5 pl-4 py-3 my-6 italic text-foreground/90"
          >
            {para.slice(2)}
          </blockquote>
        );
      }
      return (
        <p key={i} className="text-[15px] leading-relaxed text-foreground/80 mb-4">
          {para}
        </p>
      );
    });
  };

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={url} />
        <meta name="author" content={AUTHOR} />
        <meta property="article:author" content={AUTHOR} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={url} />
        <meta property="og:image" content={track.hero} />
        <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        <Navigation />
        <main data-publisher-notes={integratedLesson ? path : undefined} className="flex-1 container mx-auto px-4 pt-24 pb-20 max-w-3xl">
          <Breadcrumbs
            className="mb-4"
            items={[
              { label: "Home", href: "/" },
              { label: "Courses", href: "/courses" },
              { label: track.title, href: `/courses/${track.slug}` },
              { label: lesson.title },
            ]}
          />

          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
            <Badge variant="outline">{track.level}</Badge>
            <span>·</span>
            <span>Lesson {index + 1} of {track.lessons.length}</span>
            <span>·</span>
            <span>{lesson.readingMinutes} min read</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">{lesson.title}</h1>
          <p className="text-base text-muted-foreground mb-4">{lesson.summary}</p>
          {resumePct >= 10 && resumePct < 98 && getTrackProgress(track.slug).lessons[lesson.slug]?.status !== "completed" && (
            <button type="button" className="mb-5 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary underline underline-offset-4"
              onClick={() => window.scrollTo({ top: Math.round((document.documentElement.scrollHeight - window.innerHeight) * resumePct / 100), behavior: "smooth" })}>
              Resume reading near {resumePct}% of this lesson
            </button>
          )}
          {Object.keys(answers).length > 0 && !submitted && (
            <p className="mb-4 text-sm text-muted-foreground" role="status">
              {Object.keys(answers).length} quiz answer(s) restored from this browser. Your unfinished lesson is still in progress.
            </p>
          )}
          {(track.slug === "options-trading-fundamentals" || track.slug === "futures-and-derivatives") && (
            <aside role="note" className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm leading-relaxed text-foreground">
              <strong className="block mb-1">Contract worksheet only — no derivatives trading desk</strong>
              This lesson teaches hypothetical options or futures contract mechanics. TradeHQ’s $100,000 virtual desk supports only its listed spot-style practice instruments; it cannot open, value, margin, exercise or settle an options or futures contract. Work through the contract calculations here rather than entering the example as a simulated order.
            </aside>
          )}


          <div className="text-xs text-muted-foreground mb-6">
            {track.editorial ? <>Prepared with AI assistance · Publication review recorded by <span className="text-foreground font-medium">{track.editorial.reviewer}</span> · {new Date(track.editorial.reviewedAt).toLocaleDateString("en-GB")}</> : <>By <span className="text-foreground font-medium">{AUTHOR}</span></>}
          </div>

          {integratedLesson && <div className="text-sm text-muted-foreground mb-6 space-y-2">
            <p>Published by TradeHQ, created by Anuga Weerasinghe. <Link to="/about" className="underline">Publisher background and editorial approach</Link>. No independent professional review is claimed; any recorded source-check scope appears on the page.</p>
            {lesson.sourceCheck && <p>Source check: {lesson.sourceCheck.date}. {lesson.sourceCheck.scope}</p>}
          </div>}

          <div className="rounded-2xl overflow-hidden mb-8 bg-black aspect-[16/9]">
            <img src={track.hero} alt={`${lesson.title} — illustration`} width={1200} height={675} className="w-full h-full object-cover opacity-80" />
          </div>

          <AIAnswerBlock className="mb-8" question={lesson.title + "?"} answer={lesson.summary + " " + lesson.keyTakeaways.slice(0, 2).join(" ")} />

          <article className="prose prose-invert max-w-none">{renderBody()}</article>

          {/* Key takeaways */}
          <Card className="p-6 mt-8 bg-emerald-500/5 border-emerald-500/20">
            <h3 className="text-sm uppercase tracking-widest text-emerald-400 mb-3 inline-flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" /> Key Takeaways
            </h3>
            <ul className="space-y-2">
              {lesson.keyTakeaways.map((t, i) => (
                <li key={i} className="flex gap-2 text-sm text-foreground/90">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Quiz */}
          <div className="mt-10">
            <h2 className="text-2xl font-bold mb-1">Check Your Understanding</h2>
            <p className="text-sm text-muted-foreground mb-6">Answer all {lesson.quiz.length} questions to complete this lesson.</p>

            <div data-lesson-quiz className="space-y-5">
              {lesson.quiz.map((q, qi) => (
                <Card key={qi} className="p-5 bg-white/[0.02] border-white/10">
                  <div className="text-sm font-semibold mb-3">{qi + 1}. {q.question}</div>
                  <div className="space-y-2">
                    {q.options.map((opt, oi) => {
                      const chosen = answers[qi] === oi;
                      const correct = submitted && oi === q.correctAnswer;
                      const wrong = submitted && chosen && oi !== q.correctAnswer;
                      return (
                        <button
                          key={oi}
                          type="button"
                          onClick={() => { if (!submitted) { const updated = { ...answers, [qi]: oi }; setAnswers(updated); saveLessonDraft(track.slug, lesson.slug, updated); } }}
                          disabled={submitted}
                          className={`w-full text-left px-4 py-2.5 rounded-lg border text-sm transition-all ${
                            correct
                              ? "border-emerald-500 bg-emerald-500/10 text-emerald-100"
                              : wrong
                              ? "border-red-500 bg-red-500/10 text-red-100"
                              : chosen
                              ? "border-emerald-500/60 bg-emerald-500/5"
                              : "border-white/10 hover:border-white/30"
                          }`}
                        >
                          <span className="inline-flex items-center gap-2">
                            {correct && <CheckCircle2 className="w-4 h-4" />}
                            {wrong && <XCircle className="w-4 h-4" />}
                            {opt}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {submitted && (
                    <p className="mt-3 text-xs text-muted-foreground">
                      <strong className="text-foreground">Explanation:</strong> {q.explanation}
                    </p>
                  )}
                </Card>
              ))}
            </div>

            {!submitted ? (
              <Button
                onClick={handleSubmit}
                disabled={Object.keys(answers).length !== lesson.quiz.length}
                className="mt-6 w-full sm:w-auto"
                size="lg"
              >
                Submit & complete lesson
              </Button>
            ) : (
              <Card className="mt-6 p-5 bg-emerald-500/10 border-emerald-500/30">
                <div className="flex items-center gap-3">
                  <Award className="w-6 h-6 text-emerald-400" />
                  <div className="flex-1">
                    <div className="font-semibold">Lesson complete — {score}/{lesson.quiz.length}</div>
                    <div className="text-xs text-muted-foreground">Progress saved to your browser. Come back anytime.</div>
                  </div>
                  <Button variant="outline" size="sm" className="gap-1" asChild>
<Link to="/ai-mentor">
                      <Bot className="w-4 h-4" /> Ask the AI mentor
                    </Link>
</Button>
                </div>
              </Card>
            )}
          </div>

          {integratedLesson && <section aria-label="Lesson answer notes" className="mt-8">
            <h2 className="text-xl font-bold mb-3">Answer notes</h2>
            <ul className="space-y-4 text-sm text-muted-foreground list-disc pl-5">
              {lesson.quiz.map((q, i) => <li key={i}>{q.question} Options: {q.options.join("; ")}. Correct answer: {q.options[q.correctAnswer]}. Why: {q.explanation}</li>)}
            </ul>
          </section>}

          {/* Sources */}
          <Card className="mt-8 p-5 bg-white/[0.02] border-white/10">
            <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Sources & further reading</h3>
            <ul className="space-y-1.5">
              {lesson.sources.map((s, i) => (
                <li key={i}>
                  <a
                    href={s.url}
                    rel="noopener nofollow"
                    target="_blank"
                    className="text-sm text-emerald-400 hover:text-emerald-300 [.light_&]:text-emerald-800 [.light_&]:hover:text-emerald-900 inline-flex items-center gap-1"
                  >
                    {s.label} <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
              ))}
            </ul>
          </Card>

          {/* Prev / next */}
          <nav className="mt-10 flex items-center justify-between gap-3">
            {prev ? (
              <Link to={`/courses/${track.slug}/${prev.slug}`} className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                <ArrowLeft className="w-4 h-4" /> {prev.title}
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link to={`/courses/${track.slug}/${next.slug}`} className="text-sm text-emerald-400 hover:text-emerald-300 [.light_&]:text-emerald-800 [.light_&]:hover:text-emerald-900 inline-flex items-center gap-1 ml-auto">
                {next.title} <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link to={`/courses/${track.slug}`} className="text-sm text-emerald-400 hover:text-emerald-300 [.light_&]:text-emerald-800 [.light_&]:hover:text-emerald-900 inline-flex items-center gap-1 ml-auto">
                Back to track <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </nav>

          {integratedLesson && <section className="mt-8 text-sm text-muted-foreground space-y-3">
            <h2 className="text-xl font-bold text-foreground">Practise this lesson</h2>
            <p>Use $100,000 in virtual cash to practise supported spot instruments and general habits such as recording a trade thesis. Options contracts, Greeks, futures margin and daily settlement are conceptual exercises: calculate their examples in a worksheet, because TradeHQ does not execute derivatives contracts. Educational simulation only — not financial advice.</p>
            <nav aria-label="Course references" className="flex flex-wrap gap-4">
              <Link className="underline" to={`/courses/${track.slug}`}>{track.title}</Link>
              <Link className="underline" to="/courses">All courses</Link>
            </nav>
            <p>Educational simulation only — not financial advice. Virtual money; no brokerage transactions. Quotes may be delayed, cached, unavailable or fixed simulator values; generated charts are labelled separately. Practice results do not predict investment outcomes.</p>
          </section>}

          <div className="mt-10">
            <EducationalDisclaimer />
          </div>
        </main>
        <MegaFooter />
      </div>
    </>
  );
}
