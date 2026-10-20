import { useState, useEffect, useCallback, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { useParams, Link } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { AssetSearchDropdown } from "@/components/trading/AssetSearchDropdown";
import { MinimalistAreaChart } from "@/components/trading/MinimalistAreaChart";
import { MinimalistOrderPanel } from "@/components/trading/MinimalistOrderPanel";
import { AssetContextCard } from "@/components/trading/AssetContextCard";
import { MarketInsightPanel } from "@/components/trading/MarketInsightPanel";
import { NeuralPulseChart } from "@/components/trading/NeuralPulseChart";
import { MinimalistPortfolioBar } from "@/components/trading/MinimalistPortfolioBar";
import { AIMentor } from "@/components/trading/AIMentor";
import { ChartSkeleton } from "@/components/trading/ChartSkeleton";
import { MobileOrderDrawer } from "@/components/trading/MobileOrderDrawer";
import { LiveDataToggle } from "@/components/trading/LiveDataToggle";
import { MegaFooter } from "@/components/MegaFooter";
import { SEOSection } from "@/components/SEOSection";
import { ASSETS, formatPrice } from "@/lib/assets";
import { Asset, JournalEntry } from "@/lib/types";
import {
  getPortfolio,
  executeTrade,
  updatePositionPrices,
  savePortfolio,
} from "@/lib/portfolio";
import { getFavorites, toggleFavorite } from "@/lib/favorites";
import { recordLoss } from "@/components/trading/RevengeTradingBlocker";
import { useToast } from "@/hooks/use-toast";
import { persistPrice, getPersistedPrices } from "@/lib/pricePersistence";
import { refreshAssetSnapshots } from "@/lib/marketDataClient";

export default function Trade() {
  const { symbol } = useParams();
  const [portfolio, setPortfolio] = useState(getPortfolio());
  useEffect(() => {
    const refresh = () => setPortfolio(getPortfolio());
    window.addEventListener("tradehq:portfolio-updated", refresh);
    return () => window.removeEventListener("tradehq:portfolio-updated", refresh);
  }, []);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const isMounted = useRef(true);
  const isRefreshing = useRef(false);
  const assetsRef = useRef<Asset[]>([]);
  const [liveAssetIds, setLiveAssetIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    assetsRef.current = assets;
  }, [assets]);

  const refreshAllAssets = useCallback(async () => {
    if (!isMounted.current || isRefreshing.current || document.hidden || assetsRef.current.length === 0) return;
    isRefreshing.current = true;
    try {
      // One database snapshot read serves the whole list. Never call every provider per visitor.
      const result = await refreshAssetSnapshots(assetsRef.current);
      if (isMounted.current) {
        setAssets(result.assets);
        setPortfolio(current => updatePositionPrices(current, result.assets));
        setLiveAssetIds(result.providerIds);
      }
    } catch { /* Keep the last known prices without fabricating movement. */ }
    finally { isRefreshing.current = false; }
  }, []);

  useEffect(() => {
    isMounted.current = true;

    const validAssets = ASSETS.filter(
      (asset) =>
        asset &&
        typeof asset.price === "number" &&
        !isNaN(asset.price) &&
        asset.price > 0 &&
        typeof asset.change === "number" &&
        typeof asset.changePercent === "number",
    );

    // Hydrate from persisted prices
    const cached = getPersistedPrices();
    const hydratedAssets = validAssets.map(a => {
      const p = cached[a.id];
      return p && p.source !== 'simulated' ? { ...a, price: p.price, change: p.change, changePercent: p.changePercent } : a;
    });

    setTimeout(() => {
      if (!isMounted.current) return;

      setAssets(hydratedAssets);
      setPortfolio(updatePositionPrices(getPortfolio(), hydratedAssets));

      if (symbol) {
        const match = hydratedAssets.find(
          (a) => a.symbol.toUpperCase() === symbol.toUpperCase(),
        );
        setSelectedAsset(match || hydratedAssets[0] || null);
      } else {
        setSelectedAsset(hydratedAssets[0] || null);
      }

      setIsLoading(false);
    }, 400);

    setFavorites(getFavorites());

    return () => {
      isMounted.current = false;
    };
  }, [symbol]);

  useEffect(() => {
    if (isLoading || assets.length === 0) return;

    const initialRefresh = setTimeout(refreshAllAssets, 2000);
    const interval = setInterval(refreshAllAssets, 120000);

    return () => {
      clearTimeout(initialRefresh);
      clearInterval(interval);
    };
  }, [isLoading, refreshAllAssets]);

  useEffect(() => {
    if (selectedAsset && isMounted.current && assets.length > 0) {
      const updated = assets.find((a) => a.id === selectedAsset.id);
      if (updated && updated.price !== selectedAsset.price) {
        setSelectedAsset(updated);
      }
    }
  }, [assets, selectedAsset?.id]);

  const handleTrade = useCallback(
    async (
      asset: Asset,
      type: "buy" | "sell",
      quantity: number,
      _orderType?: string,
      _limitPrice?: number,
      rationale?: string,
    ) => {
      const result = await executeTrade(portfolio, asset, type, quantity);

      if (result.success && result.portfolio) {
        if (rationale && result.portfolio.trades.length > 0) {
          const journalEntry: JournalEntry = {
            notes: "",
            emotions: [],
            reasoning: rationale,
          };

          result.portfolio.trades[0].journal = journalEntry;
          savePortfolio(result.portfolio);
        }

        if (type === "sell") {
          const position = portfolio.positions.find(
            (p) => p.asset.id === asset.id,
          );
          if (position && position.profitLoss < 0) {
            recordLoss();
          }
        }

        setPortfolio(result.portfolio);

        toast({
          title: `${type === "buy" ? "🟢" : "🔴"} Order Executed`,
          description: result.message,
        });
      } else {
        toast({
          title: "Order Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    },
    [portfolio, toast],
  );

  const handleToggleFavorite = useCallback((assetId: string) => {
    toggleFavorite(assetId);
    setFavorites(getFavorites());
  }, []);

  const handleAssetSelect = useCallback((asset: Asset) => {
    setSelectedAsset(asset);
  }, []);

  const pageTitle = symbol
    ? `Trade ${symbol.toUpperCase()} — Free Simulator with $100K Virtual Cash | TradeHQ`
    : "Free Trading Simulator — Buy Stocks, ETFs & Crypto with $100K | TradeHQ";

  const pageDescription = symbol
    ? `Practice trading ${symbol.toUpperCase()} with $100,000 virtual cash. Charts may use live, cached, delayed or simulated data. No real money is involved.`
    : "Use our free trading simulator to practise stocks, ETFs and crypto with $100K virtual money. Market data may be live, cached, delayed or simulated. No real money is involved.";

  const pageUrl = `https://www.thetradehq.com/trade${
    symbol ? `/${symbol.toLowerCase()}` : ""
  }`;

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={pageUrl} />
        <meta name="robots" content="index, follow" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={pageUrl} />
        <meta
          property="og:image"
          content="https://www.thetradehq.com/og-image.png"
        />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content="TradeHQ" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta
          name="twitter:image"
          content="https://www.thetradehq.com/og-image.png"
        />
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        <Navigation />

        <main className="flex-1 container mx-auto px-4 pt-20 pb-6 space-y-4 max-w-7xl">
          <header className="pt-2">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">
              Practice Trading Terminal{selectedAsset ? ` — ${selectedAsset.name} (${selectedAsset.symbol})` : ""}
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-1 max-w-3xl">
              Place simulated buy and sell orders across crypto, stocks, ETFs, forex and
              commodities with $100,000 in virtual cash. Quotes and charts can be provider-sourced, delayed or simulated and
              clearly labelled LIVE, CACHED or SIM. (Educational simulation only — not
              financial advice.)
            </p>
          </header>

          <MinimalistPortfolioBar portfolio={portfolio} />

          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <AssetSearchDropdown
              assets={assets}
              selectedAsset={selectedAsset}
              favorites={favorites}
              onSelectAsset={handleAssetSelect}
              onToggleFavorite={handleToggleFavorite}
            />

            <LiveDataToggle
              asset={selectedAsset}
              onLiveDataReceived={(livePrice, isLive) => {
                if (
                  isLive &&
                  selectedAsset &&
                  livePrice !== selectedAsset.price &&
                  typeof livePrice === "number" &&
                  livePrice > 0
                ) {
                  setAssets((prev) => {
                    const nextAssets = prev.map((a) =>
                      a.id === selectedAsset.id
                        ? { ...a, price: livePrice }
                        : a,
                    );
                    setPortfolio((current) => updatePositionPrices(current, nextAssets));
                    return nextAssets;
                  });
                }
              }}
            />
          </div>

          {selectedAsset && !isLoading && (
            <AssetContextCard asset={selectedAsset} />
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="glass-tactile border-chrome rounded-2xl h-[500px] overflow-hidden">
                {isLoading ? (
                  <ChartSkeleton />
                ) : (
                  selectedAsset && <MinimalistAreaChart asset={selectedAsset} />
                )}
              </div>

              {selectedAsset && !isLoading && (
                <MarketInsightPanel asset={selectedAsset} />
              )}
            </div>

            <div className="hidden lg:block">
              <MinimalistOrderPanel
                asset={selectedAsset}
                availableCash={portfolio.cash}
                portfolio={portfolio}
                onTrade={handleTrade}
              />
            </div>
          </div>

          {selectedAsset && !isLoading && (
            <NeuralPulseChart asset={selectedAsset} height={360} />
          )}

          <div className="lg:hidden">
            <MobileOrderDrawer
              asset={selectedAsset}
              availableCash={portfolio.cash}
              portfolio={portfolio}
              onTrade={handleTrade}
            />
          </div>

          {assets.length > 1 && (
            <section className="mt-10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold tracking-tight">
                  Explore Markets
                </h3>
                <Link
                  to="/markets"
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  View All <span aria-hidden>→</span>
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {assets
                  .filter((a) => a.id !== selectedAsset?.id)
                  .slice(0, 12)
                  .map((asset) => {
                    const isUp = asset.changePercent >= 0;

                    return (
                      <Link
                        key={asset.id}
                        to={`/trade/${asset.id}`}
                        className="group relative glass-tactile rounded-xl p-4 border-chrome hover:border-primary/30 transition-all duration-200 hover:scale-[1.03]"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                            {asset.symbol}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                              isUp
                                ? "bg-profit/10 text-profit"
                                : "bg-loss/10 text-loss"
                            }`}
                          >
                            {isUp ? "+" : ""}
                            {asset.changePercent.toFixed(1)}%
                          </span>
                        </div>

                        <p className="text-[11px] text-muted-foreground truncate">
                          {asset.name}
                        </p>

                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs font-medium text-foreground/80">
                            $
                            {formatPrice(asset.price, asset.type)}
                          </p>
                          <span className={`text-[8px] font-medium px-1 py-0.5 rounded ${
                            liveAssetIds.has(asset.id)
                              ? 'bg-green-500/10 text-green-500'
                              : 'bg-muted/50 text-muted-foreground'
                          }`}>
                            {liveAssetIds.has(asset.id) ? 'SNAPSHOT' : 'FIXED'}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
              </div>
            </section>
          )}
        </main>

        <AIMentor
          portfolio={portfolio}
          assets={assets}
          selectedAsset={selectedAsset}
        />
        <div className="container mx-auto px-4 md:px-6 mt-8">
          <SEOSection
            path="/trade"
            faqHeading="Trading Simulator"
            breadcrumbs={[{ label: "Trade Simulator" }]}
            faqs={[
              {
                question: "Is the TradeHQ trading simulator free to use?",
                answer:
                  "Yes. TradeHQ gives every user $100,000 in virtual cash with no signup, no credit card, and no hidden fees. (Educational simulation only — not financial advice.)",
              },
              {
                question: "Are the prices on the trading simulator real?",
                answer:
                  "Data availability differs by asset. TradeHQ may use live, cached, delayed or simulated quotes, and the interface labels the source when available. Treat all prices as educational rather than execution-quality brokerage data.",
              },
              {
                question: "What can I trade on TradeHQ?",
                answer:
                  "170 practice instruments across five asset classes: cryptocurrencies (BTC, ETH, SOL…), US stocks (AAPL, NVDA, TSLA…), ETFs (SPY, QQQ, VOO…), major forex pairs and commodities like gold and oil — all in one simulated portfolio.",
              },
              {
                question: "Can I lose real money on TradeHQ?",
                answer:
                  "No. Every trade uses virtual currency only — no real funds are ever at risk. TradeHQ is built purely for education and practice. (Educational simulation only — not financial advice.)",
              },
              {
                question: "How do I start practice trading?",
                answer:
                  "Pick any asset from the grid above, click it to open the trading terminal, set your order size and click Buy or Sell. Your portfolio updates instantly and is saved to your browser.",
              },
            ]}
          />
        </div>
        <MegaFooter />
      </div>
    </>
  );
}
