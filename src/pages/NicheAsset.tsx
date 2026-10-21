import { Helmet } from "react-helmet-async";
import { useParams, Link } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { MegaFooter } from "@/components/MegaFooter";
import { getNicheAsset } from "@/lib/nicheData";
import { TrendingUp, BookOpen, AlertTriangle, ArrowRight } from "lucide-react";
import NotFound from "./NotFound";

export default function NicheAsset() {
  const { symbol } = useParams();
  const niche = symbol ? getNicheAsset(symbol) : null;

  if (!niche) {
    return <NotFound />;
  }

  const routeSlug = symbol!.toLowerCase();
  const canonical = `https://www.thetradehq.com/niche/${routeSlug}`;
  const title = `${niche.name} (${niche.symbol}) — Price Drivers & Practice Guide | TradeHQ`;
  const description = `Learn the main factors that can move ${niche.name}, review educational chart concepts, and practise ${niche.symbol} with $100K virtual cash. Data may be simulated or delayed.`;

  // JSON-LD: SoftwareApplication + FAQPage + BreadcrumbList
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": `TradeHQ ${niche.name} Simulator`,
      "applicationCategory": "FinanceApplication",
      "operatingSystem": "Web",
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
      "description": description,
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": niche.faqs.map(faq => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": { "@type": "Answer", "text": faq.answer },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.thetradehq.com/" },
        { "@type": "ListItem", "position": 2, "name": "Markets", "item": "https://www.thetradehq.com/markets" },
        { "@type": "ListItem", "position": 3, "name": niche.name, "item": canonical },
      ],
    },
  ];

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
        <meta name="robots" content="noindex, follow" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        <Navigation />

        <main className="flex-1 container mx-auto px-4 pt-24 pb-12 max-w-4xl space-y-10">
          {/* Breadcrumb */}
          <nav aria-label="breadcrumb" className="text-xs text-muted-foreground flex items-center gap-1">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <span>/</span>
            <Link to="/markets" className="hover:text-foreground transition-colors">Markets</Link>
            <span>/</span>
            <span className="text-foreground font-medium">{niche.symbol}</span>
          </nav>

          {/* Hero */}
          <header className="space-y-4">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight-cyber">
                {niche.name} <span className="text-muted-foreground">({niche.symbol})</span>
              </h1>
              <span className="px-2 py-1 rounded-lg text-xs font-medium bg-primary/10 text-primary capitalize">
                {niche.type}
              </span>
            </div>
            <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl">
              Educational price-driver notes and virtual trading practice for {niche.name}. Use $100K in virtual cash and check the displayed data labels.
            </p>
          </header>

          {/* Key Stats Table */}
          <section>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Key Statistics
            </h2>
            <div className="glass-tactile border-chrome rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left px-5 py-3 text-muted-foreground font-medium">Metric</th>
                    <th className="text-right px-5 py-3 text-muted-foreground font-medium">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {niche.keyStats.map((stat, i) => (
                    <tr key={i} className="border-b border-white/5 last:border-0">
                      <td className="px-5 py-3 text-foreground">{stat.label}</td>
                      <td className="px-5 py-3 text-right font-medium tabular-nums text-foreground">{stat.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Mentor's Take */}
          <section className="glass-tactile border-chrome rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-neon" />
              Mentor's Take — {niche.symbol} Analysis
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {niche.mentorTake}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground/60 pt-2 border-t border-white/5">
              <AlertTriangle className="w-3 h-3" />
              <span>For educational purposes only. Not financial advice.</span>
            </div>
          </section>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to={`/trade/${niche.assetId}`}
              className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all btn-squeeze"
            >
              Practice Trading {niche.symbol}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/learn-trading-guide"
              className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl bg-white/5 border border-white/10 text-foreground font-medium hover:bg-white/10 transition-all"
            >
              Learn Trading Basics
            </Link>
          </div>

          {/* FAQ */}
          <section>
            <h2 className="text-lg font-semibold mb-4">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {niche.faqs.map((faq, i) => (
                <div key={i} className="glass-tactile border-chrome rounded-xl p-5 space-y-2">
                  <h3 className="font-semibold text-sm text-foreground">{faq.question}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </section>
        </main>

        <MegaFooter />
      </div>
    </>
  );
}
