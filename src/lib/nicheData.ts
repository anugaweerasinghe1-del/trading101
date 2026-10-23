// Programmatic SEO: 50 unique /niche/[symbol] routes
import { ASSETS, formatPrice } from './assets';

export interface NicheAsset {
  assetId: string;
  symbol: string;
  name: string;
  type: string;
  mentorTake: string;
  faqs: { question: string; answer: string }[];
  keyStats: { label: string; value: string }[];
}

const mentorTakes: Record<string, string> = {};

const defaultMentorTake = (symbol: string, name: string, type: string) => {
  const driverText =
    type === "crypto"
      ? symbol === "BTC"
        ? "network activity, regulation, liquidity and broader crypto-market sentiment"
        : "network activity, regulation, liquidity, broader crypto-market sentiment and correlation with Bitcoin"
      : type === "stock"
      ? "company earnings, guidance, industry conditions, valuation expectations and broader market risk appetite"
      : type === "forex"
      ? "interest-rate expectations, inflation and employment data, central-bank policy and relative economic growth"
      : "supply and demand, currency moves, macroeconomic conditions and market-specific events";

  return `${name} (${symbol}) can move for many reasons, including ${driverText}. TradeHQ does not publish live price targets or buy/sell calls on this page. Use the simulator to form a written hypothesis, choose a practice position size, define what would invalidate the idea, and review the result afterwards. Market data may be simulated, cached or delayed, so verify time-sensitive facts with an authoritative market source.`;
};

export function getNicheAsset(symbol: string): NicheAsset | null {
  const normalizedSymbol = symbol.toUpperCase().replace('-', '/');
  const asset = ASSETS.find(a => a.symbol.toUpperCase() === normalizedSymbol
    || a.id.toUpperCase() === symbol.toUpperCase().replace(/-/g, ''));

  if (!asset) return null;

  const mentorTake = mentorTakes[normalizedSymbol] || defaultMentorTake(asset.symbol, asset.name, asset.type);

  return {
    assetId: asset.id,
    symbol: asset.symbol,
    name: asset.name,
    type: asset.type,
    mentorTake,
    faqs: [
      { question: `Does TradeHQ recommend buying ${asset.name}?`, answer: `No. TradeHQ is an educational simulator and does not rate assets as good or bad investments. Use the page to understand ${asset.symbol} price drivers and to test a process with virtual funds.` },
      { question: `How can a beginner practise trading ${asset.symbol}?`, answer: `Start by learning what tends to move ${asset.symbol}, then use virtual funds to practise order types, position sizing, predefined exits, and post-trade review. Treat any risk percentage as a simulation setting rather than a universal rule.` },
      { question: `What affects ${asset.symbol} price?`, answer: `${asset.symbol} price is influenced by ${asset.type === 'crypto' ? asset.symbol === 'BTC' ? 'market sentiment, liquidity, regulatory news, and network activity' : 'market sentiment, regulatory news, network metrics, and Bitcoin correlation' : asset.type === 'stock' ? 'earnings reports, sector trends, macroeconomic data, and analyst upgrades/downgrades' : asset.type === 'forex' ? 'interest rate differentials, economic data releases, central bank policy, and geopolitical events' : 'supply/demand dynamics, geopolitical factors, currency movements, and seasonal patterns'}.` },
    ],
    keyStats: [
      { label: "Asset Class", value: asset.type.charAt(0).toUpperCase() + asset.type.slice(1) },
      { label: "Simulator Reference Price", value: `${asset.price !== 0 && Math.abs(asset.price) < 0.0001 ? formatPrice(asset.price, asset.type) : asset.price < 1 ? asset.price.toFixed(4) : asset.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}` },
      { label: "Simulator Reference Change", value: `${asset.changePercent >= 0 ? '+' : ''}${asset.changePercent.toFixed(2)}%` },
      { label: "Simulator Available", value: "Yes — Free" },
    ],
  };
}

// All niche symbols for sitemap & routing
export const NICHE_SYMBOLS: string[] = [
  "BTC", "ETH", "SOL", "XRP", "BNB", "ADA", "DOGE", "AVAX", "DOT", "MATIC",
  "LINK", "LTC", "SHIB", "UNI", "ATOM", "ALGO", "FTM", "NEAR", "ICP", "XLM",
  "AAPL", "TSLA", "NVDA", "MSFT", "GOOGL", "AMZN", "META", "NFLX", "AMD", "CRM",
  "INTC", "ORCL", "ADBE", "AVGO", "QCOM", "UBER", "SHOP", "PLTR", "COIN", "SQ",
  "EUR-USD", "GBP-USD", "USD-JPY", "AUD-USD", "USD-CAD",
  "GOLD", "OIL", "SILVER", "NAT-GAS", "COPPER",
];
