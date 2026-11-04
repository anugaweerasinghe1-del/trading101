import assert from 'node:assert/strict';
import { executeGuestTrade, getPortfolio, savePortfolio } from '../src/lib/portfolio.ts';
import { exportPracticeBackup, parsePracticeBackup } from '../src/lib/portfolioRecovery.ts';
import { calculateRealizedPnL } from '../src/lib/portfolio.ts';
import type { Asset } from '../src/lib/types.ts';

const values = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
  getItem: (key: string) => values.get(key) ?? null,
  setItem: (key: string, value: string) => values.set(key, value),
  removeItem: (key: string) => values.delete(key),
} });
const asset: Asset = { id: 'aapl', symbol: 'AAPL', name: 'Example', type: 'stock', price: 100, change: 0, changePercent: 0 };
const close = (actual: number, expected: number) => assert.ok(Math.abs(actual - expected) < 1e-7, `${actual} != ${expected}`);
savePortfolio({ cash: 100000, totalValue: 100000, positions: [], trades: [] });
const first = executeGuestTrade(asset, 'buy', 10);
assert.equal(first.success, true);
const firstBefore = JSON.stringify(first.portfolio);
const second = executeGuestTrade({ ...asset, price: 200 }, 'buy', 5);
assert.equal(second.success, true);
assert.equal(JSON.stringify(first.portfolio), firstBefore, 'the prior render must stay immutable');
close(second.portfolio!.cash, 97998);
close(second.portfolio!.positions[0].avgPrice, 2002 / 15);
assert.equal(second.portfolio!.positions[0].asset.price, 200);
assert.equal(second.portfolio!.positions[0].quantity, 15);
assert.equal(new Set(second.portfolio!.trades.map(t => t.id)).size, 2);
assert.ok(second.portfolio!.trades[0].timestamp > second.portfolio!.trades[1].timestamp);
assert.deepEqual(getPortfolio(), second.portfolio, 'refresh retains cash, positions and trades');
const sold = executeGuestTrade({ ...asset, price: 200 }, 'sell', 5).portfolio!;
close(sold.cash, 98997);
close(sold.positions[0].avgPrice, 2002 / 15);
close(sold.positions[0].currentValue, 2000);
close(calculateRealizedPnL(sold), 999 - (2002 / 15) * 5);
const backup = parsePracticeBackup(exportPracticeBackup(sold));
assert.deepEqual(backup, sold, 'a new guest portfolio must round-trip through backup validation');
const before = JSON.stringify(getPortfolio());
for (const quantity of [0, -1, NaN, Infinity, 1e15]) assert.equal(executeGuestTrade(asset, 'buy', quantity).success, false);
assert.equal(executeGuestTrade({ ...asset, price: Number.MAX_VALUE }, 'sell', 1).success, false);
assert.equal(executeGuestTrade(asset, 'sell', 11).success, false);
assert.equal(executeGuestTrade(asset, 'buy', 100000).success, false);
assert.equal(JSON.stringify(getPortfolio()), before, 'rejected orders preserve every record');
values.set('tradesandbox_history', 'broken JSON');
assert.equal(executeGuestTrade(asset, 'sell', 10).success, true, 'chart corruption must not abort a saved trade');
assert.equal(getPortfolio().positions.length, 0);
values.set('tradehq:portfolio-owner', 'isolated-account-fixture');
const accountBefore = values.get('tradehq_portfolio');
assert.equal(executeGuestTrade(asset, 'buy', 1).success, false);
assert.equal(values.get('tradehq_portfolio'), accountBefore, 'signed-out account cache is never writable as guest state');
values.delete('tradehq:portfolio-owner');
const storage = globalThis.localStorage;
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
  ...storage, setItem: () => { throw new Error('Fixture: quota exceeded'); },
} });
assert.equal(executeGuestTrade(asset, 'buy', 1).success, false, 'failed persistence must not report an executed order');
assert.equal(values.get('tradehq_portfolio'), accountBefore);
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });
console.log('PASS guest sequential orders, fee costs, immutable snapshots, refresh, backup round-trip, rejected orders, corrupt chart and account cache guard');
