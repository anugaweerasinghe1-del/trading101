import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LineChart, ArrowRight } from "lucide-react";
import { getWeeklyRecap, WeeklyRecap as Recap } from "@/lib/weeklyRecap";

/** Unadjusted balance change between saved snapshots within the last seven days. */
export function WeeklyRecap() {
  const [r, setR] = useState<Recap | null>(null);

  useEffect(() => {
    const rec = getWeeklyRecap();
    if (rec.hasData) setR(rec);
  }, []);

  if (!r) return null;

  const positive = r.changePct >= 0;

  return (
    <section aria-label="Recent balance snapshots" className="container mx-auto px-6 max-w-7xl pt-6">
      <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-primary/5 via-background to-primary/5 p-5 md:p-6 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-muted-foreground mb-1">
              <LineChart className="w-3 h-3" /> Recent balance change
            </div>
            <div className="text-xl md:text-2xl font-bold tabular-nums">
              <span className={positive ? "text-emerald-400" : "text-rose-400"}>
                {positive ? "+" : ""}{r.changePct.toFixed(2)}%
              </span>
              <span className="ml-3 text-sm text-muted-foreground">
                {positive ? "+" : ""}${r.changeAbs.toFixed(2)} over {r.snapshots} snapshots
              </span>
            </div>
          </div>
          <Link
            to="/portfolio"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
          >
            View full portfolio <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">
          Change between the first and last saved snapshots in the past 7 days.
          Cash changes are included; this is not an investment return.
        </p>
      </div>
    </section>
  );
}
