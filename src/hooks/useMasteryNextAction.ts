import { useEffect, useState, useSyncExternalStore } from "react";
import { useAuth } from "@/hooks/useAuth";
import { hasPlayedToday, DAILY_PROGRESS_EVENT } from "@/lib/dailyChallenge";
import { getPortfolio } from "@/lib/portfolio";
import { getAccountPortfolio, subscribeAccountPortfolio } from "@/lib/cloudPortfolio";
import { chooseMasteryNextActionForTradeCount, missedDailyCaseAnswers } from "@/lib/masteryNextAction";
import { readPractice } from "@/lib/dailyPracticeProgress";

function readLocalActivity() {
  return { playedToday: hasPlayedToday(), guestTrades: getPortfolio().trades.length, reviewMistakes: missedDailyCaseAnswers(readPractice()) };
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
  }, [user?.id]);

  const tradeCount = user ? (account?.portfolio?.trades.length ?? null) : localActivity.guestTrades;
  return { ...chooseMasteryNextActionForTradeCount(localActivity.playedToday, tradeCount), reviewMistakes: localActivity.reviewMistakes };
}
