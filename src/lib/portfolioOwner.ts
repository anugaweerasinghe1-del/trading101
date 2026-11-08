/** Isolate account caches from guest practice on shared browsers. These copies
 * are recovery conveniences; only server-recorded orders change an account. */
export const PORTFOLIO_OWNER_KEY = 'tradehq:portfolio-owner';
export const PORTFOLIO_CACHE_PREFIX = 'tradehq:portfolio-session:v1:';
export const PORTFOLIO_SWITCH_KEY = 'tradehq:portfolio-switch:v1';
const KEYS = [
  'tradehq_portfolio', 'tradehq:portfolio-recovery:v1', 'tradehq_portfolio_updated_at',
  'tradehq:balance-migration:v2', 'tradesandbox_history', 'tradehq_last_update',
  'tradehq:guest-import-origin:v1', 'tradehq:guest-restore-undo:v1',
  'tradehq:portfolio-unreadable-original:v1', 'trading_journal_analysis',
  'tradehq_last_loss_time', 'tradesandbox_last_bonus',
] as const;
type Cache = Record<string, string | null>;
let viewOwner: string | null = null;
let pendingGuest: { owner: string; portfolio: string | null; recovery: string | null } | null = null;

export function portfolioViewMatchesOwner(): boolean {
  try { return !localStorage.getItem(PORTFOLIO_SWITCH_KEY) && localStorage.getItem(PORTFOLIO_OWNER_KEY) === viewOwner; }
  catch { return false; }
}
const capture = (): Cache => Object.fromEntries(KEYS.map(key => [key, localStorage.getItem(key)]));
function write(cache: Cache) {
  for (const key of KEYS) {
    const value = cache[key];
    if (typeof value === 'string') localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  }
}
function cached(owner: string | null): Cache {
  const raw = localStorage.getItem(PORTFOLIO_CACHE_PREFIX + (owner ?? 'guest'));
  if (!raw) return {};
  const data = JSON.parse(raw);
  if (!data || data.version !== 1 || !data.values || typeof data.values !== 'object')
    throw new Error('Saved portfolio session is unreadable. Its original copy was preserved.');
  for (const key of KEYS) if (data.values[key] !== null && data.values[key] !== undefined && typeof data.values[key] !== 'string')
    throw new Error('Saved portfolio session is invalid. Its original copy was preserved.');
  return data.values;
}
function recoverInterruptedSwitch() {
  const raw = localStorage.getItem(PORTFOLIO_SWITCH_KEY);
  if (!raw) return;
  const transaction = JSON.parse(raw);
  if (transaction?.version !== 1 || (transaction.previous !== null && typeof transaction.previous !== 'string'))
    throw new Error('Portfolio session recovery is required. Original copies were preserved.');
  const previous = transaction.previous as string | null;
  if (!localStorage.getItem(PORTFOLIO_CACHE_PREFIX + (previous ?? 'guest')))
    throw new Error('Previous portfolio session copy is unavailable.');
  write(cached(previous));
  if (previous) localStorage.setItem(PORTFOLIO_OWNER_KEY, previous);
  else localStorage.removeItem(PORTFOLIO_OWNER_KEY);
  localStorage.removeItem(PORTFOLIO_SWITCH_KEY);
}

/** Set the read boundary before any React auth state or asynchronous RPC work.
 * Archive exact bytes before replacing slots; never discard a private journal. */
export function activatePortfolioOwner(owner: string | null): void {
  const priorView = viewOwner;
  viewOwner = owner;
  recoverInterruptedSwitch();
  const previous = localStorage.getItem(PORTFOLIO_OWNER_KEY);
  if (previous === owner) {
    if (priorView !== owner && typeof window !== 'undefined') window.dispatchEvent(new Event('tradehq:portfolio-updated'));
    return;
  }
  const original = capture();
  const destination = cached(owner);
  const backupKey = PORTFOLIO_CACHE_PREFIX + (previous ?? 'guest');
  const backup = JSON.stringify({ version: 1, values: original });
  localStorage.setItem(backupKey, backup);
  if (localStorage.getItem(backupKey) !== backup) throw new Error('Could not preserve the previous portfolio session.');
  localStorage.setItem(PORTFOLIO_SWITCH_KEY, JSON.stringify({ version: 1, previous }));
  try {
    write(destination);
    if (owner) {
      localStorage.setItem('tradehq:balance-migration:v2', '1');
      localStorage.setItem(PORTFOLIO_OWNER_KEY, owner);
    } else localStorage.removeItem(PORTFOLIO_OWNER_KEY);
    localStorage.removeItem(PORTFOLIO_SWITCH_KEY);
    pendingGuest = owner && !previous ? { owner, portfolio: original.tradehq_portfolio,
      recovery: original['tradehq:portfolio-recovery:v1'] } : null;
  } catch (error) {
    // The archived bytes remain even if storage fails during rollback. Reads
    // stay hidden while the stored owner does not match the current identity.
    try { recoverInterruptedSwitch(); } catch { /* Keep the transaction marker and original archive for the next attempt. */ }
    throw error;
  } finally {
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('tradehq:portfolio-updated'));
  }
}

export function pendingGuestPortfolio(owner: string): unknown {
  if (pendingGuest?.owner !== owner || viewOwner !== owner) return null;
  try { if (pendingGuest.portfolio) return JSON.parse(pendingGuest.portfolio); } catch { /* Try the preserved recovery copy. */ }
  try { return JSON.parse(pendingGuest.recovery ?? 'null')?.portfolio ?? null; } catch { return null; }
}
export function clearPendingGuestPortfolio(owner: string): void {
  if (pendingGuest?.owner === owner) pendingGuest = null;
}
export function portfolioOwnerIs(owner: string | null): boolean {
  return viewOwner === owner && portfolioViewMatchesOwner();
}
