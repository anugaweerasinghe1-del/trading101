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
  { icon: BookOpenCheck, title: "Expanded Learning Courses", desc: "Four structured tracks — options, futures, macro reading and trading psychology — each with quizzes and a completion badge. Now live at /courses.", status: "shipped", eta: "Shipped Jul 2026" },
  { icon: GraduationCap, title: "Guided Learning Pathways", desc: "Personalised next-lesson suggestions based on what you've already studied. Live on the Learn hub — the 'Picked for you' card resumes your last lesson or points you to the best starting point.", status: "shipped", eta: "Shipped Jul 2026" },
  { icon: Bell, title: "Daily Challenge Streak", desc: "Local streak tracking is live on the daily challenge. Scheduled daily or watchlist reminder notifications are not currently implemented.", status: "shipped", eta: "Shipped Jul 2026" },
  { icon: Trophy, title: "Public Trader Profiles", desc: "New accounts start with a public profile and can share its /trader/{username} link. Account holders can make the profile private at any time. /trader/me is the private account view, not a public sharing address.", status: "shipped", eta: "Shipped Jul 2026" },
  { icon: Globe2, title: "Localised Country Pages", desc: "Free tailored guides for Sri Lanka, India, Philippines, Pakistan and Nigeria — local regulator, exchange, tax notes and student angle. Live under /learn/country.", status: "shipped", eta: "Shipped Jul 2026" },
  { icon: UserCircle2, title: "Optional Email + Google Sign-In", desc: "Optional sign-in supports profile and community features when the service is available. Core trading works as a guest. Account cash, positions and server-recorded trades restore across devices when available; journals and course progress remain browser-held.", status: "shipped", eta: "Shipped Aug 2026" },
  { icon: Users2, title: "Challenge a Friend", desc: "Share an invite link and run a 30-day head-to-head practice duel. Both sides are scored on percentage return from their own recorded starting balance, with a live scoreboard and a Duels tab on the leaderboard.", status: "shipped", eta: "Shipped Aug 2026" },
  { icon: LineChart, title: "Hypothetical Portfolio Scenarios", desc: "Explore explicit assumptions for future practice paths. These would be hypothetical scenarios, not calibrated forecasts or evidence that past results will repeat.", status: "planned", eta: "No confirmed date" },
  { icon: BarChart3, title: "Embeddable Live Price Widgets", desc: "A proposed embeddable price widget. Data source, update frequency and access requirements are not yet specified.", status: "planned", eta: "No confirmed date" },
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
  const title = "TradeHQ Roadmap — What's Coming Next | Future Updates";
  const description = "Review existing TradeHQ features and proposed portfolio projections and embeddable price widgets. Planned features have no confirmed release date.";
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
              The Future of TradeHQ
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto">
              We're building a free educational practice-trading experience — and keeping it 100% free, forever. Here's what's on deck.
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
                    Target: <span className="text-emerald-400/80 [.light_&]:text-emerald-800">{item.eta}</span>
                  </div>
                </Card>
              );
            })}
          </div>

          <section className="mt-12 max-w-3xl mx-auto space-y-4">
            <h2 className="text-2xl font-semibold">What the statuses actually mean</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              "Shipped" identifies an implemented feature. Profile and community features require an
              account and an available backend service; this list does not certify service availability. Shipped items still get refined as people use
              them, and the date shown is when the first working version went live rather than when
              the idea started. "Planned" identifies a proposal with no confirmed release date; because TradeHQ is built by one
              person and given away free, a planned date can slip when something more useful takes
              priority. Nothing on this page is a promise of a paid feature, because there are none.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Items reach the list in one of two ways. Most come from watching where people get stuck:
              the courses were added because the glossary alone left readers without a sequence to
              follow, and the country guides exist because a large share of visitors were trying to
              work out whether any of this applied where they live. The rest come from messages
              readers send through the contact page, which is the fastest way to get something
              considered.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Two things will not appear on this roadmap. There will be no real-money trading, because
              this project is designed for education using virtual funds. Real-money services have
              product- and jurisdiction-specific legal requirements outside its scope. And there will be no signals, trade alerts or recommendations, because
              telling people what to buy is precisely the failure mode this project was built to
              replace with practice.
            </p>
            <p className="text-xs text-muted-foreground/60 italic">(Educational simulation only — not financial advice.)</p>
          </section>

          <Card className="mt-12 p-8 text-center bg-gradient-to-br from-emerald-500/10 via-transparent to-fuchsia-500/10 border-white/10 backdrop-blur-xl">
            <h3 className="text-xl font-semibold mb-2">Want a feature on this list?</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Drop a review on our <a href="/reviews" className="text-emerald-400 underline-offset-4 hover:underline">reviews page</a> with your idea — every suggestion gets read.
            </p>
            <p className="mt-4 text-xs text-muted-foreground/60 italic">(Educational simulation only — not financial advice.)</p>
          </Card>
        </main>

        <MegaFooter />
      </div>
    </>
  );
}