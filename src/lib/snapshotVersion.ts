export interface SnapshotVersion { cycle: string; count: number; updatedAt: string; pricedAt?: string | null; prices?: ReadonlyMap<string, string | null | undefined> }
/** Trades increase monotonically within a cycle. A reset starts a newer cycle. */
export function snapshotIsStale(incoming: SnapshotVersion, previous: SnapshotVersion | null): boolean {
  if (!previous) return false;
  if (incoming.cycle === previous.cycle) {
    if (incoming.count !== previous.count) return incoming.count < previous.count;
    if (Date.parse(incoming.updatedAt) < Date.parse(previous.updatedAt)) return true;
    if (incoming.prices && previous.prices) {
      for (const [id, next] of incoming.prices) {
        const prior = previous.prices.get(id);
        if (next && prior && Date.parse(next) < Date.parse(prior)) return true;
      }
    }
    return !!incoming.pricedAt && !!previous.pricedAt && Date.parse(incoming.pricedAt) < Date.parse(previous.pricedAt);
  }
  return Date.parse(incoming.updatedAt) < Date.parse(previous.updatedAt);
}
