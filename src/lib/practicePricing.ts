export const PRICE_REFRESH_COPY = "Held assets are checked in the background every five minutes. Traditional instruments rotate through a limited batch. Provider delays and outages can leave older cached prices; unsupported assets use fixed simulator prices.";

/** Previous-session quotes can span weekends, but not weeks without warning. */
export function normalizePortfolioPriceStatus(status: string, observedAt: string | null | undefined, now = Date.now()) {
  if (status !== "previous_close") return status;
  const observed = observedAt ? Date.parse(observedAt) : NaN;
  return !Number.isFinite(observed) || now - observed > 7 * 24 * 60 * 60_000 ? "stale" : status;
}
export function priceLabel(status: string, observedAt: string | null = null, now = Date.now()) {
  const safeStatus = normalizePortfolioPriceStatus(status, observedAt, now);
  return ({ not_started: "No account portfolio yet", cash_only: "Cash only", simulator: "Includes fixed simulator prices",
    stale: "Older cached quotes", previous_close: "Provider session-close prices", unknown_time: "Quote time unavailable",
    delayed: "Delayed provider quotes", provider: "Provider snapshots" } as Record<string, string>)[safeStatus] ?? "Cached practice prices";
}
export function quoteTimeLabel(fetched: string | null, observed: string | null) {
  return [fetched ? `Fetched ${new Date(fetched).toLocaleString()}` : null,
    observed ? `Oldest quote ${new Date(observed).toLocaleString()}` : null].filter(Boolean).join(" · ");
}
export function snapshotPriceInfo(positions: { priced_at?: string | null; observed_at?: string | null; quote_status?: string }[], now = Date.now()) {
  const oldest = (values: (string | null | undefined)[]) => values.some(v => !v) ? null : [...values as string[]].sort()[0] ?? null;
  const fetched = oldest(positions.map(p => p.priced_at));
  const observed = oldest(positions.map(p => p.observed_at));
  const cutoff = now - 15 * 60000;
  const status = !positions.length ? "cash_only" : positions.some(p => !p.priced_at) ? "simulator"
    : fetched && (!Number.isFinite(Date.parse(fetched)) || Date.parse(fetched) < cutoff) ? "stale"
    : positions.some(p => normalizePortfolioPriceStatus(p.quote_status ?? "", p.observed_at, now) === "stale") ? "stale"
    : positions.some(p => p.quote_status === "previous_close") ? "previous_close"
    : !observed ? "unknown_time" : Date.parse(observed) < cutoff ? "delayed" : "provider";
  return { status, fetched, observed };
}
