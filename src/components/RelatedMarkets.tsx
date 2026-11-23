import { Link } from "react-router-dom";
import { Asset } from "@/lib/types";
import { ASSETS } from "@/lib/assets";
import { TrendingUp, ArrowRight, BarChart3 } from "lucide-react";

interface RelatedMarketsProps {
  currentAsset: Asset;
}

function getRelatedMarkets(currentAsset: Asset, count: number = 6): Asset[] {
  const sameType = ASSETS.filter(a => a.type === currentAsset.type && a.id !== currentAsset.id);
  const sorted = [...sameType].sort((a, b) => b.price - a.price);
  
  if (sorted.length >= count) return sorted.slice(0, count);
  
  // Fill remaining with other types
  const others = ASSETS.filter(a => a.type !== currentAsset.type && a.id !== currentAsset.id)
    .sort((a, b) => b.price - a.price)
    .slice(0, count - sorted.length);
  
  return [...sorted, ...others].slice(0, count);
}

function getAnchorText(asset: Asset): string {
  const actions = [
    `Analyze ${asset.symbol} Volatility`,
    `View ${asset.symbol} Chart`,
    `Practice ${asset.symbol} Trading`,
    `Study ${asset.symbol} Trends`,
    `Compare ${asset.symbol} Data`,
    `Track ${asset.symbol} Performance`,
  ];
  return actions[Math.floor(asset.name.length % actions.length)];
}

export function RelatedMarkets({ currentAsset }: RelatedMarketsProps) {
  const related = getRelatedMarkets(currentAsset, 6);
  if (related.length === 0) return null;

  return (
    <section className="mt-10" aria-label="Related markets to explore">
      <div className="flex items-center gap-2 mb-5">
        <BarChart3 className="w-5 h-5 text-primary" aria-hidden="true" />
        <h3 className="text-lg font-bold text-foreground tracking-tight">
          Related Markets
        </h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {related.map((asset) => (
          <Link
            key={asset.id}
            to={`/trade/${asset.id}`}
            title={getAnchorText(asset)}
            className="group bg-white/[0.02] border border-white/[0.08] backdrop-blur-xl rounded-xl p-4 hover:border-primary/30 transition-all duration-200 hover:scale-[1.02]"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors">
                {asset.symbol}
              </span>
              <ArrowRight className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>

            <p className="text-2xs text-muted-foreground mb-2 line-clamp-1">
              {asset.name}
            </p>

            <div className="space-y-1">
              <span className="text-xs font-medium text-foreground block">
                ${asset.price.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: asset.price < 1 ? 4 : 2,
                })}
              </span>
              <span
                className={`text-2xs font-medium block ${
                  asset.changePercent >= 0 ? "text-success" : "text-destructive"
                }`}
              >
                {asset.changePercent >= 0 ? "+" : ""}
                {asset.changePercent.toFixed(2)}%
              </span>
            </div>

            {/* Descriptive anchor text for SEO */}
            <span className="text-2xs text-muted-foreground mt-2 block group-hover:text-primary transition-colors line-clamp-1">
              {getAnchorText(asset)}
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-4 text-center">
        <Link
          to="/markets"
          className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
        >
          Explore all markets
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </section>
  );
}
