import { Helmet } from "react-helmet-async";
import { Navigation } from "@/components/Navigation";
import { MegaFooter } from "@/components/MegaFooter";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { EducationalDisclaimer } from "@/components/EducationalDisclaimer";
import { SEOSection } from "@/components/SEOSection";
import { Target, Compass, GraduationCap, Eye, Cpu, User } from "lucide-react";

const DOMAIN = "https://www.thetradehq.com";

const sections = [
  {
    icon: Target,
    title: "Mission",
    body:
      "Make financial literacy practical. TradeHQ lets anyone learn how markets work by doing — placing simulated trades, watching portfolios respond to news and price action, and studying the outcomes without risking a single dollar.",
  },
  {
    icon: Eye,
    title: "Vision",
    body:
      "A world where the first exposure to trading is educational, not expensive. Beginners should be able to make — and learn from — their first thousand mistakes on a simulator, not on their savings.",
  },
  {
    icon: GraduationCap,
    title: "Educational Philosophy",
    body:
      "Learning by doing beats learning by reading. Every feature — the $100,000 virtual portfolio, the AI mentor, the daily challenge, the wiki and the compound growth simulator — exists to turn abstract concepts (risk, position sizing, diversification, psychology) into things you can feel through hands-on practice.",
  },
  {
    icon: Compass,
    title: "Transparency",
    body:
      "TradeHQ is not a brokerage. We do not custody funds, execute real trades, or provide financial advice. Prices shown are simulated or delayed and are for education only. We do not sell user data or run behavioural ads.",
  },
  {
    icon: Cpu,
    title: "Technology",
    body:
      "TradeHQ is a modern web application built with React, TypeScript and a serverless backend. Guest practice records stay in your browser so you can start without signing up. Account cash, positions and server-recorded trades restore across devices when available; earlier guest history, journals and course progress remain browser-held. Mentor tools use educational rules and portfolio context, and can fall back to local explanations.",
  },
];

export default function About() {
  return (
    <>
      <Helmet>
        <title>About TradeHQ | Educational Paper Trading Simulator</title>
        <meta
          name="description"
          content="TradeHQ is an educational paper trading simulator built to help beginners learn how markets work through practice — not real money. Created by Anuga Weerasinghe."
        />
        <link rel="canonical" href={`${DOMAIN}/about`} />
        <meta name="robots" content="index, follow" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="About TradeHQ | Educational Paper Trading Simulator" />
        <meta
          property="og:description"
          content="Learn what TradeHQ is, why it exists and who built it. An educational trading simulator — not a brokerage, not financial advice."
        />
        <meta property="og:url" content={`${DOMAIN}/about`} />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navigation />

        <main className="container mx-auto px-4 py-12 max-w-4xl pb-24 md:pb-12">
          <header className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
              <Target className="w-8 h-8 text-primary" aria-hidden="true" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-4">About TradeHQ</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              TradeHQ exists to make financial education more accessible through practical learning.
              It is an educational simulator — not a brokerage, not an advisor.
            </p>
          </header>

          <div className="space-y-8">
            {sections.map((s) => (
              <section key={s.title} className="glass-liquid-card p-6">
                <h2 className="text-xl font-semibold mb-3 flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <s.icon className="w-5 h-5 text-primary" aria-hidden="true" />
                  </span>
                  {s.title}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
              </section>
            ))}

            <section className="glass-liquid-card p-6">
              <h2 className="text-xl font-semibold mb-3 flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" aria-hidden="true" />
                </span>
                Creator
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                TradeHQ was created by Anuga Weerasinghe as an educational software project focused
                on helping beginners understand financial markets through simulation and structured
                learning.
              </p>
            </section>

            <section id="disclaimer" className="glass-liquid-card p-6">
              <h2 className="text-xl font-semibold mb-3">What TradeHQ Is Not</h2>
              <ul className="text-sm text-muted-foreground leading-relaxed space-y-2 list-disc pl-5">
                <li>Not a brokerage — no real orders are ever routed to any exchange.</li>
                <li>Not a financial or investment advisor — nothing on the site is a recommendation to buy or sell.</li>
                <li>Not a source of live, guaranteed market data — prices are simulated or delayed for education.</li>
                <li>Not a substitute for professional advice — talk to a licensed advisor before investing real money.</li>
              </ul>
            </section>

            <section className="glass-liquid-card p-6">
              <h2 className="text-xl font-semibold mb-3">How the material is written and reviewed</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Every lesson, glossary entry and asset page on TradeHQ is written for one purpose: to
                explain a mechanism clearly enough that a beginner can act on it inside the simulator
                and see the result for themselves. Where a lesson states a fact about how an
                instrument works — how margin is calculated, what a CPI release contains, what a
                contract obliges each side to do — it links to a primary source such as a regulator,
                an exchange or a statistical agency, so the claim can be checked rather than trusted.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed mt-3">
                Community Reviews publish visitor-submitted feedback; we do not independently verify
                reviewers' identities or experiences. The Community Practice Board publishes optional,
                client-synced simulated statistics, not independently verified investment results.
                Neither feedback nor practice rankings promise real-world returns. Educational figures
                use cited sources or clearly labelled hypothetical examples; when a question has no honest answer —
                which asset will rise, whether a strategy will work for you — the page says so instead
                of guessing. Content is revised whenever a reader points out an error or a market
                mechanism changes, and corrections are made in place rather than quietly removed.
              </p>
            </section>
          </div>

          <EducationalDisclaimer variant="inline" className="mt-4 mb-0" />

          <SEOSection
            path="/about"
            faqHeading="About TradeHQ"
            breadcrumbs={[{ label: "About" }]}
            faqs={[
              {
                question: "Is TradeHQ a real broker?",
                answer:
                  "No. TradeHQ is an educational paper trading simulator. No real money is ever traded and no real orders are sent to any exchange.",
              },
              {
                question: "Who built TradeHQ?",
                answer:
                  "TradeHQ was built by Anuga Weerasinghe as an educational software project to help beginners learn how markets work.",
              },
              {
                question: "Is TradeHQ free?",
                answer:
                  "Yes. TradeHQ is free to use, with no signup required. Every account starts with $100,000 of virtual cash.",
              },
              {
                question: "Does TradeHQ give financial advice?",
                answer:
                  "No. Nothing on TradeHQ — including the AI mentor and market commentary — constitutes financial, investment, legal or tax advice.",
              },
            ]}
          />
        </main>

        <MegaFooter />
        <MobileBottomNav />
      </div>
    </>
  );
}