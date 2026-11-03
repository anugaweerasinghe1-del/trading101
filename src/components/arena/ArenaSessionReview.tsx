import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpenCheck, MessageSquare } from "lucide-react";
import { arenaOutcome, scenarioById, type ArenaSession } from "@/lib/practiceArena";

const fmt = (value: number) => value.toLocaleString("en-US", {
  style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2,
});

type Feedback = "useful" | "confusing" | "too-easy";

/** Educational review only: no API writes, ranking claims, or analytics tracking. */
export function ArenaSessionReview({
  session, onReflectionChange,
}: {
  session: ArenaSession;
  onReflectionChange: (text: string) => void;
}) {
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const outcome = arenaOutcome(session);
  const scenario = scenarioById(session.scenarioId);

  return (
    <>
      <section className="mt-5 rounded-2xl border border-border bg-muted/30 p-4" aria-labelledby="arena-result-math">
        <h3 id="arena-result-math" className="text-sm font-semibold">Why did my exercise balance change?</h3>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="text-muted-foreground">Effect of fictional price movements</dt>
            <dd className="font-semibold tabular-nums">{fmt(outcome.priceEffect)}</dd>
          </div>
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="text-muted-foreground">Simulated transaction fees</dt>
            <dd className="font-semibold tabular-nums">−{fmt(outcome.fees)}</dd>
          </div>
          <div className="flex flex-wrap justify-between gap-2 border-t border-border pt-2">
            <dt className="font-semibold">Total exercise change</dt>
            <dd className="font-semibold tabular-nums">{fmt(outcome.totalChange)}</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          Price effect includes changes in units you still hold. It is not necessarily realized profit or loss.
          All prices and outcomes here are deliberately fictional.
        </p>
      </section>

      <details className="mt-4 rounded-2xl border border-border bg-card/60 p-4">
        <summary className="cursor-pointer text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
          <BookOpenCheck className="mr-2 inline h-4 w-4 text-primary" aria-hidden />
          Review all five decisions and my reasons
        </summary>
        <ol className="mt-4 space-y-3">
          {session.decisions.map((decision, i) => (
            <li key={decision.step} className="border-t border-border/70 pt-3 text-xs leading-relaxed">
              <div className="flex flex-wrap justify-between gap-2">
                <strong>
                  Round {decision.step}: {decision.action === "hold" ? "Observed" : decision.action === "buy" ? "Bought" : "Sold"}
                  {decision.units > 0 ? " " + decision.units + (decision.units === 1 ? " unit" : " units") : ""}
                </strong>
                <span className="tabular-nums text-muted-foreground">{fmt(decision.price)} → {fmt(decision.nextPrice)}</span>
              </div>
              <p className="mt-1 text-muted-foreground">
                After this round: {fmt(decision.markedEquity)} marked equity; {fmt(decision.fee)} in fees
              </p>
              {decision.note && <p className="mt-2 whitespace-pre-wrap break-words rounded-lg bg-muted/50 p-2">
                <span className="font-semibold">Your stated reason:</span> {decision.note}
              </p>}
              <p className="mt-2 text-muted-foreground">{scenario?.scenes[i]?.insight}</p>
            </li>
          ))}
        </ol>
      </details>

      <section className="mt-4 rounded-2xl border border-border p-4">
        <label htmlFor="arena-final-reflection" className="text-sm font-semibold">
          What would you test differently next time?
        </label>
        <textarea
          id="arena-final-reflection"
          rows={2}
          maxLength={400}
          value={session.finalReflection ?? ""}
          onChange={event => onReflectionChange(event.target.value)}
          placeholder="A short note for your next practice session (optional)"
          className="arena-textarea mt-3 block w-full rounded-xl border border-border bg-background/75 p-3 text-sm leading-relaxed resize-y focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
        <p className="mt-1 text-xs text-muted-foreground">Saved in this browser only, until you start a different exercise. Not submitted or shared.</p>
      </section>

      <section className="mt-4 rounded-2xl border border-border p-4" aria-labelledby="arena-feedback-heading">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" aria-hidden />
          <h3 id="arena-feedback-heading" className="text-sm font-semibold">Was this exercise useful?</h3>
        </div>
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Choose optional feedback">
          {([
            { id: "useful" as const, label: "Useful" },
            { id: "confusing" as const, label: "Confusing" },
            { id: "too-easy" as const, label: "Too easy" },
          ]).map(item => (
            <button type="button" key={item.id} aria-pressed={feedback === item.id}
              onClick={() => setFeedback(item.id)}
              className={"min-h-11 rounded-xl border px-3 text-xs font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary " +
                (feedback === item.id ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted")}>
              {item.label}
            </button>
          ))}
        </div>
        {feedback && (
          <div className="mt-3 space-y-2 text-xs leading-relaxed text-muted-foreground">
            <p>Your choice has <strong>not</strong> been sent to TradeHQ.</p>
            <Link
              className="inline-flex min-h-11 items-center gap-1 text-primary font-semibold underline underline-offset-4"
              to={"/contact?source=practice-arena&rating=" + feedback}>
              Open an optional feedback email draft <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </section>
    </>
  );
}
