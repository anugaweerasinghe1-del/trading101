import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, TrendingDown, TrendingUp, AlertTriangle, Loader2, Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ComposedChart,
} from "recharts";
import { DAILY_VOL, runScenario, type ScenarioResult, type Shock } from "@/lib/scenarioEngine";
import { supabase } from "@/integrations/supabase/client";
import type { Portfolio, Asset } from "@/lib/types";

const EXAMPLES = [
  "What if BTC drops 30%?",
  "ETH gains 50% in 30 days",
  "Tech stocks crash 20%",
  "Crypto rallies 40% over 60 days",
];

interface Props {
  portfolio: Portfolio;
  /** Live ticking asset list (same source as the Trade page). When provided,
   *  position prices are overridden with their live counterparts so the
   *  scenario engine starts from the current practice price; provenance may vary. */
  liveAssets?: Asset[];
}

export function ScenarioBuilder({ portfolio, liveAssets }: Props) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScenarioResult | null>(null);
  const [narrative, setNarrative] = useState<string>("");
  const [shocks, setShocks] = useState<Shock[]>([]);
  const [horizonDays, setHorizonDays] = useState<number>(30);
  const { toast } = useToast();

  // Build a practice-price portfolio snapshot from the shared price cache.
  const livePortfolio = (() => {
    if (!liveAssets || liveAssets.length === 0) return portfolio;
    const liveById = new Map(liveAssets.map((a) => [a.id, a]));
    const positions = portfolio.positions.map((p) => {
      const live = liveById.get(p.asset.id);
      if (!live) return p;
      const currentValue = live.price * p.quantity;
      const totalCost = p.avgPrice * p.quantity;
      return {
        ...p,
        asset: { ...p.asset, price: live.price, change: live.change, changePercent: live.changePercent },
        currentValue,
        profitLoss: currentValue - totalCost,
        profitLossPercent: totalCost > 0 ? ((currentValue - totalCost) / totalCost) * 100 : 0,
      };
    });
    const positionsValue = positions.reduce((s, p) => s + p.currentValue, 0);
    return { ...portfolio, positions, totalValue: portfolio.cash + positionsValue };
  })();

  const hasPositions = livePortfolio.positions.length > 0;

  const runQuery = async (queryText?: string) => {
    const finalPrompt = (queryText ?? prompt).trim();
    if (!finalPrompt) return;
    if (!hasPositions) {
      toast({
        title: "No positions yet",
        description: "Buy some assets first so the scenario has something to simulate.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const holdings = livePortfolio.positions.map((p) => ({
        symbol: p.asset.symbol,
        name: p.asset.name,
        type: p.asset.type,
        quantity: p.quantity,
        currentPrice: p.asset.price,
      }));

      // Deterministic regex-based scenario parser — no AI credits required.
      const lower = finalPrompt.toLowerCase();
      const pctMatch = lower.match(/(-?\d+(?:\.\d+)?)\s*%/);
      const daysMatch = lower.match(/(\d+)\s*(day|week|month)/);
      const dropMatch = /drop|crash|fall|down|plunge|dump/.test(lower);
      const pumpMatch = /pump|rally|surge|moon|up|rise/.test(lower);
      const pct = pctMatch ? Number(pctMatch[1]) : (dropMatch ? -20 : pumpMatch ? 20 : -10);
      const signedPct = dropMatch && pct > 0 ? -pct : pct;
      let horizon = 30;
      if (daysMatch) {
        const n = Number(daysMatch[1]);
        const unit = daysMatch[2];
        horizon = unit === "week" ? n * 7 : unit === "month" ? n * 30 : n;
      }
      // Try to match a specific symbol from holdings, otherwise apply to all
      const targetSymbol = holdings.find(h => lower.includes(h.symbol.toLowerCase()) || lower.includes(h.name.toLowerCase()))?.symbol;
      const shocks: Shock[] = targetSymbol
        ? [{ symbol: targetSymbol, shockPercent: signedPct, confidence: 0.7 }]
        : holdings.map(h => ({ symbol: h.symbol, shockPercent: signedPct, confidence: 0.7 }));
      const parsed = {
        shocks,
        horizonDays: horizon,
        narrative: `Modeled a ${signedPct >= 0 ? "+" : ""}${signedPct}% move on ${targetSymbol ?? "your full portfolio"} over ${horizon} days. (Deterministic scenario — no AI required.)`,
      };
      setShocks(parsed.shocks ?? []);
      setHorizonDays(parsed.horizonDays ?? 30);
      setNarrative(parsed.narrative ?? "");

      const sim = runScenario(livePortfolio, parsed.shocks ?? [], parsed.horizonDays ?? 30, 1000);
      setResult(sim);
    } catch (e: any) {
      toast({ title: "Scenario error", description: e?.message ?? "Unknown error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fmt = (v: number) => `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

  return (
    <Card className="p-6 bg-card/40 backdrop-blur-xl border-white/[0.08]">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
          <Brain className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            Scenario Builder
            <Badge variant="outline" className="text-2xs border-primary/30 text-primary">Beta</Badge>
          </h2>
          <p className="text-2xs text-muted-foreground">Enter a hypothetical move for a rule-based simulation. Results are illustrative, not forecasts.</p>
        </div>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        Assumptions: the requested shock is spread across the chosen horizon with fixed daily variability:
        {Object.entries(DAILY_VOL).map(([type, value]) => ` ${type} ${(value * 100).toFixed(1)}%`).join(",")}.
        Asset moves are independent; cross-asset correlation, costs and market events are not modeled.
        The 1,000 random paths produce illustrative sample means, percentiles and loss frequencies,
        not calibrated market probabilities. A frequency near 50% has about ±3 percentage points
        of simulation sampling uncertainty, before model uncertainty. Requested losses below −99% are clamped to −99%.
      </p>

      <div className="flex flex-col sm:flex-row gap-2 mt-4">
        <Input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          aria-label="Hypothetical portfolio scenario"
          placeholder="e.g. What if BTC drops 30% in 30 days?"
          onKeyDown={(e) => e.key === "Enter" && runQuery()}
          disabled={loading}
        />
        <Button
          onClick={() => runQuery()}
          disabled={loading || !prompt.trim()}
          className="gap-1.5 active:scale-[0.97] transition-transform"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loading ? "Simulating…" : "Run Scenario"}
        </Button>
      </div>

      <div className="flex flex-wrap gap-1.5 mt-3">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            onClick={() => {
              setPrompt(ex);
              runQuery(ex);
            }}
            disabled={loading}
            className="text-2xs px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-muted-foreground hover:text-foreground hover:bg-white/[0.08] transition-colors disabled:opacity-50"
          >
            {ex}
          </button>
        ))}
      </div>

      {!hasPositions && (
        <div className="mt-4 p-4 rounded-lg bg-warning/5 border border-warning/20 text-2xs text-warning">
          Buy some assets in the Trade tab first — the scenario engine needs positions to simulate.
        </div>
      )}

      {result && (
        <div className="mt-6 space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="p-3 bg-white/[0.02] border-white/[0.06]">
              <p className="text-2xs text-muted-foreground">Model Mean</p>
              <p className="text-base font-bold tabular-nums mt-1">{fmt(result.expected)}</p>
              <p className={cn("text-2xs tabular-nums", result.deltaPercent >= 0 ? "text-success" : "text-destructive")}>
                {result.deltaPercent >= 0 ? "+" : ""}{result.deltaPercent.toFixed(2)}%
              </p>
            </Card>
            <Card className="p-3 bg-white/[0.02] border-white/[0.06]">
              <div className="flex items-center gap-1">
                <TrendingDown className="w-3 h-3 text-destructive" />
                <p className="text-2xs text-muted-foreground">P5 Model Percentile</p>
              </div>
              <p className="text-base font-bold tabular-nums mt-1 text-destructive">{fmt(result.p5)}</p>
            </Card>
            <Card className="p-3 bg-white/[0.02] border-white/[0.06]">
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-success" />
                <p className="text-2xs text-muted-foreground">P95 Model Percentile</p>
              </div>
              <p className="text-base font-bold tabular-nums mt-1 text-success">{fmt(result.p95)}</p>
            </Card>
            <Card className="p-3 bg-white/[0.02] border-white/[0.06]">
              <div className="flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-warning" />
                <p className="text-2xs text-muted-foreground">Model Loss Frequency</p>
              </div>
              <p className="text-base font-bold tabular-nums mt-1">{result.probabilityOfLoss.toFixed(0)}%</p>
            </Card>
          </div>

          <p className="text-xs text-muted-foreground">
            P5 and P95 are simulated distribution percentiles, not the worst or best outcomes that could occur.
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer>
              <ComposedChart data={result.bands} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="bandWide" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.04} />
                  </linearGradient>
                  <linearGradient id="bandInner" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.12} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="day" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} label={{ value: `Day (horizon ${horizonDays}d)`, position: "insideBottom", offset: -5, fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`} domain={["auto", "auto"]} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number, name: string) => [`$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, name]}
                />
                <Area type="monotone" dataKey="p95" stroke="none" fill="url(#bandWide)" />
                <Area type="monotone" dataKey="p5" stroke="none" fill="hsl(var(--card))" />
                <Area type="monotone" dataKey="p75" stroke="none" fill="url(#bandInner)" />
                <Area type="monotone" dataKey="p25" stroke="none" fill="hsl(var(--card))" />
                <Line type="monotone" dataKey="median" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {result.perAsset.length > 0 && (
            <div className="rounded-lg border border-white/[0.06] overflow-hidden">
              <div className="grid grid-cols-5 gap-2 px-3 py-2 bg-white/[0.03] text-2xs uppercase tracking-wide text-muted-foreground">
                <span>Asset</span>
                <span className="text-right">Qty</span>
                <span className="text-right">Now</span>
                <span className="text-right">Expected</span>
                <span className="text-right">Shock</span>
              </div>
              {result.perAsset.map((a) => (
                <div key={a.symbol} className="grid grid-cols-5 gap-2 px-3 py-2 text-xs border-t border-white/[0.04]">
                  <span className="font-medium">{a.symbol}</span>
                  <span className="text-right tabular-nums text-muted-foreground">{a.quantity}</span>
                  <span className="text-right tabular-nums">${a.currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                  <span className="text-right tabular-nums">${a.expectedPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                  <span className={cn("text-right tabular-nums", a.shockApplied >= 0 ? "text-success" : "text-destructive")}>
                    {a.shockApplied >= 0 ? "+" : ""}{a.shockApplied.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          )}

          {narrative && (
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-xs text-muted-foreground italic leading-relaxed">{narrative}</p>
            </div>
          )}

          <p className="text-2xs text-muted-foreground/70 text-center">
            Based on {1000} Monte Carlo paths • Shocks: {shocks.length ? shocks.map((s) => `${s.symbol} ${s.shockPercent >= 0 ? "+" : ""}${s.shockPercent}%`).join(", ") : "none"} • Horizon {horizonDays} days
          </p>
        </div>
      )}
    </Card>
  );
}
