import { coinQuote, stockQuote, forexQuote } from "./providerQuotes.ts";
// Fifty current crypto instruments plus legacy MATIC, retained without rewriting holdings.
export const CRYPTO_ID_MAP: Record<string, string> = {
  'btc': 'bitcoin', 'eth': 'ethereum', 'sol': 'solana', 'bnb': 'binancecoin',
  'xrp': 'ripple', 'ada': 'cardano', 'doge': 'dogecoin', 'avax': 'avalanche-2',
  'dot': 'polkadot', 'matic': 'matic-network', 'link': 'chainlink', 'ltc': 'litecoin',
  'shib': 'shiba-inu', 'uni': 'uniswap', 'atom': 'cosmos', 'algo': 'algorand',
  'ftm': 'fantom', 'near': 'near', 'icp': 'internet-computer', 'xlm': 'stellar',
  'vet': 'vechain', 'fil': 'filecoin', 'hbar': 'hedera-hashgraph', 'apt': 'aptos',
  'arb': 'arbitrum', 'op': 'optimism', 'inj': 'injective-protocol', 'sui': 'sui',
  'sei': 'sei-network', 'tia': 'celestia',
  'usdc': 'usd-coin',
  'usdt': 'tether',
  'dai': 'dai',
  'trx': 'tron',
  'bch': 'bitcoin-cash',
  'ton': 'the-open-network',
  'etc': 'ethereum-classic',
  'xmr': 'monero',
  'aave': 'aave',
  'grt': 'the-graph',
  'ldo': 'lido-dao',
  'rune': 'thorchain',
  'kas': 'kaspa',
  'stx': 'blockstack',
  'imx': 'immutable-x',
  'render': 'render-token',
  'pepe': 'pepe',
  'bonk': 'bonk',
  'wld': 'worldcoin-wld',
  'pol': 'polygon-ecosystem-token',
  'tao': 'bittensor',
};

// Stock/ETF symbols — all mapped
export const STOCK_SYMBOLS: Record<string, string> = {
  // Tech mega-cap
  'aapl': 'AAPL', 'msft': 'MSFT', 'googl': 'GOOGL', 'amzn': 'AMZN', 'nvda': 'NVDA',
  'tsla': 'TSLA', 'meta': 'META', 'nflx': 'NFLX', 'amd': 'AMD', 'crm': 'CRM',
  'intc': 'INTC', 'orcl': 'ORCL', 'adbe': 'ADBE', 'csco': 'CSCO', 'avgo': 'AVGO',
  'txn': 'TXN', 'qcom': 'QCOM', 'now': 'NOW', 'ibm': 'IBM',
  // Tech growth
  'uber': 'UBER', 'shop': 'SHOP', 'snow': 'SNOW', 'pltr': 'PLTR', 'coin': 'COIN',
  'spot': 'SPOT', 'sq': 'SQ', 'pypl': 'PYPL', 'twlo': 'TWLO', 'docu': 'DOCU',
  'zm': 'ZM', 'roku': 'ROKU', 'net': 'NET', 'ddog': 'DDOG', 'mdb': 'MDB',
  'crwd': 'CRWD', 'zs': 'ZS', 'panw': 'PANW', 'okta': 'OKTA', 'wday': 'WDAY', 'veev': 'VEEV',
  // Finance
  'jpm': 'JPM', 'v': 'V', 'ma': 'MA', 'bac': 'BAC', 'wfc': 'WFC', 'gs': 'GS', 'ms': 'MS',
  // Healthcare
  'unh': 'UNH', 'jnj': 'JNJ', 'pfe': 'PFE', 'mrna': 'MRNA', 'abbv': 'ABBV', 'lly': 'LLY',
  // Consumer
  'wmt': 'WMT', 'cost': 'COST', 'hd': 'HD', 'low': 'LOW', 'tgt': 'TGT',
  'sbux': 'SBUX', 'mcd': 'MCD', 'ko': 'KO', 'pep': 'PEP', 'dis': 'DIS', 'nke': 'NKE',
  // Energy/Industrial
  'xom': 'XOM', 'cvx': 'CVX', 'ba': 'BA', 'cat': 'CAT', 'de': 'DE',
  // ETFs
  'spy': 'SPY', 'qqq': 'QQQ', 'iwm': 'IWM', 'dia': 'DIA', 'voo': 'VOO', 'arkk': 'ARKK',
  'vti': 'VTI', 'ivv': 'IVV', 'agg': 'AGG', 'ief': 'IEF', 'tlt': 'TLT',
  'gld': 'GLD', 'slv': 'SLV', 'uso': 'USO',
  'xlf': 'XLF', 'xlk': 'XLK', 'xle': 'XLE', 'xlv': 'XLV', 'smh': 'SMH', 'soxx': 'SOXX',
};

// Forex pairs — all 15
export const FOREX_PAIRS: Record<string, { from: string; to: string }> = {
  'eurusd': { from: 'EUR', to: 'USD' }, 'gbpusd': { from: 'GBP', to: 'USD' },
  'usdjpy': { from: 'USD', to: 'JPY' }, 'usdchf': { from: 'USD', to: 'CHF' },
  'audusd': { from: 'AUD', to: 'USD' }, 'usdcad': { from: 'USD', to: 'CAD' },
  'nzdusd': { from: 'NZD', to: 'USD' }, 'eurgbp': { from: 'EUR', to: 'GBP' },
  'eurjpy': { from: 'EUR', to: 'JPY' }, 'gbpjpy': { from: 'GBP', to: 'JPY' },
  'usdhkd': { from: 'USD', to: 'HKD' }, 'usdsgd': { from: 'USD', to: 'SGD' },
  'usdmxn': { from: 'USD', to: 'MXN' }, 'usdzar': { from: 'USD', to: 'ZAR' },
  'usdtry': { from: 'USD', to: 'TRY' },
};

// Commodity proxies on CoinGecko
export const COMMODITY_MAP: Record<string, string> = {
  'gold': 'pax-gold',
  'silver': 'silver-token',
};

export interface DataProvenance { status: 'realtime' | 'delayed' | 'previous_close' | 'proxy' | 'mixed' | 'simulated' | 'provider'; provider: string; fetchedAt: string; observedAt?: string | null; fields?: Record<string,string>; note?: string; }
export interface MarketData { price: number; change24h: number | null; changePercent24h: number | null; high24h: number | null; low24h: number | null; volume24h: number | null; marketCap?: number; lastUpdated: string | null; source: 'live' | 'simulated'; provenance: DataProvenance; }

export interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Batch crypto via CoinGecko simple/price (up to 250 IDs per call, free)
export async function fetchCryptoData(assetId: string): Promise<MarketData | null> {
  const coinId = CRYPTO_ID_MAP[assetId];
  if (!coinId) return null;

  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_last_updated_at=true&include_market_cap=true`,
      { headers: { 'Accept': 'application/json' }, signal: AbortSignal.timeout(12000) }
    );

    if (!response.ok) return null;
    const data = await response.json();
    const coin = data[coinId];
    if (!coin || !coin.usd) return null;

    return coinQuote(coin);
  } catch (error) {
    console.error(`Crypto fetch error ${assetId}:`, error);
    return null;
  }
}

export async function fetchCryptoCandles(assetId: string, days: number = 1): Promise<CandleData[]> {
  const coinId = CRYPTO_ID_MAP[assetId];
  if (!coinId) return [];

  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coinId}/ohlc?vs_currency=usd&days=${days}`,
      { headers: { 'Accept': 'application/json' }, signal: AbortSignal.timeout(12000) }
    );
    if (!response.ok) return [];
    const data = await response.json();
    return data.map((c: number[]) => ({
      time: new Date(c[0]).toISOString(),
      open: c[1], high: c[2], low: c[3], close: c[4], volume: 0,
    }));
  } catch { return []; }
}

/** A placeholder demo key is not an authenticated provider budget. Skip unsupported upstream requests. */
export function configuredAlphaVantageKey(value: string | null | undefined): string | null {
  const key = value?.trim();
  return key && key.toLowerCase() !== 'demo' ? key : null;
}

export async function fetchStockData(assetId: string): Promise<MarketData | null> {
  const symbol = STOCK_SYMBOLS[assetId];
  if (!symbol) return null;

  const polygonKey = Deno.env.get('POLYGON_API_KEY');
  if (polygonKey) {
    try {
      const response = await fetch(
        `https://api.polygon.io/v2/aggs/ticker/${symbol}/prev?apiKey=${polygonKey}`,
        { headers: { 'Accept': 'application/json' }, signal: AbortSignal.timeout(12000) }
      );
      if (response.ok) {
        const data = await response.json();
        if (data.results?.[0]) {
          const r = data.results[0];
          return stockQuote(r, 'Polygon');
        }
      }
    } catch (e) { console.warn(`Polygon quote unavailable: ${symbol}`); }
  }

  // Alpha Vantage fallback
  const avKey = configuredAlphaVantageKey(Deno.env.get('ALPHA_VANTAGE_API_KEY'));
  if (!avKey) return null;
  try {
    const response = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${avKey}`,
      { headers: { 'Accept': 'application/json' }, signal: AbortSignal.timeout(12000) }
    );
    if (response.ok) {
      const data = await response.json();
      const q = data['Global Quote'];
      if (q?.['05. price']) {
        return stockQuote(q, 'Alpha Vantage');
      }
    }
  } catch (e) { console.warn(`Alpha Vantage quote unavailable: ${symbol}`); }

  return null;
}

export async function fetchForexData(assetId: string): Promise<MarketData | null> {
  const pair = FOREX_PAIRS[assetId];
  if (!pair) return null;

  const avKey = configuredAlphaVantageKey(Deno.env.get('ALPHA_VANTAGE_API_KEY'));
  if (!avKey) return null;
  try {
    const response = await fetch(
      `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${pair.from}&to_currency=${pair.to}&apikey=${avKey}`,
      { headers: { 'Accept': 'application/json' }, signal: AbortSignal.timeout(12000) }
    );
    if (response.ok) {
      const data = await response.json();
      const rate = data['Realtime Currency Exchange Rate'];
      if (rate?.['5. Exchange Rate']) {
        return forexQuote(rate);
      }
    }
  } catch (e) { console.warn(`Forex quote unavailable: ${assetId}`); }
  return null;
}

