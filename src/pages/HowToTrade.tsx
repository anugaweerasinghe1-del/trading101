import NotFound from "./NotFound";
import { useParams, Link, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Navigation } from "@/components/Navigation";
import { MegaFooter } from "@/components/MegaFooter";
import { SEOSection } from "@/components/SEOSection";
import { AIAnswerBlock } from "@/components/seo/AIAnswerBlock";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, AlertTriangle, GraduationCap } from "lucide-react";
import { HOWTO_ASSETS, SITE_DOMAIN } from "@/lib/seoData";
import { tradeRouteForSymbol } from "@/lib/assets";

export default function HowToTrade() {
  const { symbol } = useParams<{ symbol: string }>();
  const asset = HOWTO_ASSETS.find((a) => a.symbol === symbol?.toLowerCase());
  if (!asset) return <NotFound />;

  const title = `How to Trade ${asset.fullName} (${asset.name}) — Step-by-Step Guide | TradeHQ`;
  const description = `Learn how to trade ${asset.fullName} step-by-step with $100,000 virtual cash. Free practice account, no signup. (Educational simulation only — not financial advice.)`;
  const url = `${SITE_DOMAIN}/how-to-trade/${asset.symbol}`;

  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: `How to trade ${asset.fullName}`,
    description,
    totalTime: "PT15M",
    step: asset.steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: `Step ${i + 1}`,
      text: s,
    })),
  };

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
        <script type="application/ld+json">{JSON.stringify(howToSchema)}</script>
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        <Navigation />
        <main data-publisher-notes={`/how-to-trade/${asset.symbol}`} className="[.light_&_.text-emerald-400]:text-emerald-800 [.light_&_.text-rose-400]:text-rose-800 flex-1 container mx-auto px-4 pt-24 pb-12 max-w-4xl">
          <header className="mb-10">
            <p className="text-xs uppercase tracking-widest text-emerald-400 mb-3">{asset.type} guide</p>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">How to Trade {asset.fullName}</h1>
            <p className="mt-4 text-lg text-muted-foreground">{asset.whyTrade}</p>
            <p className="mt-3 text-sm text-muted-foreground">Published by TradeHQ, created by Anuga Weerasinghe. <Link to="/about" className="underline">Publisher background and editorial approach</Link>. No independent professional review is claimed; any recorded source-check scope appears on the page.</p>
            <Button className="mt-6" asChild>
<Link to={tradeRouteForSymbol(asset.symbol)}>Practise {asset.name} now <ArrowRight className="ml-2 h-4 w-4" /></Link>
</Button>
          </header>

          <AIAnswerBlock
            question={`How do you trade ${asset.fullName} step by step?`}
            answer={`To trade ${asset.fullName}: ${asset.steps.slice(0, 3).join(" → ")} Practise the full flow free on TradeHQ with $100,000 in virtual cash — no signup required. (Educational simulation only — not financial advice.)`}
            className="mb-6"
          />

          <Card className="p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4">Step-by-step</h2>
            <ol className="space-y-4">
              {asset.steps.map((step, i) => (
                <li key={i} className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold text-sm">{i + 1}</span>
                  <span className="text-sm pt-1">{step}</span>
                </li>
              ))}
            </ol>
          </Card>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <Card className="p-5 border-emerald-500/20">
              <h3 className="text-sm font-semibold text-emerald-400 mb-2">Beginner tip</h3>
              <p className="text-sm">{asset.beginnerTip}</p>
            </Card>
            <Card className="p-5 border-rose-500/20">
              <h3 className="text-sm font-semibold text-rose-400 mb-2 flex items-center gap-2"><AlertTriangle className="h-4 w-4" />Risk warning</h3>
              <p className="text-sm">{asset.risk}</p>
            </Card>
          </div>

          <Card className="p-5 mb-8 bg-gradient-to-br from-emerald-500/5 to-transparent">
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2"><GraduationCap className="h-4 w-4" />Student perspective</h3>
            <p className="text-sm text-muted-foreground">{asset.studentNote}</p>
            <p className="mt-2 text-xs text-muted-foreground/70 italic">(Educational simulation only — not financial advice.)</p>
          </Card>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">What actually moves {asset.fullName}</h2>
            <ul className="space-y-3">
              {asset.drivers.map((d, i) => (
                <li key={i} className="text-sm leading-relaxed text-muted-foreground flex gap-3">
                  <span className="shrink-0 mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden />
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-3">Worked hypothetical practice example</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{asset.firstTrade}</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-3">Market sessions and observation limitations</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{asset.timing}</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Common mistakes specific to {asset.fullName}</h2>
            <ul className="space-y-3">
              {asset.mistakes.map((m, i) => (
                <li key={i} className="text-sm leading-relaxed text-muted-foreground flex gap-3">
                  <span className="shrink-0 mt-1.5 h-1.5 w-1.5 rounded-full bg-rose-400" aria-hidden />
                  <span>{m}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-3">How to review the trade afterwards</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{asset.review}</p>
            <p className="mt-3 text-xs text-muted-foreground/70 italic">(Educational simulation only — not financial advice.)</p>
            {asset.symbol === "eth" && (
              <p className="mt-3 text-sm text-muted-foreground">
                Network concepts: <a href="https://ethereum.org/what-is-ether/" className="underline">Ethereum.org on ether</a>
                {" and "}<a href="https://ethereum.org/gas/" className="underline">Ethereum.org on gas and fees</a>.
              </p>
            )}
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-3">Keep going</h2>
            <div className="flex flex-wrap gap-2 text-sm">
              <Link to={tradeRouteForSymbol(asset.symbol)} className="px-4 py-2 rounded-full border border-white/10 hover:border-emerald-500/40">Practice {asset.fullName} in the simulator</Link>
              <Link to="/courses" className="px-4 py-2 rounded-full border border-white/10 hover:border-emerald-500/40">Structured courses</Link>
              <Link to="/wiki" className="px-4 py-2 rounded-full border border-white/10 hover:border-emerald-500/40">Trading glossary</Link>
              <Link to="/compare" className="px-4 py-2 rounded-full border border-white/10 hover:border-emerald-500/40">Asset comparisons</Link>
              <Link to="/strategy" className="px-4 py-2 rounded-full border border-white/10 hover:border-emerald-500/40">Strategy guides</Link>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-3">More guides</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {HOWTO_ASSETS.filter((a) => a.symbol !== asset.symbol).map((a) => (
                <Link key={a.symbol} to={`/how-to-trade/${a.symbol}`} className="text-sm p-3 rounded-lg border border-white/10 hover:border-emerald-500/40">How to trade {a.fullName}</Link>
              ))}
            </div>
          </section>

          <SEOSection
            path={`/how-to-trade/${asset.symbol}`}
            breadcrumbs={[
              { label: "How to Trade", href: "/how-to-trade" },
              { label: asset.fullName },
            ]}
            faqs={[
              { question: `Can I learn to trade ${asset.fullName} for free?`, answer: `Yes. TradeHQ gives you $100,000 in virtual cash with no signup for ${asset.fullName} practice. Simulated results do not predict real returns.` },
              { question: `How much money do I need to start trading ${asset.fullName}?`, answer: `On TradeHQ — zero. You get $100K practice capital instantly. For real trading, never start with more than you can afford to lose.` },
              { question: `Is trading ${asset.fullName} risky?`, answer: asset.risk },
            ]}
            faqHeading={`${asset.fullName} FAQ`}
          />
          {asset.sources && asset.sources.length > 0 && (
            <section aria-label="Sources and further reading" className="mb-8">
              <h2 className="text-2xl font-semibold mb-3">Primary sources and further reading</h2>
              <p className="text-sm text-muted-foreground mb-3">
                Sources explain the instrument or market structure, not hypothetical returns.
                Always review dates and distinguish real exchange costs from the simulator.
              </p>
              <ul className="space-y-2 text-sm">
                {asset.sources.map((source) => (
                  <li key={source.href}>
                    <a href={source.href} target="_blank" rel="noopener noreferrer"
                       className="text-emerald-400 hover:underline">{source.label}</a>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <p className="mt-6 text-sm text-muted-foreground">Educational simulation only — not financial advice. Virtual money; no brokerage transactions. Quotes may be delayed, cached, unavailable or fixed simulator values; generated charts are labelled separately. Practice results do not predict investment outcomes.</p>
        </main>
        <MegaFooter />
      </div>
    </>
  );
}

export function HowToTradeIndex() {
  const title = "How to Trade — Step-by-Step Asset Guides | TradeHQ";
  const description = "Free step-by-step guides on how to trade Bitcoin, Ethereum, Tesla, Nvidia and more. Practise with $100K virtual cash, no signup.";
  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={`${SITE_DOMAIN}/how-to-trade`} />
      </Helmet>
      <div className="min-h-screen bg-background flex flex-col">
        <Navigation />
        <main className="[.light_&_.text-emerald-400]:text-emerald-800 [.light_&_.text-rose-400]:text-rose-800 flex-1 container mx-auto px-4 pt-24 pb-12 max-w-5xl">
          <h1 className="text-4xl font-bold mb-2">How to Trade — Guides</h1>
          <p className="text-muted-foreground mb-8">Pick an asset and learn step-by-step on the free $100K practice account.</p>
          <div className="grid md:grid-cols-2 gap-4">
            {HOWTO_ASSETS.map((a) => (
              <Link key={a.symbol} to={`/how-to-trade/${a.symbol}`}>
                <Card className="p-6 hover:border-emerald-500/40 transition">
                  <div className="text-xs text-emerald-400 mb-2 uppercase">{a.type}</div>
                  <h2 className="text-xl font-bold">How to trade {a.fullName}</h2>
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{a.whyTrade}</p>
                </Card>
              </Link>
            ))}
          </div>
        </main>
        <MegaFooter />
      </div>
    </>
  );
}
