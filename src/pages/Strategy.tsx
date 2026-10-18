import NotFound from "./NotFound";
import { useParams, Link, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Navigation } from "@/components/Navigation";
import { MegaFooter } from "@/components/MegaFooter";
import { SEOSection } from "@/components/SEOSection";
import { AIAnswerBlock } from "@/components/seo/AIAnswerBlock";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, ArrowRight } from "lucide-react";
import { STRATEGIES, SITE_DOMAIN } from "@/lib/seoData";

export default function Strategy() {
  const { slug } = useParams<{ slug: string }>();
  const s = STRATEGIES.find((x) => x.slug === slug);
  if (!s) return <NotFound />;

  const title = `${s.name} Strategy — Examples and Limitations | TradeHQ`;
  const description = `${s.name}: ${s.oneLiner} Example rules, limitations and a hypothetical worked example. Practise it free with $100K virtual cash. (Educational simulation only — not financial advice.)`;
  const url = `${SITE_DOMAIN}/strategy/${s.slug}`;

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
          "@type": "HowTo",
          name: `${s.name} educational worksheet`,
          description: s.oneLiner,
          step: s.steps.map((st, i) => ({ "@type": "HowToStep", position: i + 1, text: st })),
        })}</script>
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        <Navigation />
        <main className="flex-1 container mx-auto px-4 pt-24 pb-12 max-w-4xl">
          <header className="mb-10">
            <p className="text-xs uppercase tracking-widest text-emerald-400 mb-3 flex items-center gap-2"><Target className="h-3 w-3" />Trading strategy</p>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">{s.name}</h1>
            <p className="mt-4 text-lg text-muted-foreground">{s.oneLiner}</p>
            <Link to="/trade"><Button className="mt-6">Practise this strategy <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
          </header>

          <AIAnswerBlock
            question={`What is the ${s.name} trading strategy and does it work?`}
            answer={`${s.name}: ${s.oneLiner} ${s.successRate} Study context: ${s.bestFor} Practise it free on TradeHQ with $100,000 in virtual cash. (Educational simulation only — not financial advice.)`}
            className="mb-6"
          />

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <Card className="p-5 border-emerald-500/20">
              <h3 className="text-sm font-semibold text-emerald-400 mb-2">Study context</h3>
              <p className="text-sm">{s.bestFor}</p>
            </Card>
            <Card className="p-5 border-rose-500/20">
              <h3 className="text-sm font-semibold text-rose-400 mb-2">Limitations</h3>
              <p className="text-sm">{s.worstFor}</p>
            </Card>
          </div>

          <Card className="p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4">Hypothetical study steps</h2>
            <ol className="space-y-4">
              {s.steps.map((step, i) => (
                <li key={i} className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold text-sm">{i + 1}</span>
                  <span className="text-sm pt-1">{step}</span>
                </li>
              ))}
            </ol>
          </Card>

          <Card className="p-6 mb-6">
            <h3 className="text-sm font-semibold mb-2">Worked example</h3>
            <p className="text-sm font-mono bg-black/30 p-3 rounded">{s.example}</p>
          </Card>

          <section className="mb-6 space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-3">Where this method comes from</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">{s.depth.context}</p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-3">Sample and market limitations</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">{s.depth.regime}</p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-3">Interpretation pitfalls</h2>
              <ul className="space-y-3">
                {s.depth.mistakes.map((m, i) => (
                  <li key={i} className="text-sm leading-relaxed text-muted-foreground flex gap-3">
                    <span className="shrink-0 mt-1 h-1.5 w-1.5 rounded-full bg-rose-400" aria-hidden />
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-3">The expectancy maths</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">{s.depth.math}</p>
              <p className="mt-3 text-xs text-muted-foreground/70 italic">
                Figures are illustrative teaching examples, not projections of your results.
                (Educational simulation only — not financial advice.)
              </p>
            </Card>
          </section>

          <Card className="p-5 mb-8 bg-gradient-to-br from-emerald-500/5 to-transparent">
            <h3 className="text-sm font-semibold mb-1">Realistic expectations</h3>
            <p className="text-sm text-muted-foreground">{s.successRate}</p>
            <p className="mt-2 text-xs text-muted-foreground/70 italic">(Educational simulation only — not financial advice.)</p>
          </Card>

          <section className="mb-8" aria-label="Primary references">
            <h2 className="text-xl font-semibold mb-3">References</h2>
            <ul className="list-disc pl-5">{s.sources?.map(source => <li key={source.href}><a className="text-primary underline" href={source.href}>{source.label}</a></li>)}</ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-3">More strategies</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {STRATEGIES.filter((x) => x.slug !== s.slug).map((x) => (
                <Link key={x.slug} to={`/strategy/${x.slug}`} className="text-sm p-3 rounded-lg border border-white/10 hover:border-emerald-500/40">{x.name}</Link>
              ))}
            </div>
          </section>

          <SEOSection
            path={`/strategy/${s.slug}`}
            breadcrumbs={[
              { label: "Strategies", href: "/strategy" },
              { label: s.name },
            ]}
            faqs={[
              { question: `Does ${s.name} actually work?`, answer: s.successRate },
              { question: `What context does this ${s.name} worksheet examine?`, answer: s.bestFor },
              { question: `Can I practise ${s.name} for free?`, answer: `Yes — TradeHQ supplies virtual order and accounting practice. Some ${s.name} calculations require a separate worksheet or data source.` },
            ]}
            faqHeading={`${s.name} FAQ`}
          />
        </main>
        <MegaFooter />
      </div>
    </>
  );
}

export function StrategyIndex() {
  const title = "Trading Strategies — Scalping, Swing, DCA, RSI & More | TradeHQ";
  const description = "Free trading strategy guides: scalping, swing trading, day trading, DCA, RSI, MACD. Example rules, limitations and hypothetical calculations. Practise on a $100K virtual account.";
  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={`${SITE_DOMAIN}/strategy`} />
      </Helmet>
      <div className="min-h-screen bg-background flex flex-col">
        <Navigation />
        <main className="flex-1 container mx-auto px-4 pt-24 pb-12 max-w-5xl">
          <h1 className="text-4xl font-bold mb-2">Trading Strategies</h1>
          <p className="text-muted-foreground mb-8">Compare conceptual methods, assumptions and limitations. Simulation does not establish readiness for real trading.</p>

          <section className="mb-10 space-y-4 max-w-3xl">
            <p className="text-sm leading-relaxed text-muted-foreground">
              These six pages explain different concepts: short-horizon price observations,
              multi-day holding periods, indicator calculations and scheduled contributions.
              The questions and costs differ, so their illustrations are not comparable
              measures of proven profitability or suitability.
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              A study worksheet should record the instrument, assumed prices, source dates,
              costs and limitations before comparing outcomes. A hypothetical sample cannot
              establish a reliable win rate or expected financial return. No specific number
              of trades is a universal statistical test.
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              TradeHQ supports simplified virtual spot market orders. Resting stop and limit
              orders, short positions, options and futures execution are not available.
              DCA is a contribution schedule rather than an active order-entry strategy.
            </p>
          </section>

          <h2 className="text-xl font-semibold mb-4">The six strategies</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {STRATEGIES.map((s) => (
              <Link key={s.slug} to={`/strategy/${s.slug}`}>
                <Card className="p-6 hover:border-emerald-500/40 transition">
                  <h2 className="text-xl font-bold">{s.name}</h2>
                  <p className="text-sm text-muted-foreground mt-2">{s.oneLiner}</p>
                </Card>
              </Link>
            ))}
          </div>

          <section className="mt-10 max-w-3xl">
            <h2 className="text-xl font-semibold mb-3">How to test a strategy without risking money</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Write down the instrument, dates, sizing assumptions and entry and exit rules before a
              worksheet comparison. Record every observation covered by those rules, including losses,
              and state the costs included. TradeHQ executes simplified spot market orders; resting stops,
              shorts and some indicators described here are conceptual. A positive selected sample does
              not validate a strategy. Compare a separate period and a simple baseline before interpreting
              a result, and keep simulator limitations alongside the calculation.
            </p>
          </section>
        </main>
        <MegaFooter />
      </div>
    </>
  );
}