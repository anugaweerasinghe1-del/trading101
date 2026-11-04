import { PortfolioSnapshot, Portfolio, Position } from './types';
import { ASSETS } from './assets';
import { portfolioViewMatchesOwner, portfolioSessionRevision } from './portfolioOwner';
import { 
  getHoursSinceLastUpdate, 
  setLastUpdateTime, 
  simulateAssetPrices,
  fetchMarketPredictions
} from './priceSimulation';

const HISTORY_KEY = 'tradesandbox_history';

export function getPortfolioHistory(): PortfolioSnapshot[] {
  if (!portfolioViewMatchesOwner()) return [];
  try {
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]');
    if (!Array.isArray(history)) return [];
    return history.filter(snapshot => snapshot && Number.isFinite(new Date(snapshot.timestamp).getTime()) &&
      ['totalValue','cash','positionsValue'].every(key => typeof snapshot[key] === 'number' && Number.isFinite(snapshot[key])))
      .slice(-500).map(snapshot => ({ ...snapshot, timestamp: new Date(snapshot.timestamp) }));
  } catch { return []; }
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

/**
 * Update portfolio with simulated price changes over time
 * Creates synthetic hourly backfill, not observed account history or an AI forecast.
 */
export async function updatePortfolioOverTime(portfolio: Portfolio): Promise<Portfolio> {
  const revision = portfolioSessionRevision();
  const hoursElapsed = getHoursSinceLastUpdate();
  
  // If less than 1 hour has passed, no update needed
  if (hoursElapsed < 1) {
    return portfolio;
  }
  
  // Calculate how many hourly snapshots to create (no max limit for long-term accuracy)
  const hoursToSimulate = Math.floor(hoursElapsed);
  
  if (hoursToSimulate === 0) {
    return portfolio;
  }
  
  // The retired prediction fetch returns no parameters; use the practice model.
  const predictions = await fetchMarketPredictions(ASSETS);
  if (revision !== portfolioSessionRevision() || !portfolioViewMatchesOwner()) return portfolio;
  console.log('Using practice model parameters for portfolio backfill:', Object.keys(predictions).length, 'assets');
  
  // Get current asset prices
  let currentAssets = [...ASSETS];
  
  // Simulate price changes for each hour that passed
  for (let i = 0; i < hoursToSimulate; i++) {
    // Simulate one hour of practice movement using the supplied model parameters.
    currentAssets = simulateAssetPrices(currentAssets, 1, predictions);
    
    // Calculate portfolio value with new prices
    let positionsValue = 0;
    const updatedPositions = portfolio.positions.map(position => {
      const updatedAsset = currentAssets.find(a => a.id === position.asset.id);
      if (updatedAsset) {
        const currentValue = updatedAsset.price * position.quantity;
        positionsValue += currentValue;
        return {
          ...position,
          asset: updatedAsset,
          currentValue,
        };
      }
      return position;
    });
    
    // Record a snapshot for this hour
    const snapshotTime = new Date(Date.now() - (hoursToSimulate - i - 1) * 60 * 60 * 1000);
    const snapshot: PortfolioSnapshot = {
      timestamp: snapshotTime,
      totalValue: portfolio.cash + positionsValue,
      cash: portfolio.cash,
      positionsValue,
    };
    addPortfolioSnapshot(snapshot);
  }
  
  // Update the last update time
  setLastUpdateTime(new Date());
  
  // Return updated portfolio with new prices
  const finalAssets = currentAssets;
  const updatedPositions: Position[] = portfolio.positions.map(position => {
    const updatedAsset = finalAssets.find(a => a.id === position.asset.id);
    if (updatedAsset) {
      const currentValue = updatedAsset.price * position.quantity;
      const totalCost = position.avgPrice * position.quantity;
      return {
        ...position,
        asset: updatedAsset,
        currentValue,
        profitLoss: currentValue - totalCost,
        profitLossPercent: ((currentValue - totalCost) / totalCost) * 100,
      };
    }
    return position;
  });
  
  const positionsValue = updatedPositions.reduce((sum, p) => sum + p.currentValue, 0);
  
  return {
    ...portfolio,
    positions: updatedPositions,
    totalValue: portfolio.cash + positionsValue,
  };
}
