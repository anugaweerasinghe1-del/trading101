import NotFound from "./NotFound";
import { useParams, Navigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Navigation } from "@/components/Navigation";
import { MegaFooter } from "@/components/MegaFooter";
import { Breadcrumb } from "@/components/Breadcrumb";
import { SEOSection } from "@/components/SEOSection";
import { ASSETS, formatPrice } from "@/lib/assets";
import { TrendingUp, TrendingDown, ArrowRight, Cpu, Coins, Building2, Globe, Gem, LineChart } from "lucide-react";
import { cn } from "@/lib/utils";

// Sector definitions with assets
const SECTORS = {
  "ai-tech": {
    name: "AI & Technology",
    slug: "ai-tech",
    description: "Artificial intelligence and technology sector leaders driving computing and software development. From GPU manufacturers to cloud platforms, these companies are at the forefront of AI innovation.",
    icon: Cpu,
    assetIds: ["nvda", "msft", "googl", "meta", "amd", "intc"],
    keywords: ["AI stocks", "technology investing", "semiconductor stocks", "cloud computing"],
    color: "text-primary"
  },
  "crypto-defi": {
    name: "Crypto & DeFi",
    slug: "crypto-defi", 
    description: "Decentralized finance and cryptocurrency assets reshaping global finance. From Bitcoin's store of value to Ethereum's smart contract ecosystem, explore the digital asset revolution.",
    icon: Coins,
    assetIds: ["btc", "eth", "sol", "xrp", "bnb", "ada", "avax", "dot", "matic", "link", "doge", "ltc"],
    keywords: ["cryptocurrency trading", "DeFi investing", "Bitcoin", "Ethereum", "altcoins"],
    color: "text-secondary"
  },
  "mega-cap": {
    name: "Mega-Cap Leaders",
    slug: "mega-cap",
    description: "Selected large-company examples for virtual practice. Company size and familiarity do not guarantee stable prices, growth or investment returns.",
    icon: Building2,
    assetIds: ["aapl", "msft", "googl", "amzn", "nvda", "meta", "tsla"],
    keywords: ["mega-cap stocks", "blue chip investing", "FAANG stocks", "big tech"],
    color: "text-profit"
  },
  "tech-giants": {
    name: "Tech Giants",
    slug: "tech-giants",
    description: "The technology sector titans shaping our digital future. From search and social media to cloud computing and e-commerce, these companies participate in different parts of the technology sector.",
    icon: Building2,
    assetIds: ["aapl", "msft", "googl", "amzn", "meta", "nflx", "orcl", "adbe", "crm", "csco"],
    keywords: ["tech stocks", "big tech investing", "technology giants", "FAANG+"],
    color: "text-primary"
  },
  "forex-currencies": {
    name: "Forex & Currencies",
    slug: "forex-currencies",
    description: "Global currency markets reflecting macroeconomic conditions and central bank policies. Master forex trading with major pairs driven by Fed, ECB, and BOJ decisions.",
    icon: Globe,
    assetIds: ["eurusd", "gbpusd", "usdjpy", "usdchf", "audusd"],
    keywords: ["forex trading", "currency pairs", "EUR/USD", "central bank policy"],
    color: "text-chart-4"
  },
  "commodities": {
    name: "Commodities",
    slug: "commodities",
    description: "Physical commodities from precious metals to energy. Gold for inflation hedging, oil for energy exposure, and industrial metals as economic indicators.",
    icon: Gem,
    assetIds: ["gold", "silver", "oil", "natgas", "copper"],
    keywords: ["commodity trading", "gold investing", "oil trading", "precious metals"],
    color: "text-yellow-500"
  },
  "etf-indices": {
    name: "ETFs & Indices",
    slug: "etf-indices",
    description: "Exchange-traded funds providing diversified exposure to market indices. From broad market SPY to tech-focused QQQ, build balanced portfolios efficiently.",
    icon: LineChart,
    assetIds: ["spy", "qqq", "iwm", "dia", "voo", "arkk"],
    keywords: ["ETF investing", "index funds", "S&P 500", "passive investing"],
    color: "text-profit"
  }
};

export default function SectorPillar() {
  const { sectorId } = useParams<{ sectorId: string }>();
  
  // Find sector
  const sector = sectorId ? SECTORS[sectorId as keyof typeof SECTORS] : null;
  
  // Redirect if sector not found
  if (!sector) {
    return <NotFound />;
  }

  // Get assets for this sector
  const sectorAssets = sector.assetIds
    .map(id => ASSETS.find(a => a.id === id))
    .filter(Boolean);

  const canonicalUrl = `https://www.thetradehq.com/sectors/${sector.slug}`;

  // JSON-LD Schema
  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": `${sector.name} Trading Simulator | TradeHQ`,
    "description": sector.description,
    "url": canonicalUrl,
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": sectorAssets.length,
      "itemListElement": sectorAssets.map((asset, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "url": `https://www.thetradehq.com/trade/${asset!.id}`
      }))
    }
  };

  return (
    <>
      <Helmet>
        <title>{sector.name} Trading Simulator | Practice Guide | TradeHQ</title>
        <meta name="description" content={`Practice trading ${sector.name.toLowerCase()} assets with $100K virtual funds. ${sector.description.slice(0, 100)}...`} />
        <link rel="canonical" href={canonicalUrl} />
        <meta name="robots" content="noindex, follow" />
        <meta property="og:title" content={`${sector.name} Trading Simulator | TradeHQ`} />
        <meta property="og:description" content={sector.description} />
        <meta property="og:url" content={canonicalUrl} />
        <script type="application/ld+json">
          {JSON.stringify(pageSchema)}
        </script>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navigation />
        
        <main className="container mx-auto px-4 pt-28 max-w-7xl pb-24 md:pb-12">
          {/* Breadcrumb */}
          <Breadcrumb items={[
            { label: "Markets", href: "/markets" },
            { label: sector.name }
          ]} />

          {/* Hero Section */}
          <header className="mt-8 mb-12">
            <div className="flex items-center gap-4 mb-6">
              <div className={cn(
                "w-16 h-16 rounded-2xl bg-card/80 border border-border/30 flex items-center justify-center",
                sector.color
              )}>
                <sector.icon className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold">{sector.name}</h1>
                <p className="text-muted-foreground mt-1">
                  {sectorAssets.length} tradeable assets • Simulated data
                </p>
              </div>
            </div>
            
            {/* Executive Outlook - Designed for AI Overviews */}
            <div className="glass-liquid-card p-6">
              <p className="text-foreground leading-relaxed">
                {sector.description}
              </p>
              <p className="text-sm text-muted-foreground mt-4">
                Practice trading {sector.name.toLowerCase()} with $100,000 virtual capital. 
                No signup required. (Educational simulation only — not financial advice.)
              </p>
            </div>
          </header>

          {/* Assets Grid */}
          <section>
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              {sector.name} Assets
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sectorAssets.map((asset) => {
                if (!asset) return null;
                const isPositive = asset.changePercent >= 0;
                
                return (
                  <Link
                    key={asset.id}
                    to={`/trade/${asset.id}`}
                    className="glass-liquid-card p-5 hover:border-primary/30 transition-all group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {asset.symbol}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {asset.name}
                        </p>
                      </div>
                      <div className={cn(
                        "flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium",
                        isPositive ? "bg-profit/10 text-profit" : "bg-loss/10 text-loss"
                      )}>
                        {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {isPositive ? "+" : ""}{asset.changePercent.toFixed(2)}%
                      </div>
                    </div>
                    
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-2xl font-bold tabular-nums">
                          ${formatPrice(asset.price, asset.type)}
                        </p>
                        <p className={cn(
                          "text-sm tabular-nums",
                          isPositive ? "text-profit" : "text-loss"
                        )}>
                          {isPositive ? "+" : ""}${asset.change.toFixed(2)}
                        </p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Related Sectors */}
          <section className="mt-16">
            <h2 className="text-xl font-semibold mb-6">Explore Other Sectors</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {Object.entries(SECTORS)
                .filter(([key]) => key !== sectorId)
                .slice(0, 5)
                .map(([key, s]) => (
                  <Link
                    key={key}
                    to={`/sectors/${s.slug}`}
                    className="glass-liquid-card p-4 text-center hover:border-primary/30 transition-all group"
                  >
                    <s.icon className={cn("w-6 h-6 mx-auto mb-2", s.color)} />
                    <p className="text-sm font-medium group-hover:text-primary transition-colors">
                      {s.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {s.assetIds.length} assets
                    </p>
                  </Link>
                ))}
            </div>
          </section>

          <SEOSection
            path={`/sectors/${sectorId}`}
            faqHeading={sector.name}
            breadcrumbs={[
              { label: "Markets", href: "/markets" },
              { label: sector.name },
            ]}
            hideVisibleBreadcrumb
            faqs={[
              {
                question: `What assets are in the ${sector.name} sector?`,
                answer: `${sector.name} on TradeHQ covers ${sector.assetIds.length} simulator-tradable assets. Click any asset above to open the trading terminal with $100,000 of virtual cash.`,
              },
              {
                question: `Can I practise ${sector.name} assets with virtual money?`,
                answer: `Yes — every TradeHQ trade is fully simulated. Study ${sector.name} orders with virtual funds. Practice gains and losses do not predict real returns. (Educational simulation only — not financial advice.)`,
              },
              {
                question: `How do I research ${sector.name} before trading?`,
                answer: `Click an asset to open its simulator page, where market-data status is labelled according to the available source. Use the educational context and glossary links to understand the instrument before practising.`,
              },
              {
                question: `Are ${sector.name} prices live on TradeHQ?`,
                answer: `This sector hub shows simulator reference values from TradeHQ's asset catalogue and does not claim a continuous live feed. Open an asset's simulator page for its current data-status label.`,
              },
            ]}
          />
        </main>

        <MegaFooter />
      </div>
    </>
  );
}
