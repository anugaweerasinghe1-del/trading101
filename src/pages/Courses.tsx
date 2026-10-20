import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Navigation } from "@/components/Navigation";
import { MegaFooter } from "@/components/MegaFooter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  BookOpen,
  Users,
  Clock,
  Sparkles,
  Target,
  Award,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { useCourseCatalog } from "@/hooks/useCourseCatalog";
import { loadProgress, trackCompletionPct } from "@/lib/courseProgress";
import { EducationalDisclaimer } from "@/components/EducationalDisclaimer";
import { AIAnswerBlock } from "@/components/seo/AIAnswerBlock";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";

const DOMAIN = "https://www.thetradehq.com";

const LEARNING_OUTCOMES = [
  "Explain options-chain fields and calculate hypothetical defined-risk spread payoffs",
  "Explain futures margin, contango and backwardation using contract worksheets",
  "Identify economic releases and describe limits of interpreting market reactions",
  "Examine cognitive biases through fictional decision records without diagnosing individuals",
  "Compare hypothetical sizing assumptions and optional review records",
];

const WHY_TRUST = [
  {
    icon: ShieldCheck,
    title: "Educational only — no financial advice",
    body: "TradeHQ is not a brokerage. Every lesson explicitly notes that scenarios are illustrative and that past simulated performance does not predict future real-world returns.",
  },
  {
    icon: FileText,
    title: "Sources and limitations",
    body: "Each authored lesson has a source list. Sources support specified definitions and examples, not claims about returns. Always check a source date for time-sensitive financial rules.",
  },
  {
    icon: Users,
    title: "Publisher and review process",
    body: "TradeHQ identifies its creator and maintains course material for educational purposes. AI-assisted additions require an owner publication review; this does not imply an independent financial-professional endorsement.",
  },
  {
    icon: Award,
    title: "Practice, not preaching",
    body: "Use $100,000 virtual cash to practise supported spot instruments and general trading habits. Options and futures contract mechanics are taught through worked examples; TradeHQ does not execute derivatives contracts.",
  },
];

const HOW_IT_WORKS = [
  { step: "1", title: "Pick a track", body: "Choose the topic that matches your level. Beginners typically start with Trading Psychology or Macro Reading." },
  { step: "2", title: "Read the lesson", body: "Check each lesson’s reading-time estimate. Read the worked examples, assumptions and linked sources at your own pace." },
  { step: "3", title: "Take the quiz", body: "A 4–6 question knowledge check. Explanations for every answer — you learn from mistakes." },
  { step: "4", title: "Work through an example", body: "Practise supported spot trades with virtual cash. For options and futures, calculate hypothetical contract payoffs and margin changes in a worksheet." },
  { step: "5", title: "Earn the badge", body: "Complete every lesson in a track to record a completion badge in this browser. Clearing browser storage can remove this progress; it is not a permanent profile credential." },
];

const FAQ = [
  {
    q: "Are the TradeHQ courses really free?",
    a: "Yes. Every lesson, quiz, badge and the $100,000 practice account are free forever, with no signup and no credit card. TradeHQ is an educational simulator and does not sell trading services or investment products.",
  },
  {
    q: "Is this financial advice?",
    a: "No. TradeHQ is educational only. Nothing on the site is financial, investment, legal or tax advice. Scenarios are illustrative and simulated. Speak with a licensed advisor before making real-money decisions.",
  },
  {
    q: "Do I need prior trading experience?",
    a: "No. Every track starts at fundamentals. A new learner can start with 'Trading Decisions and Behaviour' or the first lesson of 'Options Trading Fundamentals'.",
  },
  {
    q: "How long does a track take?",
    a: "Lesson counts vary by track. Each course card lists its syllabus and estimated reading time; allow additional time for quizzes and worksheet exercises. Progress is saved in your browser so you can resume on the same browser.",
  },
  {
    q: "What do I get for completing a track?",
    a: "A completion badge records your course progress. Lessons and quizzes help you explain concepts, but completion does not certify trading competence. Options and futures exercises are conceptual; simulator execution is limited to supported spot instruments.",
  },
  {
    q: "Where does the content come from?",
    a: "Courses are maintained by TradeHQ creator Anuga Weerasinghe. New AI-assisted courses require editorial review before publication and show their reviewer and review date. Every lesson lists its sources.",
  },
  {
    q: "Will you cover crypto, forex or DeFi in depth?",
    a: "The published catalog includes a cryptocurrency price-feed and portfolio-valuation track. Other lessons reference forex and macro. Check the current syllabus for each track's scope; future topics are not guaranteed.",
  },
];

export default function Courses() {
  const { tracks: courseTracks } = useCourseCatalog();
  const lessonCount = courseTracks.reduce((total, track) => total + track.lessons.length, 0);
  const progress = loadProgress();
  const resume = progress.lastLesson;

  const title = "Free Trading Courses — Options, Futures, Macro & Psychology | TradeHQ";
  const description =
    "Structured trading courses covering options, futures, macro reading and trading psychology. Free lessons, quizzes and completion badges. Practice with $100,000 virtual cash on TradeHQ.";

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: courseTracks.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${DOMAIN}/courses/${t.slug}`,
      name: t.title,
    })),
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const courseListSchema = courseTracks.map((t) => ({
    "@context": "https://schema.org",
    "@type": "Course",
    name: t.title,
    description: t.description,
    provider: { "@type": "Organization", name: "TradeHQ", url: DOMAIN },
    inLanguage: "en",
    isAccessibleForFree: true,
    educationalLevel: t.level,
    url: `${DOMAIN}/courses/${t.slug}`,
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
      courseWorkload: `PT${t.lessons.length * 15}M`,
    },
    author: t.editorial ? { "@type": "Organization", name: "TradeHQ" } : { "@type": "Person", name: "Anuga Weerasinghe" },
  }));

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={`${DOMAIN}/courses`} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={`${DOMAIN}/courses`} />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(itemListSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
        {courseListSchema.map((s, i) => (
          <script key={i} type="application/ld+json">{JSON.stringify(s)}</script>
        ))}
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        <Navigation />

        {/* atmospheric backdrop */}
        <div
          aria-hidden
          className="fixed inset-0 pointer-events-none -z-0 opacity-60"
          style={{
            background:
              "radial-gradient(900px 600px at 10% -10%, hsl(168 100% 50% / 0.10), transparent 60%), radial-gradient(700px 500px at 90% 10%, hsl(280 60% 55% / 0.07), transparent 60%)",
          }}
        />

        <main className="relative flex-1 container mx-auto px-4 pt-28 pb-20 max-w-6xl">
          <Breadcrumbs items={[{ label: "Learning", href: "/learn" }, { label: "Courses" }]} />

          {/* Hero */}
          <header className="my-10 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-xs uppercase tracking-widest text-emerald-400 mb-5">
              <GraduationCap className="h-3 w-3" /> Structured TradeHQ Courses
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-gradient-to-br from-white via-emerald-200 to-emerald-400 bg-clip-text text-transparent leading-[1.05]">
              Learn to Trade — Properly
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Explore the published catalog's {courseTracks.length} course tracks and {lessonCount} lessons.
              Each course card lists its topics and syllabus. Quizzes, sources, completion badges, and a
              <span className="text-emerald-400 font-semibold"> $100,000 virtual practice account</span>
              {" "}for supported spot instruments. Options and futures contract mechanics are
              taught through conceptual examples and worksheet exercises.
            </p>
            <p className="mt-4 text-sm text-muted-foreground/80 max-w-2xl mx-auto italic">
              Educational simulation only — not financial, investment, legal or tax advice.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a
                href="#tracks"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 text-black font-semibold hover:bg-emerald-400 transition"
              >
                Browse the courses <ArrowRight className="w-4 h-4" />
              </a>
              <Link
                to="/learn"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-foreground hover:border-emerald-500/40 transition"
              >
                Or explore the full Learn hub
              </Link>
            </div>
          </header>

          <AIAnswerBlock
            className="mb-12"
            question="Are TradeHQ's free trading courses any good?"
            answer={"TradeHQ offers " + courseTracks.length + " structured course tracks with " + lessonCount + " lessons, quizzes, cited sources and completion badges. AI-assisted additions receive an editorial review before publication. The free $100,000 virtual account supports spot instruments; derivatives exercises are conceptual."}
          />

          {resume && (
            <Card className="p-5 mb-10 border-emerald-500/30 bg-emerald-500/5 flex items-center justify-between gap-4 flex-wrap">
              <div className="text-sm">
                <div className="text-emerald-400 uppercase text-[10px] tracking-widest mb-1">
                  Continue where you left off
                </div>
                <div className="text-foreground font-medium">
                  Resume: {resume.track.replace(/-/g, " ")} · {resume.lesson.replace(/-/g, " ")}
                </div>
              </div>
              <Link
                to={`/courses/${resume.track}/${resume.lesson}`}
                className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-400 hover:text-emerald-300"
              >
                Resume lesson <ArrowRight className="w-4 h-4" />
              </Link>
            </Card>
          )}

          {/* What you'll learn */}
          <section className="mb-14" aria-labelledby="outcomes">
            <h2 id="outcomes" className="text-2xl md:text-3xl font-bold mb-6 flex items-center gap-3">
              <Target className="w-6 h-6 text-emerald-400" /> What you will actually be able to do
            </h2>
            <div className="grid md:grid-cols-2 gap-3">
              {LEARNING_OUTCOMES.map((o) => (
                <div
                  key={o}
                  className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/10"
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-foreground/85 leading-relaxed">{o}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Tracks */}
          <section id="tracks" className="mb-16">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                <BookOpen className="w-6 h-6 text-emerald-400" /> Course tracks
              </h2>
              <span className="text-xs text-muted-foreground">
                {lessonCount} lessons · Free forever
              </span>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {courseTracks.map((track) => {
                const pct = trackCompletionPct(track.slug, track.lessons.length);
                return (
                  <Card
                    key={track.slug}
                    className="overflow-hidden bg-white/[0.02] border border-white/10 hover:border-emerald-500/40 transition-colors group"
                  >
                    <Link to={`/courses/${track.slug}`}>
                      <div className="aspect-[16/9] overflow-hidden bg-black relative">
                        <img
                          src={track.hero}
                          alt={`${track.title} — TradeHQ course cover`}
                          width={1200}
                          height={675}
                          loading="lazy"
                          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                        />
                      </div>
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className="text-[10px] uppercase tracking-widest">
                            {track.level}
                          </Badge>
                          <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {track.lessons.length * 12}–{track.lessons.length * 15} min
                          </span>
                        </div>
                        <h3 className="text-xl font-semibold mb-1 group-hover:text-emerald-300 transition-colors">
                          {track.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                          {track.description || track.tagline}
                        </p>

                        <div className="mb-4">
                          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
                            Syllabus
                          </p>
                          <ul className="space-y-1">
                            {track.lessons.slice(0, 3).map((l) => (
                              <li key={l.slug} className="text-xs text-foreground/70 flex items-start gap-1.5">
                                <span className="text-emerald-400/60">›</span> {l.title}
                              </li>
                            ))}
                            {track.lessons.length > 3 && (
                              <li className="text-xs text-muted-foreground italic">
                                + {track.lessons.length - 3} more lessons
                              </li>
                            )}
                          </ul>
                        </div>

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            {pct}% complete
                          </span>
                          <span className="text-emerald-400 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                            Start course <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                        <div className="mt-3 h-1 rounded-full bg-white/5 overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </Link>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* How it works */}
          <section className="mb-16" aria-labelledby="how-it-works">
            <h2 id="how-it-works" className="text-2xl md:text-3xl font-bold mb-6 flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-emerald-400" /> How the courses work
            </h2>
            <div className="grid md:grid-cols-5 gap-3">
              {HOW_IT_WORKS.map((s) => (
                <Card key={s.step} className="p-5 bg-white/[0.02] border border-white/10">
                  <div className="text-emerald-400 font-bold text-xl mb-2">{s.step}</div>
                  <h3 className="text-sm font-semibold mb-1.5">{s.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{s.body}</p>
                </Card>
              ))}
            </div>
          </section>

          {/* Why trust */}
          <section className="mb-16" aria-labelledby="why-trust">
            <h2 id="why-trust" className="text-2xl md:text-3xl font-bold mb-6 flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-emerald-400" /> Why you can trust this content
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {WHY_TRUST.map((t) => {
                const Icon = t.icon;
                return (
                  <Card
                    key={t.title}
                    className="p-5 bg-white/[0.02] border border-white/10 flex gap-4"
                  >
                    <Icon className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-semibold mb-1.5">{t.title}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">{t.body}</p>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* Author */}
          <section className="mb-16" aria-labelledby="author">
            <Card className="p-6 md:p-8 bg-white/[0.02] border border-white/10">
              <h2 id="author" className="text-xl font-bold mb-3">
                About the author
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                TradeHQ course material is maintained by{" "}
                <Link to="/about" className="text-emerald-400 hover:underline">
                  Anuga Weerasinghe
                </Link>
                , the creator of TradeHQ. TradeHQ is a free educational simulator built for
                self-directed learners — especially students in emerging markets — who want to
                explore market concepts through hypothetical examples.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                AI-assisted additions identify their preparation and owner publication review on the course page.
                This review does not imply independent financial-professional verification. Lessons link their
                public sources for the scope described. If you spot an error, please <Link to="/contact" className="text-emerald-400 hover:underline">contact us</Link> — reported corrections are reviewed before publication.
              </p>
            </Card>
          </section>

          {/* Risk warning — critical for AdSense YMYL */}
          <section className="mb-16" aria-labelledby="risk">
            <Card className="p-6 border-amber-500/30 bg-amber-500/[0.03]">
              <h2 id="risk" className="text-lg font-bold mb-3 flex items-center gap-2 text-amber-300">
                <AlertTriangle className="w-5 h-5" /> Important risk information
              </h2>
              <div className="space-y-2 text-sm text-muted-foreground leading-relaxed">
                <p>
                  Trading real financial instruments involves substantial risk of loss and is not
                  suitable for every investor.
                  Nothing on TradeHQ constitutes a recommendation to buy or sell any security.
                </p>
                <p>
                  Simulated results shown in these courses do not represent real trading. They do
                  not account for real-world slippage, spreads, commissions, taxes, funding costs,
                  gap risk, or the emotional impact of trading with real money. Past simulated
                  performance is not a reliable indicator of future real-world results.
                </p>
                <p>
                  Before making any real investment decision, consult a licensed financial
                  professional in your jurisdiction.
                </p>
              </div>
            </Card>
          </section>

          {/* FAQ */}
          <section className="mb-16" aria-labelledby="faq">
            <h2 id="faq" className="text-2xl md:text-3xl font-bold mb-6">
              Frequently asked questions
            </h2>
            <div className="space-y-3">
              {FAQ.map((f) => (
                <details
                  key={f.q}
                  className="group p-5 rounded-xl bg-white/[0.02] border border-white/10 open:border-emerald-500/30 transition-colors"
                >
                  <summary className="cursor-pointer font-semibold text-foreground/90 flex items-start justify-between gap-4">
                    <span>{f.q}</span>
                    <span className="text-emerald-400 shrink-0 group-open:rotate-45 transition-transform">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
          </section>

          <EducationalDisclaimer variant="footer" className="mb-12" />
        </main>

        <MegaFooter />
      </div>
    </>
  );
}
