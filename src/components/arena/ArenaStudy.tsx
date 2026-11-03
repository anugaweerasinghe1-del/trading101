import { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Clipboard, FlaskConical, Mail, ShieldCheck } from "lucide-react";

type Experience = "" | "new" | "returning" | "intermediate";
type BeforeAnswer = "" | "fee" | "notional" | "zero";
type AfterAnswer = "" | "fee" | "notional" | "zero";
type ComeBack = "" | "yes" | "maybe" | "no";

/**
 * An optional, non-identifying guided usability study.
 * Form state stays in React memory; no HTTP POST, hidden tracking API,
 * participant identity, portfolio import or automatically sent email.
 */
export function ArenaStudy({ completedScenario, completedAt, inProgress }: { completedScenario: string | null; completedAt: string | null; inProgress: boolean }) {
  const [pageOpenedAt] = useState(() => Date.now());
  const [open, setOpen] = useState(() =>
    typeof window !== "undefined" && new URLSearchParams(window.location.search).get("study") === "1");
  const [experience, setExperience] = useState<Experience>("");
  const [before, setBefore] = useState<BeforeAnswer>("");
  const [after, setAfter] = useState<AfterAnswer>("");
  const [clarity, setClarity] = useState<number>(0);
  const [comeBack, setComeBack] = useState<ComeBack>("");
  const [friction, setFriction] = useState("");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "unavailable">("idle");
  const finished = completedScenario !== null && completedAt !== null &&
    Number.isFinite(Date.parse(completedAt)) && Date.parse(completedAt) >= pageOpenedAt;
  const canShare = finished && experience !== "" && before !== "" && after !== "" &&
    clarity > 0 && comeBack !== "";

  const report = useMemo(() => [
    "TradeHQ Practice Arena — voluntary usability feedback",
    "Test date (UTC): " + new Date().toISOString().slice(0, 10),
    "Experience: " + (experience || "not selected"),
    "Scenario completed: " + (completedScenario || "not yet completed"),
    "Before exercise — immediate $100 purchase/equity change: " + (before || "not answered"),
    "After exercise — immediate $200 purchase/equity change: " + (after || "not answered"),
    "Clarity rating (1=unclear, 5=very clear): " + (clarity || "not rated"),
    "Would voluntarily return: " + (comeBack || "not answered"),
    "One thing to improve: " + (friction.trim() || "not provided"),
    "",
    "This email was explicitly prepared by the participant. No name, username, account, holdings, or private trading notes were automatically included.",
  ].join("\n"), [experience, completedScenario, before, after, clarity, comeBack, friction]);

  function prepareEmail() {
    if (!canShare) return;
    // Compute the mailto URL *only on click*. Personal observations must never
    // appear in a rendered href/DOM attribute: replay masking does not cover attributes.
    const subject = encodeURIComponent("TradeHQ Practice Arena — voluntary user test");
    window.location.href = "mailto:anugaweerasinghe1@gmail.com?subject=" +
      subject + "&body=" + encodeURIComponent(report);
  }

  async function copyReport() {
    if (!canShare) return;
    try {
      if (!navigator.clipboard?.writeText) throw Error("Clipboard unavailable");
      await navigator.clipboard.writeText(report);
      setCopyState("copied");
    } catch { setCopyState("unavailable"); }
  }
  return (
    <section id="arena-study" className="arena-study scroll-mt-28 mt-10 rounded-[1.6rem] border border-border bg-card/75 p-5 sm:p-7" aria-labelledby="arena-study-title">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[.12em] uppercase text-primary">
            <FlaskConical className="h-4 w-4" aria-hidden /> Optional research pilot
          </span>
          <h2 id="arena-study-title" className="mt-2 text-lg sm:text-xl font-semibold tracking-tight">Help us make practice genuinely useful.</h2>
          <p className="mt-1 text-sm text-muted-foreground max-w-xl">Try one exercise, then tell us what made sense and what didn't. About five minutes. No account or personal details required.</p>
        </div>
        <button type="button" aria-expanded={open} aria-controls="arena-study-content"
          onClick={() => setOpen(value => !value)}
          className="min-h-11 w-full sm:w-auto shrink-0 rounded-xl border border-primary/45 px-5 py-2 text-sm font-semibold text-primary hover:bg-primary/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
          {open ? "Close research questions" : "Help test the Arena"}
        </button>
      </div>
      {open && <div id="arena-study-content" className="amp-block mt-6 border-t border-border pt-6 space-y-6">
        <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-primary shrink-0" aria-hidden />
          Answers stay in this open page until you choose to copy or open an email draft. They aren't saved to the TradeHQ database. Do not include names, contact details or financial information. General analytics have separate consent controls.
        </p>
        <div className="grid gap-5 md:grid-cols-2">
          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold">1. Your experience</legend>
            <p className="text-xs text-muted-foreground">Choose the closest description, without sharing personal details.</p>
            {([
              { id: "new" as const, label: "I'm new to virtual trading" },
              { id: "returning" as const, label: "I've practised a few times" },
              { id: "intermediate" as const, label: "I have a repeatable practice process" },
            ]).map(option => <label key={option.id} className="flex min-h-11 items-center gap-3 rounded-xl border border-border px-3 py-2 text-sm cursor-pointer">
              <input type="radio" name="arena-research-level" checked={experience === option.id} onChange={() => setExperience(option.id)} className="accent-primary" />
              {option.label}
            </label>)}
          </fieldset>
          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold">2. Before you start: a quick concept check</legend>
            <p className="text-xs leading-relaxed text-muted-foreground">With $10,000 in exercise equity, you buy one fictional share for $100, paying a 0.1% fee. At the same market price, how much has your equity changed immediately?</p>
            {([
              { id: "fee" as const, label: "Decreased by $0.10" },
              { id: "notional" as const, label: "Decreased by $100.10" },
              { id: "zero" as const, label: "No change" },
            ]).map(option => <label key={option.id} className="flex min-h-11 items-center gap-3 rounded-xl border border-border px-3 py-2 text-sm cursor-pointer">
              <input type="radio" name="arena-research-before" checked={before === option.id} onChange={() => setBefore(option.id)} className="accent-primary" />
              {option.label}
            </label>)}
          </fieldset>
        </div>
        {!finished ? <div className="rounded-xl bg-muted/40 p-4 text-sm">
          <p className="font-semibold">3. Complete one Arena scenario.</p>
          <p className="mt-1 text-muted-foreground leading-relaxed">Select an exercise above. Make the five decisions yourself, review the outcome, and notice whether the explanations clarify the virtual cash movements. You can observe without trading.</p>
          {inProgress
            ? <p className="mt-2 text-xs text-muted-foreground">You already have an exercise open above. Finish its five decisions to unlock the after-exercise questions.</p>
            : <a href="#arena-chooser" className="mt-3 inline-flex min-h-11 items-center gap-1.5 font-semibold text-primary underline underline-offset-4">Browse exercises <ArrowRight className="h-4 w-4" /></a>}
        </div> : <>
          <div className="flex items-start gap-2 rounded-xl border border-primary/25 bg-primary/5 p-4 text-sm">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" aria-hidden />
            <div><strong>Exercise finished.</strong><p className="mt-1 text-muted-foreground">Please answer the final questions based on what you understand now. One short exercise is not proof of a learning improvement.</p></div>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <fieldset className="space-y-2">
              <legend className="text-sm font-semibold">4. After the exercise: the same idea with new numbers</legend>
              <p className="text-xs text-muted-foreground leading-relaxed">With $10,000 in exercise equity, you buy one fictional share for $200, paying a 0.1% fee. At the same price, how much has your equity changed immediately?</p>
              {([
                { id: "fee" as const, label: "Decreased by $0.20" },
                { id: "notional" as const, label: "Decreased by $200.20" },
                { id: "zero" as const, label: "No change" },
              ]).map(option => <label key={option.id} className="flex min-h-11 items-center gap-3 rounded-xl border border-border px-3 py-2 text-sm cursor-pointer">
                <input type="radio" name="arena-research-after" checked={after === option.id} onChange={() => setAfter(option.id)} className="accent-primary" />
                {option.label}
              </label>)}
            </fieldset>
            <div className="space-y-5">
              <fieldset className="space-y-2">
                <legend className="text-sm font-semibold">5. How clear was the experience?</legend>
                <div className="grid grid-cols-5 gap-2" role="group" aria-label="Choose a clarity rating from one to five">
                  {[1,2,3,4,5].map(n => <button type="button" key={n} aria-pressed={clarity === n} onClick={() => setClarity(n)}
                    className={"min-h-11 rounded-xl border text-sm font-semibold " + (clarity === n ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted")}>{n}</button>)}
                </div>
                <p className="text-xs text-muted-foreground">1 = unclear · 5 = very clear</p>
              </fieldset>
              <fieldset className="space-y-2">
                <legend className="text-sm font-semibold">6. Would you voluntarily return to practise again?</legend>
                <div className="flex flex-wrap gap-2">
                  {([
                    { id: "yes" as const, label: "Yes" },
                    { id: "maybe" as const, label: "Maybe" },
                    { id: "no" as const, label: "No" },
                  ]).map(option => <button type="button" key={option.id} aria-pressed={comeBack === option.id}
                    onClick={() => setComeBack(option.id)}
                    className={"min-h-11 rounded-xl border px-4 text-sm font-medium " + (comeBack === option.id ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted")}>{option.label}</button>)}
                </div>
              </fieldset>
            </div>
          </div>
          <div>
            <label htmlFor="arena-research-friction" className="text-sm font-semibold">7. What was the most confusing or least useful part? (optional)</label>
            <textarea id="arena-research-friction" className="mt-2 w-full min-h-24 rounded-xl border border-border bg-background/80 p-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              maxLength={400} value={friction} onChange={e => setFriction(e.target.value)} placeholder="One specific thing to improve. Avoid personal information." />
          </div>
          <div className="border-t border-border pt-5">
            <h3 className="text-sm font-semibold">Share the feedback only if you choose to</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">The study doesn't automatically submit anything. Opening an email draft isn't sending it; you must press Send in your email app. Your ordinary analytics choice is separate.</p>
            <div className="mt-3 flex flex-col sm:flex-row gap-2">
              <button type="button" disabled={!canShare} onClick={prepareEmail}
                className="min-h-11 inline-flex justify-center items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed hover:brightness-105">
                <Mail className="h-4 w-4" /> Prepare voluntary feedback email
              </button>
              <button type="button" disabled={!canShare} onClick={() => void copyReport()}
                className="min-h-11 inline-flex justify-center items-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold disabled:opacity-50">
                <Clipboard className="h-4 w-4" /> Copy anonymous responses
              </button>
            </div>
            {!canShare && <p className="mt-2 text-xs text-muted-foreground">To enable sharing, choose an experience level, both concept-check answers, clarity and return intention. The optional written comment can stay blank.</p>}
            {copyState !== "idle" && <p className="mt-2 text-xs text-muted-foreground" role="status">{copyState === "copied" ? "Copied locally. Nothing was submitted." : "Clipboard unavailable; you can still prepare an email draft."}</p>}
          </div>
        </>}
      </div>}
    </section>
  );
}
