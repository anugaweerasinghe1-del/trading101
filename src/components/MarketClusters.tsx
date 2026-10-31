import { Asset } from "@/lib/types";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  Cpu, 
  Coins, 
  Building2, 
  Globe, 
  Gem,
  TrendingUp,
  Sparkles
} from "lucide-react";

interface MarketClustersProps {
  assets: Asset[];
}

interface Cluster {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  assetIds: string[];
}

const MARKET_CLUSTERS: Cluster[] = [
  {
    id: "ai-revolution",
    name: "🤖 AI Revolution",
    description: "Companies powering the artificial intelligence boom",
    icon: Cpu,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    assetIds: ["nvda", "msft", "googl", "meta"]
  },
  {
    id: "digital-gold",
    name: "💎 Digital Gold",
    description: "Leading cryptocurrencies and blockchain assets",
    icon: Coins,
    color: "text-orange-400",
    bgColor: "bg-orange-500/10",
    assetIds: ["btc", "eth", "sol", "xrp", "bnb"]
  },
  {
    id: "blue-chip-giants",
    name: "🏛️ Blue Chip Giants",
    description: "Examples of large listed companies and an equity ETF",
    icon: Building2,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    assetIds: ["aapl", "amzn", "nflx", "spy"]
  },
  {
    id: "global-markets",
    name: "🌍 Global Markets",
    description: "Major forex pairs and international exposure",
    icon: Globe,
    color: "text-green-400",
    bgColor: "bg-green-500/10",
    assetIds: ["eurusd", "gbpusd"]
  },
  {
    id: "hard-assets",
    name: "⚡ Hard Assets",
    description: "Commodity practice exposures with different price drivers",
    icon: Gem,
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/10",
    assetIds: ["gold", "oil"]
  }
];

export function MarketClusters({ assets }: MarketClustersProps) {
  const getAssetsByCluster = (assetIds: string[]) => {
    return assets.filter(a => assetIds.includes(a.id));
  };

  return (
    <section className="space-y-6" aria-label="Market Clusters">
      {/* SEO State of the Market 2026 Intro */}
      <article className="bg-gradient-to-br from-primary/10 via-background to-accent/10 rounded-2xl border border-primary/20 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">
            Market Categories: Practice Trading Guide
          </h2>
        </div>
        
        <div className="prose prose-sm prose-invert max-w-none">
          <p className="text-muted-foreground leading-relaxed mb-3">
            These categories group selected catalogue instruments by asset class or business theme. They are educational navigation aids, not a current market outlook, valuation assessment or forecast. Asset pages describe the available practice data and its limitations.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-3">
            The catalogue includes technology stocks, cryptocurrencies, currencies, commodities and ETFs. Comparing them can illustrate different position values and asset descriptions. A category label does not measure suitability, safety, expected returns or current momentum.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            TradeHQ's $100,000 virtual portfolio lets you compare hypothetical positions across these categories without using real money. Record the assumptions behind a practice decision and review what the simulator can and cannot reproduce.
          </p>
        </div>
      </article>
      
      {/* Cluster Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {MARKET_CLUSTERS.map((cluster) => {
          const clusterAssets = getAssetsByCluster(cluster.assetIds);
          const Icon = cluster.icon;
          // a.change is an ABSOLUTE price change in USD/quote units, not a percent.
          // Averaging dollars across Bitcoin, stocks and FX and appending '%' creates
          // nonsensical figures such as -479.3%. Use the per-asset simulated % instead.
          const avgChange = clusterAssets.length > 0
            ? clusterAssets.reduce((sum, a) => sum + (Number.isFinite(a.changePercent) ? a.changePercent : 0), 0) / clusterAssets.length
            : 0;
          
          return (
            <div 
              key={cluster.id}
              className={cn(
                "rounded-xl border p-4 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]",
                cluster.bgColor,
                "border-white/10"
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Icon className={cn("w-5 h-5", cluster.color)} />
                  <h3 className="font-semibold text-foreground">{cluster.name}</h3>
                </div>
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-xs",
                    avgChange >= 0 ? "text-green-400 border-green-400/30" : "text-red-400 border-red-400/30"
                  )}
                >
                  {avgChange >= 0 ? "+" : ""}{avgChange.toFixed(1)}% <span className="sr-only">average simulated percentage change</span>
                </Badge>
              </div>
              
              <p className="text-xs text-muted-foreground mb-3">
                {cluster.description}
              </p>
              
              <div className="flex flex-wrap gap-1.5">
                {clusterAssets.slice(0, 5).map((asset) => (
                  <Link
                    key={asset.id}
                    to={`/trade/${asset.id}`}
                    className={cn(
                      "inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all",
                      "bg-background/50 hover:bg-background text-foreground hover:text-primary"
                    )}
                  >
                    <span>{asset.symbol}</span>
                    <span className={cn(
                      "text-[10px]",
                      (asset.change || 0) >= 0 ? "text-green-400" : "text-red-400"
                    )}>
                      {(asset.change || 0) >= 0 ? "↑" : "↓"}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
