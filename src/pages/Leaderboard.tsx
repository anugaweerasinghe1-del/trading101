import { Helmet } from "react-helmet-async";
import { Navigation } from "@/components/Navigation";
import { MegaFooter } from "@/components/MegaFooter";
import { Link } from "react-router-dom";
import { Trophy, ArrowRight, Medal, Home, ChevronRight, Users, Swords, RefreshCw, Loader2, ChevronDown, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AssetFAQSection } from "@/components/AssetFAQSection";
import { EducationalDisclaimer } from "@/components/EducationalDisclaimer";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PRICE_REFRESH_COPY, priceLabel, quoteTimeLabel } from "@/lib/practicePricing";
import { pushPortfolio, reconcilePortfolio, startRankedPractice } from "@/lib/cloudPortfolio";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { STARTING_BALANCE_LABEL } from "@/lib/constants";
import { compareMemberRank } from "@/lib/memberActivity";

interface BoardRow {
  userId: string;
  username: string;
  country: string | null;
  portfolioValue: number | null;
  pnlPct: number | null;
  trades: number;
  previousTrades: number;
  pricedAt: string | null;
  observedAt: string | null;
  priceStatus: string;
  portfolioStatus: string;
  practiceRank: number | null;
}

interface PreviousRow { userId: string; username: string; country: string | null; portfolioValue: number; pnlPct: number; trades: number; reportedAt: string }

interface DuelRow {
  id: string;
  code: string;
  creatorName: string;
  opponentName: string;
  creatorPct: number;
  opponentPct: number;
  endsAt: string;
  finished: boolean;
}

const LEADERBOARD_FAQS = [
  {
    question: "Is the TradeHQ leaderboard real?",
    answer:
      "Ranked practice uses server-recorded orders. Previous results preserve earlier browser-reported summaries separately and do not enter current rankings. Both display simulated practice, not audited investment performance.",
  },
  {
    question: "How do I climb the leaderboard?",
    answer:
      "Every public member appears, including accounts with no trades yet. Ranked members appear first in return-rank order; unranked members follow, ordered by practice activity. Comparable ranked portfolios receive a rank after their first server-recorded trade, calculated from simulated return against a $100,000 virtual starting balance. Ranks and display order update automatically when this page refreshes. Previous activity never changes a return rank. A rank is not evidence of real-money skill.",
  },
  {
    question: "Do I need an account to compete?",
    answer:
      "An account and a public profile are needed to appear on the board. Account cash, positions and server-recorded trades restore across devices when available; earlier guest history, journals and course progress remain browser-held. Core learning tools work without signing up.",
  },
  {
    question: "What data does TradeHQ store if I sign up?",
    answer:
      "Optional accounts use authentication data and can store a username, profile fields, simulated cash, positions and server-recorded practice trades for restoration across devices. Previous reported summary snapshots are also retained; their public visibility follows your profile setting. TradeHQ does not require brokerage credentials or a real-money deposit.",
  },
  {
    question: "Can I stay private?",
    answer:
      "Yes. Profiles can be switched to private at any time from your trader profile page, which hides your data from new leaderboard requests while keeping your account. Open pages reflect the change on refresh.",
  },
];

const FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: LEADERBOARD_FAQS.map((f) => ({
    "@type": "Question",
    name: f.question,
    acceptedAnswer: { "@type": "Answer", text: f.answer },
  })),
};

function getRankIcon(rank: number) {
  if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-400" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-gray-300" />;
  if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
  return <span className="text-sm font-mono text-muted-foreground w-5 text-center">{rank}</span>;
}

export default function Leaderboard() {
  const { user, profile } = useAuth();
  const userId = user?.id;
  const [rows, setRows] = useState<BoardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [ranked, setRanked] = useState<boolean | null>(null);
  const [restartOpen, setRestartOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [tab, setTab] = useState<"traders" | "previous" | "duels">("traders");
  const [previousRows, setPreviousRows] = useState<PreviousRow[]>([]);
  const [previousError, setPreviousError] = useState(false);
  const loadBusy = useRef(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [duels, setDuels] = useState<DuelRow[]>([]);
  const [duelsLoading, setDuelsLoading] = useState(true);

  const load = useCallback(async (quiet = false) => {
    if (loadBusy.current) return;
    loadBusy.current = true;
    if (!quiet) setLoading(true);
    try {
      const [cloud, previous] = await Promise.all([
        supabase.rpc("get_public_practice_members", { p_limit: 500 }),
        supabase.rpc("get_previous_practice_results", { p_limit: 500 }),
      ]);
      const previousTrades = new Map((previous.error ? [] : previous.data ?? []).map(row => [row.user_id, Number(row.trades)]));
      const rankedRows = cloud.error ? [] : (cloud.data ?? []).map(row => ({
        userId: row.user_id, username: row.username, country: row.country,
        portfolioValue: row.portfolio_value === null ? null : Number(row.portfolio_value), pnlPct: row.pnl_pct === null ? null : Number(row.pnl_pct),
        trades: Number(row.trades), previousTrades: previousTrades.get(row.user_id) ?? 0, pricedAt: row.priced_at ?? null, observedAt: row.observed_at ?? null,
        priceStatus: row.price_status, portfolioStatus: row.portfolio_status, practiceRank: row.practice_rank,
      })).sort(compareMemberRank);
      const historicRows = previous.error ? [] : (previous.data ?? []).map(row => ({
        userId: row.user_id, username: row.username, country: row.country,
        portfolioValue: Number(row.portfolio_value), pnlPct: Number(row.pnl_pct),
        trades: Number(row.trades), reportedAt: row.reported_at,
      }));
      setRows(rankedRows);
      setPreviousRows(historicRows);
      setPreviousError(!!previous.error);
      setLoadError(!!cloud.error);
      if (!cloud.error && !previous.error) setLastRefreshed(new Date());
      if (cloud.error && !quiet) toast.error("Could not load current rankings. Please try again.");
    } catch (error) {
      console.error("Leaderboard load failed", error);
      setRows([]);
      setPreviousRows([]);
      setPreviousError(true);
      setLoadError(true);
      if (!quiet) toast.error("Could not load rankings. Please try again.");
    } finally {
      loadBusy.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const refresh = () => { if (!document.hidden) void load(true); };
    const timer = window.setInterval(refresh, 60000);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", refresh); window.removeEventListener("focus", refresh); };
  }, [load, profile?.is_public]);

  useEffect(() => {
    let cancelled = false;
    setRanked(null);
    if (userId) reconcilePortfolio(userId).then(p => { if (!cancelled) setRanked(p.ranked); }).catch(() => {});
    return () => { cancelled = true; };
  }, [userId]);

  // Head-to-head duels between members with public profiles.
  useEffect(() => {
    (async () => {
      setDuelsLoading(true);
      const { data, error } = await supabase.rpc("get_public_practice_duels", { p_limit: 50 });
      if (error) { setDuels([]); setDuelsLoading(false); return; }
      const list = (data ?? []) as unknown as {
        id: string; code: string; creator_name: string; opponent_name: string;
        creator_start_value: number; opponent_start_value: number;
        creator_value: number; opponent_value: number; ends_at: string; settled_at: string | null;
      }[];
      const mapped = list.filter(Boolean).map(d => ({
        id: d.id, code: d.code, creatorName: d.creator_name, opponentName: d.opponent_name,
        creatorPct: (Number(d.creator_value) - Number(d.creator_start_value)) / Number(d.creator_start_value) * 100,
        opponentPct: (Number(d.opponent_value) - Number(d.opponent_start_value)) / Number(d.opponent_start_value) * 100,
        endsAt: d.ends_at, finished: !!d.settled_at,
      }));
      setDuels(mapped);
      setDuelsLoading(false);
    })();
  }, []);

  const handleSync = async () => {
    if (!user) return;
    setSyncing(true);
    try {
      await pushPortfolio(user.id);
      toast.success("Account portfolio refreshed.");
      await load();
    } catch (error) {
      console.error("Portfolio sync failed", error);
      toast.error("Could not sync your practice portfolio. Please try again.");
    } finally {
      setSyncing(false);
    }
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.thetradehq.com/" },
      { "@type": "ListItem", position: 2, name: "Leaderboard", item: "https://www.thetradehq.com/leaderboard" },
    ],
  };

  return (
    <>
      <Helmet>
        <title>Community Practice Board — TradeHQ Practice Stats</title>
        <meta name="description" content="Community practice board of public TradeHQ accounts using server-recorded simulated trades. Results are not independently verified or audited performance records." />
        <link rel="canonical" href="https://www.thetradehq.com/leaderboard" />
        <meta name="robots" content="index, follow" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="TradeHQ Community Practice Board" />
        <meta property="og:description" content="Public TradeHQ accounts ordered by simulated return rank, followed by unranked members. Results are not audited investment performance." />
        <meta property="og:url" content="https://www.thetradehq.com/leaderboard" />
        <meta property="og:image" content="https://www.thetradehq.com/og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content="TradeHQ" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="TradeHQ Community Practice Board" />
        <meta name="twitter:description" content="Public TradeHQ accounts ordered by simulated return rank, followed by unranked members. Stats are not independently verified." />
        <meta name="twitter:image" content="https://www.thetradehq.com/og-image.png" />
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(FAQ_SCHEMA)}</script>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="pt-28 pb-20">
          <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8" aria-label="Breadcrumb">
              <Link to="/" className="flex items-center gap-1 hover:text-primary transition-colors">
                <Home className="w-4 h-4" />
                <span>Home</span>
              </Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-foreground font-medium">Leaderboard</span>
            </nav>

            <header className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-xl">
                <p className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-primary">
                  <Users className="h-4 w-4" aria-hidden="true" /> The community
                </p>
              <h1 className="text-4xl md:text-5xl font-bold mb-3 tracking-tight">
                Leaderboard<span className="text-primary">.</span>
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                A place for every public member. Follow the community's practice portfolios and see how your progress compares.
              </p>
              <p className="mt-3 text-xs text-muted-foreground">Educational simulations · not audited investment performance.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 lg:max-w-xs lg:justify-end">
                {user ? (
                  <>
                    <Button onClick={handleSync} disabled={syncing} size="sm" className="!text-black font-semibold rounded-xl">
                      {syncing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                      Refresh portfolio
                    </Button>
                    <Button variant="outline" size="sm" className="rounded-xl" asChild>
<Link to="/trader/me">My profile</Link>
</Button>
                  </>
                ) : (
                  <Button size="sm" className="!text-black font-semibold rounded-xl" asChild>
<Link to="/auth">Create a free account to join</Link>
</Button>
                )}
                <Button variant="outline" size="sm" className="rounded-xl" asChild>
<Link to="/challenge">
                    <Swords className="w-4 h-4 mr-2" /> Challenge a friend
                  </Link>
</Button>
              </div>
            </header>

            {user && ranked === false && (
              <div className="mb-6 rounded-xl border border-white/10 p-4 text-sm">
                <p>Your imported practice portfolio is saved to your account. It cannot enter rankings because its earlier trades were recorded in your browser.</p>
                <Button variant="outline" className="mt-3" onClick={() => setRestartOpen(true)} disabled={syncing}>Start fresh ranked practice</Button>
              </div>
            )}
            <AlertDialog open={restartOpen} onOpenChange={setRestartOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Start fresh ranked practice?</AlertDialogTitle>
                  <AlertDialogDescription>Your current account portfolio will be archived, and a new portfolio will start with $100,000 virtual cash and no positions. Your old practice copy is preserved in account and browser backups. Current duels must finish first.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep current portfolio</AlertDialogCancel>
                  <AlertDialogAction onClick={async () => {
                    if (!user) return;
                    setSyncing(true);
                    try { await startRankedPractice(user.id); setRanked(true); await load(); toast.success("Fresh ranked portfolio started."); }
                    catch (error) { toast.error((error as { message?: string }).message || "Could not start ranked practice."); }
                    finally { setSyncing(false); }
                  }}>Start fresh</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Tabs: overall board vs head-to-head duels */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-5">
            <div className="inline-flex gap-1 rounded-2xl border border-border bg-card p-1">
              {([
                { id: "traders", label: "Public members" },
                { id: "previous", label: "Previous results" },
                { id: "duels", label: "Duels" },
              ] as const).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  aria-pressed={tab === t.id}
                  className={`flex-1 sm:flex-none px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                    tab === t.id
                      ? "bg-primary/10 text-primary shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
              <p className="flex items-center gap-2 text-xs text-muted-foreground" role="status">
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
                {loading ? "Loading board…" : loadError ? "Update unavailable" : lastRefreshed ? `Updated ${lastRefreshed.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}` : "Waiting for update"}
              </p>
            </div>
            <details className="group mb-5 rounded-xl border border-border/60 px-4 py-3 text-xs text-muted-foreground">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
                <span>Prices may be delayed or cached. <span className="text-foreground">How updates work</span></span>
                <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" />
              </summary>
              <div className="pt-3 space-y-2 leading-relaxed">
                <p>{PRICE_REFRESH_COPY}</p>
                <p>This page refreshes every minute while visible. {lastRefreshed && `Last loaded ${lastRefreshed.toLocaleTimeString()}.`}</p>
                <p>Ranked practice uses server-recorded orders. Imported portfolios and members with no trades remain unranked. Previous results preserve browser-reported summaries separately.</p>
                <Link to="/trader/me" className="inline-flex items-center gap-1.5 text-primary hover:underline"><ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />Manage my public/private visibility</Link>
              </div>
            </details>
            {tab === "traders" ? (
              <section aria-label="Public members" className="bg-card border border-border rounded-2xl overflow-hidden shadow-[0_12px_40px_-24px_rgba(0,0,0,0.5)]">
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-5 border-b border-border">
                  <div>
                    <h2 className="font-semibold text-sm">Public members <span className="ml-1.5 rounded-md bg-muted px-2 py-0.5 text-xs tabular-nums text-muted-foreground">{loading || loadError ? "—" : rows.length}</span></h2>
                    <p className="mt-1 text-xs text-muted-foreground">No minimum trades to appear</p>
                  </div>
                  <span className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground">Sorted by return rank</span>
                </div>
                <div className="hidden md:grid grid-cols-[minmax(0,1fr)_140px_110px_90px] gap-4 px-6 py-3 text-[11px] font-medium tracking-wider text-muted-foreground uppercase border-b border-border/60 bg-muted/20">
                  <span>Member / return rank</span><span className="text-right">Virtual value</span><span className="text-right">Ranked return</span><span className="text-right">Trades</span>
                </div>
                {loading ? <p className="p-8 text-center">Loading public members…</p>
                  : loadError ? <div className="p-8 text-center"><p>Could not load public members.</p><Button variant="outline" onClick={() => void load()}>Try again</Button></div>
                  : rows.length === 0 ? <p className="p-8 text-center">No public members yet.</p>
                  : rows.map(trader => (
                    <article key={trader.userId} aria-label={`Practice portfolio of ${trader.username}`} className={`border-b border-border/60 last:border-b-0 ${profile?.id === trader.userId ? "bg-primary/[0.05] border-l-2 border-l-primary" : ""}`}>
                      <Link to={`/trader/${trader.username}`} className="grid grid-cols-3 md:grid-cols-[minmax(0,1fr)_140px_110px_90px] items-center gap-x-4 gap-y-4 px-4 md:px-6 pt-4 pb-2 hover:bg-muted/30 transition-colors">
                        <div className="col-span-3 md:col-span-1 flex items-center gap-3 min-w-0">
                          <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/40 text-sm font-semibold text-muted-foreground">{trader.username.slice(0, 1).toUpperCase()}</span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="truncate font-semibold text-sm" title={trader.username}>{trader.username}</span>
                              {profile?.id === trader.userId && <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">You</span>}
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                              {trader.practiceRank !== null ? <span className="inline-flex items-center gap-1.5">{trader.practiceRank <= 3 && <span aria-hidden="true" className="[&>svg]:h-3.5 [&>svg]:w-3.5">{getRankIcon(trader.practiceRank)}</span>}Return rank #{trader.practiceRank}</span> : <span>{trader.portfolioStatus === "imported" ? "Imported · unranked" : trader.trades === 0 && trader.previousTrades === 0 ? "No trades yet · unranked" : "Unranked"}</span>}
                              {trader.country && <span>· {trader.country}</span>}
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground md:hidden" aria-hidden="true" />
                        </div>
                        <div className="md:text-right">
                          <span className="block mb-1 text-[10px] text-muted-foreground md:hidden">Virtual value</span>
                          <span className="font-mono text-sm tabular-nums">{trader.portfolioValue === null ? "—" : `$${trader.portfolioValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}</span>
                        </div>
                        <div className="text-center md:text-right">
                          <span className="block mb-1 text-[10px] text-muted-foreground md:hidden">Ranked return</span>
                          <span className={`font-mono text-sm tabular-nums ${trader.pnlPct === null || trader.pnlPct === 0 ? "text-muted-foreground" : trader.pnlPct > 0 ? "text-profit" : "text-loss"}`}>{trader.pnlPct === null ? "—" : `${trader.pnlPct >= 0 ? "+" : ""}${trader.pnlPct.toFixed(1)}%`}</span>
                        </div>
                        <div className="text-right">
                          <span className="block mb-1 text-[10px] text-muted-foreground md:hidden">Server trades</span>
                          <span className="font-mono text-sm tabular-nums text-muted-foreground">{trader.trades}</span>
                        </div>
                      </Link>
                      <details className="group px-4 md:px-6 pb-3 text-[11px] text-muted-foreground">
                        <summary className="flex w-fit cursor-pointer list-none items-center gap-1 py-1 hover:text-foreground [&::-webkit-details-marker]:hidden">
                          Portfolio details<span className="sr-only"> for {trader.username}</span><ChevronDown className="h-3 w-3 transition-transform group-open:rotate-180" aria-hidden="true" />
                        </summary>
                        <div className="mt-2 rounded-xl border border-border/60 bg-background/50 p-3 space-y-1.5 leading-relaxed">
                          <p>{trader.portfolioStatus === "imported" ? "Imported practice · unranked" : trader.trades === 0 ? trader.previousTrades > 0 ? "Previous reported activity · unranked" : "No server-recorded trades yet" : "Server-recorded practice"}</p>
                          <p>{priceLabel(trader.priceStatus)}</p>
                          {quoteTimeLabel(trader.pricedAt, trader.observedAt) && <p>{quoteTimeLabel(trader.pricedAt, trader.observedAt)}</p>}
                          {trader.previousTrades > 0 && <p>{trader.previousTrades} previous reported trades · unverified</p>}
                          <Link to={`/trader/${trader.username}`} className="inline-flex items-center gap-1 text-primary hover:underline">View profile<ArrowRight className="h-3 w-3" aria-hidden="true" /></Link>
                        </div>
                      </details>
                    </article>
                  ))}
                <p className="border-t border-border/60 px-4 sm:px-6 py-3 text-[11px] text-muted-foreground leading-relaxed">Ranked members first, by simulated return. Unranked members follow, ordered by practice activity. Order updates automatically every minute while this page is visible.</p>
              </section>
            ) : tab === "previous" ? (
              <section aria-labelledby="previous-results-heading" className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-border">
                  <h2 id="previous-results-heading" className="text-sm font-semibold">Previous results</h2>
                  <p className="mt-2 text-xs text-muted-foreground">Browser-reported snapshots · unverified · excluded from current rankings.</p>
                  <details className="mt-3 text-xs text-muted-foreground">
                  <summary className="cursor-pointer hover:text-foreground">About these results</summary>
                  <p className="mt-2 leading-relaxed">
                    Saved summaries from the earlier browser-based simulator. These figures were reported by each browser and were not verified by the server. They are preserved as previous practice results and do not enter current rankings. All saved public summaries appear, including zero-trade accounts. Making your profile private hides your result. These snapshots do not update with current prices.
                  </p>
                  </details>
                </div>
                {loading ? (
                  <p className="p-8 text-center text-muted-foreground">Loading previous results…</p>
                ) : previousError ? (
                  <div className="p-8 text-center">
                    <p className="text-muted-foreground mb-4">Could not load previous results.</p>
                    <Button variant="outline" onClick={() => void load()}>Try again</Button>
                  </div>
                ) : previousRows.length === 0 ? (
                  <p className="p-8 text-center text-muted-foreground">No previous public results are available.</p>
                ) : (
                  <>
                    <div className="hidden md:grid grid-cols-[minmax(0,1fr)_140px_110px_90px] gap-4 px-6 py-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground border-b border-border/60 bg-muted/20">
                      <span>Trader</span><span className="text-right">Reported virtual value</span><span className="text-right">Reported return</span><span className="text-right">Reported trades</span>
                    </div>
                    {previousRows.map(trader => (
                      <Link key={trader.userId} to={`/trader/${trader.username}`} className="grid grid-cols-3 md:grid-cols-[minmax(0,1fr)_140px_110px_90px] items-center gap-4 px-4 md:px-6 py-4 border-b border-border/60 last:border-b-0 hover:bg-muted/30 transition-colors">
                        <div className="col-span-3 md:col-span-1 min-w-0">
                          <span className="block truncate font-semibold text-sm" title={trader.username}>{trader.username}</span>
                          <span className="block text-xs text-muted-foreground mt-1">Last reported {new Date(trader.reportedAt).toLocaleDateString()}</span>
                        </div>
                        <div className="md:text-right"><span className="block mb-1 text-[10px] text-muted-foreground md:hidden">Reported value</span><span className="font-mono text-sm tabular-nums">${trader.portfolioValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></div>
                        <div className="text-center md:text-right"><span className="block mb-1 text-[10px] text-muted-foreground md:hidden">Reported return</span><span className="font-mono text-sm tabular-nums">{trader.pnlPct >= 0 ? "+" : ""}{trader.pnlPct.toFixed(1)}%</span></div>
                        <div className="text-right"><span className="block mb-1 text-[10px] text-muted-foreground md:hidden">Reported trades</span><span className="font-mono text-sm tabular-nums text-muted-foreground">{trader.trades}</span></div>
                      </Link>
                    ))}
                  </>
                )}
              </section>
            ) : (
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                {duelsLoading ? (
                  <div className="py-16 text-center text-muted-foreground text-sm">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-3" />
                    Loading duels…
                  </div>
                ) : duels.length === 0 ? (
                  <div className="py-16 px-6 text-center">
                    <Swords className="w-10 h-10 text-primary/60 mx-auto mb-4" />
                    <h2 className="text-lg font-semibold mb-2">No public duels yet</h2>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
                      Duels are 30-day head-to-head practice challenges between two members.
                      Both sides are compared by percentage change from their own recorded starting balance.
                      Scores are simulated practice statistics and are not independently verified.
                    </p>
                    <Button className="!text-black font-bold rounded-xl" asChild>
<Link to="/challenge">
                        Challenge a friend <ArrowRight className="ml-2 w-4 h-4" />
                      </Link>
</Button>
                  </div>
                ) : (
                  duels.map((d) => {
                    const creatorAhead = d.creatorPct >= d.opponentPct;
                    return (
                      <Link
                        key={d.id}
                        to={`/challenge/${d.code}`}
                        className="flex items-center justify-between gap-4 px-4 md:px-6 py-4 border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">
                            <span className={creatorAhead ? "text-foreground" : "text-muted-foreground"}>
                              {d.creatorName}
                            </span>
                            <span className="text-muted-foreground mx-2">vs</span>
                            <span className={!creatorAhead ? "text-foreground" : "text-muted-foreground"}>
                              {d.opponentName}
                            </span>
                          </p>
                          <p className="text-2xs text-muted-foreground mt-1">
                            {d.finished
                              ? "Finished"
                              : `Ends ${new Date(d.endsAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="outline" className={d.creatorPct >= 0 ? "text-profit border-profit/30" : "text-loss border-loss/30"}>
                            {d.creatorPct >= 0 ? "+" : ""}{d.creatorPct.toFixed(1)}%
                          </Badge>
                          <Badge variant="outline" className={d.opponentPct >= 0 ? "text-profit border-profit/30" : "text-loss border-loss/30"}>
                            {d.opponentPct >= 0 ? "+" : ""}{d.opponentPct.toFixed(1)}%
                          </Badge>
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            )}

            {/* How ranking works — replaces the old synthetic "next refresh" widget */}
            <section className="mt-12 grid gap-4 md:grid-cols-3">
              {[
                {
                  title: "Ranked by % return",
                  body: `Comparable ranked portfolios begin with the same ${STARTING_BALANCE_LABEL} of virtual capital, so rank reflects percentage return only — never account size.`,
                },
                {
                  title: "Everyone can appear",
                  body: "All public members appear. Accounts with no trades and imported portfolios remain unranked; comparable portfolios receive a rank after their first server-recorded trade.",
                },
                {
                  title: "You control visibility",
                  body: "New profiles start public and appear without a minimum trade count. You can make your profile private at any time from your trader profile page.",
                },
              ].map((c) => (
                <div key={c.title} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
                  <h3 className="font-semibold mb-2 text-sm">{c.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{c.body}</p>
                </div>
              ))}
            </section>

            <AssetFAQSection
              assetName="Leaderboard"
              assetSymbol="Leaderboard"
              faqs={LEADERBOARD_FAQS}
            />

            <EducationalDisclaimer variant="footer" />
          </div>
        </main>
        <MegaFooter />
      </div>
    </>
  );
}
