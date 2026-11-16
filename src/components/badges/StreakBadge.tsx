import { Flame } from "lucide-react";
import { useEffect, useState } from "react";
import { getStreak } from "@/lib/dailyChallenge";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

/**
 * Compact streak chip for the nav bar.
 * Pulses gently when a streak is active.
 */
export function StreakBadge({ className }: { className?: string }) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const update = () => setCount(getStreak().current);
    update();
    const i = setInterval(update, 5000);
    window.addEventListener("storage", update);
    return () => {
      clearInterval(i);
      window.removeEventListener("storage", update);
    };
  }, []);

  if (count === null) return null;

  const hasStreak = count > 0;

  return (
    <Link
      to="/daily"
      className={cn(
        "inline-flex items-center gap-1.5 px-3 h-9 rounded-xl text-xs font-bold tabular-nums transition-all active:scale-[0.97]",
        hasStreak
          ? "bg-gradient-to-r from-orange-500/15 to-amber-500/15 text-orange-400 border border-orange-500/30 hover:border-orange-400/50"
          : "bg-white/[0.05] text-muted-foreground border border-white/[0.08] hover:text-foreground hover:border-white/20",
        className,
      )}
      title={hasStreak ? `${count}-day practice streak` : "Start your daily streak"}
    >
      <Flame className={cn("w-3.5 h-3.5", hasStreak && "animate-pulse")} />
      <span>{hasStreak ? count : "Daily"}</span>
    </Link>
  );
}
