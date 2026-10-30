import { quoteDisplay } from "@/lib/quoteDisplay";
import { formatPrice as formatAssetPrice } from "@/lib/assets";
import { Asset } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface AssetContextCardProps {
  asset: Asset;
}

const TYPE_LABELS: Record<Asset["type"], string> = {
  crypto: "Crypto",
  stock: "Stock",
  etf: "ETF",
  commodity: "Commodity",
  forex: "Forex",
};

function getRiskProfile(asset: Asset) {
  const context = { crypto: "Network, custody and price risks vary by token", stock: "Company ownership exposure", etf: "Exposure depends on the fund holdings", forex: "Currency-pair exposure", commodity: "Commodity price exposure" };
  return context[asset.type];
}

function getBiasLabel(changePercent: number) {
  if (changePercent > 2) return "Above +2%";
  if (changePercent < -2) return "Below −2%";
  return "Inside ±2%";
}

export function AssetContextCard({ asset }: AssetContextCardProps) {
  const isUp = asset.changePercent >= 0;

  return (
    <section className="glass-tactile border-chrome rounded-2xl p-4 md:p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-xl font-semibold md:text-2xl">
              {asset.name}
            </h2>
            <Badge
              variant="outline"
              className="border-white/10 bg-white/5 text-[10px] uppercase tracking-wide text-muted-foreground"
            >
              {TYPE_LABELS[asset.type] ?? asset.type}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{asset.symbol}</p>
        </div>

        <div className="text-left md:text-right">
          <p className="text-2xl font-semibold tabular-nums md:text-3xl">
            {quoteDisplay(asset, formatAssetPrice(asset.price, asset.type))}
          </p>
          <div
            className={cn(
              "mt-1 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
              isUp ? "bg-profit/10 text-profit" : "bg-loss/10 text-loss",
            )}
          >
            {isUp ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            {isUp ? "+" : ""}
            {asset.changePercent.toFixed(2)}%
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
          <p className="text-2xs uppercase tracking-wide text-muted-foreground">
            What you&apos;re trading
          </p>
          <p className="mt-1 text-sm font-medium">
            {TYPE_LABELS[asset.type]} · Simulated market practice
          </p>
        </div>

        <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
          <p className="text-2xs uppercase tracking-wide text-muted-foreground">
            Asset-class context
          </p>
          <p className="mt-1 text-sm font-medium">{getRiskProfile(asset)}</p>
        </div>

        <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
          <p className="text-2xs uppercase tracking-wide text-muted-foreground">
            Practice move bucket
          </p>
          <p className="mt-1 text-sm font-medium">{getBiasLabel(asset.changePercent)}</p>
        </div>
      </div>
    </section>
  );
}
