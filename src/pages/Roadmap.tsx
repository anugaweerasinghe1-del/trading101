import { Helmet } from "react-helmet-async";
import { Navigation } from "@/components/Navigation";
import { MegaFooter } from "@/components/MegaFooter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, BookOpenCheck, UserCircle2, LineChart, GraduationCap, Bell, Users2, BarChart3, Globe2, Trophy } from "lucide-react";
import { SITE_DOMAIN } from "@/lib/seoData";

interface RoadmapItem {
  icon: any;
  title: string;
  desc: string;
  status: "shipped" | "shipping-soon" | "in-progress" | "planned";
  eta: string;
}

const ITEMS: RoadmapItem[] = [
  { icon: Bell, title: "TradeHQ Weekly", desc: "Free original beginner lessons. Voluntary subscription, confirmation and unsubscribe; only editor-approved issues are published. See /newsletter.", status: "shipped", eta: "Live · Oct 2026" },
  { icon: GraduationCap, title: "Clearer Navigation", desc: "Home, Learn, Trade, Portfolio and Weekly are front and centre. Everything else is accessible from More, on desktop and mobile.", status: "shipped", eta: "Live · Oct 2026" },
  { icon: BookOpenCheck, title: "Courses and Learning Tools", desc: "Structured tracks, the trading guide, practice lessons and local progress tracking are already available.", status: "shipped", eta: "Already available" },
  { icon: Trophy, title: "Virtual Trading and Daily Practice", desc: "Practice with virtual funds, review your portfolio, try daily exercises and optionally challenge a friend.", status: "shipped", eta: "Already available" },
  { icon: Sparkles, title: "One Beginner Journey", desc: "Connect first lessons, a guided virtual trade, portfolio reflection and a next-lesson suggestion into one discoverable progression, without requiring an account for core practice.", status: "in-progress", eta: "Target · 21 Nov 2026" },
  { icon: LineChart, title: "Better Educational Examples", desc: "Improve explanations, sourced examples, calculation clarity, simulated-data labels and useful exercises that readers can check independently.", status: "in-progress", eta: "Target · 21 Nov 2026" },
  { icon: Users2, title: "Contact and Feedback Improvements", desc: "Make contact and reporting confusing pages easier. Use actual reader feedback to identify, prioritize and fix friction.", status: "in-progress", eta: "Target · 21 Nov 2026" },
  { icon: Globe2, title: "Comfortable on Every Screen", desc: "Review desktop, tablet and mobile navigation, readable type, keyboard access, working deep links, and consistent page footers, validated before Cloudflare releases.", status: "in-progress", eta: "Target · 21 Nov 2026" },
  { icon: BarChart3, title: "More Meaningful Progress Cues", desc: "Explore clear continue-learning pathways and beginner-friendly progress explanations that do not confuse scores with trading competence.", status: "planned", eta: "Exploring after 21 Nov" },
];

const STATUS_STYLES: Record<RoadmapItem["status"], string> = {
  "shipped": "bg-sky-500/15 text-sky-300 [.light_&]:text-sky-800 border-sky-500/30",
  "shipping-soon": "bg-emerald-500/15 text-emerald-300 [.light_&]:text-emerald-800 border-emerald-500/30",
  "in-progress": "bg-amber-500/15 text-amber-300 [.light_&]:text-amber-800 border-amber-500/30",
  "planned": "bg-fuchsia-500/15 text-fuchsia-300 [.light_&]:text-fuchsia-800 border-fuchsia-500/30",
};

const STATUS_LABEL: Record<RoadmapItem["status"], string> = {
  "shipped": "Shipped",
  "shipping-soon": "Shipping soon",
  "in-progress": "In progress",
  "planned": "Planned",
};

export default function Roadmap() {
  const title = "TradeHQ Roadmap | Free Beginner Learning";
  const description = "See what TradeHQ has shipped and the goals by November 21, 2026: a connected beginner journey, better lessons, accessible design and feedback.";
  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={`${SITE_DOMAIN}/roadmap`} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={`${SITE_DOMAIN}/roadmap`} />
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
        {/* premium background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-fuchsia-500/10 rounded-full blur-3xl" />
        </div>

        <Navigation />

        <main className="flex-1 container mx-auto px-4 pt-28 pb-20 max-w-5xl relative">
          <header className="mb-14 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/[0.03] backdrop-blur text-xs uppercase tracking-widest text-muted-foreground mb-5">
              <Sparkles className="h-3 w-3 text-emerald-400" /> What's coming next
            </div>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight bg-gradient-to-br from-white via-emerald-200 to-emerald-400 [.light_&]:from-emerald-950 [.light_&]:via-emerald-800 [.light_&]:to-emerald-700 bg-clip-text text-transparent">
              Learn. Practise. Grow.
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto">
              Our public product roadmap: what works today and what we aim to improve by 21 November 2026. Always focused on learning with virtual funds.
            </p>
          </header>

          <div className="grid md:grid-cols-2 gap-4">
            {ITEMS.map((item, i) => {
              const Icon = item.icon;
              return (
                <Card
                  key={i}
                  className="group p-6 bg-white/[0.02] border border-white/10 backdrop-blur-xl hover:border-emerald-500/40 hover:bg-white/[0.04] transition-all duration-300 relative overflow-hidden"
                >
                  <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition" />
                  <div className="flex items-start justify-between mb-4 relative">
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                      <Icon className="h-5 w-5 text-emerald-400" />
                    </div>
                    <Badge variant="outline" className={STATUS_STYLES[item.status]}>
                      {STATUS_LABEL[item.status]}
                    </Badge>
                  </div>
                  <h2 className="text-lg font-semibold tracking-tight mb-2">{item.title}</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                  <div className="mt-4 pt-4 border-t border-white/5 text-xs text-muted-foreground/70">
                    Timeline: <span className="text-emerald-400/80 [.light_&]:text-emerald-800">{item.eta}</span>
                  </div>
                </Card>
              );
            })}
          </div>

          <section className="mt-12 max-w-3xl mx-auto space-y-4" aria-labelledby="roadmap-status-explained">
            <h2 id="roadmap-status-explained" className="text-2xl font-semibold">How to read this roadmap</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Shipped means a working version exists, not that it is perfect. In progress means an active priority.
              Planned means an idea under consideration. November 21, 2026 is our target for improvements, not a guaranteed release date.
              We'll update the page when changes are verified as available.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We prioritize what confuses beginners: knowing where to start, understanding examples,
              making the first virtual trade, interpreting the portfolio, and choosing a next lesson.
              Clear sources, transparent simulated data, and useful contact options matter more than hype.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              TradeHQ remains educational practice only. No real-money trading, guaranteed returns,
              personalized investment recommendations or buy/sell signals. Core practice does not require an account.
            </p>
            <p className="text-xs text-muted-foreground/60 italic">Updated 31 October 2026 · Educational simulation only — not financial advice.</p>
          </section>

          <Card className="mt-12 p-8 text-center bg-gradient-to-br from-emerald-500/10 via-transparent to-fuchsia-500/10 border-white/10 backdrop-blur-xl">
            <h3 className="text-xl font-semibold mb-2">Want a feature on this list?</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Share an idea through our <a href="/contact" className="text-emerald-400 underline-offset-4 hover:underline">contact page</a> or the <a href="/reviews" className="text-emerald-400 underline-offset-4 hover:underline">reviews page</a>. We use genuine feedback to prioritize changes.
            </p>
            <p className="mt-4 text-xs text-muted-foreground/60 italic">(Educational simulation only — not financial advice.)</p>
          </Card>
        </main>

        <MegaFooter />
      </div>
    </>
  );
}