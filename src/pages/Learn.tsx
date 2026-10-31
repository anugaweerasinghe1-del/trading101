import type { CSSProperties } from "react";
import { Helmet } from "react-helmet-async";
import { Navigation } from "@/components/Navigation";
import { MegaFooter } from "@/components/MegaFooter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, TrendingUp, Shield, PieChart, LineChart, Target, ArrowRight, Zap, Coins, Brain, ChevronRight, Home, Clock, GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";
import { LEARN_ARTICLES } from "@/lib/learnArticles";
import { SEOSection } from "@/components/SEOSection";
import { useCourseCatalog } from "@/hooks/useCourseCatalog";
import { LearningJourneyDashboard } from "@/components/LearningJourneyDashboard";
import { GuidedNextLesson } from "@/components/GuidedNextLesson";
import { COUNTRY_GUIDES } from "@/lib/countryGuides";
import tradingBasics from "@/assets/course-trading-basics.jpg";
import riskManagement from "@/assets/course-risk-management.jpg";
import technicalAnalysis from "@/assets/course-technical-analysis.jpg";
import diversification from "@/assets/course-diversification.jpg";
import goals from "@/assets/course-goals.jpg";
import marketTrends from "@/assets/course-market-trends.jpg";

const lessons = [
  { id: 1, title: "Getting Started with Trading", category: "Basics", icon: BookOpen, image: tradingBasics, description: "Learn the fundamentals of trading, key terminology, and how markets work.", difficulty: "Beginner", readTime: "15 min", tier: "foundations" as const, content: ["Understanding stocks, ETFs, and other securities", "How to read stock quotes and charts", "Market orders vs. limit orders", "Trading hours and market sessions"] },
  { id: 5, title: "Setting Trading Goals", category: "Basics", icon: Target, image: goals, description: "Separate hypothetical return arithmetic from reviewable practice goals.", difficulty: "Beginner", readTime: "12 min", tier: "foundations" as const, content: ["Short-term vs. long-term strategies", "Return assumptions and practice goals", "Creating a trading journal", "Evaluating your performance"] },
  { id: 2, title: "Risk Management", category: "Strategy", icon: Shield, image: riskManagement, description: "Calculate hypothetical exposure, costs and losses, including worse-than-planned exits.", difficulty: "Intermediate", readTime: "18 min", tier: "strategy" as const, content: ["Position sizing assumptions and their limits", "Stop-loss orders and take-profit targets", "Understanding risk-reward ratios", "Diversification strategies"] },
  { id: 3, title: "Technical Analysis Basics", category: "Analysis", icon: LineChart, image: technicalAnalysis, description: "Read chart observations and indicator calculations without treating them as forecasts.", difficulty: "Intermediate", readTime: "20 min", tier: "strategy" as const, content: ["Candlestick patterns and what they mean", "Support and resistance levels", "Moving averages (SMA and EMA)", "RSI and MACD indicators"] },
  { id: 6, title: "Market Trends & Patterns", category: "Analysis", icon: TrendingUp, image: marketTrends, description: "Describe trends, volume and sentiment measures, and test their limitations.", difficulty: "Intermediate", readTime: "18 min", tier: "strategy" as const, content: ["Bull markets vs. bear markets", "Identifying trend reversals", "Volume analysis", "Market sentiment indicators"] },
  { id: 4, title: "Portfolio Diversification", category: "Strategy", icon: PieChart, image: diversification, description: "Build a balanced portfolio across different asset classes and sectors.", difficulty: "Advanced", readTime: "22 min", tier: "advanced" as const, content: ["Asset allocation strategies", "Balancing stocks, ETFs, and crypto", "Sector diversification", "Rebalancing your portfolio"] },
];

const trendingTopics = [
  { id: "bitcoin-practice", title: "Bitcoin Practice", subtitle: "BTC simulator", description: "Practice Bitcoin order entry and portfolio tracking with virtual cash.", icon: Zap, badge: "Practice", href: "/trade/btc" },
  { id: "index-etfs", title: "Stock Market Index ETFs", subtitle: "Broad-market funds", description: "Learn how index ETFs package baskets of stocks and how they differ from individual shares.", icon: Coins, badge: "Guide", href: "/learn/article/stock-market-index-etfs" },
  { id: "educational-mentor", title: "Educational Mentor", subtitle: "Trading concepts", description: "Ask the rule-based educational library about concepts and practice observations. It does not automate trades or provide investment signals.", icon: Brain, badge: "Learning", href: "/ai-mentor" },
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

const SECTORS = [
  { id: "ai-tech", label: "AI & Tech" },
  { id: "crypto-defi", label: "Crypto & DeFi" },
  { id: "mega-cap", label: "Mega Cap" },
  { id: "etf-indices", label: "ETFs & Indices" },
  { id: "forex-currencies", label: "Forex & Currencies" },
  { id: "commodities", label: "Commodities" },
];

const LEARNING_PATH = [
  { tier: "foundations" as const, label: "Foundations", tagline: "Start here — understand markets, terminology, and your first trade.", color: "text-emerald-400 [.light_&]:text-emerald-800", borderColor: "border-emerald-500/20", bgColor: "bg-emerald-500/5" },
  { tier: "strategy" as const, label: "Strategy & Analysis", tagline: "Compare assumptions — risk management, technical analysis, and market patterns.", color: "text-blue-400 [.light_&]:text-blue-800", borderColor: "border-blue-500/20", bgColor: "bg-blue-500/5" },
  { tier: "advanced" as const, label: "Advanced Practice", tagline: "Refine your approach — portfolio construction, diversification, and real-world application.", color: "text-amber-400 [.light_&]:text-amber-800", borderColor: "border-amber-500/20", bgColor: "bg-amber-500/5" },
];

/** Explains the difference between /courses (structured) and /learn (quick reads). */
const FORMAT_GUIDE = [
  { label: "Full Courses", where: "/courses", detail: "Multi-lesson tracks with quizzes, saved progress and completion badges. Best if you want to learn in order, start to finish." },
  { label: "Quick Reads", where: "this page", detail: "Standalone 12–22 minute explainers, guides and glossary terms. Best if you want one specific topic answered right now." },
];

const difficultyColors: Record<string, string> = {
  Beginner: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Intermediate: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Advanced: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

export default function Learn() {
  const { tracks } = useCourseCatalog();
  const courseLessonCount = tracks.reduce((count, track) => count + track.lessons.length, 0);
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "TradeHQ", item: "https://www.thetradehq.com/" },
      { "@type": "ListItem", position: 2, name: "Learning", item: "https://www.thetradehq.com/learn" },
    ],
  };

  return (
    <>
      <Helmet>
        <title>Learn Trading — Free Beginner to Advanced Guides | TradeHQ</title>
        <meta name="description" content="Free trading education for stocks, crypto, technical analysis and risk management. Practice with $100K virtual cash. No signup required — TradeHQ." />
        <link rel="canonical" href="https://www.thetradehq.com/learn" />
        <meta name="robots" content="index, follow" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Learn Trading — Free Beginner to Advanced Guides" />
        <meta property="og:description" content="Explore trading concepts with free beginner-to-advanced lessons, worked examples and $100K in virtual cash. No signup required." />
        <meta property="og:url" content="https://www.thetradehq.com/learn" />
        <meta property="og:image" content="https://www.thetradehq.com/tradehq-preview-2026.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content="TradeHQ" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Learn Trading — Free Beginner to Advanced Guides" />
        <meta name="twitter:description" content="Free trading education: stocks, crypto, technical analysis & more. Practice with $100K virtual cash." />
        <meta name="twitter:image" content="https://www.thetradehq.com/tradehq-preview-2026.png" />
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navigation />
        {/* Atmospheric backdrop */}
        <div
          aria-hidden
          className="fixed inset-0 pointer-events-none -z-0 opacity-60"
          style={{
            background:
              "radial-gradient(900px 600px at 10% -10%, hsl(168 100% 50% / 0.10), transparent 60%), radial-gradient(700px 500px at 90% 10%, hsl(280 60% 55% / 0.07), transparent 60%), radial-gradient(600px 400px at 50% 100%, hsl(38 90% 55% / 0.05), transparent 60%)",
          }}
        />
        <main className="relative pt-32 pb-20">
          <div className="container mx-auto px-6 max-w-7xl">

            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8 animate-fade-in" aria-label="Breadcrumb">
              <Link to="/" className="flex items-center gap-1 hover:text-primary transition-colors"><Home className="w-4 h-4" /><span>TradeHQ</span></Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-foreground font-medium">Learning</span>
            </nav>

            {/* Keep the existing accessible next-lesson recommendation before the unified summary. */}
            <div className="mb-8">
              <GuidedNextLesson />
            </div>
            <LearningJourneyDashboard tracks={tracks} />

            {/* Structured Courses — top-of-page discovery */}
            <section className="mb-14" aria-label="Structured Courses">
              <div className="flex items-end justify-between gap-3 mb-5 flex-wrap">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-emerald-400 mb-1">Full courses</div>
                  <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                    <GraduationCap className="w-6 h-6 text-emerald-400" /> Structured Trading Courses
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">Explore {tracks.length} available structured tracks and {courseLessonCount} lessons, with quizzes and completion badges — 100% free. This is the guided, in-order way to learn.</p>
                </div>
                <Link to="/courses" className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-400 hover:text-emerald-300">
                  View all courses <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {tracks.map((t) => (
                  <Link key={t.slug} to={`/courses/${t.slug}`} className="group block">
                    <Card className="overflow-hidden bg-white/[0.02] border-white/10 hover:border-emerald-500/40 transition h-full">
                      <div className="aspect-[16/9] overflow-hidden bg-black">
                        <img src={t.hero} alt={t.title} loading="lazy" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
                      </div>
                      <div className="p-4">
                        <Badge variant="outline" className="text-[9px] uppercase tracking-widest mb-2">{t.level}</Badge>
                        <h3 className="text-sm font-semibold group-hover:text-emerald-300 transition-colors leading-snug">{t.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.tagline}</p>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
             </section>

            {/* Courses vs Quick Reads — removes the "why are there two?" confusion */}
            <section className="mb-14" aria-label="How this page is organised">
              <div className="grid md:grid-cols-2 gap-4">
                {FORMAT_GUIDE.map((f) => (
                  <div key={f.label} className="p-5 rounded-2xl border border-white/10 bg-white/[0.02]">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-bold text-foreground">{f.label}</span>
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{f.where}</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.detail}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">Same material, two formats — the courses go deeper and track your progress; the quick reads below are self-contained. Educational simulation only — not financial advice.</p>
            </section>

            {/* Country guides */}
            <section className="mb-14" aria-label="Country guides">
              <h2 className="text-2xl font-bold mb-3">Learn trading in your country</h2>
              <p className="text-sm text-muted-foreground mb-4">Local regulator, exchange and student angle for five focus markets.</p>
              <div className="flex flex-wrap gap-2">
                {COUNTRY_GUIDES.map((c) => (
                  <Link key={c.slug} to={`/learn/country/${c.slug}`} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/10 text-sm hover:border-emerald-500/30 transition">
                    <span aria-hidden>{c.flag}</span> {c.country}
                  </Link>
                ))}
              </div>
            </section>

            {/* Roadmap teaser (not in navigation, surfaced here + homepage) */}
            <Link
              to="/roadmap"
              className="group block mb-8 relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-500/10 via-background/40 to-fuchsia-500/10 backdrop-blur-xl p-5 hover:border-emerald-500/40 transition"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-emerald-400 mb-1">✨ What's next</div>
                  <p className="text-sm font-medium">Courses and optional sign-in are live. See planned hypothetical scenario tools on the roadmap.</p>
                </div>
                <ChevronRight className="w-5 h-5 text-emerald-400 group-hover:translate-x-1 transition" />
              </div>
            </Link>

            {/* Premium hero */}
            <div
              className="relative mb-16 overflow-hidden rounded-[32px] border border-white/[0.08] p-10 md:p-16 text-center animate-fade-in"
              style={{
                ...({
                  "--foreground": "220 15% 93%",
                  "--muted-foreground": "220 14% 68%",
                  "--primary": "168 100% 50%",
                } as CSSProperties),
                backgroundColor: "hsl(0 0% 4%)",
                backgroundImage:
                  "linear-gradient(140deg, hsl(168 100% 50% / 0.06) 0%, hsl(0 0% 6% / 0.85) 50%, hsl(280 60% 55% / 0.05) 100%)",
                backdropFilter: "blur(28px) saturate(160%)",
                boxShadow: "0 24px 80px -20px hsl(0 0% 0% / 0.6), inset 0 1px 0 0 hsl(0 0% 100% / 0.06)",
              }}
            >
              <div
                aria-hidden
                className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px"
                style={{ background: "linear-gradient(90deg, transparent, hsl(168 100% 50% / 0.5), transparent)" }}
              />
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/30 mb-6 backdrop-blur-xl">
                <GraduationCap className="w-3.5 h-3.5 text-primary" />
                <span className="text-[11px] font-bold text-primary uppercase tracking-[0.2em]">Structured Learning · 100% Free</span>
              </div>
              <h1
                className="text-4xl md:text-6xl font-bold mb-6 tracking-tight leading-[1.05]"
                style={{
                  background: "linear-gradient(135deg, hsl(220 15% 98%) 0%, hsl(168 70% 75%) 50%, hsl(220 15% 85%) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Learn Trading — From Zero to Confident
              </h1>
              <p className="text-base md:text-lg text-foreground/70 max-w-2xl mx-auto leading-relaxed mb-6">
                Explore structured courses and shorter explanations. Practice supported spot instruments with virtual funds; options, futures and unsupported order types are conceptual exercises.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-foreground/60">
                <span className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08]">⚡ {tracks.length} available courses · {lessons.length} quick reads</span>
                <span className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08]">📚 21 wiki terms</span>
                <span className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08]">🎯 Daily challenge</span>
                <span className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08]">💸 $100K virtual cash</span>
              </div>
            </div>

            {/* Learning Path Overview */}
            <section className="mb-16" aria-label="Learning path">
              <div className="flex items-center gap-3 mb-6">
                <GraduationCap className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-bold">Quick Reads — Your Learning Path</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {LEARNING_PATH.map((step, i) => (
                  <div key={step.tier} className={`relative p-5 rounded-2xl border ${step.borderColor} ${step.bgColor} backdrop-blur-sm`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs font-bold uppercase tracking-wider ${step.color}`}>Step {i + 1}</span>
                      <span className={`text-sm font-semibold ${step.color}`}>{step.label}</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.tagline}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Follow the path below or jump to any quick read that fits your level. Want the full, progress-tracked version instead? <Link to="/courses" className="text-emerald-400 hover:underline">Take a course</Link>.</p>
            </section>

            {/* Start Here CTA */}
            <div className="mb-16 p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex flex-col sm:flex-row items-center gap-4" style={{ backdropFilter: "blur(12px)" }}>
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-1">New to trading?</h3>
                <p className="text-sm text-muted-foreground">Start with Quick Read 1 — it covers everything you need to place your first simulated trade.</p>
              </div>
                <Button className="bg-primary hover:bg-primary/90 !text-black px-6 py-3 rounded-xl font-bold whitespace-nowrap shadow-[0_0_24px_hsl(168_100%_50%/0.3)]" asChild>
<Link to="/learn/1">
                  Start Quick Read 1 <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
</Button>
            </div>

            {/* Featured Guides */}
            <div className="mb-20">
              <h2 className="text-2xl font-bold mb-3 flex items-center gap-3">
                <BookOpen className="w-6 h-6 text-primary" /> Featured Guides
              </h2>
              <p className="text-sm text-muted-foreground mb-6">In-depth articles on essential trading topics — read at your own pace.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {LEARN_ARTICLES.map((article) => (
                  <Link key={article.slug} to={`/learn/article/${article.slug}`} className="group bg-white/[0.02] border border-white/[0.08] rounded-2xl p-6 hover:border-primary/30 transition-all duration-300 hover:scale-[1.02]" style={{ backdropFilter: "blur(12px)" }}>
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{article.readTime}</span>
                    </div>
                    <h3 className="text-base font-bold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">{article.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{article.summary}</p>
                    <span className="text-sm text-primary font-semibold flex items-center gap-1">Read Article <ArrowRight className="w-4 h-4" /></span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Market themes — onClick replaced with Link */}
            <div className="mb-20">
              <h2 className="text-2xl font-bold mb-3 flex items-center gap-3"><TrendingUp className="w-6 h-6 text-primary" /> Market Themes to Explore</h2>
              <p className="text-sm text-muted-foreground mb-6">Explore practice tools and learning topics. Each card describes its destination.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {trendingTopics.map((topic, index) => {
                  const Icon = topic.icon;
                  return (
                    <Link key={topic.id} to={topic.href} className="block" style={{ animationDelay: `${index * 100}ms` }}>
                      <Card className="group h-full cursor-pointer p-6 bento-card hover:border-primary/30 transition-all duration-300">
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"><Icon className="w-6 h-6 text-primary" /></div>
                          <Badge variant="secondary" className="bg-primary/10 text-primary border-0 text-xs">{topic.badge}</Badge>
                        </div>
                        <h3 className="text-xl font-bold mb-1 group-hover:text-primary transition-colors">{topic.title}</h3>
                        <p className="text-sm text-primary mb-3">{topic.subtitle}</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">{topic.description}</p>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Core Courses — FIXED: onClick replaced with Link */}
            {LEARNING_PATH.map((pathStep) => {
              const tierLessons = lessons.filter((l) => l.tier === pathStep.tier);
              if (tierLessons.length === 0) return null;
              return (
                <section key={pathStep.tier} className="mb-16" aria-label={`${pathStep.label} quick reads`}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`text-xs font-bold uppercase tracking-wider ${pathStep.color}`}>{pathStep.label}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-6">{pathStep.tagline}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {tierLessons.map((lesson) => {
                      const Icon = lesson.icon;
                      return (
                        <Link key={lesson.id} to={`/learn/${lesson.id}`} className="block">
                          <Card className="group cursor-pointer overflow-hidden border-0 bg-card/50 backdrop-blur-xl hover:shadow-2xl transition-all duration-500 h-full">
                            <div className="relative h-48 overflow-hidden">
                              <img src={lesson.image} alt={`${lesson.title} course - TradeHQ`} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
                              <div className="absolute top-4 left-4 flex items-center gap-2">
                                <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm border-0 text-xs px-3 py-1">{lesson.category}</Badge>
                                <Badge variant="outline" className={`text-xs px-2 py-0.5 ${difficultyColors[lesson.difficulty]}`}>{lesson.difficulty}</Badge>
                              </div>
                            </div>
                            <div className="p-6">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Icon className="w-5 h-5 text-primary" /></div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-lg font-bold group-hover:text-primary transition-colors truncate">{lesson.title}</h3>
                                  <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> {lesson.readTime}</span>
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{lesson.description}</p>
                              <ul className="space-y-2 mb-4">
                                {lesson.content.slice(0, 3).map((item, i) => (
                                  <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                                    <div className="w-1 h-1 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                              <div className="flex items-center gap-2 text-primary text-sm font-semibold group-hover:gap-3 transition-all">
                                <span>Read now</span><ArrowRight className="w-4 h-4" />
                              </div>
                            </div>
                          </Card>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              );
            })}

            {/* Trading Wiki */}
            <section aria-label="Trading Wiki Glossary" className="mb-20">
              <h2 className="text-2xl font-bold mb-3 flex items-center gap-3">
                <BookOpen className="w-6 h-6 text-primary" /> Trading Wiki — Key Concepts
              </h2>
              <p className="text-sm text-muted-foreground mb-6">Understand the terms that matter. Each entry explains a concept with examples and context so you can recognize it in real markets.</p>
              <div className="flex flex-wrap gap-2">
                {WIKI_TERMS.map(term => (
                  <Link key={term.slug} to={`/wiki/${term.slug}`} className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-full bg-primary/5 border border-primary/15 text-primary/80 hover:text-primary hover:bg-primary/10 hover:border-primary/30 transition-all duration-200">
                    {term.label}
                  </Link>
                ))}
              </div>
            </section>

            {/* Market Sectors */}
            <section aria-label="Market Sectors" className="mb-20">
              <h2 className="text-2xl font-bold mb-3 flex items-center gap-3">
                <TrendingUp className="w-6 h-6 text-primary" /> Explore by Market Sector
              </h2>
              <p className="text-sm text-muted-foreground mb-6">Browse assets grouped by sector to spot opportunities and understand how different parts of the market move.</p>
              <div className="flex flex-wrap gap-3">
                {SECTORS.map(sector => (
                  <Link key={sector.id} to={`/sectors/${sector.id}`} className="inline-flex items-center px-5 py-2.5 text-sm font-semibold rounded-xl bg-card border border-border hover:border-primary/30 hover:bg-primary/5 transition-all duration-200">
                    {sector.label} →
                  </Link>
                ))}
              </div>
            </section>

            {/* CTA */}
            <Card className="p-12 bg-gradient-to-br from-primary/5 via-background to-background border-primary/10 backdrop-blur-xl">
              <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-4xl font-bold mb-6">Ready to Start Trading?</h2>
                <p className="text-xl text-muted-foreground mb-8 leading-relaxed">Practice these strategies with your $100,000 virtual cash.</p>
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg rounded-xl min-h-[48px] font-semibold" asChild>
<Link to="/trade">
                    Start Trading Free <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
</Button>
              </div>
            </Card>

            <SEOSection
              path="/learn"
              faqHeading="Learning Center"
              breadcrumbs={[{ label: "Learn" }]}
              hideVisibleBreadcrumb
              faqs={[
                {
                  question: "What can I learn on TradeHQ?",
                  answer:
                    "Structured beginner-to-intermediate guides on technical analysis, risk management, trading psychology, candlestick patterns, market mechanics and asset-specific strategies for stocks, crypto, ETFs, forex and commodities.",
                },
                {
                  question: "Is the TradeHQ Learning Center free?",
                  answer:
                    "Yes — every article, glossary entry and lesson is 100% free with no signup required. (Educational simulation only — not financial advice.)",
                },
                {
                  question: "What's the difference between an article and a lesson?",
                  answer:
                    "Articles explain individual concepts. Lessons use multiple sections and quizzes; supported spot instruments can be explored in the simulator, while derivatives and unsupported orders remain conceptual.",
                },
                {
                  question: "Where should a complete beginner start?",
                  answer:
                    "Start with 'What Is Paper Trading' and 'How to Read a Stock Chart', then explore the Trading Glossary above before opening your $100K virtual portfolio on the simulator.",
                },
              ]}
            />

          </div>
        </main>
        <MegaFooter />
      </div>
    </>
  );
}
