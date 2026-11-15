import type { Portfolio } from './types';

/** Describe current marks and an explicitly chosen sensitivity, never suitability. */
export function portfolioExposureSummary(portfolio: Portfolio): string | null {
  const positions = portfolio.positions.filter(p => Number.isFinite(p.currentValue) && p.currentValue > 0);
  const invested = positions.reduce((sum, p) => sum + p.currentValue, 0);
  const cash = portfolio.cash;
  const account = cash + invested;
  if (!positions.length || !Number.isFinite(cash) || !Number.isFinite(account) || account <= 0) return null;
  const largest = positions.reduce((a, b) => a.currentValue >= b.currentValue ? a : b);
  const investedWeight = largest.currentValue / invested * 100;
  const accountWeight = largest.currentValue / account * 100;
  const loss = largest.currentValue * 0.1;
  return `${largest.asset.symbol} is ${investedWeight.toFixed(1)}% of invested holdings and ${accountWeight.toFixed(2)}% of total account value, including cash. In a hypothetical 10% decline in this holding alone, with other marks and cash unchanged, account value falls by $${loss.toFixed(2)} (${(loss / account * 100).toFixed(3)}%) before additional costs. This is a sensitivity example, not a forecast or loss limit.`;
}
