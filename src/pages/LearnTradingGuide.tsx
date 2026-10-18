import { useState, useMemo } from "react";
import { Navigation } from "@/components/Navigation";
import { CompoundCalculator } from "@/components/CompoundCalculator";
import { LearningProgressTracker } from "@/components/LearningProgressTracker";
import { CredibilityFooter } from "@/components/CredibilityFooter";
import { SocialShare } from "@/components/SocialShare";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Shield, Globe, CheckCircle2, ArrowRight, Target, Sparkles, LineChart, Zap, TrendingUp, BarChart3, BookOpen } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { tradingGlossary } from "@/lib/tradingGlossary";
import { EducationalDisclaimer } from "@/components/EducationalDisclaimer";

const DOMAIN = "https://www.thetradehq.com";

// Seeded random for daily consistency
function seededRandom(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
  }
  return ((h >>> 0) % 100) / 100;
}

const DAILY_CHALLENGES = [
  {
    pattern: "Double Bottom",
    description: "Price drops to $42,100, bounces to $43,800, drops again to $42,150, then breaks above $43,800 with increasing volume.",
    options: ["Head and Shoulders", "Double Bottom", "Bull Flag"],
    correct: 1,
  },
  {
    pattern: "Golden Cross",
    description: "The 50-day moving average crosses above the 200-day moving average while price trades above both lines with rising volume.",
    options: ["Death Cross", "Bollinger Squeeze", "Golden Cross"],
    correct: 2,
  },
  {
    pattern: "Bear Trap",
    description: "Price briefly breaks below key support at $2,800, triggering stop losses, then reverses sharply to close at $2,950 within the same candle.",
    options: ["Bear Trap", "Liquidation Cascade", "Short Squeeze"],
    correct: 0,
  },
];

const LearnTradingGuide = () => {
  const today = new Date().toDateString();
  const dayIndex = new Date().getDay();
  const challenge = DAILY_CHALLENGES[dayIndex % DAILY_CHALLENGES.length];
  const sentimentValue = Math.round(seededRandom(today) * 100);
  const sentimentLabel = sentimentValue < 25 ? "Extreme Fear" : sentimentValue < 45 ? "Fear" : sentimentValue < 55 ? "Neutral" : sentimentValue < 75 ? "Greed" : "Extreme Greed";
  const sentimentColor = sentimentValue < 30 ? "bg-red-500" : sentimentValue < 50 ? "bg-amber-500" : sentimentValue < 70 ? "bg-emerald-500" : "bg-emerald-400";

  const [challengeAnswer, setChallengeAnswer] = useState<number | null>(null);
  const isCorrect = challengeAnswer === challenge.correct;

  // Pick 3 spotlight terms seeded by date
  const spotlightTerms = useMemo(() => {
    const seed = seededRandom(today + "wiki");
    const startIdx = Math.floor(seed * (tradingGlossary.length - 3));
    return tradingGlossary.slice(startIdx, startIdx + 3);
  }, [today]);

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "headline": "AI-Assisted Trading for Beginners: Educational Guide",
    "description": "Master AI-assisted trading, Bitcoin Layer 2, and risk management with a free $100K simulator.",
    "author": { "@type": "Organization", "name": "TradeHQ" },
    "image": `${DOMAIN}/og-image.jpg`
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How do I start trading with no money?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "One learning exercise is to use a simulator such as TradeHQ to study order entry and portfolio changes with $100,000 in virtual cash. Practice outcomes do not establish readiness for real trading."
        }
      }
    ]
  };

  return (
    <>
      <Helmet>
        <title>Learn Trading Strategy | Free Educational Guide for Beginners</title>
        <meta name="description" content="Study market mechanics, decision-making and hypothetical portfolio calculations with virtual cash. Simulated results do not predict investment outcomes." />
        <link rel="canonical" href={`${DOMAIN}/learn-trading-guide`} />
        <meta name="robots" content="index, follow" />
        <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      <div className="min-h-screen bg-[#020405] text-slate-300 selection:bg-emerald-500/30 font-sans">
        <Navigation />

        {/* --- Hero --- */}
        <header className="relative pt-24 pb-8">
          <div className="container mx-auto px-6 text-center relative z-10">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-bold mb-6">
                Institutional Grade Education
              </Badge>
            </motion.div>
            
            <h1 className="text-3xl md:text-5xl font-black mb-6 tracking-tight text-white leading-tight uppercase italic">
              Practice with <span className="text-emerald-500">$100K Virtual Cash</span>
            </h1>

            <p className="text-base md:text-lg text-slate-400 max-w-2xl mx-auto mb-8 leading-relaxed">
              Explore market concepts, AI-assisted learning tools, and Bitcoin scaling topics 
              using our high-fidelity simulator. No capital required.
            </p>

            <Link to="/trade/BTC">
              <Button size="lg" className="h-12 bg-profit hover:bg-profit/90 text-profit-foreground font-bold px-10 rounded-xl transition-all shadow-glow-profit">
                LAUNCH TERMINAL <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </header>

        <main className="container mx-auto px-6 pb-6">
          {/* --- Ticker Tape --- */}
          <div className="overflow-hidden rounded-xl border border-white/5 bg-white/[0.01] mb-6">
            <p className="px-4 pt-2.5 text-[9px] uppercase tracking-[0.16em] font-bold text-slate-600">
              Illustrative ticker examples — not live market data
            </p>
            <div className="ticker-tape-container flex whitespace-nowrap py-2.5" style={{ willChange: "transform" }}>
              {[...Array(2)].map((_, dupeIdx) => (
                <div key={dupeIdx} className="ticker-scroll flex gap-8 px-4 animate-ticker">
                  {[
                    { sym: "BTC", change: "+2.4%", up: true },
                    { sym: "ETH", change: "+1.8%", up: true },
                    { sym: "SOL", change: "-0.6%", up: false },
                    { sym: "NVDA", change: "+3.1%", up: true },
                    { sym: "SPY", change: "+0.4%", up: true },
                    { sym: "GOLD", change: "+0.9%", up: true },
                    { sym: "EUR/USD", change: "-0.2%", up: false },
                  ].map((t) => (
                    <span key={`${dupeIdx}-${t.sym}`} className="inline-flex items-center gap-2 text-xs font-mono">
                      <span className="font-bold text-white">{t.sym}</span>
                      <span className="text-slate-500">sample move</span>
                      <span className={t.up ? "text-emerald-400" : "text-red-400"}>{t.change}</span>
                    </span>
                  ))}
                </div>
              ))}
            </div>
            <style>{`
              @keyframes tickerScroll {
                0% { transform: translateX(0); }
                100% { transform: translateX(-50%); }
              }
              .ticker-tape-container {
                will-change: transform;
              }
              .animate-ticker {
                animation: tickerScroll 25s linear infinite;
              }
            `}</style>
          </div>

          {/* --- Grid Layout: SEO Content + Functional Tools --- */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch max-w-7xl mx-auto">
            
            {/* Left: SEO Narrative & Progress (40%) */}
            <section className="lg:col-span-5 space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Target className="text-emerald-500 w-4 h-4" />
                  <h2 className="text-xs uppercase tracking-widest font-black text-slate-500">Curriculum</h2>
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight">AI-Assisted Trading Foundations</h3>
              </div>

              <Card className="p-6 bg-white/[0.02] border-white/5 rounded-2xl backdrop-blur-md shadow-2xl">
                <div className="space-y-8">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20">
                      <Zap className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white uppercase tracking-tight mb-1">AI-Assisted Explanations</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">Study labelled educational explanations. AI and rule-based responses can be incomplete and do not identify investment opportunities.</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20">
                      <Shield className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white uppercase tracking-tight mb-1">Risk Architecture</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">Compare hypothetical loss budgets and price shocks. A one-percent example is a worksheet input, not a universal risk rule.</p>
                    </div>
                  </div>
                </div>
              </Card>

              <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-4">
                <LearningProgressTracker />
              </div>
            </section>

            {/* Right: Compound Calculator Tool (60%) */}
            <section className="lg:col-span-7">
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2">
                  <LineChart className="text-emerald-500 w-4 h-4" />
                  <h2 className="text-xs uppercase tracking-widest font-black text-slate-500">Strategy Projections</h2>
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight">Compound Growth Simulator</h3>
              </div>
              
              <div className="p-1 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent border border-white/5 shadow-2xl h-full">
                <div className="bg-[#010203] rounded-xl overflow-hidden p-2 md:p-5 h-full">
                  <CompoundCalculator />
                </div>
              </div>
            </section>
          </div>

          {/* --- Command Center --- */}
          <section className="mt-8 max-w-7xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="text-emerald-500 w-4 h-4" />
              <h2 className="text-xs uppercase tracking-[0.15em] font-black text-slate-500">Command Center</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Daily Challenge */}
              <Card className="p-5 bg-white/[0.02] border-white/5 rounded-2xl md:col-span-2">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  <h3 className="text-xs uppercase tracking-[0.15em] font-black text-white">Daily Challenge</h3>
                </div>
                <p className="text-xs text-slate-500 mb-2 font-bold uppercase tracking-tight">Identify This Pattern:</p>
                <p className="text-sm text-slate-300 mb-4 leading-relaxed bg-white/[0.02] border border-white/5 rounded-xl p-3 font-mono">
                  {challenge.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {challenge.options.map((opt, i) => (
                    <Button
                      key={i}
                      size="sm"
                      variant={challengeAnswer === i ? (i === challenge.correct ? "default" : "destructive") : "outline"}
                      className={`text-xs rounded-lg transition-all ${
                        challengeAnswer === null
                          ? "border-white/10 text-slate-300 hover:border-emerald-500/40 hover:text-emerald-400"
                          : i === challenge.correct
                          ? "bg-profit text-profit-foreground border-profit"
                          : challengeAnswer === i
                          ? "bg-red-600/20 text-red-400 border-red-500/30"
                          : "border-white/5 text-slate-500"
                      }`}
                      onClick={() => setChallengeAnswer(i)}
                      disabled={challengeAnswer !== null}
                    >
                      {opt}
                    </Button>
                  ))}
                </div>
                {challengeAnswer !== null && (
                  <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-3">
                    <p className={`text-xs font-bold ${isCorrect ? "text-emerald-400" : "text-red-400"}`}>
                      {isCorrect ? "🎉 Correct! You identified the pattern." : `❌ The correct answer was: ${challenge.pattern}`}
                    </p>
                    {isCorrect && (
                      <div className="mt-2 flex gap-1">
                        {["🎊", "✨", "🎉", "⭐", "💫"].map((e, i) => (
                          <motion.span
                            key={i}
                            initial={{ opacity: 0, y: 10, scale: 0 }}
                            animate={{ opacity: 1, y: -10 * (i + 1), scale: 1 }}
                            transition={{ delay: i * 0.1, duration: 0.5 }}
                            className="text-lg"
                          >
                            {e}
                          </motion.span>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </Card>

              {/* Sentiment Gauge */}
              <Card className="p-5 bg-white/[0.02] border-white/5 rounded-2xl flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <h3 className="text-xs uppercase tracking-[0.15em] font-black text-white">Practice Sentiment Example</h3>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center gap-3">
                  <div className="relative w-8 h-32 bg-white/5 rounded-full overflow-hidden border border-white/10">
                    <motion.div
                      className={`absolute bottom-0 left-0 right-0 ${sentimentColor} rounded-full`}
                      initial={{ height: 0 }}
                      animate={{ height: `${sentimentValue}%` }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-black text-white">{sentimentValue}</p>
                    <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-slate-500">{sentimentLabel}</p>
                  </div>
                </div>
                <p className="text-[9px] text-slate-600 text-center mt-2">Seeded educational example · Not live market sentiment</p>
              </Card>
            </div>

            {/* Wiki Spotlight */}
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-4 h-4 text-emerald-500" />
                <h3 className="text-xs uppercase tracking-[0.15em] font-black text-slate-500">Wiki Spotlight</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {spotlightTerms.map((term) => (
                  <Link key={term.slug} to={`/wiki/${term.slug}`}>
                    <Card className="p-4 bg-white/[0.02] border-white/5 hover:border-emerald-500/30 transition-all rounded-xl group">
                      <p className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">{term.term}</p>
                      <p className="text-[10px] text-slate-500 mt-1">{term.difficulty} · {term.readTime}</p>
                      <p className="text-xs text-slate-400 mt-2 line-clamp-2">{term.definition.slice(0, 100)}…</p>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </section>

          {/* --- Global Trust Features --- */}
          <section className="mt-10 py-8 border-t border-white/5 relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent opacity-20" />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto">
              {[
                { icon: Globe, title: "170 Assets", desc: "Equities, Crypto & Tokenized Securities." },
                { icon: Shield, title: "Virtual Money Only", desc: "Practice losses do not spend real cash." },
                { icon: Zap, title: "Practice Ready", desc: "Built around simulator exercises and guided learning." }
              ].map((f, i) => (
                <div key={i} className="text-center group">
                  <div className="w-10 h-10 mx-auto mb-4 bg-emerald-500/5 rounded-full flex items-center justify-center group-hover:bg-emerald-500/20 transition-all">
                    <f.icon className="w-4 h-4 text-emerald-500" />
                  </div>
                  <h4 className="text-[11px] uppercase tracking-[0.2em] font-black text-white mb-2">{f.title}</h4>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{f.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="mt-6 pt-4 border-t border-white/5 text-center">
            <SocialShare title="I'm learning AI-assisted trading on TradeHQ! 🚀" description="Learning market concepts with a free $100K simulator" variant="compact" />
          </div>
          <EducationalDisclaimer variant="footer" className="mb-10" />
        </main>

        <CredibilityFooter />
      </div>
    </>
  );
};

export default LearnTradingGuide;
