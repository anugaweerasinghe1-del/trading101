import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Navigation } from "@/components/Navigation";
import { MegaFooter } from "@/components/MegaFooter";
import { Link } from "react-router-dom";
import { Flame, Trophy, Check, ArrowRight, Sparkles, TrendingUp, Brain, Lock, X } from "lucide-react";
import {
  getTodayChallenge,
  getStreak,
  hasPlayedQuickToday,
  recordChallenge,
  getUnlockedBadges,
  getNextBadge,
  getChallengeCount,
  getTodayBonus,
  type ChallengeDecision,
  type StreakState,
} from "@/lib/dailyChallenge";
import { DailyPractice } from "@/components/DailyPractice";
import { practiceDate } from "../../supabase/functions/_shared/dailyPractice";
import { cn } from "@/lib/utils";

const dailyDarkPalette = {
  "--foreground": "220 15% 93%",
  "--muted-foreground": "220 14% 68%",
  "--primary": "168 100% 50%",
} as CSSProperties;

export default function Daily() {
  const [deeperOpen, setDeeperOpen] = useState(false);
  const [date, setDate] = useState(practiceDate);
  const challenge = getTodayChallenge();
  const bonus = getTodayBonus();
  const [streak, setStreak] = useState<StreakState | null>(null);
  const [selected, setSelected] = useState<ChallengeDecision | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [bonusPick, setBonusPick] = useState<number | null>(null);

  useEffect(() => {
    setDeeperOpen(false);
    setStreak(getStreak());
    setSubmitted(hasPlayedQuickToday()); setSelected(null); setBonusPick(null);
  }, [date]);

  useEffect(() => {
    const tick = () => setDate(practiceDate());
    const timer = window.setInterval(tick, 30000);
    document.addEventListener("visibilitychange", tick);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", tick); };
  }, []);

  const handleSubmit = (decision: ChallengeDecision) => {
    if (submitted) return;
    // The directional scenario is a reflection exercise, not a forecast quiz.
    // Completing the reasoning step advances the streak; no market direction is
    // presented as objectively correct.
    const next = recordChallenge(challenge.id, decision);
    setSelected(decision);
    setSubmitted(true);
    setStreak(next);
  };

  const unlocked = streak ? getUnlockedBadges(streak.longest) : [];
  const next = streak ? getNextBadge(streak.longest) : null;

  return (
    <>
      <Helmet>
        <title>Daily Trading Challenge — Build Your Streak | TradeHQ</title>
        <meta name="description" content="A quick daily scenario plus a 8–12 minute case study with calculations, visuals and worked answers. Practise from 50 rotating cases and build your streak for free." />
        <link rel="canonical" href="https://www.thetradehq.com/daily" />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content="Daily Trading Challenge — TradeHQ" />
        <meta property="og:description" content="One new trading scenario per day. Build your streak. Free." />
        <meta property="og:url" content="https://www.thetradehq.com/daily" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Quiz",
          name: `Daily Trading Challenge: ${challenge.asset}`,
          about: challenge.scenario,
          educationalLevel: challenge.difficulty,
          provider: { "@type": "Organization", name: "TradeHQ", url: "https://www.thetradehq.com/" },
        })}</script>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navigation />
        {/* Atmospheric backdrop */}
        <div
          aria-hidden
          className="fixed inset-0 pointer-events-none -z-0 opacity-60"
          style={{
            background:
              "radial-gradient(900px 600px at 15% -10%, hsl(168 100% 50% / 0.10), transparent 60%), radial-gradient(700px 500px at 90% 20%, hsl(12 90% 62% / 0.08), transparent 60%), radial-gradient(600px 400px at 50% 100%, hsl(280 60% 55% / 0.05), transparent 60%)",
          }}
        />
        <main className="relative pt-24 pb-20">
          <div className="container mx-auto px-6 max-w-5xl">
            {/* Premium header */}
            <header className="mb-10 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/30 mb-5 backdrop-blur-xl">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span className="text-[11px] font-bold text-primary uppercase tracking-[0.2em]">
                  Daily Challenge · {new Date().toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>
              <h1
                data-daily-heading
                className="text-4xl md:text-6xl font-bold mb-4 tracking-tight leading-[1.05]"
                style={{
                  background:
                    "linear-gradient(135deg, hsl(220 15% 98%) 0%, hsl(168 70% 75%) 50%, hsl(220 15% 85%) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Today's Trading Scenario
              </h1>
              <p className="text-foreground/70 max-w-xl mx-auto text-[15px] leading-relaxed">
                A quick scenario plus an optional 10-question case study. Compare assumptions, work through the answers and build your streak; no direction is a guaranteed forecast.
              </p>
            </header>

            {/* Streak stats — premium */}
            {streak && (
              <div className="grid grid-cols-3 gap-3 md:gap-4 mb-8">
                {[
                  { icon: Flame, value: streak.current, label: "Current Streak", color: "orange-400", glow: "12 90% 62%", active: streak.current > 0 },
                  { icon: Trophy, value: streak.longest, label: "Personal Best", color: "amber-400", glow: "38 90% 55%", active: streak.longest > 0 },
                  { icon: Check, value: streak.totalCompleted, label: "Total Played", color: "success", glow: "157 100% 44%", active: streak.totalCompleted > 0 },
                ].map((s, i) => (
                  <div
                    key={i}
                    className="relative overflow-hidden p-4 md:p-5 rounded-2xl border border-white/[0.08] backdrop-blur-xl group transition-all hover:border-white/[0.15]"
                    style={{
                      ...dailyDarkPalette,
                      backgroundColor: "hsl(0 0% 4%)",
                      backgroundImage: `linear-gradient(140deg, hsl(${s.glow} / 0.06) 0%, hsl(0 0% 6% / 0.7) 100%)`,
                      boxShadow: s.active ? `0 8px 32px -12px hsl(${s.glow} / 0.3), inset 0 1px 0 0 hsl(0 0% 100% / 0.05)` : "inset 0 1px 0 0 hsl(0 0% 100% / 0.04)",
                    }}
                  >
                    <s.icon className={cn("w-5 h-5 mb-2", s.active ? `text-${s.color}` : "text-foreground/40")} />
                    <div className="text-3xl font-bold tabular-nums text-foreground leading-none">{s.value}</div>
                    <div className="text-[10px] uppercase tracking-[0.2em] text-foreground/60 mt-2 font-semibold">{s.label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Challenge card — world-class premium */}
            <article
              className="relative overflow-hidden rounded-[28px] p-6 md:p-12 border border-white/[0.08] mb-6"
              style={{
                ...dailyDarkPalette,
                backgroundColor: "hsl(0 0% 4%)",
                backgroundImage:
                  "linear-gradient(140deg, hsl(0 0% 8% / 0.95) 0%, hsl(0 0% 4% / 0.98) 100%)",
                backdropFilter: "blur(40px) saturate(180%)",
                boxShadow:
                  "0 24px 80px -20px hsl(0 0% 0% / 0.7), inset 0 1px 0 0 hsl(0 0% 100% / 0.06)",
              }}
            >
              {/* Top shimmer */}
              <div
                aria-hidden
                className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px"
                style={{ background: "linear-gradient(90deg, transparent, hsl(168 100% 50% / 0.5), transparent)" }}
              />
              {/* Asset banner */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary font-bold text-sm tabular-nums">
                    {challenge.asset.slice(0, 4)}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-foreground">{challenge.assetName}</div>
                    <div className="text-[10px] uppercase tracking-[0.2em] text-foreground/60 font-semibold flex items-center gap-2">
                      <span className={cn(
                        "inline-block w-1.5 h-1.5 rounded-full",
                        challenge.difficulty === "Beginner" && "bg-success",
                        challenge.difficulty === "Intermediate" && "bg-amber-400",
                        challenge.difficulty === "Pro" && "bg-destructive",
                      )} />
                      {challenge.difficulty}
                    </div>
                  </div>
                </div>
                <div className="hidden md:flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-foreground/50 font-semibold">
                  <TrendingUp className="w-3.5 h-3.5" /> Hypothetical Scenario
                </div>
              </div>

              <h2 className="text-2xl md:text-[34px] font-bold mb-4 text-foreground leading-[1.15] tracking-tight">
                {challenge.scenario}
              </h2>
              <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground mb-2">
                Hypothetical exercise inputs — not current market data, verified forecasts, or trading signals
              </p>
              <p className="text-[15px] md:text-base text-foreground/75 mb-8 leading-relaxed max-w-3xl">
                {challenge.context}
              </p>

              {/* Options */}
              <div className="space-y-2.5 mb-6">
                {challenge.options.map((opt) => {
                  const isSelected = selected === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => handleSubmit(opt.value)}
                      disabled={submitted}
                      className={cn(
                        "group w-full text-left p-4 md:p-5 rounded-2xl border transition-all duration-200 active:scale-[0.98]",
                        !submitted && "bg-white/[0.03] border-white/[0.08] hover:border-primary/50 hover:bg-primary/[0.06] hover:translate-x-0.5 cursor-pointer",
                        submitted && isSelected && "bg-primary/10 border-primary/40",
                        submitted && !isSelected && "bg-white/[0.02] border-white/[0.04] opacity-55",
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="text-[15px] font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">{opt.label}</div>
                          {submitted && isSelected && (
                            <div className="text-xs text-foreground/65 leading-relaxed">
                              Your stated reasoning: {opt.rationale}
                            </div>
                          )}
                        </div>
                        {submitted && isSelected && (
                          <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center flex-shrink-0">
                            <Check className="w-4 h-4 text-primary" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Insight reveal — premium */}
              {submitted && (
                <div
                  className="relative overflow-hidden p-5 md:p-6 rounded-2xl border border-primary/30 mb-4 animate-fade-in"
                  style={{
                    background:
                      "linear-gradient(135deg, hsl(168 100% 50% / 0.08) 0%, hsl(168 100% 50% / 0.02) 100%)",
                  }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Brain className="w-4 h-4 text-primary" />
                    </div>
                    <div className="text-[10px] uppercase tracking-[0.2em] text-primary font-bold">Decision Review</div>
                  </div>
                  <p className="text-[15px] text-foreground leading-relaxed">
                      {challenge.insight}
                    </p>
                </div>
              )}

              {/* Bonus knowledge — second daily question */}
              {submitted && (
                <div
                  className="relative overflow-hidden p-5 md:p-6 rounded-2xl border border-amber-500/30 mb-4 animate-fade-in"
                  style={{
                    background:
                      "linear-gradient(135deg, hsl(38 90% 55% / 0.08) 0%, hsl(38 90% 55% / 0.02) 100%)",
                  }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="text-[10px] uppercase tracking-[0.2em] text-amber-400 font-bold">Bonus Knowledge · Daily +1</div>
                  </div>
                  <p className="text-[15px] text-foreground font-semibold mb-4">{bonus.prompt}</p>
                  <div className="space-y-2">
                    {bonus.options.map((o, idx) => {
                      const picked = bonusPick === idx;
                      const reveal = bonusPick !== null;
                      return (
                        <button
                          key={idx}
                          onClick={() => bonusPick === null && setBonusPick(idx)}
                          disabled={bonusPick !== null}
                          className={cn(
                            "w-full text-left p-3 rounded-xl border transition-all text-sm",
                            !reveal && "bg-white/[0.03] border-white/[0.08] hover:border-amber-400/50 hover:bg-amber-400/[0.05] cursor-pointer",
                            reveal && o.correct && "bg-success/10 border-success/50 text-foreground",
                            reveal && picked && !o.correct && "bg-destructive/10 border-destructive/50 text-foreground",
                            reveal && !picked && !o.correct && "bg-white/[0.02] border-white/[0.04] opacity-50",
                          )}
                        >
                          <div className="flex items-start gap-2">
                            {reveal && o.correct && <Check className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />}
                            {reveal && picked && !o.correct && <X className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />}
                            <div className="flex-1">
                              <div className="font-medium">{o.label}</div>
                              {reveal && (picked || o.correct) && (
                                <div className="text-xs text-foreground/65 mt-1 leading-relaxed">{o.explain}</div>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {submitted && (
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Link to="/trade" className="flex-1">
                    <button className="w-full h-12 rounded-xl bg-primary font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.97] transition-transform" style={{ color: "#000", boxShadow: "0 0 24px hsl(168 100% 50% / 0.3)" }}>
                      Practice This Trade Now <ArrowRight className="w-4 h-4" />
                    </button>
                  </Link>
                  <a href="#deeper-practice" onClick={() => setDeeperOpen(true)} aria-expanded={deeperOpen} aria-controls="deeper-practice" className="flex-1 h-12 rounded-xl bg-primary/10 border border-primary/40 font-semibold text-sm text-primary flex items-center justify-center gap-2">
                    Go Deeper <Brain className="w-4 h-4" />
                  </a>
                  <Link to="/learn" className="flex-1">
                    <button className="w-full h-12 rounded-xl bg-white/[0.05] border border-white/[0.1] font-semibold text-sm text-foreground active:scale-[0.97] transition-transform">
                      Learn More Concepts
                    </button>
                  </Link>
                </div>
              )}

              <p className="text-[10px] text-foreground/45 text-center mt-6">
                Educational simulation only — not financial advice. Come back tomorrow for a new challenge.
              </p>
            </article>

            <DailyPractice key={date} date={date} open={deeperOpen} onOpen={() => setDeeperOpen(true)} onClose={() => setDeeperOpen(false)} onComplete={() => setStreak(recordChallenge(0, "hold"))} />

            {/* Badges — premium */}
            <section
              className="rounded-[24px] p-6 md:p-7 border border-white/[0.08] backdrop-blur-xl"
              style={{
                background:
                  "linear-gradient(140deg, hsl(38 90% 55% / 0.04) 0%, hsl(0 0% 5% / 0.8) 100%)",
              }}
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-base font-bold text-foreground tracking-tight">Streak Badges</h3>
                  <p className="text-xs text-foreground/60 mt-0.5">Unlock as your streak grows</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold tabular-nums text-amber-400">{unlocked.length}<span className="text-foreground/40 text-base">/5</span></div>
                  <div className="text-[10px] uppercase tracking-widest text-foreground/50">Unlocked</div>
                </div>
              </div>
              <div className="grid grid-cols-5 gap-2 md:gap-3">
                {[
                  { th: 3, label: "Spark", emoji: "✨" },
                  { th: 7, label: "Iron", emoji: "🔥" },
                  { th: 14, label: "Diamond", emoji: "💎" },
                  { th: 30, label: "Master", emoji: "🏆" },
                  { th: 100, label: "Legend", emoji: "👑" },
                ].map(({ th, label, emoji }) => {
                  const got = streak ? streak.longest >= th : false;
                  return (
                    <div
                      key={th}
                      className={cn(
                        "relative p-3 md:p-4 rounded-2xl text-center border transition-all",
                        got
                          ? "bg-amber-500/10 border-amber-500/40 shadow-[0_4px_20px_-6px_hsl(38_90%_55%/0.3)]"
                          : "bg-white/[0.02] border-white/[0.05]",
                      )}
                    >
                      <div className={cn("text-2xl md:text-3xl mb-1", !got && "grayscale opacity-40")}>
                        {got ? emoji : <Lock className="w-5 h-5 mx-auto text-foreground/30" />}
                      </div>
                      <div className={cn("text-[10px] font-bold uppercase tracking-wider", got ? "text-amber-400" : "text-foreground/50")}>
                        {label}
                      </div>
                      <div className="text-[9px] text-foreground/50 tabular-nums mt-0.5">{th}d</div>
                    </div>
                  );
                })}
              </div>
              {next && (
                <p className="text-xs text-foreground/70 text-center mt-4">
                  Next: <strong className="text-foreground">{next.label}</strong> at {next.threshold}-day streak
                </p>
              )}
              <p className="text-[10px] text-foreground/45 text-center mt-2">
                {getChallengeCount()} unique scenarios in rotation
              </p>
            </section>
          </div>
        </main>
        <MegaFooter />
      </div>
    </>
  );
}
