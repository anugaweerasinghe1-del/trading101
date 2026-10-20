import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Zap, Cpu, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

interface TopAsset {
  id: string;
  symbol: string;
  name: string;
  description: string;
  icon: React.ElementType;
  badge: string;
  badgeColor: string;
  glowColor: string;
}

const TOP_ASSETS: TopAsset[] = [
  {
    id: "btc",
    symbol: "BTC",
    name: "Bitcoin",
    description: "Study BTC quantity, price changes and virtual market-order fees. Chart and quote labels explain the practice data.",
    icon: Zap,
    badge: "Featured Market",
    badgeColor: "bg-primary/10 text-primary border-primary/20",
    glowColor: "hsl(180 70% 50% / 0.08)",
  },
  {
    id: "eth",
    symbol: "ETH",
    name: "Ethereum",
    description: "Distinguish ETH price exposure from Ethereum network activity. Practice spot accounting; no on-chain signals, transfers or staking are supplied.",
    icon: TrendingUp,
    badge: "Network Example",
    badgeColor: "bg-secondary/10 text-secondary border-secondary/20",
    glowColor: "hsl(280 60% 55% / 0.08)",
  },
  {
    id: "nvda",
    symbol: "NVDA",
    name: "NVIDIA",
    description: "Compare a virtual NVDA holding with company reporting. Revenue growth and a share-price return are different measurements.",
    icon: Cpu,
    badge: "Compute Example",
    badgeColor: "bg-profit/10 text-profit border-profit/20",
    glowColor: "hsl(152 60% 42% / 0.08)",
  },
];

/**
 * TopAssetsGrid - Premium SEO Internal Linking Component
 */
export function TopAssetsGrid() {
  return (
    <section className="py-28 bg-[hsl(0_0%_2.5%)] relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px] bg-gradient-to-r from-transparent via-primary/15 to-transparent" />

      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-4">
            Featured Practice Markets
          </span>
          <h2 className="text-3xl md:text-5xl font-bold mb-5 tracking-tight">
            Start Trading{' '}
            <span className="text-transparent bg-clip-text" style={{
              backgroundImage: 'linear-gradient(135deg, hsl(180 70% 50%), hsl(152 60% 50%))'
            }}>
              Top Assets
            </span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-base">
            Explore these featured practice markets. $100,000 virtual capital — no signup required.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {TOP_ASSETS.map((asset, index) => (
            <motion.div
              key={asset.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Link to={`/trade/${asset.id}`} className="group block h-full">
                <Card
                  className="h-full p-8 bg-white/[0.02] backdrop-blur-sm border-white/[0.06] hover:border-primary/25 transition-all duration-500 rounded-2xl"
                  style={{ boxShadow: `0 8px 40px -12px ${asset.glowColor}` }}
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 group-hover:scale-105 transition-all duration-300">
                      <asset.icon className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold group-hover:text-primary transition-colors duration-300">
                        {asset.symbol}
                      </h3>
                      <p className="text-sm text-muted-foreground">{asset.name}</p>
                    </div>
                  </div>

                  <Badge variant="outline" className={`mb-4 ${asset.badgeColor}`}>
                    {asset.badge}
                  </Badge>

                  <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                    {asset.description}
                  </p>

                  <div className="flex items-center gap-2 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <span>Trade {asset.symbol} Now</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
