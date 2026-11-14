import { Link } from "react-router-dom";
import { BarChart3, Wallet, TrendingUp, Briefcase, GraduationCap, BookOpen, Bot, Home } from "lucide-react";

/**
 * QuickLinksFooter - SEO Internal Linking Component
 * Provides crawlable links to key pages for better Google indexing.
 * Should be included on every page.
 */
export function QuickLinksFooter() {
  const quickLinks = [
    { to: "/", label: "Home", icon: Home },
    { to: "/trade", label: "Trade Simulator", icon: TrendingUp },
    { to: "/markets", label: "Markets Hub", icon: BarChart3 },
    { to: "/portfolio", label: "Portfolio Tracker", icon: Wallet },
    { to: "/learn", label: "Learning Center", icon: GraduationCap },
    { to: "/learn-trading-guide", label: "Trading Guide", icon: BookOpen },
    { to: "/ai-mentor", label: "Learning Mentor", icon: Bot },
    { to: "/leaderboard", label: "Leaderboard", icon: TrendingUp },
    { to: "/sectors/crypto-defi", label: "Crypto & DeFi", icon: BarChart3 },
    { to: "/wiki/short-squeeze", label: "Trading Glossary", icon: BookOpen },
  ];

  return (
    <nav 
      aria-label="Quick navigation" 
      className="mt-12 border-t border-border/50 pt-8"
    >
      <div className="container mx-auto px-6">
        <h2 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wide">
          Quick Links
        </h2>
        <ul className="flex flex-wrap gap-3">
          {quickLinks.map((link) => (
            <li key={link.to}>
              <Link
                to={link.to}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-muted/50 text-foreground hover:bg-primary/10 hover:text-primary transition-all duration-200"
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
