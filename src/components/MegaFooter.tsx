import type { CSSProperties } from "react";
import { Link, useLocation } from "react-router-dom";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { EducationalDisclaimer } from "@/components/EducationalDisclaimer";
import {
  TrendingUp,
  BarChart3,
  Wallet,
  GraduationCap,
  BookOpen,
  Bot,
  Cpu,
  Coins,
  LineChart,
  Globe,
  Gem,
  Twitter,
  Linkedin,
  Github,
  Shield,
  Award,
  CheckCircle2,
  Info,
  Mail
} from "lucide-react";
import { BrandMark } from "@/components/brand/BrandMark";
import { tradingGlossary } from "@/lib/tradingGlossary";
import { AdvertisingPrivacyChoices } from "@/components/AdvertisingPrivacyChoices";

/**
 * MegaFooter - Premium Multi-Column SEO Footer
 */
export function MegaFooter() {
  const { pathname } = useLocation();
  // Home and /newsletter already provide a prominent signup in their content.
  // The shared footer must not render a second form on those pages.
  const hasPrimaryNewsletterSignup = pathname === "/" || pathname === "/newsletter";
  const assetCategories = {
    crypto: {
      title: "Top Crypto",
      icon: Coins,
      assets: [
        { symbol: "BTC", name: "Bitcoin", path: "/trade/btc" },
        { symbol: "ETH", name: "Ethereum", path: "/trade/eth" },
        { symbol: "SOL", name: "Solana", path: "/trade/sol" },
        { symbol: "XRP", name: "XRP", path: "/trade/xrp" },
        { symbol: "BNB", name: "BNB", path: "/trade/bnb" },
        { symbol: "ADA", name: "Cardano", path: "/trade/ada" },
      ]
    },
    stocks: {
      title: "AI & Tech Stocks",
      icon: Cpu,
      assets: [
        { symbol: "NVDA", name: "NVIDIA", path: "/trade/nvda" },
        { symbol: "MSFT", name: "Microsoft", path: "/trade/msft" },
        { symbol: "GOOGL", name: "Alphabet", path: "/trade/googl" },
        { symbol: "AAPL", name: "Apple", path: "/trade/aapl" },
        { symbol: "META", name: "Meta", path: "/trade/meta" },
        { symbol: "AMZN", name: "Amazon", path: "/trade/amzn" },
      ]
    },
    etfs: {
      title: "Popular ETFs",
      icon: LineChart,
      assets: [
        { symbol: "SPY", name: "S&P 500 ETF", path: "/trade/spy" },
        { symbol: "QQQ", name: "Nasdaq ETF", path: "/trade/qqq" },
        { symbol: "DIA", name: "Dow Jones ETF", path: "/trade/dia" },
        { symbol: "ARKK", name: "ARK Innovation", path: "/trade/arkk" },
      ]
    },
    forex: {
      title: "Forex Pairs",
      icon: Globe,
      assets: [
        { symbol: "EUR/USD", name: "Euro/Dollar", path: "/trade/eurusd" },
        { symbol: "GBP/USD", name: "Pound/Dollar", path: "/trade/gbpusd" },
        { symbol: "USD/JPY", name: "Dollar/Yen", path: "/trade/usdjpy" },
      ]
    },
    commodities: {
      title: "Commodities",
      icon: Gem,
      assets: [
        { symbol: "XAU", name: "Gold", path: "/trade/gold" },
        { symbol: "XAG", name: "Silver", path: "/trade/silver" },
        { symbol: "WTI", name: "Crude Oil", path: "/trade/oil" },
      ]
    }
  };

  const platformLinks = [
    { to: "/trade", label: "Trading Simulator", icon: TrendingUp },
    { to: "/markets", label: "Markets Hub", icon: BarChart3 },
    { to: "/portfolio", label: "Portfolio Tracker", icon: Wallet },
  ];

  const learnLinks = [
    { to: "/learn", label: "All Courses", icon: GraduationCap },
    { to: "/courses", label: "Structured Tracks", icon: Award },
    { to: "/courses/options-trading-fundamentals", label: "Options Fundamentals", icon: BookOpen },
    { to: "/courses/futures-and-derivatives", label: "Futures & Derivatives", icon: BookOpen },
    { to: "/courses/macro-reading-for-traders", label: "Macro Reading", icon: BookOpen },
    { to: "/courses/trading-psychology-mastery", label: "Trading Psychology", icon: BookOpen },
    { to: "/learn-trading-guide", label: "Trading Guide", icon: BookOpen },
    { to: "/ai-mentor", label: "AI Mentor", icon: Bot },
  ];

  const companyLinks = [
    { to: "/about", label: "About", icon: Info },
    { to: "/contact", label: "Contact", icon: Mail },
    { to: "/privacy", label: "Privacy Policy", icon: Shield },
    { to: "/terms", label: "Terms of Service", icon: BookOpen },
    { to: "/about#disclaimer", label: "Disclaimer", icon: Info },
  ];

  return (
    <footer
      className="border-t border-white/[0.04] bg-[hsl(0_0%_2%)]"
      // This footer keeps its dark surface in both themes; keep its text palette dark-theme too.
      style={{
        "--foreground": "220 15% 93%",
        "--muted-foreground": "220 14% 68%",
        "--primary": "168 100% 50%",
      } as CSSProperties}
    >
      <div className="container mx-auto px-6 py-16">
        {/* Asset Categories Grid */}
        <div className="mb-16">
          <h2 className="text-lg font-bold text-foreground mb-8 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Trade All Markets
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
            {Object.entries(assetCategories).map(([key, category]) => (
              <div key={key}>
                <h3 className="text-xs font-bold text-muted-foreground mb-4 flex items-center gap-2 uppercase tracking-[0.15em]">
                  <category.icon className="w-3.5 h-3.5 text-primary" />
                  {category.title}
                </h3>
                <ul className="space-y-2">
                  {category.assets.map((asset) => (
                    <li key={asset.symbol}>
                      <Link
                        to={asset.path}
                        className="text-sm text-foreground/60 hover:text-primary transition-colors duration-200 flex items-center gap-2 group"
                      >
                        <span className="font-mono text-xs text-primary/60 group-hover:text-primary">
                          {asset.symbol}
                        </span>
                        <span className="hidden lg:inline text-muted-foreground group-hover:text-foreground">
                          {asset.name}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Trading Glossary Links */}
        <div className="mb-12">
          <h2 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Trading Glossary
          </h2>
          <div className="flex flex-wrap gap-2">
            {tradingGlossary.map((term) => (
              <Link
                key={term.slug}
                to={`/wiki/${term.slug}`}
                className="text-xs text-foreground/50 hover:text-primary bg-white/[0.02] border border-white/[0.04] px-3 py-1.5 rounded-lg transition-colors duration-200"
              >
                {term.term}
              </Link>
            ))}
          </div>
        </div>

        <div className="border-t border-white/[0.04] mb-12" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <Link to="/" className="inline-flex mb-4 group active:scale-[0.97] transition-transform" aria-label="TradeHQ home">
              <BrandMark size="lg" />
            </Link>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              An educational paper trading simulator. Practice with $100K virtual capital
              and study stocks, crypto, forex, and commodities without spending real money.
            </p>

            <Link to="/contact" className="text-sm text-primary hover:underline">Contact TradeHQ</Link>
          </div>

          {/* Platform Links */}
          <div>
            <h3 className="text-xs font-bold text-foreground mb-4 uppercase tracking-[0.15em]">Platform</h3>
            <ul className="space-y-3">
              {platformLinks.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center gap-2">
                    <link.icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <AdvertisingPrivacyChoices className="mt-4 text-sm text-muted-foreground hover:text-primary transition-colors duration-200" />
          </div>

          {/* Learn Links */}
          <div>
            <h3 className="text-xs font-bold text-foreground mb-4 uppercase tracking-[0.15em]">Learn</h3>
            <ul className="space-y-3">
              {learnLinks.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center gap-2">
                    <link.icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <h3 className="text-xs font-bold text-foreground mt-6 mb-4 uppercase tracking-[0.15em]">Company</h3>
            <ul className="space-y-3">
              {companyLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center gap-2"
                  >
                    <link.icon className="w-4 h-4" aria-hidden="true" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Trust Signals */}
          <div>
            <h3 className="text-xs font-bold text-foreground mb-4 uppercase tracking-[0.15em]">Trust & Security</h3>
            <div className="space-y-4">
              {[
                { icon: Shield, color: "text-primary", bg: "bg-primary/10", title: "Virtual Cash Only", sub: "No real money is traded" },
                { icon: CheckCircle2, color: "text-profit", bg: "bg-profit/10", title: "Educational Simulator", sub: "Practice trading skills" },
                { icon: Award, color: "text-secondary", bg: "bg-secondary/10", title: "170 Assets", sub: "Stocks, crypto, ETFs, forex" },
              ].map((item) => (
                <div key={item.title} className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${item.bg} flex items-center justify-center`}>
                    <item.icon className={`w-5 h-5 ${item.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Exactly one newsletter form per page. Pages with a lead signup show contact details here instead. */}
      <div className="border-t border-white/[0.04]">
        <div className="container mx-auto px-6 py-10">
          <div className="max-w-xl mx-auto">
            {hasPrimaryNewsletterSignup ? (
              <section aria-label="Contact TradeHQ" className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center space-y-3">
                <h2 className="text-lg font-semibold text-foreground">Questions, feedback or partnerships?</h2>
                <p className="text-sm text-muted-foreground">Reach the TradeHQ team directly. You'll find contact details and a ready-to-send message on our contact page.</p>
                <div className="flex flex-wrap gap-x-5 gap-y-3 justify-center items-center text-sm">
                  <Link to="/contact" className="text-primary hover:underline font-semibold">Contact TradeHQ</Link>
                  <a href="mailto:anugaweerasinghe1@gmail.com" className="text-foreground/80 hover:text-primary hover:underline break-all">anugaweerasinghe1@gmail.com</a>
                </div>
              </section>
            ) : (
              <NewsletterSignup />
            )}
          </div>
        </div>
      </div>
      <div className="border-t border-white/[0.04] bg-[hsl(0_0%_1.5%)]">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Link to="/privacy" className="text-xs text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link>
            <span className="text-muted-foreground/20">|</span>
            <Link to="/terms" className="text-xs text-muted-foreground hover:text-primary transition-colors">Terms of Service</Link>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] max-w-4xl mx-auto mb-4">
            <EducationalDisclaimer variant="footer" className="!p-0 !bg-transparent !border-0" />
          </div>

          <p className="text-xs text-muted-foreground/60 text-center">
            © {new Date().getFullYear()} TradeHQ · Built by Anuga Weerasinghe · Educational Use Only
          </p>
        </div>
      </div>
    </footer>
  );
}
