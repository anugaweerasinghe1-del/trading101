import { useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Navigation } from "@/components/Navigation";
import { MegaFooter } from "@/components/MegaFooter";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, Award, Share2, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { getPortfolio, calculateRealizedPnL, calculateMaxDrawdown, calculateClosedTradeStats } from "@/lib/portfolio";
import { STARTING_BALANCE_LABEL } from "@/lib/constants";
import { loadProgress } from "@/lib/courseProgress";
import { useCourseCatalog } from "@/hooks/useCourseCatalog";
import { EducationalDisclaimer } from "@/components/EducationalDisclaimer";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const DOMAIN = "https://www.thetradehq.com";

function useTraderStats() {
  return useMemo(() => {
    const p = getPortfolio();
    const start = 100_000;
    const totalPnL = p.totalValue - start;
    const totalPnLPct = (totalPnL / start) * 100;
    const realized = calculateRealizedPnL(p);
    const maxDD = calculateMaxDrawdown();
    const trades = p.trades.length;
    const winRate = calculateClosedTradeStats(p).winRate;

    return { p, totalPnL, totalPnLPct, realized, maxDD, trades, winRate };
  }, []);
}

export default function TraderProfile() {
  const s = useTraderStats();
  const { tracks } = useCourseCatalog();
  const badges = useMemo(() => {
    const names = new Map(tracks.map((track) => [track.slug, track.badge.name]));
    return Object.entries(loadProgress().tracks)
      .filter(([, progress]) => progress.badgeEarnedAt)
      .map(([track]) => ({ track, name: names.get(track) ?? `Course completion: ${track.replace(/-/g, " ")}` }));
  }, [tracks]);
  const { user, profile, refreshProfile } = useAuth();
  const [visibilityBusy, setVisibilityBusy] = useState(false);

  const setPublicVisibility = async (isPublic: boolean) => {
    if (!user || visibilityBusy) return;
    setVisibilityBusy(true);
    const { error } = await supabase
      .from("profiles")
      .update({ is_public: isPublic })
      .eq("id", user.id);
    if (error) {
      toast.error("Could not update profile visibility.");
    } else {
      await refreshProfile();
      toast.success(isPublic ? "Public profile enabled." : "Profile is now private.");
    }
    setVisibilityBusy(false);
  };
  const path = "/trader/me";
  const title = "My Trader Profile — Practice Portfolio Stats | TradeHQ";
  const description = "Local snapshot of TradeHQ practice statistics. Signed-in users can choose whether their backend profile is public. Educational simulation only, not financial advice.";

  const share = async () => {
    if (!profile?.is_public || !profile.username) {
      toast.error("Turn on public profile visibility before sharing a public profile link.");
      return;
    }
    const url = `${window.location.origin}/trader/${encodeURIComponent(profile.username)}`;
    const text = `My TradeHQ practice portfolio: ${s.totalPnLPct >= 0 ? "+" : ""}${s.totalPnLPct.toFixed(1)}% on a ${STARTING_BALANCE_LABEL} virtual account · ${s.trades} trades · ${s.winRate}% win rate. Client-synced simulated stats; not independently verified.`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "My TradeHQ trader profile", text, url });
      } else {
        await navigator.clipboard.writeText(`${text} ${url}`);
        toast.success("Profile link copied to clipboard");
      }
    } catch {}
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
        <meta name="robots" content="noindex, follow" />
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        <Navigation />
        <main className="flex-1 container mx-auto px-4 pt-28 pb-20 max-w-4xl">
          <Breadcrumbs items={[{ label: "Portfolio", href: "/portfolio" }, { label: "Trader profile" }]} />

          <header className="mt-8 mb-10">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-xs uppercase tracking-widest text-emerald-400 mb-3">
                  <Trophy className="h-3 w-3" /> Practice profile
                </div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">My TradeHQ profile</h1>
                <p className="text-sm text-muted-foreground mt-2 max-w-xl">
                  A local snapshot of this browser's paper-trading record. All figures are simulated.
                  Public account visibility is optional and controlled below. Educational simulation only — not financial advice.
                </p>
              </div>
              <button
                onClick={share}
                disabled={!profile?.is_public}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-black font-semibold hover:bg-emerald-400 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Share2 className="w-4 h-4" /> Share public profile
              </button>
            </div>
          </header>

          {user && profile && (
            <Card className="p-5 mb-8 bg-white/[0.02] border-white/10">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-semibold">Public profile visibility</h2>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xl">
                    Profiles start public so they can appear in TradeHQ's community features. Turn this off at any
                    time to hide your username, profile details and selected practice statistics from public pages.
                  </p>
                </div>
                <Switch
                  checked={profile.is_public}
                  disabled={visibilityBusy}
                  onCheckedChange={setPublicVisibility}
                  aria-label="Public profile visibility"
                />
              </div>
            </Card>
          )}

          <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
            {[
              { label: "Portfolio value", value: `$${s.p.totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}` },
              { label: "Total P&L", value: `${s.totalPnL >= 0 ? "+" : ""}${s.totalPnLPct.toFixed(1)}%`, color: s.totalPnL >= 0 ? "text-emerald-400" : "text-rose-400" },
              { label: "Trades placed", value: s.trades.toString() },
              { label: "Win rate", value: `${s.winRate}%` },
            ].map((k) => (
              <Card key={k.label} className="p-5 bg-white/[0.02] border-white/10">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{k.label}</p>
                <p className={`text-xl font-bold ${k.color ?? ""}`}>{k.value}</p>
              </Card>
            ))}
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-400" /> Course badges earned
            </h2>
            {badges.length === 0 ? (
              <Card className="p-6 bg-white/[0.02] border-white/10 text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  No completion badges yet. Finish a structured course to earn your first.
                </p>
                <Link
                  to="/courses"
                  className="inline-flex items-center gap-1 text-emerald-400 font-semibold text-sm hover:underline"
                >
                  Browse courses <ArrowRight className="w-4 h-4" />
                </Link>
              </Card>
            ) : (
              <div className="flex flex-wrap gap-2">
                {badges.map((b) => (
                  <Badge key={b.track} variant="outline" className="border-emerald-500/30 bg-emerald-500/5 text-emerald-300 px-3 py-2 text-sm">
                    <Sparkles className="w-3 h-3 mr-1" /> {b.name}
                  </Badge>
                ))}
              </div>
            )}
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" /> Risk metrics
            </h2>
            <div className="grid md:grid-cols-2 gap-3">
              <Card className="p-4 bg-white/[0.02] border-white/10">
                <p className="text-xs text-muted-foreground">Realised P&amp;L</p>
                <p className={`text-lg font-semibold ${s.realized >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  ${s.realized.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </Card>
              <Card className="p-4 bg-white/[0.02] border-white/10">
                <p className="text-xs text-muted-foreground">Max drawdown</p>
                <p className="text-lg font-semibold text-rose-400">-{s.maxDD.toFixed(1)}%</p>
              </Card>
            </div>
          </section>

          <EducationalDisclaimer variant="footer" />
        </main>
        <MegaFooter />
      </div>
    </>
  );
}
