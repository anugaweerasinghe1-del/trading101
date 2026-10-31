import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { MegaFooter } from "@/components/MegaFooter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { EducationalDisclaimer } from "@/components/EducationalDisclaimer";
import { Loader2, Trophy, UserX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PRICE_REFRESH_COPY, priceLabel, quoteTimeLabel } from "@/lib/practicePricing";
import { SITE_DOMAIN, STARTING_BALANCE_LABEL } from "@/lib/constants";

interface PublicTraderData {
  username: string;
  country: string | null;
  bio: string | null;
  createdAt: string;
  showPublicTrades: boolean;
  stats: {
    portfolio_value: number;
    pnl_pct: number | null;
    trades: number;
    price_status: string;
    priced_at: string | null;
    observed_at: string | null;
    portfolio_status: string;
  } | null;
}

interface PublicTradeRow {
  asset_id: string; side: string; quantity: number; price: number; fee: number;
  total: number; realized_pnl: number | null; price_source: string; created_at: string;
}
export default function PublicTrader() {
  const { username = "" } = useParams();
  const [data, setData] = useState<PublicTraderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [publicTrades, setPublicTrades] = useState<PublicTradeRow[]>([]);
  const [historyUnavailable, setHistoryUnavailable] = useState(false);
  const [scenarioPercent, setScenarioPercent] = useState(-5);

  useEffect(() => {
    let active = true;
    let busy = false;
    const load = async () => {
      if (busy) return;
      busy = true;
      try {
      const { data: p } = await supabase
        .from("profiles")
        .select("id, username, country, bio, created_at, is_public, show_public_trades")
        .eq("username", username)
        .eq("is_public", true)
        .maybeSingle();

      if (!p) {
        if (active) {
          setData(null);
          setLoading(false);
        }
        return;
      }

      const [membersResult, historyResult] = await Promise.all([
        supabase.rpc("get_public_practice_members", { p_limit: 1, p_username: username }),
        p.show_public_trades
          ? supabase.rpc("get_public_practice_trades", { p_username: username, p_limit: 20 })
          : Promise.resolve({ data: [], error: null }),
      ]);
      const { data: members, error } = membersResult;
      const s = !error ? members?.[0] : null;
      if (!s) { if (active) { setData(null); setLoading(false); } return; }
      if (active) {
        setPublicTrades(!historyResult.error ? (historyResult.data ?? []) as PublicTradeRow[] : []);
        setHistoryUnavailable(!!historyResult.error);
        setData({
          username: p.username,
          country: p.country,
          bio: p.bio,
          createdAt: p.created_at,
          showPublicTrades: p.show_public_trades === true,
          stats: s.portfolio_value !== null
            ? {
                portfolio_value: Number(s.portfolio_value),
                pnl_pct: s.pnl_pct === null ? null : Number(s.pnl_pct),
                trades: s.trades,
                price_status: s.price_status, priced_at: s.priced_at, observed_at: s.observed_at, portfolio_status: s.portfolio_status,
              }
            : null,
        });
        setLoading(false);
      }
      } catch { if (active) { setData(null); setLoading(false); } }
      finally { busy = false; }
    };
    setLoading(true);
    void load();
    const refresh = () => { if (!document.hidden) void load(); };
    const timer = window.setInterval(refresh, 60000);
    document.addEventListener("visibilitychange", refresh);
    return () => { active = false; clearInterval(timer); document.removeEventListener("visibilitychange", refresh); };
  }, [username]);

  const title = data
    ? `${data.username} — Practice Trading Stats | TradeHQ`
    : "Trader profile | TradeHQ";
  const description = data
    ? `Public practice-trading record for ${data.username} on TradeHQ: simulated portfolio value, percentage return, server-recorded trade count on ${STARTING_BALANCE_LABEL} of virtual capital. Educational simulation only.`
    : "This TradeHQ trader profile is private or does not exist.";

  const schema = data
    ? {
        "@context": "https://schema.org",
        "@type": "ProfilePage",
        mainEntity: {
          "@type": "Person",
          name: data.username,
          url: `${SITE_DOMAIN}/trader/${data.username}`,
          ...(data.country ? { homeLocation: { "@type": "Place", name: data.country } } : {}),
        },
      }
    : null;

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={`${SITE_DOMAIN}/trader/${username}`} />
        <meta name="robots" content={data ? "index, follow" : "noindex, follow"} />
        {schema && <script type="application/ld+json">{JSON.stringify(schema)}</script>}
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        <Navigation />
        <main className="flex-1 container mx-auto px-4 pt-28 pb-20 max-w-4xl">
          <Breadcrumbs items={[{ label: "Leaderboard", href: "/leaderboard" }, { label: username }]} />

          {loading ? (
            <div className="py-24 text-center text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mx-auto" />
            </div>
          ) : !data ? (
            <div className="py-24 text-center">
              <UserX className="w-10 h-10 mx-auto mb-4 text-muted-foreground" />
              <h1 className="text-2xl font-bold mb-2">This profile is private or unavailable</h1>
              <p className="text-sm text-muted-foreground mb-6">
                The trader may have set their profile to private, or the username does not exist.
              </p>
              <Button className="!text-black font-bold rounded-xl" asChild>
<Link to="/leaderboard">Back to leaderboard</Link>
</Button>
            </div>
          ) : (
            <>
              <header className="mt-8 mb-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-2xs uppercase tracking-widest text-primary mb-3">
                  <Trophy className="h-3 w-3" /> Public practice profile
                </div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight [overflow-wrap:anywhere]">{data.username}</h1>
                <p className="text-sm text-muted-foreground mt-2 max-w-xl">
                  {data.bio ||
                    `Public practice-trading profile on TradeHQ.`}
                  {data.country ? ` · ${data.country}` : ""}
                </p>
                <p className="text-2xs text-muted-foreground mt-2">
                  Member since {new Date(data.createdAt).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
                </p>
              </header>

              {data.stats ? (
                <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
                  {[
                    { label: "Portfolio value", value: `$${data.stats.portfolio_value.toLocaleString(undefined, { maximumFractionDigits: 0 })}` },
                    {
                      label: "Total return",
                      value: data.stats.pnl_pct === null ? "Unranked" : `${data.stats.pnl_pct >= 0 ? "+" : ""}${data.stats.pnl_pct.toFixed(1)}%`,
                      color: data.stats.pnl_pct === null || data.stats.pnl_pct >= 0 ? "text-profit" : "text-loss",
                    },
                    { label: "Trades placed", value: String(data.stats.trades) },
                    { label: "Price basis", value: priceLabel(data.stats.price_status) },
                  ].map((k) => (
                    <Card key={k.label} className="p-5 bg-white/[0.02] border-white/10">
                      <p className="text-2xs uppercase tracking-widest text-muted-foreground mb-1">{k.label}</p>
                      <p className={`text-xl font-bold ${k.color ?? ""}`}>{k.value}</p>
                    </Card>
                  ))}
                </section>
              ) : (
                <p className="text-sm text-muted-foreground mb-10">
                  No account portfolio or server-recorded trades yet. This public member can still appear on the leaderboard.
                </p>
              )}

              <Card className="p-5 sm:p-6 bg-white/[0.02] border-white/10 mb-8">
                <h2 className="text-lg font-semibold">Public practice activity</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Only voluntarily shared, server-recorded simulated orders from the current practice cycle can appear here.
                  Private reflections, journal entries, older cycles and browser-only trades are excluded.
                </p>
                {!data.showPublicTrades
                  ? <p className="mt-4 text-sm text-muted-foreground">This member has not enabled public trade-history sharing.</p>
                  : historyUnavailable
                    ? <p role="status" className="mt-4 text-sm text-muted-foreground">Trade history is temporarily unavailable.</p>
                    : publicTrades.length === 0
                      ? <p className="mt-4 text-sm text-muted-foreground">No current-cycle public practice orders to display yet.</p>
                      : <div className="mt-4 space-y-2" aria-label="Recent public practice orders">
                          {publicTrades.map((t, index) => <div key={t.created_at + t.asset_id + index}
                            className="grid grid-cols-2 sm:grid-cols-5 gap-2 rounded-xl border border-border/70 p-3 text-sm">
                            <div><p className="text-xs text-muted-foreground">Action</p><strong className="capitalize">{t.side}</strong> {t.asset_id.toUpperCase()}</div>
                            <div><p className="text-xs text-muted-foreground">Quantity</p><span className="tabular-nums">{Number(t.quantity).toLocaleString()}</span></div>
                            <div><p className="text-xs text-muted-foreground">Sim. execution</p><span className="tabular-nums">${Number(t.price).toLocaleString(undefined,{maximumFractionDigits:4})}</span></div>
                            <div><p className="text-xs text-muted-foreground">Recorded fee</p><span className="tabular-nums">${Number(t.fee).toFixed(2)}</span></div>
                            <div><p className="text-xs text-muted-foreground">Date</p><span>{new Date(t.created_at).toLocaleDateString()}</span></div>
                          </div>)}
                        </div>}
              </Card>

              {data.stats && <Card className="p-5 sm:p-6 bg-white/[0.02] border-white/10 mb-8">
                <h2 className="text-lg font-semibold">What-if arithmetic — not a prediction</h2>
                <p className="mt-2 text-sm text-muted-foreground">Change the assumed percentage applied to this entire simulated portfolio value. This simple exercise ignores changes in cash allocation, future transactions, pricing delays and fees. It is not a forecast.</p>
                <div className="mt-4 flex gap-2" aria-label="Choose an illustrative value change">
                  {[-5,0,5].map(pct => <button key={pct} type="button" aria-pressed={scenarioPercent===pct}
                    onClick={() => setScenarioPercent(pct)}
                    className={`rounded-lg border px-4 py-2 text-sm ${scenarioPercent===pct ? "border-primary bg-primary/10" : "border-border"}`}>
                    {pct>0?"+":""}{pct}%
                  </button>)}
                </div>
                <p className="mt-3 text-lg font-bold tabular-nums">${(data.stats.portfolio_value*(1+scenarioPercent/100)).toLocaleString(undefined,{maximumFractionDigits:2})}</p>
                <p className="text-xs text-muted-foreground">Pure multiplication of the current hypothetical portfolio value by {1+scenarioPercent/100}. No expected return is implied.</p>
              </Card>}

              <Card className="p-5 bg-white/[0.02] border-white/10 mb-10">
                <h2 className="font-semibold mb-2">How to read these numbers</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  All figures come from a simulated account funded with virtual money.
                  They are not audited, do not represent real trading results, and do not
                  predict future performance. Comparable ranked portfolios use a {STARTING_BALANCE_LABEL} starting balance; imported portfolios remain unranked. {PRICE_REFRESH_COPY}{" "}
                  {data.stats && quoteTimeLabel(data.stats.priced_at, data.stats.observed_at)}
                </p>
              </Card>

              <EducationalDisclaimer variant="footer" />
            </>
          )}
        </main>
        <MegaFooter />
      </div>
    </>
  );
}
