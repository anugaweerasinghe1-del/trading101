import type { CSSProperties } from "react";
import { Helmet } from "react-helmet-async";
import { Navigation } from "@/components/Navigation";
import { Link } from "react-router-dom";
import { DailyChallengeCard } from "@/components/home/DailyChallengeCard";
import { MarketPulse } from "@/components/home/MarketPulse";
import { PremiumHero } from "@/components/PremiumHero";
import { PremiumFeatures } from "@/components/PremiumFeatures";
import { TopAssetsGrid } from "@/components/TopAssetsGrid";
import { WhatIsTradeHQ } from "@/components/WhatIsTradeHQ";
import { MarketTrends2026 } from "@/components/MarketTrends2026";
import { PremiumFAQ } from "@/components/PremiumFAQ";
import { MegaFooter } from "@/components/MegaFooter";
import { SocialProofTicker } from "@/components/SocialProofTicker";
import { HowItWorks } from "@/components/HowItWorks";
import { Sparkles, ArrowRight } from "lucide-react";
import { COMPARE_PAIRS, HOWTO_ASSETS, STRATEGIES } from "@/lib/seoData";
import { ContinueBanner } from "@/components/retention/ContinueBanner";
import { WatchlistAlerts } from "@/components/retention/WatchlistAlerts";
import { WeeklyRecap } from "@/components/retention/WeeklyRecap";
import { AIAnswerBlock } from "@/components/seo/AIAnswerBlock";

// These homepage sections keep fixed dark surfaces in both themes.
const homeDarkPalette = {
  "--foreground": "220 15% 93%",
  "--muted-foreground": "220 14% 68%",
  "--primary": "168 100% 50%",
  color: "hsl(220 15% 93%)",
} as CSSProperties;

// ORIGINAL schemas — unchanged
const homeFaqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is TradeHQ?",
      acceptedAnswer: { "@type": "Answer", text: "TradeHQ is a free paper trading simulator where you can practice trading stocks, crypto, ETFs, forex, and commodities with $100,000 in virtual cash. No signup or credit card required." },
    },
    {
      "@type": "Question",
      name: "Is TradeHQ completely free?",
      acceptedAnswer: { "@type": "Answer", text: "Yes, TradeHQ is free to use. You get $100,000 in virtual practice capital with no credit card required for simulated trading." },
    },
    {
      "@type": "Question",
      name: "What is paper trading?",
      acceptedAnswer: { "@type": "Answer", text: "Paper trading is simulated trading using virtual money instead of real capital. It lets you study buying and selling mechanics without spending real money. Simulation does not establish readiness for real trading." },
    },
    {
      "@type": "Question",
      name: "How do I start trading on TradeHQ?",
      acceptedAnswer: { "@type": "Answer", text: "Just visit TradeHQ and click 'Start Trading Free.' You'll instantly receive $100,000 in virtual cash to trade 170 assets — no account creation needed." },
    },
    {
      "@type": "Question",
      name: "What stocks and crypto can I trade?",
      acceptedAnswer: { "@type": "Answer", text: "TradeHQ offers 170 assets including major stocks (AAPL, NVDA, TSLA), cryptocurrencies (BTC, ETH, SOL), ETFs (SPY, QQQ), forex pairs (EUR/USD), and commodities (Gold, Oil)." },
    },
    {
      "@type": "Question",
      name: "Is there a leaderboard or competition?",
      acceptedAnswer: { "@type": "Answer", text: "Yes! TradeHQ features a leaderboard ranking virtual traders by portfolio performance. Start with $100,000 and compete to reach the top." },
    },
    {
      "@type": "Question",
      name: "Do I need to create an account?",
      acceptedAnswer: { "@type": "Answer", text: "No. TradeHQ requires no signup, no email, and no account creation. Guest practice records stay in your browser. Optional accounts store cash, positions and server-recorded trades for restoration across devices; earlier guest history, journals and course progress remain browser-held." },
    },
    {
      "@type": "Question",
      name: "What can I practise with TradeHQ?",
      acceptedAnswer: { "@type": "Answer", text: "TradeHQ offers virtual-money practice across stocks, crypto, ETFs, forex and commodities. You can explore order mechanics, portfolio tracking and educational lessons with $100,000 in virtual cash. Core practice features work without signup." },
    },
  ],
};

const orgSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "TradeHQ",
  url: "https://www.thetradehq.com/",
  logo: "https://www.thetradehq.com/og-image.png",
};

const webAppSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "TradeHQ — Free Paper Trading Simulator",
  url: "https://www.thetradehq.com/",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web Browser",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  description: "Practice stock & crypto trading free with $100,000 virtual cash. No signup needed. 170 assets, AI mentor, leaderboard.",
};

// WebSite identity schema. No SearchAction is declared because TradeHQ does not
// expose a dedicated site-search experience for this route.
const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "TradeHQ",
  url: "https://www.thetradehq.com/",
};

// NEW: hardcoded from the 154 URL list — lowercase symbols matching exact URLs
const TOP_ASSETS = [
  { symbol: "btc", label: "BTC" }, { symbol: "eth", label: "ETH" },
  { symbol: "sol", label: "SOL" }, { symbol: "bnb", label: "BNB" },
  { symbol: "nvda", label: "NVDA" }, { symbol: "aapl", label: "AAPL" },
  { symbol: "tsla", label: "TSLA" }, { symbol: "msft", label: "MSFT" },
  { symbol: "googl", label: "GOOGL" }, { symbol: "meta", label: "META" },
  { symbol: "spy", label: "SPY" }, { symbol: "qqq", label: "QQQ" },
  { symbol: "eurusd", label: "EUR/USD" }, { symbol: "usdjpy", label: "USD/JPY" },
  { symbol: "gold", label: "GOLD" }, { symbol: "oil", label: "OIL" },
];

const SECTORS = [
  { id: "ai-tech", label: "AI & Tech" },
  { id: "crypto-defi", label: "Crypto & DeFi" },
  { id: "mega-cap", label: "Mega Cap" },
  { id: "etf-indices", label: "ETFs & Indices" },
  { id: "forex-currencies", label: "Forex & Currencies" },
  { id: "commodities", label: "Commodities" },
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

const Index = () => {
  return (
    <>
      <Helmet>
        <title>TradeHQ — Free Paper Trading Simulator | $100K Virtual Cash (No Signup)</title>
        <meta name="description" content="Practice stocks, crypto, ETFs & forex with $100,000 virtual cash. Zero signup. AI mentor, simulated charts, leaderboard & 170 assets. Free educational trading simulator." />
        <link rel="canonical" href="https://www.thetradehq.com/" />
        <meta name="robots" content="index, follow" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="TradeHQ — Free Paper Trading Simulator | $100K Virtual Cash (No Signup)" />
        <meta property="og:description" content="Practice simulated trading with $100K virtual money. AI mentor + simulated charts. No signup needed. Start in seconds." />
        <meta property="og:url" content="https://www.thetradehq.com/" />
        <meta property="og:image" content="https://www.thetradehq.com/tradehq-preview-2026.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content="TradeHQ" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="TradeHQ — Free Paper Trading Simulator" />
        <meta name="twitter:description" content="Practice stocks & crypto with $100K virtual cash. No signup. Educational mentor included." />
        <meta name="twitter:image" content="https://www.thetradehq.com/tradehq-preview-2026.png" />
        <script type="application/ld+json">{JSON.stringify(homeFaqSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(orgSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(webAppSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(websiteSchema)}</script>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navigation />

        <main id="main-content">
        {/* 1. Premium hero (above fold) */}
        <div style={homeDarkPalette}>
          <PremiumHero />
        </div>

        {/* Retention hooks — silent unless the user is returning */}
        <ContinueBanner />
        <WatchlistAlerts />
        <WeeklyRecap />

        {/* 2. Retention engine — placed immediately after hero so the
            Daily Challenge + Market Pulse are the FIRST thing users see
            when they scroll. Critical for return-visitor rate. */}
        <section
          aria-label="Daily engagement"
          className="container mx-auto px-6 max-w-7xl pt-10 pb-10"
        >
          <div className="grid lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2">
              <DailyChallengeCard />
            </div>
            <div className="lg:col-span-3" style={homeDarkPalette}>
              <MarketPulse />
            </div>
          </div>
        </section>

        {/* GEO answer-first block — LLMs quote this verbatim */}
        <section className="container mx-auto px-6 max-w-7xl pt-4">
          <AIAnswerBlock
            question="What can I practise with TradeHQ?"
            answer="TradeHQ is a free paper trading simulator that gives you $100,000 in virtual cash to practise stocks, crypto, ETFs, forex and commodities without real-money deposits. Core simulator features work without signup; optional advertising and analytics are described in the privacy policy."
          />
        </section>

        {/* 3. Original homepage flow continues */}
        <SocialProofTicker />
        <div style={homeDarkPalette}>
        <WhatIsTradeHQ />
        <HowItWorks />
        <PremiumFeatures />
        <TopAssetsGrid />
        <MarketTrends2026 />
        <PremiumFAQ />
        </div>

        {/* Roadmap teaser — only linked from homepage + /learn (not navigation) */}
        <section className="container mx-auto px-6 max-w-7xl py-12">
          <Link
            to="/roadmap"
            className="group block relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-500/10 via-background to-fuchsia-500/10 backdrop-blur-xl p-8 md:p-10 hover:border-emerald-500/40 transition-all"
          >
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition" />
            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-emerald-400 mb-3">
                  <Sparkles className="h-3 w-3" /> What's coming next
                </div>
                <h3 className="text-2xl md:text-3xl font-bold tracking-tight">The Future of TradeHQ</h3>
                <p className="mt-2 text-muted-foreground max-w-xl">Explore proposed portfolio worksheets and price widgets, alongside the features already available. Planned work has no confirmed release date.</p>
              </div>
              <div className="inline-flex items-center gap-2 text-emerald-400 font-medium whitespace-nowrap">
                See the roadmap <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition" />
              </div>
            </div>
          </Link>
        </section>

        {/* ── NEW: Internal link hub (below fold, Googlebot crawls this) ── */}
        <section
          aria-label="Explore TradeHQ"
          className="container mx-auto px-6 max-w-7xl py-16 border-t border-white/[0.04]"
        >
          {/* Popular assets */}
          <div className="mb-10 p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]" style={{ backdropFilter: "blur(12px)" }}>
            <h2 className="text-lg font-bold mb-4 text-foreground">Popular Assets to Trade</h2>
            <div className="flex flex-wrap gap-2">
              {TOP_ASSETS.map(asset => (
                <Link
                  key={asset.symbol}
                  to={`/trade/${asset.symbol}`}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-full bg-white/[0.03] border border-white/[0.08] hover:border-primary/30 hover:text-primary transition-all duration-200"
                >
                  {asset.label}
                </Link>
              ))}
              <Link
                to="/markets"
                className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-full bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all duration-200"
              >
                View All 170 Assets →
              </Link>
            </div>
          </div>

          {/* Sectors */}
          <div className="mb-10 p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]" style={{ backdropFilter: "blur(12px)" }}>
            <h2 className="text-lg font-bold mb-4 text-foreground">Browse by Market Sector</h2>
            <div className="flex flex-wrap gap-3">
              {SECTORS.map(sector => (
                <Link
                  key={sector.id}
                  to={`/sectors/${sector.id}`}
                  className="inline-flex items-center px-5 py-2.5 text-sm font-semibold rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-primary/30 hover:bg-primary/5 transition-all duration-200"
                >
                  {sector.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Wiki */}
          <div className="mb-10 p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]" style={{ backdropFilter: "blur(12px)" }}>
            <h2 className="text-lg font-bold mb-4 text-foreground">Trading Wiki — Learn Key Concepts</h2>
            <div className="flex flex-wrap gap-2">
              {WIKI_TERMS.map(term => (
                <Link
                  key={term.slug}
                  to={`/wiki/${term.slug}`}
                  className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full bg-primary/5 border border-primary/15 text-primary/80 hover:text-primary hover:bg-primary/10 hover:border-primary/30 transition-all duration-200"
                >
                  {term.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Asset comparisons */}
          <div className="mb-10 p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]" style={{ backdropFilter: "blur(12px)" }}>
            <h2 className="text-lg font-bold mb-4 text-foreground">Asset Comparisons</h2>
            <div className="flex flex-wrap gap-2">
              {COMPARE_PAIRS.map(p => (
                <Link key={p.slug} to={`/compare/${p.slug}`} className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full bg-white/[0.03] border border-white/[0.08] hover:border-emerald-500/30 hover:text-emerald-400 transition-all">
                  {p.a.name} vs {p.b.name}
                </Link>
              ))}
            </div>
          </div>

          {/* How to trade */}
          <div className="mb-10 p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]" style={{ backdropFilter: "blur(12px)" }}>
            <h2 className="text-lg font-bold mb-4 text-foreground">How-to Guides</h2>
            <div className="flex flex-wrap gap-2">
              {HOWTO_ASSETS.map(a => (
                <Link key={a.symbol} to={`/how-to-trade/${a.symbol}`} className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full bg-white/[0.03] border border-white/[0.08] hover:border-emerald-500/30 hover:text-emerald-400 transition-all">
                  How to trade {a.fullName}
                </Link>
              ))}
            </div>
          </div>

          {/* Strategies */}
          <div className="mb-10 p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]" style={{ backdropFilter: "blur(12px)" }}>
            <h2 className="text-lg font-bold mb-4 text-foreground">Trading Strategies</h2>
            <div className="flex flex-wrap gap-2">
              {STRATEGIES.map(s => (
                <Link key={s.slug} to={`/strategy/${s.slug}`} className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full bg-white/[0.03] border border-white/[0.08] hover:border-emerald-500/30 hover:text-emerald-400 transition-all">
                  {s.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Quick nav to all main pages */}
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]" style={{ backdropFilter: "blur(12px)" }}>
            <h2 className="text-lg font-bold mb-4 text-foreground">Explore TradeHQ</h2>
            <div className="flex flex-wrap gap-3">
              <Link to="/trade" className="inline-flex items-center px-5 py-2.5 text-sm font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all">Trade Now</Link>
              <Link to="/markets" className="inline-flex items-center px-5 py-2.5 text-sm font-semibold rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-primary/30 transition-all">Markets</Link>
              <Link to="/courses" className="inline-flex items-center px-5 py-2.5 text-sm font-semibold rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-primary/30 transition-all">Learn Trading</Link>
              <Link to="/portfolio" className="inline-flex items-center px-5 py-2.5 text-sm font-semibold rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-primary/30 transition-all">Portfolio</Link>
              <Link to="/leaderboard" className="inline-flex items-center px-5 py-2.5 text-sm font-semibold rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-primary/30 transition-all">Leaderboard</Link>
              <Link to="/ai-mentor" className="inline-flex items-center px-5 py-2.5 text-sm font-semibold rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-primary/30 transition-all">AI Mentor</Link>
              <Link to="/learn-trading-guide" className="inline-flex items-center px-5 py-2.5 text-sm font-semibold rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-primary/30 transition-all">Trading Guide</Link>
            </div>
          </div>

        </section>

        </main>
        <MegaFooter />
      </div>
    </>
  );
};

export default Index;
