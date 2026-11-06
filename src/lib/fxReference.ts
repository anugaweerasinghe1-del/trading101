/** Informational daily rates only. Never import into execution or valuation. */
export const FX_REFERENCE_PAIRS = {
  eurusd: ['EUR', 'USD'], gbpusd: ['GBP', 'USD'], usdjpy: ['USD', 'JPY'], usdchf: ['USD', 'CHF'],
  audusd: ['AUD', 'USD'], usdcad: ['USD', 'CAD'], nzdusd: ['NZD', 'USD'], eurgbp: ['EUR', 'GBP'],
  eurjpy: ['EUR', 'JPY'], gbpjpy: ['GBP', 'JPY'], usdhkd: ['USD', 'HKD'], usdsgd: ['USD', 'SGD'],
  usdmxn: ['USD', 'MXN'], usdzar: ['USD', 'ZAR'], usdtry: ['USD', 'TRY'],
} as const;
export type ReferencePair = keyof typeof FX_REFERENCE_PAIRS;
export type DailyFxRate = { rate: number; date: string };
export type FxReferenceBatch = {
  kind: 'daily_fx_reference'; source: 'Frankfurter blended daily reference'; requestedDate: string;
  rates: Record<ReferencePair, DailyFxRate | null>;
};
const DAY = 86400000;
function dateTime(value: unknown): number {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return NaN;
  const parsed = Date.parse(value + 'T00:00:00Z');
  return Number.isFinite(parsed) && new Date(parsed).toISOString().slice(0, 10) === value ? parsed : NaN;
}
export function referenceRequestDate(now = Date.now()): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Colombo', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const get = (type: string) => parts.find(part => part.type === type)!.value;
  const date = new Date(Date.UTC(Number(get('year')), Number(get('month')) - 1, Number(get('day'))) - DAY);
  while ([0, 6].includes(date.getUTCDay())) date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}
const positive = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0 && value < 1e9;
const validDate = (value: unknown, requested: string) => {
  const date = dateTime(value), end = dateTime(requested);
  return Number.isFinite(date) && Number.isFinite(end) && date <= end && end - date <= 7 * DAY;
};
export function buildFxReferenceBatch(rows: unknown, requestedDate: string): FxReferenceBatch | null {
  if (!Array.isArray(rows) || rows.length > 100 || !Number.isFinite(dateTime(requestedDate))) return null;
  const currencies = new Set(Object.values(FX_REFERENCE_PAIRS).flat().filter(code => code !== 'USD'));
  const quotes = new Map<string, DailyFxRate>(), seen = new Set<string>();
  for (const row of rows) {
    if (!row || row.base !== 'USD' || !currencies.has(row.quote)) continue;
    if (seen.has(row.quote)) { quotes.delete(row.quote); continue; }
    seen.add(row.quote);
    if (positive(row.rate) && validDate(row.date, requestedDate)) quotes.set(row.quote, { rate: row.rate, date: row.date });
  }
  const rates = {} as FxReferenceBatch['rates'];
  for (const [pair, [base, quote]] of Object.entries(FX_REFERENCE_PAIRS)) {
    const from = base === 'USD' ? null : quotes.get(base), to = quote === 'USD' ? null : quotes.get(quote);
    const date = from?.date ?? to?.date;
    const available = (base === 'USD' || from) && (quote === 'USD' || to) && (!from || !to || from.date === to.date);
    const rate = (to?.rate ?? 1) / (from?.rate ?? 1);
    rates[pair as ReferencePair] = available && date && positive(rate) ? { rate, date } : null;
  }
  return Object.values(rates).some(Boolean) ? { kind: 'daily_fx_reference', source: 'Frankfurter blended daily reference', requestedDate, rates } : null;
}
export function validateFxReferenceBatch(value: unknown, now = Date.now()): FxReferenceBatch | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as FxReferenceBatch;
  const latest = referenceRequestDate(now);
  if (item.kind !== 'daily_fx_reference' || item.source !== 'Frankfurter blended daily reference' ||
      !validDate(item.requestedDate, latest) || !item.rates || typeof item.rates !== 'object') return null;
  const rates = {} as FxReferenceBatch['rates'];
  for (const pair of Object.keys(FX_REFERENCE_PAIRS) as ReferencePair[]) {
    const row = item.rates[pair];
    rates[pair] = row && positive(row.rate) && validDate(row.date, item.requestedDate) && validDate(row.date, latest) ? { rate: row.rate, date: row.date } : null;
  }
  return Object.values(rates).some(Boolean) ? { kind: item.kind, source: item.source, requestedDate: item.requestedDate, rates } : null;
}
