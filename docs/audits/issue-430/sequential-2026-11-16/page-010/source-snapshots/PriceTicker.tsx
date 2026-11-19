import { useEffect, useState } from "react";
import { Asset } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface PriceTickerProps {
  assets: Asset[];
}

export function PriceTicker({ assets }: PriceTickerProps) {
  const [offset, setOffset] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [motionChoice, setMotionChoice] = useState<boolean | null>(null);
  const topAssets = assets.slice(0, 20); // Show top 20 assets
  const moving = motionChoice ?? !reducedMotion;

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(preference.matches);
    update();
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!moving || topAssets.length === 0) return;
    const interval = setInterval(() => {
      setOffset((prev) => (prev + 1) % (topAssets.length * 200));
    }, 50);

    return () => clearInterval(interval);
  }, [moving, topAssets.length]);

  return (
    <section aria-label="Practice price ticker" className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl overflow-hidden">
      <div className="px-3 pt-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label={moving ? "Stop price ticker motion" : "Start price ticker motion"}
          onClick={() => {
            setOffset(0);
            setMotionChoice(!moving);
          }}
        >
          {moving ? "Stop scrolling" : "Start scrolling"}
        </Button>
      </div>
      <div
        className={moving ? "overflow-hidden" : "overflow-x-auto"}
        tabIndex={moving ? undefined : 0}
        role={moving ? undefined : "group"}
        aria-label={moving ? undefined : "Scroll practice prices"}
      >
        <div
          className="flex w-max gap-8 py-2.5 px-6"
          style={moving ? { transform: `translateX(-${offset}px)`, transition: "transform 0.05s linear" } : undefined}
        >
          {(moving ? [...topAssets, ...topAssets] : topAssets).map((asset, index) => {
            const isPositive = asset.changePercent >= 0;
            return (
              <div
                key={`${asset.id}-${index}`}
                aria-hidden={index >= topAssets.length || undefined}
                className="flex items-center gap-3 whitespace-nowrap"
              >
                <span className="font-bold">{asset.symbol}</span>
                <span className="text-muted-foreground">
                  ${asset.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                </span>
                <span className={cn(
                  "flex items-center gap-1 text-sm font-medium",
                  isPositive ? "text-success" : "text-destructive",
                )}>
                  {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {isPositive ? "+" : ""}{asset.changePercent.toFixed(2)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
