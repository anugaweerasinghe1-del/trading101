import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, TrendingUp, TrendingDown } from "lucide-react";
import { getWatchlistMoves, WatchlistMove } from "@/lib/watchlistDiff";

/**
 * Homepage widget that surfaces price moves on the user's watchlist
 * since their last visit. Silent when there's no watchlist or no moves.
 */
export function WatchlistAlerts() {
  const [moves, setMoves] = useState<WatchlistMove[] | null>(null);
  const [sinceHours, setSinceHours] = useState<number>(0);

  useEffect(() => {
    const data = getWatchlistMoves();
    if (data && data.moves.length > 0) {
      setMoves(data.moves);
      setSinceHours(data.sinceHours);
    }
  }, []);

  if (!moves) return null;

  return (
    <section
      aria-label="Watchlist moves"
      className="container mx-auto px-6 max-w-7xl pt-6"
    >
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 md:p-6 backdrop-blur">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Eye className="w-4 h-4 text-primary" />
            Watchlist changes since your saved visit ({sinceHours < 1 ? "under 1h ago" : sinceHours < 24 ? `about ${Math.round(sinceHours)}h ago` : `about ${Math.round(sinceHours / 24)}d ago`})
          </div>
          <Link to="/markets" className="text-xs text-primary hover:underline">See all →</Link>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {moves.map((m) => {
            const up = m.changePct >= 0;
            return (
              <Link
                key={m.id}
                to={`/trade/${m.id}`}
                className="group flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 hover:border-primary/30 hover:bg-primary/5 transition"
              >
                <div className="min-w-0">
                  <div className="text-sm font-bold text-foreground truncate">{m.symbol}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{m.name}</div>
                </div>
                <div className={`flex items-center gap-1 text-xs font-bold tabular-nums ${up ? "text-emerald-400" : "text-rose-400"}`}>
                  {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {up ? "+" : ""}{m.changePct.toFixed(2)}%
                </div>
              </Link>
            );
          })}
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">
          Simulated market moves — educational only, not financial advice.
        </p>
      </div>
    </section>
  );
}
