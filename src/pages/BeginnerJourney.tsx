import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, CheckCircle2, ClipboardList, Compass, RotateCcw, ShieldCheck, Wallet } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { MegaFooter } from "@/components/MegaFooter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getPortfolio } from "@/lib/portfolio";
import { loadArena } from "@/lib/practiceArena";
import { JOURNEY_EVENT, journeyStage, readJourney, saveJourney } from "@/lib/beginnerJourney";
import { COURSE_PROGRESS_EVENT, COURSE_PROGRESS_KEY, loadProgress } from "@/lib/courseProgress";
import { buildLearningOverview } from "@/lib/learningOverview";
import { useCourseCatalog } from "@/hooks/useCourseCatalog";
import type { Portfolio } from "@/lib/types";

const steps = [
  { title: "Understand", summary: "Learn what a practice trade actually does." },
  { title: "Practise", summary: "Place a virtual order yourself." },
  { title: "Portfolio", summary: "Read your real simulated transaction figures." },
  { title: "Reflect", summary: "Write down what changed and why." },
  { title: "Continue", summary: "Study the next concept and try Daily Practice." },
];
const money = (value: number) => value.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });

export default function BeginnerJourney() {
  const [progress, setProgress] = useState(readJourney);
  const [portfolio, setPortfolio] = useState<Portfolio>(getPortfolio);
  const [answer, setAnswer] = useState("");
  const [reflection, setReflection] = useState(() => readJourney().reflection);
  const stage = journeyStage(progress);
  const { data: publishedCourses, tracks, isError: courseCatalogError, refetch: refreshCatalog } = useCourseCatalog();
  const [courseProgress, setCourseProgress] = useState(loadProgress);
  const courseOverview = buildLearningOverview(tracks, courseProgress, progress);
  const recentCourse = courseOverview.next;
  const newPublishedCourses = publishedCourses ?? [];
  // The optional warm-up does not change the five-stage beginner progress,
  // record an actual portfolio trade, or sync any Arena decision to Supabase.
  const arenaWarmup = loadArena();
  const beginnerWarmupCompleted = Boolean(arenaWarmup.completions["first-order"]);
  const beginnerWarmupInProgress = Boolean(arenaWarmup.active?.scenarioId === "first-order" &&
    !arenaWarmup.active.finishedAt && arenaWarmup.active.decisions.length > 0);

  useEffect(() => {
    const refresh = () => {
      const savedJourney = readJourney();
      setProgress(savedJourney);
      setReflection(savedJourney.reflection);
      setPortfolio(getPortfolio());
      setCourseProgress(loadProgress());
    };
    const onStorage = (event: StorageEvent) => {
      if (!event.key || [COURSE_PROGRESS_KEY, "tradehq:beginner-journey:v1"].includes(event.key)) refresh();
    };
    window.addEventListener(JOURNEY_EVENT, refresh);
    window.addEventListener(COURSE_PROGRESS_EVENT, refresh);
    window.addEventListener("tradehq:portfolio-updated", refresh);
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(JOURNEY_EVENT, refresh);
      window.removeEventListener(COURSE_PROGRESS_EVENT, refresh);
      window.removeEventListener("tradehq:portfolio-updated", refresh);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const update = (patch: Parameters<typeof saveJourney>[0]) => setProgress(saveJourney(patch));
  const trade = portfolio.trades.find(t => t.id === progress.tradeId);
  const gross = trade ? trade.quantity * trade.price : 0;
  const estimatedFee = trade ? Math.abs(trade.total - gross) : 0;
  const totalSteps = stage === 4 && progress.completedAt ? 5 : stage;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>Start Here — Your First Virtual Trade Journey | TradeHQ</title>
        <meta name="description" content="A guided beginner lesson, voluntary virtual trade, portfolio reflection and next practice steps. Free, no real money and no account required." />
        <link rel="canonical" href="https://www.thetradehq.com/start" />
      </Helmet>
      <Navigation />
      <main className="container max-w-5xl mx-auto px-4 sm:px-6 pt-28 pb-20 flex-1">
        <header className="mb-8">
          <p className="text-xs uppercase tracking-[0.18em] text-primary font-semibold">Start here · TradeHQ learning journey</p>
          <h1 className="mt-3 text-3xl sm:text-5xl font-bold tracking-tight">Your first virtual trade, explained.</h1>
          <p className="mt-4 text-base text-muted-foreground max-w-3xl leading-relaxed">
            Five connected steps: understand an order, practise once, see where the money went, reflect, and learn what to try next.
            Every example is educational. No brokerage account or real money is involved.
          </p>
        </header>
        <Card className="p-4 sm:p-6 mb-6">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="font-semibold">Your progress</h2>
            <span aria-live="polite" className="text-sm text-muted-foreground">{totalSteps} of 5 steps completed</span>
          </div>
          <div className="grid grid-cols-5 gap-1.5 sm:gap-3" role="list" aria-label="Learning journey progress">
            {steps.map((step, i) => (
              <div key={step.title} role="listitem">
                <div aria-hidden="true" className={`h-2 rounded-full ${i < totalSteps ? "bg-primary" : i === stage ? "bg-primary/40" : "bg-muted"}`} />
                <p className={`mt-2 text-[11px] sm:text-sm font-medium ${i === stage ? "text-primary" : "text-muted-foreground"}`}>{step.title}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Your place is saved on this browser; when signed in, lesson and journey progress also sync privately to your account when online. Portfolio backups protect separate trading history, not course progress.</p>
        </Card>

        <Card className="p-5 sm:p-8 space-y-5" aria-live="polite">
          <div className="flex items-center gap-2 text-primary text-sm font-semibold"><Compass className="h-4 w-4" /> Step {stage + 1} of 5 · {steps[stage].title}</div>
          {stage === 0 && <>
            <h2 className="text-2xl font-bold">A quote is not a guaranteed execution price.</h2>
            <p className="text-muted-foreground leading-relaxed">
              Imagine buying two shares of a fictional company, Northstar, at a displayed price of $50 each. The quoted trade value would be $100.
              If the simulator charges a 0.1% fee, the estimated total cost is $100.10. In real markets, a market order may execute at a different price from the last quote.
            </p>
            <div className="rounded-xl bg-muted/50 p-4 text-sm space-y-1">
              <p>2 shares × $50 = <strong>$100.00</strong> before fees</p>
              <p>$100 × 0.001 = <strong>$0.10</strong> simulated fee</p>
              <p>Estimated cash used = <strong>$100.10</strong></p>
            </div>
            <p className="text-sm font-medium">Which statement is accurate?</p>
            <div className="space-y-2">
              {[
                ["guaranteed", "The last displayed quote guarantees the final execution price."],
                ["different", "The execution price can differ; fees also change the cash used."],
                ["profit", "Buying a share guarantees a positive return."],
              ].map(([value, label]) => (
                <button key={value} type="button" aria-pressed={answer === value}
                  onClick={() => setAnswer(value)}
                  className={`w-full text-left min-h-12 rounded-xl border px-4 py-3 text-sm transition ${answer === value ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}>
                  {label}
                </button>
              ))}
            </div>
            {answer && answer !== "different" && <p role="status" className="text-sm text-amber-500">Not quite. A quote is a reference, not a guaranteed fill price or return.</p>}
            <a className="text-sm text-primary underline" href="https://www.investor.gov/introduction-investing/investing-basics/how-stock-markets-work/types-orders" target="_blank" rel="noopener noreferrer">Source: U.S. SEC Investor.gov — Types of Orders</a>
            <Button disabled={answer !== "different"} onClick={() => update({ lessonCompleted: true })}>Continue to practice <ArrowRight className="ml-2 h-4 w-4" /></Button>
          </>}
          {stage === 1 && <>
            <h2 className="text-2xl font-bold">Place one virtual order yourself.</h2>
            <p className="text-muted-foreground leading-relaxed">
              Open the existing trading terminal with AAPL selected as an illustration. Check the displayed quote source, quantity, estimated total and the fee before confirming.
              The price can change; the displayed symbol is an exercise, <strong>not a recommendation</strong>. You can choose another asset.
            </p>
            <section aria-label="Optional fictional warm-up before your first virtual trade" className="rounded-2xl border border-primary/30 bg-primary/[0.045] p-4 sm:p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                <RotateCcw className="h-4 w-4 shrink-0" aria-hidden />
                Optional warm-up · About 3–5 minutes
              </div>
              <h3 className="text-lg font-semibold tracking-tight">Want to try a fictional decision first?</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Before using your main virtual portfolio, practise five invented price snapshots.
                See how a purchase changes cash, holdings and a model fee. Nothing from this
                exercise can alter your $100,000 practice balance or leaderboard.
              </p>
              {beginnerWarmupCompleted && <p className="text-xs font-medium text-primary" role="status">
                You've completed this fictional warm-up in this browser. You can revisit it, or continue straight to the terminal.
              </p>}
              {!beginnerWarmupCompleted && beginnerWarmupInProgress && <p className="text-xs font-medium text-primary" role="status">
                Your unfinished fictional warm-up is saved on this device. Resume whenever you're ready.
              </p>}
              <Button asChild variant="outline">
                <Link to="/practice?from=start">
                  {beginnerWarmupInProgress ? "Resume fictional warm-up" : beginnerWarmupCompleted ? "Review fictional practice" : "Try fictional practice first"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <p className="text-xs text-muted-foreground">You may skip this warm-up entirely. It doesn't add a sixth requirement or count as a trade.</p>
            </section>
            <p className="rounded-xl border border-border p-4 text-sm">Your $100,000 practice portfolio will be used in the guided terminal below, not in the fictional warm-up. This journey never submits an order automatically. Once your order succeeds, return here to see its recorded numbers.</p>
            <Button asChild><Link to="/trade?journey=1">Open guided practice terminal <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
            <p className="text-xs text-muted-foreground">If you leave halfway, return to /start tomorrow; this step remains available.</p>
          </>}
          {stage === 2 && <>
            <h2 className="text-2xl font-bold">Where did your virtual money go?</h2>
            <p className="text-muted-foreground">These figures come from your saved simulated portfolio, not a sample screenshot.</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                ["Cash remaining", money(portfolio.cash)],
                ["Portfolio total", money(portfolio.totalValue)],
                ["Open positions", String(portfolio.positions.length)],
                ["Practice trades", String(portfolio.trades.length)],
              ].map(([label, value]) => <div key={label} className="p-4 bg-muted/40 rounded-xl"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-bold text-xl tabular-nums">{value}</p></div>)}
            </div>
            {trade ? <div className="rounded-xl border border-border p-4 text-sm space-y-2">
              <p><strong>Recorded {trade.type}:</strong> {trade.quantity} {trade.symbol} × {money(trade.price)} = {money(gross)} before fees.</p>
              <p>Calculated fee: {money(estimatedFee)}. Total recorded cash movement: {money(trade.total)}.</p>
              <p className="text-muted-foreground">An open position's value changes with displayed practice prices. Unrealized P&L is not cash received or guaranteed.</p>
            </div> : <p className="text-amber-500 text-sm">Your guided order is not currently available in this browser. Refresh your account portfolio or place another guided practice order before reflecting.</p>}
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" asChild><Link to="/portfolio">Open full portfolio</Link></Button>
              <Button disabled={!trade} onClick={() => update({ portfolioExplained: true })}>I understand my portfolio <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </div>
          </>}
          {stage === 3 && <>
            <h2 className="text-2xl font-bold">Reflect on the decision, not the profit.</h2>
            <p className="text-muted-foreground">Write down what you expected from your virtual order, what the recorded price and fee showed, and one thing you'd check before the next exercise.</p>
            <label htmlFor="journey-reflection" className="text-sm font-medium">Your private learning reflection</label>
            <textarea id="journey-reflection" value={reflection} maxLength={1200} rows={5}
              onChange={e => { setReflection(e.target.value); update({ reflection: e.target.value }); }}
              placeholder="I expected ... I noticed ... Next time I will check ..."
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            <p className="text-xs text-muted-foreground">New reflection text stays in this browser. If you're signed in, your completed steps can sync privately across devices.</p>
            <Button disabled={reflection.trim().length < 15} onClick={() => update({ reflection: reflection.trim(), completedAt: new Date().toISOString() })}>
              Complete my first journey <CheckCircle2 className="ml-2 w-4 h-4" />
            </Button>
          </>}
          {stage === 4 && <>
            <h2 className="text-2xl font-bold">You've completed your first learning journey.</h2>
            <p className="text-muted-foreground">Finishing one practice trade doesn't establish real-world readiness. Keep improving the process: revisit costs, risk, diversification and your own assumptions.</p>
            {!progress.completedAt && <Button onClick={() => update({ completedAt: new Date().toISOString() })}>Mark learning journey complete</Button>}
            <div className="grid sm:grid-cols-2 gap-3">
              <Link to="/learn/article/risk-management-in-trading" className="rounded-xl border border-border p-4 hover:border-primary/60"><BookOpen className="w-5 h-5 text-primary mb-2" /><strong>Next lesson: risk</strong><p className="text-sm text-muted-foreground mt-1">Learn why an exit price is not always guaranteed.</p></Link>
              <Link to="/daily" className="rounded-xl border border-primary/50 p-4 bg-primary/5 hover:bg-primary/10"><ClipboardList className="w-5 h-5 text-primary mb-2" /><strong>Try today's Daily Practice</strong><p className="text-sm text-muted-foreground mt-1">Build a habit using short educational challenges.</p></Link>
              <Link to="/practice" className="rounded-xl border border-border p-4 hover:border-primary/60 transition-colors"><RotateCcw className="w-5 h-5 text-primary mb-2" /><strong>Practice Arena: decide and reveal</strong><p className="text-sm text-muted-foreground mt-1">Try small fictional market decisions without changing your real practice portfolio.</p></Link>
            </div>
            <Button variant="outline" asChild><Link to="/portfolio"><Wallet className="w-4 h-4 mr-2" /> Review my portfolio again</Link></Button>
          </>}
        </Card>

        <section className="mt-6 grid md:grid-cols-2 gap-4">
          <Card className="p-5">
            <h2 className="font-semibold flex gap-2 items-center"><RotateCcw className="w-4 h-4 text-primary" /> Resume a course</h2>
            <p className="mt-2 text-sm text-muted-foreground">Resume your unfinished lesson, or follow the next approved course in your learning path. When a new course is published, this recommendation refreshes automatically without erasing your saved progress.</p>
            <Link className="mt-3 inline-flex gap-1 text-sm font-semibold text-primary" to={recentCourse?.href ?? "/courses"}>
              {recentCourse ? `${recentCourse.inProgress ? "Resume" : "Next lesson"}: ${recentCourse.title}` : "Browse structured courses"} <ArrowRight className="w-4 h-4" />
            </Link>
          </Card>
          <Card className="p-5">
            <h2 className="font-semibold flex gap-2 items-center"><ClipboardList className="w-4 h-4 text-primary" /> Come back every day</h2>
            <p className="mt-2 text-sm text-muted-foreground">Daily Practice is available throughout the journey, not only after completion. Use its short exercises to reinforce lessons.</p>
            <Link className="mt-3 inline-flex gap-1 text-sm font-semibold text-primary" to="/daily">Open Daily Practice <ArrowRight className="w-4 h-4" /></Link>
          </Card>
        </section>
        <section className="mt-6 rounded-2xl border border-border bg-card/80 p-5 sm:p-6" aria-label="Approved course releases in your journey">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h2 className="font-semibold text-lg flex items-center gap-2"><BookOpen className="w-5 h-5 text-primary" /> Courses added to your journey</h2>
              <p className="mt-1 text-sm text-muted-foreground max-w-2xl">Owner-approved course releases appear here automatically—including monthly releases. AI-generated drafts never enter your journey before publication. Your earlier lesson completions stay saved.</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => void refreshCatalog()}>Check for courses</Button>
          </div>
          {courseCatalogError && <p role="status" className="mt-3 text-sm text-amber-600">The newest approved catalog could not be loaded. Existing courses are still available.</p>}
          {newPublishedCourses.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-3 mt-4">
              {newPublishedCourses.map(course => {
                const lessonsDone = course.lessons.filter(lesson => courseProgress.tracks[course.slug]?.lessons[lesson.slug]?.status === "completed").length;
                const inProgress = course.lessons.find(lesson => courseProgress.tracks[course.slug]?.lessons[lesson.slug]?.status === "in-progress");
                return (
                  <Link key={course.slug} to={inProgress ? `/courses/${course.slug}/${inProgress.slug}` : `/courses/${course.slug}`} className="rounded-xl border border-border p-4 hover:border-primary/60 transition-colors">
                    <strong className="block text-sm">{course.title}</strong>
                    <p className="mt-1 text-xs text-muted-foreground">{lessonsDone}/{course.lessons.length} lessons complete · {inProgress ? "Resume current lesson" : "Explore course"} </p>
                    <span className="mt-2 inline-flex items-center gap-1 text-sm text-primary font-semibold">Continue learning <ArrowRight className="w-4 h-4" /></span>
                  </Link>
                );
              })}
            </div>
          ) : !courseCatalogError ? <p className="mt-4 text-sm text-muted-foreground">No newly published catalog additions loaded yet. Your existing courses and progress remain available.</p> : null}
        </section>
        <p className="mt-6 text-xs text-muted-foreground flex gap-2 items-center"><ShieldCheck className="h-4 w-4" /> TradeHQ is educational simulation software. No investment returns or market execution are promised.</p>
      </main>
      <MegaFooter />
    </div>
  );
}
