import { useEffect, useState, useMemo } from "react";
import { Activity, TrendingUp, TrendingDown, Clock } from "lucide-react";
import { ASSETS } from "@/lib/assets";
import { getPersistedPrices } from "@/lib/pricePersistence";
import { cn } from "@/lib/utils";

type MomentumLabel = "Strong Downside" | "Downside" | "Neutral" | "Upside" | "Strong Upside";

function momentumLabel(score: number): { label: MomentumLabel; color: string } {
  if (score < 20) return { label: "Strong Downside", color: "#FF4560" };
  if (score < 40) return { label: "Downside", color: "#FF8A65" };
  if (score < 60) return { label: "Neutral", color: "#FFB74D" };
  if (score < 80) return { label: "Upside", color: "#66BB6A" };
  return { label: "Strong Upside", color: "#00E396" };
}

// Compute an internal simulator momentum score from a basket of assets
function computeMomentumScore(prices: Record<string, { changePercent: number }>): number {
  const sample = ASSETS.slice(0, 30);
  const changes = sample
    .map((a) => prices[a.id]?.changePercent ?? a.changePercent ?? 0)
    .filter((v) => Number.isFinite(v));
  if (changes.length === 0) return 50;
  const avg = changes.reduce((s, v) => s + v, 0) / changes.length;
  // Map avg% [-5..+5] → [0..100], clamp
  const score = Math.max(0, Math.min(100, 50 + avg * 10));
  return Math.round(score);
}

interface MarketSession {
  name: string;
  flag: string;
  tz: string;
  openH: number; // regular weekday local-hour schedule only
  closeH: number;
}

const SESSIONS: MarketSession[] = [
  { name: "NYSE", flag: "🇺🇸", tz: "America/New_York", openH: 9.5, closeH: 16 },
  { name: "LSE", flag: "🇬🇧", tz: "Europe/London", openH: 8, closeH: 16.5 },
  { name: "TSE", flag: "🇯🇵", tz: "Asia/Tokyo", openH: 9, closeH: 15 },
  { name: "SGX", flag: "🇸🇬", tz: "Asia/Singapore", openH: 9, closeH: 17 },
];

function sessionStatus(s: MarketSession): { open: boolean; nextEventInMin: number } {
  const now = new Date();
  const local = new Date(now.toLocaleString("en-US", { timeZone: s.tz }));
  const day = local.getDay();
  const isWeekday = day !== 0 && day !== 6;
  const hours = local.getHours() + local.getMinutes() / 60;
  const open = isWeekday && hours >= s.openH && hours < s.closeH;
  let nextMin: number;
  if (open) {
    nextMin = (s.closeH - hours) * 60;
  } else {
    // Approximate regular-hours countdown; exchange holidays/special sessions are not modeled.
    const delta = hours < s.openH ? s.openH - hours : 24 - hours + s.openH;
    nextMin = delta * 60;
  }
  return { open, nextEventInMin: Math.round(nextMin) };
}

function formatTimeLeft(min: number): string {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h ${m}m`;
}

/**
 * Market Pulse — simulator momentum dial + global market clock + movers.
 * Designed as the homepage "habit" widget — users check it daily.
 */
export function MarketPulse() {
  const [prices, setPrices] = useState<Record<string, { price: number; change: number; changePercent: number }>>({});
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setPrices(getPersistedPrices());
    const i = setInterval(() => {
      setPrices(getPersistedPrices());
      setTick((t) => t + 1);
    }, 30_000);
    return () => clearInterval(i);
  }, []);

  const score = useMemo(() => computeMomentumScore(prices), [prices]);
  const momentum = momentumLabel(score);

  // Movers
  const ranked = ASSETS.map((a) => {
    const p = prices[a.id];
    return {
      ...a,
      changePercent: p?.changePercent ?? a.changePercent,
      price: p?.price ?? a.price,
    };
  }).sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));

  const gainers = ranked.filter((a) => a.changePercent > 0).slice(0, 3);
  const losers = ranked.filter((a) => a.changePercent < 0).slice(0, 3);

  // Sessions
  const sessions = SESSIONS.map((s) => ({ ...s, ...sessionStatus(s) }));

  // Dial geometry
  const r = 70;
  const c = 2 * Math.PI * r;
  const arc = c * 0.75; // 270° dial
  const filled = arc * (score / 100);

  return (
    <div
      className="thq-market-pulse rounded-3xl p-6 md:p-8 border border-border/70"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold uppercase tracking-widest text-foreground">Market Pulse</h2>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          Simulator • refresh 30s
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Simulator momentum dial */}
        <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-black/40 border border-white/[0.04]">
          <div className="relative w-[180px] h-[180px]">
            <svg viewBox="0 0 180 180" className="w-full h-full -rotate-[135deg]">
              <circle cx="90" cy="90" r={r} fill="none" stroke="hsl(0 0% 100% / 0.06)" strokeWidth="14" strokeDasharray={`${arc} ${c}`} strokeLinecap="round" />
              <circle
                cx="90"
                cy="90"
                r={r}
                fill="none"
                stroke={momentum.color}
                strokeWidth="14"
                strokeDasharray={`${filled} ${c}`}
                strokeLinecap="round"
                style={{ transition: "stroke-dasharray 1s ease, stroke 1s ease", filter: `drop-shadow(0 0 10px ${momentum.color}66)` }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-4xl font-bold tabular-nums text-foreground" style={{ color: momentum.color }}>{score}</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">Simulator Momentum</div>
            </div>
          </div>
          <div className="mt-3 text-sm font-bold" style={{ color: momentum.color }}>{momentum.label}</div>
          <p className="text-[11px] text-muted-foreground text-center mt-1 max-w-[200px]">
            Internal practice score from recent simulator price changes across 30 assets
          </p>
        </div>

        {/* Right column: clocks + movers */}
        <div className="space-y-4">
          {/* Market clock */}
          <div className="p-3 rounded-2xl bg-black/40 border border-white/[0.04]">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
              <Clock className="w-3 h-3" /> Global Sessions · approximate
            </div>
            <p className="text-[9px] text-muted-foreground/70 mb-2">Regular weekday hours only; exchange holidays and special sessions are not included.</p>
            <div className="grid grid-cols-2 gap-2">
              {sessions.map((s) => (
                <div key={s.name} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{s.flag}</span>
                    <span className="text-xs font-semibold text-foreground">{s.name}</span>
                  </div>
                  <div className="text-right">
                    <div className={cn("text-[10px] font-bold", s.open ? "text-success" : "text-muted-foreground")}>
                      {s.open ? "SCHEDULED OPEN" : "SCHEDULED CLOSED"}
                    </div>
                    <div className="text-[10px] text-muted-foreground tabular-nums">
                      approx. {s.open ? "closes" : "opens"} {formatTimeLeft(s.nextEventInMin)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Movers */}
          <div className="p-3 rounded-2xl bg-black/40 border border-white/[0.04]">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">What's Moving</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-success mb-1.5">
                  <TrendingUp className="w-3 h-3" /> GAINERS
                </div>
                {gainers.map((a) => (
                  <div key={a.id} className="flex items-center justify-between py-0.5">
                    <span className="text-xs font-semibold text-foreground">{a.symbol}</span>
                    <span className="text-[11px] font-bold text-success tabular-nums">+{a.changePercent.toFixed(2)}%</span>
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-destructive mb-1.5">
                  <TrendingDown className="w-3 h-3" /> LOSERS
                </div>
                {losers.map((a) => (
                  <div key={a.id} className="flex items-center justify-between py-0.5">
                    <span className="text-xs font-semibold text-foreground">{a.symbol}</span>
                    <span className="text-[11px] font-bold text-destructive tabular-nums">{a.changePercent.toFixed(2)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground/60 text-center mt-4">
        Educational simulation only — not financial advice. Prices shown here come from the simulator's persisted practice data. {tick > 0 ? `· refreshed ${tick * 30}s` : ""}
      </p>
    </div>
  );
}