import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, Check, CheckCircle2, ChevronRight,
  CircleHelp, Clock3, RotateCcw, ShieldCheck, Sparkles, Target, TrendingDown, TrendingUp, Wallet,
} from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { MegaFooter } from "@/components/MegaFooter";
import {
  ARENA_SCENARIOS, ARENA_SIZES, ARENA_START_CASH, ARENA_STORAGE_KEY,
  beginArena, completeArena, continueArena, currentMark, loadArena, markedEquity,
  recordArenaDecision, scenarioById, storeArena,
  type ArenaAction, type ArenaStored, type ArenaUnits,
} from "@/lib/practiceArena";
import { ArenaSessionReview } from "@/components/arena/ArenaSessionReview";
import { ArenaStudy } from "@/components/arena/ArenaStudy";
import { recordConsentedArenaVisit, trackArenaMilestone, ARENA_READY_EVENT } from "@/lib/arenaTelemetry";
import "./PracticeArena.css";

const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
const compact = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 2 });

function PriceChart({ prices, reduced }: { prices: number[]; reduced: boolean }) {
  // The first four points are invented framing context, not recorded market observations.
  const samples = [prices[0] - 2, prices[0] + 1, prices[0] - 1, ...prices];
  const low = Math.min(...samples) - 4, high = Math.max(...samples) + 4;
  const xy = samples.map((p, i) => ({
    x: 24 + (i / Math.max(1, samples.length - 1)) * 552,
    y: 175 - ((p - low) / (high - low)) * 146,
  }));
  const line = xy.map((p, i) => (i ? "L" : "M") + p.x.toFixed(2) + " " + p.y.toFixed(2)).join(" ");
  const area = line + " L 576 196 L 24 196 Z";
  const last = xy[xy.length - 1];
  const rising = prices[prices.length - 1] >= prices[0];
  return (
    <div className="arena-chart relative overflow-hidden rounded-[1.5rem] border border-border/70 bg-card/75 p-3 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 pb-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-2 w-2 rounded-full bg-primary" />
          <span className="text-xs font-medium text-muted-foreground">Fictional exercise chart</span>
        </div>
        <span className="text-[11px] text-muted-foreground">No historical or live market data</span>
      </div>
      <svg viewBox="0 0 600 216" role="img" aria-label={"Fictional chart with " + prices.length + " scenario observations; latest invented price " + fmt(prices.at(-1)!)} className="block w-full h-auto overflow-visible">
        <defs>
          <linearGradient id="arena-chart-wash" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={rising ? "hsl(var(--primary))" : "#d48875"} stopOpacity=".2" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[40,88,136,184].map(y => <line key={y} x1="24" x2="576" y1={y} y2={y} stroke="currentColor" strokeOpacity=".09" strokeDasharray="4 7" />)}
        <path d={area} fill="url(#arena-chart-wash)" />
        <motion.path d={line} fill="none" stroke={rising ? "hsl(var(--primary))" : "#d48875"} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round"
          initial={reduced ? false : { pathLength: 0, opacity: 0.2 }} animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: reduced ? 0 : 0.48, ease: [0.22, 1, 0.36, 1] }} />
        <circle cx={last.x} cy={last.y} r="7" fill="hsl(var(--background))" stroke={rising ? "hsl(var(--primary))" : "#d48875"} strokeWidth="3" />
        <text x="576" y="211" fontSize="10" textAnchor="end" fill="currentColor" opacity=".57">Invented observations · next price hidden until you decide</text>
      </svg>
    </div>
  );
}

function Metric({ label, value, hint, icon: Icon }: { label: string; value: string; hint?: string; icon?: typeof Wallet }) {
  return <div className="arena-metric rounded-2xl border border-border/70 bg-card/80 px-4 py-4 sm:px-5">
    <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
      <span>{label}</span>{Icon && <Icon className="h-4 w-4 text-primary/70" aria-hidden />}
    </div>
    <p className="mt-2 text-xl sm:text-2xl tracking-tight font-semibold tabular-nums">{value}</p>
    {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
  </div>;
}

export default function PracticeArena() {
  const [stored, setStored] = useState<ArenaStored>(loadArena);
  const [action, setAction] = useState<ArenaAction>("hold");
  const [units, setUnits] = useState<ArenaUnits>(1);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [showHelp, setShowHelp] = useState(false);
  // On return, show fresh choices rather than leaving learners at an old completed session.
  const [showCatalog, setShowCatalog] = useState(() => Boolean(loadArena().active?.finishedAt));
  const reducedMotion = useReducedMotion() ?? false;
  const contentRef = useRef<HTMLDivElement>(null);
  const visitTrackedRef = useRef(false);
  const active = stored.active;
  const scenario = active ? scenarioById(active.scenarioId) : undefined;
  const last = active?.decisions[active.decisions.length - 1];
  const finished = !!active?.finishedAt;
  const totalRounds = scenario ? scenario.scenes.length - 1 : 0;
  const currentScene = scenario && active ? scenario.scenes[Math.min(active.index, totalRounds)] : undefined;

  const visiblePrices = useMemo(() => scenario && active
    ? scenario.scenes.slice(0, Math.min(active.index + 1, scenario.scenes.length)).map(s => s.price)
    : [], [scenario, active]);
  const current = active ? currentMark(active) : 0;
  const equity = active ? markedEquity(active) : ARENA_START_CASH;

  function apply(next: ArenaStored) {
    setStored(next); storeArena(next);
  }
  useEffect(() => {
    // Browser visits are measured only after the existing Amplitude analytics
    // consent. No new visitor ID or identifying Arena event properties.
    const record = () => {
      if (!visitTrackedRef.current && recordConsentedArenaVisit()) visitTrackedRef.current = true;
    };
    record();
    window.addEventListener(ARENA_READY_EVENT, record);
    return () => window.removeEventListener(ARENA_READY_EVENT, record);
  }, []);
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === ARENA_STORAGE_KEY) setStored(loadArena());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  useEffect(() => {
    if (!active || showCatalog) return;
    // One gentle scroll per deliberate round transition; no scrolling while typing.
    const panel = contentRef.current;
    if (!panel) return;
    panel.focus({ preventScroll: true });
    panel.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
  }, [active?.scenarioId, active?.index, active?.pendingReview, active?.finishedAt, showCatalog, reducedMotion]);

  function begin(id: string) {
    if (active && !active.finishedAt && active.decisions.length > 0 &&
        !window.confirm("Start a different practice scenario? Your unfinished Arena round will be replaced. Your main trading portfolio will not change.")) return;
    apply({ ...stored, active: beginArena(id) });
    trackArenaMilestone("Arena Started", id);
    setShowCatalog(false);
    setAction("hold"); setUnits(1); setNote(""); setError("");
  }
  function decide() {
    if (!active || active.pendingReview || active.finishedAt) return;
    try {
      const next = recordArenaDecision(active, action, units, note);
      apply({ ...stored, active: next });
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not record this fictional decision.");
    }
  }
  function advance() {
    if (!active?.pendingReview) return;
    const next = continueArena(active);
    apply(next.finishedAt ? completeArena(stored, next) : { ...stored, active: next });
    if (next.finishedAt) trackArenaMilestone("Arena Completed", next.scenarioId);
    setAction("hold"); setUnits(1); setNote(""); setError("");
  }
  function saveFinalReflection(value: string) {
    if (!active?.finishedAt) return;
    apply({ ...stored, active: { ...active, finalReflection: value.slice(0, 400) } });
  }
  const transition = { duration: reducedMotion ? 0 : 0.36, ease: [0.22, 1, 0.36, 1] as const };
  
  return <>
    <Helmet>
      <title>Practice Arena — Interactive Virtual Trading Decisions | TradeHQ</title>
      <meta name="description" content="Practise small fictional market decisions, see cash, positions and virtual fees change, and review your reasoning. No signup, real money, live prices or trading signals." />
      <link rel="canonical" href="https://www.thetradehq.com/practice" />
      <meta name="robots" content="index, follow" />
      <meta property="og:title" content="Practice Arena — TradeHQ" />
      <meta property="og:description" content="Make a decision. Reveal the next fictional price. Understand what changed. Three free interactive practice paths." />
    </Helmet>
    <div className="arena-root min-h-screen bg-background text-foreground">
      <Navigation />
      <main className="arena-main relative mx-auto max-w-6xl px-4 sm:px-6 pt-24 sm:pt-28 pb-20">
        <div className="absolute inset-x-0 top-0 h-[440px] pointer-events-none arena-halo" aria-hidden />
        <div className="relative">
          <div className="flex items-center justify-between gap-3 mb-7">
            <Link to="/daily" className="arena-back group inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-medium text-muted-foreground hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" aria-hidden /> Daily Practice
            </Link>
            <span className="inline-flex items-center gap-2 text-[11px] sm:text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4 text-primary" /> Free · Private · No signup</span>
          </div>

          <header className="max-w-3xl mb-9">
            <p className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-[11px] font-semibold text-primary tracking-[0.14em] uppercase">
              <Sparkles className="h-3.5 w-3.5" aria-hidden /> TradeHQ Practice Arena
            </p>
            <h1 className="mt-5 text-[clamp(2.3rem,5.3vw,4.8rem)] font-semibold leading-[1.07] tracking-[-0.045em]">
              Make a decision.<br /><span className="arena-heading-accent">Understand what changed.</span>
            </h1>
            <p className="mt-5 text-sm sm:text-base leading-relaxed text-muted-foreground max-w-2xl">
              A calm space to practise choices under uncertainty. Reveal one invented price at a time, review the effect on your fictional balance, and move on when you're ready.
            </p>
          </header>

          <AnimatePresence mode="wait" initial={false}>
            {(!active || showCatalog) ? (
              <motion.section key="choose" initial={reducedMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={reducedMotion ? undefined : { opacity: 0, y: -8 }}
                transition={transition} id="arena-chooser" aria-label="Choose a practice scenario"
                onAnimationComplete={() => {
                  if (active && showCatalog) document.getElementById("arena-chooser")?.scrollIntoView({
                    behavior: reducedMotion ? "auto" : "smooth", block: "start",
                  });
                }}>
                <div className="mb-5 flex items-end justify-between gap-4">
                  <div><h2 className="text-xl font-semibold">Choose your next exercise</h2><p className="text-sm text-muted-foreground mt-1">Three self-contained paths. Every price is deliberately fictional.</p></div>
                  <span className="hidden sm:inline text-xs text-muted-foreground"><Clock3 className="inline h-4 w-4 mr-1" /> About 3–5 minutes each</span>
                  <span className="sm:hidden text-xs text-muted-foreground">Swipe to explore the three paths</span>
                </div>
                {active && !active.finishedAt && <div className="mb-5 rounded-2xl border border-primary/35 bg-primary/5 px-5 py-4 sm:flex items-center justify-between gap-4">
                  <div><p className="text-sm font-semibold">Unfinished practice saved on this device</p><p className="mt-1 text-xs text-muted-foreground">{scenarioById(active.scenarioId)?.title} · {active.index} of {scenarioById(active.scenarioId)!.scenes.length - 1} rounds · Same session, no reset</p></div>
                  <button type="button" onClick={() => { trackArenaMilestone("Arena Resumed", active.scenarioId); setShowCatalog(false); }} className="mt-3 sm:mt-0 min-h-11 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Resume unfinished session</button>
                </div>}
                {active?.finishedAt && <div className="mb-5 rounded-2xl border border-primary/25 bg-primary/5 px-5 py-4 sm:flex sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">Your last completed exercise is available</p>
                    <p className="mt-1 text-xs text-muted-foreground">{scenarioById(active.scenarioId)?.title} · Review your decisions and private closing note before starting something new.</p>
                    <p className="mt-1 text-xs text-muted-foreground">Starting another exercise replaces this detailed review; your completion count remains saved.</p>
                  </div>
                  <button type="button" onClick={() => setShowCatalog(false)} className="mt-3 sm:mt-0 shrink-0 min-h-11 rounded-xl border border-primary/40 px-4 text-xs font-semibold text-primary hover:bg-primary/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">Review last session</button>
                </div>}
                <div className="arena-rail grid md:grid-cols-3 gap-4">
                  {ARENA_SCENARIOS.map((item, i) => {
                    const past = stored.completions[item.id];
                    return <motion.button key={item.id} type="button" whileHover={reducedMotion ? undefined : { y: -4 }} whileTap={reducedMotion ? undefined : { scale: .99 }}
                      onClick={() => begin(item.id)} className="arena-track group relative flex flex-col text-left rounded-[1.6rem] border border-border bg-card/80 p-6 sm:p-7 min-h-[280px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                      aria-label={"Start " + item.title + (past ? ", previously completed " + past.count + " times" : "")}>
                      <div className="flex items-center justify-between">
                        <span className="rounded-full border border-border px-3 py-1 text-[11px] text-muted-foreground">{item.level}</span>
                        <span className="text-xs text-muted-foreground">0{i + 1} / 03</span>
                      </div>
                      <div className="mt-auto pt-10">
                        <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Target className="h-5 w-5" /></div>
                        <h3 className="text-xl font-semibold tracking-tight">{item.title}</h3>
                        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.subtitle}</p>
                        <p className="mt-4 text-xs text-foreground/70">{item.skill}</p>
                        <div className="flex items-center justify-between mt-6 text-sm font-semibold text-primary">
                          <span>{past ? "Practise again" : "Begin exercise"}</span><ArrowUpRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </div>
                        {past && <p className="mt-2 text-xs text-muted-foreground"><CheckCircle2 className="inline h-3.5 w-3.5 mr-1" /> Completed {past.count} time{past.count !== 1 ? "s" : ""}</p>}
                      </div>
                    </motion.button>;
                  })}
                </div>
              </motion.section>
            ) : (
              <motion.div key={"active-" + active.scenarioId} initial={reducedMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={reducedMotion ? undefined : { opacity: 0, y: -8 }} transition={transition} onAnimationComplete={() => {
                // AnimatePresence waits for the old catalog to exit before mounting this
                // panel; the initial useEffect may therefore run before the ref exists.
                if (!showCatalog) contentRef.current?.scrollIntoView({
                  behavior: reducedMotion ? "auto" : "smooth", block: "start",
                });
              }}>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-primary font-semibold uppercase tracking-[0.14em]">{scenario?.level}</span>
                    <span className="h-1 w-1 rounded-full bg-border" />
                    <span className="text-sm text-muted-foreground">{scenario?.title}</span>
                  </div>
                  <button type="button" onClick={() => setShowCatalog(true)} className="min-h-11 rounded-xl border border-border px-4 text-xs font-medium text-muted-foreground hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
                    Browse scenarios
                  </button>
                </div>
                <div className="flex items-center gap-2 mb-7" aria-label={active.index + " of " + totalRounds + " decisions recorded"}>
                  {Array.from({ length: totalRounds }, (_, i) => <div key={i} className={"h-1.5 flex-1 rounded-full transition-colors duration-300 " + (i < active.index ? "bg-primary" : "bg-muted")} />)}
                  <span className="ml-2 text-xs font-medium tabular-nums text-muted-foreground">{active.index}/{totalRounds}</span>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                  <Metric label="Exercise cash" value={fmt(active.cash)} icon={Wallet} />
                  <Metric label="Units held" value={compact(active.holdings)} hint="Exercise-only positions" />
                  <Metric label="Marked equity" value={fmt(equity)} hint="Cash + units at fictional mark" />
                  <Metric label="Virtual fees paid" value={fmt(active.fees)} hint="0.1% on each buy or sale" />
                </div>

                <div className="grid lg:grid-cols-[1.24fr_0.76fr] gap-4 sm:gap-5 items-start">
                  <div className="space-y-4 min-w-0 order-2 lg:order-1">
                    <PriceChart prices={visiblePrices} reduced={reducedMotion} />
                    <div className="rounded-2xl border border-border bg-card/60 p-5">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-muted-foreground">Exercise-only snapshot</p>
                        <span className="text-sm tabular-nums font-semibold">{fmt(current)} / unit</span>
                      </div>
                      <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{scenario?.intro}</p>
                      <button type="button" onClick={() => setShowHelp(v => !v)} aria-expanded={showHelp}
                        className="mt-3 inline-flex min-h-11 items-center gap-2 text-xs font-medium text-primary underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
                        <CircleHelp className="h-4 w-4" /> How are exercise values calculated?
                      </button>
                      {showHelp && <p className="text-xs text-muted-foreground leading-relaxed mt-3 rounded-xl bg-muted/50 p-3" role="status">
                        The same authored price path is used for everyone. A buy uses price × quantity plus a 0.1% fictional fee. A sale adds price × quantity less a 0.1% fee. Equity is remaining exercise cash plus holdings marked at the last revealed fictional price. No actual TradeHQ trades, real price feeds or account funds are affected.
                      </p>}
                    </div>
                  </div>

                  <div className="arena-decision-panel min-w-0 order-1 lg:order-2 rounded-[1.6rem] border border-border bg-card/85 p-5 sm:p-6 shadow-[0_18px_70px_-42px_rgba(0,0,0,.6)]" ref={contentRef} tabIndex={-1}>
                    <div className="mb-4 flex items-center justify-between gap-2 rounded-xl bg-muted/35 px-3 py-2 lg:hidden" aria-label={"Current fictional mark " + fmt(current)}>
                      <span className="text-[11px] text-muted-foreground">Current fictional mark</span>
                      <strong className="text-sm font-semibold tabular-nums">{fmt(current)}</strong>
                    </div>
                    <AnimatePresence mode="wait" initial={false}>
                      {finished ? <motion.section key="finished" initial={reducedMotion ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={reducedMotion ? undefined : { opacity: 0 }} transition={transition} aria-labelledby="arena-finished">
                        <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-primary/10 text-primary"><CheckCircle2 className="w-6 h-6" /></div>
                        <h2 id="arena-finished" className="mt-4 text-2xl font-semibold tracking-tight">Session complete.</h2>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{scenario?.completion}</p>
                        <div className="grid grid-cols-2 gap-3 mt-6">
                          <div className="rounded-xl bg-muted/40 p-3"><p className="text-xs text-muted-foreground">Decisions reviewed</p><p className="font-semibold mt-1 tabular-nums">{active.decisions.length}</p></div>
                          <div className="rounded-xl bg-muted/40 p-3"><p className="text-xs text-muted-foreground">Exercise result</p><p className="font-semibold mt-1 tabular-nums">{fmt(equity - ARENA_START_CASH)}</p></div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-3">An invented scenario result is not a score of your competence or a prediction of real investment returns.</p>
                        <div className="amp-block"><ArenaSessionReview session={active} onReflectionChange={saveFinalReflection} /></div>
                        <a href="#arena-study" className="mt-3 inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-primary underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
                          Help test whether this exercise is useful <ArrowRight className="h-4 w-4" />
                        </a>
                        <div className="space-y-2 mt-6">
                          <Link to={scenario?.nextHref ?? "/learn"} className="arena-primary inline-flex w-full min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">
                            {scenario?.nextLabel} <ArrowRight className="h-4 w-4" />
                          </Link>
                          <button type="button" onClick={() => begin(active.scenarioId)} className="inline-flex w-full min-h-12 items-center justify-center gap-2 rounded-xl border border-border text-sm font-medium hover:bg-muted">
                            <RotateCcw className="h-4 w-4" /> Practise this scenario again
                          </button>
                          <button type="button" onClick={() => setShowCatalog(true)} className="w-full min-h-11 text-xs text-muted-foreground underline underline-offset-4">Browse another exercise</button>
                        </div>
                      </motion.section> : active.pendingReview && last ? <motion.section key={"review-" + active.index} initial={reducedMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={reducedMotion ? undefined : { opacity: 0, y: -8 }} transition={transition} aria-labelledby="arena-review">
                        <div className="inline-flex items-center gap-2 text-primary font-semibold text-xs uppercase tracking-[.14em]"><Check className="h-4 w-4" /> Decision recorded</div>
                        <h2 id="arena-review" className="text-2xl font-semibold tracking-tight mt-3">See what changed.</h2>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{scenario?.scenes[active.index].context}</p>
                        <div className="mt-5 rounded-2xl border border-border bg-muted/35 p-4 space-y-3 text-sm">
                          <div className="flex justify-between gap-4"><span className="text-muted-foreground">Your choice</span><strong className="capitalize">{last.action === "hold" ? "Observe / no order" : last.action + " " + last.units + " units"}</strong></div>
                          <div className="flex justify-between gap-4"><span className="text-muted-foreground">Previous fictional mark</span><strong className="tabular-nums">{fmt(last.price)}</strong></div>
                          <div className="flex justify-between gap-4"><span className="text-muted-foreground">New fictional mark</span><strong className="tabular-nums">{fmt(last.nextPrice)}</strong></div>
                          <div className="flex justify-between gap-4"><span className="text-muted-foreground">Fee on this decision</span><strong className="tabular-nums">{fmt(last.fee)}</strong></div>
                          <div className="flex justify-between gap-4"><span className="text-muted-foreground">Marked equity</span><strong className="tabular-nums">{fmt(last.markedEquity)}</strong></div>
                        </div>
                        {last.note && <div className="amp-block mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4"><p className="text-xs font-semibold text-primary mb-2">Your own reason</p><p className="text-sm whitespace-pre-wrap break-words">{last.note}</p></div>}
                        <div className="mt-4 rounded-xl border border-border p-4"><p className="text-xs font-semibold text-primary mb-2">What this round illustrates</p><p className="text-sm leading-relaxed text-muted-foreground">{scenario?.scenes[active.index - 1].insight}</p></div>
                        <button type="button" onClick={advance} className="arena-primary mt-6 inline-flex w-full min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                          {active.index >= totalRounds ? "Finish & reflect" : "Continue to next round"} <ArrowRight className="h-4 w-4" />
                        </button>
                      </motion.section> : <motion.section key={"decision-" + active.index} initial={reducedMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={reducedMotion ? undefined : { opacity: 0, y: -8 }} transition={transition} aria-labelledby="arena-round">
                        <p className="text-[11px] uppercase tracking-[.13em] font-semibold text-primary">Round {active.index + 1} of {totalRounds}</p>
                        <h2 id="arena-round" className="mt-3 text-2xl font-semibold leading-tight tracking-tight">{currentScene?.heading}</h2>
                        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{currentScene?.context}</p>
                        <p className="mt-5 text-sm font-semibold">{currentScene?.question}</p>
                        <div className="grid grid-cols-3 gap-2 mt-3" role="group" aria-label="Select an exercise action">
                          {([
                            { id: "buy" as const, label: "Buy", Icon: TrendingUp },
                            { id: "hold" as const, label: "Observe", Icon: Clock3 },
                            { id: "sell" as const, label: "Sell", Icon: TrendingDown },
                          ]).map(item => <button key={item.id} type="button" aria-pressed={action === item.id}
                            onClick={() => { setAction(item.id); setError(""); }}
                            className={"arena-action flex flex-col items-center justify-center gap-2 min-h-[76px] rounded-2xl border px-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary " + (action === item.id ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted")}>
                              <item.Icon className="h-4 w-4" aria-hidden />{item.label}
                            </button>)}
                        </div>
                        {action !== "hold" && <div className="mt-5">
                          <label className="block text-xs font-semibold text-muted-foreground mb-2">Exercise quantity</label>
                          <div role="group" aria-label="Choose quantity" className="grid grid-cols-3 gap-2">
                            {ARENA_SIZES.map(size => <button key={size} type="button" onClick={() => setUnits(size)} aria-pressed={units === size}
                              className={"min-h-11 rounded-xl border text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary " + (units === size ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted")}>
                                {size} unit{size !== 1 ? "s" : ""}
                              </button>)}
                          </div>
                        </div>}
                        <div className="amp-block mt-5">
                          <label htmlFor="arena-reason" className="block text-xs font-semibold text-muted-foreground mb-2">Your reason <span className="font-normal">(optional, private)</span></label>
                          <textarea id="arena-reason" rows={2} maxLength={240} value={note} onChange={e => setNote(e.target.value)}
                            placeholder="What am I testing or waiting for?"
                            className="arena-textarea block w-full rounded-xl border border-border bg-background/75 p-3 text-sm leading-relaxed resize-y focus:outline-none focus-visible:ring-2 focus-visible:ring-primary" />
                          <p className="text-[11px] text-muted-foreground mt-1">Only saved on this device. Not added to your real TradeHQ portfolio or public profile.</p>
                        </div>
                        <div className="mt-5 p-3 rounded-xl bg-muted/40 text-xs text-muted-foreground">
                          {action === "hold" ? "No virtual transaction or fee. The next invented price will still be revealed." :
                            action === "buy" ? "Exercise debit: " + fmt(current * units * 1.001) + " including 0.1% fee. No actual order will be placed." :
                              "Exercise sale: " + fmt(current * units * .999) + " net of 0.1% fee. You currently hold " + active.holdings + " units."}
                        </div>
                        {error && <p role="alert" className="text-sm text-destructive mt-3">{error}</p>}
                        <button type="button" onClick={decide} disabled={(action === "sell" && active.holdings < units) || (action === "buy" && active.cash < current * units * 1.001)}
                          className="arena-primary mt-5 inline-flex w-full min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                          Record choice & reveal <ChevronRight className="h-4 w-4" />
                        </button>
                        {action === "sell" && active.holdings < units && <p className="mt-2 text-xs text-muted-foreground" role="status">Select a smaller quantity you already hold, or choose Observe.</p>}
                      </motion.section>}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between rounded-2xl border border-border/60 bg-card/50 px-5 py-4">
                  <p className="text-xs leading-relaxed text-muted-foreground max-w-2xl">
                    <ShieldCheck className="h-4 w-4 text-primary inline mr-1" />
                    Exercise prices and outcomes are authored fiction, not live quotes, historical replay, trade signals or evidence of future performance.
                  </p>
                  <Link to="/courses" className="inline-flex items-center gap-1 text-xs font-semibold text-primary whitespace-nowrap min-h-10">Explore free courses <ArrowRight className="h-4 w-4" /></Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {(!active || showCatalog) && <section className="mt-10 grid md:grid-cols-3 gap-4" aria-label="How the Arena works">
            {[
              { Icon: Target, title: "Choose a question", text: "Pick one small skill to practise, from your first order to following a stated plan." },
              { Icon: ChevronRight, title: "Reveal one step", text: "Decide to buy, sell or observe before the next fictional price becomes visible." },
              { Icon: BookOpen, title: "Review and continue", text: "Inspect the modeled balance change, record an optional reason and follow one relevant lesson." },
            ].map(s => <div key={s.title} className="rounded-2xl border border-border/60 p-5">
              <s.Icon className="h-5 w-5 text-primary" /><h2 className="mt-3 text-sm font-semibold">{s.title}</h2><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
            </div>)}
          </section>}
          <ArenaStudy completedScenario={active?.finishedAt ? active.scenarioId : null} completedAt={active?.finishedAt ?? null} />
          <p className="mt-8 text-xs text-muted-foreground text-center">Practice Arena progress is kept in this browser, separate from both guest and signed-in trading portfolios. Nothing here can enter leaderboards. Optional Arena usage measurement follows the separate analytics consent choice.</p>
        </div>
      </main>
      <MegaFooter />
    </div>
  </>;
}
