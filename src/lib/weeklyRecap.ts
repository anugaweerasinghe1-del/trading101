import { getPortfolioHistory } from "./portfolioHistory";

export interface WeeklyRecap {
  hasData: boolean;
  startValue: number;
  endValue: number;
  changePct: number;
  changeAbs: number;
  snapshots: number;
}

/** Compare recorded balances within seven days; cash flows are not adjusted. */
export function getWeeklyRecap(): WeeklyRecap {
  try {
    const history = getPortfolioHistory();
    if (!history?.length) {
      return { hasData: false, startValue: 0, endValue: 0, changePct: 0, changeAbs: 0, snapshots: 0 };
    }
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recent = history.filter((s) => new Date(s.timestamp).getTime() >= cutoff);
    if (recent.length < 2) {
      const last = history[history.length - 1];
      return {
        hasData: false,
        startValue: last?.totalValue ?? 0,
        endValue: last?.totalValue ?? 0,
        changePct: 0,
        changeAbs: 0,
        snapshots: history.length,
      };
    }
    const startValue = recent[0].totalValue;
    const endValue = recent[recent.length - 1].totalValue;
    const changeAbs = endValue - startValue;
    const changePct = startValue > 0 ? (changeAbs / startValue) * 100 : 0;
    return { hasData: true, startValue, endValue, changePct, changeAbs, snapshots: recent.length };
  } catch {
    return { hasData: false, startValue: 0, endValue: 0, changePct: 0, changeAbs: 0, snapshots: 0 };
  }
}
