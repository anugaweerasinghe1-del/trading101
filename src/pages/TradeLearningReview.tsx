import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, BookOpenCheck, CheckCircle2, ShieldCheck } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { MegaFooter } from "@/components/MegaFooter";
import { getPortfolio } from "@/lib/portfolio";
import { useAuth } from "@/hooks/useAuth";
import { getAccountPortfolio, subscribeAccountPortfolio } from "@/lib/cloudPortfolio";
import { markLessonCompleted } from "@/lib/courseProgress";
import { TRADE_REVIEW_TRACK, TRADE_REVIEW_LESSON, TRADE_RECALL_LESSON } from "@/lib/retentionLearning";
import { tradeReviewQuestion } from "@/lib/tradeReviewQuestions";
import { recordConsentedLearningVisit, trackLearningMilestone } from "@/lib/learningTelemetry";

const money = (n: number) => Number.isFinite(n)
  ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n)
  : "Unavailable";

/** A voluntary knowledge check tied to the recorded order, never a trade prompt. */
export default function TradeLearningReview() {
  const [query] = useSearchParams();
  const recall = query.get("review") === "1";
  const { user, loading: authLoading } = useAuth();
  const account = useSyncExternalStore(subscribeAccountPortfolio, () => getAccountPortfolio(user?.id), () => null);
  const [portfolio, setPortfolio] = useState(getPortfolio);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [saved, setSaved] = useState(false);
  const [useExample, setUseExample] = useState(false);

  useEffect(() => {
    recordConsentedLearningVisit();
    trackLearningMilestone("Trade Review Viewed");
  }, [recall]);

  useEffect(() => {
    const refresh = () => setPortfolio(getPortfolio());
    window.addEventListener("tradehq:portfolio-updated", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("tradehq:portfolio-updated", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  // Signed-in transactions come from their own confirmed account snapshot;
  // never substitute another browser user's cached trade while auth loads.
  const trade = useExample ? undefined : (user ? account?.portfolio?.trades : portfolio.trades)?.[0];
  const accountPending = !useExample && (authLoading || Boolean(user && !account?.portfolio));
  const illustrative = !trade;
  const side = trade?.type ?? "buy";
  // A standalone fictitious example lets non-traders learn without placing an
  // order. The real figure comes only from the currently visible owner cache.
  const quantity = trade?.quantity ?? 2;
  const price = trade?.price ?? 50;
  const gross = quantity * price;
  const fee = trade ? Math.abs(trade.total - gross) : gross * 0.001;
  const cashMovement = trade ? trade.total : gross + fee;
  const goodNumbers = [gross, fee, cashMovement].every(Number.isFinite);

  const lessonQuestion = useMemo(() => tradeReviewQuestion(side, recall), [side, recall]);
  const didAnswerCorrectly = selected === lessonQuestion.correctIndex;

  useEffect(() => {
    setSelected(null);
    setSubmitted(false);
    setSaved(false);
  }, [recall, side, useExample]);

  function persistReview(): boolean {
    if (selected === null) return false;
    // A wrong response records an attempt, never proof of mastery.
    const stored = markLessonCompleted(
      TRADE_REVIEW_TRACK, recall ? TRADE_RECALL_LESSON : TRADE_REVIEW_LESSON,
      didAnswerCorrectly ? 100 : 0,
    );
    if (stored) trackLearningMilestone("Trade Review Completed");
    return stored;
  }

  function submit() {
    if (selected === null || submitted) return;
    setSaved(persistReview());
    setSubmitted(true);
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>{recall ? "Recall Your Lesson" : "Understand a Virtual Trade"} | TradeHQ</title>
        <meta name="description" content="Review a simulated trade's cash movement and fees, then check your understanding. Free educational practice." />
        <meta name="robots" content="noindex, follow" />
      </Helmet>
      <Navigation />
      <main className="container mx-auto w-full max-w-3xl flex-1 px-4 pb-20 pt-28 sm:px-6">
        <Link to={trade ? "/portfolio" : "/learn"} className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> {trade ? "Back to portfolio" : "Back to learning"}
        </Link>
        <header className="mt-5 mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">{recall ? "A short knowledge refresh" : "Learn from practice"}</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{recall ? "See what you remember." : "Understand what your virtual order did."}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            One explanation, one question. No new orders, real money, streaks or public scores.
          </p>
        </header>

        <section className="rounded-2xl border border-border bg-card/70 p-5 sm:p-7" aria-labelledby="review-transaction">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">{accountPending ? "Fictional example while account history loads" : illustrative ? "Fictional example — no trade placed" : "Your last recorded virtual order"}</p>
          <h2 id="review-transaction" className="mt-2 text-xl font-semibold">{illustrative ? "Two imaginary shares" : `${trade?.type === "buy" ? "Bought" : "Sold"} ${trade?.symbol}`}</h2>
          {accountPending && (
            <div role="status" className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
              <p className="text-xs text-muted-foreground">Checking your private account history. You can also learn from an explicitly fictional example.</p>
              <button type="button" onClick={() => setUseExample(true)} className="min-h-11 rounded-xl border border-border px-3 py-2 text-xs font-medium hover:bg-muted">Use fictional example</button>
            </div>
          )}
          <p className="mt-2 text-sm text-muted-foreground">
            {goodNumbers ? `${quantity} × ${money(price)} = ${money(gross)} before the simulated fee of ${money(fee)}.` : "This transaction has an unavailable numeric value. Review its record in your portfolio."}
          </p>
          {goodNumbers && (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-background/80 p-4">
                <p className="text-xs text-muted-foreground">Recorded {side === "buy" ? "cost" : "proceeds"} after fee</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">{money(cashMovement)}</p>
              </div>
              <div className="rounded-xl bg-background/80 p-4">
                <p className="text-xs text-muted-foreground">Simulated transaction fee</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">{money(fee)}</p>
              </div>
            </div>
          )}
          <p className="mt-4 text-sm text-muted-foreground">
            {side === "buy"
              ? "A buy uses virtual cash to cover its recorded purchase and fee."
              : "A sell adds the net virtual proceeds after its fee."}
            {" "}Quotes can change; the recorded execution is the relevant historical figure. This is an educational example, not financial advice.
          </p>
        </section>

        <section className="mt-5 rounded-2xl border border-primary/30 bg-primary/[0.04] p-5 sm:p-7" aria-labelledby="review-question">
          <div className="mb-4 flex items-center gap-2 text-primary"><BookOpenCheck className="h-5 w-5" /><span className="text-xs font-semibold uppercase tracking-widest">Check your understanding</span></div>
          <h2 id="review-question" className="text-lg font-semibold">{lessonQuestion.question}</h2>
          <fieldset className="mt-5 space-y-2" disabled={submitted || accountPending}>
            <legend className="sr-only">Select one answer</legend>
            {lessonQuestion.options.map((option, index) => (
              <label key={option} className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm transition-colors ${selected === index ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"}`}>
                <input type="radio" name="review-answer" value={index} checked={selected === index} onChange={() => setSelected(index)} className="accent-primary" />
                <span>{option}</span>
              </label>
            ))}
          </fieldset>
          {submitted && <div role="status" aria-live="polite" className="mt-5 rounded-xl border border-border bg-background/70 p-4">
            <p className="flex items-center gap-2 font-semibold"><CheckCircle2 className="h-4 w-4 text-primary" />{didAnswerCorrectly ? "That's correct." : "Not quite—here's the key idea."}</p>
            <p className="mt-2 text-sm text-muted-foreground">{lessonQuestion.explanation}</p>
            <p className="mt-2 text-xs text-muted-foreground">{saved ? "Your review is saved in this browser and can synchronize privately when signed in." : "Your answer was checked, but browser storage was unavailable; this result was not saved."}</p>
          </div>}
          <div className="mt-6 flex flex-wrap gap-3">
            {!submitted ? (
              <button type="button" disabled={selected === null || accountPending} onClick={submit} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50">
                Check my answer <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            ) : (
              <>
                {!saved && <button type="button" onClick={() => setSaved(persistReview())} className="inline-flex min-h-11 items-center rounded-xl border border-primary/30 px-4 py-2 text-sm font-medium">Retry saving</button>}
                <Link to="/learn" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">Continue learning <ArrowRight className="ml-2 h-4 w-4" /></Link>
                <Link to="/portfolio" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-border px-5 py-3 text-sm font-medium">Review portfolio</Link>
              </>
            )}
          </div>
        </section>
        <p className="mt-5 flex items-start gap-2 text-xs text-muted-foreground"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" /> Review activity is private educational progress, not a leaderboard metric or trading competence certificate.</p>
      </main>
      <MegaFooter />
    </div>
  );
}
