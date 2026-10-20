import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const trends = [
  {
    id: "paper-trading",
    title: "Paper Trading",
    subtitle: "Practice market mechanics",
    description: "Learn order entry, position sizing, portfolio tracking and review with virtual cash before deciding whether to use real money.",
    badge: "Learn",
    color: "primary",
    href: "/learn/article/what-is-paper-trading",
  },
  {
    id: "risk-management",
    title: "Risk Management",
    subtitle: "Build repeatable habits",
    description: "Study position sizing, exits, diversification and drawdown control through TradeHQ's educational lessons and simulator.",
    badge: "Core skill",
    color: "secondary",
    href: "/learn-trading-guide",
  },
  {
    id: "market-basics",
    title: "Market Basics",
    subtitle: "Understand before you practise",
    description: "Use the glossary and courses to understand common market terms, order types and asset classes without unsupported trend forecasts.",
    badge: "Foundation",
    color: "primary",
    href: "/wiki",
  },
];

export function MarketTrends2026() {
  return (
    <section className="py-28 bg-[hsl(0_0%_3%)] relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px] bg-gradient-to-r from-transparent via-secondary/15 to-transparent" />

      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <Badge variant="outline" className="mb-6 px-4 py-2 border-primary/20 text-primary bg-primary/5">
            <TrendingUp className="w-3 h-3 mr-2" />
            Market Intelligence
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold mb-5 tracking-tight">
            <span className="text-transparent bg-clip-text" style={{
              backgroundImage: 'linear-gradient(135deg, hsl(180 70% 50%), hsl(280 60% 55%))'
            }}>
              Market Themes
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore market themes and technologies that can be studied in the simulator
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-6xl mx-auto">
          {trends.map((trend, index) => {
return (
              <motion.div
                key={trend.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card
                  className="group h-full p-8 bg-white/[0.02] backdrop-blur-sm border-white/[0.06] hover:border-primary/20 transition-all duration-500 rounded-2xl"
                  style={{ boxShadow: '0 8px 32px -12px hsl(0 0% 0% / 0.4)' }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-0 text-xs">
                      {trend.badge}
                    </Badge>
                  </div>

                  <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors duration-300">
                    {trend.title}
                  </h3>
                  <p className="text-sm text-primary/80 mb-4">{trend.subtitle}</p>
                  <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                    {trend.description}
                  </p>
                  <Link to={trend.href} className="flex items-center gap-2 text-sm text-primary font-medium group-hover:gap-3 transition-all">
                    <span>Learn More</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center mt-16"
        >
          <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-12 py-7 text-base rounded-2xl min-h-[60px] font-semibold"
              style={{ boxShadow: '0 0 40px hsl(180 70% 50% / 0.15)' }}
             asChild>
<Link to="/trade">
              Start Instant Trading
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
</Button>
        </motion.div>
      </div>
    </section>
  );
}
