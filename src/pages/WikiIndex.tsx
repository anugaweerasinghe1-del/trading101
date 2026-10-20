import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Navigation } from "@/components/Navigation";
import { MegaFooter } from "@/components/MegaFooter";
import { Card } from "@/components/ui/card";
import { EducationalDisclaimer } from "@/components/EducationalDisclaimer";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { tradingGlossary } from "@/lib/tradingGlossary";
import { HOWTO_ASSETS, SITE_DOMAIN } from "@/lib/seoData";

export default function WikiIndex() {
  const title = "Trading Glossary — Every Term Explained | TradeHQ Wiki";
  const description =
    "A complete plain-language trading glossary: every term on TradeHQ in one browsable index, from VWAP and drawdown to order blocks and short squeezes. Educational only.";

  const categories = Array.from(new Set(tradingGlossary.map((t) => t.category))).sort();

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={`${SITE_DOMAIN}/wiki`} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={`${SITE_DOMAIN}/wiki`} />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "DefinedTermSet",
            name: "TradeHQ Trading Glossary",
            url: `${SITE_DOMAIN}/wiki`,
            hasDefinedTerm: tradingGlossary.slice(0, 50).map((t) => ({
              "@type": "DefinedTerm",
              name: t.term,
              url: `${SITE_DOMAIN}/wiki/${t.slug}`,
            })),
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        <Navigation />
        <main className="flex-1 container mx-auto px-4 pt-28 pb-20 max-w-5xl">
          <Breadcrumbs items={[{ label: "Learning", href: "/learn" }, { label: "Glossary" }]} />

          <header className="my-8">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Trading Glossary</h1>
            <p className="mt-4 text-muted-foreground max-w-3xl leading-relaxed">
              Browse trading concepts in plain language with examples, references and limitations.
              Some mechanisms, including derivatives and unsupported orders, are conceptual rather than executable in TradeHQ. {tradingGlossary.length} entries, grouped by category — each one explains the
              mechanism, gives an example, and states where the idea breaks down rather than only where
              it works.
            </p>
            <p className="mt-3 text-xs text-muted-foreground italic">
              (Educational simulation only — not financial advice.)
            </p>
          </header>

          {categories.map((cat) => (
            <section key={cat} className="mb-10">
              <h2 className="text-xl font-semibold mb-4">{cat}</h2>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                {tradingGlossary
                  .filter((t) => t.category === cat)
                  .map((t) => (
                    <Link key={t.slug} to={`/wiki/${t.slug}`}>
                      <Card className="p-4 h-full bg-white/[0.02] border-white/10 hover:border-emerald-500/40 transition">
                        <p className="text-sm font-semibold">{t.term}</p>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          {t.difficulty} · {t.readTime}
                        </p>
                      </Card>
                    </Link>
                  ))}
              </div>
            </section>
          ))}

          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">Step-by-step asset guides</h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
              {HOWTO_ASSETS.map((a) => (
                <Link key={a.symbol} to={`/how-to-trade/${a.symbol}`}>
                  <Card className="p-4 h-full bg-white/[0.02] border-white/10 hover:border-emerald-500/40 transition">
                    <p className="text-sm font-semibold">How to trade {a.fullName}</p>
                    <p className="text-[11px] text-muted-foreground mt-1 uppercase">{a.type}</p>
                  </Card>
                </Link>
              ))}
            </div>
          </section>

          <EducationalDisclaimer variant="footer" />
        </main>
        <MegaFooter />
      </div>
    </>
  );
}
