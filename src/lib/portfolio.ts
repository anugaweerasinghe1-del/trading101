import { getRealizedTradeResults } from './realizedTrades';
import { Portfolio, Trade, Position, Asset } from './types';
import { INITIAL_CASH, ASSETS } from './assets';
import { recordSnapshot, getPortfolioHistory } from './portfolioHistory';
import { parsePracticePortfolio, readRecoveryPortfolio, writeRecoveryPortfolio, UNREADABLE_KEY } from './portfolioRecovery';

const STORAGE_KEY = 'tradehq_portfolio';
const HISTORY_KEY = 'tradehq_history';
const BALANCE_MIGRATION_KEY = 'tradehq:balance-migration:v2';
const LEGACY_INITIAL_CASH = 10000;

export function getPortfolio(): Portfolio {
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

export function savePortfolio(portfolio: Portfolio, opts: { silent?: boolean } = {}): void {
  let persisted = false;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolio));
    localStorage.setItem(UPDATED_AT_KEY, String(Date.now()));
    persisted = true;
  } catch { /* Warn the visitor; don't falsely promise a durable saved trade. */ }
  const recoverySaved = writeRecoveryPortfolio(portfolio);
  if ((!persisted || !recoverySaved) && typeof window !== "undefined")
    window.dispatchEvent(new Event("tradehq:portfolio-storage-warning"));
  if (!opts.silent) saveListener?.(portfolio);
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('tradehq:portfolio-updated'));
}

function executeLocalTrade(
  portfolio: Portfolio,
  asset: Asset,
  type: 'buy' | 'sell',
  quantity: number
): { success: boolean; message: string; portfolio?: Portfolio } {
  if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(asset.price) || asset.price <= 0) {
    return { success: false, message: 'Enter a valid positive quantity and price' };
  }
  const total = asset.price * quantity;
  const fee = total * 0.001; // 0.1% fee
  const totalWithFee = total + fee;

  if (type === 'buy') {
    if (portfolio.cash < totalWithFee) {
      return { success: false, message: 'Insufficient funds' };
    }

    const newPortfolio = { ...portfolio };
    newPortfolio.cash -= totalWithFee;

    // Update or create position
    const existingPosition = newPortfolio.positions.find(
      (p) => p.asset.id === asset.id
    );

    if (existingPosition) {
      const totalQuantity = existingPosition.quantity + quantity;
      const totalCost =
        existingPosition.avgPrice * existingPosition.quantity + total;
      existingPosition.quantity = totalQuantity;
      existingPosition.avgPrice = totalCost / totalQuantity;
      existingPosition.currentValue = asset.price * totalQuantity;
      existingPosition.profitLoss =
        existingPosition.currentValue - totalCost;
      existingPosition.profitLossPercent =
        (existingPosition.profitLoss / totalCost) * 100;
    } else {
      newPortfolio.positions.push({
        asset,
        quantity,
        avgPrice: asset.price,
        currentValue: total,
        profitLoss: 0,
        profitLossPercent: 0,
      });
    }

    // Add trade
    const trade: Trade = {
      id: Date.now().toString(),
      assetId: asset.id,
      symbol: asset.symbol,
      type,
      quantity,
      price: asset.price,
      total: totalWithFee,
      timestamp: new Date(),
    };
    newPortfolio.trades.unshift(trade);

    // Update total value
    const positionsValue = newPortfolio.positions.reduce((sum, p) => sum + p.currentValue, 0);
    newPortfolio.totalValue = newPortfolio.cash + positionsValue;

    // Record snapshot for chart
    recordSnapshot(newPortfolio.cash, positionsValue);

    savePortfolio(newPortfolio);
    return {
      success: true,
      message: `Bought ${quantity} ${asset.symbol}`,
      portfolio: newPortfolio,
    };
  } else {
    // Sell
    const position = portfolio.positions.find((p) => p.asset.id === asset.id);
    if (!position || position.quantity < quantity) {
      return { success: false, message: 'Insufficient shares' };
    }

    const newPortfolio = { ...portfolio };
    newPortfolio.cash += total - fee;

    // Update position
    position.quantity -= quantity;
    if (position.quantity === 0) {
      newPortfolio.positions = newPortfolio.positions.filter(
        (p) => p.asset.id !== asset.id
      );
    } else {
      position.currentValue = asset.price * position.quantity;
      const totalCost = position.avgPrice * position.quantity;
      position.profitLoss = position.currentValue - totalCost;
      position.profitLossPercent = (position.profitLoss / totalCost) * 100;
    }

    // Add trade
    const trade: Trade = {
      id: Date.now().toString(),
      assetId: asset.id,
      symbol: asset.symbol,
      type,
      quantity,
      price: asset.price,
      total: total - fee,
      timestamp: new Date(),
    };
    newPortfolio.trades.unshift(trade);

    // Update total value
    const positionsValue = newPortfolio.positions.reduce((sum, p) => sum + p.currentValue, 0);
    newPortfolio.totalValue = newPortfolio.cash + positionsValue;

    // Record snapshot for chart
    recordSnapshot(newPortfolio.cash, positionsValue);

    savePortfolio(newPortfolio);
    return {
      success: true,
      message: `Sold ${quantity} ${asset.symbol}`,
      portfolio: newPortfolio,
    };
  }
}

/** Signed-in orders are atomic server transactions; failures never execute locally. */
export async function executeTrade(portfolio: Portfolio, asset: Asset, side: 'buy' | 'sell', quantity: number) {
  const { supabase } = await import('@/integrations/supabase/client');
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  if (authError) return { success: false, message: 'Could not verify your account. Try again.' };
  if (!session) return executeLocalTrade(portfolio, asset, side, quantity);
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
    if (!restored.trades.some(t => t.id === result.trade.id)) restored.trades.unshift({
      id: result.trade.id, assetId: asset.id, symbol: asset.symbol, type: side,
      quantity: Number(result.trade.quantity), price: Number(result.trade.price),
      total: Number(result.trade.total), timestamp: new Date(result.trade.created_at),
    });
    savePortfolio(restored, { silent: true });
    return { success: true, portfolio: restored,
      message: `${side === 'buy' ? 'Bought' : 'Sold'} ${quantity} ${asset.symbol} at $${Number(result.trade.price).toLocaleString()} · ${result.trade.price_source}` };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : (error as { message?: string })?.message || 'Account order failed. Try again.' };
  }
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
