import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, BarChart3, Briefcase } from "lucide-react";
import { Asset } from "@/lib/types";

/**
 * ContextualLinks — inline internal-link block that boosts crawl depth
 * by tying every hub (Trade ↔ Markets ↔ Portfolio ↔ Learn) together.
 *
 * Variants:
 *  - "trade-asset"  → on /trade/:symbol pages: links to wiki + learn + portfolio
 *  - "markets"      → on /markets: links to top assets + learn
 *  - "portfolio"    → on /portfolio: links to trade + learn
 *  - "learn"        → on /learn article pages: links to trade + markets
 */

type Variant = "trade-asset" | "markets" | "portfolio" | "learn";

interface ContextualLinksProps {
  variant: Variant;
  asset?: Asset;
  /** Optional override list of asset symbols (lowercase) to deep-link */
  assetSymbols?: string[];
}

const WIKI_BY_TYPE: Record<string, { slug: string; label: string }[]> = {
  crypto: [
    { slug: "hodl-strategy", label: "HODL Strategy" },
    { slug: "whale-manipulation", label: "Whale Manipulation" },
    { slug: "fomo", label: "FOMO Trading" },
  ],
  stock: [
    { slug: "support-and-resistance", label: "Support & Resistance" },
    { slug: "candlestick-patterns", label: "Candlestick Patterns" },
    { slug: "short-squeeze", label: "Short Squeeze" },
  ],
  etf: [
    { slug: "macd", label: "MACD Indicator" },
    { slug: "fibonacci-retracement", label: "Fibonacci Retracement" },
    { slug: "death-cross", label: "Death Cross" },
  ],
  forex: [
    { slug: "limit-order-vs-market-order", label: "Limit vs Market Order" },
    { slug: "leverage-trading", label: "Leverage Trading" },
    { slug: "rsi-divergence", label: "RSI Divergence" },
  ],
  commodity: [
    { slug: "support-and-resistance", label: "Support & Resistance" },
    { slug: "double-bottom", label: "Double Bottom" },
    { slug: "head-and-shoulders", label: "Head & Shoulders" },
  ],
};

const LEARN_FOR_TYPE: Record<string, { slug: string; label: string }> = {
  crypto: { slug: "crypto-vs-stocks", label: "Crypto vs Stocks: Key Differences" },
  stock: { slug: "how-to-read-stock-charts", label: "How to Read Stock Charts" },
  etf: { slug: "stock-market-index-etfs", label: "ETFs Explained for Beginners" },
  forex: { slug: "trading-strategies-for-beginners", label: "Trading Strategies for Beginners" },
  commodity: { slug: "how-to-build-a-portfolio", label: "How to Build a Diversified Portfolio" },
};

export function ContextualLinks({ variant, asset, assetSymbols }: ContextualLinksProps) {
  if (variant === "trade-asset" && asset) {
    const wikis = WIKI_BY_TYPE[asset.type] || WIKI_BY_TYPE.stock;
    const learn = LEARN_FOR_TYPE[asset.type] || LEARN_FOR_TYPE.stock;
    return (
      <section
        aria-label={`General learning resources for ${asset.symbol} practice`}
        className="mt-8 p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06]"
      >
        <h2 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary" />
          Trading concepts for your {asset.symbol} practice
        </h2>
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
          These general explainers cover trading concepts, not research or a valuation of {asset.name}. Use them alongside your simulated {asset.symbol} practice, then review positions in your{" "}
          <Link to="/portfolio" className="text-primary underline-offset-4 hover:underline">
            portfolio dashboard
          </Link>
          .
        </p>
        <div className="flex flex-wrap gap-2">
          {wikis.map((w) => (
            <Link
              key={w.slug}
              to={`/wiki/${w.slug}`}
              className="text-xs px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-foreground/80 hover:text-primary hover:border-primary/30 transition-colors"
            >
              {w.label}
            </Link>
          ))}
          <Link
            to={`/learn/article/${learn.slug}`}
            className="text-xs px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-colors inline-flex items-center gap-1"
          >
            {learn.label} <ArrowRight className="w-3 h-3" />
          </Link>
          <Link
            to="/markets"
            className="text-xs px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-foreground/80 hover:text-primary hover:border-primary/30 transition-colors inline-flex items-center gap-1"
          >
            <BarChart3 className="w-3 h-3" /> Compare in Markets
          </Link>
        </div>
      </section>
    );
  }

  if (variant === "markets") {
    const symbols = assetSymbols ?? ["btc", "eth", "nvda", "tsla", "spy", "qqq"];
    return (
      <section
        aria-label="Featured trading destinations"
        className="mt-4 mb-6 p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06]"
      >
        <p className="text-sm text-muted-foreground leading-relaxed">
          Browse 170 assets across stocks, crypto, ETFs, forex and commodities. Featured practice markets:{" "}
          {symbols.map((s, i) => (
            <span key={s}>
              <Link to={`/trade/${s}`} className="text-primary underline-offset-4 hover:underline font-medium">
                {s.toUpperCase()}
              </Link>
              {i < symbols.length - 1 ? ", " : ""}
            </span>
          ))}
          . Want a structured plan? Visit the{" "}
          <Link to="/learn" className="text-primary underline-offset-4 hover:underline">
            Learning Center
          </Link>{" "}
          or open your{" "}
          <Link to="/portfolio" className="text-primary underline-offset-4 hover:underline">
            portfolio dashboard
          </Link>
          .
        </p>
      </section>
    );
  }

  if (variant === "portfolio") {
    return (
      <section
        aria-label="What to study next"
        className="mt-6 p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06]"
      >
        <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-primary" /> What to study next
        </h2>
        <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
          Strengthen your simulated portfolio with these guides — then put them into practice on the{" "}
          <Link to="/trade" className="text-primary underline-offset-4 hover:underline">
            trading simulator
          </Link>
          .
        </p>
        <div className="flex flex-wrap gap-2">
          <Link to="/learn/article/how-to-build-a-portfolio" className="text-xs px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-foreground/80 hover:text-primary hover:border-primary/30 transition-colors">
            How to Build a Portfolio
          </Link>
          <Link to="/learn/article/trading-strategies-for-beginners" className="text-xs px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-foreground/80 hover:text-primary hover:border-primary/30 transition-colors">
            Beginner Trading Strategies
          </Link>
          <Link to="/learn/article/how-to-read-stock-charts" className="text-xs px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-foreground/80 hover:text-primary hover:border-primary/30 transition-colors">
            Reading Stock Charts
          </Link>
          <Link to="/markets" className="text-xs px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-colors inline-flex items-center gap-1">
            <BarChart3 className="w-3 h-3" /> Browse Markets
          </Link>
        </div>
      </section>
    );
  }

  if (variant === "learn") {
    const symbols = assetSymbols ?? ["btc", "nvda", "spy"];
    return (
      <section
        aria-label="Practice this in the simulator"
        className="mt-8 p-5 rounded-2xl bg-primary/[0.04] border border-primary/15"
      >
        <p className="text-sm text-foreground/90 leading-relaxed">
          Apply what you just read on the{" "}
          <Link to="/trade" className="text-primary font-medium underline-offset-4 hover:underline">
            TradeHQ simulator
          </Link>
          . Practise with virtual cash using these asset examples:{" "}
          {symbols.map((s, i) => (
            <span key={s}>
              <Link to={`/trade/${s}`} className="text-primary underline-offset-4 hover:underline font-medium">
                {s.toUpperCase()}
              </Link>
              {i < symbols.length - 1 ? ", " : ""}
            </span>
          ))}
          . Or scan the full{" "}
          <Link to="/markets" className="text-primary underline-offset-4 hover:underline">
            markets dashboard
          </Link>{" "}
          for ideas.
        </p>
      </section>
    );
  }

  return null;
}