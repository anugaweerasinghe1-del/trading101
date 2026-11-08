/** Account portfolios change only through server-recorded orders.
 * Browser imports remain unranked; an existing account copy always wins.
 */
import { snapshotIsStale, type SnapshotVersion } from "./snapshotVersion";
import { supabase } from "@/integrations/supabase/client";
import { ASSETS, INITIAL_CASH } from "./assets";
import { getPortfolio, savePortfolio } from "./portfolio";
import type { Portfolio, Position, Trade } from "./types";
import type { Json } from "@/integrations/supabase/types";
import { portfolioOwnerIs, pendingGuestPortfolio, clearPendingGuestPortfolio } from './portfolioOwner';
import { parsePracticePortfolio } from './portfolioRecovery';
import { recordAccountPortfolioSnapshot } from './portfolioHistory';
const OWNER_KEY = "tradehq:portfolio-owner";
const BACKUP_KEY = "tradehq_portfolio_backup";
let activeUser: string | null = null;
let syncGeneration = 0;
let acceptedVersion: SnapshotVersion | null = null;
let accountView: AccountPortfolioView | null = null;
let refreshInFlight: { generation: number; promise: Promise<ServerSnapshot> } | null = null;
const accountEvent = "tradehq:account-portfolio-updated";

interface AccountPortfolioView {
  portfolio: Portfolio | null;
  snapshot: ServerSnapshot | null;
  receivedAt: number | null;
  error: string | null;
}

function publishAccountView(view: AccountPortfolioView | null) {
  accountView = view;
  window.dispatchEvent(new Event(accountEvent));
}

export function getAccountPortfolio(userId: string | undefined) {
  return userId && userId === activeUser ? accountView : null;
}

export function subscribeAccountPortfolio(listener: () => void) {
  window.addEventListener(accountEvent, listener);
  return () => window.removeEventListener(accountEvent, listener);
}

export function setCloudPortfolioOwner(userId: string | null) {
  if (activeUser === userId) return;
  activeUser = userId;
  syncGeneration++;
  acceptedVersion = null;
  refreshInFlight = null;
  publishAccountView(null);
}
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
export function applyServerSnapshot(snapshot: ServerSnapshot, userId: string): Portfolio {
  if (userId !== activeUser) throw new Error("The signed-in account changed.");
  const local = getPortfolio();
  const sameOwner = portfolioOwnerIs(userId);
  if (!snapshot || !Array.isArray(snapshot.positions) || !Array.isArray(snapshot.trades) ||
      !Number.isFinite(Number(snapshot.cash)) || snapshot.cash == null)
    throw new Error("The account snapshot could not be validated.");
  const version = { cycle: snapshot.cycle_id, count: snapshot.trades.length, updatedAt: snapshot.updated_at,
    prices: new Map(snapshot.positions.map(position => [position.asset_id, position.priced_at])) };
  if (accountView?.portfolio && snapshotIsStale(version, acceptedVersion)) return accountView.portfolio;
  const serverIds = new Set((snapshot.trades ?? []).map(t => t.id));
  if (sameOwner && local.trades.some(t => !serverIds.has(t.id))) backUpLocal();
  const positions: Position[] = snapshot.positions.map((r) => {
    const known = ASSETS.find((a) => a.id === r.asset_id);
    if (!known) throw new Error("The account snapshot contains an unsupported asset.");
    const asset = { ...known, price: Number(r.last_price) };
    const quantity = Number(r.quantity), avgPrice = Number(r.avg_price);
    if (!Number.isFinite(asset.price) || asset.price <= 0 || !Number.isFinite(quantity) || quantity <= 0 ||
        !Number.isFinite(avgPrice) || avgPrice <= 0) throw new Error("The account snapshot contains an invalid position.");
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
  acceptedVersion = version;
  const receivedAt = Date.now();
  if (sameOwner) {
    recordAccountPortfolioSnapshot(userId, snapshot.cycle_id, portfolio, receivedAt);
    savePortfolio(portfolio, { silent: true });
  }
  publishAccountView({ portfolio, snapshot, receivedAt, error: null });
  return portfolio;
}
export async function reconcilePortfolio(userId: string): Promise<ServerSnapshot> {
  const generation = syncGeneration;
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  if (authError || session?.user.id !== userId) throw new Error('Account changed before portfolio refresh');
  const { data: existing, error: readError } = await supabase.rpc("get_my_account_practice_snapshot");
  if (readError) throw new Error("The account snapshot could not be read.");
  if (generation !== syncGeneration) throw new Error("The signed-in account changed.");
  if (existing) {
    clearPendingGuestPortfolio(userId);
    return existing as unknown as ServerSnapshot;
  }
  const { data: { session: currentSession } } = await supabase.auth.getSession();
  if (currentSession?.user.id !== userId || generation !== syncGeneration) throw new Error("The signed-in account changed.");
  const sameOwner = portfolioOwnerIs(userId);
  const local = sameOwner ? parsePracticePortfolio(pendingGuestPortfolio(userId)) ?? getPortfolio() : null;
  const p_import: Json = local ? { cash: local.cash,
    has_activity: local.trades.length > 0 || !!localStorage.getItem("tradesandbox_last_bonus"),
    positions: local.positions.map((p) => ({ asset_id: p.asset.id, quantity: p.quantity, avg_price: p.avgPrice })),
  } : null;
  const { data, error } = await supabase.rpc("initialize_practice_portfolio", { p_import: ownerOfLocal() && ownerOfLocal() !== userId ? null : p_import });
  if (error) throw error;
  if (!data) throw new Error("Account portfolio unavailable");
  if (generation !== syncGeneration) throw new Error("The signed-in account changed.");
  clearPendingGuestPortfolio(userId);
  return data as unknown as ServerSnapshot;
}
/** Coalesce manual, restore, and realtime reads within one signed-in session. */
export async function pushPortfolio(userId: string): Promise<ServerSnapshot> {
  const generation = syncGeneration;
  if (activeUser !== userId) throw new Error("The signed-in account changed.");
  if (refreshInFlight?.generation === generation) return refreshInFlight.promise;
  const promise = (async () => {
    try {
      const snapshot = await reconcilePortfolio(userId);
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user.id !== userId || generation !== syncGeneration) throw new Error("The signed-in account changed.");
      applyServerSnapshot(snapshot, userId);
      return accountView?.snapshot ?? snapshot;
    } catch (error) {
      if (generation === syncGeneration && activeUser === userId) {
        publishAccountView({
          portfolio: accountView?.portfolio ?? null, snapshot: accountView?.snapshot ?? null,
          receivedAt: accountView?.receivedAt ?? null,
          error: error instanceof Error ? error.message : "The account service did not return a snapshot.",
        });
      }
      throw error;
    } finally {
      if (refreshInFlight?.generation === generation) refreshInFlight = null;
    }
  })();
  refreshInFlight = { generation, promise };
  return promise;
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
  setCloudPortfolioOwner(userId);
  if (!userId) return null;
  try { return await pushPortfolio(userId); }
  catch { return null; }
}

/** Explicit recovery is read-only on the server and never imports browser JSON. */
export async function restoreAccountPortfolioFromServer(userId: string): Promise<Portfolio> {
  const generation = syncGeneration;
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session || session.user.id !== userId) throw new Error("Sign in to your own account to restore its portfolio.");
  const { data, error } = await supabase.rpc("get_my_account_practice_snapshot");
  if (error) throw error;
  if (!data) throw new Error("This account has no server-recorded practice portfolio to recover.");
  const { data: { session: currentSession } } = await supabase.auth.getSession();
  if (currentSession?.user.id !== userId || generation !== syncGeneration) throw new Error("Your signed-in account changed during recovery.");
  return applyServerSnapshot(data as unknown as ServerSnapshot, userId);
}
