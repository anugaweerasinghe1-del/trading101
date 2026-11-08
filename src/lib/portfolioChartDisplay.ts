/**
 * Display-only portfolio chart helpers. These never alter portfolio records,
 * trade prices, account history, or the saved value of a snapshot.
 */
export function portfolioChartDomain(points: readonly { value: number }[]): [number, number] {
  const values = points.map(p => p.value).filter(v => Number.isFinite(v) && v >= 0);
  if (!values.length) return [0, 1];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = max - min;
  const padding = spread > 0
    ? Math.max(spread * 0.2, max * 0.00001, 0.05)
    : Math.max(max * 0.0001, 0.05);
  return [Math.max(0, min - padding), max + padding];
}

/** Keep tick labels legible without collapsing small changes to identical rounded values. */
export function formatPortfolioChartTick(value: number, visibleRange: number): string {
  if (!Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  const span = Number.isFinite(visibleRange) && visibleRange >= 0 ? visibleRange : 0;
  if (abs >= 1_000_000_000) {
    const digits = span < 10_000 ? 6 : span < 1_000_000 ? 4 : 2;
    return "$" + (value / 1_000_000_000).toFixed(digits).replace(/0+$/, "").replace(/\.$/, "") + "B";
  }
  if (abs >= 1_000_000) {
    const digits = span < 10 ? 6 : span < 1_000 ? 4 : 2;
    return "$" + (value / 1_000_000).toFixed(digits).replace(/0+$/, "").replace(/\.$/, "") + "M";
  }
  const fractionDigits = span < 0.01 ? 5 : span < 1 ? 3 : span < 10 ? 2 : span < 100 ? 1 : 0;
  return "$" + value.toLocaleString("en-US", { maximumFractionDigits: fractionDigits });
}

export function isPortfolioReferenceVisible(reference: number, domain: readonly [number, number]): boolean {
  return Number.isFinite(reference) && reference >= domain[0] && reference <= domain[1];
}
