import type { PortfolioSnapshot, Portfolio } from './types';
import { portfolioOwnerIs, portfolioViewMatchesOwner } from './portfolioOwner';

const HISTORY_KEY = 'tradesandbox_history';

function readSnapshots(key: string): PortfolioSnapshot[] {
  try {
    const history = JSON.parse(localStorage.getItem(key) ?? '[]');
    if (!Array.isArray(history)) return [];
    return history.filter(snapshot => snapshot && Number.isFinite(new Date(snapshot.timestamp).getTime()) &&
      ['totalValue','cash','positionsValue'].every(key => typeof snapshot[key] === 'number' && Number.isFinite(snapshot[key])))
      .slice(-500).map(snapshot => ({ ...snapshot, timestamp: new Date(snapshot.timestamp) }));
  } catch { return []; }
}

export function getPortfolioHistory(): PortfolioSnapshot[] {
  return portfolioViewMatchesOwner() ? readSnapshots(HISTORY_KEY) : [];
}

const accountHistoryKey = (owner: string, cycle: string) => `tradehq:account-portfolio-history:v1:${owner}:${cycle}`;

export function getAccountPortfolioHistory(owner: string, cycle: string): PortfolioSnapshot[] {
  return portfolioOwnerIs(owner) ? readSnapshots(accountHistoryKey(owner, cycle)) : [];
}

export function recordAccountPortfolioSnapshot(owner: string, cycle: string, portfolio: Portfolio, receivedAt: number) {
  if (!portfolioOwnerIs(owner)) return;
  const history = getAccountPortfolioHistory(owner, cycle);
  const last = history[history.length - 1];
  if (last && receivedAt - last.timestamp.getTime() < 5 * 60_000 && last.totalValue === portfolio.totalValue) return;
  history.push({ timestamp: new Date(receivedAt), cash: portfolio.cash, totalValue: portfolio.totalValue,
    positionsValue: portfolio.positions.reduce((sum, position) => sum + position.currentValue, 0) });
  try { localStorage.setItem(accountHistoryKey(owner, cycle), JSON.stringify(history.slice(-500))); }
  catch { /* The current server valuation remains visible when chart storage is unavailable. */ }
}

export function addPortfolioSnapshot(snapshot: PortfolioSnapshot): void {
  if (!portfolioViewMatchesOwner()) return;
  const history = getPortfolioHistory();
  history.push(snapshot);
  
  // Keep only last 500 snapshots (more history for time-based tracking)
  if (history.length > 500) {
    history.shift();
  }
  
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); } catch { /* Chart storage is optional. */ }
}

export function recordSnapshot(cash: number, positionsValue: number): void {
  const totalValue = cash + positionsValue;
  const snapshot: PortfolioSnapshot = {
    timestamp: new Date(),
    totalValue,
    cash,
    positionsValue,
  };
  addPortfolioSnapshot(snapshot);
}
