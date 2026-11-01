import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { getPortfolio, savePortfolio, updatePositionPrices } from "@/lib/portfolio";
import { pushPortfolio } from "@/lib/cloudPortfolio";
import { refreshAssetSnapshots } from "@/lib/marketDataClient";

/** Account holdings stay server-authoritative. Guest portfolios remain on this device.
 * The server refreshes held market quotes on its own schedule even if everyone is offline.
 * Realtime is a delivery signal, not permission to edit balances or forge a quote.
 */
const POLL_INTERVAL_MS = 60_000;
const EVENT_COALESCE_MS = 2_000;
const MIN_REFRESH_GAP_MS = 10_000;

export function PortfolioLiveUpdates() {
  const { user, loading } = useAuth();
  const [guestHasHoldings, setGuestHasHoldings] = useState(() => getPortfolio().positions.length > 0);

  // Activate a feed when a guest places their first order, restores a portfolio,
  // or closes their last position; savePortfolio already emits this event.
  useEffect(() => {
    const check = () => setGuestHasHoldings(getPortfolio().positions.length > 0);
    window.addEventListener("tradehq:portfolio-updated", check);
    window.addEventListener("storage", check);
    return () => {
      window.removeEventListener("tradehq:portfolio-updated", check);
      window.removeEventListener("storage", check);
    };
  }, []);

  useEffect(() => {
    if (loading || (!user && !guestHasHoldings)) return;
    let active = true;
    let busy = false;
    let queued = false;
    let lastAttempt = 0;
    let scheduled: ReturnType<typeof setTimeout> | undefined;
    const shouldRefresh = () => active && navigator.onLine !== false && !document.hidden;

    const refresh = async () => {
      if (!shouldRefresh()) return;
      if (busy) { queued = true; return; }
      busy = true;
      lastAttempt = Date.now();
      try {
        if (user) {
          // Only the server may mutate signed-in cash and trade history.
          await pushPortfolio(user.id);
        } else {
          const before = getPortfolio();
          if (!before.positions.length) return;
          // One shared snapshot read for all held assets; never request an
          // individual third-party provider quote for every visitor's holding.
          const heldAssets = before.positions.map(position => position.asset);
          const { assets } = await refreshAssetSnapshots(heldAssets);
          if (!active) return;
          // Re-read after the await so a trade made during the quote request
          // is not overwritten by the old portfolio snapshot.
          const latest = getPortfolio();
          if (!latest.positions.length) return;
          const updated = updatePositionPrices(latest, assets);
          const changed = updated.positions.some((position, index) =>
            position.asset.price !== latest.positions[index]?.asset.price);
          if (changed) savePortfolio(updated, { silent: true });
        }
      } catch {
        // A failed network read keeps the last known portfolio intact.
        // The next event, focus or scheduled poll retries.
      } finally {
        busy = false;
        if (queued && active) {
          queued = false;
          schedule();
        }
      }
    };

    function schedule(soon = false) {
      if (!shouldRefresh() || scheduled) return;
      const minDelay = Math.max(0, MIN_REFRESH_GAP_MS - (Date.now() - lastAttempt));
      scheduled = setTimeout(() => {
        scheduled = undefined;
        void refresh();
      }, Math.max(soon ? 0 : EVENT_COALESCE_MS, minDelay));
    }

    const onVisible = () => { if (!document.hidden) schedule(true); };
    const onResume = () => schedule(true);
    const periodic = window.setInterval(() => schedule(), POLL_INTERVAL_MS);
    window.addEventListener("focus", onResume);
    window.addEventListener("online", onResume);
    document.addEventListener("visibilitychange", onVisible);
    // Allow auth restoration to complete before the first account read.
    const first = window.setTimeout(() => schedule(true), 1800);

    const channel = supabase.channel("tradehq-portfolio-live-" + (user?.id ?? "guest"));
    // All public cached market quotes are non-sensitive; only refresh a guest
    // or account if the changed asset belongs to that portfolio.
    channel.on("postgres_changes", { event: "*", schema: "public", table: "market_prices" }, payload => {
      const assetId = (payload.new as { asset_id?: string } | undefined)?.asset_id;
      if (assetId && getPortfolio().positions.some(p => p.asset.id === assetId)) schedule();
    });
    if (user) {
      // Supabase RLS restricts account rows to auth.uid(); a remote trade
      // triggers a fresh authoritative snapshot rather than trusting a payload.
      channel.on("postgres_changes", {
        event: "*", schema: "public", table: "practice_portfolios",
        filter: "user_id=eq." + user.id,
      }, () => schedule());
    }
    channel.subscribe();

    return () => {
      active = false;
      if (scheduled) clearTimeout(scheduled);
      clearTimeout(first);
      clearInterval(periodic);
      window.removeEventListener("focus", onResume);
      window.removeEventListener("online", onResume);
      document.removeEventListener("visibilitychange", onVisible);
      void supabase.removeChannel(channel);
    };
  }, [user?.id, loading, guestHasHoldings]);

  return null;
}
