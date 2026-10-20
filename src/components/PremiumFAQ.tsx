import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, HelpCircle, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useState } from "react";

/**
 * PremiumFAQ - Breathtaking FAQ with accordion
 */
export function PremiumFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "What is TradeHQ?",
      answer: "TradeHQ is a free paper trading simulator where you can practice trading stocks, crypto, ETFs, forex, and commodities with $100,000 in virtual cash. No signup or credit card required — just open the app and start trading."
    },
    {
      question: "Is TradeHQ completely free?",
      answer: "Yes, TradeHQ is free to use. You get $100,000 in virtual practice capital with no signup required. There are no paid simulator tiers or real-money deposits required for paper trading."
    },
    {
      question: "What is paper trading?",
      answer: "Paper trading is simulated trading using virtual money instead of real capital. It lets you study buying and selling mechanics without spending real money. Simulated outcomes do not predict real returns."
    },
    {
      question: "How do I start trading on TradeHQ?",
      answer: "Just click 'Start Trading Free' — you'll instantly receive $100,000 in virtual cash to trade 170 assets. No signup, no email, no account creation needed."
    },
    {
      question: "What stocks and crypto can I trade?",
      answer: "You can practice trading across 170 assets including major cryptocurrencies (BTC, ETH, SOL), tech stocks (NVDA, AAPL, TSLA), ETFs (SPY, QQQ), forex pairs (EUR/USD, GBP/USD), and commodities (Gold, Oil)."
    },
    {
      question: "Is there a leaderboard or competition?",
      answer: "Yes! TradeHQ features a leaderboard ranking virtual traders by portfolio performance. Start with $100,000 and compete to reach the top. Visit the Leaderboard page to see the current rankings."
    },
    {
      question: "Do I need to create an account?",
      answer: "No. TradeHQ requires no signup, no email, and no account creation. Guest practice records stay in your browser. Optional accounts store cash, positions and server-recorded trades for restoration across devices; earlier guest history, journals and course progress remain browser-held."
    },
    {
      question: "What can I practise with TradeHQ?",
      answer: "TradeHQ offers virtual-money practice across stocks, crypto, ETFs, forex and commodities. You can explore order mechanics, portfolio tracking and educational lessons with $100,000 in virtual cash. Core practice features work without signup."
    },
  ];

  return (
    <section className="py-28 bg-[hsl(0_0%_2.5%)] relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px] bg-gradient-to-r from-transparent via-primary/15 to-transparent" />

      <div className="container mx-auto px-6 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-4">
            Support
          </span>
          <h2 className="text-3xl md:text-5xl font-bold mb-5 tracking-tight">
            Frequently Asked{' '}
            <span className="text-primary">Questions</span>
          </h2>
          <p className="text-muted-foreground">
            Everything you need to know about TradeHQ
          </p>
        </motion.div>

        {/* FAQ accordion */}
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <motion.div
              key={faq.question}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.06 }}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full text-left p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-primary/20 transition-all duration-300 group"
              >
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                    {faq.question}
                  </h3>
                  <ChevronDown className={`w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform duration-300 ${openIndex === index ? 'rotate-180 text-primary' : ''}`} />
                </div>
                {openIndex === index && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.3 }}
                    className="text-sm text-muted-foreground leading-relaxed mt-4 pr-8"
                  >
                    {faq.answer}
                  </motion.p>
                )}
              </button>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="text-center mt-14"
        >
          <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-12 py-7 text-base rounded-2xl min-h-[60px] font-semibold"
              style={{ boxShadow: '0 0 40px hsl(180 70% 50% / 0.15)' }}
             asChild>
<Link to="/trade">
              Start Free Trading Now
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
</Button>
        </motion.div>
      </div>
    </section>
  );
}
