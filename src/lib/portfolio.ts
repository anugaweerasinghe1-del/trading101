import { getRealizedTradeResults } from './realizedTrades';
import type { Portfolio, Trade, Asset, JournalEntry } from './types';
import { INITIAL_CASH, ASSETS } from './assets';
import { recordSnapshot, getPortfolioHistory } from './portfolioHistory';
import { parsePracticePortfolio, readRecoveryPortfolio, writeRecoveryPortfolio, UNREADABLE_KEY } from './portfolioRecovery';
import { portfolioViewMatchesOwner, portfolioOwnerIs } from './portfolioOwner';

const STORAGE_KEY = 'tradehq_portfolio';
const HISTORY_KEY = 'tradehq_history';
const BALANCE_MIGRATION_KEY = 'tradehq:balance-migration:v2';
const LEGACY_INITIAL_CASH = 10000;

export function getPortfolio(): Portfolio {
  // Never render another account's cache while auth restores or changes.
  if (!portfolioViewMatchesOwner()) return { cash: INITIAL_CASH, totalValue: INITIAL_CASH, positions: [], trades: [] };
  let portfolio: Portfolio | null = null;
  let hasMainRecord = false;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    hasMainRecord = Boolean(stored);
    if (stored) {
      try { portfolio = parsePracticePortfolio(JSON.parse(stored)); } catch { portfolio = null; }
      if (!portfolio && !localStorage.getItem(UNREADABLE_KEY)) {
        // Preserve the raw original before any future save can overwrite it.
        // This cannot repair an unknown legacy format, but prevents silent loss.
        try { localStorage.setItem(UNREADABLE_KEY, stored); } catch {}
      }
    }
  } catch { /* Corrupted JSON or browser storage denied: try the recovery copy. */ }

  if (!portfolio) {
    portfolio = readRecoveryPortfolio();
    if (portfolio) {
      // Never erase a known-good recovery record. This also repairs malformed
      // primary JSON after an interrupted deployment/browser write.
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolio)); } catch {}
      if (typeof window !== "undefined") {
        queueMicrotask(() => window.dispatchEvent(new CustomEvent("tradehq:portfolio-recovered")));
      }
    }
  }
  if (portfolio) {
    // Preserve the existing 10K-to-100K one-shot migration only for records
    // found in the original primary slot (never rebump a recovery snapshot).
    try {
      if (hasMainRecord && !localStorage.getItem(BALANCE_MIGRATION_KEY)) {
        const bump = INITIAL_CASH - LEGACY_INITIAL_CASH;
        if (bump > 0 && portfolio.totalValue < 80000) {
          portfolio.cash += bump;
          portfolio.totalValue += bump;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolio));
          writeRecoveryPortfolio(portfolio);
        }
        localStorage.setItem(BALANCE_MIGRATION_KEY, "1");
      }
    } catch {}
    return portfolio;
  }
  try { localStorage.setItem(BALANCE_MIGRATION_KEY, "1"); } catch {}
  return { cash: INITIAL_CASH, totalValue: INITIAL_CASH, positions: [], trades: [] };
}

const UPDATED_AT_KEY = 'tradehq_portfolio_updated_at';
let saveListener: ((p: Portfolio) => void) | null = null;

/** Registered by the cloud sync module so signed-in saves reach the database. */
export function setPortfolioSaveListener(fn: (p: Portfolio) => void) {
  saveListener = fn;
}

export function getLocalUpdatedAt(): number {
  try { return Number(localStorage.getItem(UPDATED_AT_KEY) || 0); } catch { return 0; }
}

export function savePortfolio(portfolio: Portfolio, opts: { silent?: boolean } = {}): boolean {
  if (!portfolioViewMatchesOwner()) return false;
  let persisted = false;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolio));
    persisted = true;
    localStorage.setItem(UPDATED_AT_KEY, String(Date.now()));
  } catch { /* Warn the visitor; don't falsely promise a durable saved trade. */ }
  const recoverySaved = writeRecoveryPortfolio(portfolio);
  if ((!persisted || !recoverySaved) && typeof window !== "undefined")
    window.dispatchEvent(new Event("tradehq:portfolio-storage-warning"));
  if (!opts.silent) saveListener?.(portfolio);
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('tradehq:portfolio-updated'));
  return persisted || recoverySaved;
}

/** Commit against the latest persisted guest state, never a page's stale render. */
export function executeGuestTrade(asset: Asset, type: 'buy' | 'sell', quantity: number) {
  if (type !== 'buy' && type !== 'sell') return { success: false, message: 'Invalid order side' };
  if (!Number.isFinite(quantity) || quantity <= 0 || quantity >= 1e15 ||
      !Number.isFinite(asset.price) || asset.price <= 0) {
    return { success: false, message: 'Enter a valid positive quantity and price' };
  }
  const total = asset.price * quantity;
  const fee = total * 0.001;
  if (!Number.isFinite(total + fee) || total + fee >= 1e13)
    return { success: false, message: 'Order value is too large' };

  const current = getPortfolio();
  // The account cache must never become a writable guest portfolio on sign-out.
  try {
    if (localStorage.getItem('tradehq:portfolio-owner'))
      return { success: false, message: 'Sign in to restore your account before trading.' };
  } catch { return { success: false, message: 'Browser storage is unavailable. Your order was not saved.' }; }
  const portfolio: Portfolio = { ...current, positions: current.positions.map(p => ({ ...p, asset: { ...p.asset } })), trades: [...current.trades] };
  const position = portfolio.positions.find(p => p.asset.id === asset.id);
  if (type === 'buy') {
    if (portfolio.cash < total + fee) return { success: false, message: 'Insufficient funds' };
    portfolio.cash -= total + fee;
    if (position) {
      const cost = position.avgPrice * position.quantity + total + fee;
      position.quantity += quantity;
      position.avgPrice = cost / position.quantity;
    } else {
      portfolio.positions.push({ asset: { ...asset }, quantity, avgPrice: (total + fee) / quantity,
        currentValue: total, profitLoss: -fee, profitLossPercent: -fee / (total + fee) * 100 });
    }
  } else {
    if (!position || position.quantity < quantity) return { success: false, message: 'Insufficient shares' };
    portfolio.cash += total - fee;
    position.quantity -= quantity;
    if (position.quantity === 0) portfolio.positions = portfolio.positions.filter(p => p !== position);
  }
  // Both buy and sell revalue remaining units at this order's execution price.
  const remaining = portfolio.positions.find(p => p.asset.id === asset.id);
  if (remaining) {
    remaining.asset = { ...asset };
    remaining.currentValue = asset.price * remaining.quantity;
    const cost = remaining.avgPrice * remaining.quantity;
    remaining.profitLoss = remaining.currentValue - cost;
    remaining.profitLossPercent = cost ? remaining.profitLoss / cost * 100 : 0;
  }
  // Preserve execution order even when two orders land in one millisecond.
  const lastTradeTime = current.trades.reduce((latest, t) => Math.max(latest, new Date(t.timestamp).getTime()), 0);
  portfolio.trades.unshift({ id: crypto.randomUUID(), assetId: asset.id, symbol: asset.symbol, type,
    quantity, price: asset.price, total: type === 'buy' ? total + fee : total - fee,
    timestamp: new Date(Math.max(Date.now(), lastTradeTime + 1)) });
  const positionsValue = portfolio.positions.reduce((sum, p) => sum + p.currentValue, 0);
  portfolio.totalValue = portfolio.cash + positionsValue;
  if (!savePortfolio(portfolio))
    return { success: false, message: 'Browser storage is full or unavailable. Your order was not saved.' };
  // Chart storage is auxiliary: corruption/quota failures must not invalidate an order.
  try { recordSnapshot(portfolio.cash, positionsValue); } catch { /* Keep the saved order. */ }
  return { success: true, message: `${type === 'buy' ? 'Bought' : 'Sold'} ${quantity} ${asset.symbol}`, portfolio };
}

let guestOrderQueue: Promise<unknown> = Promise.resolve();
async function withGuestOrderLock<T>(order: () => Promise<T>): Promise<T> {
  // Web Locks serialize same-origin tabs. The queue also covers browsers without it.
  const run = () => typeof navigator !== 'undefined' && navigator.locks
    ? navigator.locks.request('tradehq:guest-order', order) : order();
  const pending = guestOrderQueue.then(run, run);
  guestOrderQueue = pending.catch(() => {});
  return pending;
}

/** Signed-in orders are atomic server transactions; failures never execute locally. */
interface TradeExecutionResult { success: boolean; message: string; portfolio?: Portfolio; ownerId?: string | null; tradeId?: string }
export async function executeTrade(portfolio: Portfolio, asset: Asset, side: 'buy' | 'sell', quantity: number): Promise<TradeExecutionResult> {
  const { supabase } = await import('@/integrations/supabase/client');
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  if (authError) return { success: false, message: 'Could not verify your account. Try again.' };
  if (!session) return withGuestOrderLock(async () => {
    const { data: current, error } = await supabase.auth.getSession();
    if (error || current.session) return { success: false, message: 'Account changed during order. Please try again.' };
    const result = executeGuestTrade(asset, side, quantity);
    return { ...result, ownerId: null, tradeId: result.portfolio?.trades[0]?.id };
  });
  try {
    const { reconcilePortfolio, applyServerSnapshot } = await import('./cloudPortfolio');
    await reconcilePortfolio(session.user.id);
    const { data, error } = await supabase.rpc('record_practice_trade', {
      p_asset_id: asset.id, p_side: side, p_quantity: quantity, p_request_id: crypto.randomUUID(),
    });
    if (error) throw error;
    const result = data as unknown as { portfolio: import('./cloudPortfolio').ServerSnapshot; trade: import('./cloudPortfolio').ServerTrade };
    const { data: current } = await supabase.auth.getSession();
    if (current.session?.user.id !== session.user.id) throw new Error('Account changed during order');
    const restored = applyServerSnapshot(result.portfolio, session.user.id);
    // A delayed response from a prior practice cycle must not append its trade
    // after the snapshot version guard has rejected that older cycle.
    return { success: true, portfolio: restored, ownerId: session.user.id, tradeId: result.trade.id,
      message: `${side === 'buy' ? 'Bought' : 'Sold'} ${quantity} ${asset.symbol} at $${Number(result.trade.price).toLocaleString()} · ${result.trade.price_source}` };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : (error as { message?: string })?.message || 'Account order failed. Try again.' };
  }
}

/** Attach notes to the matching latest trade, never re-save an old order result. */
export function saveTradeJournal(tradeId: string, journal: JournalEntry, owner: string | null): Portfolio | null {
  if (!portfolioOwnerIs(owner)) return null;
  const latest = getPortfolio();
  if (!latest.trades.some(trade => trade.id === tradeId)) return null;
  const next = { ...latest, trades: latest.trades.map(trade => trade.id === tradeId ? { ...trade, journal } : trade) };
  return savePortfolio(next, { silent: true }) ? next : null;
}

export function updatePositionPrices(
  portfolio: Portfolio,
  currentAssets: Asset[] = ASSETS,
): Portfolio {
  const newPortfolio = { ...portfolio };
  newPortfolio.positions = newPortfolio.positions.map((position) => {
    const currentAsset = currentAssets.find((a) => a.id === position.asset.id);
    if (currentAsset) {
      const currentValue = currentAsset.price * position.quantity;
      const totalCost = position.avgPrice * position.quantity;
      return {
        ...position,
        asset: currentAsset,
        currentValue,
        profitLoss: currentValue - totalCost,
        profitLossPercent: ((currentValue - totalCost) / totalCost) * 100,
      };
    }
    return position;
  });

  newPortfolio.totalValue =
    newPortfolio.cash +
    newPortfolio.positions.reduce((sum, p) => sum + p.currentValue, 0);

  return newPortfolio;
}

/** Closed sells use fee-inclusive weighted-average costs and net proceeds. */
export function calculateClosedTradeStats(portfolio: Portfolio): { sells: number; wins: number; winRate: number } {
  const results = getRealizedTradeResults(portfolio.trades);
  const wins = results.filter(result => result.profit > 0).length;
  return { sells: results.length, wins, winRate: results.length ? Math.round(wins / results.length * 100) : 0 };
}

export function calculateRealizedPnL(portfolio: Portfolio): number {
  return getRealizedTradeResults(portfolio.trades).reduce((sum, result) => sum + result.profit, 0);
}

/**
 * Max drawdown from local snapshot history (peak-to-trough %).
 */
export function calculateMaxDrawdown(): number {
  const history = getPortfolioHistory();
  if (history.length < 2) return 0;
  let peak = history[0].totalValue;
  let maxDd = 0;
  for (const snap of history) {
    if (snap.totalValue > peak) peak = snap.totalValue;
    if (peak > 0) {
      const dd = ((peak - snap.totalValue) / peak) * 100;
      if (dd > maxDd) maxDd = dd;
    }
  }
  return maxDd;
}

/**
 * Day change: total value now vs ~24h ago snapshot. Returns null if no snapshot ≥ 20h old.
 */
export function calculateDayChange(currentValue: number): { dollars: number; percent: number } | null {
  const history = getPortfolioHistory();
  if (history.length === 0) return null;
  const cutoff = Date.now() - 20 * 60 * 60 * 1000;
  // Find oldest snapshot newer than cutoff... actually we want the snapshot closest to 24h ago
  const dayAgoTarget = Date.now() - 24 * 60 * 60 * 1000;
  let candidate = history[0];
  for (const s of history) {
    const t = new Date(s.timestamp).getTime();
    if (t <= cutoff) candidate = s;
    else break;
  }
  const candTime = new Date(candidate.timestamp).getTime();
  if (candTime > cutoff) return null; // no 20h+ old snapshot yet
  const dollars = currentValue - candidate.totalValue;
  const percent = candidate.totalValue > 0 ? (dollars / candidate.totalValue) * 100 : 0;
  return { dollars, percent };
}
