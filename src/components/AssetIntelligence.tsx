import { Asset } from "@/lib/types";
import { getAssetContent, getCategoryIntro } from "@/lib/assetContent";
import { LiveMarketData } from "@/hooks/useLiveMarketData";
import { BookOpen, Target, BarChart3, AlertTriangle, Loader2, Info, Wifi, WifiOff } from "lucide-react";

interface AssetIntelligenceProps {
  asset: Asset;
  liveMarketCap?: string;
  liveData?: LiveMarketData | null;
  isLiveLoading?: boolean;
}

// Truncate meta description to 155 characters safely (no mid-sentence cuts)
export function truncateMetaDescription(text: string, maxLength: number = 155): string {
  if (text.length <= maxLength) return text;
  
  // Find the last sentence boundary before maxLength
  const truncated = text.slice(0, maxLength);
  const lastPeriod = truncated.lastIndexOf('.');
  const lastQuestion = truncated.lastIndexOf('?');
  const lastExclamation = truncated.lastIndexOf('!');
  
  const lastBoundary = Math.max(lastPeriod, lastQuestion, lastExclamation);
  
  if (lastBoundary > maxLength * 0.5) {
    return text.slice(0, lastBoundary + 1);
  }
  
  // Fallback: cut at last space and add ellipsis
  const lastSpace = truncated.lastIndexOf(' ');
  return text.slice(0, lastSpace) + '...';
}

// Format large numbers for display
function formatLargeNumber(num: number): string {
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
  return `$${num.toFixed(2)}`;
}

// Format volume for display
function formatVolume(num: number): string {
  if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
  return num.toFixed(0);
}

export function AssetIntelligence({ asset, liveMarketCap, liveData, isLiveLoading }: AssetIntelligenceProps) {
  const content = getAssetContent(asset.id);
  const categoryIntro = getCategoryIntro(asset.type);
  
  if (!content) return null;

  const stats = content.stats;
  const isLiveDataAvailable = liveData?.source === 'live';
  const isGoldProxy = asset.id === 'gold' && isLiveDataAvailable;
  
  // Use live data if available, otherwise fall back to asset data
  const displayPrice = liveData?.price ?? asset.price;
  const displayChange = liveData ? liveData.changePercent24h : asset.changePercent;
  const displayVolume = liveData?.volume24h;
  const displayMarketCap = liveData?.marketCap;

  return (
    <section 
      className="mt-8"
      aria-label={`${asset.name} Asset Intelligence`}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          Asset Intelligence
        </h2>
        
        {/* Live data indicator */}
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
          isLiveDataAvailable 
            ? 'bg-profit/20 text-profit' 
            : 'bg-muted text-muted-foreground'
        }`}>
          {isLiveLoading ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              Updating...
            </>
          ) : isLiveDataAvailable ? (
            <>
              <Wifi className="w-3 h-3" />
              Provider / practice data
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3" />
              Simulated
            </>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground mb-4">
        Quotes can be provider-sourced while other fields are delayed or simulated.
        High and low values are omitted because this feed can generate those fields.
        Read any supplied provider observation time separately from the page refresh time.
      </p>
      
      {asset.id === 'gold' && <p className="text-sm text-muted-foreground mb-4">
        Gold provider quotes use the PAX Gold (PAXG) token as a price proxy.
        Its market cap and trading volume describe that token, not the global gold market or an XAU/USD spot feed.
        Fixed fallback prices and separately labelled practice charts can also appear.
        {" "}<a href="https://www.paxos.com/pax-gold" className="text-primary underline">About the PAXG token</a>.
      </p>}

      {/* Category Intro - SEO Multiplier */}
      <div className="mb-6 p-4 rounded-xl bg-primary/5 border border-primary/10">
        <p className="text-sm text-muted-foreground flex items-start gap-2">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" aria-hidden="true" />
          <span>{categoryIntro}</span>
        </p>
      </div>
      
      <div 
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
        role="region"
        aria-label="Asset information cards"
      >
        {/* Column 1: Context (What Is) */}
        <article 
          className="glass-panel border border-white/10 rounded-2xl p-6"
          aria-labelledby={`context-heading-${asset.id}`}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary" aria-hidden="true" />
            </div>
            <h3 
              id={`context-heading-${asset.id}`}
              className="text-lg font-semibold text-foreground"
            >
              What is {asset.name}?
            </h3>
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {content.whatIs}
          </p>
        </article>

        {/* Column 2: Strategy */}
        <article 
          className="glass-panel border border-white/10 rounded-2xl p-6"
          aria-labelledby={`strategy-heading-${asset.id}`}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-accent" aria-hidden="true" />
            </div>
            <h3 
              id={`strategy-heading-${asset.id}`}
              className="text-lg font-semibold text-foreground"
            >
              Simulator Strategy
            </h3>
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed mb-4">
            {content.strategy}
          </p>
          {/* Legal Disclaimer */}
          <div className="mt-auto pt-3 border-t border-white/5">
            <p className="text-xs text-muted-foreground/70 flex items-start gap-1.5">
              <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0 text-yellow-500/70" aria-hidden="true" />
              <span>Disclaimer: Not financial advice. For educational simulation only.</span>
            </p>
          </div>
        </article>

        {/* Column 3: Stats - Now with Live Data */}
        <article 
          className="glass-panel border border-white/10 rounded-2xl p-6"
          aria-labelledby={`stats-heading-${asset.id}`}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-secondary" aria-hidden="true" />
            </div>
            <h3 
              id={`stats-heading-${asset.id}`}
              className="text-lg font-semibold text-foreground"
            >
              Key Stats
            </h3>
          </div>
          
          <div className="space-y-3">
            {/* Live Price */}
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-sm">{isGoldProxy ? "PAXG proxy price" : "Price"}</span>
              <span className="text-foreground font-medium tabular-nums">
                {isLiveLoading && !liveData ? (
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Loader2 className="w-3 h-3 animate-spin" />
                  </span>
                ) : (
                  `$${displayPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                )}
              </span>
            </div>
            
            {/* 24h Change */}
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-sm">{isGoldProxy ? "PAXG 24h change" : "24h Change"}</span>
              <span className={`font-medium tabular-nums ${displayChange >= 0 ? 'text-profit' : 'text-loss'}`}>
                {isLiveLoading && !liveData ? (
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Loader2 className="w-3 h-3 animate-spin" />
                  </span>
                ) : (
                  <>
                    {displayChange === null ? 'Unavailable' : `${displayChange >= 0 ? '+' : ''}${displayChange.toFixed(2)}%`}
                  </>
                )}
              </span>
            </div>

            {/* 24h Volume - NEW LIVE DATA */}
            {displayVolume && displayVolume > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">{isGoldProxy ? "PAXG token 24h volume" : "24h Volume"}</span>
                <span className="text-foreground font-medium tabular-nums">
                  ${formatVolume(displayVolume)}
                </span>
              </div>
            )}

            {/* Market Cap - Live or Static */}
            {(displayMarketCap || stats?.marketCap) && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">{isGoldProxy ? "PAXG token market cap" : "Market Cap"}</span>
                <span className="text-foreground font-medium tabular-nums">
                  {displayMarketCap ? (
                    formatLargeNumber(displayMarketCap)
                  ) : stats?.marketCap === "live_sourced_at_runtime" ? (
                    liveMarketCap ? (
                      liveMarketCap
                    ) : isLiveLoading ? (
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Loading...
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Unavailable</span>
                    )
                  ) : (
                    stats?.marketCap
                  )}
                </span>
              </div>
            )}
            
            {/* Asset Class */}
            {stats?.assetClass && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">Asset Class</span>
                <span className="text-foreground font-medium">{stats.assetClass}</span>
              </div>
            )}
            
            {/* Sector (for stocks) */}
            {stats?.sector && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">Sector</span>
                <span className="text-foreground font-medium">{stats.sector}</span>
              </div>
            )}
            
            {/* Primary Driver */}
            {stats?.primaryDriver && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">Primary Driver</span>
                <span className="text-foreground font-medium">{stats.primaryDriver}</span>
              </div>
            )}
            
            {/* Consensus (for crypto) */}
            {stats?.consensus && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">Consensus</span>
                <span className="text-foreground font-medium">{stats.consensus}</span>
              </div>
            )}
            
            {/* TPS (for high-performance chains) */}
            {stats?.TPS && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">TPS</span>
                <span className="text-foreground font-medium">{stats.TPS}</span>
              </div>
            )}
            
            {/* Avg Daily Volume (for forex) - fallback to static */}
            {stats?.avgDailyVolume && stats.avgDailyVolume !== "live_sourced_at_runtime" && !displayVolume && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">Avg Volume</span>
                <span className="text-foreground font-medium">{stats.avgDailyVolume}</span>
              </div>
            )}
            
            {/* Pip Value (for forex) */}
            {stats?.pipValue && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">Pip Value</span>
                <span className="text-foreground font-medium">{stats.pipValue}</span>
              </div>
            )}
            
            {/* Benchmark (for commodities) */}
            {stats?.benchmark && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">Benchmark</span>
                <span className="text-foreground font-medium">{stats.benchmark}</span>
              </div>
            )}
            
            {/* Units (for commodities) */}
            {stats?.units && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">Units</span>
                <span className="text-foreground font-medium">{stats.units}</span>
              </div>
            )}
            
            {/* Expense Ratio (for ETFs) */}
            {stats?.expenseRatio && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">Expense Ratio</span>
                <span className="text-foreground font-medium">{stats.expenseRatio}</span>
              </div>
            )}
            
            {/* Correlation */}
            {stats?.correlation && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">Correlation</span>
                <span className="text-foreground font-medium">{stats.correlation}</span>
              </div>
            )}
            
            {/* Source & Last Updated */}
            <div className="flex justify-between items-center pt-2 border-t border-white/5">
              <span className="text-muted-foreground/60 text-xs">
                {liveData?.provenance?.provider || 'No provider observation'}
              </span>
              {liveData?.lastUpdated && (
                <span className="text-muted-foreground/60 text-xs">
                  Provider observation {new Date(liveData.lastUpdated).toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
