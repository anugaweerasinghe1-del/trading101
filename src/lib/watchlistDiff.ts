import { ASSETS } from "./assets";
import { getFavorites } from "./favorites";
import { getPersistedPrices } from "./pricePersistence";

const SNAPSHOT_KEY = "tradehq_watchlist_snapshot";

interface Snap {
  at: string;
  prices: Record<string, number>;
}

/** Persist current prices for the user's watchlist. Called on page unload / low frequency. */
export function snapshotWatchlist() {
  try {
    const favs = getFavorites();
    if (!favs.length) return;
    const current = getPersistedPrices();
    const prices: Record<string, number> = {};
    for (const id of favs) {
      const a = ASSETS.find((x) => x.id === id);
      const live = current[id]?.price;
      if (a) prices[id] = Number.isFinite(live) ? live : a.price;
    }
    localStorage.setItem(
      SNAPSHOT_KEY,
      JSON.stringify({ at: new Date().toISOString(), prices } satisfies Snap),
    );
  } catch {}
}

export interface WatchlistMove {
  id: string;
  symbol: string;
  name: string;
  from: number;
  to: number;
  changePct: number;
}

/** Compare current prices to the last stored snapshot. Returns biggest movers. */
export function getWatchlistMoves(): { sinceHours: number; moves: WatchlistMove[] } | null {
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY);
    if (!raw) return null;
    const snap: Snap = JSON.parse(raw);
    const elapsed = Date.now() - new Date(snap.at).getTime();
    if (!Number.isFinite(elapsed) || elapsed < 0) return null;
    const hours = elapsed / 36e5;
    const favs = getFavorites();
    const current = getPersistedPrices();
    const moves: WatchlistMove[] = [];
    for (const id of favs) {
      const a = ASSETS.find((x) => x.id === id);
      const prev = snap.prices[id];
      const latest = current[id]?.price;
      if (!a || !prev || !Number.isFinite(latest)) continue;
      const changePct = ((latest - prev) / prev) * 100;
      if (Math.abs(changePct) < 0.15) continue;
      moves.push({ id, symbol: a.symbol, name: a.name, from: prev, to: latest, changePct });
    }
    moves.sort((x, y) => Math.abs(y.changePct) - Math.abs(x.changePct));
    return { sinceHours: hours, moves: moves.slice(0, 4) };
  } catch {
    return null;
  }
}
