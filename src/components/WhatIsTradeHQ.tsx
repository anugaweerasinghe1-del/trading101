import { Link } from "react-router-dom";
import { Zap, TrendingUp, Cpu, DollarSign, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

/**
 * WhatIsTradeHQ - AI Overview answerable section for homepage.
 * Targets "What is TradeHQ?" and "free trading simulator 2026" queries.
 */
export function WhatIsTradeHQ() {
  return (
    <section className="py-24 bg-[hsl(0_0%_3%)] relative overflow-hidden">
      {/* Top divider glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px] bg-gradient-to-r from-transparent via-primary/15 to-transparent" />

      <div className="container mx-auto px-6 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-4">
            About the Platform
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            What is <span className="text-primary">TradeHQ</span>?
          </h2>
          <p className="text-muted-foreground max-w-3xl mx-auto leading-relaxed text-base">
            TradeHQ is a free trading simulator that gives you $100,000 in virtual capital to practice
            trading stocks, cryptocurrencies, ETFs, forex, and commodities — all without risking real money.
            Built for students and beginners, it features simulated market charts, rule-based educational mentoring,
            and 170 tradeable assets. No signup, no credit card, no hidden fees. Start practicing
            order and portfolio arithmetic, recording assumptions without using real capital. Practice results do not establish investment readiness.
          </p>
        </motion.div>

        {/* Asset Categories - crawlable links grouped by type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {ASSET_CATEGORIES.map((cat, index) => (
            <motion.div
              key={cat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.06 }}
              className="p-5 rounded-2xl bg-white/[0.02] backdrop-blur-sm border border-white/[0.06] hover:border-primary/20 transition-all duration-400 group"
            >
              <cat.icon className="w-5 h-5 text-primary mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="text-sm font-semibold text-foreground mb-3">{cat.label}</h3>
              <ul className="space-y-1.5">
                {cat.assets.map((a) => (
                  <li key={a.id}>
                    <Link
                      to={`/trade/${a.id}`}
                      className="text-xs text-muted-foreground hover:text-primary transition-colors duration-200"
                    >
                      {a.text}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

const ASSET_CATEGORIES = [
  {
    label: "Crypto",
    icon: Zap,
    assets: [
      { id: "btc", text: "Practice Bitcoin (BTC)" },
      { id: "eth", text: "Practice Ethereum (ETH)" },
      { id: "sol", text: "Practice Solana (SOL)" },
      { id: "xrp", text: "Simulate XRP Trading" },
    ],
  },
  {
    label: "Tech Stocks",
    icon: Cpu,
    assets: [
      { id: "nvda", text: "NVDA Stock Simulator" },
      { id: "aapl", text: "AAPL Stock Simulator" },
      { id: "msft", text: "MSFT Stock Simulator" },
      { id: "tsla", text: "TSLA Stock Simulator" },
    ],
  },
  {
    label: "Mega-Cap",
    icon: TrendingUp,
    assets: [
      { id: "googl", text: "Practice GOOGL Trading" },
      { id: "amzn", text: "Practice AMZN Trading" },
      { id: "meta", text: "Practice META Trading" },
    ],
  },
  {
    label: "ETFs & Index",
    icon: BarChart3,
    assets: [
      { id: "spy", text: "Paper Trade S&P 500 ETF" },
      { id: "qqq", text: "Paper Trade Nasdaq-100" },
    ],
  },
  {
    label: "Forex & Commodities",
    icon: DollarSign,
    assets: [
      { id: "eurusd", text: "Practice EUR/USD Forex" },
      { id: "gbpusd", text: "Practice GBP/USD Forex" },
      { id: "gold", text: "Simulate Gold Trading" },
      { id: "oil", text: "Simulate Oil Trading" },
    ],
  },
];
