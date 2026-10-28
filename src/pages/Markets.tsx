import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { TradingSidebar } from "@/components/trading/TradingSidebar";
import { MarketClusters } from "@/components/MarketClusters";
import { MegaFooter } from "@/components/MegaFooter";
import { SEOSection } from "@/components/SEOSection";
import { ContextualLinks } from "@/components/ContextualLinks";
import { ASSETS, formatPrice } from "@/lib/assets";
import { Asset } from "@/lib/types";
import { simulateAssetPrices } from "@/lib/priceSimulation";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, TrendingUp, TrendingDown, Star, ArrowUpDown } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

type SortField = 'name' | 'price' | 'change' | 'volume';
type SortOrder = 'asc' | 'desc';

// NEW: sector + wiki data for internal linking
const SECTORS = [
  { id: "ai-tech", label: "AI & Tech", description: "Artificial intelligence, semiconductors & software" },
  { id: "crypto-defi", label: "Crypto & DeFi", description: "Bitcoin, Ethereum & DeFi tokens" },
  { id: "mega-cap", label: "Mega Cap", description: "World's largest companies by market cap" },
  { id: "etf-indices", label: "ETFs & Indices", description: "Index-tracking and thematic ETF examples" },
  { id: "forex-currencies", label: "Forex & Currencies", description: "Major and minor currency pairs" },
  { id: "commodities", label: "Commodities", description: "Gold, oil, silver & agricultural markets" },
];

const WIKI_TERMS = [
  { slug: "bear-trap", label: "Bear Trap" },
  { slug: "bull-trap", label: "Bull Trap" },
  { slug: "candlestick-patterns", label: "Candlestick Patterns" },
  { slug: "death-cross", label: "Death Cross" },
  { slug: "double-bottom", label: "Double Bottom" },
  { slug: "fibonacci-retracement", label: "Fibonacci Retracement" },
  { slug: "fomo", label: "FOMO" },
  { slug: "fud", label: "FUD" },
  { slug: "head-and-shoulders", label: "Head & Shoulders" },
  { slug: "hodl-strategy", label: "HODL Strategy" },
  { slug: "leverage-trading", label: "Leverage Trading" },
  { slug: "limit-order-vs-market-order", label: "Limit vs Market Order" },
  { slug: "macd", label: "MACD" },
  { slug: "macd-histogram", label: "MACD Histogram" },
  { slug: "order-block", label: "Order Block" },
  { slug: "rsi-divergence", label: "RSI Divergence" },
  { slug: "satoshi-nakamoto", label: "Satoshi Nakamoto" },
  { slug: "short-squeeze", label: "Short Squeeze" },
  { slug: "stop-loss-hunting", label: "Stop Loss Hunting" },
  { slug: "support-and-resistance", label: "Support & Resistance" },
  { slug: "whale-manipulation", label: "Whale Manipulation" },
];

export default function Markets() {
  const [assets, setAssets] = useState(ASSETS);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sortField, setSortField] = useState<SortField>('volume');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  useEffect(() => {
    const interval = setInterval(() => {
      setAssets(prev => simulateAssetPrices(prev, 0.03));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Arbitrary demo activity for visual sorting, not observed volume or monetary turnover.
  const getVolume = (asset: Asset) => Math.abs(asset.price * (100 + asset.change) * 10000);

  const filteredAssets = assets
    .filter(a => category === "all" || a.type === category)
    .filter(a => 
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.symbol.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'change':
          comparison = a.changePercent - b.changePercent;
          break;
        case 'volume':
          comparison = getVolume(a) - getVolume(b);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const gainers = assets.filter(a => a.changePercent > 0).sort((a, b) => b.changePercent - a.changePercent).slice(0, 5);
  const losers = assets.filter(a => a.changePercent < 0).sort((a, b) => a.changePercent - b.changePercent).slice(0, 5);

  const SortButton = ({ field, label }: { field: SortField; label: string }) => (
    <button
      onClick={() => handleSort(field)}
      className={cn(
        "flex items-center gap-1 text-xs font-medium transition-colors",
        sortField === field ? "text-primary" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {label}
      <ArrowUpDown className="h-3 w-3" />
    </button>
  );

  return (
    <>
      <Helmet>
        <title>Practice Markets — Stocks, Crypto, ETFs & Forex | TradeHQ</title>
        <meta name="description" content="Browse 170 practice markets across stocks, crypto, ETFs, forex and commodities. Quotes may be simulated, cached or delayed. Trade with $100K virtual cash." />
        <link rel="canonical" href="https://www.thetradehq.com/markets" />
        <meta name="robots" content="index, follow" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Practice Markets — 170 Stocks, Crypto, ETFs & Forex | TradeHQ" />
        <meta property="og:description" content="Explore simulated, cached or delayed market data across stocks, crypto, ETFs, forex and commodities." />
        <meta property="og:url" content="https://www.thetradehq.com/markets" />
        <meta property="og:image" content="https://www.thetradehq.com/tradehq-preview-2026.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content="TradeHQ" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Practice Markets — 170 Assets | TradeHQ" />
        <meta name="twitter:description" content="Track stocks, crypto, ETFs, forex & commodities. Free market dashboard." />
        <meta name="twitter:image" content="https://www.thetradehq.com/tradehq-preview-2026.png" />
      </Helmet>

      <div className="min-h-screen bg-background flex">
        <TradingSidebar />

        <main className="flex-1 min-w-0 p-3 md:p-6 animate-fade-in">
          <div className="max-w-7xl mx-auto space-y-6">

            {/* Static H1 Header - Renders immediately for Google */}
            <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 transition-all duration-300">
              <div>
                <h1 className="text-xl md:text-3xl font-bold">Market Practice Hub</h1>
                <p className="text-muted-foreground text-xs md:text-sm">
                  Explore {assets.length} practice instruments with generated display data across crypto, stocks, ETFs, forex, and commodities. Changes are seeded initially, then show the latest generated update, not a measured 24-hour return. Demo activity is an arbitrary synthetic display value, not traded market volume.
                </p>
              </div>
              <div className="relative w-full md:w-72 transition-all duration-300">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  aria-label="Search practice instruments"
                  placeholder="Search assets..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 h-9 md:h-10 transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </header>

            {/* Topical Clusters + State of the Market 2026 Intro */}
            <MarketClusters assets={assets} />

            <ContextualLinks variant="markets" />

            {/* ── NEW: Sector Directory for internal linking ── */}
            <section aria-label="Market Sectors">
              <h2 className="font-semibold text-base md:text-lg mb-3">Browse by Sector</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {SECTORS.map(sector => (
                  <Link
                    key={sector.id}
                    to={`/sectors/${sector.id}`}
                    className="flex flex-col gap-1 p-4 rounded-xl bg-card border border-border hover:border-primary/30 hover:bg-primary/5 transition-all duration-200"
                  >
                    <span className="font-semibold text-sm text-foreground">{sector.label}</span>
                    <span className="text-[10px] text-muted-foreground leading-snug">{sector.description}</span>
                  </Link>
                ))}
              </div>
            </section>

            {/* Top Movers - ORIGINAL links preserved using asset.id */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
              <div className="bg-card rounded-xl border border-border p-3 md:p-4 transition-all duration-300 hover:shadow-lg hover:border-primary/20">
                <div className="flex items-center gap-2 mb-3 md:mb-4">
                  <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-profit" />
                  <h2 className="font-semibold text-sm md:text-base">Top Gainers</h2>
                </div>
                <div className="space-y-1.5 md:space-y-2">
                  {gainers.map((asset, i) => (
                    <Link
                      key={asset.id}
                      to={`/trade/${asset.id}`}
                      className="flex items-center justify-between p-2.5 md:p-2 rounded-lg hover:bg-accent/50 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-2 md:gap-3">
                        <span className="text-muted-foreground text-xs md:text-sm w-4">{i + 1}</span>
                        <div>
                          <p className="font-medium text-sm md:text-sm">{asset.symbol}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[100px] md:max-w-none">{asset.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-sm">${formatPrice(asset.price, asset.type)}</p>
                        <Badge variant="outline" className="text-profit border-profit/30 text-xs transition-all duration-200">
                          +{asset.changePercent.toFixed(2)}%
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="bg-card rounded-xl border border-border p-3 md:p-4 transition-all duration-300 hover:shadow-lg hover:border-primary/20">
                <div className="flex items-center gap-2 mb-3 md:mb-4">
                  <TrendingDown className="h-4 w-4 md:h-5 md:w-5 text-loss" />
                  <h2 className="font-semibold text-sm md:text-base">Top Losers</h2>
                </div>
                <div className="space-y-1.5 md:space-y-2">
                  {losers.map((asset, i) => (
                    <Link
                      key={asset.id}
                      to={`/trade/${asset.id}`}
                      className="flex items-center justify-between p-2.5 md:p-2 rounded-lg hover:bg-accent/50 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-2 md:gap-3">
                        <span className="text-muted-foreground text-xs md:text-sm w-4">{i + 1}</span>
                        <div>
                          <p className="font-medium text-sm md:text-sm">{asset.symbol}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[100px] md:max-w-none">{asset.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-sm">${formatPrice(asset.price, asset.type)}</p>
                        <Badge variant="outline" className="text-loss border-loss/30 text-xs transition-all duration-200">
                          {asset.changePercent.toFixed(2)}%
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* All Assets Table - ORIGINAL links preserved using asset.id */}
            <div className="bg-card rounded-xl border border-border overflow-hidden transition-all duration-300 hover:shadow-lg">
              <Tabs value={category} onValueChange={setCategory}>
                <div className="p-2 md:p-4 border-b border-border overflow-x-auto">
                  <TabsList className="bg-muted/50 transition-all duration-200">
                    <TabsTrigger value="all" className="text-xs md:text-sm transition-all duration-200">All</TabsTrigger>
                    <TabsTrigger value="crypto" className="text-xs md:text-sm transition-all duration-200">Crypto</TabsTrigger>
                    <TabsTrigger value="stock" className="text-xs md:text-sm transition-all duration-200">Stocks</TabsTrigger>
                    <TabsTrigger value="etf" className="text-xs md:text-sm transition-all duration-200">ETFs</TabsTrigger>
                    <TabsTrigger value="forex" className="text-xs md:text-sm transition-all duration-200">Forex</TabsTrigger>
                    <TabsTrigger value="commodity" className="text-xs md:text-sm transition-all duration-200">Commodities</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value={category} className="m-0 animate-fade-in">
                  {/* Table Header */}
                  <div className="hidden md:grid grid-cols-5 gap-4 px-4 py-3 bg-muted/30 border-b border-border">
                    <SortButton field="name" label="Asset" />
                    <SortButton field="price" label="Price" />
                    <SortButton field="change" label="Practice Change" />
                    <SortButton field="volume" label="Demo activity" />
                    <span className="text-xs text-muted-foreground">Action</span>
                  </div>

                  <ScrollArea className="h-[350px] md:h-[400px]">
                    <div className="divide-y divide-border">
                      {filteredAssets.map((asset, index) => (
                        <div
                          key={asset.id}
                          className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-4 p-3 md:p-4 hover:bg-accent/30 transition-all duration-200 hover:scale-[1.005] active:scale-[0.995]"
                          style={{ animationDelay: `${index * 30}ms` }}
                        >
                          <div className="flex items-center gap-2 md:gap-3">
                            <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-primary/10 flex items-center justify-center transition-all duration-200">
                              <span className="text-[10px] md:text-xs font-bold text-primary">
                                {asset.symbol.slice(0, 2)}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-xs md:text-sm">{asset.symbol}</p>
                              <p className="text-[10px] md:text-xs text-muted-foreground hidden md:block">{asset.name}</p>
                            </div>
                          </div>

                          <div className="text-right md:text-left flex items-center justify-end md:justify-start">
                            <p className="font-mono text-xs md:text-sm">${formatPrice(asset.price, asset.type)}</p>
                          </div>

                          <div className="md:col-span-1 flex items-center">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] md:text-xs transition-all duration-200",
                                asset.changePercent >= 0
                                  ? "text-profit border-profit/30"
                                  : "text-loss border-loss/30"
                              )}
                            >
                              {asset.changePercent >= 0 ? "+" : ""}
                              {asset.changePercent.toFixed(2)}%
                            </Badge>
                          </div>

                          <div className="hidden md:flex items-center">
                            <p className="text-sm text-muted-foreground">
                              {(getVolume(asset) / 1e6).toFixed(1)}M
                            </p>
                          </div>

                          <div className="col-span-2 md:col-span-1 mt-2 md:mt-0 flex items-center">
                            <Link
                              to={`/trade/${asset.id}`}
                              className="inline-flex items-center justify-center w-full md:w-auto px-3 md:px-4 py-1.5 text-[10px] md:text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 hover:scale-105 active:scale-95"
                            >
                              Trade
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </div>

            {/* Complete Asset Directory - ORIGINAL uses asset.id, kept exactly */}
            <div className="bg-card/50 backdrop-blur-xl rounded-2xl border border-white/10 p-4 md:p-6 mt-6">
              <h2 className="font-semibold text-base md:text-lg mb-2">
                📊 Complete Asset Directory
              </h2>
              <p className="text-xs text-muted-foreground mb-6">
                Trade all {assets.length}+ assets with $100K virtual capital. 
                Select any market below to start practicing:
              </p>
              
              {(['crypto', 'stock', 'etf', 'forex', 'commodity'] as const).map(type => {
                const typeAssets = assets.filter(a => a.type === type);
                if (typeAssets.length === 0) return null;
                
                const typeLabels: Record<string, string> = {
                  crypto: '₿ Cryptocurrencies',
                  stock: '📈 Stocks',
                  etf: '📊 ETFs',
                  forex: '💱 Forex',
                  commodity: '🏆 Commodities'
                };
                
                return (
                  <div key={type} className="mb-6 last:mb-0">
                    <h3 className="text-sm font-medium text-foreground mb-3">
                      {typeLabels[type]}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {typeAssets.map(asset => (
                        <Link 
                          key={asset.id} 
                          to={`/trade/${asset.id}`}
                          className="inline-flex items-center min-h-[44px] px-4 py-2 text-xs font-medium rounded-full 
                            bg-white/5 backdrop-blur-xl border border-white/10 
                            text-foreground/80 hover:text-foreground
                            hover:bg-white/10 hover:border-white/20 
                            transition-all duration-200 hover:scale-[1.02]"
                        >
                          {asset.symbol}
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── NEW: Trading Glossary for internal linking ── */}
            <section aria-label="Trading Glossary" className="bg-card/50 backdrop-blur-xl rounded-2xl border border-white/10 p-4 md:p-6">
              <h2 className="font-semibold text-base md:text-lg mb-2">📖 Trading Glossary</h2>
              <p className="text-xs text-muted-foreground mb-4">
                Master essential trading concepts before you trade:
              </p>
              <div className="flex flex-wrap gap-2">
                {WIKI_TERMS.map(term => (
                  <Link
                    key={term.slug}
                    to={`/wiki/${term.slug}`}
                    className="inline-flex items-center min-h-[36px] px-3 py-1.5 text-xs font-medium rounded-full bg-primary/5 border border-primary/15 text-primary/80 hover:text-primary hover:bg-primary/10 hover:border-primary/30 transition-all duration-200"
                  >
                    {term.label}
                  </Link>
                ))}
              </div>
            </section>

          </div>
        </main>
      </div>

      <div className="container mx-auto px-4 md:px-6 mt-6">
        <SEOSection
          path="/markets"
          faqHeading="Markets"
          breadcrumbs={[{ label: "Markets" }]}
          faqs={[
            {
              question: "What does the TradeHQ Markets dashboard show?",
              answer:
                "The markets dashboard shows simulated practice prices, percentage change and synthetic demo activity across crypto, stocks, ETFs, forex and commodities. Values on this page are generated for the simulator and are not execution-quality market quotes.",
            },
            {
              question: "How often does market data refresh?",
              answer:
                "This dashboard updates its simulated practice prices every few seconds for visual feedback. Provider-backed, delayed or cached data may be used elsewhere on TradeHQ and is labelled separately when available.",
            },
            {
              question: "Can I trade directly from the Markets page?",
              answer:
                "Yes — click any asset row to open the trading terminal with $100,000 of virtual cash. (Educational simulation only — not financial advice.)",
            },
            {
              question: "Which sectors are covered?",
              answer:
                "Six pillar sectors: AI & Tech, Crypto & DeFi, Mega Cap, ETFs & Indices, Forex & Currencies, and Commodities. Each has a dedicated hub page with sector-level analysis.",
            },
          ]}
        />
      </div>

      {/* Mega Footer - Outside the flex container */}
      <MegaFooter />
    </>
  );
}
