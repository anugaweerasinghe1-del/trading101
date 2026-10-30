import NotFound from "./NotFound";
import { tradeRouteForSymbol } from "@/lib/assets";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Navigation } from "@/components/Navigation";
import { MegaFooter } from "@/components/MegaFooter";
import { SEOSection } from "@/components/SEOSection";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { COMPARE_PAIRS, SITE_DOMAIN } from "@/lib/seoData";

export default function Compare() {
  const { slug } = useParams<{ slug: string }>();
  const pair = COMPARE_PAIRS.find((p) => p.slug === slug);
  if (!pair) return <NotFound />;

  const title = `${pair.a.name} vs ${pair.b.name} — Key Differences Explained | TradeHQ`;
  const description = `${pair.a.name} vs ${pair.b.name}: compare instrument structure, risks and research questions, with a specific educational worksheet and sources. TradeHQ uses virtual funds and simplified execution.`;
  const url = `${SITE_DOMAIN}/compare/${pair.slug}`;
  const aRoute = tradeRouteForSymbol(pair.a.symbol);
  const bRoute = tradeRouteForSymbol(pair.b.symbol);
  const categoryComparison = aRoute === "/trade" || bRoute === "/trade";

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={url} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={url} />
        <meta property="og:type" content="article" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: `${pair.a.name} vs ${pair.b.name}`,
          description,
          author: { "@type": "Organization", name: "TradeHQ" },
          publisher: { "@type": "Organization", name: "TradeHQ" },
          mainEntityOfPage: url,
        })}</script>
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        <Navigation />
        <main data-publisher-notes={`/compare/${pair.slug}`} className="[.light_&_.text-emerald-400]:text-emerald-800 [.light_&_.text-rose-400]:text-rose-800 flex-1 container mx-auto px-4 pt-24 pb-12 max-w-5xl">
          <header className="mb-10 text-center">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Side-by-side comparison</p>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-rose-400 bg-clip-text text-transparent [.light_&]:bg-none [.light_&]:text-foreground">
              {pair.a.name} vs {pair.b.name}
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">{pair.intro}</p>
          </header>
          <p className="text-sm text-muted-foreground mb-8">
            Published by TradeHQ, created by Anuga Weerasinghe. <Link to="/about" className="underline">Publisher background and editorial approach</Link>. No independent professional review is claimed; any recorded source-check scope appears on the page.
          </p>
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <Card className="p-6 border-emerald-500/20">
              <div className="text-xs text-emerald-400 mb-1">{pair.a.tag}</div>
              <div className="text-2xl font-bold">{pair.a.name} <span className="text-muted-foreground text-base">({pair.a.symbol})</span></div>
              <Button variant="outline" size="sm" className="mt-4" asChild>
<Link to={aRoute}>{aRoute === "/trade" ? "Browse practice instruments" : `Practise ${pair.a.symbol}`} <ArrowRight className="ml-2 h-3 w-3" /></Link>
</Button>
            </Card>
            <Card className="p-6 border-rose-500/20">
              <div className="text-xs text-rose-400 mb-1">{pair.b.tag}</div>
              <div className="text-2xl font-bold">{pair.b.name} <span className="text-muted-foreground text-base">({pair.b.symbol})</span></div>
              <Button variant="outline" size="sm" className="mt-4" asChild>
<Link to={bRoute}>{bRoute === "/trade" ? "Browse practice instruments" : `Practise ${pair.b.symbol}`} <ArrowRight className="ml-2 h-3 w-3" /></Link>
</Button>
            </Card>
          </div>

          <Card className="p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Key differences</h2>
            <ul className="space-y-3">
              {pair.bullets.map((b, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-6 mb-8 bg-gradient-to-br from-emerald-500/5 to-rose-500/5 border-white/10">
            <h2 className="text-xl font-semibold mb-2">What the comparison shows</h2>
            <p className="text-base text-muted-foreground">{pair.verdict}</p>
            <p className="mt-3 text-xs text-muted-foreground/70 italic">(Educational simulation only — not financial advice.)</p>
          </Card>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              What actually separates {pair.a.name} and {pair.b.name}
            </h2>
            <div className="space-y-4">
              {pair.deepDive.map((p, i) => (
                <p key={i} className="text-sm leading-relaxed text-muted-foreground">{p}</p>
              ))}
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Common mistakes with this comparison</h2>
            <ul className="space-y-3">
              {pair.mistakes.map((m, i) => (
                <li key={i} className="text-sm leading-relaxed text-muted-foreground flex gap-3">
                  <span className="shrink-0 mt-1 h-1.5 w-1.5 rounded-full bg-rose-400" aria-hidden />
                  <span>{m}</span>
                </li>
              ))}
            </ul>
          </section>

          <Card className="p-6 mb-8">
            <h2 className="text-xl font-semibold mb-2">How to compare a practice worksheet</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {pair.worksheet}
            </p>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              Equal dollar values do not establish equal risk. Record unfavorable as well as favorable
              cases. Provider observations and generated history are different; simulated portfolio
              metrics do not establish real-account drawdowns or suitability.
            </p>
          </Card>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-3">Sources for your research</h2>
            <p className="text-sm text-muted-foreground mb-3">Check the source date, reporting period and product definitions. These references explain structures and research inputs; they do not validate a price forecast.</p>
            <ul className="space-y-2 text-sm">
              {pair.sources.map((source) => (
                <li key={source.href}><a href={source.href} className="text-emerald-400 underline underline-offset-4">{source.label}</a></li>
              ))}
            </ul>
            <nav aria-label="Comparison learning links" className="mt-4 flex flex-wrap gap-4 text-sm">
              <Link to="/compare" className="underline">All comparisons</Link>
              <Link to="/markets" className="underline">Browse markets</Link>
              <Link to="/trade" className="underline">Practice desk</Link>
            </nav>
          </section>

          <p className="text-sm text-muted-foreground mb-8">
            Educational simulation only — not financial advice. Virtual money; no brokerage transactions. Quotes may be delayed, cached, unavailable or fixed simulator values; generated charts are labelled separately. Practice results do not predict investment outcomes.
          </p>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">More comparisons</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {COMPARE_PAIRS.filter((p) => p.slug !== pair.slug).slice(0, 6).map((p) => (
                <Link key={p.slug} to={`/compare/${p.slug}`} className="block p-3 rounded-lg border border-white/10 hover:border-emerald-500/40 transition text-sm">
                  {p.a.name} vs {p.b.name}
                </Link>
              ))}
            </div>
          </section>

          <SEOSection
            path={`/compare/${pair.slug}`}
            breadcrumbs={[
              { label: "Compare", href: "/compare" },
              { label: `${pair.a.name} vs ${pair.b.name}` },
            ]}
            faqs={[
              { question: `Is ${pair.a.name} better than ${pair.b.name}?`, answer: pair.verdict },
              { question: `What can I practise from this comparison on TradeHQ?`, answer: categoryComparison
                ? `Forex and equities are categories, not ticker symbols. Browse the practice terminal to choose supported instruments such as EUR/USD and AAPL. Virtual spot exercises use simplified data and fills; they do not reproduce every real product or execution condition.`
                : `The terminal has practice routes for ${pair.a.symbol} and ${pair.b.symbol} with virtual funds. Those named examples do not represent every product in their categories. Guest practice is available; TradeHQ does not deliver physical assets, stake tokens, place resting stop orders or open short positions.` },
              { question: `How should I compare volatility for ${pair.a.name} and ${pair.b.name}?`, answer: `Specify the exact instruments, matching dates, observation interval and return calculation before comparing variability. A ranking can change with the sample. Generated practice history does not establish historical market volatility, and equal dollar values do not imply equal risk.` },
            ]}
            faqHeading="Comparison FAQ"
          />
        </main>
        <MegaFooter />
      </div>
    </>
  );
}

export function CompareIndex() {
  const title = "Asset Comparisons — Crypto, Stocks & ETFs Side-by-Side | TradeHQ";
  const description = "Compare Bitcoin vs Ethereum, Tesla vs Nvidia, stocks vs crypto and more. Side-by-side breakdowns of returns, risk and use cases. Compare both in a virtual-money simulation.";
  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={`${SITE_DOMAIN}/compare`} />
      </Helmet>
      <div className="min-h-screen bg-background flex flex-col">
        <Navigation />
        <main className="[.light_&_.text-emerald-400]:text-emerald-800 [.light_&_.text-rose-400]:text-rose-800 flex-1 container mx-auto px-4 pt-24 pb-12 max-w-5xl">
          <h1 className="text-4xl font-bold mb-2">Asset Comparisons</h1>
          <p className="text-muted-foreground mb-8">Pick a head-to-head. Each comparison is built around real differences in returns, risk and use case.</p>

          <section className="mb-10 max-w-3xl space-y-4">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Start by identifying the exposure: a company share, fund, currency pair and network token
              have different structures. The pages below compare those structures and offer specific
              research questions, source links and hypothetical worksheets. A category such as forex
              or stocks is broader than the named examples available in the practice terminal.
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              For a numerical comparison, state matching dates, data sources, calculation methods and
              costs. Equal dollar allocations do not establish equal risk, and a past volatility or
              drawdown estimate is not a guaranteed future outcome. Separate documented market
              observations from TradeHQ's generated history and simplified fills.
            </p>
            <p className="text-xs text-muted-foreground/70 italic">
              (Educational simulation only — not financial advice.)
            </p>
          </section>

          <h2 className="text-xl font-semibold mb-4">All comparisons</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {COMPARE_PAIRS.map((p) => (
              <Link key={p.slug} to={`/compare/${p.slug}`}>
                <Card className="p-6 hover:border-emerald-500/40 transition">
                  <div className="text-xs text-muted-foreground mb-2">{p.a.tag} vs {p.b.tag}</div>
                  <h3 className="text-xl font-bold">{p.a.name} vs {p.b.name}</h3>
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{p.intro}</p>
                </Card>
              </Link>
            ))}
          </div>

          <section className="mt-10 max-w-3xl">
            <h2 className="text-xl font-semibold mb-3">Work through a specific comparison</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Choose a page and follow its worksheet with stated hypothetical inputs. The terminal
              offers supported named instruments and virtual funds; it does not reproduce every
              exposure discussed here. Use the exercise to check units, costs and account arithmetic,
              then consult dated external sources for business or network facts. A month of simulator
              results does not establish a reliable strategy or readiness to trade real money.
            </p>
          </section>
        </main>
        <MegaFooter />
      </div>
    </>
  );
}
