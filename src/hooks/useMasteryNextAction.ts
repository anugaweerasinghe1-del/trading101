import { useEffect, useState, useSyncExternalStore } from "react";
import { useAuth } from "@/hooks/useAuth";
import { hasPlayedQuickToday, DAILY_PROGRESS_EVENT } from "@/lib/dailyChallenge";
import { getPortfolio } from "@/lib/portfolio";
import { getAccountPortfolio, subscribeAccountPortfolio } from "@/lib/cloudPortfolio";
import { chooseMasteryNextActionForTradeCount } from "@/lib/masteryNextAction";

function readLocalActivity() {
  return { playedToday: hasPlayedQuickToday(), guestTrades: getPortfolio().trades.length };
}

/** One account-aware, reactive mastery recommendation for Learn and Daily pages. */
export function useMasteryNextAction() {
  const { user } = useAuth();
  const [localActivity, setLocalActivity] = useState(readLocalActivity);
  const account = useSyncExternalStore(
    subscribeAccountPortfolio,
    () => getAccountPortfolio(user?.id),
    () => null,
  );

  useEffect(() => {
    const refresh = () => setLocalActivity(readLocalActivity());
    const onStorage = () => refresh();
    refresh();
    window.addEventListener(DAILY_PROGRESS_EVENT, refresh);
    window.addEventListener("tradehq:portfolio-updated", refresh);
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener(DAILY_PROGRESS_EVENT, refresh);
      window.removeEventListener("tradehq:portfolio-updated", refresh);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  const tradeCount = user ? (account?.portfolio?.trades.length ?? null) : localActivity.guestTrades;
  return chooseMasteryNextActionForTradeCount(localActivity.playedToday, tradeCount);
}
