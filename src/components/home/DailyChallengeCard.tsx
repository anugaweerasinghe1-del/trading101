import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Flame, Trophy, ArrowRight, Sparkles } from "lucide-react";
import { getTodayChallenge, getStreak, hasPlayedToday, getNextBadge, type StreakState } from "@/lib/dailyChallenge";
import { cn } from "@/lib/utils";

/**
 * Homepage card: today's challenge + streak hook.
 * Designed to be the "come back daily" trigger.
 */
export function DailyChallengeCard() {
  const [streak, setStreak] = useState<StreakState | null>(null);
  const [played, setPlayed] = useState(false);
  const challenge = getTodayChallenge();

  useEffect(() => {
    setStreak(getStreak());
    setPlayed(hasPlayedToday());
  }, []);

  const nextBadge = streak ? getNextBadge(streak.longest) : null;

  return (
    <div
      className="relative overflow-hidden rounded-3xl p-6 md:p-8 border border-primary/20"
      style={{
        background:
          "linear-gradient(135deg, hsl(168 100% 50% / 0.08) 0%, hsl(280 60% 55% / 0.05) 50%, hsl(12 90% 62% / 0.04) 100%)",
        backdropFilter: "blur(24px)",
        boxShadow: "0 8px 40px -10px hsl(168 100% 50% / 0.2), inset 0 1px 0 0 hsl(0 0% 100% / 0.06)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-primary font-bold">Today's Challenge</div>
            <div className="text-xs text-muted-foreground">New at local midnight</div>
          </div>
        </div>
        {streak && streak.current > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/15 border border-orange-500/30">
            <Flame className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
            <span className="text-xs font-bold text-orange-400 tabular-nums">{streak.current}-day streak</span>
          </div>
        )}
      </div>

      {/* Challenge */}
      <div className="mb-5">
        <p className="text-xs text-muted-foreground mb-2">Hypothetical exercise — figures and events are not current market data.</p>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded bg-foreground/10 text-foreground/80">
            {challenge.asset}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{challenge.difficulty}</span>
        </div>
        <h3 className="text-xl md:text-2xl font-bold mb-2 leading-tight text-foreground">{challenge.scenario}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2">{challenge.context}</p>
      </div>

      {/* Stats row */}
      {streak && (
        <div className="grid grid-cols-3 gap-2 mb-5 p-3 rounded-xl bg-black/30 border border-white/[0.04]">
          <div className="text-center">
            <div className="text-base font-bold tabular-nums text-foreground">{streak.current}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Streak</div>
          </div>
          <div className="text-center border-x border-white/[0.06]">
            <div className="text-base font-bold tabular-nums text-foreground">{streak.longest}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Best</div>
          </div>
          <div className="text-center">
            <div className="text-base font-bold tabular-nums text-foreground">{streak.totalCompleted}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Total</div>
          </div>
        </div>
      )}

      {/* CTA */}
      <Link to="/daily"
          className={cn(
            "w-full h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.97]",
            played
              ? "bg-success/15 text-success border border-success/30"
              : "bg-primary text-black hover:bg-primary/90",
          )}
          style={!played ? { color: "#000", boxShadow: "0 0 24px hsl(168 100% 50% / 0.3)" } : undefined}
        >
          {played ? (
            <>
              <Trophy className="w-4 h-4" /> Played — Streak Secured
            </>
          ) : (
            <>
              Play Today's Challenge <ArrowRight className="w-4 h-4" />
            </>
          )}
      </Link>

      {nextBadge && !played && (
        <p className="text-[11px] text-muted-foreground text-center mt-3">
          {nextBadge.emoji} <span className="text-foreground/80">Next badge: <strong>{nextBadge.label}</strong></span> at {nextBadge.threshold}-day streak
        </p>
      )}

      <p className="text-[10px] text-muted-foreground/70 text-center mt-2">
        Quick scenario + 10-question case study · virtual learning only.
      </p>
    </div>
  );
}
