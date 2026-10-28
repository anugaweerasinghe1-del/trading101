import { Asset } from "@/lib/types";
import { getAssetContent } from "@/lib/assetContent";
import { Sparkles, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface AIReadySummaryProps {
  asset: Asset;
}

// Generate AI Overview-optimized summary for GEO (Generative Engine Optimization)
function generateTradingSummary(asset: Asset): {
  verdict: 'bullish' | 'bearish' | 'neutral';
  summary: string;
} {
  const content = getAssetContent(asset.id);
  const changePercent = asset.changePercent ?? 0;
  const verdict = changePercent > 0.5 ? 'bullish' : changePercent < -0.5 ? 'bearish' : 'neutral';
  const strategyHint = content?.strategy || `Compare hypothetical ${asset.symbol} price changes in the simulator.`;
  return {
    verdict,
    summary: `The practice snapshot shows a ${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(1)}% change. This describes simulator data, not a forecast or an instruction to buy, sell or hedge. ${strategyHint}`
  };
}

export function AIReadySummary({ asset }: AIReadySummaryProps) {
  const { verdict, summary } = generateTradingSummary(asset);
  
  const verdictConfig = {
    bullish: {
      icon: TrendingUp,
      label: "Positive practice change",
      color: "text-green-400 [.light_&]:text-green-800",
      bg: "bg-green-500/10",
      border: "border-green-500/20"
    },
    bearish: {
      icon: TrendingDown,
      label: "Negative practice change",
      color: "text-red-400 [.light_&]:text-red-800",
      bg: "bg-red-500/10",
      border: "border-red-500/20"
    },
    neutral: {
      icon: Minus,
      label: "Small practice change",
      color: "text-yellow-400 [.light_&]:text-yellow-800",
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/20"
    }
  };
  
  const config = verdictConfig[verdict];
  const Icon = config.icon;
  
  return (
    <section 
      className={cn(
        "rounded-xl border p-4 mb-6",
        config.bg,
        config.border
      )}
      aria-label="Practice data summary"
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
          config.bg
        )}>
          <Sparkles className={cn("w-5 h-5", config.color)} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <h2 className="text-sm font-semibold text-foreground">
              Practice Trading {asset.symbol} — Simulator Snapshot
            </h2>
            <span className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
              config.bg,
              config.color
            )}>
              <Icon className="w-3 h-3" />
              {config.label}
            </span>
          </div>
          
          <p className="text-sm text-muted-foreground leading-relaxed">
            {summary}
          </p>
          <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
            This summary describes the instrument snapshot supplied to the page.
            The chart refreshes separately, so its quoted change may differ.
          </p>
          
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground/70">
            <span>Simulated data — not real market conditions</span>
            <span>•</span>
            <span className="italic">Educational simulation only</span>
          </div>
        </div>
      </div>
    </section>
  );
}
