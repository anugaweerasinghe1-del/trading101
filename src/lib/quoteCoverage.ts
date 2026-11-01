/** Provider provenance is independent of a simulator's estimated P&L.
 * Never describe an absent or outdated quote as a live market price.
 */
export type QuoteCoverageStatus = "provider" | "previous_close" | "delayed" | "stale" | "simulator";
export type QuoteCoverage = { status: QuoteCoverageStatus; note: string; fetchedAt: string | null };
export type QuoteCacheRow = { asset_id?: unknown; price?: unknown; source?: unknown; updated_at?: unknown; observed_at?: unknown; quote_status?: unknown };
const age = (input: unknown, now: number) => typeof input === "string" ? now - Date.parse(input) : Infinity;

export function quoteCoverageForHoldings(
  ids: string[], rows: QuoteCacheRow[], now = Date.now(),
): Record<string, QuoteCoverage> {
  const indexed = new Map(rows.filter(row => typeof row.asset_id === "string").map(row => [row.asset_id, row]));
  return Object.fromEntries(ids.map(id => {
    const row = indexed.get(id);
    if (!row || !Number.isFinite(Number(row.price)) || Number(row.price) <= 0)
      return [id, { status: "simulator", note: "No provider quote; fixed simulator reference used", fetchedAt: null }];
    const fetchedAt = typeof row.updated_at === "string" ? row.updated_at : null;
    const observedAt = typeof row.observed_at === "string" ? row.observed_at : null;
    if (row.quote_status === "previous_close")
      return [id, { status: "previous_close", note: "Previous trading-session close; not a live price", fetchedAt }];
    if (!Number.isFinite(age(fetchedAt,now)) || age(fetchedAt,now) > 15*60_000)
      return [id, { status: "stale", note: "Provider cache last refreshed over 15 minutes ago", fetchedAt }];
    if (!Number.isFinite(age(observedAt,now)) || age(observedAt,now) > 15*60_000)
      return [id, { status: "delayed", note: "Latest observed provider price is delayed or undated", fetchedAt }];
    return [id, { status: "provider", note: "Recent provider snapshot; not a streaming quote", fetchedAt }];
  }));
}
