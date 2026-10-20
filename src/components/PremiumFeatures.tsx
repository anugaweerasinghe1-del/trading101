import { Shield, Zap, GraduationCap, Brain, BarChart3, Wallet } from "lucide-react";
import { motion } from "framer-motion";

/**
 * PremiumFeatures - Breathtaking features grid with glassmorphism
 */
export function PremiumFeatures() {
  const features = [
    {
      icon: Shield,
      title: "Practice with Virtual Cash",
      description: "Use $100K virtual cash to compare quantities, transaction fees and hypothetical outcomes without spending real funds.",
      gradient: "from-primary/20 to-primary/5",
      iconColor: "text-primary",
      borderGlow: "hover:border-primary/30",
    },
    {
      icon: Zap,
      title: "Instant Market Simulation",
      description: "Execute trades instantly on 170 assets. Practise order mechanics with labelled quotes and simulated charts.",
      gradient: "from-profit/20 to-profit/5",
      iconColor: "text-profit",
      borderGlow: "hover:border-profit/30",
    },
    {
      icon: Brain,
      title: "Educational Mentor",
      description: "Ask a rule-based knowledge library about trading concepts and practice-portfolio observations. Responses are educational prompts, not personalized investment advice.",
      gradient: "from-secondary/20 to-secondary/5",
      iconColor: "text-secondary",
      borderGlow: "hover:border-secondary/30",
    },
    {
      icon: BarChart3,
      title: "Practice Analytics",
      description: "Track simulated P&L, max drawdown, current open-position dispersion, and allocation snapshots with clearly labeled practice metrics.",
      gradient: "from-primary/20 to-primary/5",
      iconColor: "text-primary",
      borderGlow: "hover:border-primary/30",
    },
    {
      icon: Wallet,
      title: "Multi-Asset Portfolio",
      description: "Compare holdings across stocks, crypto, forex, ETFs and commodities. Multiple assets can still share risks or overlapping exposures.",
      gradient: "from-warning/20 to-warning/5",
      iconColor: "text-warning",
      borderGlow: "hover:border-warning/30",
    },
    {
      icon: GraduationCap,
      title: "Structured Courses",
      description: "Study market concepts, risk arithmetic and decision records through structured lessons, quizzes and conceptual worksheets.",
      gradient: "from-secondary/20 to-secondary/5",
      iconColor: "text-secondary",
      borderGlow: "hover:border-secondary/30",
    },
  ];

  return (
    <section className="py-28 bg-[hsl(0_0%_2%)] relative overflow-hidden">
      {/* Subtle ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

      <div className="container mx-auto px-6">
        {/* Section header */}
        <div className="text-center mb-20 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-4">
              Built for Beginners
            </span>
            <h2 className="text-3xl md:text-5xl font-bold mb-5 tracking-tight">
              Everything You Need to{' '}
              <span className="text-transparent bg-clip-text" style={{
                backgroundImage: 'linear-gradient(135deg, hsl(180 70% 50%), hsl(152 60% 50%))'
              }}>
                Learn by Practicing
              </span>
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Practical tools with virtual money. Study market mechanics through simulated orders and portfolio changes.
            </p>
          </motion.div>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              className={`group p-7 rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-sm ${feature.borderGlow} transition-all duration-500 hover:bg-white/[0.04]`}
              style={{ boxShadow: '0 8px 32px -12px hsl(0 0% 0% / 0.4)' }}
            >
              <div className={`w-12 h-12 mb-6 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className={`w-6 h-6 ${feature.iconColor}`} />
              </div>
              <h3 className="text-lg font-semibold mb-3 text-foreground group-hover:text-primary transition-colors duration-300">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
