import type { PortfolioSnapshot } from "./types";

export interface PortfolioChartPoint {
  time: string;
  value: number;
}

/** Display only genuine owner/device samples and an actually received account valuation.
 * An initial account value is one point, never a fabricated performance history. */
export function portfolioChartPoints(
  history: PortfolioSnapshot[],
  currentValue: number,
  account: boolean,
  receivedAt?: number,
): PortfolioChartPoint[] {
  const points = history.filter(snapshot =>
    Number.isFinite(snapshot.timestamp.getTime()) &&
    Number.isFinite(snapshot.totalValue) && snapshot.totalValue >= 0
  ).map(snapshot => ({
    time: snapshot.timestamp.toLocaleString(),
    value: snapshot.totalValue,
  }));

  if (!account || !Number.isFinite(receivedAt) || !receivedAt ||
      !Number.isFinite(currentValue) || currentValue < 0) return points;
  const last = history[history.length - 1];
  if (!last || !points.length) {
    // A read-only server observation remains useful if browser history storage is
    // empty or unavailable. It does NOT count as earlier historical performance.
    return [{ time: new Date(receivedAt).toLocaleString(), value: currentValue }];
  }
  if (receivedAt > last.timestamp.getTime() && last.totalValue !== currentValue)
    points.push({ time: new Date(receivedAt).toLocaleString(), value: currentValue });
  return points;
}
