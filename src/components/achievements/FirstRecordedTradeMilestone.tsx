import { useEffect } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, CircleDashed, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { hasOwnServerRecordedPracticeTrade } from "@/lib/serverPracticeAchievement";

// The checked-in generated Database typing predates the protected practice
// ledger. Reuse the SAME authenticated Supabase client with an untyped read
// only for this existing table; its backend SELECT-only grants and RLS remain
// the authority. Do not open an unauthenticated secondary client.
const privateTradeReader = supabase as unknown as SupabaseClient;
const keyFor = (id: string | null) => ["private-first-recorded-practice-trade", id] as const;

/** A *private* account-recorded milestone, not a badge minted or shared by the browser. */
export function FirstRecordedTradeMilestone() {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id ?? null;
  const queryClient = useQueryClient();
  const record = useQuery({
    queryKey: keyFor(userId),
    enabled: Boolean(userId) && !authLoading,
    retry: false,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchInterval: 60_000,
    queryFn: () => hasOwnServerRecordedPracticeTrade(
      userId,
      async () => {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        return data.user?.id ?? null;
      },
      async (ownerId) => {
        // No account's portfolio can be inferred from guest backups or
        // arbitrary client-supplied localStorage. RLS restricts this SELECT.
        const { data, error } = await privateTradeReader
          .from("practice_trades")
          .select("id")
          .eq("user_id", ownerId)
          .limit(1);
        if (error) throw error;
        return (data ?? []) as Array<{ id: string }>;
      },
    ),
  });

  useEffect(() => {
    if (!userId) return;
    const refresh = () => void queryClient.invalidateQueries({ queryKey: keyFor(userId) });
    window.addEventListener("tradehq:portfolio-updated", refresh);
    return () => window.removeEventListener("tradehq:portfolio-updated", refresh);
  }, [queryClient, userId]);

  const unlocked = Boolean(userId && !authLoading && !record.isError && record.data === true);
  const pending = authLoading || Boolean(userId && record.isPending);
  const description = pending
    ? "Checking your account's server-recorded practice activity."
    : !userId
      ? "Sign in to check. Guest trades and portfolio backups do not qualify as server-recorded account activity."
      : record.isError
        ? "Account evidence is temporarily unavailable. Nothing is awarded when verification fails."
        : unlocked
          ? "Your signed-in account has a server-recorded simulated order. This private milestone does not measure returns or investing skill."
          : "No account-recorded trade found. Place a supported simulated order while signed in to record this milestone.";

  return (
    <section aria-labelledby="recorded-practice-heading" className="mb-10">
      <div className="mb-4">
        <h2 id="recorded-practice-heading" className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <ShieldCheck className="w-6 h-6 text-primary" aria-hidden="true" />
          Account-recorded activity
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Separate from editable personal learning progress. Never public by default.
        </p>
      </div>
      <Card className="p-5 sm:p-6 bg-card/70">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="shrink-0 rounded-xl bg-primary/10 p-3 text-primary">
              {unlocked ? <CheckCircle2 className="w-6 h-6" aria-hidden="true" /> :
                <CircleDashed className="w-6 h-6" aria-hidden="true" />}
            </span>
            <div>
              <h3 className="text-lg font-semibold">First Recorded Practice Trade</h3>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>
              <p className="mt-3 text-xs text-muted-foreground">
                Evidence: own account's protected trade ledger. No trading history or award is shared.
                No educational badge, profit ranking, financial certification or public achievement is created.
              </p>
            </div>
          </div>
          <span role="status" aria-live="polite" className={"shrink-0 self-start rounded-full border px-3 py-1 text-xs font-semibold " +
            (unlocked ? "border-primary/30 text-primary" : "border-border text-muted-foreground")}>
            {pending ? "Checking" : !userId ? "Sign-in required" : record.isError ? "Unavailable" :
              unlocked ? "Account-recorded" : "Not recorded"}
          </span>
        </div>
        {!userId && !authLoading && (
          <Link to="/auth" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary underline underline-offset-4">
            Sign in <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        )}
        {userId && !unlocked && !record.isError && !pending && (
          <Link to="/trade" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary underline underline-offset-4">
            Go to practice trading <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        )}
      </Card>
    </section>
  );
}
