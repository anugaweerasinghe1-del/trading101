import { portfolioExposureSummary } from "@/lib/portfolioExposure";
import type { ReactNode } from "react";
import { Portfolio } from "@/lib/types";
import {
  Brain,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AIInsightSummaryProps {
  portfolio: Portfolio;
}

interface Insight {
  icon: ReactNode;
  text: string;
  type: "positive" | "negative" | "neutral" | "warning";
}

function generateInsights(portfolio: Portfolio): Insight[] {
  const insights: Insight[] = [];
  const positions = portfolio.positions;

  if (positions.length === 0) {
    return [
      {
        icon: <BarChart3 className="h-4 w-4" />,
        text: "No open positions. Public lessons and guest practice can help you inspect order mechanics without requiring a position.",
        type: "neutral",
      },
    ];
  }

  const sorted = [...positions].sort(
    (a, b) => b.profitLossPercent - a.profitLossPercent,
  );
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];

  if (best && best.profitLoss > 0) {
    insights.push({
      icon: <TrendingUp className="h-4 w-4" />,
      text: `Strongest holding: ${best.asset.symbol} is up ${best.profitLossPercent.toFixed(1)}%. This records the selected marks and cost basis; it does not predict the next return.`,
      type: "positive",
    });
  }

  if (worst && worst.profitLoss < 0) {
    insights.push({
      icon: <TrendingDown className="h-4 w-4" />,
      text: `Weakest holding: ${worst.asset.symbol} is down ${Math.abs(worst.profitLossPercent).toFixed(1)}%. This records the selected marks and cost basis; it does not establish an instruction to sell.`,
      type: "negative",
    });
  }

  const exposure = portfolioExposureSummary(portfolio);
  if (exposure) insights.push({
    icon: <BarChart3 className="h-4 w-4" />,
    text: exposure,
    type: "neutral",
  });

  if (positions.length < 3) insights.push({
    icon: <ShieldCheck className="h-4 w-4" />,
    text: `You currently hold ${positions.length} position${positions.length === 1 ? "" : "s"}. Position count alone does not measure diversification, correlation or suitability.`,
    type: "neutral",
  });

  if (positions.length >= 2 && positions.every((position) => position.profitLoss >= 0)) {
    insights.push({
      icon: <ShieldCheck className="h-4 w-4" />,
      text: "All current positions have nonnegative marked profit/loss. This snapshot does not establish future performance or measure every account risk.",
      type: "positive",
    });
  }

  return insights.slice(0, 4);
}

const TYPE_STYLES: Record<Insight["type"], string> = {
  positive: "text-profit",
  negative: "text-loss",
  neutral: "text-muted-foreground",
  warning: "text-warning",
};

export function AIInsightSummary({ portfolio }: AIInsightSummaryProps) {
  const insights = generateInsights(portfolio);

  return (
    <section className="glass-tactile border-chrome rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Brain className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold tracking-tight-cyber">
          Portfolio Insight
        </h3>
        <span className="ml-auto text-2xs text-muted-foreground">
          Educational Analysis
        </span>
      </div>

      <div className="space-y-3">
        {insights.map((insight, index) => (
          <div
            key={`${insight.type}-${index}`}
            className="flex gap-3 rounded-xl border border-white/8 bg-white/[0.02] p-3"
          >
            <div className={cn("mt-0.5 shrink-0", TYPE_STYLES[insight.type])}>
              {insight.icon}
            </div>
            <p className="text-sm leading-6 text-foreground/90">{insight.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
