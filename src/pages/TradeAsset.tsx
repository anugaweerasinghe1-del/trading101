import { DailyFxReference } from "@/components/trading/DailyFxReference";
import NotFound from "./NotFound";
import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, Navigate, useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Navigation } from "@/components/Navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { RelatedMarkets } from "@/components/RelatedMarkets";
import { AssetFAQSection } from "@/components/AssetFAQSection";
import { BITCOIN_SIMULATOR_SEO } from "@/lib/bitcoinSimulatorSeo";
import { RecentAnalysis } from "@/components/RecentAnalysis";
import { AssetIntelligence } from "@/components/AssetIntelligence";
import { AIReadySummary } from "@/components/AIReadySummary";
import { GEOKeyTakeaways } from "@/components/GEOKeyTakeaways";
import { TradingStrengthMeter } from "@/components/TradingStrengthMeter";
import { ContextualLinks } from "@/components/ContextualLinks";

import { AssetSearchDropdown } from "@/components/trading/AssetSearchDropdown";
import { MinimalistAreaChart } from "@/components/trading/MinimalistAreaChart";
import { MinimalistOrderPanel } from "@/components/trading/MinimalistOrderPanel";
import { MinimalistPortfolioBar } from "@/components/trading/MinimalistPortfolioBar";
import { AIMentor } from "@/components/trading/AIMentor";
import { ChartSkeleton } from "@/components/trading/ChartSkeleton";
import { MobileOrderDrawer } from "@/components/trading/MobileOrderDrawer";
import { ASSETS } from "@/lib/assets";
import type { PickerQuoteOrigin } from "@/lib/assetPickerPresentation";
import { Asset } from "@/lib/types";
import { getPortfolio, executeTrade, updatePositionPrices } from "@/lib/portfolio";
import { portfolioOwnerIs } from '@/lib/portfolioOwner';
import { getFavorites, toggleFavorite } from "@/lib/favorites";
import { useToast } from "@/hooks/use-toast";
import { useLiveMarketData } from "@/hooks/useLiveMarketData";
import { marketRequests } from "@/lib/marketDataClient";
import { persistPrice, getPersistedPrices } from "@/lib/pricePersistence";
import { 
  getAssetContent, 
  generateAssetMetaTitle, 
  generateAssetMetaDescription,
  generateMarketOutlook,
  generateStudentUseSection,
  isInSeedSet,
  getAssetColor,
  getAssetFAQs,
  ASSET_FAQS
} from "@/lib/assetContent";
import { AlertTriangle, Wifi, WifiOff, Clock } from "lucide-react";
import { EducationalDisclaimer } from "@/components/EducationalDisclaimer";
import { ASSET_REFERENCES } from "@/lib/assetReferences";

// Wrapper component to provide live data to AssetIntelligence
function AssetIntelligenceWithLiveData({ asset }: { asset: Asset }) {
  const { liveData, isLoading } = useLiveMarketData(asset, { refreshInterval: 30000 });
  return <AssetIntelligence asset={asset} liveData={liveData} isLiveLoading={isLoading} />;
}

export default function TradeAsset() {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState(getPortfolio());
  const [postTradeLesson, setPostTradeLesson] = useState<{ symbol: string; side: "buy" | "sell" } | null>(null);
  useEffect(() => {
    const refresh = () => setPortfolio(getPortfolio());
    window.addEventListener("tradehq:portfolio-updated", refresh);
    return () => window.removeEventListener("tradehq:portfolio-updated", refresh);
  }, []);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dataSource, setDataSource] = useState<'live' | 'delayed' | 'cached' | 'simulated'>('simulated');
  const [quoteOrigins, setQuoteOrigins] = useState<Record<string, PickerQuoteOrigin>>({});
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { toast } = useToast();
   
  const isMounted = useRef(true);

  // Find asset by symbol (case-insensitive)
  const findAssetBySymbol = useCallback((symbolParam: string): Asset | null => {
    const normalizedSymbol = symbolParam.toUpperCase().replace(/-/g, '/');
    return ASSETS.find(a => 
      a.symbol.toUpperCase() === normalizedSymbol || 
      a.id === symbolParam.toLowerCase()
    ) || null;
  }, []);

  // Fetch live price for a single asset via edge function
  const fetchLivePrice = useCallback(async (asset: Asset): Promise<{ asset: Asset; status: 'live' | 'delayed' | 'simulated' | 'cached' }> => {
    if (!asset || typeof asset.price !== 'number' || isNaN(asset.price) || asset.price <= 0) return { asset, status: 'cached' };
    try {
      const result = await marketRequests.request(asset);
      if (!Array.isArray(result.data)) {
        if (result.success && result.data && typeof result.data.price === 'number' && result.data.price > 0) {
          const provenanceStatus = result.provenance?.status ?? result.data.provenance?.status;
          const status = provenanceStatus === 'realtime'
            ? 'live'
            : provenanceStatus === 'simulated'
              ? 'simulated'
              : 'delayed';
          return {
            asset: {
              ...asset,
              price: result.data.price,
              change: typeof result.data.change24h === 'number' ? result.data.change24h : asset.change,
              changePercent: typeof result.data.changePercent24h === 'number' ? result.data.changePercent24h : asset.changePercent,
            },
            status,
          };
        }
      }
    } catch (_err) {
      // silently fall back
    }
    return { asset, status: 'cached' };
  }, []);

  useEffect(() => {
    isMounted.current = true;
    
    // Find the asset from the URL parameter
    const targetAsset = symbol ? findAssetBySymbol(symbol) : ASSETS[0];
    
    const loadTimer = setTimeout(() => {
      if (!isMounted.current) return;
      // Hydrate from persisted prices before displaying
      const cached = getPersistedPrices();
      const initialQuoteOrigins: Record<string, PickerQuoteOrigin> = {};
      for (const asset of ASSETS) {
        if (cached[asset.id] && cached[asset.id].source !== "simulated") initialQuoteOrigins[asset.id] = "saved";
      }
      const hydratedAssets = ASSETS.map(a => {
        const p = cached[a.id];
        return p && p.source !== 'simulated' ? { ...a, price: p.price, change: p.change, changePercent: p.changePercent } : a;
      });
      setAssets(hydratedAssets);
      setQuoteOrigins(initialQuoteOrigins);
      setPortfolio(updatePositionPrices(getPortfolio(), hydratedAssets));
      setSelectedAsset(targetAsset ? (cached[targetAsset.id] && cached[targetAsset.id].source !== 'simulated' ? { ...targetAsset, price: cached[targetAsset.id].price, change: cached[targetAsset.id].change, changePercent: cached[targetAsset.id].changePercent } : targetAsset) : null);
      if (targetAsset && cached[targetAsset.id]) {
        setDataSource(cached[targetAsset.id].source === 'live' ? 'live' : cached[targetAsset.id].source === 'delayed' ? 'delayed' : 'cached');
      }
      setIsLoading(false);
    }, 600);

    setFavorites(getFavorites());

    return () => {
      isMounted.current = false;
      clearTimeout(loadTimer);
    };
  }, [symbol, findAssetBySymbol]);

  // Hybrid data: fetch real prices on mount + every 60s, micro-fluctuate every 3s
  useEffect(() => {
    if (isLoading || assets.length === 0) return;

    // Fetch real price for selected asset
    let cancelled = false;
    const fetchSelected = async () => {
      if (!selectedAsset || !isMounted.current) return;
      const quote = await fetchLivePrice(selectedAsset);
      const updated = quote.asset;
      if (isMounted.current && !cancelled) {
        if (updated.price !== selectedAsset.price || quote.status !== 'cached') {
          if (quote.status === 'live') {
            persistPrice(updated.id, updated.price, updated.change, updated.changePercent, 'live');
          } else if (quote.status === 'delayed') {
            persistPrice(updated.id, updated.price, updated.change, updated.changePercent, 'delayed');
          } else if (quote.status === 'simulated') {
            persistPrice(updated.id, updated.price, updated.change, updated.changePercent, 'simulated');
          }
          setAssets(prev => {
            const nextAssets = prev.map(a => a.id === updated.id ? updated : a);
            setPortfolio(current => updatePositionPrices(current, nextAssets));
            return nextAssets;
          });
          setDataSource(quote.status);
          if (quote.status !== "cached") {
            const origin: PickerQuoteOrigin = quote.status === "simulated" ? "simulated" : "provider";
            setQuoteOrigins(previous => ({ ...previous, [updated.id]: origin }));
          }
        }
        setLastUpdated(new Date());
      }
    };

    // Initial fetch
    const initialTimer = setTimeout(fetchSelected, 800);
    // Periodic refresh every 60s
    const refreshInterval = setInterval(fetchSelected, 60000);

    return () => {
      cancelled = true;
      clearTimeout(initialTimer);
      clearInterval(refreshInterval);
    };
  }, [isLoading, selectedAsset?.id, fetchLivePrice]);

  useEffect(() => {
    if (selectedAsset && isMounted.current && assets.length > 0) {
      const updated = assets.find(a => a.id === selectedAsset.id);
      if (updated) setSelectedAsset(updated);
    }
  }, [assets, selectedAsset]);

  const handleTrade = useCallback(async (
    asset: Asset,
    type: 'buy' | 'sell',
    quantity: number,
    orderType?: 'market' | 'limit',
    limitPrice?: number
  ) => {
    const result = await executeTrade(portfolio, asset, type, quantity);
    
    if (result.success && result.portfolio) {
      if (!portfolioOwnerIs(result.ownerId ?? null)) return;
      setPortfolio(getPortfolio());
      setPostTradeLesson({ symbol: asset.symbol, side: type });
      toast({
        title: `${type === 'buy' ? '🟢' : '🔴'} Order Executed`,
        description: result.message,
      });
    } else {
      toast({
        title: "Order Failed",
        description: result.message,
        variant: "destructive",
      });
    }
  }, [portfolio, toast]);

  const handleToggleFavorite = useCallback((assetId: string) => {
    toggleFavorite(assetId);
    setFavorites(getFavorites());
  }, []);

  // Redirect if asset not found
  if (symbol && !findAssetBySymbol(symbol)) {
    return <NotFound />;
  }

  // Canonicalize URL casing: enforce lowercase asset id in the path.
  // Prevents duplicate-content warnings in Google Search Console for /trade/BTC vs /trade/btc.
  if (symbol) {
    const matched = findAssetBySymbol(symbol);
    const canonicalSlug = matched?.id;
    if (canonicalSlug && symbol !== canonicalSlug) {
      return <Navigate to={`/trade/${canonicalSlug}`} replace />;
    }
  }

  // Get content for SEO blocks
  const assetContent = selectedAsset ? getAssetContent(selectedAsset.id) : null;
  const assetFAQs = selectedAsset ? getAssetFAQs(selectedAsset.id) : [];
  // Page identity belongs to the URL, not the asynchronously loaded quote or
  // the instrument temporarily selected in the practice desk.
  const routeAsset = symbol ? findAssetBySymbol(symbol) : ASSETS[0];
  const metaTitle = routeAsset ? generateAssetMetaTitle(routeAsset) : "Trade | TradeHQ";
  const metaDescription = routeAsset ? generateAssetMetaDescription(routeAsset) : "";
  const canonicalUrl = routeAsset
    ? `https://www.thetradehq.com/trade/${routeAsset.id}`
    : "https://www.thetradehq.com/trade";
  const assetColor = selectedAsset ? getAssetColor(selectedAsset.id) : '#00FFFF';
  // Keep runtime robots aligned with scripts/routes.ts: only authored
  // editorial + authored FAQ asset pages are indexable.
  const isIndexableAsset = routeAsset
    ? Boolean(getAssetContent(routeAsset.id) && ASSET_FAQS[routeAsset.id]?.length)
    : false;

  // --- CLEAN SCHEMA: No fake ratings, proper nesting ---
  // GEOKeySummary - neutral, factual, machine-readable for AI Overviews
  const geoKeySummarySchema = selectedAsset && assetContent ? {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    "name": `${selectedAsset.name} (${selectedAsset.symbol})`,
    "description": assetContent.whatIs,
    "inDefinedTermSet": {
      "@type": "DefinedTermSet",
      "name": "TradeHQ Asset Directory"
    },
    "additionalProperty": [
      {
        "@type": "PropertyValue",
        "name": "primaryInfluencers",
        "value": assetContent.stats?.primaryDriver || (selectedAsset.type === 'crypto' ? 'Network adoption, regulatory developments, digital asset sentiment' : 'Macroeconomic conditions, sector catalysts, earnings')
      },
      {
        "@type": "PropertyValue",
        "name": "simulatorScope",
        "value": `Practice ${selectedAsset.symbol} trading with $100K virtual capital, simulated charts, and educational mentor explanations — educational only.`
      },
      {
        "@type": "PropertyValue",
        "name": "studentPerspective",
        "value": `Students can study ${selectedAsset.symbol} order mechanics with virtual cash. Simulated outcomes do not establish readiness for real trading.`
      }
    ]
  } : null;

  // These URLs describe the free simulator, not custody or a tradable financial product.
  // Keep existing asset-class schemas outside the BTC pilot until independently reviewed.
  const assetSchema = selectedAsset ? (
    (selectedAsset.id !== "btc" && (selectedAsset.type === 'crypto' || selectedAsset.type === 'commodity' || selectedAsset.type === 'forex'))
      ? {
          "@context": "https://schema.org",
          "@type": "FinancialProduct",
          "name": `${selectedAsset.name} Trading Simulator`,
          "description": assetContent?.whatIs || metaDescription || `${selectedAsset.name} trading simulator`,
          "url": canonicalUrl,
          "category": selectedAsset.type === 'crypto' ? 'Cryptocurrency' : selectedAsset.type === 'commodity' ? 'Commodity' : 'Currency',
          "provider": {
            "@type": "Organization",
            "name": "TradeHQ",
            "url": "https://www.thetradehq.com/",
            "logo": "https://www.thetradehq.com/logo.png"
          },
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD",
            "availability": "https://schema.org/InStock"
          }
        }
      : {
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": `${selectedAsset.name} Trading Simulator`,
          "description": selectedAsset.id === "btc" ? BITCOIN_SIMULATOR_SEO.description : (assetContent?.whatIs || metaDescription || `Practice ${selectedAsset.name} trading with simulated data`),
          "url": canonicalUrl,
          "applicationCategory": "FinanceApplication",
          "applicationSubCategory": "Trading Simulator (Educational)",
          "operatingSystem": "Web Browser",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD",
            "availability": "https://schema.org/InStock"
          },
          "provider": {
            "@type": "Organization",
            "name": "TradeHQ",
            "url": "https://www.thetradehq.com/"
          }
        }
  ) : null;

  // Organization schema
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "TradeHQ",
    "url": "https://www.thetradehq.com/",
    "logo": "https://www.thetradehq.com/logo.png",
    
  };

  // FAQ Schema - only if real FAQs exist
  const allFAQs = selectedAsset && assetFAQs.length > 0 ? [
    ...assetFAQs.map(faq => ({
      "@type": "Question" as const,
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer" as const,
        "text": faq.answer || "Answer pending update."
      }
    })),
    {
      "@type": "Question" as const,
      "name": `How can I practice trading ${selectedAsset.name}?`,
      "acceptedAnswer": {
        "@type": "Answer" as const,
        "text": `TradeHQ provides $100,000 in virtual capital to practise ${selectedAsset.symbol} orders without spending real money. Select ${selectedAsset.symbol} from the asset list to start practicing with simulated charts and educational mentor explanations.`
      }
    }
  ] : [];

  const faqSchema = allFAQs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": allFAQs
  } : null;

  // Breadcrumb schema
  const breadcrumbSchema = selectedAsset ? {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://www.thetradehq.com/"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Markets",
        "item": "https://www.thetradehq.com/markets"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": selectedAsset.name,
        "item": canonicalUrl
      }
    ]
  } : null;

  const showSeoBlocks = selectedAsset && isInSeedSet(selectedAsset.id);

  const breadcrumbItems = selectedAsset ? [
    { label: "Markets", href: "/markets" },
    { label: selectedAsset.name }
  ] : [];

  return (
    <>
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
        <link rel="canonical" href={canonicalUrl} />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content="https://www.thetradehq.com/tradehq-preview-2026.png" />
        <meta property="og:image:width" content="1731" />
        <meta property="og:image:height" content="909" />
        <meta property="og:site_name" content="TradeHQ" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={metaTitle} />
        <meta name="twitter:description" content={metaDescription} />
        <meta name="twitter:image" content="https://www.thetradehq.com/tradehq-preview-2026.png" />
        
        <meta name="robots" content={isIndexableAsset ? "index, follow" : "noindex, follow"} />
        <meta name="theme-color" content={assetColor} />
        
        {/* GEO KEY SUMMARY SCHEMA */}
        {geoKeySummarySchema && (
          <script type="application/ld+json">
            {JSON.stringify(geoKeySummarySchema)}
          </script>
        )}

        {/* ASSET SCHEMA (FinancialProduct for crypto, SoftwareApplication for stocks) */}
        {assetSchema && (
          <script type="application/ld+json">
            {JSON.stringify(assetSchema)}
          </script>
        )}

        {/* ORGANIZATION SCHEMA */}
        <script type="application/ld+json">
          {JSON.stringify(organizationSchema)}
        </script>
        
        {/* FAQ SCHEMA - only when real Q&A exist */}
        {faqSchema && (
          <script type="application/ld+json">
            {JSON.stringify(faqSchema)}
          </script>
        )}
        
        {/* BREADCRUMB SCHEMA */}
        {breadcrumbSchema && (
          <script type="application/ld+json">
            {JSON.stringify(breadcrumbSchema)}
          </script>
        )}
      </Helmet>
      
      <div className="min-h-screen bg-background flex flex-col">
        <Navigation />
        

        <main className="flex-1 container mx-auto px-4 py-6 space-y-6 max-w-7xl pt-20">
          {selectedAsset && <Breadcrumb items={breadcrumbItems} />}
          {postTradeLesson && (
            <section aria-label="Understand your recorded simulated order" role="status" className="flex flex-col gap-3 rounded-2xl border border-primary/30 bg-primary/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold">Your virtual {postTradeLesson.side} order for {postTradeLesson.symbol} was recorded.</p>
                <p className="mt-1 text-sm text-muted-foreground">Want to understand what changed in your cash and fees? Review your saved trade and answer one short, optional question. This does not place another order.</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Link to="/learn/trade-review" className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">Understand my trade</Link>
                <button type="button" onClick={() => setPostTradeLesson(null)} className="inline-flex min-h-11 items-center justify-center rounded-xl px-3 text-sm text-muted-foreground hover:bg-muted">Not now</button>
              </div>
            </section>
          )}
          
          {selectedAsset && (
            <header className="pb-2">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2 tracking-tight">
                {selectedAsset.id === "btc" ? BITCOIN_SIMULATOR_SEO.h1 : `${selectedAsset.name} — Practice Trading Simulator`}
              </h1>
              <p className="text-sm text-muted-foreground mb-2 max-w-3xl">
                Explore {selectedAsset.symbol} with $100,000 in virtual cash. Read simulated charts, compare position sizes, and review practice gains and losses. No real money is traded.
              </p>
              {selectedAsset.id === "gold" && <p className="text-sm text-muted-foreground mb-2 max-w-3xl">
                Provider quotes use a PAXG token proxy, not a dedicated XAU/USD spot feed.
                Practice charts and fixed fallback prices have their own data-status labels.
              </p>}
              {selectedAsset.id === "silver" && <p className="text-sm text-muted-foreground mb-2 max-w-3xl">
                When available, provider quotes use CoinGecko's silver-token proxy rather than
                a dedicated XAG/USD spot feed. A token proxy price is not a silver spot quote
                or a conversion rate. Practice charts and fallback prices have separate data-status labels.
              </p>}
              {/* Data trust signal */}
              <div className="flex items-center gap-3 text-xs">
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-medium ${
                  dataSource === 'live' 
                    ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                    : dataSource === 'cached'
                    ? 'bg-yellow-500/10 text-yellow-500 [.light_&]:text-yellow-800 border border-yellow-500/20'
                    : 'bg-muted/50 text-muted-foreground [.light_&]:text-slate-700 border border-muted-foreground/20'
                }`}>
                  {dataSource === 'live' ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                  {dataSource === 'live' ? 'Provider reference + simulation' : dataSource === 'delayed' ? 'Provider reference + simulation' : dataSource === 'cached' ? 'Cached practice price' : 'Simulated'}
                </span>
                {lastUpdated && (
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    Quote checked at {lastUpdated.toLocaleTimeString()} (not the provider observation time)
                  </span>
                )}
              </div>
            </header>
          )}

          {selectedAsset?.id === "btc" && (
            <section aria-labelledby="btc-practice-steps" className="rounded-2xl border border-primary/25 bg-card/70 p-4 sm:p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="max-w-2xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Free Bitcoin simulator · No signup required</p>
                  <h2 id="btc-practice-steps" className="mt-1 text-lg font-semibold text-foreground">Practise BTC virtually. Understand each result.</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Use the order panel below, then review saved virtual cash, fees and holdings. No actual Bitcoin is purchased.</p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2 text-sm">
                  <Link to="/how-to-trade/btc" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-3 py-2 font-semibold text-primary-foreground hover:bg-primary/90">Bitcoin beginner guide</Link>
                  <Link to="/wiki/paper-trading" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border px-3 py-2 font-medium text-foreground hover:bg-muted/70">What is paper trading?</Link>
                </div>
              </div>
              <details className="mt-3 border-t border-border/60 pt-3 text-sm">
                <summary className="min-h-9 cursor-pointer font-medium text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">How does virtual Bitcoin practice work?</summary>
                <ol className="mt-2 list-decimal space-y-1.5 pl-5 leading-relaxed text-muted-foreground">
                  <li>Check whether the quote and chart are provider-based, delayed, cached or simulated.</li>
                  <li>Preview an optional virtual market order using the displayed quantity and practice price.</li>
                  <li>In your portfolio, compare the recorded cash movement, simulated 0.1% fee and remaining holdings.</li>
                </ol>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Practice fills do not reproduce real spreads, slippage, custody or the emotions of risking money. Simulated returns cannot predict real trading outcomes.</p>
              </details>
            </section>
          )}

          {selectedAsset?.type === "forex" && <DailyFxReference assetId={selectedAsset.id} />}

          {(selectedAsset?.id === "ftm" || selectedAsset?.id === "matic") && (
            <section className="rounded-2xl border border-border bg-card p-6 space-y-3" aria-label="Legacy token context">
              <h2 className="text-lg font-semibold">Legacy token context</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {selectedAsset.id === "ftm"
                  ? "This practice terminal retains the legacy Fantom (FTM) label. Sonic Labs documents an upgrade from FTM to Sonic's S token. The practice prices shown here are not current S quotes or a token conversion."
                  : "This practice terminal retains the legacy Polygon (MATIC) label. Polygon documents the migration from MATIC to POL, its native gas and staking token. The practice prices shown here are not current POL quotes or a token conversion."}
              </p>
              <a
                href={selectedAsset.id === "ftm" ? "https://docs.soniclabs.com/migration/app-token-migration" : "https://docs.polygon.technology/pos/concepts/tokens/matic-to-pol"}
                className="text-sm text-primary underline underline-offset-4"
                target="_blank"
                rel="noopener noreferrer"
              >
                {selectedAsset.id === "ftm" ? "Sonic Labs migration documentation" : "Polygon migration documentation"}
              </a>
            </section>
          )}

          {/* GEO Key Takeaways - machine-readable for AI Overviews */}
          {selectedAsset?.id === "sq" && (
            <section aria-labelledby="legacy-stock-label" className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
              <h2 id="legacy-stock-label" className="font-semibold text-foreground mb-2">Legacy practice label</h2>
              <p>
                This simulator retains Block's legacy SQ label. Block's investor stock page
                identifies the company as XYZ. The practice label and generated prices do
                not establish a current XYZ market quote.
              </p>
              <a href="https://investors.block.xyz/stock-info/default.aspx" target="_blank" rel="noopener noreferrer" className="inline-block mt-2 text-primary underline underline-offset-2">
                Block investor stock information
              </a>
            </section>
          )}

          {selectedAsset && <GEOKeyTakeaways asset={selectedAsset} />}
          
          {selectedAsset && showSeoBlocks && (
            <AIReadySummary asset={selectedAsset} />
          )}
          
          {/* Command Center: Search + Portfolio Bar */}
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <AssetSearchDropdown
              assets={assets}
              selectedAsset={selectedAsset}
              favorites={favorites}
              quoteOrigins={quoteOrigins}
              onSelectAsset={(asset) => navigate(`/trade/${asset.id}`)}
              onToggleFavorite={handleToggleFavorite}
            />
            
            <div className="w-full lg:w-auto lg:flex-1 lg:max-w-2xl">
              <MinimalistPortfolioBar portfolio={portfolio} />
            </div>
          </div>

          {/* Trading Terminal Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl h-[520px] overflow-hidden" style={{ backdropFilter: 'blur(12px)', boxShadow: '0 8px 40px -12px hsl(0 0% 0% / 0.5)' }}>
                {isLoading ? (
                  <ChartSkeleton />
                ) : (
                  selectedAsset && <MinimalistAreaChart asset={selectedAsset} />
                )}
              </div>
            </div>

            <div className="hidden lg:flex lg:flex-col gap-4">
              <MinimalistOrderPanel
                asset={selectedAsset}
                availableCash={portfolio.cash}
                portfolio={portfolio}
                onTrade={handleTrade}
              />
              
              {selectedAsset && showSeoBlocks && (
                <TradingStrengthMeter asset={selectedAsset} />
              )}
            </div>
          </div>

          {/* Asset Intelligence - shown for seed assets */}
          {showSeoBlocks && selectedAsset && (
            <AssetIntelligenceWithLiveData asset={selectedAsset} />
          )}

          {selectedAsset && assetFAQs.length > 0 && (
            <AssetFAQSection 
              assetName={selectedAsset.name}
              assetSymbol={selectedAsset.symbol}
              faqs={assetFAQs}
            />
          )}

          {/* How Students Use This Simulator */}
          {selectedAsset && (
            <section className="mt-8 p-6 bg-white/[0.02] backdrop-blur-xl rounded-2xl border border-white/[0.06]">
              <h2 className="text-lg font-bold text-foreground mb-4 tracking-tight">
                How Students Practice {selectedAsset.symbol} Trading
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {generateStudentUseSection(selectedAsset)}
              </p>
            </section>
          )}

          {/* Published instrument-specific worksheet. No fabricated research for other assets. */}
          {selectedAsset && ASSET_REFERENCES[selectedAsset.id] && (
            <section className="mt-8 rounded-2xl border border-border bg-card p-5 md:p-6" aria-label={`Published research worksheet for ${selectedAsset.symbol}`}>
              <h2 className="text-lg font-bold text-foreground">Source-backed worksheet: {selectedAsset.symbol}</h2>
              <p className="mt-3 text-sm leading-relaxed text-foreground/80">
                {ASSET_REFERENCES[selectedAsset.id].exercise}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                Linked primary reference for an educational worksheet. Source dates and scopes vary; this is not a current market quote, investment recommendation or professional review.
              </p>
              <a
                href={ASSET_REFERENCES[selectedAsset.id].href}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block break-words text-sm font-medium text-primary underline underline-offset-4"
              >
                Read primary source: {ASSET_REFERENCES[selectedAsset.id].label}
              </a>
            </section>
          )}

          {/* Market Strategic Outlook */}
          {selectedAsset && (
            <section className="mt-8 p-6 bg-white/[0.02] backdrop-blur-xl rounded-2xl border border-white/[0.06]">
              <h2 className="text-lg font-bold text-foreground mb-4 tracking-tight">
                {selectedAsset.symbol} Practice Instrument — Scope and Limitations
              </h2>
              <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                {generateMarketOutlook(selectedAsset).split('\n\n').map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </section>
          )}

          {selectedAsset && <RecentAnalysis focusAsset={selectedAsset.id} />}
          {selectedAsset && <RelatedMarkets currentAsset={selectedAsset} />}
          {selectedAsset && <ContextualLinks variant="trade-asset" asset={selectedAsset} />}

          {/* Disclaimer */}
          <div className="mt-8 p-4 rounded-xl bg-white/[0.01] border border-white/[0.04]">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                <strong>(Educational simulation only — not financial advice.)</strong>{' '}
                TradeHQ is a simulator for educational purposes only. 
                No real money is at risk. Past performance in a simulation does not guarantee future real-world results. 
                Always consult a qualified financial advisor before making investment decisions.
              </p>
            </div>
          </div>

          <div className="lg:hidden">
            <MobileOrderDrawer
              asset={selectedAsset}
              availableCash={portfolio.cash}
              portfolio={portfolio}
              onTrade={handleTrade}
            />
          </div>
          <EducationalDisclaimer variant="footer" className="mb-10" />
        </main>

        <AIMentor 
          portfolio={portfolio} 
          assets={assets} 
          selectedAsset={selectedAsset}
        />
      </div>
    </>
  );
}
