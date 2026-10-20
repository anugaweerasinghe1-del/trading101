import { Asset } from "@/lib/types";
import { Gauge } from "lucide-react";
import { cn } from "@/lib/utils";

interface TradingStrengthMeterProps {
  asset: Asset;
}

// Scale the absolute simulator price move into a 0-100 visual meter.
function calculateMovementScore(asset: Asset): {
  score: number;
  interpretation: string;
} {
  const changePercent = asset.changePercent ?? 0;
  const absoluteMove = Math.abs(changePercent);

  // Display scale only: a 0-5% absolute move maps linearly to 0-100.
  // This is not a strategy-quality, risk or prediction score.
  const score = Math.round(Math.min(100, absoluteMove * 20));

  let interpretation = "";
  if (absoluteMove >= 4) {
    interpretation = "Large simulator price move. Use it as an observation exercise, not as evidence that a trade is attractive.";
  } else if (absoluteMove >= 2) {
    interpretation = "Moderate simulator price move. Compare the move with the surrounding chart and data-status label.";
  } else {
    interpretation = "Small simulator price move. The meter describes movement only and does not rate a strategy.";
  }

  return { score, interpretation };
}

export function TradingStrengthMeter({ asset }: TradingStrengthMeterProps) {
  const { score, interpretation } = calculateMovementScore(asset);
  
  // Determine color based on score
  const getScoreColor = (s: number) => {
    if (s >= 70) return "text-green-400";
    if (s >= 50) return "text-yellow-400";
    return "text-red-400";
  };
  
  const getProgressColor = (s: number) => {
    if (s >= 70) return "bg-green-500";
    if (s >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };
  
  // Gauge rotation calculation (-90 to 90 degrees for half circle)
  const gaugeRotation = -90 + (score / 100) * 180;
  
  return (
    <section 
      className="glass-panel border border-white/10 rounded-2xl p-6"
      aria-label="Simulator Movement Meter"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <Gauge className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Simulator Movement Meter
          </h3>
          <p className="text-xs text-muted-foreground">
            Absolute simulator price move for {asset.symbol}
          </p>
        </div>
      </div>
      
      {/* Visual Gauge */}
      <div className="flex justify-center my-6">
        <div className="relative w-40 h-20 overflow-hidden">
          {/* Background arc */}
          <div className="absolute inset-0 border-8 border-muted/30 rounded-t-full" />
          
          {/* Colored segments */}
          <div className="absolute inset-0 border-8 border-transparent border-t-red-500/50 border-l-red-500/50 rounded-t-full" 
               style={{ clipPath: 'polygon(0 100%, 0 0, 33% 0, 33% 100%)' }} />
          <div className="absolute inset-0 border-8 border-transparent border-t-yellow-500/50 rounded-t-full"
               style={{ clipPath: 'polygon(33% 100%, 33% 0, 66% 0, 66% 100%)' }} />
          <div className="absolute inset-0 border-8 border-transparent border-t-green-500/50 border-r-green-500/50 rounded-t-full"
               style={{ clipPath: 'polygon(66% 100%, 66% 0, 100% 0, 100% 100%)' }} />
          
          {/* Needle */}
          <div 
            className="absolute bottom-0 left-1/2 w-1 h-16 origin-bottom transition-transform duration-700 ease-out"
            style={{ transform: `translateX(-50%) rotate(${gaugeRotation}deg)` }}
          >
            <div className={cn("w-full h-full rounded-t", getProgressColor(score))} />
          </div>
          
          {/* Center circle */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-6 h-6 rounded-full bg-background border-2 border-primary" />
        </div>
      </div>
      
      {/* Score Display */}
      <div className="text-center mb-4">
        <span className={cn("text-4xl font-bold", getScoreColor(score))}>
          {score}
        </span>
        <span className="text-muted-foreground text-lg">/100</span>
      </div>
      
      <div className="mb-4 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-xs text-muted-foreground">
        Scale: 0-5% absolute simulator move maps linearly to 0-100. This is a display of recent simulated movement only — not a strategy score, risk rating, recommendation or forecast.
      </div>
      
      {/* Interpretation */}
      <p className="text-xs text-muted-foreground text-center italic border-t border-white/5 pt-3">
        {interpretation}
      </p>
    </section>
  );
}