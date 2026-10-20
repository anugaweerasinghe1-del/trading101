import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Navigation } from "@/components/Navigation";
import { MegaFooter } from "@/components/MegaFooter";
import { Breadcrumb } from "@/components/Breadcrumb";
import { tradingGlossary } from "@/lib/tradingGlossary";
import { GLOSSARY_WORKSHEETS } from "@/lib/glossaryWorksheets";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, BookOpen, Clock, Share2, Zap, CheckCircle2, Lightbulb, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import NotFound from "./NotFound";

const DOMAIN = "https://www.thetradehq.com";

function firstCompleteSentence(text: string): string {
  const match = text.trim().match(/^(.+?[.!?])(?:\s|$)/);
  return match ? match[1] : text.trim();
}

const WikiTerm = () => {
  const { slug } = useParams<{ slug: string }>();
  const term = tradingGlossary.find((t) => t.slug === slug);
  const worksheet = slug ? GLOSSARY_WORKSHEETS[slug] : undefined;

  if (!term) return <NotFound />;

  const relatedTerms = term.relatedTerms
    .map((rs) => tradingGlossary.find((t) => t.slug === rs))
    .filter(Boolean);

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": `What is ${term.term}? | Trading Concept Guide | TradeHQ`,
    "description": `${term.definition}`,
    "author": { "@type": "Organization", "name": "TradeHQ" },
    "publisher": {
      "@type": "Organization",
      "name": "TradeHQ",
      "url": DOMAIN
    },
    "mainEntityOfPage": `${DOMAIN}/wiki/${term.slug}`
  };

  const definedTermSchema = {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    "name": term.term,
    "description": term.definition,
    "inDefinedTermSet": {
      "@type": "DefinedTermSet",
      "name": "TradeHQ Trading Glossary",
      "url": `${DOMAIN}/learn-trading-guide`,
    },
    "termCode": term.slug,
    "url": `${DOMAIN}/wiki/${term.slug}`,
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": DOMAIN },
      { "@type": "ListItem", "position": 2, "name": "Trading Guide", "item": `${DOMAIN}/learn-trading-guide` },
      { "@type": "ListItem", "position": 3, "name": term.term, "item": `${DOMAIN}/wiki/${term.slug}` }
    ]
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `I am learning about "${term.term}" on TradeHQ! 🚀📈 Learn it here: ${DOMAIN}/wiki/${term.slug}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
  };

  const difficultyColor = {
    Novice: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    Intermediate: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    Pro: "bg-red-500/10 text-red-400 border-red-500/20",
  }[term.difficulty];

  return (
    <>
      <Helmet>
        <title>What is {term.term}? | Trading Concept Guide | TradeHQ</title>
        <meta
          name="description"
          content={`${firstCompleteSentence(term.definition)} Learn the concept with examples and simulated practice on TradeHQ.`}
        />
        <link rel="canonical" href={`${DOMAIN}/wiki/${term.slug}`} />
        <meta name="robots" content="index, follow" />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={`What is ${term.term}? | Trading Concept Guide | TradeHQ`} />
        <meta property="og:description" content={term.definition} />
        <meta property="og:url" content={`${DOMAIN}/wiki/${term.slug}`} />
        <meta property="og:image" content={`${DOMAIN}/og-image.png`} />
        <meta property="og:site_name" content="TradeHQ" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`What is ${term.term}? | TradeHQ`} />
        <meta name="twitter:description" content={term.definition} />
        <meta name="twitter:image" content={`${DOMAIN}/og-image.png`} />
        <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(definedTermSchema)}</script>
      </Helmet>

      <div className="min-h-screen bg-[hsl(var(--background))] text-foreground font-sans selection:bg-primary/30">
        <Navigation />

        <main className="container mx-auto px-6 pt-24 pb-16 max-w-3xl">
          <Breadcrumb items={[
            { label: "Trading Guide", href: "/learn-trading-guide" },
            { label: "Wiki", href: "/learn-trading-guide" },
            { label: term.term }
          ]} />

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <Badge className={`${difficultyColor} text-[10px] uppercase tracking-[0.15em] font-bold`}>
                {term.difficulty}
              </Badge>
              <Badge className="bg-muted text-muted-foreground border-border text-[10px] uppercase tracking-[0.15em] font-bold">
                <Clock className="w-3 h-3 mr-1" /> {term.readTime}
              </Badge>
              <Badge className="bg-muted text-muted-foreground border-border text-[10px] uppercase tracking-[0.15em] font-bold">
                {term.category}
              </Badge>
            </div>

            <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight mb-2 leading-tight">
              What is <span className="text-primary">{term.term}</span>?
            </h1>
          </motion.div>

              <p className="text-sm text-muted-foreground mb-6">
                Published by TradeHQ. <Link to="/about" className="underline underline-offset-4">Site creator and editorial approach: Anuga Weerasinghe</Link>.
                This page has no recorded editorial review date.
              </p>

          {/* Detailed Definition */}
          <Card className="mt-8 p-6 md:p-8 bg-card border-border rounded-2xl backdrop-blur-md">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-4 h-4 text-primary" />
              <h2 className="text-xs uppercase tracking-[0.15em] font-black text-muted-foreground">Detailed Definition</h2>
            </div>
            <p className="text-sm md:text-base text-foreground/80 leading-relaxed whitespace-pre-line">
              {term.expertDefinition}
            </p>
          </Card>

          {!!term.sources?.length && <section className="mt-6" aria-label="Primary references">
            <h2 className="text-lg font-semibold">References</h2>
            <ul className="list-disc pl-5">{term.sources.map(source => <li key={source.href}><a className="text-primary underline" href={source.href}>{source.label}</a></li>)}</ul>
          </section>}

          {/* Pro Tip Box */}
          <Card className="mt-4 p-6 md:p-8 bg-primary/[0.04] border-primary/20 rounded-2xl">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-primary" />
              <h2 className="text-xs uppercase tracking-[0.15em] font-black text-primary">How It Works</h2>
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed font-medium">{term.definition}</p>
          </Card>

          {/* Key Points */}
          <Card className="mt-4 p-6 md:p-8 bg-card border-border rounded-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-primary" />
              <h2 className="text-xs uppercase tracking-[0.15em] font-black text-muted-foreground">Key Points</h2>
            </div>
            <ul className="space-y-3">
              {term.keyPoints.map((point, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <span className="text-sm text-foreground/80">{point}</span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Student Perspective */}
          <Card className="mt-4 p-6 md:p-8 bg-primary/[0.03] border-primary/10 rounded-2xl">
            <h2 className="text-xs uppercase tracking-[0.15em] font-black text-primary mb-3">
              💡 Why This Matters
            </h2>
            <p className="text-sm text-foreground/80 leading-relaxed italic">{term.studentPerspective}</p>
          </Card>

          {worksheet && <section className="mt-6 space-y-3" aria-label="Worked glossary exercise">
            <h2 className="text-lg font-bold">Worked exercise and its limits</h2>
            <p className="text-sm leading-relaxed">{worksheet.exercise}</p>
            <h3 className="font-semibold">References and scope</h3>
            <ul className="list-disc pl-5 space-y-2">{worksheet.references.map(reference => <li key={reference.href}>
              <a className="text-primary underline" href={reference.href}>{reference.label}</a>
            </li>)}</ul>
          </section>}
          {/* Simulator CTA */}
          <Card className="mt-6 p-6 bg-card border-border rounded-2xl">
            <div className="flex items-center gap-3 mb-3">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h3 className="text-sm font-bold text-foreground">Apply This in the Simulator</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Use the worksheet below to examine {term.term.toLowerCase()}. Some concepts require external data or paper calculations; TradeHQ does not implement every indicator, order type or contract.
            </p>
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg" asChild>
<Link to="/trade/btc">
                Open Simulator <ArrowRight className="ml-2 w-3 h-3" />
              </Link>
</Button>
          </Card>

          {/* WhatsApp Share */}
          <div className="mt-8 flex justify-center">
            <Button
              onClick={handleWhatsAppShare}
              className="h-11 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold px-8 rounded-xl transition-all shadow-[0_0_20px_rgba(37,211,102,0.2)]"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share to WhatsApp
            </Button>
          </div>

          {/* Related Terms */}
          {relatedTerms.length > 0 && (
            <section className="mt-12 pt-8 border-t border-border">
              <h2 className="text-xs uppercase tracking-[0.15em] font-black text-muted-foreground mb-4">Related Terms</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {relatedTerms.map((rt) =>
                  rt ? (
                    <Link key={rt.slug} to={`/wiki/${rt.slug}`}>
                      <Card className="p-4 bg-card border-border hover:border-primary/30 transition-all rounded-xl group">
                        <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                          {rt.term}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1">{rt.difficulty} · {rt.readTime}</p>
                      </Card>
                    </Link>
                  ) : null
                )}
              </div>
            </section>
          )}
        </main>

        <MegaFooter />
      </div>
    </>
  );
};

export default WikiTerm;
