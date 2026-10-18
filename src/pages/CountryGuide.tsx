import NotFound from "./NotFound";
import { useParams, Link, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Navigation } from "@/components/Navigation";
import { MegaFooter } from "@/components/MegaFooter";
import { Card } from "@/components/ui/card";
import { EducationalDisclaimer } from "@/components/EducationalDisclaimer";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { AIAnswerBlock } from "@/components/seo/AIAnswerBlock";
import { getCountryGuide, COUNTRY_GUIDES } from "@/lib/countryGuides";
import { Globe2, GraduationCap, ShieldCheck, Building2, Landmark, ArrowRight } from "lucide-react";

const DOMAIN = "https://www.thetradehq.com";

export default function CountryGuide() {
  const { country } = useParams<{ country: string }>();
  const guide = country ? getCountryGuide(country) : undefined;
  if (!guide) return <NotFound />;

  const path = `/learn/country/${guide.slug}`;
  const title = `Learn Trading in ${guide.country} — Free Guide for ${guide.country} Students | TradeHQ`;
  const description = `Free trading education for ${guide.country}. Practice with $100,000 virtual cash, learn how global markets work, and understand local rules from ${guide.regulator.name}. Educational simulation only — not financial advice.`;

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: guide.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={`${DOMAIN}${path}`} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={`${DOMAIN}${path}`} />
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        <Navigation />
        <main className="flex-1 container mx-auto px-4 pt-28 pb-20 max-w-4xl">
          <Breadcrumbs
            items={[
              { label: "Learning", href: "/learn" },
              { label: "Country guides", href: "/learn/country" },
              { label: guide.country },
            ]}
          />

          <header className="my-8 text-center">
            <div className="text-6xl mb-4" aria-hidden>{guide.flag}</div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Learn Trading in {guide.country}
            </h1>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto leading-relaxed">{guide.intro}</p>
            <p className="mt-3 text-xs text-muted-foreground italic">Educational simulation only — not financial advice.</p>
          </header>

          <AIAnswerBlock
            className="mb-10"
            question={`Is TradeHQ suitable for ${guide.country} traders?`}
            answer={`Yes. TradeHQ is a free educational trading simulator accessible from ${guide.country} with no required signup or payment. TradeHQ is a virtual practice tool, not a broker, and does not execute real trades. This page does not determine your legal eligibility or a provider’s regulatory status. Every account starts with $100,000 in virtual cash for an educational worksheet; access does not establish eligibility for a real account. Educational simulation only — not financial advice.`}
          />

          <section className="mb-10 text-sm text-muted-foreground" aria-label="Publisher and regulatory references">
            <p>Published by TradeHQ. Site creator: Anuga Weerasinghe. Regulatory source check: {guide.sourceCheck.date}.</p>
            <p>{guide.sourceCheck.scope}</p>
            <ul className="list-disc pl-5 mt-3">{guide.sources.map(source => <li key={source.href}><a className="underline text-primary" href={source.href}>{source.label}</a></li>)}</ul>
          </section>

          <section className="grid md:grid-cols-2 gap-4 mb-10">
            <Card className="p-5 bg-white/[0.02] border-white/10">
              <div className="flex items-center gap-2 text-emerald-400 text-xs uppercase tracking-widest mb-2">
                <Landmark className="w-4 h-4" /> Local regulator
              </div>
              <a href={guide.regulator.url} target="_blank" rel="noopener noreferrer" className="text-foreground font-semibold hover:text-emerald-300">
                {guide.regulator.name}
              </a>
              <p className="text-xs text-muted-foreground mt-2">
                Check current local rules and provider registration with the relevant official authority. This guide does not certify regulatory compliance.
              </p>
            </Card>
            <Card className="p-5 bg-white/[0.02] border-white/10">
              <div className="flex items-center gap-2 text-emerald-400 text-xs uppercase tracking-widest mb-2">
                <Building2 className="w-4 h-4" /> Local exchange
              </div>
              <p className="text-foreground font-semibold">{guide.localExchange}</p>
              <p className="text-xs text-muted-foreground mt-2">Local currency: {guide.currency}</p>
            </Card>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-3">Why practise before you fund a real account</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{guide.whyPractice}</p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-3">How market access actually works in {guide.country}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{guide.marketAccess}</p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-3">How much capital do you really need?</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{guide.startingCapital}</p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-3">What to follow from {guide.country}</h2>
            <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1.5">
              {guide.localAssets.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-3">A three-month practice plan</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{guide.practicePlan}</p>
            <p className="mt-3 text-xs text-muted-foreground italic">
              Educational simulation only — not financial, tax or legal advice. Confirm all local rules with a licensed professional in {guide.country}.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-3 flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-emerald-400" /> Student perspective
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{guide.studentAngle}</p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-3 flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-emerald-400" /> Local brokers &amp; tax
            </h2>
            <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
              {guide.brokers.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground mt-3 italic">{guide.taxNote}</p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">FAQ for {guide.country} learners</h2>
            <div className="space-y-2">
              {guide.faqs.map((f) => (
                <details key={f.q} className="p-4 rounded-xl bg-white/[0.02] border border-white/10 group open:border-emerald-500/30">
                  <summary className="cursor-pointer font-semibold text-sm">{f.q}</summary>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
          </section>

          <Card className="p-6 bg-gradient-to-br from-emerald-500/10 to-fuchsia-500/10 border-emerald-500/25 text-center">
            <h3 className="text-xl font-bold mb-2">Ready to practise?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Open a free $100,000 practice account instantly — no signup, no card, no geo lock.
            </p>
            <Link
              to="/trade"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 text-black font-semibold hover:bg-emerald-400 transition"
            >
              Start paper trading <ArrowRight className="w-4 h-4" />
            </Link>
          </Card>

          <div className="mt-12">
            <h3 className="text-lg font-bold mb-4">Other country guides</h3>
            <div className="flex flex-wrap gap-2">
              {COUNTRY_GUIDES.filter((c) => c.slug !== guide.slug).map((c) => (
                <Link
                  key={c.slug}
                  to={`/learn/country/${c.slug}`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/10 text-sm hover:border-emerald-500/30 transition"
                >
                  <span aria-hidden>{c.flag}</span> {c.country}
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-12">
            <EducationalDisclaimer variant="footer" />
          </div>
        </main>
        <MegaFooter />
      </div>
    </>
  );
}

/** Index page for all country guides. */
export function CountryGuideIndex() {
  const title = "Country Guides — Learn Trading Locally | TradeHQ";
  const description = "Free trading guides tailored for students in Sri Lanka, India, Philippines, Pakistan and Nigeria. Local regulators, tax notes and $100,000 virtual practice cash.";
  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={`${DOMAIN}/learn/country`} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={`${DOMAIN}/learn/country`} />
      </Helmet>
      <div className="min-h-screen bg-background flex flex-col">
        <Navigation />
        <main className="flex-1 container mx-auto px-4 pt-28 pb-20 max-w-5xl">
          <Breadcrumbs items={[{ label: "Learning", href: "/learn" }, { label: "Country guides" }]} />
          <header className="my-8 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-xs uppercase tracking-widest text-emerald-400 mb-4">
              <Globe2 className="h-3 w-3" /> Country guides
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Learn trading in your country</h1>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              Local regulator, local exchange, local tax context — plus the same free $100,000 virtual practice account.
            </p>
          </header>
          <div className="grid md:grid-cols-2 gap-4">
            {COUNTRY_GUIDES.map((c) => (
              <Link
                key={c.slug}
                to={`/learn/country/${c.slug}`}
                className="block group"
              >
                <Card className="p-6 bg-white/[0.02] border-white/10 hover:border-emerald-500/40 transition h-full">
                  <div className="flex items-start gap-4">
                    <div className="text-5xl" aria-hidden>{c.flag}</div>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-xl font-semibold group-hover:text-emerald-300 transition-colors">
                        {c.country}
                      </h2>
                      <p className="text-xs text-muted-foreground mb-2">
                        {c.currency} · {c.localExchange}
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">{c.intro}</p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
          <div className="mt-12">
            <EducationalDisclaimer variant="footer" />
          </div>
        </main>
        <MegaFooter />
      </div>
    </>
  );
}