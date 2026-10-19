import { useCallback, useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Navigation } from "@/components/Navigation";
import { MegaFooter } from "@/components/MegaFooter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { EducationalDisclaimer } from "@/components/EducationalDisclaimer";
import { Swords, Share2, Loader2, Clock, Trophy, Copy, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { syncStats } from "@/lib/traderSync";
import { setPendingPath } from "@/lib/pendingRedirect";
import { SITE_DOMAIN, STARTING_BALANCE } from "@/lib/constants";

interface Duel {
  id: string;
  code: string;
  creator_id: string;
  opponent_id: string | null;
  creator_start_value: number;
  opponent_start_value: number | null;
  starts_at: string;
  ends_at: string;
  status: string;
  score_mode: string;
  settled_at: string | null;
}

interface SideStats {
  username: string;
  value: number;
  startValue: number;
}

const SHARE_LINE =
  "Educational simulation only — not financial advice. No real money is traded.";

function makeCode() {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  let out = "";
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  bytes.forEach((b) => (out += alphabet[b % alphabet.length]));
  return out;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Live remaining time broken into days + hours, floored at zero. */
function remaining(endsAt: string, now: number) {
  const ms = Math.max(0, new Date(endsAt).getTime() - now);
  return {
    ms,
    days: Math.floor(ms / 86_400_000),
    hours: Math.floor((ms % 86_400_000) / 3_600_000),
    over: ms === 0,
  };
}

export default function Challenge() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [duel, setDuel] = useState<Duel | null>(null);
  const [sides, setSides] = useState<{ creator: SideStats | null; opponent: SideStats | null }>({
    creator: null,
    opponent: null,
  });
  const [myDuels, setMyDuels] = useState<Duel[]>([]);
  const [loading, setLoading] = useState(!!code);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  // Tick the countdown once a minute — cheap, and keeps "days left" honest.
  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(iv);
  }, []);

  const loadSides = useCallback(async (d: Duel) => {
    const { data, error } = await supabase.rpc("get_practice_duel_score", { p_duel_id: d.id });
    if (error || !data) { setSides({ creator: null, opponent: null }); return; }
    const scored = data as unknown as Duel & {
      creator_name: string; opponent_name: string | null;
      creator_value: number | null; opponent_value: number | null;
    };
    setDuel(scored);
    setSides({
      creator: scored.creator_value === null ? null : {
        username: scored.creator_name, value: Number(scored.creator_value), startValue: Number(scored.creator_start_value),
      },
      opponent: scored.opponent_value === null ? null : {
        username: scored.opponent_name || "Opponent", value: Number(scored.opponent_value), startValue: Number(scored.opponent_start_value),
      },
    });
  }, []);

  const loadDuel = useCallback(async () => {
    if (!code) return;
    setLoading(true);
    const { data } = await supabase.from("duels").select("*").eq("code", code).maybeSingle();
    if (data) {
      setDuel(data as Duel);
      await loadSides(data as Duel);
    } else {
      setDuel(null);
    }
    setLoading(false);
  }, [code, loadSides]);

  useEffect(() => {
    loadDuel();
  }, [loadDuel]);

  useEffect(() => {
    if (code || !user) return;
    supabase
      .from("duels")
      .select("*")
      .or(`creator_id.eq.${user.id},opponent_id.eq.${user.id}`)
      .order("created_at", { ascending: false })
      .then(({ data }) => setMyDuels((data as Duel[]) ?? []));
  }, [code, user]);

  const inviteUrl = code ? `${window.location.origin}/challenge/${code}` : "";
  const time = duel ? remaining(duel.ends_at, now) : null;
  const isFinished = !!duel && !!duel.opponent_id && !!time?.over;
  const isFull = !!duel?.opponent_id;
  const isMine = !!duel && !!user && duel.creator_id === user.id;
  const amOpponent = !!duel && !!user && duel.opponent_id === user.id;

  const createDuel = async () => {
    if (!user) return;
    setBusy(true);
    try {
      await syncStats(user.id);
      const newCode = makeCode();
      const { error } = await supabase.rpc("create_practice_duel", { p_code: newCode });
      if (error) throw error;
      toast.success("Challenge created — share the link with your friend.");
      navigate(`/challenge/${newCode}`);
    } catch {
      toast.error("Could not create the challenge. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const joinDuel = async () => {
    if (!user || !duel || duel.score_mode === "legacy") return;
    if (duel.creator_id === user.id) {
      toast.error("You cannot accept your own challenge — send the link to a friend.");
      return;
    }
    setBusy(true);
    try {
      await syncStats(user.id);
      const { data: joined, error } = await supabase.rpc("join_practice_duel", { p_duel_id: duel.id });
      if (error) throw error;
      if (!joined) {
        toast.error("Someone already took this seat.");
      } else {
        toast.success("You joined the duel. 30 days on the clock.");
      }
      await loadDuel();
    } catch {
      toast.error("Could not join this duel.");
    } finally {
      setBusy(false);
    }
  };

  const shareText = `Join my 30-day TradeHQ practice trading duel. Each side is measured from its own recorded starting value. Scores use server-recorded simulated trades and are frozen at the deadline; they are not real investment performance. ${SHARE_LINE}`;

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: "TradeHQ practice duel", text: shareText, url: inviteUrl });
        return;
      }
    } catch {
      /* user cancelled the share sheet */
    }
    try {
      await navigator.clipboard.writeText(`${shareText} ${inviteUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      toast.success("Invite link copied");
    } catch {
      toast.error("Could not copy — select the link manually.");
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy — select the link manually.");
    }
  };

  const goSignIn = () => {
    if (code) setPendingPath(`/challenge/${code}`);
    navigate("/auth");
  };

  const pct = (s: SideStats) => ((s.value - s.startValue) / s.startValue) * 100;

  const leader = useMemo(() => {
    if (!sides.creator || !sides.opponent) return null;
    const a = pct(sides.creator);
    const b = pct(sides.opponent);
    if (a === b) return "tie" as const;
    return a > b ? sides.creator.username : sides.opponent.username;
  }, [sides]);

  const title = code
    ? "30-day practice trading duel | TradeHQ"
    : "Challenge a friend — 30-day practice trading duel | TradeHQ";
  const description =
    "Challenge a friend to a 30-day paper-trading exercise on TradeHQ. Each side is measured from its own recorded starting value; scores use server-recorded simulated trades and are frozen at the deadline.";

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={`${SITE_DOMAIN}/challenge`} />
        <meta name="robots" content={code ? "noindex, follow" : "index, follow"} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={`${SITE_DOMAIN}/challenge`} />
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        <Navigation />
        <main className="flex-1 container mx-auto px-4 pt-28 pb-20 max-w-3xl">
          <Breadcrumbs
            items={[{ label: "Leaderboard", href: "/leaderboard" }, { label: "Challenge a friend" }]}
          />

          <header className="mt-8 mb-10 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-2xs uppercase tracking-widest text-primary mb-4">
              <Swords className="h-3 w-3" /> Head-to-head practice
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              Challenge a friend to a 30-day duel
            </h1>
            <p className="text-sm text-muted-foreground mt-3 max-w-xl mx-auto">
              Send a link, both of you trade the simulator for 30 days, and the scoreboard
              compares server-recorded percentage change from each participant's own starting value at acceptance.
              Final scores use the last server-cached quotes available at the deadline. Scores are simulated. No real money is involved.
            </p>
          </header>

          {loading ? (
            <div className="py-16 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : code && !duel ? (
            <Card className="p-8 text-center glass-tactile border-chrome">
              <h2 className="text-lg font-semibold mb-2">This challenge link is not valid</h2>
              <p className="text-sm text-muted-foreground mb-6">
                The code does not match an existing duel. Double-check the link, or start a
                fresh duel of your own.
              </p>
              <Link to="/challenge">
                <Button className="!text-black font-bold rounded-xl">Create a challenge</Button>
              </Link>
            </Card>
          ) : duel ? (
            <>
              {/* Invite card for a visitor who has not signed in yet. */}
              {!user && (
                <Card className="p-6 md:p-8 mb-6 glass-tactile border-chrome text-center">
                  <p className="text-2xs uppercase tracking-widest text-muted-foreground mb-2">
                    You have been invited
                  </p>
                  <h2 className="text-xl font-semibold mb-3">
                    {sides.creator?.username ?? "A TradeHQ trader"} challenged you to a
                    30-day practice duel
                  </h2>
                  <ul className="text-sm text-muted-foreground space-y-1.5 mb-6 max-w-sm mx-auto text-left">
                    <li>• Both sides use the virtual-money simulator; actual recorded starting values can differ.</li>
                    <li>• Scoring compares percentage change from each trader's own recorded starting line.</li>
                    <li>• The duel runs for 30 days from the moment you accept.</li>
                    <li>• A free account is only needed so both scores can be tracked.</li>
                  </ul>
                  {isFull ? (
                    <p className="text-sm text-muted-foreground">
                      This duel already has two traders. You can still watch the scoreboard below.
                    </p>
                  ) : (
                    <Button onClick={goSignIn} className="!text-black font-bold rounded-xl px-8">
                      Sign in to accept
                    </Button>
                  )}
                </Card>
              )}

              {duel.score_mode === "legacy" && (
                <p className="mb-4 rounded-xl border border-white/10 p-4 text-sm text-muted-foreground">This duel predates server-recorded scoring. Its historical final scores cannot be verified, so no winner is displayed. Create a new duel to use the current scoring system.</p>
              )}
              <Card className="p-6 md:p-8 glass-tactile border-chrome">
                <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                  <Badge variant="outline" className="border-primary/30 text-primary">
                    {isFinished
                      ? "Duel finished"
                      : isFull
                        ? "Duel in progress"
                        : "Waiting for an opponent"}
                  </Badge>
                  <span className="inline-flex items-center gap-1 text-2xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {isFinished
                      ? `Ended ${formatDate(duel.ends_at)}`
                      : isFull
                        ? `${time?.days}d ${time?.hours}h remaining`
                        : "Clock starts when your friend accepts"}
                  </span>
                </div>

                <p className="text-2xs text-muted-foreground mb-6">
                  {isFull
                    ? `Runs ${formatDate(duel.starts_at)} → ${formatDate(duel.ends_at)}.`
                    : "The 30-day window begins the moment the second trader joins."}
                </p>

                <div className="grid gap-4 md:grid-cols-2">
                  {[sides.creator, sides.opponent].map((s, i) => (
                    <div
                      key={i}
                      className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 text-center"
                    >
                      <p className="text-2xs uppercase tracking-widest text-muted-foreground mb-2">
                        {i === 0 ? "Challenger" : "Opponent"}
                      </p>
                      {s ? (
                        <>
                          <p className="font-semibold mb-1">{s.username}</p>
                          <p className={`text-2xl font-bold ${pct(s) >= 0 ? "text-profit" : "text-loss"}`}>
                            {pct(s) >= 0 ? "+" : ""}
                            {pct(s).toFixed(1)}%
                          </p>
                          <p className="text-2xs text-muted-foreground mt-1">
                            ${s.value.toLocaleString(undefined, { maximumFractionDigits: 0 })} simulated
                          </p>
                          <p className="text-2xs text-muted-foreground/70 mt-1">
                            Started at ${s.startValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground py-4">{duel.score_mode === "legacy" ? "Historical score unavailable" : "Seat open"}</p>
                      )}
                    </div>
                  ))}
                </div>

                {leader && (
                  <p className="mt-6 text-center text-sm">
                    <Trophy className="w-4 h-4 inline mr-1 text-primary" />
                    <strong>{leader === "tie" ? "Dead even" : leader}</strong>{" "}
                    {leader === "tie"
                      ? isFinished
                        ? "— the duel ended tied."
                        : "so far."
                      : isFinished
                        ? "finished ahead in the frozen practice figures."
                        : "is currently ahead."}
                  </p>
                )}

                {isFinished && (
                  <p className="mt-2 text-center text-2xs text-muted-foreground">
                    Final figures are frozen using server-recorded trades and the last valuation quotes available by the deadline. They do not represent real returns.
                  </p>
                )}

                {/* Share row */}
                {!isFull && duel.score_mode === "server" && (
                  <div className="mt-8 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
                    <p className="text-2xs uppercase tracking-widest text-muted-foreground mb-2">
                      Invite link
                    </p>
                    <p className="font-mono text-xs break-all text-foreground/90 mb-3">{inviteUrl}</p>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={copyLink} className="rounded-xl">
                        {copied ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                        {copied ? "Copied" : "Copy link"}
                      </Button>
                      <Button variant="outline" size="sm" onClick={share} className="rounded-xl">
                        <Share2 className="w-4 h-4 mr-2" /> Share
                      </Button>
                    </div>
                  </div>
                )}

                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  {!user ? (
                    !isFull && duel.score_mode === "server" && (
                      <Button onClick={goSignIn} className="!text-black font-bold rounded-xl">
                        Sign in to join
                      </Button>
                    )
                  ) : !isFull && !isMine ? (
                    <Button onClick={joinDuel} disabled={busy} className="!text-black font-bold rounded-xl">
                      {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Accept the challenge
                    </Button>
                  ) : isMine || amOpponent ? (
                    <Button
                      variant="outline"
                      className="rounded-xl"
                      disabled={busy}
                      onClick={async () => {
                        setBusy(true);
                        await syncStats(user.id).catch(() => null);
                        await loadDuel();
                        setBusy(false);
                      }}
                    >
                      {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Refresh my score
                    </Button>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      This duel is full. <Link to="/challenge" className="text-primary underline">Start your own</Link>.
                    </p>
                  )}
                </div>

                {isMine && !isFull && duel.score_mode === "server" && (
                  <p className="mt-4 text-center text-2xs text-muted-foreground">
                    This is your own challenge — send the link above to a friend so they can take the second seat.
                  </p>
                )}
              </Card>
            </>
          ) : (
            <>
              <Card className="p-6 md:p-8 glass-tactile border-chrome text-center">
                {user ? (
                  <>
                    <p className="text-sm text-muted-foreground mb-5">
                      Signed in as <strong>{profile?.username ?? "you"}</strong>. Create a duel and
                      share the link with a friend.
                    </p>
                    <Button onClick={createDuel} disabled={busy} className="!text-black font-bold rounded-xl px-8">
                      {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Create a challenge link
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground mb-5">
                      Duels need a free account so both scores can be tracked. Everything else on
                      TradeHQ stays available without signing in.
                    </p>
                    <Button onClick={goSignIn} className="!text-black font-bold rounded-xl px-8">
                      Create a free account
                    </Button>
                  </>
                )}
              </Card>

              {myDuels.length > 0 && (
                <section className="mt-10">
                  <h2 className="text-lg font-semibold mb-4">Your duels</h2>
                  <div className="space-y-2">
                    {myDuels.map((d) => {
                      const t = remaining(d.ends_at, now);
                      return (
                        <Link
                          key={d.id}
                          to={`/challenge/${d.code}`}
                          className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 hover:bg-white/[0.04] transition"
                        >
                          <span className="text-sm font-mono">{d.code}</span>
                          <span className="text-2xs text-muted-foreground">
                            {d.score_mode === "legacy" ? "Legacy — scores unavailable" : !d.opponent_id
                              ? "Waiting for opponent"
                              : t.over
                                ? "Finished"
                                : `${t.days}d ${t.hours}h left`}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              )}

              <section className="mt-10 grid gap-4 md:grid-cols-3">
                {[
                  { t: "1. Create a link", b: "Create an invitation from a ranked practice portfolio. Browser imports cannot enter duels." },
                  { t: "2. Your friend joins", b: "When they accept, both starting values are recorded together and the 30-day clock begins." },
                  { t: "3. 30 days of practice", b: "Scores use server-recorded trades and cached valuation quotes. Final values are calculated at the deadline and then frozen." },
                ].map((s) => (
                  <div key={s.t} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
                    <h3 className="font-semibold text-sm mb-2">{s.t}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{s.b}</p>
                  </div>
                ))}
              </section>

              <section className="mt-10 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
                <h2 className="text-lg font-semibold mb-3">How duel scoring works</h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                  A duel compares percentage change, not dollar totals. If you begin a duel at
                  $104,000 of simulated equity and finish at $109,200, your duel score is
                  +5.0% — the $4,000 you were already up before the duel started does not count.
                  Your friend is measured the same way from their own starting line. Server-scored duels use server-recorded trades and cached quotes. Legacy client-summary duels are labelled separately and do not have reconstructed final scores. These are practice data rather than audited investment results.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Nothing is reset when a duel begins. Your practice portfolio, journal and
                  watchlist stay exactly as they were, and losing a duel has no effect on your
                  account. The purpose is deliberate practice under a deadline, which is the
                  same reason trading educators use timed paper-trading exercises.
                </p>
                <p className="text-2xs text-muted-foreground/70 mt-3">
                  (Educational simulation only — not financial advice.)
                </p>
              </section>
            </>
          )}

          <div className="mt-10">
            <EducationalDisclaimer variant="footer" />
          </div>
        </main>
        <MegaFooter />
      </div>
    </>
  );
}
