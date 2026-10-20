import type { ReactNode } from "react";
import { Asset } from "@/lib/types";
import {
  Activity,
  BarChart3,
  Lightbulb,
  Minus,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MarketInsightPanelProps {
  asset: Asset;
}

interface InsightTile {
  label: string;
  value: string;
  detail: string;
  icon: ReactNode;
  color: string;
}

function formatPrice(value: number) {
  if (value !== 0 && Math.abs(value) < 0.0001) return value.toLocaleString("en-US", { maximumSignificantDigits: 6 });
  if (value < 1) return value.toFixed(4);
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function deriveInsights(asset: Asset): InsightTile[] {
  const cp = asset.changePercent;
  const absChange = Math.abs(cp);
  const price = asset.price;

  const moveValue = cp > 1.5 ? "Positive move" : cp < -1.5 ? "Negative move" : "Near flat";
  const trendColor =
    cp > 1.5 ? "text-profit" : cp < -1.5 ? "text-loss" : "text-muted-foreground";
  const trendIcon =
    cp > 1.5 ? (
      <TrendingUp className="h-4 w-4" />
    ) : cp < -1.5 ? (
      <TrendingDown className="h-4 w-4" />
    ) : (
      <Minus className="h-4 w-4" />
    );

  const volatilityThreshold =
    asset.type === "crypto" ? { low: 2, high: 5 } : { low: 1, high: 3 };
  const volatilityValue =
    absChange < volatilityThreshold.low
      ? "Low"
      : absChange > volatilityThreshold.high
        ? "High"
        : "Moderate";
  const volatilityColor =
    volatilityValue === "High"
      ? "text-warning"
      : volatilityValue === "Low"
        ? "text-profit"
        : "text-muted-foreground";

  const moveHeuristicValue = cp > 2 ? "Above +2%" : cp < -2 ? "Below -2%" : "Inside ±2%";
  const momentumColor =
    cp > 2 ? "text-profit" : cp < -2 ? "text-loss" : "text-muted-foreground";

  const levelOffset = asset.type === "crypto" ? 0.04 : 0.025;
  const support = price * (1 - levelOffset);
  const resistance = price * (1 + levelOffset);

  const beginnerTip = "Compare the percentage move with your chosen hypothetical position value. These buckets describe the practice snapshot; they do not measure future volatility or recommend an entry or size.";

  return [
    {
      label: "Recent Move",
      value: moveValue,
      detail: `${cp >= 0 ? "+" : ""}${cp.toFixed(2)}% · descriptive only`,
      icon: trendIcon,
      color: trendColor,
    },
    {
      label: "Move Size Bucket",
      value: volatilityValue,
      detail: `${absChange.toFixed(1)}% practice move · heuristic`,
      icon: <Activity className="h-4 w-4" />,
      color: volatilityColor,
    },
    {
      label: "Move Heuristic",
      value: moveHeuristicValue,
      detail: "Simple ±2% practice bucket · not a market signal",
      icon: <BarChart3 className="h-4 w-4" />,
      color: momentumColor,
    },
    {
      label: "Practice Range",
      value: `Lower: ${formatPrice(support)}`,
      detail: `Upper: ${formatPrice(resistance)} · fixed ±${(levelOffset * 100).toFixed(1)}% band`,
      icon: <Target className="h-4 w-4" />,
      color: "text-accent",
    },
    {
      label: "Beginner Tip",
      value: "",
      detail: beginnerTip,
      icon: <Lightbulb className="h-4 w-4" />,
      color: "text-primary",
    },
  ];
}

export function MarketInsightPanel({ asset }: MarketInsightPanelProps) {
  const insights = deriveInsights(asset);

  return (
    <section className="glass-tactile border-chrome rounded-2xl p-4 md:p-5">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold tracking-tight-cyber">
            Market Insight
          </h3>
          <p className="text-xs text-muted-foreground">
            Educational estimate · not financial advice
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {insights.map((tile) => (
          <div
            key={tile.label}
            className="rounded-xl border border-white/8 bg-white/[0.02] p-3"
          >
            <div className={cn("mb-2 flex items-center gap-2", tile.color)}>
              {tile.icon}
              <span className="text-2xs uppercase tracking-wide">{tile.label}</span>
            </div>

            {tile.value ? (
              <p className="text-sm font-semibold text-foreground">{tile.value}</p>
            ) : null}

            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {tile.detail}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
