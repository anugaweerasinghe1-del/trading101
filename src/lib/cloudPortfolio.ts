/** Account portfolios change only through server-recorded orders.
 * Browser imports remain unranked; an existing account copy always wins.
 */
import { snapshotIsStale, type SnapshotVersion } from "./snapshotVersion";
import { supabase } from "@/integrations/supabase/client";
import { ASSETS, INITIAL_CASH } from "./assets";
import { getPortfolio, savePortfolio } from "./portfolio";
import type { Portfolio, Position, Trade } from "./types";
import type { Json } from "@/integrations/supabase/types";
const OWNER_KEY = "tradehq:portfolio-owner";
const BACKUP_KEY = "tradehq_portfolio_backup";
let activeUser: string | null = null;
let syncGeneration = 0;
const snapshotVersions = new Map<string, SnapshotVersion>();
export interface ServerSnapshot {
  trades: ServerTrade[];
  cash: number; ranked: boolean; cycle_id: string; updated_at: string;
  positions: { asset_id: string; symbol: string; asset_type: string; quantity: number; avg_price: number; last_price: number;
    priced_at?: string | null; observed_at?: string | null; quote_status?: string }[];
}
export interface ServerTrade {
  id: string; asset_id: string; side: "buy" | "sell"; quantity: number;
  price: number; total: number; created_at: string; price_source: string;
}
function ownerOfLocal(): string | null {
  try { return localStorage.getItem(OWNER_KEY); } catch { return null; }
}
function backUpLocal() {
  try { localStorage.setItem(`${BACKUP_KEY}:${ownerOfLocal() ?? "guest"}:${crypto.randomUUID()}`, JSON.stringify({ savedAt: new Date().toISOString(), portfolio: getPortfolio() })); } catch { /* unavailable storage */ }
}
export function applyServerSnapshot(snapshot: ServerSnapshot, userId: string, opts: { force?: boolean } = {}): Portfolio {
  const local = getPortfolio();
  const sameOwner = ownerOfLocal() === userId;
  const quoteTimes = snapshot.positions.map(p => p.priced_at).filter((t): t is string => !!t).sort();
  const version = { cycle: snapshot.cycle_id, count: snapshot.trades?.length ?? 0, updatedAt: snapshot.updated_at, pricedAt: quoteTimes.at(-1) ?? null };
  if (sameOwner && !opts.force && snapshotIsStale(version, snapshotVersions.get(userId) ?? null)) return local;
  const serverIds = new Set((snapshot.trades ?? []).map(t => t.id));
  if (sameOwner && local.trades.some(t => !serverIds.has(t.id))) backUpLocal();
  if (!sameOwner && (local.trades.length || local.positions.length || local.cash !== INITIAL_CASH)) backUpLocal();
  const positions: Position[] = snapshot.positions.map((r) => {
    const known = ASSETS.find((a) => a.id === r.asset_id);
    if (!known) throw new Error("Unknown account asset");
    const asset = { ...known, price: Number(r.last_price) };
    const quantity = Number(r.quantity), avgPrice = Number(r.avg_price);
    const currentValue = asset.price * quantity, cost = avgPrice * quantity;
    return { asset, quantity, avgPrice, currentValue, profitLoss: currentValue - cost,
      profitLossPercent: cost ? (currentValue - cost) / cost * 100 : 0 };
  });
  const localJournals = new Map(sameOwner ? local.trades.map(t => [t.id, t.journal]) : []);
  const trades: Trade[] = (snapshot.trades ?? []).map(t => ({
    id: t.id, assetId: t.asset_id, symbol: ASSETS.find(a => a.id === t.asset_id)?.symbol ?? t.asset_id,
    type: t.side, quantity: Number(t.quantity), price: Number(t.price), total: Number(t.total),
    timestamp: new Date(t.created_at), journal: localJournals.get(t.id),
  }));
  const portfolio: Portfolio = { cash: Number(snapshot.cash), positions,
    totalValue: Number(snapshot.cash) + positions.reduce((n, p) => n + p.currentValue, 0),
    trades };
  snapshotVersions.set(userId, version);
  savePortfolio(portfolio, { silent: true });
  try { localStorage.setItem(OWNER_KEY, userId); } catch { /* unavailable storage */ }
  return portfolio;
}
export async function reconcilePortfolio(userId: string): Promise<ServerSnapshot> {
  const local = getPortfolio();
  const p_import: Json = { cash: local.cash,
    has_activity: local.trades.length > 0 || !!localStorage.getItem("tradesandbox_last_bonus"),
    positions: local.positions.map((p) => ({ asset_id: p.asset.id, quantity: p.quantity, avg_price: p.avgPrice })),
  };
  const { data, error } = await supabase.rpc("initialize_practice_portfolio", { p_import: ownerOfLocal() && ownerOfLocal() !== userId ? null : p_import });
  if (error) throw error;
  if (!data) throw new Error("Account portfolio unavailable");
  return data as unknown as ServerSnapshot;
}
/** Refreshes account state; never uploads client cash or scores. */
export async function pushPortfolio(userId: string): Promise<ServerSnapshot> {
  const generation = syncGeneration;
  const snapshot = await reconcilePortfolio(userId);
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user.id !== userId || generation !== syncGeneration) throw new Error("Account changed during refresh");
  applyServerSnapshot(snapshot, userId);
  return snapshot;
}
export async function startRankedPractice(userId: string): Promise<void> {
  await pushPortfolio(userId);
  backUpLocal();
  const { data, error } = await supabase.rpc("start_ranked_practice");
  if (error) throw error;
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user.id !== userId) throw new Error("Account changed during reset");
  savePortfolio({ cash: INITIAL_CASH, totalValue: INITIAL_CASH, positions: [], trades: [] }, { silent: true });
  applyServerSnapshot(data as unknown as ServerSnapshot, userId);
}
/** Generation prevents stale sign-in work crossing accounts. */
export async function startCloudSync(userId: string | null): Promise<ServerSnapshot | null> {
  activeUser = userId;
  const generation = ++syncGeneration;
  if (!userId) return null;
  try {
    const snapshot = await reconcilePortfolio(userId);
    if (activeUser !== userId || generation !== syncGeneration) return null;
    applyServerSnapshot(snapshot, userId);
    return snapshot;
  } catch (error) {
    console.warn("Account portfolio restoration failed", error);
    return null;
  }
}

/** Explicit recovery is read-only on the server and never imports browser JSON. */
export async function restoreAccountPortfolioFromServer(userId: string): Promise<Portfolio> {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session || session.user.id !== userId) throw new Error("Sign in to your own account to restore its portfolio.");
  const { data, error } = await supabase.rpc("get_my_account_practice_snapshot");
  if (error) throw error;
  if (!data) throw new Error("This account has no server-recorded practice portfolio to recover.");
  const { data: { session: currentSession } } = await supabase.auth.getSession();
  if (currentSession?.user.id !== userId) throw new Error("Your signed-in account changed during recovery.");
  return applyServerSnapshot(data as unknown as ServerSnapshot,userId,{force:true});
}
