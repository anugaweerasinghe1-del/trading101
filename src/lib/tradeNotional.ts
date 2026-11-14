import type { Trade } from './types';

/** Gross traded value; recorded cash movement also includes buy/sell fees. */
export function totalTradedNotional(trades: readonly Pick<Trade, 'quantity' | 'price'>[]): number {
  return trades.reduce((sum, trade) => sum + Math.abs(trade.quantity * trade.price), 0);
}
