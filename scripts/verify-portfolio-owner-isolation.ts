import assert from 'node:assert/strict';
import { activatePortfolioOwner, portfolioOwnerIs, PORTFOLIO_OWNER_KEY, PORTFOLIO_CACHE_PREFIX, PORTFOLIO_SWITCH_KEY, pendingGuestPortfolio } from '../src/lib/portfolioOwner.ts';
import { getPortfolio, savePortfolio, executeGuestTrade, saveTradeJournal } from '../src/lib/portfolio.ts';
import { applyUnverifiedGuestRestore, readPreviousGuestPortfolio } from '../src/lib/portfolioRecovery.ts';
import type { Portfolio } from '../src/lib/types.ts';
import { getAccountPortfolioHistory, getPortfolioHistory, recordAccountPortfolioSnapshot } from '../src/lib/portfolioHistory.ts';
import { portfolioChartPoints } from '../src/lib/portfolioChartPoints.ts';
import { getAnalysis } from '../src/lib/tradingJournal.ts';
const values = new Map<string, string>();
const storage = {
  getItem: (key: string) => values.get(key) ?? null,
  setItem: (key: string, value: string) => { values.set(key, value); },
  removeItem: (key: string) => { values.delete(key); },
};
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });
const asset = { id: 'aapl', symbol: 'AAPL', name: 'Fixture', type: 'stock' as const, price: 100, change: 0, changePercent: 0 };
const guest = executeGuestTrade(asset, 'buy', 1).portfolio!;
const guestBytes = values.get('tradehq_portfolio');
values.set('tradesandbox_history', '[{"totalValue":99999.9}]');
values.set('tradehq:guest-restore-undo:v1', JSON.stringify({ format: 'tradehq-practice-portfolio', version: 1, portfolio: guest }));
activatePortfolioOwner('fixture-a');
assert.equal(portfolioOwnerIs('fixture-a'), true);
assert.deepEqual(pendingGuestPortfolio('fixture-a'), JSON.parse(guestBytes!));
assert.equal(getPortfolio().trades.length, 0, 'a new account never displays guest trades before server restoration');
assert.equal(readPreviousGuestPortfolio(), null, 'guest undo cannot be used in an account');
const privateAccount: Portfolio = { ...guest, cash: 98000, totalValue: 98100,
  trades: guest.trades.map(t => ({ ...t, id: 'server-trade-a', journal: { notes: 'PRIVATE ACCOUNT A', reasoning: 'private', emotions: [] } })) };
savePortfolio(privateAccount, { silent: true });
const today = Date.now();
const only = { timestamp: new Date(today - 60_000), totalValue: 100031.20, cash: 98000, positionsValue: 2031.20 };
assert.equal(portfolioChartPoints([], 100031.20, true, today).length, 1,
  'A confirmed account valuation is a single real point when local history is empty');
assert.equal(portfolioChartPoints([], 100031.20, true)[0], undefined,
  'Never plot an account observation before a confirmed receipt');
assert.equal(portfolioChartPoints([], 100031.20, false, today).length, 0,
  'Guest graphs cannot borrow account observations');
assert.deepEqual(portfolioChartPoints([only], 100031.20, true, today).map(p => p.value), [100031.20],
  'The same valuation must not fabricate a second history point');
assert.deepEqual(portfolioChartPoints([only], 100045.00, true, today).map(p => p.value), [100031.20, 100045],
  'Two genuinely different received observations can show a trend');
assert.equal(portfolioChartPoints([only], 99999.00, true, today - 2 * 60_000).length, 1,
  'Older received observations cannot overwrite a newer chart point');

recordAccountPortfolioSnapshot('fixture-a', 'cycle-1', privateAccount, today - 3 * 24 * 60 * 60_000);
recordAccountPortfolioSnapshot('fixture-a', 'cycle-1', { ...privateAccount, totalValue: 98105 }, today);
assert.deepEqual(getAccountPortfolioHistory('fixture-a', 'cycle-1').map(s => s.totalValue), [98100, 98105]);
assert.deepEqual(getAccountPortfolioHistory('fixture-a', 'new-cycle'), []);

values.set('trading_journal_analysis', 'PRIVATE ANALYSIS A');
values.set('tradesandbox_history', 'PRIVATE CHART A');
assert.throws(() => applyUnverifiedGuestRestore(guest, privateAccount, p => { savePortfolio(p); }), /cannot replace/);
activatePortfolioOwner('fixture-b');
assert.deepEqual(getAccountPortfolioHistory('fixture-a', 'cycle-1'), []);
recordAccountPortfolioSnapshot('fixture-a', 'cycle-1', guest, today + 1);
assert.deepEqual(getAccountPortfolioHistory('fixture-b', 'cycle-1'), []);
assert.equal(getPortfolio().trades.length, 0, 'switching accounts must immediately hide the previous private records');
assert.equal(values.get('trading_journal_analysis'), undefined);
assert.equal(values.get('tradesandbox_history'), undefined);
assert.equal(saveTradeJournal('server-trade-a', { notes: 'late callback', reasoning: '', emotions: [] }, 'fixture-a'), null);
activatePortfolioOwner('fixture-a');
assert.deepEqual(getAccountPortfolioHistory('fixture-a', 'cycle-1').map(s => s.totalValue), [98100, 98105]);
assert.equal(getPortfolio().trades[0].journal?.notes, 'PRIVATE ACCOUNT A');
// Simulate a browser closing halfway through a prior identity switch.
values.set(PORTFOLIO_SWITCH_KEY, JSON.stringify({ version: 1, previous: 'fixture-a' }));
values.set('tradehq_portfolio', JSON.stringify(guest));
values.set(PORTFOLIO_OWNER_KEY, 'fixture-partial-switch');
assert.equal(getPortfolio().trades.length, 0, 'an unfinished switch is never visible');
activatePortfolioOwner('fixture-a');
assert.equal(getPortfolio().trades[0].journal?.notes, 'PRIVATE ACCOUNT A', 'recovery must use archived bytes before any new archive overwrites them');
assert.equal(values.get(PORTFOLIO_SWITCH_KEY), undefined);
assert.equal(values.get('trading_journal_analysis'), 'PRIVATE ANALYSIS A');
activatePortfolioOwner(null);
assert.deepEqual(getAccountPortfolioHistory('fixture-a', 'cycle-1'), []);
assert.equal(values.get('tradehq_portfolio'), guestBytes, 'sign-out restores the exact guest record');
assert.equal(values.get(PORTFOLIO_OWNER_KEY), undefined);
assert.equal(getPortfolio().trades[0].journal, undefined, 'account journal never appears as guest data');
assert.ok(readPreviousGuestPortfolio(), 'guest undo is restored with the guest session');
assert.equal(executeGuestTrade(asset, 'buy', 1).success, true, 'guest practice still works after sign-out');
const latest = getPortfolio();
saveTradeJournal(guest.trades[0].id, { notes: 'guest-only', reasoning: '', emotions: [] }, null);
assert.equal(getPortfolio().cash, latest.cash, 'late journal attachment preserves a later order cash balance');
assert.equal(getPortfolio().trades.length, 2);
activatePortfolioOwner('fixture-a');
assert.equal(getPortfolio().trades.length, 1);
assert.equal(getPortfolio().trades[0].journal?.notes, 'PRIVATE ACCOUNT A');
// Deny storage while another identity signs in: retain old bytes but hide them.
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
  ...storage, setItem: () => { throw new Error('Fixture: quota exceeded'); },
} });
assert.throws(() => activatePortfolioOwner('fixture-c'), /quota/);
assert.equal(getPortfolio().trades.length, 0);
assert.deepEqual(getPortfolioHistory(), []);
assert.equal(getAnalysis(), null);
assert.equal(savePortfolio(guest), false, 'a failed owner switch must fail closed for writes');
assert.ok(values.get(PORTFOLIO_CACHE_PREFIX + 'fixture-a'));
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });
activatePortfolioOwner('fixture-a');
assert.equal(getPortfolio().trades[0].journal?.notes, 'PRIVATE ACCOUNT A');
// A new tab whose auth does not match the shared storage owner must hide it.
values.set(PORTFOLIO_OWNER_KEY, 'fixture-other-tab');
assert.equal(getPortfolio().trades.length, 0);
assert.deepEqual(getPortfolioHistory(), []);
assert.equal(getAnalysis(), null);
assert.equal(savePortfolio(guest), false);
console.log('PASS account/guest switch, sign-out/sign-in recovery, private journal/chart/undo isolation, restore guard, late notes, failed storage and cross-tab owner mismatch');
